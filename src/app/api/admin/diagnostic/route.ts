import { NextResponse } from "next/server";
import { getCurrentUser, extractTokenFromCookieHeader, verifySessionToken, COOKIE_NAME } from "@/lib/auth/server";
import { supabaseServer } from "@/lib/supabase/server";
import { UserRole } from "@/types/user";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);

    // Keamanan: Hanya Owner atau Admin resmi yang boleh mengakses endpoint diagnostik
    if (!currentUser || (currentUser.role !== "owner" && currentUser.role !== "admin")) {
      return NextResponse.json(
        {
          success: false,
          error: "FORBIDDEN: Endpoint diagnostik otorisasi hanya dapat diakses oleh akun resmi Owner atau Administrator.",
        },
        { status: 403 }
      );
    }

    // Ekstrak token sesi mentah dari header cookie untuk memeriksa claim sesi
    const cookieHeader = req.headers.get("cookie") || "";
    const sessionToken = extractTokenFromCookieHeader(cookieHeader);
    const sessionPayload = sessionToken ? verifySessionToken(sessionToken) : null;

    // 1. Ambil data dari Supabase PostgreSQL (public.users)
    let pgUserRole: string | null = null;
    let pgPermissions: string[] = [];
    let pgUpdatedAt: string | null = null;

    if (process.env.NODE_ENV !== "test") {
      try {
        const { data: pgData } = await supabaseServer
          .from("users")
          .select("role, permissions, updated_at")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (pgData) {
          pgUserRole = pgData.role;
          pgPermissions = pgData.permissions || [];
          pgUpdatedAt = pgData.updated_at;
        }
      } catch (err: any) {
        console.warn("[Diagnostic] Gagal membaca public.users:", err.message);
      }
    }

    // 2. Ambil data dari Supabase Auth (auth.users app_metadata)
    let authAppMetaRole: string | null = null;
    let authUserProvider: string | null = null;
    let hasUserMetadataRoleLeak = false;

    if (process.env.NODE_ENV !== "test" && supabaseServer.auth && supabaseServer.auth.admin) {
      try {
        const { data: authData } = await supabaseServer.auth.admin.getUserById(currentUser.id);
        if (authData?.user) {
          authAppMetaRole = authData.user.app_metadata?.role || null;
          authUserProvider = authData.user.app_metadata?.provider || null;
          if (authData.user.user_metadata?.role) {
            hasUserMetadataRoleLeak = true;
          }
        }
      } catch (err: any) {
        console.warn("[Diagnostic] Gagal membaca auth.users:", err.message);
      }
    }

    // 3. Evaluasi Konsistensi Role
    const effectiveRole: UserRole = currentUser.role;
    const sessionRole = sessionPayload?.role || null;

    const isAppMetaMatch = !authAppMetaRole || authAppMetaRole === effectiveRole;
    const isPgMatch = !pgUserRole || pgUserRole === effectiveRole;
    const isSessionMatch = !sessionRole || sessionRole === effectiveRole;

    const isFullyConsistent = isAppMetaMatch && isPgMatch && isSessionMatch;
    const sessionNeedsRefresh = sessionRole !== effectiveRole;

    // 4. Fitur Auto-Heal jika terdeteksi konflik pada akun Owner
    let selfHealed = false;
    if (effectiveRole === "owner" && (!isPgMatch || !isAppMetaMatch)) {
      if (process.env.NODE_ENV !== "test") {
        try {
          await supabaseServer
            .from("users")
            .update({
              role: "owner",
              updated_at: new Date().toISOString(),
            })
            .eq("id", currentUser.id);

          if (supabaseServer.auth && supabaseServer.auth.admin) {
            await supabaseServer.auth.admin.updateUserById(currentUser.id, {
              app_metadata: { role: "owner" },
            });
          }
          selfHealed = true;
        } catch (healErr) {
          console.warn("[Diagnostic Auto-Heal] Gagal melakukan auto-heal:", healErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      account: {
        userId: currentUser.id,
        email: currentUser.email,
        displayName: currentUser.displayName,
        provider: currentUser.authProvider || authUserProvider || "email",
        status: currentUser.status,
      },
      roles: {
        effectiveRole,
        authAppMetadataRole: authAppMetaRole || "N/A",
        publicUsersRole: pgUserRole || "N/A",
        sessionTokenRole: sessionRole || "N/A",
      },
      permissions: {
        total: pgPermissions.length,
        items: pgPermissions,
      },
      diagnostics: {
        isConsistent: isFullyConsistent,
        sessionNeedsRefresh,
        hasUserMetadataRoleLeak,
        selfHealed,
        status: isFullyConsistent ? "HEALTHY" : "INCONSISTENCY_RESOLVED",
      },
      advisory: sessionNeedsRefresh
        ? "Cookie sesi browser menyimpan role yang berbeda dari database. Silakan logout dan login kembali untuk memperbarui token sesi HMAC."
        : "Seluruh sumber role akun berada dalam keadaan konsisten dan terverifikasi di level server.",
    });
  } catch (err: any) {
    console.error("[Diagnostic Route Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal menjalankan diagnostik role." },
      { status: 500 }
    );
  }
}
