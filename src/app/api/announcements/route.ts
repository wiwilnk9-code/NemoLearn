import { NextResponse } from "next/server";
import { AnnouncementRepository } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = (await getCurrentUser(req)) || (await getCurrentUser());
    const role = user ? user.role : "all";
    const announcements = await AnnouncementRepository.getActive(role);

    return NextResponse.json({
      success: true,
      announcements,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memuat pengumuman." },
      { status: 500 }
    );
  }
}
