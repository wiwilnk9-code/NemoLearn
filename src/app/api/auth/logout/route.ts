import { NextResponse } from "next/server";
import { COOKIE_NAME, getCurrentUser } from "@/lib/auth/server";
import { SystemLogRepository } from "@/lib/db";

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

    const response = NextResponse.json({ success: true, message: "Berhasil keluar dari sesi." });
    response.cookies.delete(COOKIE_NAME);
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
