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

export function validateSafeBaseUrl(rawUrl?: string): string {
  const defaultUrl = "https://api.openai.com/v1";
  if (!rawUrl || !rawUrl.trim()) return defaultUrl;

  let urlStr = rawUrl.trim();
  if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
    urlStr = "https://" + urlStr;
  }

  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new AIError(
      "INVALID_CONFIG",
      `Format Base URL tidak valid: '${rawUrl}'. Gunakan URL lengkap seperti https://api.openai.com/v1`,
      400
    );
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new AIError(
      "INVALID_CONFIG",
      "Protokol Base URL harus berupa http atau https.",
      400
    );
  }

  const hostname = parsed.hostname.toLowerCase();

  // SSRF Protection: Block private and link-local address ranges
  const blockedHostPatterns = [
    /^localhost$/i,
    /^127\.\d+\.\d+\.\d+$/,
    /^0\.0\.0\.0$/,
    /^::1$/,
    /^\[::1\]$/,
    /^10\.\d+\.\d+\.\d+$/,
    /^192\.168\.\d+\.\d+$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
    /^169\.254\.\d+\.\d+$/, // AWS / Cloud metadata service
    /\.local$/i,
    /\.internal$/i,
  ];

  for (const pattern of blockedHostPatterns) {
    if (pattern.test(hostname)) {
      throw new AIError(
        "INVALID_CONFIG",
        `Base URL diblokir demi keamanan server (alamat loopback/jaringan lokal tidak diizinkan): ${hostname}`,
        400
      );
    }
  }

  // Remove trailing slashes
  return parsed.origin + parsed.pathname.replace(/\/+$/, "");
}

