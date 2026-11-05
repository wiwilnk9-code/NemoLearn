import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { SystemLogRepository } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = await requireAuth(["admin", "owner"], "view_audit_logs", req);

    const url = new URL(req.url);
    const level = (url.searchParams.get("level") || "all") as any;
    const category = url.searchParams.get("category") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const dateRange = (url.searchParams.get("dateRange") || "all") as any;
    const action = url.searchParams.get("action") || undefined;
    const search = url.searchParams.get("search") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "25", 10);

    const result = SystemLogRepository.getAll({
      level,
      category,
      status,
      dateRange,
      action,
      search,
      page,
      limit,
    });

    const metrics = SystemLogRepository.getMetricsSummary();

    return NextResponse.json({
      success: true,
      logs: result.logs,
      total: result.total,
      page,
      limit,
      metrics,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes("FORBIDDEN");
    const isUnauthorized = err.message?.includes("UNAUTHORIZED");
    const status = isForbidden ? 403 : isUnauthorized ? 401 : 500;

    return NextResponse.json(
      { success: false, error: err.message || "Gagal memuat log sistem." },
      { status }
    );
  }
}
