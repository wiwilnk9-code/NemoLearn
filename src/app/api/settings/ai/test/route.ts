import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getActiveAISettings } from "@/lib/ai";
import { GeminiAIProvider } from "@/lib/ai/gemini";
import { OpenAIProvider, validateSafeBaseUrl } from "@/lib/ai/openai";
import { OpenRouterProvider } from "@/lib/ai/openrouter";
import { MockAIProvider } from "@/lib/ai/mock";
import { AIProvider, AIProviderType } from "@/types/ai";

/**
 * Endpoint Uji Koneksi AI Nyata (RBAC Protected: Admin/Owner with manage_ai permission)
 */
export async function POST(req: Request) {
  try {
    // 1. Otorisasi Server-Side: Wajib Login & Peran Admin/Owner dengan izin manage_ai
    await requireAuth(["admin", "owner"], "manage_ai");

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { provider, apiKey, model, baseUrl, timeoutMs } = body;
    const active = getActiveAISettings();

    const targetProvider: AIProviderType = provider || active.provider || "mock";
    let targetKey = apiKey !== undefined ? apiKey : active.apiKey;
    if (targetKey === "keep_existing") {
      targetKey = active.apiKey;
    }
    const targetModel = model || active.model;
    const targetTimeout = timeoutMs ? Number(timeoutMs) : active.timeoutMs || 15000;

    let testProvider: AIProvider;

    if (targetProvider === "gemini") {
      if (!targetKey || !targetKey.trim()) {
        return NextResponse.json(
          {
            success: false,
            provider: "gemini",
            errorType: "CONFIG_MISSING",
            message: "API Key Gemini belum diisi. Masukkan Google Gemini API Key sebelum menguji koneksi.",
          },
          { status: 400 }
        );
      }
      testProvider = new GeminiAIProvider(targetKey.trim(), targetModel, targetTimeout);
    } else if (targetProvider === "openrouter") {
      if (!targetKey || !targetKey.trim()) {
        return NextResponse.json(
          {
            success: false,
            provider: "openrouter",
            errorType: "CONFIG_MISSING",
            message: "API Key untuk OpenRouter belum diisi. Masukkan API Key sebelum menguji koneksi.",
          },
          { status: 400 }
        );
      }
      testProvider = new OpenRouterProvider(
        targetKey.trim(),
        targetModel,
        baseUrl || "https://openrouter.ai/api/v1",
        targetTimeout
      );
    } else if (targetProvider === "openai" || targetProvider === "openai-compatible") {
      if (!targetKey || !targetKey.trim()) {
        return NextResponse.json(
          {
            success: false,
            provider: targetProvider,
            errorType: "CONFIG_MISSING",
            message: `API Key untuk ${targetProvider} belum diisi. Masukkan API Key sebelum menguji koneksi.`,
          },
          { status: 400 }
        );
      }
      const safeUrl = validateSafeBaseUrl(baseUrl || active.baseUrl);
      testProvider = new OpenAIProvider(
        targetKey.trim(),
        targetModel,
        safeUrl,
        targetTimeout,
        targetProvider
      );
    } else {
      testProvider = new MockAIProvider();
    }

    const testResult = await testProvider.testConnection();

    if (!testResult.success) {
      const status = testResult.statusCode || 400;
      return NextResponse.json(testResult, { status });
    }

    return NextResponse.json(testResult, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        errorType: "UNKNOWN_ERROR",
        message: err?.message || "Terjadi kesalahan saat menguji koneksi AI.",
      },
      { status: err?.statusCode || 500 }
    );
  }
}
