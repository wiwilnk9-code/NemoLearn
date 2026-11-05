import { NextResponse } from "next/server";
import { UserRepository, SystemLogRepository, loadDb } from "@/lib/db";
import { generateCryptoToken, sanitizeUserOutput } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token verifikasi wajib disertakan." },
        { status: 400 }
      );
    }

    const result = await processVerification(token);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    console.error("[/api/auth/verify-email GET Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memproses verifikasi email." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, resendEmail } = body;

    // A. Permintaan Pengiriman Ulang Token Verifikasi (Resend)
    if (resendEmail) {
      const user = UserRepository.getByEmail(String(resendEmail).trim().toLowerCase());
      if (!user) {
        // Anti-enumeration: kembalikan sukses tanpa membocorkan status email
        return NextResponse.json({
          success: true,
          message: "Jika email terdaftar dan belum diverifikasi, tautan baru telah dikirimkan.",
        });
      }

      if (user.emailVerified) {
        return NextResponse.json({
          success: true,
          message: "Email ini sudah terverifikasi sebelumnya.",
          alreadyVerified: true,
        });
      }

      const newToken = `tok_verif_${generateCryptoToken(24)}`;
      const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      UserRepository.update(user.id, {
        verificationToken: newToken,
        verificationTokenExpires: newExpiry,
      });

      SystemLogRepository.log({
        level: "info",
        action: "EMAIL_VERIFICATION_RESENT",
        actorId: user.id,
        actorEmail: user.email,
        details: `Tautan verifikasi email baru diterbitkan untuk ${user.email}.`,
      });

      return NextResponse.json({
        success: true,
        message: "Tautan verifikasi baru berhasil dikirim.",
        verificationToken: process.env.NODE_ENV === "production" ? undefined : newToken,
      });
    }

    // B. Verifikasi Token Langsung
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token verifikasi wajib disertakan." },
        { status: 400 }
      );
    }

    const result = await processVerification(token);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    console.error("[/api/auth/verify-email POST Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memproses verifikasi email." },
      { status: 500 }
    );
  }
}

async function processVerification(token: string) {
  const db = loadDb();
  const targetUser = Object.values(db.users).find((u) => u.verificationToken === token);

  if (!targetUser) {
    return {
      success: false,
      error: "Token verifikasi tidak valid atau sudah pernah digunakan.",
    };
  }

  if (targetUser.verificationTokenExpires) {
    const isExpired = Date.now() > new Date(targetUser.verificationTokenExpires).getTime();
    if (isExpired) {
      return {
        success: false,
        error: "Token verifikasi telah kedaluwarsa. Silakan minta tautan verifikasi baru.",
        isExpired: true,
      };
    }
  }

  const updated = UserRepository.update(targetUser.id, {
    emailVerified: true,
    verificationStatus: targetUser.verificationStatus === "unverified" ? "verified" : targetUser.verificationStatus,
    verificationToken: undefined,
    verificationTokenExpires: undefined,
  });

  SystemLogRepository.log({
    level: "info",
    action: "EMAIL_VERIFIED",
    actorId: targetUser.id,
    actorEmail: targetUser.email,
    actorName: targetUser.displayName,
    actorRole: targetUser.role,
    targetType: "user",
    targetId: targetUser.id,
    details: `Email akun '${targetUser.email}' berhasil diverifikasi.`,
    status: "SUKSES",
  });

  return {
    success: true,
    message: "Alamat email berhasil diverifikasi! Akun Anda kini aktif sepenuhnya.",
    user: updated ? sanitizeUserOutput(updated) : undefined,
  };
}
