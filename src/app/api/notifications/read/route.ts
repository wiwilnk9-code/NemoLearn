import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { NotificationRepository } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = (await getCurrentUser(req)) || (await getCurrentUser());
    if (!user) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED: Anda wajib masuk ke akun terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { id, all } = body;

    if (all === true) {
      await NotificationRepository.markAllRead(user.id);
      return NextResponse.json({
        success: true,
        message: "Seluruh notifikasi ditandai sebagai dibaca.",
      });
    }

    if (id && typeof id === "string") {
      await NotificationRepository.markRead(id);
      return NextResponse.json({
        success: true,
        message: "Notifikasi ditandai sebagai dibaca.",
      });
    }

    return NextResponse.json(
      { success: false, error: "Parameter 'id' atau 'all: true' wajib disertakan." },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memperbarui status notifikasi." },
      { status: 500 }
    );
  }
}
