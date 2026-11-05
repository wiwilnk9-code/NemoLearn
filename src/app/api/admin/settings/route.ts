import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  WebsiteSettingsRepository,
  SystemLogRepository,
  AISettingsRepository,
  getMaskedApiVault,
  getGovernanceAuditLogs,
} from "@/lib/db";
import { WebsiteSettings } from "@/types/settings";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = await requireAuth(["admin", "owner"], "manage_settings", req);
    const settings = WebsiteSettingsRepository.get();
    const apiVault = getMaskedApiVault();
    const governanceLogs = getGovernanceAuditLogs(20);

    return NextResponse.json({
      success: true,
      settings,
      apiVault,
      governanceLogs,
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
      { success: false, error: err.message || "Gagal mengambil konfigurasi website." },
      { status }
    );
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAuth(["admin", "owner"], "manage_settings", req);
    const body = await req.json().catch(() => ({}));

    // Action 1: Reset ke default platform
    if (body.action === "reset_defaults") {
      const reset = WebsiteSettingsRepository.resetToDefaults(admin.email);

      SystemLogRepository.log({
        level: "security",
        action: "SETTINGS_RESET_TO_DEFAULTS",
        actorId: admin.id,
        actorEmail: admin.email,
        targetType: "system_settings",
        details: `Administrator ${admin.email} mengembalikan seluruh konfigurasi platform ke nilai default awal.`,
      });

      return NextResponse.json({
        success: true,
        settings: reset,
        apiVault: getMaskedApiVault(),
        governanceLogs: getGovernanceAuditLogs(20),
        message: "Konfigurasi sistem berhasil dikembalikan ke default.",
      });
    }

    // Action 2: Rotasi API Key Provider
    if (body.action === "rotate_key") {
      const provider = body.provider;
      const apiKey = body.apiKey;

      if (!provider || !apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
        return NextResponse.json(
          { success: false, error: "Provider dan API Key valid harus disertakan untuk rotasi kredensial." },
          { status: 400 }
        );
      }

      // Simpan key secara aman ke AISettingsRepository
      AISettingsRepository.save({
        provider: provider as any,
        apiKey: apiKey.trim(),
      });

      // Audit log tanpa pernah mengekspos kredensial
      SystemLogRepository.log({
        level: "security",
        action: "AI_KEY_ROTATED",
        actorId: admin.id,
        actorEmail: admin.email,
        targetType: "ai_settings",
        details: `Rotasi kredensial API Key untuk provider [${provider.toUpperCase()}] oleh ${admin.email}`,
      });

      return NextResponse.json({
        success: true,
        message: `Kredensial API Key untuk ${provider} berhasil diperbarui dan dienkripsi.`,
        apiVault: getMaskedApiVault(),
        governanceLogs: getGovernanceAuditLogs(20),
      });
    }

    // Action 3: General System Configuration Update
    const allowedTopLevelFields: Array<keyof WebsiteSettings> = [
      "siteName",
      "tagline",
      "description",
      "curriculum",
      "logoUrl",
      "enableAIGenerator",
      "enableIRTScoring",
      "enablePdfExport",
      "maintenanceMode",
      "allowPublicRegistration",
      "appInfo",
      "maintenance",
      "broadcast",
      "rateLimits",
      "aiRouting",
      "security",
    ];

    // Validation checks
    if (body.siteName !== undefined) {
      if (typeof body.siteName !== "string" || body.siteName.trim().length < 2) {
        return NextResponse.json(
          { success: false, error: "Nama platform minimal 2 karakter." },
          { status: 400 }
        );
      }
    }

    if (body.broadcast?.message !== undefined) {
      if (typeof body.broadcast.message !== "string" || body.broadcast.message.length > 140) {
        return NextResponse.json(
          { success: false, error: "Pesan banner pengumuman maksimal 140 karakter." },
          { status: 400 }
        );
      }
    }

    if (body.aiRouting) {
      const tutorTemp = body.aiRouting.tutorTemperature;
      const examTemp = body.aiRouting.examTemperature;
      if (tutorTemp !== undefined && (typeof tutorTemp !== "number" || tutorTemp < 0 || tutorTemp > 1)) {
        return NextResponse.json(
          { success: false, error: "Suhu (Temperature) AI Tutor harus berupa angka antara 0.0 dan 1.0." },
          { status: 400 }
        );
      }
      if (examTemp !== undefined && (typeof examTemp !== "number" || examTemp < 0 || examTemp > 1)) {
        return NextResponse.json(
          { success: false, error: "Suhu (Temperature) Generator Ujian harus berupa angka antara 0.0 dan 1.0." },
          { status: 400 }
        );
      }
    }

    if (body.rateLimits?.freeTier?.dailyPromptLimit !== undefined) {
      if (body.rateLimits.freeTier.dailyPromptLimit < 0) {
        return NextResponse.json(
          { success: false, error: "Limit prompt harian tidak boleh negatif." },
          { status: 400 }
        );
      }
    }

    const updatePayload: Partial<WebsiteSettings> = {};
    for (const key of allowedTopLevelFields) {
      if (body[key] !== undefined) {
        (updatePayload as any)[key] = body[key];
      }
    }

    const updated = WebsiteSettingsRepository.update(updatePayload, admin.email);

    // Contextual Audit Logging
    let actionName = "WEBSITE_SETTINGS_UPDATED";
    let detailMsg = `Administrator ${admin.email} memperbarui konfigurasi situs: ${Object.keys(updatePayload).join(", ")}`;

    if (body.maintenance !== undefined) {
      actionName = body.maintenance.enabled ? "MAINTENANCE_LOCKDOWN_ENABLED" : "MAINTENANCE_LOCKDOWN_DISABLED";
      detailMsg = `Status Mode Pemeliharaan diubah ke [${body.maintenance.enabled ? "AKTIF" : "NONAKTIF"}] oleh ${admin.email} (Cakupan: ${body.maintenance.scope || "all"})`;
    } else if (body.broadcast !== undefined) {
      actionName = body.broadcast.active ? "BROADCAST_PUBLISHED" : "BROADCAST_WITHDRAWN";
      detailMsg = `Banner pengumuman global [${body.broadcast.active ? "DITERBITKAN" : "DITARIK"}] oleh ${admin.email}`;
    } else if (body.rateLimits !== undefined) {
      actionName = "RATELIMITS_UPDATED";
      detailMsg = `Batas penggunaan rate limiting diperbarui oleh ${admin.email}`;
    }

    SystemLogRepository.log({
      level: body.maintenance?.enabled ? "warn" : "info",
      action: actionName,
      actorId: admin.id,
      actorEmail: admin.email,
      targetType: "system_settings",
      details: detailMsg,
    });

    return NextResponse.json({
      success: true,
      settings: updated,
      apiVault: getMaskedApiVault(),
      governanceLogs: getGovernanceAuditLogs(20),
      message: "Konfigurasi sistem berhasil disimpan.",
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes("FORBIDDEN");
    const isUnauthorized = err.message?.includes("UNAUTHORIZED");
    const status = isForbidden ? 403 : isUnauthorized ? 401 : 500;

    return NextResponse.json(
      { success: false, error: err.message || "Gagal menyimpan konfigurasi website." },
      { status }
    );
  }
}
