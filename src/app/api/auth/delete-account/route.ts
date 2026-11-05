import { NextResponse } from "next/server";
import { getCurrentUser, COOKIE_NAME } from "@/lib/auth/server";
import { UserRepository, SystemLogRepository } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED: Anda harus login untuk melakukan tindakan ini." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { password, confirmationText } = body;

    // 1. Verifikasi Ulang Kredensial / Identitas
    if (user.passwordHash) {
      if (!password || typeof password !== "string") {
        return NextResponse.json(
          { success: false, error: "Masukkan kata sandi akun Anda untuk mengonfirmasi penghapusan." },
          { status: 400 }
        );
      }

      const isMatch = verifyPassword(password, user.passwordHash);
      if (!isMatch) {
        SystemLogRepository.log({
          level: "warn",
          action: "ACCOUNT_DELETION_FAILED",
          actorId: user.id,
          actorEmail: user.email,
          actorName: user.displayName,
          actorRole: user.role,
          targetType: "user",
          targetId: user.id,
          details: "Percobaan penghapusan akun ditolak karena verifikasi kata sandi salah.",
          status: "GAGAL",
          category: "security",
        });

        return NextResponse.json(
          { success: false, error: "Kata sandi yang Anda masukkan salah. Penghapusan akun dibatalkan demi keamanan." },
          { status: 403 }
        );
      }
    } else {
      // Jika pengguna login via OAuth tanpa password, harus mengetik frasa konfirmasi eksplisit
      if (confirmationText !== "HAPUS AKUN SAYA") {
        return NextResponse.json(
          { success: false, error: "Ketik teks konfirmasi 'HAPUS AKUN SAYA' dengan benar." },
          { status: 400 }
        );
      }
    }

    // 2. Proteksi Akun Administratif: Cegah penghapusan satu-satunya Owner
    if (user.role === "owner" || user.role === "admin") {
      const allUsers = UserRepository.getAll().users;
      const remainingAdmins = allUsers.filter(
        (u) => (u.role === "owner" || u.role === "admin") && u.id !== user.id
      ).length;

      if (remainingAdmins === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Akun ini merupakan satu-satunya administrator/owner sistem aktif dan tidak dapat dihapus. Alihkan kepemilikan terlebih dahulu.",
          },
          { status: 400 }
        );
      }
    }

    // 3. Proses Penghapusan Akun & Anonimisasi Data di Backend
    const result = UserRepository.deleteAccount(user.id);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message || "Gagal memproses penghapusan akun." },
        { status: 500 }
      );
    }

    // 4. Buat response dan cabut cookie sesi aktif
    const response = NextResponse.json({
      success: true,
      message: "Akun dan data pribadi Anda telah berhasil dihapus secara permanen dari NemoLearn.",
    });

    response.cookies.delete(COOKIE_NAME);
    response.cookies.delete("nemo_session");
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
    console.error("[DeleteAccount API Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Terjadi kesalahan internal saat menghapus akun." },
      { status: 500 }
    );
  }
}