export class OpenAIProvider implements AIProvider {
  name: string;
  providerType: AIProviderType;
  apiKey: string;
  model: string;
  baseUrl: string;
  timeoutMs: number;
  lastTokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number };

  constructor(
    apiKey?: string,
    model?: string,
    baseUrl?: string,
    timeoutMs?: number,
    providerType: "openai" | "openai-compatible" = "openai"
  ) {
    this.providerType = providerType;
    this.name = providerType === "openai" ? "OpenAI API Provider" : "OpenAI-Compatible Provider";
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
    this.model = model || process.env.OPENAI_MODEL || "gpt-4o-mini";
    this.baseUrl = validateSafeBaseUrl(baseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1");
    this.timeoutMs = timeoutMs || Number(process.env.AI_TIMEOUT_MS) || 20000;
  }

  async testConnection(): Promise<AITestResult> {
    if (!this.apiKey || !this.apiKey.trim()) {
      return {
        success: false,
        provider: this.providerType,
        errorType: "CONFIG_MISSING",
        statusCode: 400,
        message: "API Key belum diisi. Masukkan OpenAI / Compatible API Key sebelum menguji koneksi.",
      };
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const testTimeout = Math.min(this.timeoutMs, 12000);
    const timeoutId = setTimeout(() => controller.abort(), testTimeout);

    try {
      const endpoint = `${this.baseUrl}/chat/completions`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey.trim()}`,
      };

      if (this.baseUrl.includes("openrouter.ai")) {
        headers["HTTP-Referer"] = "https://nemolearn.edu";
        headers["X-Title"] = "NemoLearn Platform";
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: "Ketik 'OK' jika aktif." }],
          max_tokens: 50,
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
          message: "Server merespons status 200 tetapi choices teks kosong.",
          model: this.model,
          latencyMs,
        };
      }

      return {
        success: true,
        provider: this.providerType,
        message: `Koneksi ke ${this.name} (${this.model}) berhasil terhubung dalam ${latencyMs}ms!`,
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
          message: `Koneksi ke ${this.name} melebihi batas waktu (${Math.round(testTimeout / 1000)} detik).`,
          model: this.model,
        };
      }
      if (err.code === "ENOTFOUND" || err.message?.includes("fetch failed") || err.message?.includes("network")) {
        return {
          success: false,
          provider: this.providerType,
          errorType: "NETWORK_ERROR",
          statusCode: 503,
          message: `Gagal terhubung ke host '${this.baseUrl}'. Periksa koneksi internet atau base URL.`,
          model: this.model,
        };
      }
      return {
        success: false,
        provider: this.providerType,
        errorType: "UNKNOWN_ERROR",
        statusCode: 500,
        message: err.message || "Gagal menguji koneksi OpenAI / Compatible provider.",
        model: this.model,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async generateQuestions(req: QuestionGenRequest): Promise<Question[]> {
    if (!this.apiKey || !this.apiKey.trim()) {
      throw new AIError(
        "CONFIG_MISSING",
        `API Key untuk ${this.name} belum dikonfigurasi pada server. Silakan hubungi admin atau periksa environment server.`,
        400
      );
    }

    const MAX_ATTEMPTS = 2; // Batasi retry: 1 percobaan awal + maksimal 1 retry (mencegah loop tak hingga)
    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const isRetry = attempt > 1;
      const prompt = this.buildPrompt(req, isRetry);
      const controller = new AbortController();
      // Dynamic timeout based on batch question count (minimum 25s for reliable inference)
      const callTimeoutMs = Math.max(this.timeoutMs, 15000 + req.questionCount * 2500);
      const timeoutId = setTimeout(() => controller.abort(), callTimeoutMs);

      try {
        const endpoint = `${this.baseUrl}/chat/completions`;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey.trim()}`,
        };

        if (this.baseUrl.includes("openrouter.ai")) {
          headers["HTTP-Referer"] = "https://nemolearn.edu";
          headers["X-Title"] = "NemoLearn Platform";
        }

        const bodyPayload: any = {
          model: this.model,
          messages: [
            {
              role: "system",
              content: buildSystemPrompt(),
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: req.mode === "hots" ? 0.7 : 0.4,
          max_tokens: Math.max(2500, req.questionCount * 750),
        };

        // Add response_format json_object if supported by model/provider (attempt 1 only)
        if (attempt === 1) {
          bodyPayload.response_format = { type: "json_object" };
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          signal: controller.signal,
          body: JSON.stringify(bodyPayload),
        });

        if (!response.ok) {
          const errorInfo = await this.parseErrorResponse(response);
          throw new AIError(errorInfo.code, errorInfo.message, errorInfo.statusCode);
        }

        const data = await response.json();

        // Capture genuine token usage from OpenAI API
        if (data?.usage) {
          this.lastTokenUsage = {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0,
          };
        }

        const choice = data?.choices?.[0];

        if (!choice) {
          throw new AIError("EMPTY_RESPONSE", `Respon dari ${this.name} tidak memiliki choices jawaban.`, 502);
        }

        const rawContent = choice?.message?.content;
        if (!rawContent || !rawContent.trim()) {
          throw new AIError("EMPTY_RESPONSE", "Teks respon dari model AI kosong.", 502);
        }

        // Clean markdown fences and isolate valid JSON
        const cleanJson = extractJsonString(rawContent);

        let parsed: RawAiQuestionOutput[];
        try {
          const jsonObj = JSON.parse(cleanJson);
          if (Array.isArray(jsonObj)) {
            parsed = jsonObj;
          } else if (Array.isArray(jsonObj.questions)) {
            parsed = jsonObj.questions;
          } else if (Array.isArray(jsonObj.soal)) {
            parsed = jsonObj.soal;
          } else {
            // Look for any array inside the object
            const firstArrayKey = Object.keys(jsonObj).find((k) => Array.isArray(jsonObj[k]));
            if (firstArrayKey) {
              parsed = jsonObj[firstArrayKey];
            } else {
              throw new Error("Tidak ditemukan array soal dalam output JSON");
            }
          }
        } catch (err: any) {
          console.error(`[${this.name} Error] JSON parsing failed:`, cleanJson.substring(0, 200));
          throw new AIError(
            "INVALID_FORMAT",
            `Format respon dari ${this.name} tidak dapat diuraikan sebagai JSON yang valid. Silakan coba lagi.`,
            502
          );
        }

        // Run strict schema and content validation
        const validated = validateQuestionBatch(parsed, req);
        if (validated.length === 0) {
          throw new AIError(
            "SCHEMA_VALIDATION_FAILED",
            "Soal dari AI tidak memenuhi standar validasi kurikulum SMA (opsi kurang lengkap atau kunci jawaban tidak valid).",
            502
          );
        }

        // Ensure proper source attribution
        validated.forEach((q) => {
          q.isAiGenerated = true;
          q.sourceType = "ai";
          q.sourceReference = `${this.name} (${this.model}) - ${req.subjectName}`;
        });

        return validated;
      } catch (err: any) {
        lastError = err;

        // AbortError dari fetch timeout HARUS langsung melempar AIError TIMEOUT tanpa retry!
        if (err?.name === "AbortError") {
          throw new AIError(
            "TIMEOUT",
            `Batas waktu pembuatan soal terlampaui (${Math.round(callTimeoutMs / 1000)} detik). Silakan coba lagi dengan jumlah soal lebih sedikit.`,
            408
          );
        }

        // Jangan retry pada error fatal
        if (
          err instanceof AIError &&
          (err.code === "CONFIG_MISSING" ||
            err.code === "INVALID_KEY" ||
            err.code === "QUOTA_EXHAUSTED" ||
            err.code === "MODEL_NOT_FOUND" ||
            err.code === "FORBIDDEN" ||
            err.code === "INVALID_CONFIG" ||
            err.code === "TIMEOUT")
        ) {
          throw err;
        }

        if (attempt < MAX_ATTEMPTS) {
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
          console.warn(`[${this.name}] Percobaan ${attempt} gagal (${err.message}). Menunggu ${backoffDelay}ms sebelum retry (exponential backoff)...`);
          if (process.env.NODE_ENV !== "test") {
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          }
          continue;
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (lastError instanceof AIError) throw lastError;
    if (lastError?.name === "AbortError") {
      throw new AIError(
        "TIMEOUT",
        `Batas waktu pembuatan soal terlampaui (${Math.round(this.timeoutMs / 1000)} detik). Silakan coba lagi dengan jumlah soal lebih sedikit.`,
        408
      );
    }
    if (lastError?.code === "ENOTFOUND" || lastError?.message?.includes("fetch failed") || lastError?.message?.includes("network")) {
      throw new AIError(
        "NETWORK_ERROR",
        `Gagal menghubungi host AI provider (${this.baseUrl}). Periksa jaringan atau URL provider.`,
        503
      );
    }
    throw new AIError(
      "UNKNOWN_ERROR",
      lastError?.message || `Terjadi kesalahan saat memproses soal via ${this.name}.`,
      500
    );
  }

  async generateExplanation(req: ExplanationGenRequest): Promise<string> {
    if (!this.apiKey || !this.apiKey.trim()) {
      throw new AIError(
        "CONFIG_MISSING",
        `API Key untuk ${this.name} belum dikonfigurasi pada server. Silakan hubungi admin atau periksa environment server.`,
        400
      );
    }

    const prompt = buildExplanationPrompt(req);
    const controller = new AbortController();
    const expTimeout = Math.min(this.timeoutMs, 20000);
    const timeoutId = setTimeout(() => controller.abort(), expTimeout);

    try {
      const endpoint = `${this.baseUrl}/chat/completions`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey.trim()}`,
      };

      if (this.baseUrl.includes("openrouter.ai")) {
        headers["HTTP-Referer"] = "https://nemolearn.edu";
        headers["X-Title"] = "NemoLearn Platform";
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content: "Generator pembahasan soal SMA Kurikulum Merdeka. Format keluaran HANYA JSON valid: {\"explanation\": \"...\"}.",
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

      // Capture genuine token usage from OpenAI API
      if (data?.usage) {
        this.lastTokenUsage = {
          promptTokens: data.usage.prompt_tokens || 0,
          completionTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0,
        };
      }

      const rawContent = data?.choices?.[0]?.message?.content;

      if (!rawContent || !rawContent.trim()) {
        throw new AIError("EMPTY_RESPONSE", `Respon pembahasan dari ${this.name} kosong.`, 502);
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
          `Batas waktu pembuatan pembahasan terlampaui (${Math.round(expTimeout / 1000)} detik). Silakan coba lagi.`,
          408
        );
      }
      if (err instanceof AIError) throw err;
      throw new AIError("API_ERROR", err?.message || `Gagal menghasilkan pembahasan via ${this.name}.`, 500);
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

    console.error(`[${this.name} Error] Status ${response.status}: ${errorMsg}`);

    if (
      response.status === 401 ||
      errorCode === "invalid_api_key" ||
      errorMsg.toLowerCase().includes("invalid api key") ||
      errorMsg.toLowerCase().includes("incorrect api key")
    ) {
      return {
        code: "INVALID_KEY",
        statusCode: 401,
        message: `API Key untuk ${this.name} tidak valid atau salah.`,
      };
    }

    if (response.status === 403) {
      const isCountry = errorMsg.toLowerCase().includes("country") || errorMsg.toLowerCase().includes("region");
      return {
        code: "FORBIDDEN",
        statusCode: 403,
        message: isCountry
          ? `Akses ke ${this.name} dibatasi di wilayah geografis ini (Region/Country restriction).`
          : `Akses ke ${this.name} ditolak (403 Forbidden): ${errorMsg}`,
      };
    }

    if (
      response.status === 429 ||
      errorCode === "insufficient_quota" ||
      errorCode === "rate_limit_exceeded" ||
      errorMsg.toLowerCase().includes("quota") ||
      errorMsg.toLowerCase().includes("rate limit")
    ) {
      return {
        code: "QUOTA_EXHAUSTED",
        statusCode: 429,
        message: `Kuota untuk ${this.name} telah habis atau terkena pembatasan laju request (Rate Limit).`,
      };
    }

    if (
      response.status === 404 ||
      errorCode === "model_not_found" ||
      errorMsg.toLowerCase().includes("does not exist") ||
      errorMsg.toLowerCase().includes("model_not_found")
    ) {
      return {
        code: "MODEL_NOT_FOUND",
        statusCode: 404,
        message: `Model '${this.model}' tidak ditemukan atau tidak tersedia pada endpoint ${this.baseUrl}.`,
      };
    }

    if (response.status >= 500) {
      return {
        code: "SERVER_ERROR",
        statusCode: response.status,
        message: `Server ${this.name} mengalami gangguan (Status ${response.status}). Coba beberapa saat lagi.`,
      };
    }

    return {
      code: "API_ERROR",
      statusCode: response.status,
      message: `${this.name} Error (${response.status}): ${errorMsg}`,
    };
  }

  private buildPrompt(req: QuestionGenRequest, isRetry = false): string {
    return buildModularPrompt(req, isRetry);
  }
}
