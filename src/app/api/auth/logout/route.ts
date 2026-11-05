import { NextResponse } from "next/server";
import { COOKIE_NAME, getCurrentUser } from "@/lib/auth/server";
import { SystemLogRepository } from "@/lib/db";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (user) {
      SystemLogRepository.log({
        level: "info",
        action: "AUTH_LOGOUT",
        actorId: user.id,
        actorEmail: user.email,
        actorName: user.displayName,
        actorRole: user.role,
        details: `Pengguna '${user.displayName}' telah keluar (logout) dari sesi.`,
        status: "SUKSES",
      });
    }

    // Revoke Supabase server session if applicable
    if (process.env.NODE_ENV !== "test") {
      try {
        await supabaseServer.auth.signOut();
      } catch {}
    }

    const response = NextResponse.json({ success: true, message: "Berhasil keluar dari sesi." });
    
    // Clear application session cookie
    response.cookies.delete(COOKIE_NAME);
    
    // Clear any Supabase auth cookies
    const cookieHeader = req.headers.get("cookie") || "";
    cookieHeader.split(";").forEach((part) => {
      const [name] = part.trim().split("=");
      if (name && (name.startsWith("sb-") || name.includes("auth-token") || name.includes("supabase"))) {
        response.cookies.delete(name);
      }
    });

    response.cookies.set({
      name: "nemo_logged_out",
      value: "1",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
    });

    return response;
  } catch (err: any) {
    console.error("[/api/auth/logout Error]:", err);
    const response = NextResponse.json({ success: true, message: "Sesi telah dibersihkan." });
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}
