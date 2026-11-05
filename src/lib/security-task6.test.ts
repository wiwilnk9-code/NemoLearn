import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { POST as registerPost } from "@/app/api/auth/register/route";
import { POST as forgotPasswordPost } from "@/app/api/auth/forgot-password/route";
import { POST as verifyEmailPost } from "@/app/api/auth/verify-email/route";
import { SystemLogRepository, sanitizeLogDetails, sanitizeLogPayload, UserRepository, loadDb } from "@/lib/db";
import nextConfig from "../../next.config.mjs";

describe("TASK 6: Production Security Hardening & Sanity Audits", () => {
  beforeEach(() => {
    // Reset test state
    const db = loadDb();
    if (!db.users["usr_sec_student"]) {
      UserRepository.create({
        id: "usr_sec_student",
        email: "sec_student@example.com",
        displayName: "Security Student",
        role: "pelajar",
        status: "active",
        emailVerified: true,
        createdAt: new Date().toISOString(),
      });
    }
  });

  describe("1. HTTP Security Headers in Next.js Configuration", () => {
    it("memastikan konfigurasi next.config.mjs memiliki security headers lengkap", async () => {
      assert.strictEqual(typeof nextConfig.headers, "function", "nextConfig memiliki async headers()");
      const headerConfigs = nextConfig.headers ? await nextConfig.headers() : [];
      assert.ok(Array.isArray(headerConfigs), "headers() mengembalikan array");

      const rootConfig = headerConfigs.find((h: any) => h.source === "/:path*");
      assert.ok(rootConfig, "Terdapat aturan security headers untuk '/:path*'");

      const headersMap: Record<string, string> = {};
      rootConfig.headers.forEach((h: any) => {
        headersMap[h.key] = h.value;
      });

      // Strict-Transport-Security (HSTS)
      assert.ok(headersMap["Strict-Transport-Security"], "HSTS terpasang");
      assert.ok(headersMap["Strict-Transport-Security"].includes("max-age="));
      assert.ok(headersMap["Strict-Transport-Security"].includes("includeSubDomains"));

      // Content-Security-Policy (CSP)
      assert.ok(headersMap["Content-Security-Policy"], "CSP terpasang");
      assert.ok(headersMap["Content-Security-Policy"].includes("default-src 'self'"));
      assert.ok(headersMap["Content-Security-Policy"].includes("frame-ancestors 'none'"));
      assert.ok(headersMap["Content-Security-Policy"].includes("https://epbepzjheexkeqivcoql.supabase.co"));

      // X-Content-Type-Options
      assert.strictEqual(headersMap["X-Content-Type-Options"], "nosniff");

      // X-Frame-Options
      assert.strictEqual(headersMap["X-Frame-Options"], "DENY");

      // Referrer-Policy
      assert.strictEqual(headersMap["Referrer-Policy"], "strict-origin-when-cross-origin");

      // Permissions-Policy
      assert.ok(headersMap["Permissions-Policy"], "Permissions-Policy terpasang");
      assert.ok(headersMap["Permissions-Policy"].includes("camera=()"));
      assert.ok(headersMap["Permissions-Policy"].includes("microphone=()"));
    });
  });

  describe("2. Authentication Hardening & Token Protection", () => {
    it("menolak login userId tanpa kata sandi di mode produksi", async () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        (process.env as any).NODE_ENV = "production";
        const req = new Request("http://localhost:3000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: "usr_sec_student" }),
        });

        const res = await loginPost(req);
        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.success, false);
        assert.ok(data.error.includes("produksi"), "Error menjelaskan pembatasan di mode produksi");
      } finally {
        (process.env as any).NODE_ENV = originalEnv;
      }
    });

    it("tidak mengembalikan verificationToken di respon pendaftaran jika di mode produksi", async () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        (process.env as any).NODE_ENV = "production";
        const testEmail = `prod_test_${Date.now()}@example.com`;
        const req = new Request("http://localhost:3000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: "Production Test User",
            email: testEmail,
            password: "SecurePassword123!",
            confirmPassword: "SecurePassword123!",
            agreeTerms: true,
            agreePrivacy: true,
          }),
        });

        const res = await registerPost(req);
        assert.strictEqual(res.status, 201);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.verificationToken, undefined, "verificationToken tidak boleh dibocorkan ke client di produksi");
      } finally {
        (process.env as any).NODE_ENV = originalEnv;
      }
    });

    it("tidak mengembalikan resetToken di respon forgot-password jika di mode produksi", async () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        (process.env as any).NODE_ENV = "production";
        const req = new Request("http://localhost:3000/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "sec_student@example.com" }),
        });

        const res = await forgotPasswordPost(req);
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.resetToken, undefined, "resetToken tidak boleh dibocorkan ke client di produksi");
      } finally {
        (process.env as any).NODE_ENV = originalEnv;
      }
    });
  });

  describe("3. Audit Log Sanitization & Sensitive Credential Masking", () => {
    it("secara otomatis menyamarkan Google API Key pada string details log", () => {
      const rawText = "Gagal memproses panggilan ke Gemini AI dengan kunci AIzaSyB1234567890abcdefghijklmnopqrstu!";
      const clean = sanitizeLogDetails(rawText);
      assert.ok(!clean.includes("AIzaSyB1234567890abcdefghijklmnopqrstu"));
      assert.ok(clean.includes("AIzaSy...rstu"));
    });

    it("secara otomatis menyamarkan OpenAI API Key pada string details log", () => {
      const rawText = "Inisialisasi provider OpenAI menggunakan sk-proj-1234567890abcdefghijklmnopqr selesai.";
      const clean = sanitizeLogDetails(rawText);
      assert.ok(!clean.includes("sk-proj-1234567890abcdefghijklmnopqr"));
      assert.ok(clean.includes("sk-pro...opqr"));
    });

    it("secara otomatis menyamarkan kata sandi pada string details log", () => {
      const rawText = "User mencoba login dengan password=SecretPassword123 gagal.";
      const clean = sanitizeLogDetails(rawText);
      assert.ok(!clean.includes("SecretPassword123"));
      assert.ok(clean.includes("[MASKED]"));
    });

    it("secara otomatis menyamarkan token verifikasi dan reset pada string details log", () => {
      const rawText = "Token baru diterbitkan: tok_verif_abcdef1234567890abcdef1234567890";
      const clean = sanitizeLogDetails(rawText);
      assert.ok(!clean.includes("abcdef1234567890abcdef1234567890"));
      assert.ok(clean.includes("tok_verif_..."));
    });

    it("secara rekursif menyamarkan payload objek yang memuat field sensitif", () => {
      const rawPayload = {
        email: "user@example.com",
        password: "MySuperSecretPassword",
        apiKey: "sk-live-secret-key-12345",
        metadata: {
          sessionToken: "tok_sess_1234567890",
          nestedKey: "gemini_api_key_secret",
        },
      };

      const clean = sanitizeLogPayload(rawPayload);
      assert.strictEqual(clean.password, "[MASKED]");
      assert.strictEqual(clean.apiKey, "[MASKED]");
      assert.strictEqual(clean.metadata.sessionToken, "[MASKED]");
      assert.strictEqual(clean.metadata.nestedKey, "[MASKED]");
      assert.strictEqual(clean.email, "user@example.com");
    });

    it("SystemLogRepository.log menghasilkan log dengan rincian yang tersanitasi", () => {
      const logItem = SystemLogRepository.log({
        level: "security",
        action: "SUSPICIOUS_PAYLOAD",
        actorId: "usr_sec_student",
        actorEmail: "sec_student@example.com",
        details: "Menerima request dengan sk-proj-998877665544332211aabbcc dan password: SecretKey123",
        payload: {
          apiKey: "AIzaSySecretApiKeyHere1234567890123",
          requestBody: "valid",
        } as any,
      });

      assert.ok(!logItem.details.includes("SecretKey123"));
      assert.ok(logItem.details.includes("[MASKED]"));
      assert.strictEqual((logItem.payload as any)?.apiKey, "[MASKED]");
      assert.strictEqual((logItem.payload as any)?.requestBody, "valid");
    });
  });
});
