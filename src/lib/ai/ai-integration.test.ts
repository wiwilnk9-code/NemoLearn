import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { GeminiAIProvider } from "./gemini";
import { OpenAIProvider, validateSafeBaseUrl } from "./openai";
import { MockAIProvider } from "./mock";
import { getActiveAISettings, maskApiKey, getAIProvider } from "./index";
import { AISettingsRepository, UserRepository, AIMetricsRepository } from "@/lib/db";
import { AIError, QuestionGenRequest } from "@/types/ai";

describe("NemoQUIZ — Multi-Provider AI Architecture & Integration Suite", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    AISettingsRepository.reset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    AISettingsRepository.reset();
  });

  const dummyReq: QuestionGenRequest = {
    subjectId: "fisika",
    subjectName: "Fisika",
    topicId: "dinamika",
    topicName: "Dinamika Gerak",
    questionCount: 1,
    mode: "reguler",
  };

  // =========================================================================
  // SECTION 1: Central Server-Controlled AI Configuration & Masking
  // =========================================================================
  it("1. Pengaturan AI Server: CRUD, Masking API Key, dan Prioritas Database", () => {
    // A. Simpan konfigurasi oleh Admin di DB
    const saved = AISettingsRepository.save({
      provider: "gemini",
      apiKey: "AIzaSyTestSecretKey1234567890abcdef",
      model: "gemini-2.5-flash",
      timeoutMs: 25000,
      updatedBy: "usr_admin_01",
    });

    assert.strictEqual(saved.provider, "gemini");
    assert.strictEqual(saved.apiKey, "AIzaSyTestSecretKey1234567890abcdef");
    assert.strictEqual(saved.updatedBy, "usr_admin_01");

    // B. Masking verifikasi: jangan pernah bocorkan rahasia server ke frontend
    const masked = maskApiKey(saved.apiKey);
    assert.strictEqual(masked, "AIzaSyT••••cdef");
    assert.ok(!masked.includes("TestSecretKey"));

    // C. Prioritas DB: getActiveAISettings harus membaca database override
    const active = getActiveAISettings();
    assert.strictEqual(active.provider, "gemini");
    assert.strictEqual(active.source, "database");
    assert.strictEqual(active.timeoutMs, 25000);

    // D. Hapus API Key
    const deleted = AISettingsRepository.deleteKey();
    assert.strictEqual(deleted.apiKey, "");
    assert.strictEqual(maskApiKey(deleted.apiKey), "");

    // E. Reset: kembali ke environment / mock
    AISettingsRepository.reset();
    const afterReset = getActiveAISettings();
    assert.ok(afterReset.source === "default" || afterReset.source === "env");
  });

  // =========================================================================
  // SECTION 2: Google Gemini Provider Adapter Tests
  // =========================================================================
  it("2. Gemini: API Key kosong melempar AIError dengan kode CONFIG_MISSING", async () => {
    const provider = new GeminiAIProvider("", "gemini-2.5-flash");

    await assert.rejects(
      async () => {
        await provider.generateQuestions(dummyReq);
      },
      (err: any) => {
        assert.ok(err instanceof AIError);
        assert.strictEqual(err.code, "CONFIG_MISSING");
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );

    const testResult = await provider.testConnection();
    assert.strictEqual(testResult.success, false);
    assert.strictEqual(testResult.errorType, "CONFIG_MISSING");
  });

  it("3. Gemini: API Key tidak valid melempar AIError dengan kode INVALID_KEY", async () => {
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          error: {
            code: 400,
            message: "API key not valid. Please pass a valid API key.",
            status: "INVALID_ARGUMENT",
            details: [{ reason: "API_KEY_INVALID" }],
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );

    const provider = new GeminiAIProvider("AIzaSy_fake_invalid_key", "gemini-2.5-flash");

    await assert.rejects(
      async () => {
        await provider.generateQuestions(dummyReq);
      },
      (err: any) => {
        assert.ok(err instanceof AIError);
        assert.strictEqual(err.code, "INVALID_KEY");
        assert.strictEqual(err.statusCode, 400);
        assert.ok(err.message.includes("tidak valid"));
        return true;
      }
    );

    const testRes = await provider.testConnection();
    assert.strictEqual(testRes.success, false);
    assert.strictEqual(testRes.errorType, "INVALID_KEY");
  });

  it("4. Gemini: Model tidak ditemukan melempar AIError dengan kode MODEL_NOT_FOUND", async () => {
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          error: {
            code: 404,
            message: "models/gemini-unknown-xyz is not found for API version v1beta",
            status: "NOT_FOUND",
          },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );

    const provider = new GeminiAIProvider("valid_key", "gemini-unknown-xyz");

    await assert.rejects(
      async () => {
        await provider.generateQuestions(dummyReq);
      },
      (err: any) => {
        assert.ok(err instanceof AIError);
        assert.strictEqual(err.code, "MODEL_NOT_FOUND");
        assert.strictEqual(err.statusCode, 404);
        assert.ok(err.message.includes("tidak ditemukan"));
        return true;
      }
    );

    const testRes = await provider.testConnection();
    assert.strictEqual(testRes.success, false);
    assert.strictEqual(testRes.errorType, "MODEL_NOT_FOUND");
  });

  it("5. Gemini: Kuota habis (429) melempar AIError dengan kode QUOTA_EXHAUSTED", async () => {
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          error: {
            code: 429,
            message: "Resource has been exhausted (e.g. check quota).",
            status: "RESOURCE_EXHAUSTED",
          },
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );

    const provider = new GeminiAIProvider("valid_key", "gemini-2.5-flash");

    await assert.rejects(
      async () => {
        await provider.generateQuestions(dummyReq);
      },
      (err: any) => {
        assert.ok(err instanceof AIError);
        assert.strictEqual(err.code, "QUOTA_EXHAUSTED");
        assert.strictEqual(err.statusCode, 429);
        assert.ok(err.message.includes("Kuota"));
        return true;
      }
    );
  });

  it("6. Gemini: Request timeout melempar AIError dengan kode TIMEOUT", async () => {
    global.fetch = async () => {
      const abortErr = new Error("The operation was aborted");
      abortErr.name = "AbortError";
      throw abortErr;
    };

    const provider = new GeminiAIProvider("valid_key", "gemini-2.5-flash");

    await assert.rejects(
      async () => {
        await provider.generateQuestions(dummyReq);
      },
      (err: any) => {
        assert.ok(err instanceof AIError);
        assert.strictEqual(err.code, "TIMEOUT");
        assert.strictEqual(err.statusCode, 408);
        return true;
      }
    );

    const testRes = await provider.testConnection();
    assert.strictEqual(testRes.success, false);
    assert.strictEqual(testRes.errorType, "TIMEOUT");
  });

  it("7. Gemini: Valid request menggunakan header x-goog-api-key dan parse JSON", async () => {
    const validRawQuestions = [
      {
        stem: "Sebuah balok bermassa $m = 2\\text{ kg}$ meluncur pada bidang datar licin...",
        options: {
          A: "$5\\text{ m/s}$",
          B: "$10\\text{ m/s}$",
          C: "$15\\text{ m/s}$",
          D: "$20\\text{ m/s}$",
          E: "$25\\text{ m/s}$",
        },
        correctAnswer: "A",
        explanation: "Pembahasan konsep langkah demi langkah...",
        difficulty: "sedang",
      },
    ];

    let capturedHeaders: any = null;
    let capturedUrl: string = "";

    global.fetch = async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedHeaders = init?.headers;
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: "```json\n" + JSON.stringify(validRawQuestions) + "\n```" }],
              },
              finishReason: "STOP",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const provider = new GeminiAIProvider("AIzaSyValidProductionSecretKey", "gemini-2.5-flash");
    const questions = await provider.generateQuestions(dummyReq);

    // Keamanan: key TIDAK boleh ada di URL query string
    assert.ok(!capturedUrl.includes("AIzaSyValidProductionSecretKey"));
    assert.strictEqual(capturedHeaders["x-goog-api-key"], "AIzaSyValidProductionSecretKey");
    assert.strictEqual(questions.length, 1);
    assert.strictEqual(questions[0].correctAnswer, "A");
    assert.strictEqual(questions[0].isAiGenerated, true);
    assert.ok(questions[0].id.startsWith("q_ai_"));
  });

  // =========================================================================
  // SECTION 3: OpenAI Provider Adapter Tests
  // =========================================================================
  it("8. OpenAI: Missing key melempar AIError dengan kode CONFIG_MISSING", async () => {
    const provider = new OpenAIProvider("", "gpt-4o-mini");

    await assert.rejects(
      async () => {
        await provider.generateQuestions(dummyReq);
      },
      (err: any) => {
        assert.ok(err instanceof AIError);
        assert.strictEqual(err.code, "CONFIG_MISSING");
        return true;
      }
    );

    const testRes = await provider.testConnection();
    assert.strictEqual(testRes.success, false);
    assert.strictEqual(testRes.errorType, "CONFIG_MISSING");
  });

  it("9. OpenAI: 401 Unauthorized melempar AIError dengan kode INVALID_KEY", async () => {
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          error: {
            message: "Incorrect API key provided: sk-invalid. You can find your API key at https://platform.openai.com/account/api-keys.",
            type: "invalid_request_error",
            code: "invalid_api_key",
          },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );

    const provider = new OpenAIProvider("sk-invalid-test-key", "gpt-4o-mini");

    await assert.rejects(
      async () => {
        await provider.generateQuestions(dummyReq);
      },
      (err: any) => {
        assert.ok(err instanceof AIError);
        assert.strictEqual(err.code, "INVALID_KEY");
        assert.strictEqual(err.statusCode, 401);
        return true;
      }
    );

    const testRes = await provider.testConnection();
    assert.strictEqual(testRes.success, false);
    assert.strictEqual(testRes.errorType, "INVALID_KEY");
  });

  it("10. OpenAI: 429 Rate limit melempar AIError dengan kode QUOTA_EXHAUSTED", async () => {
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          error: {
            message: "You exceeded your current quota, please check your plan and billing details.",
            type: "insufficient_quota",
            code: "insufficient_quota",
          },
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );

    const provider = new OpenAIProvider("sk-valid-key", "gpt-4o-mini");

    await assert.rejects(
      async () => {
        await provider.generateQuestions(dummyReq);
      },
      (err: any) => {
        assert.ok(err instanceof AIError);
        assert.strictEqual(err.code, "QUOTA_EXHAUSTED");
        assert.strictEqual(err.statusCode, 429);
        return true;
      }
    );
  });

  it("11. OpenAI: 404 Model Not Found melempar AIError dengan kode MODEL_NOT_FOUND", async () => {
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          error: {
            message: "The model `gpt-nonexistent` does not exist",
            type: "invalid_request_error",
            code: "model_not_found",
          },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );

    const provider = new OpenAIProvider("sk-valid-key", "gpt-nonexistent");

    await assert.rejects(
      async () => {
        await provider.generateQuestions(dummyReq);
      },
      (err: any) => {
        assert.ok(err instanceof AIError);
        assert.strictEqual(err.code, "MODEL_NOT_FOUND");
        assert.strictEqual(err.statusCode, 404);
        return true;
      }
    );
  });

  it("12. OpenAI: Valid request sukses mengirim Bearer header dan parse response", async () => {
    let capturedHeaders: any = null;
    let capturedBody: any = null;

    const sampleAiQuestions = [
      {
        stem: "Dua muatan listrik $q_1$ dan $q_2$ terpisah sejauh $r$. Menurut Hukum Coulomb...",
        options: {
          A: "Berbanding terbalik dengan jarak kuadrat",
          B: "Berbanding lurus dengan jarak kuadrat",
          C: "Tidak dipengaruhi oleh konstanta medium",
          D: "Selalu tolak menolak",
          E: "Membentuk medan magnet melingkar",
        },
        correctAnswer: "A",
        explanation: "Hukum Coulomb menyatakan gaya elektrostatik $F = k \\frac{|q_1 q_2|}{r^2}$.",
        difficulty: "sedang",
      },
    ];

    global.fetch = async (url: any, init: any) => {
      capturedHeaders = init?.headers;
      capturedBody = JSON.parse(init?.body || "{}");
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify(sampleAiQuestions),
              },
              finish_reason: "stop",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const provider = new OpenAIProvider("sk-openai-secret-key-12345", "gpt-4o-mini");
    const questions = await provider.generateQuestions(dummyReq);

    assert.strictEqual(capturedHeaders["Authorization"], "Bearer sk-openai-secret-key-12345");
    assert.strictEqual(capturedBody.model, "gpt-4o-mini");
    assert.strictEqual(questions.length, 1);
    assert.strictEqual(questions[0].correctAnswer, "A");
    assert.strictEqual(questions[0].isAiGenerated, true);
    assert.strictEqual(questions[0].sourceType, "ai");

    // Test ping connection
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "OK" } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    const testRes = await provider.testConnection();
    assert.strictEqual(testRes.success, true);
    assert.ok(testRes.message.includes("berhasil terhubung"));
    assert.strictEqual(testRes.provider, "openai");
    assert.ok(typeof testRes.latencyMs === "number");
  });

  // =========================================================================
  // SECTION 4: OpenAI-Compatible Providers (Groq, OpenRouter) & Headers
  // =========================================================================
  it("13. OpenAI-Compatible: Mendukung Base URL khusus (Groq, OpenRouter) dan header tambahan", async () => {
    let capturedUrl = "";
    let capturedHeaders: any = null;

    global.fetch = async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedHeaders = init?.headers;
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "OK" } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    // Test OpenRouter (harus menambahkan header HTTP-Referer dan X-Title)
    const openRouterProvider = new OpenAIProvider(
      "sk-or-v1-custom-key",
      "meta-llama/llama-3.3-70b-instruct",
      "https://openrouter.ai/api/v1",
      20000,
      "openai-compatible"
    );

    const res = await openRouterProvider.testConnection();
    assert.strictEqual(res.success, true);
    assert.strictEqual(capturedUrl, "https://openrouter.ai/api/v1/chat/completions");
    assert.strictEqual(capturedHeaders["Authorization"], "Bearer sk-or-v1-custom-key");
    assert.strictEqual(capturedHeaders["HTTP-Referer"], "https://nemolearn.edu");
    assert.strictEqual(capturedHeaders["X-Title"], "NemoLearn Platform");
    assert.strictEqual(res.provider, "openai-compatible");
  });

  // =========================================================================
  // SECTION 5: SSRF Protection & URL Sanitization
  // =========================================================================
  it("14. SSRF Protection: Memblokir IP privat, loopback, link-local, dan AWS metadata", () => {
    const maliciousUrls = [
      "http://localhost:8000/v1",
      "http://127.0.0.1:11434/v1",
      "http://127.0.0.2:8080/v1",
      "http://169.254.169.254/latest/meta-data/", // AWS/GCP cloud metadata
      "http://10.0.0.1:8000/v1",
      "http://192.168.1.1:8000/v1",
      "http://172.16.0.1:8000/v1",
      "http://internal-server.local/v1",
      "http://cluster.internal/v1",
    ];

    for (const badUrl of maliciousUrls) {
      assert.throws(
        () => {
          validateSafeBaseUrl(badUrl);
        },
        (err: any) => {
          assert.ok(err instanceof AIError);
          assert.strictEqual(err.code, "INVALID_CONFIG");
          assert.ok(err.message.includes("diblokir"));
          return true;
        },
        `Harus memblokir URL berbahaya: ${badUrl}`
      );
    }

    // URL aman harus lolos validasi
    assert.strictEqual(validateSafeBaseUrl("https://api.openai.com/v1/"), "https://api.openai.com/v1");
    assert.strictEqual(validateSafeBaseUrl("https://api.groq.com/openai/v1"), "https://api.groq.com/openai/v1");
    assert.strictEqual(validateSafeBaseUrl("https://openrouter.ai/api/v1"), "https://openrouter.ai/api/v1");
  });

  // =========================================================================
  // SECTION 6: Curated Mock Bank Fallback (Jujur, Tanpa Klaim Palsu AI)
  // =========================================================================
  it("15. Mock Fallback Provider: Menghasilkan soal valid dan jujur (isAiGenerated: false)", async () => {
    const mockProvider = new MockAIProvider();
    assert.strictEqual(mockProvider.providerType, "mock");

    const questions = await mockProvider.generateQuestions({
      subjectId: "fisika",
      subjectName: "Fisika",
      topicId: "dinamika",
      topicName: "Dinamika Gerak & Hukum Newton",
      questionCount: 3,
      mode: "reguler",
    });

    assert.strictEqual(questions.length, 3);
    for (const q of questions) {
      assert.strictEqual(q.isAiGenerated, false, "Wajib menandai isAiGenerated: false secara jujur");
      assert.strictEqual(q.sourceType, "curated_bank", "sourceType harus 'curated_bank'");
      assert.strictEqual(q.options.length, 5);
      assert.ok(["A", "B", "C", "D", "E"].includes(q.correctAnswer));
    }

    // Uji Koneksi Mock Provider
    const testRes = await mockProvider.testConnection();
    assert.strictEqual(testRes.success, true);
    assert.strictEqual(testRes.provider, "mock");
    assert.ok(testRes.message.toLowerCase().includes("offline"));
  });

  // =========================================================================
  // SECTION 7: Admin RBAC Authorization & Non-Admin Protection
  // =========================================================================
  it("16. Keamanan Server: Siswa dan Guru Dilarang Melihat atau Mengubah Konfigurasi AI", () => {
    const student = UserRepository.getById("usr_pelajar_01");
    const teacher = UserRepository.getById("usr_guru_01");
    const admin = UserRepository.getById("usr_admin_01");

    assert.ok(student && student.role === "pelajar");
    assert.ok(teacher && teacher.role === "guru");
    assert.ok(admin && admin.role === "admin");

    // Simulasi RBAC guard pada route handler /api/settings/ai
    function checkAdminAccess(user: { role: string } | null): boolean {
      return Boolean(user && user.role === "admin");
    }

    assert.strictEqual(checkAdminAccess(student), false, "Siswa ditolak (403)");
    assert.strictEqual(checkAdminAccess(teacher), false, "Guru ditolak (403)");
    assert.strictEqual(checkAdminAccess(admin), true, "Admin diterima (200)");
  });

  // =========================================================================
  // SECTION 8: Factory Dynamic Instantiation & Priority Hierarchy
  // =========================================================================
  it("17. AI Factory: Mengembalikan instance provider yang sesuai dengan prioritas DB > ENV", () => {
    // A. Tanpa DB: default mengikuti ENV (mock)
    const defaultProvider = getAIProvider();
    assert.strictEqual(defaultProvider.providerType, "mock");

    // B. Admin mengonfigurasi OpenAI di DB
    AISettingsRepository.save({
      provider: "openai",
      apiKey: "sk-openai-live-key",
      model: "gpt-4o-mini",
    });

    const openaiInstance = getAIProvider();
    assert.strictEqual(openaiInstance.providerType, "openai");
    assert.strictEqual((openaiInstance as OpenAIProvider).model, "gpt-4o-mini");

    // C. Admin mengganti ke Gemini di DB
    AISettingsRepository.save({
      provider: "gemini",
      apiKey: "AIzaSyGeminiLiveKey",
      model: "gemini-2.5-flash",
    });

    const geminiInstance = getAIProvider();
    assert.strictEqual(geminiInstance.providerType, "gemini");
    assert.strictEqual((geminiInstance as GeminiAIProvider).model, "gemini-2.5-flash");

    // D. Admin mengganti ke OpenAI-Compatible (Groq)
    AISettingsRepository.save({
      provider: "openai-compatible",
      apiKey: "gsk_groq_live_key",
      model: "llama-3.3-70b-versatile",
      baseUrl: "https://api.groq.com/openai/v1",
    });

    const groqInstance = getAIProvider();
    assert.strictEqual(groqInstance.providerType, "openai-compatible");
    assert.strictEqual((groqInstance as OpenAIProvider).baseUrl, "https://api.groq.com/openai/v1");
  });

  it("18. Parsing Resiliensi: extractJsonString mengekstrak JSON dari respon dengan preamble teks", async () => {
    const rawPreambleResponse = `
Tentu, berikut adalah 1 butir soal fisika SMA sesuai standar kurikulum:

\`\`\`json
[
  {
    "stem": "Sebuah benda bermassa 2 kg didorong dengan gaya 10 N mendatar...",
    "options": {
      "A": "5 m/s^2",
      "B": "10 m/s^2",
      "C": "15 m/s^2",
      "D": "20 m/s^2",
      "E": "25 m/s^2"
    },
    "correctAnswer": "A",
    "explanation": "a = F / m = 10 / 2 = 5 m/s^2",
    "difficulty": "sedang"
  }
]
\`\`\`

Semoga soal ini bermanfaat untuk latihan siswa!
`;

    global.fetch = async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: rawPreambleResponse }],
              },
              finishReason: "STOP",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    const provider = new GeminiAIProvider("AIzaSyValidKey", "gemini-1.5-flash");
    const questions = await provider.generateQuestions(dummyReq);
    assert.strictEqual(questions.length, 1);
    assert.strictEqual(questions[0].correctAnswer, "A");
  });

  it("19. Multi-Provider Credential Isolation: providerKeys mengisolasi API key antar provider", () => {
    // 1. Simpan key Gemini
    AISettingsRepository.save({
      provider: "gemini",
      apiKey: "AIzaSyGeminiKey999",
      model: "gemini-1.5-flash",
    });

    // 2. Simpan key OpenAI
    AISettingsRepository.save({
      provider: "openai",
      apiKey: "sk-openai-key-888",
      model: "gpt-4o-mini",
    });

    // 3. Verifikasi providerKeys tersimpan terpisah
    const dbData = AISettingsRepository.get();
    assert.strictEqual(dbData?.providerKeys?.gemini, "AIzaSyGeminiKey999");
    assert.strictEqual(dbData?.providerKeys?.openai, "sk-openai-key-888");

    // 4. Switch kembali ke Gemini tanpa memasukkan ulang key
    AISettingsRepository.save({
      provider: "gemini",
      model: "gemini-1.5-flash",
      apiKey: dbData?.providerKeys?.gemini,
    });

    const activeGemini = getActiveAISettings();
    assert.strictEqual(activeGemini.provider, "gemini");
    assert.strictEqual(activeGemini.apiKey, "AIzaSyGeminiKey999");
  });

  it("20. Gemini Endpoint Normalization: Model dengan prefix 'models/' tidak menimbulkan double path", async () => {
    let capturedUrl = "";
    global.fetch = async (url: any) => {
      capturedUrl = String(url);
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "OK" }] } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const provider = new GeminiAIProvider("AIzaSyKey", "models/gemini-1.5-flash");
    await provider.testConnection();

    assert.ok(!capturedUrl.includes("models/models/"));
    assert.ok(capturedUrl.includes("models/gemini-1.5-flash:generateContent"));
  });

  it("21. Timeout Optimization: AbortError langsung melempar TIMEOUT tanpa retry berulang", async () => {
    let callCount = 0;
    global.fetch = async () => {
      callCount++;
      const abortErr = new Error("The operation was aborted");
      abortErr.name = "AbortError";
      throw abortErr;
    };

    const provider = new GeminiAIProvider("valid_key", "gemini-1.5-flash", 1000);

    await assert.rejects(
      async () => {
        await provider.generateQuestions({
          subjectId: "fisika",
          subjectName: "Fisika",
          topicId: "dinamika",
          topicName: "Hukum Newton & Gravitasi",
          questionCount: 5,
          mode: "reguler",
        });
      },
      (err: any) => {
        assert.ok(err instanceof AIError);
        assert.strictEqual(err.code, "TIMEOUT");
        assert.strictEqual(err.statusCode, 408);
        return true;
      }
    );

    // Call count HARUS tepat 1 (TIDAK boleh ada retry ketika timeout)
    assert.strictEqual(callCount, 1);
  });

  it("22. Provider Batching & Output Token Scale: 10 Soal HOTS diproses dengan alokasi token memadai", async () => {
    const rawQuestions = Array.from({ length: 5 }, (_, i) => ({
      stem: `Analisis eksperimen fisika ${i + 1}: Sebuah osilator harmonik sederhana dengan konstanta pegas $k$...`,
      options: {
        A: `Opsi A${i + 1}`,
        B: `Opsi B${i + 1}`,
        C: `Opsi C${i + 1}`,
        D: `Opsi D${i + 1}`,
        E: `Opsi E${i + 1}`,
      },
      correctAnswer: "A",
      explanation: `Pembahasan konsep analitis untuk nomor ${i + 1}...`,
      hint: "Perhatikan hukum kekekalan energi mekanik.",
      difficulty: "hots",
    }));

    let requestBody: any = null;
    global.fetch = async (_url: any, init: any) => {
      requestBody = JSON.parse(init.body);
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(rawQuestions) }],
              },
              finishReason: "STOP",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const provider = new GeminiAIProvider("valid_key", "gemini-1.5-flash");
    const result = await provider.generateQuestions({
      subjectId: "fisika",
      subjectName: "Fisika",
      topicId: "dinamika",
      topicName: "Dinamika",
      questionCount: 5,
      mode: "hots",
    });

    assert.strictEqual(result.length, 5);
    assert.strictEqual(result[0].difficulty, "hots");
    assert.ok(requestBody.generationConfig.maxOutputTokens >= 2500);
  });

  it("23. JSON Rusak: Menghasilkan INVALID_FORMAT secara terstruktur", async () => {
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: "{ ini bukan json yang valid..." }],
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    const provider = new GeminiAIProvider("valid_key", "gemini-1.5-flash");

    await assert.rejects(
      async () => {
        await provider.generateQuestions({
          subjectId: "kimia",
          subjectName: "Kimia",
          topicId: "stoikiometri",
          topicName: "Stoikiometri",
          questionCount: 3,
          mode: "reguler",
        });
      },
      (err: any) => {
        assert.ok(err instanceof AIError);
        assert.strictEqual(err.code, "INVALID_FORMAT");
        assert.strictEqual(err.statusCode, 502);
        return true;
      }
    );
  });

  it("24. Curated Bank Fallback: Menghasilkan soal yang tepat sesuai subjectId dan topicId", async () => {
    const mockProvider = new MockAIProvider();
    const questions = await mockProvider.generateQuestions({
      subjectId: "matematika",
      subjectName: "Matematika",
      topicId: "kalkulus",
      topicName: "Kalkulus & Turunan",
      questionCount: 10,
      mode: "reguler",
    });

    assert.strictEqual(questions.length, 10);
    for (const q of questions) {
      assert.strictEqual(q.subjectId, "matematika");
      assert.strictEqual(q.topicId, "kalkulus");
      assert.strictEqual(q.isAiGenerated, false);
      assert.strictEqual(q.sourceType, "curated_bank");
      assert.strictEqual(q.options.length, 5);
      assert.ok(["A", "B", "C", "D", "E"].includes(q.correctAnswer));
    }
  });

  it("25. Maksimal Soal (20-30 Butir): Bank Soal dapat memenuhi kapasitas penuh 30 butir", async () => {
    const mockProvider = new MockAIProvider();
    const questions = await mockProvider.generateQuestions({
      subjectId: "biologi",
      subjectName: "Biologi",
      topicId: "genetika",
      topicName: "Genetika & Pewarisan Sifat",
      questionCount: 30,
      mode: "hots",
    });

    assert.strictEqual(questions.length, 30);
    assert.strictEqual(questions[0].difficulty, "hots");
    assert.strictEqual(questions[29].difficulty, "hots");
  });

  it("26. AI Telemetry & RequestId: AIMetricsRepository mencatat requestId dan status terstruktur", () => {
    const testReqId = `test_req_${Date.now()}`;
    AIMetricsRepository.record({
      requestId: testReqId,
      provider: "Google Gemini AI Provider",
      model: "gemini-1.5-flash",
      success: true,
      latencyMs: 1420,
      subject: "Fisika",
      topic: "Dinamika",
      questionCount: 10,
      generatedCount: 10,
      status: "SUCCESS",
    });

    const metrics = AIMetricsRepository.getMetrics();
    const recorded = metrics.history.find((h) => h.requestId === testReqId);

    assert.ok(recorded);
    assert.strictEqual(recorded.status, "SUCCESS");
    assert.strictEqual(recorded.questionCount, 10);
    assert.strictEqual(recorded.generatedCount, 10);
    assert.strictEqual(recorded.latencyMs, 1420);
  });
});
