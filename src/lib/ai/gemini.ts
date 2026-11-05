import { AIProvider, QuestionGenRequest, RawAiQuestionOutput, AIError, AITestResult, ExplanationGenRequest } from "@/types/ai";
import { Question } from "@/types/question";
import { validateQuestionBatch } from "./validator";
import { buildModularPrompt, buildExplanationPrompt } from "./prompt";

/**
 * Sanitizes unescaped backslashes inside JSON string literals so LaTeX mathematical
 * formulas (e.g. \frac, \text, \lambda, \sqrt, \alpha, \sum, \int) do not break JSON.parse.
 */
export function sanitizeLatexInJson(jsonStr: string): string {
  let inString = false;
  let result = "";
  let i = 0;

  while (i < jsonStr.length) {
    const char = jsonStr[i];

    if (!inString) {
      if (char === '"') {
        inString = true;
      }
      result += char;
      i++;
      continue;
    }

    // Inside a JSON string literal
    if (char === '"') {
      inString = false;
      result += char;
      i++;
      continue;
    }

    if (char === '\\') {
      const nextChar = jsonStr[i + 1];
      if (nextChar === undefined) {
        result += '\\\\';
        i++;
        continue;
      }

      // Check if it's already an escaped backslash: \\
      if (nextChar === '\\') {
        result += '\\\\';
        i += 2;
        continue;
      }

      // Check if it's an escaped quote: \"
      if (nextChar === '"') {
        result += '\\"';
        i += 2;
        continue;
      }

      // Check if it's unicode escape: \uXXXX
      if (nextChar === 'u' && /^[0-9a-fA-F]{4}/.test(jsonStr.substring(i + 2, i + 6))) {
        result += jsonStr.substring(i, i + 6);
        i += 6;
        continue;
      }

      // Check for LaTeX commands starting with control letters (f, t, b, r, n)
      const remaining = jsonStr.substring(i + 1);
      if (
        (nextChar === 'f' && /^(?:frac|flat|forall|frown)\b/i.test(remaining)) ||
        (nextChar === 't' && /^(?:text|times|theta|tau|tan|tanh|to|top|triangle|tilde)\b/i.test(remaining)) ||
        (nextChar === 'b' && /^(?:beta|bar|begin|mathbf|boldsymbol|bmatrix|bmod|bullet|bot)\b/i.test(remaining)) ||
        (nextChar === 'r' && /^(?:rho|right|rangle|rfloor|rceil|Re)\b/i.test(remaining)) ||
        (nextChar === 'n' && /^(?:nu|nabla|neq|ne|not|natural|ni)\b/i.test(remaining))
      ) {
        result += '\\\\';
        i++;
        continue;
      }

      // Standard JSON single control characters: \n, \t, \r, \b, \f, \/
      // ONLY if followed by non-alpha character or end of string
      if (/^[bfnrt\/]/.test(nextChar)) {
        const after = jsonStr[i + 2];
        if (!after || !/[a-zA-Z]/.test(after)) {
          result += char + nextChar;
          i += 2;
          continue;
        }
      }

      // Any other backslash in a string literal (e.g. \lambda, \sqrt, \alpha, \[, \])
      // must be escaped to \\ so JSON.parse keeps the literal backslash.
      result += '\\\\';
      i++;
      continue;
    }

    result += char;
    i++;
  }

  return result;
}

export function extractJsonString(rawText: string): string {
  let cleaned = rawText.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  }

  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  let target = cleaned;
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    if (firstBrace === -1 || firstBracket < firstBrace) {
      target = cleaned.substring(firstBracket, lastBracket + 1);
    }
  } else if (firstBrace !== -1 && lastBrace > firstBrace) {
    target = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return sanitizeLatexInJson(target);
}

