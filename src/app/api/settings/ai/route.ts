import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AISettingsRepository, SystemLogRepository } from "@/lib/db";
import { getActiveAISettings, maskApiKey } from "@/lib/ai";
import { validateSafeBaseUrl } from "@/lib/ai/openai";
import { AIProviderType } from "@/types/ai";

/**
 * Endpoint Pengaturan AI Server (RBAC Protected: Admin/Owner with manage_ai permission)
 */

export async function GET() {
  try {
    // 1. Otorisasi Server-Side: Wajib Login & Peran Admin/Owner dengan izin manage_ai
    await requireAuth(["admin", "owner"], "manage_ai");

    const active = getActiveAISettings();

    // Pastikan API Key TIDAK PERNAH dikembalikan utuh ke browser (Masked Key)
    return NextResponse.json({
      success: true,
      provider: active.provider,
      model: active.model,
      baseUrl: active.baseUrl || "",
      timeoutMs: active.timeoutMs,
      hasKey: Boolean(active.apiKey && active.apiKey.trim().length > 0),
      maskedKey: maskApiKey(active.apiKey),
      source: active.source,
      updatedAt: active.updatedAt,
      updatedBy: active.updatedBy,
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes("FORBIDDEN");
    const isUnauthorized = err.message?.includes("UNAUTHORIZED");
    const status = isForbidden ? 403 : isUnauthorized ? 401 : 500;
    return NextResponse.json(
      { error: err?.message || "Gagal memuat konfigurasi AI." },
      { status }
    );
  }
}

export async function POST(req: Request) {
  try {
    // 1. Otorisasi Server-Side: Wajib Login & Peran Admin/Owner dengan izin manage_ai
    const user = await requireAuth(["admin", "owner"], "manage_ai");

    const body = await req.json();
    const { provider, apiKey, model, baseUrl, timeoutMs } = body;

    // 2. Validasi Provider
    const validProviders: AIProviderType[] = ["gemini", "openai", "openai-compatible", "mock"];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Provider '${provider}' tidak valid. Pilihan yang didukung: ${validProviders.join(", ")}` },
        { status: 400 }
      );
    }

    // 3. SSRF Protection untuk Base URL jika OpenAI-compatible
    let safeBaseUrl: string | undefined = undefined;
    if (provider === "openai-compatible" || (provider === "openai" && baseUrl)) {
      safeBaseUrl = validateSafeBaseUrl(baseUrl);
    }

    const current = getActiveAISettings();
    const dbSettings = AISettingsRepository.get();

    // 4. Resolusi API Key
    let resolvedKey = current.apiKey;
    if (apiKey === "" || body.clearKey === true) {
      resolvedKey = ""; // Explicit clear
    } else if (apiKey && apiKey !== "keep_existing") {
      resolvedKey = String(apiKey).trim(); // New key provided
    } else if (apiKey === "keep_existing") {
      // If provider is unchanged, keep existing key; otherwise fetch key specific to that provider if known
      if (provider === current.provider) {
        resolvedKey = current.apiKey;
      } else {
        resolvedKey = dbSettings?.providerKeys?.[provider as AIProviderType] || "";
      }
    }

    // 5. Simpan Konfigurasi Admin
    const saved = AISettingsRepository.save({
      provider,
      apiKey: resolvedKey,
      model: model ? String(model).trim() : current.model,
      baseUrl: safeBaseUrl,
      timeoutMs: timeoutMs ? Math.min(60000, Math.max(5000, Number(timeoutMs))) : current.timeoutMs,
      updatedBy: user.email,
    });

    SystemLogRepository.log({
      level: "warn",
      action: "AI_CONFIG_UPDATED",
      actorId: user.id,
      actorEmail: user.email,
      targetType: "ai_settings",
      details: `Admin ${user.displayName} memperbarui konfigurasi AI: Provider=${saved.provider}, Model=${saved.model}, HasKey=${Boolean(saved.apiKey)}`,
    });

    return NextResponse.json({
      success: true,
      message: "Konfigurasi AI server berhasil diperbarui oleh Administrator.",
      settings: {
        provider: saved.provider,
        model: saved.model,
        baseUrl: saved.baseUrl,
        timeoutMs: saved.timeoutMs,
        hasKey: Boolean(saved.apiKey && saved.apiKey.trim().length > 0),
        maskedKey: maskApiKey(saved.apiKey),
        updatedAt: saved.updatedAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Gagal menyimpan konfigurasi AI server." },
      { status: err?.statusCode || 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    // 1. Otorisasi Server-Side: Wajib Login & Peran Admin/Owner dengan izin manage_ai
    const user = await requireAuth(["admin", "owner"], "manage_ai");

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "clear_key") {
      const active = AISettingsRepository.deleteKey();
      SystemLogRepository.log({
        level: "warn",
        action: "AI_KEY_CLEARED",
        actorId: user.id,
        actorEmail: user.email,
        targetType: "ai_settings",
        details: `Admin ${user.displayName} menghapus API Key server untuk provider ${active.provider}.`,
      });

      return NextResponse.json({
        success: true,
        message: "API Key berhasil dihapus dari server.",
        settings: {
          provider: active.provider,
          model: active.model,
          source: "database",
          hasKey: false,
          maskedKey: "",
        },
      });
    }

    AISettingsRepository.reset();

    SystemLogRepository.log({
      level: "warn",
      action: "AI_CONFIG_RESET",
      actorId: user.id,
      actorEmail: user.email,
      targetType: "ai_settings",
      details: `Admin ${user.displayName} mereset konfigurasi AI database ke konfigurasi default sistem.`,
    });

    const active = getActiveAISettings();

    return NextResponse.json({
      success: true,
      message: "Konfigurasi kustom database berhasil direset. Server kembali ke konfigurasi default / environment.",
      settings: {
        provider: active.provider,
        model: active.model,
        source: active.source,
        hasKey: Boolean(active.apiKey),
        maskedKey: maskApiKey(active.apiKey),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Gagal mereset konfigurasi AI server." },
      { status: 500 }
    );
  }
}
