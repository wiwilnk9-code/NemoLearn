import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { SystemLogRepository } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = await requireAuth(["admin", "owner"], "view_audit_logs", req);

    const url = new URL(req.url);
    const format = (url.searchParams.get("format") || "csv").toLowerCase();
    const category = url.searchParams.get("category") || undefined;
    const level = (url.searchParams.get("level") || "all") as any;
    const status = url.searchParams.get("status") || undefined;
    const dateRange = (url.searchParams.get("dateRange") || "all") as any;
    const search = url.searchParams.get("search") || undefined;

    // Fetch all logs matching filter (up to 1000 items)
    const result = SystemLogRepository.getAll({
      level,
      category,
      status,
      dateRange,
      search,
      page: 1,
      limit: 1000,
    });

    const dateStr = new Date().toISOString().split("T")[0];

    // Export as CSV
    if (format === "csv") {
      const headers = [
        "Timestamp (WIB)",
        "Log ID",
        "Level",
        "Kategori",
        "Aksi",
        "Aktor ID",
        "Aktor Email",
        "Nama Aktor",
        "Role",
        "IP Address",
        "Lokasi",
        "Status",
        "Ringkasan Aktivitas",
      ];

      const csvRows = [headers.join(",")];

      for (const log of result.logs) {
        const timeFormatted = new Date(log.timestamp).toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
        });

        const sanitize = (val?: string) => {
          if (!val) return '""';
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        };

        const row = [
          sanitize(timeFormatted),
          sanitize(log.id),
          sanitize(log.level),
          sanitize(log.category || "general"),
          sanitize(log.action),
          sanitize(log.actorId),
          sanitize(log.actorEmail),
          sanitize(log.actorName || "-"),
          sanitize(log.actorRole || "-"),
          sanitize(log.ip || "127.0.0.1"),
          sanitize(log.location || "-"),
          sanitize(log.status || "SUKSES"),
          sanitize(log.details),
        ];

        csvRows.push(row.join(","));
      }

      const csvContent = "\uFEFF" + csvRows.join("\r\n"); // UTF-8 BOM for Excel
      const filename = `nemolearn-audit-trail-${dateStr}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Export as JSON
    const jsonPayload = {
      platform: "NemoLearn",
      subsystem: "Forensic Audit Trail Ledger",
      ledgerId: "0x992b-jkt",
      exportedAt: new Date().toISOString(),
      exportedBy: admin.email,
      totalRecords: result.total,
      filtersApplied: {
        category: category || "all",
        level: level || "all",
        status: status || "all",
        dateRange: dateRange || "all",
      },
      auditRecords: result.logs,
    };

    const filename = `nemolearn-audit-trail-${dateStr}.json`;
    return new NextResponse(JSON.stringify(jsonPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes("FORBIDDEN");
    const isUnauthorized = err.message?.includes("UNAUTHORIZED");
    const status = isForbidden ? 403 : isUnauthorized ? 401 : 500;

    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengunduh audit trail." },
      { status }
    );
  }
}
