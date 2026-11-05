import { NextResponse } from "next/server";
import { UserRepository, SystemLogRepository } from "@/lib/db";
import { generateCryptoToken } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Alamat email wajib diisi." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = UserRepository.getByEmail(normalizedEmail);

    let resetToken: string | undefined;

    if (user && user.status === "active") {
      resetToken = `tok_reset_${generateCryptoToken(24)}`;
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 jam

      UserRepository.update(user.id, {
        resetPasswordToken: resetToken,
        resetPasswordExpires: expiresAt,
      });

      SystemLogRepository.log({
        level: "info",
        action: "PASSWORD_RESET_REQUESTED",
        actorId: user.id,
        actorEmail: user.email,
        details: `Permintaan reset kata sandi diajukan untuk akun '${user.email}'. Token berlaku 60 menit.`,
      });
    }

    // Anti-enumeration: respon identik apakah email ditemukan atau tidak
    return NextResponse.json({
      success: true,
      message: "Jika alamat email Anda terdaftar, instruksi pemulihan kata sandi telah dikirimkan ke kotak masuk Anda.",
      resetToken: process.env.NODE_ENV === "production" ? undefined : resetToken, // Disembunyikan di produksi demi keamanan
    });
  } catch (err: any) {
    console.error("[/api/auth/forgot-password Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memproses permintaan reset kata sandi." },
      { status: 500 }
    );
  }
}
