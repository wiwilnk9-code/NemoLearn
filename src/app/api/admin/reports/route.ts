import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ReportRepository, SystemLogRepository, UserRepository, QuestionRepository } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAuth(["admin", "owner"], "manage_questions", req);

    const url = new URL(req.url);
    const status = (url.searchParams.get("status") || "all") as any;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    const result = ReportRepository.getAll({
      status,
      page,
      limit,
    });

    // Enrich reports with actor name and target info
    const enriched = result.reports.map((r) => {
      const actor = UserRepository.getById(r.actorId);
      let targetSummary = r.targetId;
      if (r.targetType === "question" && r.targetId) {
        const q = QuestionRepository.getById(r.targetId);
        if (q) {
          targetSummary = `${q.subjectId.toUpperCase()}: ${q.stem.slice(0, 60)}...`;
        }
      }
      return {
        ...r,
        actorName: actor?.displayName || "Pengguna",
        actorEmail: actor?.email || "-",
        targetSummary,
      };
    });

    return NextResponse.json({
      success: true,
      reports: enriched,
      total: result.total,
      pendingCount: result.pendingCount,
      page,
      limit,
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes("FORBIDDEN");
    const isUnauthorized = err.message?.includes("UNAUTHORIZED");
    const status = isForbidden ? 403 : isUnauthorized ? 401 : 500;

    return NextResponse.json(
      { success: false, error: err.message || "Gagal memuat daftar laporan masalah." },
      { status }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireAuth(["admin", "owner"], "manage_questions", req);
    const body = await req.json();

    const { id, status, notes } = body;
    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "ID laporan dan status baru wajib disertakan." },
        { status: 400 }
      );
    }

    if (status !== "pending" && status !== "resolved") {
      return NextResponse.json(
        { success: false, error: "Status harus 'pending' atau 'resolved'." },
        { status: 400 }
      );
    }

    const updated = ReportRepository.updateStatus(id, status, notes, admin.displayName);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Laporan tidak ditemukan." },
        { status: 404 }
      );
    }

    SystemLogRepository.log({
      level: "info",
      action: "REPORT_STATUS_UPDATED",
      actorId: admin.id,
      actorEmail: admin.email,
      targetType: "report",
      targetId: id,
      details: `Admin ${admin.displayName} memperbarui status laporan ${id} menjadi '${status}'. Catatan: ${notes || "-"}`,
    });

    return NextResponse.json({
      success: true,
      report: updated,
      message: "Status laporan berhasil diperbarui.",
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes("FORBIDDEN");
    const isUnauthorized = err.message?.includes("UNAUTHORIZED");
    const status = isForbidden ? 403 : isUnauthorized ? 401 : 500;

    return NextResponse.json(
      { success: false, error: err.message || "Gagal memperbarui laporan." },
      { status }
    );
  }
}
