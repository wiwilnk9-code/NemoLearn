import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { NotificationRepository } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = (await getCurrentUser(req)) || (await getCurrentUser());
    if (!user) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED: Anda wajib masuk ke akun terlebih dahulu." },
        { status: 401 }
      );
    }

    const notifications = await NotificationRepository.getByUserId(user.id);
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memuat notifikasi." },
      { status: 500 }
    );
  }
}
