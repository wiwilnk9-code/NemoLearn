import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { UserRepository } from "@/lib/db";
import { sanitizeUserOutput } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED: Anda wajib masuk terlebih dahulu untuk memperbarui profil." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { displayName, school, gender } = body;

    if (!displayName || typeof displayName !== "string" || displayName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Nama tampilan minimal 2 karakter." },
        { status: 400 }
      );
    }

    // Hanya izinkan pembaruan data profil yang aman (mempertahankan peran asli & hak izin)
    const updated = UserRepository.update(user.id, {
      displayName: displayName.trim(),
      school: school ? String(school).trim() : undefined,
      gender: gender && ["laki-laki", "perempuan", "rahasia"].includes(gender) ? gender : undefined,
      role: user.role, // Pertahankan peran otoritatif pengguna secara eksplisit
      permissions: user.permissions,
    });

    return NextResponse.json({
      success: true,
      user: updated ? sanitizeUserOutput(updated) : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memperbarui profil." },
      { status: 500 }
    );
  }
}
