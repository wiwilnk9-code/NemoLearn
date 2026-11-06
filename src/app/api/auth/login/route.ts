import { NextResponse } from "next/server";
import { UserRepository, SystemLogRepository } from "@/lib/db";
import { createSessionToken, COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth/server";
import { verifyPassword, sanitizeUserOutput } from "@/lib/auth/password";
import { User, UserRole, AdminPermission } from "@/types/user";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, userId } = body;

    let targetUser: User | null = null;
    let authValidated = false;

    // 1. Alur Autentikasi Produksi: Email & Password
    if (email) {
      const normalizedEmail = String(email).trim().toLowerCase();

      if (!password) {
        return NextResponse.json(
          { success: false, error: "Kata sandi wajib diisi." },
          { status: 400 }
        );
      }

      // Cari user lokal di database
      targetUser = UserRepository.getByEmail(normalizedEmail);

      // Pemeriksaan Akun Ditangguhkan (Suspended Guard)
      if (targetUser && targetUser.status === "suspended") {
        SystemLogRepository.log({
          level: "security",
          action: "AUTH_LOGIN_BLOCKED",
          actorId: targetUser.id,
          actorEmail: targetUser.email,
          actorRole: targetUser.role,
          details: `Login ditolak: akun '${targetUser.email}' berstatus suspended.`,
          status: "BLOCKED",
        });

        return NextResponse.json(
          {
            success: false,
            error: "Akun ini telah dinonaktifkan (suspended) oleh Administrator. Silakan hubungi pengelola platform.",
          },
          { status: 403 }
        );
      }

      // Verifikasi via Supabase Auth (signInWithPassword)
      if (process.env.NODE_ENV !== "test") {
        try {
          const { data: authData, error: authError } = await supabaseServer.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });

          if (!authError && authData?.user) {
            authValidated = true;
            const authAppRole: UserRole | undefined = authData.user.app_metadata?.role;
            let dbUser: any = null;

            try {
              const { data } = await supabaseServer
                .from("users")
                .select("*")
                .eq("email", normalizedEmail)
                .maybeSingle();
              dbUser = data;
            } catch {}

            // Authoritative Role Resolution & Anti-Demotion Reconciliation
            let resolvedRole: UserRole = "pelajar";
            if (authAppRole === "owner" || dbUser?.role === "owner" || targetUser?.role === "owner") {
              resolvedRole = "owner";
            } else if (authAppRole === "admin" || dbUser?.role === "admin" || targetUser?.role === "admin") {
              resolvedRole = "admin";
            } else if (authAppRole === "guru" || dbUser?.role === "guru" || targetUser?.role === "guru") {
              resolvedRole = "guru";
            } else if (authAppRole === "moderator" || dbUser?.role === "moderator" || targetUser?.role === "moderator") {
              resolvedRole = "moderator";
            } else if (dbUser?.role) {
              resolvedRole = dbUser.role;
            } else if (targetUser?.role) {
              resolvedRole = targetUser.role;
            }

            const ALL_ADMIN_PERMISSION_IDS: AdminPermission[] = [
              "manage_users",
              "manage_questions",
              "manage_sessions",
              "view_analytics",
              "manage_ai",
              "manage_settings",
              "view_audit_logs",
            ];

            const resolvedPermissions =
              resolvedRole === "owner"
                ? ALL_ADMIN_PERMISSION_IDS
                : resolvedRole === "admin"
                ? (targetUser?.permissions && targetUser.permissions.length > 0
                    ? targetUser.permissions
                    : dbUser?.permissions || [
                        "manage_users",
                        "manage_questions",
                        "manage_sessions",
                        "view_analytics",
                        "view_audit_logs",
                      ])
                : [];

            if (dbUser) {
              targetUser = {
                id: dbUser.id,
                authProviderId: dbUser.auth_provider_id || authData.user.id,
                email: dbUser.email,
                displayName: dbUser.display_name,
                role: resolvedRole,
                school: dbUser.school || undefined,
                gender: dbUser.gender || undefined,
                avatarUrl: dbUser.avatar_url || undefined,
                status: dbUser.status,
                verificationStatus: dbUser.verification_status,
                nuptk: dbUser.nuptk || undefined,
                subject: dbUser.subject || undefined,
                portfolioUrl: dbUser.portfolio_url || undefined,
                verificationNote: dbUser.verification_note || undefined,
                permissions: resolvedPermissions,
                passwordHash: dbUser.password_hash || undefined,
                emailVerified: Boolean(dbUser.email_verified || authData.user.email_confirmed_at),
                authProvider: dbUser.auth_provider || "email",
                createdAt: dbUser.created_at,
                lastActiveAt: new Date().toISOString(),
                tosVersion: dbUser.tos_version || "2026.11",
                privacyVersion: dbUser.privacy_version || "2026.11",
              };
              UserRepository.create(targetUser);
            } else if (!targetUser) {
              const meta = authData.user.user_metadata || {};
              const newUser: User = {
                id: authData.user.id,
                authProviderId: authData.user.id,
                email: normalizedEmail,
                displayName: meta.display_name || meta.name || normalizedEmail.split("@")[0],
                role: resolvedRole,
                permissions: resolvedPermissions,
                status: "active",
                verificationStatus: "verified",
                emailVerified: Boolean(authData.user.email_confirmed_at || authData.user.confirmed_at),
                authProvider: "email",
                createdAt: authData.user.created_at || new Date().toISOString(),
                lastActiveAt: new Date().toISOString(),
              };
              targetUser = UserRepository.create(newUser);
            } else {
              targetUser.role = resolvedRole;
              targetUser.permissions = resolvedPermissions;
              UserRepository.update(targetUser.id, {
                authProviderId: authData.user.id,
                role: resolvedRole,
                permissions: resolvedPermissions,
                emailVerified: Boolean(authData.user.email_confirmed_at || authData.user.confirmed_at),
              });
            }

            try {
              await supabaseServer.from("users").upsert({
                id: targetUser.id,
                auth_provider_id: authData.user.id,
                email: targetUser.email,
                display_name: targetUser.displayName,
                role: resolvedRole,
                permissions: resolvedPermissions,
                email_verified: Boolean(targetUser.emailVerified),
                status: targetUser.status || "active",
                last_active_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            } catch {}

            if (resolvedRole === "owner" || resolvedRole === "admin") {
              try {
                await supabaseServer.auth.admin.updateUserById(authData.user.id, {
                  app_metadata: { ...authData.user.app_metadata, role: resolvedRole },
                });
              } catch {}
            }
          }
        } catch (sbErr) {
          console.warn("[Login] Supabase signInWithPassword exception:", sbErr);
        }
      }

      // Fallback validasi kriptografis hash lokal (untuk akun seed / dev / offline test)
      if (!authValidated && targetUser && targetUser.passwordHash) {
        const isPasswordValid = verifyPassword(password, targetUser.passwordHash);
        if (isPasswordValid) {
          authValidated = true;

          // Provision user ke Supabase Auth jika belum terdaftar di Auth instance
          if (process.env.NODE_ENV !== "test") {
            try {
              supabaseServer.auth.admin.createUser({
                email: normalizedEmail,
                password,
                email_confirm: true,
                user_metadata: {
                  display_name: targetUser.displayName,
                  role: targetUser.role,
                },
              }).catch(() => {});
            } catch {}
          }
        }
      }

      if (!authValidated || !targetUser) {
        if (targetUser) {
          SystemLogRepository.log({
            level: "warn",
            action: "AUTH_LOGIN_FAILED",
            actorId: targetUser.id,
            actorEmail: targetUser.email,
            actorRole: targetUser.role,
            details: `Percobaan login gagal: kata sandi tidak cocok untuk akun '${targetUser.email}'.`,
            status: "GAGAL",
          });
        }

        return NextResponse.json(
          { success: false, error: "Alamat email atau kata sandi yang Anda masukkan salah." },
          { status: 401 }
        );
      }
    }
    // 2. Alur Pengujian Unit Otomatis (Strictly Test Environment Only)
    else if (userId) {
      if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
        SystemLogRepository.log({
          level: "security",
          action: "AUTH_DEMO_BLOCKED",
          actorId: String(userId),
          actorEmail: "demo-attempt@blocked.local",
          details: `Percobaan bypass otentikasi menggunakan ID ditolak di lingkungan produksi. Akses demo telah dinonaktifkan secara permanen.`,
          status: "BLOCKED",
        });

        return NextResponse.json(
          {
            success: false,
            error: "Di lingkungan produksi, otentikasi wajib menggunakan alamat email dan kata sandi terdaftar. Akses demo telah dinonaktifkan secara permanen.",
          },
          { status: 400 }
        );
      }

      if (process.env.NODE_ENV !== "test") {
        SystemLogRepository.log({
          level: "security",
          action: "AUTH_DEMO_BLOCKED",
          actorId: String(userId),
          actorEmail: "demo-attempt@blocked.local",
          details: `Percobaan bypass otentikasi menggunakan ID ditolak. Akses demo telah dinonaktifkan secara permanen.`,
          status: "BLOCKED",
        });

        return NextResponse.json(
          {
            success: false,
            error: "Akses demo atau bypass ID telah dinonaktifkan secara permanen. Otentikasi wajib menggunakan alamat email dan kata sandi terdaftar.",
          },
          { status: 403 }
        );
      }
      targetUser = UserRepository.getById(String(userId).trim());
      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: `Pengguna dengan ID '${userId}' tidak ditemukan.` },
          { status: 404 }
        );
      }

      if (password && targetUser.passwordHash) {
        const isPasswordValid = verifyPassword(password, targetUser.passwordHash);
        if (!isPasswordValid) {
          return NextResponse.json(
            { success: false, error: "Kata sandi tidak sesuai." },
            { status: 401 }
          );
        }
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Alamat email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    // 3. Pemeriksaan Akun Ditangguhkan (Suspended Guard)
    if (targetUser.status === "suspended") {
      SystemLogRepository.log({
        level: "security",
        action: "AUTH_LOGIN_BLOCKED",
        actorId: targetUser.id,
        actorEmail: targetUser.email,
        actorRole: targetUser.role,
        details: `Login ditolak: akun '${targetUser.email}' berstatus suspended.`,
        status: "BLOCKED",
      });

      return NextResponse.json(
        {
          success: false,
          error: "Akun ini telah dinonaktifkan (suspended) oleh Administrator. Silakan hubungi pengelola platform.",
        },
        { status: 403 }
      );
    }

    // 4. Perbarui Waktu Aktivitas Terakhir
    UserRepository.update(targetUser.id, {
      lastActiveAt: new Date().toISOString(),
    });

    // 5. Terbitkan Token Sesi Kriptografis HMAC SHA-256
    const token = createSessionToken(targetUser);
    const sanitized = sanitizeUserOutput(targetUser);

    const response = NextResponse.json({
      success: true,
      user: sanitized,
      emailVerified: Boolean(targetUser.emailVerified),
    });

    // 6. Tanam Cookie Sesi HTTP-Only & Secure
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      maxAge: SESSION_MAX_AGE,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // Bersihkan marker logout eksplisit jika ada
    response.cookies.delete("nemo_logged_out");

    // 7. Catat Audit Trail Sukses
    SystemLogRepository.log({
      level: "info",
      action: "AUTH_LOGIN_SUCCESS",
      actorId: targetUser.id,
      actorEmail: targetUser.email,
      actorName: targetUser.displayName,
      actorRole: targetUser.role,
      details: `Login berhasil untuk akun '${targetUser.displayName}' (${targetUser.role}).`,
      status: "SUKSES",
    });

    return response;
  } catch (err: any) {
    console.error("[/api/auth/login Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memproses autentikasi sesi." },
      { status: 500 }
    );
  }
}
