import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { sanitizeUserOutput } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: true, user: null });
    }

    if (user.status === "suspended") {
      return NextResponse.json(
        { success: false, user: null, error: "Akun telah dinonaktifkan." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: sanitizeUserOutput(user),
      emailVerified: Boolean(user.emailVerified),
    });
  } catch (err: any) {
    if (err?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("[/api/auth/me Error]:", err);
    return NextResponse.json({ success: true, user: null });
  }
}
