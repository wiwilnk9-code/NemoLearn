import { NextResponse } from "next/server";
import { WebsiteSettingsRepository } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    // Read live from Supabase / synchronized database store
    const settings = await WebsiteSettingsRepository.getLive();
    const user = (await getCurrentUser(req)) || (await getCurrentUser());
    const isOwnerOrAdmin = Boolean(user && (user.role === "owner" || user.role === "admin"));

    const response = NextResponse.json({
      success: true,
      maintenanceMode: settings.maintenanceMode,
      maintenance: settings.maintenance,
      isBypassed: isOwnerOrAdmin,
      userRole: user ? user.role : null,
      timestamp: new Date().toISOString(),
    });

    // Guarantee no caching across Vercel edge CDN or browser
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memeriksa status pemeliharaan." },
      { status: 500 }
    );
  }
}
