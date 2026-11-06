import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getActiveAISettings } from "@/lib/ai";
import { GeminiAIProvider } from "@/lib/ai/gemini";
import { OpenAIProvider, validateSafeBaseUrl } from "@/lib/ai/openai";
import { OpenRouterProvider } from "@/lib/ai/openrouter";
import { MockAIProvider } from "@/lib/ai/mock";
import { AIProvider, AIProviderType } from "@/types/ai";
import { AISettingsRepository, AIMetricsRepository } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/ai/ping
 * Uji koneksi live ke provider tertentu secara aman tanpa membocorkan API key.
 * (RBAC Protected: admin/owner with manage_ai)
 */
export async function POST(req: Request) {
  try {
    const user = await requireAuth(["admin", "owner"], "manage_ai", req);

    const body = await req.json().catch(() => ({}));
    const providerType: AIProviderType = body.providerType || "gemini";

    const dbSettings = AISettingsRepository.get();
    const active = getActiveAISettings();

    // Resolusi key yang aman untuk provider terkait
    let apiKey = "";
    if (body.apiKey && body.apiKey !== "keep_existing") {
      apiKey = String(body.apiKey).trim();
    } else {
      apiKey =
        dbSettings?.providerKeys?.[providerType] ||
        (active.provider === providerType ? active.apiKey : "") ||
        (providerType === "gemini" ? process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY : "") ||
        (providerType === "openai" ? process.env.OPENAI_API_KEY : "") ||
        (providerType === "openrouter" ? process.env.OPENROUTER_API_KEY : "") ||
        (providerType === "openai-compatible" ? process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY : "") ||
        "";
    }

    const model = body.model || (providerType === "gemini" ? "gemini-1.5-flash" : providerType === "openrouter" ? "meta-llama/llama-3.3-70b-instruct" : providerType === "openai" ? "gpt-4o-mini" : "llama-3.3-70b-versatile");
    const timeoutMs = Math.min(15000, Math.max(3000, Number(body.timeoutMs) || 10000));

    let testProvider: AIProvider;

    if (providerType === "gemini") {
      if (!apiKey || !apiKey.trim()) {
        return NextResponse.json(
          {
            success: false,
            provider: "Google Gemini",
            errorType: "CONFIG_MISSING",
            message: "API Key Gemini belum diset. Konfigurasikan API Key sebelum menguji koneksi.",
          },
          { status: 400 }
        );
      }
      testProvider = new GeminiAIProvider(apiKey.trim(), model, timeoutMs);
    } else if (providerType === "openrouter") {
      if (!apiKey || !apiKey.trim()) {
        return NextResponse.json(
          {
            success: false,
            provider: "OpenRouter Unified Gateway",
            errorType: "CONFIG_MISSING",
            message: "API Key untuk OpenRouter belum diset. Konfigurasikan API Key terlebih dahulu.",
          },
          { status: 400 }
        );
      }
      testProvider = new OpenRouterProvider(
        apiKey.trim(),
        model,
        body.baseUrl || "https://openrouter.ai/api/v1",
        timeoutMs
      );
    } else if (providerType === "openai" || providerType === "openai-compatible") {
      if (!apiKey || !apiKey.trim()) {
        return NextResponse.json(
          {
            success: false,
            provider: providerType === "openai" ? "OpenAI Production" : "OpenAI Gateway",
            errorType: "CONFIG_MISSING",
            message: `API Key untuk ${providerType} belum diset. Konfigurasikan API Key terlebih dahulu.`,
          },
          { status: 400 }
        );
      }
      const safeUrl = validateSafeBaseUrl(
        body.baseUrl ||
          (providerType === "openai-compatible"
            ? active.baseUrl || "https://api.groq.com/openai/v1"
            : "https://api.openai.com/v1")
      );
      testProvider = new OpenAIProvider(apiKey.trim(), model, safeUrl, timeoutMs, providerType);
    } else {
      testProvider = new MockAIProvider();
    }

    const startTime = Date.now();
    const result = await testProvider.testConnection();
    const latency = result.latencyMs || Date.now() - startTime;

    // Catat tes ping ke AIMetrics sebagai audit trail
    AIMetricsRepository.record({
      requestId: `ping_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      provider: testProvider.name,
      model,
      success: result.success,
      latencyMs: latency,
      error: result.success ? undefined : result.message,
      requestType: "question_generation",
      status: result.success ? "SUCCESS" : "FAILED",
    });

    return NextResponse.json({
      success: result.success,
      provider: testProvider.name,
      model,
      latencyMs: latency,
      message: result.message,
      errorType: result.errorType,
      testedBy: user.email,
      testedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes("FORBIDDEN");
    const isUnauthorized = err.message?.includes("UNAUTHORIZED");
    const status = isForbidden ? 403 : isUnauthorized ? 401 : 500;
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Gagal melakukan uji koneksi ping provider.",
      },
      { status }
    );
  }
}
