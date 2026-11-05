import { NextResponse } from "next/server";
import { UserRepository, SystemLogRepository } from "@/lib/db";
import { createSessionToken, COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth/server";
import { verifyPassword, sanitizeUserOutput } from "@/lib/auth/password";
import { User } from "@/types/user";
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
            // Jika user lokal belum ada (misal didaftarkan langsung via Supabase), inisialisasi user lokal
            if (!targetUser) {
              const meta = authData.user.user_metadata || {};
              const newUser: User = {
                id: authData.user.id,
                authProviderId: authData.user.id,
                email: normalizedEmail,
                displayName: meta.display_name || meta.name || normalizedEmail.split("@")[0],
                role: "pelajar",
                status: "active",
                verificationStatus: "verified",
                emailVerified: Boolean(authData.user.email_confirmed_at || authData.user.confirmed_at),
                authProvider: "email",
                createdAt: authData.user.created_at || new Date().toISOString(),
                lastActiveAt: new Date().toISOString(),
              };
              targetUser = UserRepository.create(newUser);
            } else if (!targetUser.authProviderId) {
              UserRepository.update(targetUser.id, {
                authProviderId: authData.user.id,
                emailVerified: Boolean(authData.user.email_confirmed_at || authData.user.confirmed_at),
              });
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
    // 2. Alur Pengujian / Internal (userId)
    else if (userId) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          {
            success: false,
            error: "Di lingkungan produksi, otentikasi wajib menggunakan alamat email dan kata sandi terdaftar.",
          },
          { status: 400 }
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
