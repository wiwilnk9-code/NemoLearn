import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getAdminAiQuotaOverview,
  updateAiQuotaSettings,
  grantUserAiAccess,
  revokeUserAiAccess,
  setUserQuotaOverride,
} from "@/lib/ai/quota-manager";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/ai/quotas
 * Returns comprehensive AI quota status and list of authorized users (Owner only)
 */
export async function GET(req: Request) {
  try {
    await requireAuth(["owner"], undefined, req);
    const overview = getAdminAiQuotaOverview();
    return NextResponse.json({
      success: true,
      ...overview,
    });
  } catch (err: any) {
    const isUnauth = err?.message?.includes("UNAUTHORIZED");
    const isForbidden = err?.message?.includes("FORBIDDEN");
    return NextResponse.json(
      { error: err?.message || "Gagal mengambil data kuota AI." },
      { status: isUnauth ? 401 : isForbidden ? 403 : 500 }
    );
  }
}

/**
 * POST /api/admin/ai/quotas
 * Update global AI Quota Configuration (Owner only)
 */
export async function POST(req: Request) {
  try {
    const actor = await requireAuth(["owner"], undefined, req);
    const body = await req.json();

    const updatedConfig = updateAiQuotaSettings(body, actor);
    return NextResponse.json({
      success: true,
      config: updatedConfig,
      message: "Konfigurasi kuota AI berhasil diperbarui.",
    });
  } catch (err: any) {
    const isUnauth = err?.message?.includes("UNAUTHORIZED");
    const isForbidden = err?.message?.includes("FORBIDDEN");
    return NextResponse.json(
      { error: err?.message || "Gagal memperbarui konfigurasi kuota AI." },
      { status: isUnauth ? 401 : isForbidden ? 403 : 400 }
    );
  }
}

/**
 * PATCH /api/admin/ai/quotas
 * Manage user AI access authorization and quota overrides (Owner only)
 */
export async function PATCH(req: Request) {
  try {
    const actor = await requireAuth(["owner"], undefined, req);
    const body = await req.json();
    const { action, targetUserId, dailyAiQuotaOverride } = body;

    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json(
        { error: "Parameter targetUserId wajib disertakan." },
        { status: 400 }
      );
    }

    if (action === "grant") {
      const updatedUser = grantUserAiAccess(targetUserId, actor);
      return NextResponse.json({
        success: true,
        user: updatedUser,
        message: `Akses AI berhasil diberikan kepada ${updatedUser.displayName}.`,
      });
    }

    if (action === "revoke") {
      const updatedUser = revokeUserAiAccess(targetUserId, actor);
      return NextResponse.json({
        success: true,
        user: updatedUser,
        message: `Akses AI berhasil dicabut dari ${updatedUser.displayName}.`,
      });
    }

    if (action === "override") {
      const updatedUser = setUserQuotaOverride(targetUserId, dailyAiQuotaOverride, actor);
      return NextResponse.json({
        success: true,
        user: updatedUser,
        message: `Batas kuota harian individual ${updatedUser.displayName} berhasil diperbarui.`,
      });
    }

    return NextResponse.json(
      { error: "Action tidak valid. Gunakan 'grant', 'revoke', atau 'override'." },
      { status: 400 }
    );
  } catch (err: any) {
    const isUnauth = err?.message?.includes("UNAUTHORIZED");
    const isForbidden = err?.message?.includes("FORBIDDEN");
    return NextResponse.json(
      { error: err?.message || "Gagal memproses aksi kuota pengguna." },
      { status: isUnauth ? 401 : isForbidden ? 403 : 400 }
    );
  }
}
