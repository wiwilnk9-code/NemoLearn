import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AIMetricsRepository } from "@/lib/db";
import { calculateEstimatedCost, estimateTokensFromRequest } from "@/lib/ai/pricing";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/ai/export
 * Ekspor data log telemetri AI ke format CSV (RBAC Protected: admin/owner with manage_ai)
 */
export async function GET(req: Request) {
  try {
    await requireAuth(["admin", "owner"], "manage_ai", req);

    const analytics = AIMetricsRepository.getDetailedAnalytics({
      rangeHours: 720, // 30 hari terakhir
      limit: 500,
    });

    const headers = [
      "Waktu (WIB)",
      "Request ID",
      "Provider",
      "Model",
      "Tipe Request",
      "Mata Pelajaran",
      "Materi Pokok",
      "Status",
      "Latensi (ms)",
      "Prompt Tokens",
      "Completion Tokens",
      "Total Tokens",
      "Estimasi Biaya ($)",
      "Error Reason",
    ];

    const escapeCsv = (str: any) => {
      if (str === undefined || str === null) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = analytics.history.map((item) => {
      let promptTok = item.tokenUsage?.promptTokens;
      let compTok = item.tokenUsage?.completionTokens;
      if (promptTok === undefined || compTok === undefined) {
        const est = estimateTokensFromRequest({
          requestType: item.requestType,
          questionCount: item.questionCount,
          depth: item.depth,
          hasError: !item.success,
        });
        promptTok = est.promptTokens;
        compTok = est.completionTokens;
      }
      const totalTok = promptTok + compTok;
      const cost = calculateEstimatedCost(item.model, promptTok, compTok);

      const wibTime = new Date(item.timestamp).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      return [
        escapeCsv(wibTime),
        escapeCsv(item.requestId || "-"),
        escapeCsv(item.provider || "-"),
        escapeCsv(item.model || "-"),
        escapeCsv(item.requestType || "question_generation"),
        escapeCsv(item.subject || "-"),
        escapeCsv(item.topic || "-"),
        escapeCsv(item.status || (item.success ? "SUCCESS" : "FAILED")),
        item.latencyMs || 0,
        promptTok,
        compTok,
        totalTok,
        cost.toFixed(4),
        escapeCsv(item.error || "-"),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const filename = `nemolearn_ai_telemetry_${new Date().toISOString().substring(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes("FORBIDDEN");
    const isUnauthorized = err.message?.includes("UNAUTHORIZED");
    const status = isForbidden ? 403 : isUnauthorized ? 401 : 500;
    return NextResponse.json(
      { error: err.message || "Gagal mengekspor data telemetri AI." },
      { status }
    );
  }
}
