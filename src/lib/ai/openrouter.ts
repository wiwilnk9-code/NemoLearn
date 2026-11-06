import {
  AIProvider,
  AIProviderType,
  QuestionGenRequest,
  RawAiQuestionOutput,
  AIError,
  AITestResult,
  ExplanationGenRequest,
} from "@/types/ai";
import { Question } from "@/types/question";
import { validateQuestionBatch } from "./validator";
import { extractJsonString } from "./gemini";
import { buildModularPrompt, buildSystemPrompt, buildExplanationPrompt } from "./prompt";
import { validateSafeBaseUrl } from "./openai";

export const POPULAR_OPENROUTER_MODELS = [
  { id: "anthropic/claude-3.5-sonnet", name: "Anthropic Claude 3.5 Sonnet", tier: "premium" },
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Meta LLaMA 3.3 70B Instruct", tier: "standard" },
  { id: "deepseek/deepseek-chat", name: "DeepSeek V3 (Chat)", tier: "standard" },
  { id: "google/gemini-2.0-flash-001", name: "Google Gemini 2.0 Flash", tier: "standard" },
  { id: "mistralai/mistral-large-2411", name: "Mistral Large 2411", tier: "premium" },
  { id: "openai/gpt-4o-mini", name: "OpenAI GPT-4o Mini", tier: "standard" },
] as const;

