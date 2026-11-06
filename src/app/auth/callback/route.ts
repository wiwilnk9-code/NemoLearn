import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseServer } from "@/lib/supabase/server";
import { UserRepository, SystemLogRepository } from "@/lib/db";
import { createSessionToken, COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth/server";
import { User, UserRole, AdminPermission } from "@/types/user";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const next = requestUrl.searchParams.get("next");

  // 1. Penanganan Error dari OAuth Provider / Supabase
  if (error) {
    console.warn("[OAuth Callback] Received error from provider:", error, errorDescription);

    // Kasus 1: Pengguna membatalkan login di halaman Google
    if (error === "access_denied" || error.toLowerCase().includes("cancelled") || error.toLowerCase().includes("denied")) {
      return NextResponse.redirect(new URL("/login?error=cancelled", req.url));
    }

    // Kasus 2: Redirect URI Mismatch
    if (
      error.toLowerCase().includes("redirect_uri_mismatch") ||
      errorDescription?.toLowerCase().includes("redirect_uri_mismatch")
    ) {
      return NextResponse.redirect(new URL("/login?error=redirect_mismatch", req.url));
    }

    // Kasus 3: Provider belum aktif
    if (
      error.toLowerCase().includes("unsupported_provider") ||
      errorDescription?.toLowerCase().includes("not enabled")
    ) {
      return NextResponse.redirect(new URL("/login?error=provider_disabled", req.url));
    }

    // Error umum lainnya
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("error", errorDescription || error);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Jika kode otorisasi tidak ditemukan
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", req.url));
  }

  try {
    // 3. Menukarkan Authorization Code menjadi Session via PKCE Flow (@supabase/ssr)
    const cookieQueue: Array<{ name: string; value: string; options: any }> = [];

    const supabase = createServerSupabaseClient({
      getAll() {
        if (typeof (req as any).cookies?.getAll === "function") {
          const all = (req as any).cookies.getAll();
          if (all && all.length > 0) return all;
        }
        const cookieHeader = req.headers.get("cookie");
        if (!cookieHeader) return [];
        return cookieHeader
          .split(";")
          .map((part) => {
            const [rawKey, ...rawVal] = part.trim().split("=");
            return {
              name: decodeURIComponent(rawKey || ""),
              value: decodeURIComponent(rawVal.join("=") || ""),
            };
          })
          .filter((c) => Boolean(c.name));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach((c) => {
          try {
            (req as any).cookies?.set?.(c.name, c.value);
          } catch {}
          cookieQueue.push(c);
        });
      },
    });

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data?.user) {
      console.error("[OAuth Callback] Failed to exchange code for session:", exchangeError?.message);
      const redirectUrl = new URL("/login", req.url);
      redirectUrl.searchParams.set("error", exchangeError?.message || "Gagal memproses sesi login Google.");
      const errRes = NextResponse.redirect(redirectUrl);
      cookieQueue.forEach(({ name, value, options }) => {
        errRes.cookies.set(name, value, options);
      });
      return errRes;
    }

    const authUser = data.user;
    const rawEmail = authUser.email;

    if (!rawEmail) {
      return NextResponse.redirect(
        new URL("/login?error=Email tidak ditemukan pada profil Google Anda.", req.url)
      );
    }

    const normalizedEmail = rawEmail.toLowerCase().trim();
    const meta = authUser.user_metadata || {};
    const displayName =
      meta.full_name || meta.name || meta.given_name || normalizedEmail.split("@")[0];
    const avatarUrl = meta.avatar_url || meta.picture || null;

    // 4. Authoritative Role Resolution across Supabase Auth & PostgreSQL:
    // Baca app_metadata.role (Supabase Auth) dan public.users.role (PostgreSQL)
    const authAppRole: UserRole | undefined = authUser.app_metadata?.role;
    let dbUser: any = null;

    if (process.env.NODE_ENV !== "test") {
      try {
        const { data } = await supabaseServer
          .from("users")
          .select("*")
          .eq("email", normalizedEmail)
          .maybeSingle();
        dbUser = data;
      } catch (dbErr) {
        console.warn("[OAuth Callback] Supabase PostgreSQL direct lookup fallback:", dbErr);
      }
    }

    let targetUser: User | null = UserRepository.getByEmail(normalizedEmail);

    if (dbUser && !targetUser) {
      targetUser = {
        id: dbUser.id,
        authProviderId: dbUser.auth_provider_id || authUser.id,
        email: dbUser.email,
        displayName: dbUser.display_name,
        role: dbUser.role,
        school: dbUser.school || undefined,
        gender: dbUser.gender || undefined,
        avatarUrl: dbUser.avatar_url || undefined,
        status: dbUser.status,
        verificationStatus: dbUser.verification_status,
        nuptk: dbUser.nuptk || undefined,
        subject: dbUser.subject || undefined,
        portfolioUrl: dbUser.portfolio_url || undefined,
        verificationNote: dbUser.verification_note || undefined,
        permissions: dbUser.permissions || [],
        passwordHash: dbUser.password_hash || undefined,
        emailVerified: Boolean(dbUser.email_verified),
        authProvider: dbUser.auth_provider || "google",
        createdAt: dbUser.created_at,
        lastActiveAt: new Date().toISOString(),
        tosVersion: dbUser.tos_version || "2026.11",
        privacyVersion: dbUser.privacy_version || "2026.11",
      };
      UserRepository.create(targetUser);
    }

    // Role Hierarchy & Anti-Demotion Reconciliation:
    // Jika salah satu sumber menetapkan peran administratif (owner, admin, guru),
    // jangan pernah turunkan ke 'pelajar'!
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

    // 5. Perilaku Account Linking atau Registrasi:
    if (targetUser) {
      // Suspended Guard: Jangan biarkan akun suspended masuk melalui OAuth
      if (targetUser.status === "suspended") {
        SystemLogRepository.log({
          level: "security",
          action: "AUTH_OAUTH_LOGIN_BLOCKED",
          actorId: targetUser.id,
          actorEmail: targetUser.email,
          actorRole: targetUser.role,
          details: `Percobaan login OAuth diblokir: akun '${targetUser.email}' ditangguhkan (suspended).`,
          status: "BLOCKED",
        });
        return NextResponse.redirect(new URL("/login?error=suspended", req.url));
      }

      targetUser.role = resolvedRole;
      targetUser.permissions = resolvedPermissions;

      UserRepository.update(targetUser.id, {
        authProviderId: authUser.id,
        emailVerified: true,
        role: resolvedRole,
        permissions: resolvedPermissions,
        avatarUrl: targetUser.avatarUrl || avatarUrl || undefined,
        lastActiveAt: new Date().toISOString(),
      });

      SystemLogRepository.log({
        level: "info",
        action: "AUTH_OAUTH_ACCOUNT_LINKED",
        actorId: targetUser.id,
        actorEmail: targetUser.email,
        actorName: targetUser.displayName,
        actorRole: resolvedRole,
        details: `Akun terdaftar '${targetUser.email}' berhasil ditautkan ke Google OAuth (Role: ${resolvedRole}).`,
        status: "SUKSES",
      });
    } else {
      // 6. Pengguna Baru: Registrasi otomatis dengan peran terverifikasi
      const nowIso = new Date().toISOString();

      const newUser: User = {
        id: authUser.id,
        authProviderId: authUser.id,
        email: normalizedEmail,
        displayName: String(displayName).trim(),
        role: resolvedRole,
        permissions: resolvedPermissions,
        avatarUrl: avatarUrl || undefined,
        status: "active",
        verificationStatus: "verified",
        emailVerified: true,
        authProvider: "google",
        createdAt: nowIso,
        lastActiveAt: nowIso,
        tosAcceptedAt: nowIso,
        privacyAcceptedAt: nowIso,
        tosVersion: "2026.11",
        privacyVersion: "2026.11",
      };

      targetUser = UserRepository.create(newUser);

      SystemLogRepository.log({
        level: "info",
        action: "AUTH_OAUTH_REGISTER",
        actorId: targetUser.id,
        actorEmail: targetUser.email,
        actorName: targetUser.displayName,
        actorRole: resolvedRole,
        details: `Pengguna baru mendaftar via Google OAuth (${targetUser.email}) dengan peran '${resolvedRole}'.`,
        status: "SUKSES",
      });
    }

    // Sinkronkan peran ke database PostgreSQL (public.users)
    if (process.env.NODE_ENV !== "test") {
      try {
        await supabaseServer.from("users").upsert({
          id: targetUser.id,
          auth_provider_id: authUser.id,
          email: targetUser.email,
          display_name: targetUser.displayName,
          role: resolvedRole,
          permissions: resolvedPermissions,
          email_verified: true,
          status: targetUser.status || "active",
          avatar_url: targetUser.avatarUrl || avatarUrl || null,
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (upsertErr) {
        console.warn("[OAuth Callback] public.users upsert warning:", upsertErr);
      }
    }

    // Sinkronkan peran ke app_metadata Supabase Auth (Otorisasi Server-Side & RLS)
    if (process.env.NODE_ENV !== "test") {
      try {
        await supabaseServer.auth.admin.updateUserById(authUser.id, {
          app_metadata: { ...authUser.app_metadata, role: resolvedRole },
        });
      } catch (metaErr) {
        // Fallback jika service role admin belum aktif
      }
    }

    // 6. Terbitkan Token Sesi Kriptografis HMAC SHA-256
    const sessionToken = createSessionToken(targetUser);

    // 7. Tentukan Target Redirect yang Tepat
    let redirectPath = "/";
    if (targetUser.role === "admin" || targetUser.role === "owner") {
      redirectPath = "/admin";
    } else if (next && next.startsWith("/") && !next.startsWith("//")) {
      redirectPath = next;
    }

    const response = NextResponse.redirect(new URL(redirectPath, req.url));

    // Pasang cookie sesi Supabase Auth dari exchange PKCE (@supabase/ssr)
    cookieQueue.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    // 8. Tanam Cookie Sesi HTTP-Only & Secure
    response.cookies.set({
      name: COOKIE_NAME,
      value: sessionToken,
      maxAge: SESSION_MAX_AGE,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // Hapus marker logout
    response.cookies.delete("nemo_logged_out");

    SystemLogRepository.log({
      level: "info",
      action: "AUTH_OAUTH_LOGIN_SUCCESS",
      actorId: targetUser.id,
      actorEmail: targetUser.email,
      actorName: targetUser.displayName,
      actorRole: targetUser.role,
      details: `Login Google OAuth berhasil untuk ${targetUser.email} (Role: ${targetUser.role}). Dialihkan ke ${redirectPath}.`,
      status: "SUKSES",
    });

    return response;
  } catch (err: any) {
    console.error("[OAuth Callback Exception]:", err);
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("error", "Terjadi kesalahan internal saat memproses autentikasi Google.");
    return NextResponse.redirect(redirectUrl);
  }
}
