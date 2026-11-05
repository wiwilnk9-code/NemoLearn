import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { SessionRepository } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAuth(["admin", "owner"], "manage_sessions", req);

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const status = (url.searchParams.get("status") || "all") as any;
    const scoringMethod = (url.searchParams.get("scoringMethod") || "all") as any;
    const subjectId = url.searchParams.get("subjectId") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    const result = SessionRepository.getAll({
      search,
      status,
      scoringMethod,
      subjectId,
      page,
      limit,
    });

    const stats = SessionRepository.getStats();

    return NextResponse.json({
      success: true,
      sessions: result.sessions,
      total: result.total,
      stats,
      page,
      limit,
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes("FORBIDDEN");
    const isUnauthorized = err.message?.includes("UNAUTHORIZED");
    const status = isForbidden ? 403 : isUnauthorized ? 401 : 500;

    return NextResponse.json(
      { success: false, error: err.message || "Gagal memuat sesi latihan siswa." },
      { status }
    );
  }
}
