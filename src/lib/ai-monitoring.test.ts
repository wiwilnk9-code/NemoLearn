import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import {
  AIMetricsRepository,
  AISettingsRepository,
  UserRepository,
  ExplanationRepository,
} from "./db";
import {
  calculateEstimatedCost,
  estimateTokensFromRequest,
  formatTokenCount,
  formatCurrencyUsd,
  getModelPricing,
} from "./ai/pricing";
import { maskApiKey } from "./ai";

describe("TASK 5: AI Telemetry & Monitoring Infrastructure Tests", () => {
  // Test 1: Model Pricing & Cost Estimation
  describe("AI Token Pricing & Cost Calculation", () => {
    it("should calculate correct estimated cost for Google Gemini 1.5 Flash", () => {
      // Gemini 1.5 Flash: $0.075 / 1M prompt, $0.30 / 1M completion
      // 100,000 prompt tokens = $0.0075
      // 50,000 completion tokens = $0.0150
      // Total = $0.0225
      const cost = calculateEstimatedCost("gemini-1.5-flash", 100_000, 50_000);
      assert.strictEqual(cost, 0.0225);
    });

    it("should calculate correct estimated cost for OpenAI GPT-4o-mini", () => {
      // GPT-4o-mini: $0.15 / 1M prompt, $0.60 / 1M completion
      // 1,000,000 prompt = $0.15
      // 1,000,000 completion = $0.60
      // Total = $0.75
      const cost = calculateEstimatedCost("gpt-4o-mini", 1_000_000, 1_000_000);
      assert.strictEqual(cost, 0.75);
    });

    it("should return $0.00 for local curated mock bank", () => {
      const cost = calculateEstimatedCost("curated-sma-bank-v1", 500_000, 500_000);
      assert.strictEqual(cost, 0);
    });

    it("should format token counts into readable units", () => {
      assert.strictEqual(formatTokenCount(14_800_000), "14.8 M");
      assert.strictEqual(formatTokenCount(512_000), "512.0 K");
      assert.strictEqual(formatTokenCount(850), "850");
    });

    it("should format currency into USD correctly", () => {
      assert.strictEqual(formatCurrencyUsd(1428.5), "$1,428.50");
      assert.strictEqual(formatCurrencyUsd(0.0042), "$0.0042");
      assert.strictEqual(formatCurrencyUsd(0), "$0.00");
    });

    it("should estimate tokens transparently when provider usage metadata is omitted", () => {
      const estQuestion = estimateTokensFromRequest({
        requestType: "question_generation",
        questionCount: 5,
        hasError: false,
      });
      assert.strictEqual(estQuestion.isEstimated, true);
      assert.strictEqual(estQuestion.promptTokens, 420 + 5 * 60);
      assert.strictEqual(estQuestion.completionTokens, 5 * 340);

      const estExplanation = estimateTokensFromRequest({
        requestType: "explanation_generation",
        depth: "mendalam",
        hasError: false,
      });
      assert.strictEqual(estExplanation.isEstimated, true);
      assert.strictEqual(estExplanation.promptTokens, 380);
      assert.strictEqual(estExplanation.completionTokens, 650);
    });
  });

  // Test 2: Security - API Key Masking
  describe("Security: API Key Protection & Masking", () => {
    it("should never expose plaintext API keys in client-facing data", () => {
      const geminiKey = "mock_gemini_key_safe_testing_string_secret_12345678_endkey";
      const maskedGemini = maskApiKey(geminiKey);

      assert.strictEqual(maskedGemini.includes("mock_ge"), true);
      assert.strictEqual(maskedGemini.includes("••••"), true);
      assert.strictEqual(maskedGemini.includes("dkey"), true);
      assert.strictEqual(maskedGemini.includes("safe_testing_string_secret"), false); // middle secret hidden
    });

    it("should mask openai sk-proj keys securely", () => {
      const openaiKey = "sk-proj-super-secret-production-key-1234567890";
      const maskedOpenai = maskApiKey(openaiKey);

      assert.strictEqual(maskedOpenai.startsWith("sk-proj"), true);
      assert.strictEqual(maskedOpenai.endsWith("7890"), true);
      assert.strictEqual(maskedOpenai.includes("••••"), true);
      assert.strictEqual(maskedOpenai.includes("production-key"), false);
    });

    it("should return empty string for undefined or empty keys", () => {
      assert.strictEqual(maskApiKey(""), "");
      assert.strictEqual(maskApiKey(undefined), "");
      assert.strictEqual(maskApiKey("   "), "");
    });
  });

  // Test 3: AIMetricsRepository Analytics Calculation
  describe("AIMetricsRepository Detailed Telemetry", () => {
    const testReqIdSuccess = `test_telemetry_ok_${Date.now()}`;
    const testReqIdFail = `test_telemetry_err_${Date.now()}`;

    it("should record request telemetry with tokens and latency", () => {
      AIMetricsRepository.record({
        requestId: testReqIdSuccess,
        provider: "Google Gemini",
        model: "gemini-1.5-flash",
        success: true,
        latencyMs: 240,
        requestType: "question_generation",
        subject: "Fisika",
        topic: "Termodinamika",
        questionCount: 5,
        status: "SUCCESS",
        tokenUsage: {
          promptTokens: 720,
          completionTokens: 1700,
          totalTokens: 2420,
        },
      });

      AIMetricsRepository.record({
        requestId: testReqIdFail,
        provider: "Google Gemini",
        model: "gemini-1.5-flash",
        success: false,
        latencyMs: 1450,
        error: "429 Resource Exhausted: Quota limit reached",
        requestType: "question_generation",
        subject: "Biologi",
        topic: "Genetika",
        questionCount: 5,
        status: "FAILED",
      });

      const analytics = AIMetricsRepository.getDetailedAnalytics({ rangeHours: 24 });

      assert.ok(analytics.kpi.totalRequests >= 2);
      assert.ok(analytics.kpi.successfulRequests >= 1);
      assert.ok(analytics.kpi.failedRequests >= 1);
      assert.ok(analytics.kpi.totalTokens > 0);
      assert.ok(analytics.throughputTimeSeries.length === 5);

      // Verify specific recorded requests in history
      const foundOk = analytics.history.find((h) => h.requestId === testReqIdSuccess);
      assert.ok(foundOk, "Success telemetry log should be found in history");
      assert.strictEqual(foundOk?.latencyMs, 240);
      assert.strictEqual(foundOk?.status, "SUCCESS");

      const foundErr = analytics.history.find((h) => h.requestId === testReqIdFail);
      assert.ok(foundErr, "Failed telemetry log should be found in history");
      assert.strictEqual(foundErr?.success, false);
      assert.strictEqual(foundErr?.status, "FAILED");
    });

    it("should filter history by status (FAILED / SUCCESS)", () => {
      const errFiltered = AIMetricsRepository.getDetailedAnalytics({
        status: "FAILED",
      });
      for (const item of errFiltered.history) {
        assert.strictEqual(item.success, false);
      }

      const okFiltered = AIMetricsRepository.getDetailedAnalytics({
        status: "SUCCESS",
      });
      for (const item of okFiltered.history) {
        assert.strictEqual(item.success, true);
      }
    });

    it("should filter history by search query", () => {
      const searchResult = AIMetricsRepository.getDetailedAnalytics({
        search: "Termodinamika",
      });
      for (const item of searchResult.history) {
        const matches =
          (item.topic || "").includes("Termodinamika") ||
          (item.subject || "").includes("Termodinamika") ||
          (item.requestId || "").includes("Termodinamika");
        assert.ok(matches);
      }
    });
  });

  // Test 4: Cache Purge Mechanism
  describe("Prompt Cache Purge Mechanism", () => {
    it("should purge explanation cache and return count of deleted items", () => {
      // Seed dummy explanation
      ExplanationRepository.save({
        id: "exp_test_purge_01",
        questionId: "q_test_purge_01",
        depth: "normal",
        version: 1,
        content: "Penjelasan simulasi untuk uji coba purge cache.",
        model: "gemini-1.5-flash",
        provider: "Google Gemini",
        latencyMs: 120,
        generatedAt: new Date().toISOString(),
      });

      const purged = AIMetricsRepository.purgeExplanationCache();
      assert.ok(purged >= 1, "Should have purged at least 1 item");

      const cachedAfter = ExplanationRepository.get("q_test_purge_01", "normal", 1);
      assert.strictEqual(cachedAfter, null, "Cached item should no longer exist after purge");
    });
  });
});
