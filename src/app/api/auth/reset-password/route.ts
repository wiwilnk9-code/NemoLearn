import { NextResponse } from "next/server";
import { UserRepository, SystemLogRepository, loadDb } from "@/lib/db";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, password, confirmPassword } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "Token pemulihan kata sandi tidak valid atau tidak disertakan." },
        { status: 400 }
      );
    }

    if (!password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Kata sandi baru dan konfirmasi kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Konfirmasi kata sandi tidak cocok dengan kata sandi baru." },
        { status: 400 }
      );
    }

    const passCheck = validatePasswordStrength(password);
    if (!passCheck.isValid) {
      return NextResponse.json(
        { success: false, error: passCheck.message || "Kata sandi baru tidak memenuhi standar keamanan." },
        { status: 400 }
      );
    }

    const db = loadDb();
    const targetUser = Object.values(db.users).find((u) => u.resetPasswordToken === token);

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Token pemulihan kata sandi tidak valid atau telah kedaluwarsa." },
        { status: 400 }
      );
    }

    if (targetUser.resetPasswordExpires) {
      const isExpired = Date.now() > new Date(targetUser.resetPasswordExpires).getTime();
      if (isExpired) {
        return NextResponse.json(
          { success: false, error: "Token pemulihan kata sandi telah kedaluwarsa. Silakan ajukan permohonan baru." },
          { status: 400 }
        );
      }
    }

    const newHashed = hashPassword(password);

    UserRepository.update(targetUser.id, {
      passwordHash: newHashed,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
    });

    SystemLogRepository.log({
      level: "security",
      action: "PASSWORD_RESET_COMPLETED",
      actorId: targetUser.id,
      actorEmail: targetUser.email,
      actorName: targetUser.displayName,
      actorRole: targetUser.role,
      targetType: "user",
      targetId: targetUser.id,
      details: `Kata sandi akun '${targetUser.email}' berhasil diubah melalui token pemulihan.`,
      status: "SUKSES",
    });

    return NextResponse.json({
      success: true,
      message: "Kata sandi Anda berhasil diperbarui. Silakan masuk menggunakan kata sandi baru Anda.",
    });
  } catch (err: any) {
    console.error("[/api/auth/reset-password Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memproses pembaruan kata sandi." },
      { status: 500 }
    );
  }
}
