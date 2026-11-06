import { NextResponse } from "next/server";
import { WebsiteSettingsRepository } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const settings = WebsiteSettingsRepository.get();
    const user = (await getCurrentUser(req)) || (await getCurrentUser());
    const isOwnerOrAdmin = user && (user.role === "owner" || user.role === "admin");

    return NextResponse.json({
      success: true,
      maintenanceMode: settings.maintenanceMode,
      maintenance: settings.maintenance,
      isBypassed: Boolean(isOwnerOrAdmin),
      userRole: user ? user.role : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memeriksa status pemeliharaan." },
      { status: 500 }
    );
  }
}
