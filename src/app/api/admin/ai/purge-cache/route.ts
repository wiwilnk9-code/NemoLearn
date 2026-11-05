import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AIMetricsRepository, SystemLogRepository } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/ai/purge-cache
 * Membersihkan cache prompt penjelasan AI (RBAC Protected: admin/owner with manage_ai)
 */
export async function POST(req: Request) {
  try {
    const user = await requireAuth(["admin", "owner"], "manage_ai", req);

    const purgedCount = AIMetricsRepository.purgeExplanationCache();

    SystemLogRepository.log({
      level: "warn",
      action: "AI_PROMPT_CACHE_PURGED",
      actorId: user.id,
      actorEmail: user.email,
      targetType: "ai_cache",
      details: `Admin ${user.displayName} mengosongkan cache prompt penjelasan (${purgedCount} item dihapus).`,
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil mengosongkan ${purgedCount} entri cache prompt penjelasan.`,
      purgedCount,
      purgedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes("FORBIDDEN");
    const isUnauthorized = err.message?.includes("UNAUTHORIZED");
    const status = isForbidden ? 403 : isUnauthorized ? 401 : 500;
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengosongkan cache prompt." },
      { status }
    );
  }
}
