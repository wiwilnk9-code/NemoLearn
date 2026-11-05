import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseServer } from "@/lib/supabase/server";
import { UserRepository, SystemLogRepository } from "@/lib/db";
import { createSessionToken, COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth/server";
import { User } from "@/types/user";

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

    let targetUser: User | null = UserRepository.getByEmail(normalizedEmail);

    // Jika belum ditemukan di cache in-memory, periksa langsung ke database Supabase PostgreSQL
    if (!targetUser && process.env.NODE_ENV !== "test") {
      try {
        const { data: dbUser } = await supabaseServer
          .from("users")
          .select("*")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (dbUser) {
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
      } catch (dbErr) {
        console.warn("[OAuth Callback] Supabase PostgreSQL direct lookup fallback:", dbErr);
      }
    }

    // 4. Perilaku Account Linking:
    // Jika email Google sudah terdaftar, tautkan ID auth tanpa membuat akun ganda
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

      // Pertahankan peran yang sudah ada (jangan demote admin/guru, jangan eskalasi hak istimewa)
      UserRepository.update(targetUser.id, {
        authProviderId: authUser.id,
        emailVerified: true,
        avatarUrl: targetUser.avatarUrl || avatarUrl || undefined,
        lastActiveAt: new Date().toISOString(),
      });

      SystemLogRepository.log({
        level: "info",
        action: "AUTH_OAUTH_ACCOUNT_LINKED",
        actorId: targetUser.id,
        actorEmail: targetUser.email,
        actorName: targetUser.displayName,
        actorRole: targetUser.role,
        details: `Akun terdaftar '${targetUser.email}' berhasil ditautkan ke Google OAuth.`,
        status: "SUKSES",
      });
    } else {
      // 5. Pengguna Baru: Registrasi otomatis dengan peran default 'pelajar' (Student)
      // JAMINAN KEAMANAN: Jangan pernah memberikan role Admin atau Owner kepada pengguna Google baru
      const defaultRole = "pelajar";
      const nowIso = new Date().toISOString();

      const newUser: User = {
        id: authUser.id,
        authProviderId: authUser.id,
        email: normalizedEmail,
        displayName: String(displayName).trim(),
        role: defaultRole,
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
        actorRole: defaultRole,
        details: `Pengguna baru mendaftar via Google OAuth (${targetUser.email}) dengan peran default '${defaultRole}'.`,
        status: "SUKSES",
      });
    }

    // Sinkronkan peran ke app_metadata Supabase Auth (Otorisasi Server-Side & RLS)
    if (process.env.NODE_ENV !== "test") {
      try {
        await supabaseServer.auth.admin.updateUserById(authUser.id, {
          app_metadata: { role: targetUser.role },
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
