import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getGovernanceAuditLogs, WebsiteSettingsRepository } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = await requireAuth(["admin", "owner"], "view_audit_logs", req);
    const logs = getGovernanceAuditLogs(100);
    const settings = WebsiteSettingsRepository.get();

    const exportPayload = {
      platform: settings.siteName,
      cluster: settings.appInfo?.clusterId || "Cluster-Jakarta",
      buildNumber: settings.appInfo?.buildNumber || "04.92.11",
      exportedAt: new Date().toISOString(),
      exportedBy: admin.email,
      totalEvents: logs.length,
      events: logs,
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);
    const filename = `nemolearn-governance-audit-${new Date().toISOString().split("T")[0]}.json`;

    return new NextResponse(jsonString, {
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
      { success: false, error: err.message || "Gagal mengunduh audit log." },
      { status }
    );
  }
}