export class OpenRouterProvider implements AIProvider {
  name: string = "OpenRouter AI Provider";
  providerType: AIProviderType = "openrouter";
  apiKey: string;
  model: string;
  baseUrl: string;
  timeoutMs: number;
  temperature?: number;
  maxTokens?: number;
  lastTokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number };

  constructor(
    apiKey?: string,
    model?: string,
    baseUrl?: string,
    timeoutMs?: number,
    options?: { temperature?: number; maxTokens?: number }
  ) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || "";
    this.model = model || process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct";
    this.baseUrl = validateSafeBaseUrl(baseUrl || process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1");
    this.timeoutMs = timeoutMs || Number(process.env.AI_TIMEOUT_MS) || 25000;
    this.temperature = options?.temperature;
    this.maxTokens = options?.maxTokens;
  }

  private getRequestHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey.trim()}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://nemolearn.vercel.app",
      "X-Title": "NemoLearn SMA AI",
    };
  }

  async testConnection(): Promise<AITestResult> {
    if (!this.apiKey || !this.apiKey.trim()) {
      return {
        success: false,
        provider: this.providerType,
        errorType: "CONFIG_MISSING",
        statusCode: 400,
        message: "API Key OpenRouter belum diisi. Masukkan API Key di Admin Settings atau environment variable OPENROUTER_API_KEY.",
      };
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const testTimeout = Math.min(this.timeoutMs, 12000);
    const timeoutId = setTimeout(() => controller.abort(), testTimeout);

    try {
      const endpoint = `${this.baseUrl}/chat/completions`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: this.getRequestHeaders(),
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: "Ketik 'OK' jika terhubung." }],
          max_tokens: 20,
          temperature: 0,
        }),
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorInfo = await this.parseErrorResponse(response);
        return {
          success: false,
          provider: this.providerType,
          errorType: errorInfo.code,
          statusCode: errorInfo.statusCode,
          message: errorInfo.message,
          model: this.model,
          latencyMs,
        };
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (!content && !data?.choices?.[0]) {
        return {
          success: false,
          provider: this.providerType,
          errorType: "EMPTY_RESPONSE",
          statusCode: 502,
          message: "Server OpenRouter merespons status 200 tetapi output teks kosong.",
          model: this.model,
          latencyMs,
        };
      }

      return {
        success: true,
        provider: this.providerType,
        message: `Koneksi ke OpenRouter (${this.model}) berhasil terverifikasi dalam ${latencyMs}ms!`,
        model: this.model,
        latencyMs,
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return {
          success: false,
          provider: this.providerType,
          errorType: "TIMEOUT",
          statusCode: 408,
          message: `Koneksi ke OpenRouter (${this.model}) timeout melebihi batas waktu ${Math.round(testTimeout / 1000)} detik.`,
          model: this.model,
          latencyMs: Date.now() - startTime,
        };
      }
      return {
        success: false,
        provider: this.providerType,
        errorType: "NETWORK_ERROR",
        statusCode: 500,
        message: `Gagal menghubungi OpenRouter: ${err?.message || err}`,
        model: this.model,
        latencyMs: Date.now() - startTime,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async generateQuestions(req: QuestionGenRequest): Promise<Question[]> {
    if (!this.apiKey || !this.apiKey.trim()) {
      throw new AIError(
        "CONFIG_MISSING",
        "API Key untuk OpenRouter belum dikonfigurasi. Silakan periksa pengaturan Admin atau environment server.",
        400
      );
    }

    const maxAttempts = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const isRetry = attempt > 1;
      const prompt = buildModularPrompt(req, isRetry);
      const systemInstruction = buildSystemPrompt();

      const controller = new AbortController();
      const attemptTimeout = this.timeoutMs + (attempt - 1) * 3000;
      const timeoutId = setTimeout(() => controller.abort(), attemptTimeout);

      try {
        const endpoint = `${this.baseUrl}/chat/completions`;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: this.getRequestHeaders(),
          signal: controller.signal,
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: prompt },
            ],
            temperature: this.temperature !== undefined ? this.temperature : req.mode === "hots" ? 0.35 : 0.2,
            max_tokens: this.maxTokens || (req.questionCount > 10 ? 4096 : 2500),
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          const errorInfo = await this.parseErrorResponse(response);
          throw new AIError(errorInfo.code, errorInfo.message, errorInfo.statusCode);
        }

        const data = await response.json();

        // Capture genuine token usage from OpenRouter API
        if (data?.usage) {
          this.lastTokenUsage = {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0,
          };
        }

        const rawContent = data?.choices?.[0]?.message?.content;
        if (!rawContent || !rawContent.trim()) {
          throw new AIError("EMPTY_RESPONSE", "OpenRouter mengembalikan konten kosong.", 502);
        }

        const jsonString = extractJsonString(rawContent);
        let parsed: any;
        try {
          parsed = JSON.parse(jsonString);
        } catch (e: any) {
          throw new AIError("INVALID_FORMAT", `Gagal mem-parse JSON dari OpenRouter: ${e.message}`, 502);
        }

        const rawQuestions: RawAiQuestionOutput[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.questions)
          ? parsed.questions
          : Array.isArray(parsed?.soal)
          ? parsed.soal
          : [];

        if (rawQuestions.length === 0) {
          throw new AIError("SCHEMA_VALIDATION_FAILED", "Struktur JSON tidak memuat butir soal yang valid.", 502);
        }

        const validatedQuestions = validateQuestionBatch(rawQuestions, req);
        if (validatedQuestions.length >= req.questionCount) {
          return validatedQuestions.slice(0, req.questionCount);
        }

        if (validatedQuestions.length > 0) {
          return validatedQuestions;
        }

        throw new AIError("SCHEMA_VALIDATION_FAILED", "Tidak ada butir soal yang lulus validasi kualitas.", 502);
      } catch (err: any) {
        lastError = err;
        if (err.name === "AbortError") {
          lastError = new AIError(
            "TIMEOUT",
            `Batas waktu pembuatan soal via OpenRouter terlampaui (${Math.round(attemptTimeout / 1000)} detik).`,
            408
          );
        }
        if (attempt === maxAttempts) break;
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (lastError instanceof AIError) throw lastError;
    throw new AIError(
      "SERVER_ERROR",
      lastError?.message || "Terjadi kesalahan saat memproses soal via OpenRouter.",
      500
    );
  }

  async generateExplanation(req: ExplanationGenRequest): Promise<string> {
    if (!this.apiKey || !this.apiKey.trim()) {
      throw new AIError(
        "CONFIG_MISSING",
        "API Key untuk OpenRouter belum dikonfigurasi.",
        400
      );
    }

    const prompt = buildExplanationPrompt(req);
    const controller = new AbortController();
    const expTimeout = Math.min(this.timeoutMs, 22000);
    const timeoutId = setTimeout(() => controller.abort(), expTimeout);

    try {
      const endpoint = `${this.baseUrl}/chat/completions`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: this.getRequestHeaders(),
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content:
                "Generator pembahasan soal SMA Kurikulum Merdeka. Format keluaran HANYA JSON valid: {\"explanation\": \"...\"}.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: req.depth === "mendalam" ? 2000 : req.depth === "singkat" ? 600 : 1200,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorInfo = await this.parseErrorResponse(response);
        throw new AIError(errorInfo.code, errorInfo.message, errorInfo.statusCode);
      }

      const data = await response.json();
      if (data?.usage) {
        this.lastTokenUsage = {
          promptTokens: data.usage.prompt_tokens || 0,
          completionTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0,
        };
      }

      const rawContent = data?.choices?.[0]?.message?.content;
      if (!rawContent || !rawContent.trim()) {
        throw new AIError("EMPTY_RESPONSE", "Respon pembahasan dari OpenRouter kosong.", 502);
      }

      const cleanJson = extractJsonString(rawContent);
      try {
        const parsed = JSON.parse(cleanJson);
        const explanation = parsed.explanation || parsed.pembahasan || parsed.content || rawContent;
        if (typeof explanation === "string" && explanation.trim().length > 10) {
          return explanation.trim();
        }
      } catch {
        if (cleanJson.length > 15) {
          return cleanJson.replace(/^\{?\s*"explanation"\s*:\s*"?/i, "").replace(/"?\s*\}?$/i, "").trim();
        }
      }

      return rawContent.trim();
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new AIError(
          "TIMEOUT",
          `Batas waktu pembuatan pembahasan OpenRouter terlampaui (${Math.round(expTimeout / 1000)} detik).`,
          408
        );
      }
      if (err instanceof AIError) throw err;
      throw new AIError("API_ERROR", err?.message || "Gagal menghasilkan pembahasan via OpenRouter.", 500);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async parseErrorResponse(
    response: Response
  ): Promise<{ code: any; message: string; statusCode: number }> {
    let errorMsg = `HTTP ${response.status}`;
    let errorCode = "";

    try {
      const errBody = await response.json();
      if (errBody?.error) {
        if (typeof errBody.error === "string") {
          errorMsg = errBody.error;
        } else if (errBody.error.message) {
          errorMsg = errBody.error.message;
          errorCode = errBody.error.code || errBody.error.type || "";
        }
      }
    } catch {
      const text = await response.text().catch(() => "");
      if (text) errorMsg = text;
    }

    console.error(`[OpenRouter Error] Status ${response.status}: ${errorMsg}`);

    // 402: Payment Required / Insufficient Credits
    if (response.status === 402 || errorMsg.toLowerCase().includes("credit") || errorMsg.toLowerCase().includes("payment")) {
      return {
        code: "QUOTA_EXHAUSTED",
        statusCode: 402,
        message: "Saldo / kredit akun OpenRouter Anda tidak mencukupi (402 Payment Required). Silakan lakukan top-up saldo di https://openrouter.ai.",
      };
    }

    // 401: Unauthorized / Invalid Key
    if (response.status === 401 || errorCode === "invalid_api_key" || errorMsg.toLowerCase().includes("invalid api key")) {
      return {
        code: "INVALID_KEY",
        statusCode: 401,
        message: "API Key OpenRouter tidak valid. Silakan periksa kredensial pada pengaturan Admin.",
      };
    }

    // 429: Rate Limit
    if (response.status === 429 || errorCode === "rate_limit_exceeded" || errorMsg.toLowerCase().includes("rate limit")) {
      return {
        code: "QUOTA_EXHAUSTED",
        statusCode: 429,
        message: "Batas frekuensi permintaan (Rate Limit) OpenRouter terlampaui. Silakan coba kembali dalam beberapa saat.",
      };
    }

    // 404 or 503: Model Unavailable
    if (response.status === 404 || response.status === 503 || errorCode === "model_not_found" || errorMsg.toLowerCase().includes("model")) {
      return {
        code: "MODEL_NOT_FOUND",
        statusCode: response.status,
        message: `Model OpenRouter '${this.model}' sedang tidak tersedia atau mengalami gangguan. Sistem dapat beralih ke model cadangan.`,
      };
    }

    if (response.status >= 500) {
      return {
        code: "SERVER_ERROR",
        statusCode: response.status,
        message: `Server OpenRouter mengalami gangguan internal (Status ${response.status}). Coba beberapa saat lagi.`,
      };
    }

    return {
      code: "API_ERROR",
      statusCode: response.status,
      message: `OpenRouter Error (${response.status}): ${errorMsg}`,
    };
  }
}
