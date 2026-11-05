import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AnalyticsRepository } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = await requireAuth(["admin", "owner"], "view_analytics", req);

    const url = new URL(req.url);
    const daysParam = parseInt(url.searchParams.get("days") || "7", 10);
    const days = [7, 14, 30].includes(daysParam) ? daysParam : 7;

    const analytics = AnalyticsRepository.getFullAnalytics(days);

    return NextResponse.json({
      success: true,
      data: analytics,
      admin: {
        id: admin.id,
        displayName: admin.displayName,
        role: admin.role,
      },
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes("FORBIDDEN");
    const isUnauthorized = err.message?.includes("UNAUTHORIZED");
    const status = isForbidden ? 403 : isUnauthorized ? 401 : 500;

    return NextResponse.json(
      { success: false, error: err.message || "Gagal memuat analitik operasional platform." },
      { status }
    );
  }
}