export class GeminiAIProvider implements AIProvider {
  name = "Google Gemini AI Provider";
  providerType = "gemini" as const;
  apiKey: string;
  model: string;
  timeoutMs: number;
  lastTokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number };

  constructor(apiKey?: string, model?: string, timeoutMs?: number) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
    this.model = model || process.env.GEMINI_MODEL || "gemini-1.5-flash";
    this.timeoutMs = timeoutMs || Number(process.env.AI_TIMEOUT_MS) || 20000;
  }

  async testConnection(): Promise<AITestResult> {
    if (!this.apiKey || !this.apiKey.trim()) {
      return {
        success: false,
        errorType: "CONFIG_MISSING",
        statusCode: 400,
        message: "API Key belum diisi atau dikonfigurasi. Silakan masukkan Gemini API Key Anda.",
      };
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const testTimeout = Math.min(this.timeoutMs, 12000);
    const timeoutId = setTimeout(() => controller.abort(), testTimeout);

    try {
      // Use clean URL without exposing API key in query parameters
      const cleanModel = this.model.replace(/^models\//, "");
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey.trim(),
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: "Tes koneksi. Jawab singkat: OK." }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 50,
            temperature: 0,
          },
        }),
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorInfo = await this.parseGeminiErrorResponse(response);
        return {
          success: false,
          errorType: errorInfo.code,
          statusCode: errorInfo.statusCode,
          message: errorInfo.message,
          model: this.model,
          latencyMs,
        };
      }

      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!reply && !data?.candidates?.[0]) {
        return {
          success: false,
          errorType: "EMPTY_RESPONSE",
          statusCode: 502,
          message: "Server Gemini merespons status 200 tetapi tidak mengembalikan kandidat teks.",
          model: this.model,
          latencyMs,
        };
      }

      return {
        success: true,
        message: `Koneksi ke Google Gemini AI berhasil! Model '${this.model}' merespons dalam ${latencyMs}ms.`,
        provider: "gemini",
        model: this.model,
        latencyMs,
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return {
          success: false,
          errorType: "TIMEOUT",
          statusCode: 408,
          message: `Koneksi ke Gemini API melebihi batas waktu (${Math.round(testTimeout / 1000)} detik).`,
          model: this.model,
        };
      }
      if (err.code === "ENOTFOUND" || err.message?.includes("fetch failed") || err.message?.includes("network")) {
        return {
          success: false,
          errorType: "NETWORK_ERROR",
          statusCode: 503,
          message: "Gagal terhubung ke server Google Gemini API. Periksa koneksi internet atau firewall.",
          model: this.model,
        };
      }
      return {
        success: false,
        errorType: "UNKNOWN_ERROR",
        statusCode: 500,
        message: err.message || "Terjadi kesalahan saat menguji koneksi AI.",
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
        "GEMINI_API_KEY belum dikonfigurasi. Silakan simpan API Key di pengaturan akun atau .env.",
        400
      );
    }

    const MAX_ATTEMPTS = 2; // Batasi retry: 1 percobaan awal + maksimal 1 retry (mencegah loop tak hingga)
    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const isRetry = attempt > 1;
      const prompt = this.buildPrompt(req, isRetry);
      const controller = new AbortController();
      // Dynamic timeout based on batch question count (minimum 25s for reliable generation)
      const callTimeoutMs = Math.max(this.timeoutMs, 15000 + req.questionCount * 2500);
      const timeoutId = setTimeout(() => controller.abort(), callTimeoutMs);

      try {
        // Use clean URL without exposing API key in query parameters
        const cleanModel = this.model.replace(/^models\//, "");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": this.apiKey.trim(),
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: req.mode === "hots" ? 0.7 : 0.4,
              maxOutputTokens: Math.max(2500, req.questionCount * 750),
              responseMimeType: "application/json",
            },
          }),
        });

        if (!response.ok) {
          const errorInfo = await this.parseGeminiErrorResponse(response);
          throw new AIError(errorInfo.code, errorInfo.message, errorInfo.statusCode);
        }

        const data = await response.json();

        // Capture genuine token usage from Google Gemini API
        if (data?.usageMetadata) {
          this.lastTokenUsage = {
            promptTokens: data.usageMetadata.promptTokenCount || 0,
            completionTokens: data.usageMetadata.candidatesTokenCount || 0,
            totalTokens: data.usageMetadata.totalTokenCount || 0,
          };
        }

        const candidate = data?.candidates?.[0];

        if (!candidate) {
          if (data?.promptFeedback?.blockReason) {
            throw new AIError(
              "CONTENT_FILTERED",
              `Prompt diblokir oleh kebijakan keamanan konten AI: ${data.promptFeedback.blockReason}`,
              422
            );
          }
          throw new AIError("EMPTY_RESPONSE", "Respon AI kosong atau tidak mengembalikan kandidat soal.", 502);
        }

        if (candidate.finishReason === "SAFETY") {
          throw new AIError(
            "CONTENT_FILTERED",
            "Keluaran soal AI dihentikan karena kebijakan penyaringan konten Google.",
            422
          );
        }

        const rawText = candidate?.content?.parts?.[0]?.text;
        if (!rawText || !rawText.trim()) {
          throw new AIError("EMPTY_RESPONSE", "Teks respon soal dari AI kosong.", 502);
        }

        // Clean markdown code blocks and isolate valid JSON substring
        const cleanJson = extractJsonString(rawText);

        let parsed: RawAiQuestionOutput[];
        try {
          parsed = JSON.parse(cleanJson);
          if (!Array.isArray(parsed) && Array.isArray((parsed as any).questions)) {
            parsed = (parsed as any).questions;
          }
          if (!Array.isArray(parsed)) {
            throw new Error("Root object bukan array");
          }
        } catch (err: any) {
          console.error("[GeminiAIProvider Error] JSON parsing failed from model response:", cleanJson.substring(0, 200));
          throw new AIError(
            "INVALID_FORMAT",
            "Format keluaran AI tidak valid (gagal parsing JSON). Silakan coba lagi.",
            502
          );
        }

        // Run strict schema and content validation
        const validated = validateQuestionBatch(parsed, req);
        if (validated.length === 0) {
          throw new AIError(
            "SCHEMA_VALIDATION_FAILED",
            "Soal dari AI tidak memenuhi standar validasi kurikulum SMA (opsi tidak lengkap atau kunci jawaban tidak valid).",
            502
          );
        }

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

        // Jangan retry jika error bersifat fatal (autentikasi, kuota, model tidak ada, format config)
        if (
          err instanceof AIError &&
          (err.code === "CONFIG_MISSING" ||
            err.code === "INVALID_KEY" ||
            err.code === "QUOTA_EXHAUSTED" ||
            err.code === "MODEL_NOT_FOUND" ||
            err.code === "CONTENT_FILTERED" ||
            err.code === "INVALID_CONFIG" ||
            err.code === "TIMEOUT")
        ) {
          throw err;
        }

        if (attempt < MAX_ATTEMPTS) {
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
          console.warn(`[GeminiAIProvider] Percobaan ${attempt} gagal (${err.message}). Menunggu ${backoffDelay}ms sebelum retry (exponential backoff)...`);
          if (process.env.NODE_ENV !== "test") {
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          }
          continue;
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (lastError instanceof AIError) {
      throw lastError;
    }
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
        "Gagal menghubungi server Google Gemini API. Periksa koneksi internet Anda.",
        503
      );
    }
    throw new AIError(
      "UNKNOWN_ERROR",
      lastError?.message || "Terjadi kesalahan internal saat memproses soal AI.",
      500
    );
  }

  async generateExplanation(req: ExplanationGenRequest): Promise<string> {
    if (!this.apiKey || !this.apiKey.trim()) {
      throw new AIError(
        "CONFIG_MISSING",
        "GEMINI_API_KEY belum dikonfigurasi. Silakan simpan API Key di pengaturan akun atau .env.",
        400
      );
    }

    const prompt = buildExplanationPrompt(req);
    const controller = new AbortController();
    const expTimeout = Math.min(this.timeoutMs, 20000);
    const timeoutId = setTimeout(() => controller.abort(), expTimeout);

    try {
      const cleanModel = this.model.replace(/^models\//, "");
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey.trim(),
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: req.depth === "mendalam" ? 2000 : req.depth === "singkat" ? 600 : 1200,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        const errorInfo = await this.parseGeminiErrorResponse(response);
        throw new AIError(errorInfo.code, errorInfo.message, errorInfo.statusCode);
      }

      const data = await response.json();

      // Capture genuine token usage from Google Gemini API
      if (data?.usageMetadata) {
        this.lastTokenUsage = {
          promptTokens: data.usageMetadata.promptTokenCount || 0,
          completionTokens: data.usageMetadata.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata.totalTokenCount || 0,
        };
      }

      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText || !rawText.trim()) {
        throw new AIError("EMPTY_RESPONSE", "Respon pembahasan dari Gemini AI kosong.", 502);
      }

      const cleanJson = extractJsonString(rawText);
      try {
        const parsed = JSON.parse(cleanJson);
        const explanation = parsed.explanation || parsed.pembahasan || parsed.content || rawText;
        if (typeof explanation === "string" && explanation.trim().length > 10) {
          return explanation.trim();
        }
      } catch {
        if (cleanJson.length > 15) {
          return cleanJson.replace(/^\{?\s*"explanation"\s*:\s*"?/i, "").replace(/"?\s*\}?$/i, "").trim();
        }
      }

      return rawText.trim();
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new AIError(
          "TIMEOUT",
          `Batas waktu pembuatan pembahasan terlampaui (${Math.round(expTimeout / 1000)} detik). Silakan coba lagi.`,
          408
        );
      }
      if (err instanceof AIError) throw err;
      throw new AIError("API_ERROR", err?.message || "Gagal menghasilkan pembahasan AI.", 500);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async parseGeminiErrorResponse(
    response: Response
  ): Promise<{ code: any; message: string; statusCode: number }> {
    let errorMsg = `Status ${response.status}`;
    let errorStatus = "";
    let reason = "";

    try {
      const errBody = await response.json();
      if (errBody?.error) {
        errorMsg = errBody.error.message || errorMsg;
        errorStatus = errBody.error.status || "";
        if (errBody.error.details && Array.isArray(errBody.error.details)) {
          const detail = errBody.error.details.find((d: any) => d.reason);
          if (detail?.reason) reason = detail.reason;
        }
      }
    } catch {
      const text = await response.text().catch(() => "");
      if (text) errorMsg = text;
    }

    // Never log raw API key!
    console.error(`[AIProvider Error] Gemini API returned ${response.status} (${errorStatus}): ${errorMsg}`);

    const isApiKeyError =
      reason === "API_KEY_INVALID" ||
      errorMsg.toLowerCase().includes("api key not valid") ||
      errorMsg.toLowerCase().includes("invalid api key") ||
      errorMsg.toLowerCase().includes("api_key_invalid") ||
      errorMsg.toLowerCase().includes("unregistered callers") ||
      errorMsg.toLowerCase().includes("please pass a valid api key");

    if (isApiKeyError) {
      return {
        code: "INVALID_KEY",
        statusCode: 400,
        message: "API Key Gemini tidak valid atau belum diaktifkan di Google AI Studio.",
      };
    }

    if (
      response.status === 403 ||
      response.status === 429 ||
      errorStatus === "RESOURCE_EXHAUSTED" ||
      reason === "RATE_LIMIT_EXCEEDED" ||
      errorMsg.toLowerCase().includes("quota") ||
      errorMsg.toLowerCase().includes("rate limit")
    ) {
      return {
        code: "QUOTA_EXHAUSTED",
        statusCode: 429,
        message: "Kuota Google Gemini API telah habis atau terkena pembatasan laju (Rate Limit). Silakan coba lagi nanti atau gunakan API Key lain.",
      };
    }

    if (
      response.status === 404 ||
      errorStatus === "NOT_FOUND" ||
      errorMsg.toLowerCase().includes("not found")
    ) {
      return {
        code: "MODEL_NOT_FOUND",
        statusCode: 404,
        message: `Model AI '${this.model}' tidak ditemukan atau tidak tersedia untuk API key ini. Coba pilih model resmi Google seperti gemini-1.5-flash atau gemini-2.0-flash.`,
      };
    }

    if (
      response.status === 400 ||
      errorStatus === "INVALID_ARGUMENT"
    ) {
      return {
        code: "INVALID_CONFIG",
        statusCode: 400,
        message: `Permintaan ditolak oleh Google Gemini API (INVALID_ARGUMENT): ${errorMsg}`,
      };
    }

    if (response.status >= 500) {
      return {
        code: "SERVER_ERROR",
        statusCode: response.status,
        message: `Server Google Gemini sedang mengalami gangguan internal (Status ${response.status}). Silakan coba beberapa saat lagi.`,
      };
    }

    return {
      code: "API_ERROR",
      statusCode: response.status,
      message: `Gemini API Error (${response.status}): ${errorMsg}`,
    };
  }

  private buildPrompt(req: QuestionGenRequest, isRetry = false): string {
    return buildModularPrompt(req, isRetry);
  }
}
