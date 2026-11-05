import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  WebsiteSettingsRepository,
  AISettingsRepository,
  SystemLogRepository,
  getMaskedApiVault,
  getGovernanceAuditLogs,
  DEFAULT_WEBSITE_SETTINGS,
} from "./db";

describe("NemoLearn Task 6 — System Settings & Platform Governance Suite", () => {
  beforeEach(() => {
    // Reset repository settings to platform baseline before each test
    WebsiteSettingsRepository.resetToDefaults("test-runner@nemolearn.id");
  });

  describe("1. General & Platform Settings Repository", () => {
    it("membaca konfigurasi default platform secara lengkap dan strongly-typed", () => {
      const settings = WebsiteSettingsRepository.get();

      assert.strictEqual(settings.siteName, "NemoLearn");
      assert.strictEqual(settings.curriculum, "Kurikulum Merdeka SMA");
      assert.strictEqual(settings.enableIRTScoring, true);
      assert.strictEqual(settings.enableAIGenerator, true);
      assert.strictEqual(settings.enablePdfExport, true);
      assert.strictEqual(settings.allowPublicRegistration, true);

      // Verifikasi AppInfo telemetry
      assert.ok(settings.appInfo);
      assert.strictEqual(settings.appInfo.version, "v2.4.0-stable");
      assert.strictEqual(settings.appInfo.buildNumber, "04.92.11");
      assert.strictEqual(settings.appInfo.clusterId, "Cluster-Jakarta");
    });

    it("dapat memperbarui identitas platform dan mencatat jejak pembaruan", () => {
      const updated = WebsiteSettingsRepository.update(
        {
          siteName: "NemoLearn Adaptive High School",
          tagline: "Platform Latihan Cerdas Kemendikbudristek",
          allowPublicRegistration: false,
        },
        "owner@nemolearn.id"
      );

      assert.strictEqual(updated.siteName, "NemoLearn Adaptive High School");
      assert.strictEqual(updated.tagline, "Platform Latihan Cerdas Kemendikbudristek");
      assert.strictEqual(updated.allowPublicRegistration, false);
      assert.strictEqual(updated.updatedBy, "owner@nemolearn.id");
      assert.ok(updated.updatedAt);

      // Verifikasi pembacaan ulang persisten
      const fresh = WebsiteSettingsRepository.get();
      assert.strictEqual(fresh.siteName, "NemoLearn Adaptive High School");
      assert.strictEqual(fresh.allowPublicRegistration, false);
    });
  });

  describe("2. AI Routing & Generation Controls", () => {
    it("dapat mengonfigurasi primary model, failover switch, dan temperature sliders", () => {
      const updated = WebsiteSettingsRepository.update(
        {
          aiRouting: {
            primaryModel: "claude-3-5-sonnet",
            primaryProvider: "anthropic",
            fallbackAutoSwitch: false,
            fallbackModel: "gemini-1.5-flash",
            tutorTemperature: 0.85,
            examTemperature: 0.15,
            timeoutMs: 15000,
          },
        },
        "admin@nemolearn.id"
      );

      assert.strictEqual(updated.aiRouting.primaryModel, "claude-3-5-sonnet");
      assert.strictEqual(updated.aiRouting.fallbackAutoSwitch, false);
      assert.strictEqual(updated.aiRouting.tutorTemperature, 0.85);
      assert.strictEqual(updated.aiRouting.examTemperature, 0.15);
      assert.strictEqual(updated.aiRouting.timeoutMs, 15000);

      // Verifikasi konsistensi persisten
      const fresh = WebsiteSettingsRepository.get();
      assert.strictEqual(fresh.aiRouting.primaryModel, "claude-3-5-sonnet");
      assert.strictEqual(fresh.aiRouting.tutorTemperature, 0.85);
    });
  });

  describe("3. API Management Vault & Secret Masking", () => {
    it("tidak pernah mengekspos API Key dalam bentuk plaintext ke frontend", () => {
      // Simpan kunci simulasi
      AISettingsRepository.save({
        provider: "openai",
        apiKey: "sk-proj-supersecretkey1234567890abcdef",
      });

      const vault = getMaskedApiVault();
      assert.ok(Array.isArray(vault));
      assert.strictEqual(vault.length, 4); // openai, anthropic, gemini, openrouter

      const openaiEntry = vault.find((v) => v.provider === "openai");
      assert.ok(openaiEntry);
      assert.strictEqual(openaiEntry.isSet, true);

      // Kunci harus disamarkan dan TIDAK BOLEH memuat plaintext utuh
      assert.ok(openaiEntry.maskedKey.includes("..."));
      assert.strictEqual(openaiEntry.maskedKey.includes("supersecretkey"), false);
      assert.strictEqual(openaiEntry.maskedKey.startsWith("sk-"), true);
      assert.strictEqual(openaiEntry.maskedKey.endsWith("cdef"), true);
    });

    it("menampilkan placeholder untuk provider yang belum dikonfigurasi", () => {
      // Hapus kunci anthropic jika ada
      AISettingsRepository.deleteKey("anthropic" as any);

      const vault = getMaskedApiVault();
      const anthropicEntry = vault.find((v) => v.provider === "anthropic");
      assert.ok(anthropicEntry);
      if (!process.env.ANTHROPIC_API_KEY) {
        assert.strictEqual(anthropicEntry.isSet, false);
        assert.strictEqual(anthropicEntry.maskedKey, "(Belum dikonfigurasi)");
      }
    });
  });

  describe("4. Batas Penggunaan (Rate Limits & Quota)", () => {
    it("dapat memperbarui kuota Free, Pro, dan Enterprise tier secara independen", () => {
      const updated = WebsiteSettingsRepository.update(
        {
          rateLimits: {
            freeTier: {
              dailyPromptLimit: 45,
              weeklyQuizLimit: 20,
              cooldownSeconds: 45,
              activeAccountsCount: 50000,
            },
            proTier: {
              burstLimitPerMinute: 90,
              autoBurstQueueing: false,
              fairUsagePolicy: true,
            },
            enterpriseTier: {
              batchQuizLimit: 100,
              maxUploadMb: 500,
              vipClusterQos: true,
            },
          },
        },
        "owner@nemolearn.id"
      );

      assert.strictEqual(updated.rateLimits.freeTier.dailyPromptLimit, 45);
      assert.strictEqual(updated.rateLimits.freeTier.cooldownSeconds, 45);
      assert.strictEqual(updated.rateLimits.proTier.burstLimitPerMinute, 90);
      assert.strictEqual(updated.rateLimits.proTier.autoBurstQueueing, false);
      assert.strictEqual(updated.rateLimits.enterpriseTier.batchQuizLimit, 100);
      assert.strictEqual(updated.rateLimits.enterpriseTier.maxUploadMb, 500);
    });
  });

  describe("5. Mode Pemeliharaan & Banner Pengumuman", () => {
    it("menyinkronkan maintenanceMode boolean saat maintenance.enabled diubah", () => {
      const updated = WebsiteSettingsRepository.update(
        {
          maintenance: {
            enabled: true,
            scope: "ai-only",
            message: "Pemeliharaan kluster GPU AI sedang berlangsung.",
            estimatedEndTime: "16:30",
            bypassIpWhitelist: ["103.148.12.9", "127.0.0.1"],
          },
        },
        "admin@nemolearn.id"
      );

      assert.strictEqual(updated.maintenance.enabled, true);
      assert.strictEqual(updated.maintenanceMode, true);
      assert.strictEqual(updated.maintenance.scope, "ai-only");
      assert.strictEqual(updated.maintenance.estimatedEndTime, "16:30");

      // Nonaktifkan kembali
      const disabled = WebsiteSettingsRepository.update(
        {
          maintenance: {
            ...updated.maintenance,
            enabled: false,
          },
        },
        "admin@nemolearn.id"
      );

      assert.strictEqual(disabled.maintenance.enabled, false);
      assert.strictEqual(disabled.maintenanceMode, false);
    });

    it("dapat mengatur dan mempublikasikan banner siaran global", () => {
      const updated = WebsiteSettingsRepository.update(
        {
          broadcast: {
            active: true,
            message: "Simulasi SNBT 2026 dibuka serentak seluruh Indonesia!",
            category: "warning",
            audience: "students",
            expiresAt: "2026-11-30",
          },
        },
        "owner@nemolearn.id"
      );

      assert.strictEqual(updated.broadcast.active, true);
      assert.strictEqual(updated.broadcast.category, "warning");
      assert.strictEqual(updated.broadcast.audience, "students");
      assert.strictEqual(
        updated.broadcast.message,
        "Simulasi SNBT 2026 dibuka serentak seluruh Indonesia!"
      );
    });
  });

  describe("6. Keamanan & Governance Audit Logs", () => {
    it("menghasilkan catatan audit tata kelola yang terstruktur", () => {
      // Catat log tata kelola buatan
      SystemLogRepository.log({
        level: "security",
        action: "AI_KEY_ROTATED",
        actorId: "usr_owner_01",
        actorEmail: "owner@nemoquiz.edu",
        targetType: "ai_settings",
        details: "Rotasi kredensial API Key untuk provider [GEMINI] oleh owner@nemoquiz.edu",
      });

      const logs = getGovernanceAuditLogs(10);
      assert.ok(Array.isArray(logs));
      assert.ok(logs.length > 0);

      const rotationLog = logs.find((l) => l.activity.includes("GEMINI"));
      assert.ok(rotationLog);
      assert.strictEqual(rotationLog.operator, "owner@nemoquiz.edu");
      assert.strictEqual(rotationLog.category, "KEY_ROTATION");
      assert.strictEqual(rotationLog.status, "SECURITY");
    });

    it("dapat mereset seluruh parameter platform ke default pabrikan", () => {
      // Modifikasi pengaturan
      WebsiteSettingsRepository.update({
        siteName: "Modified Name",
        rateLimits: {
          freeTier: { dailyPromptLimit: 999, weeklyQuizLimit: 999, cooldownSeconds: 0 },
          proTier: { burstLimitPerMinute: 999, autoBurstQueueing: false, fairUsagePolicy: false },
          enterpriseTier: { batchQuizLimit: 999, maxUploadMb: 999, vipClusterQos: false },
        },
      });

      assert.strictEqual(WebsiteSettingsRepository.get().siteName, "Modified Name");

      // Reset
      const reset = WebsiteSettingsRepository.resetToDefaults("superadmin@nemolearn.id");
      assert.strictEqual(reset.siteName, DEFAULT_WEBSITE_SETTINGS.siteName);
      assert.strictEqual(
        reset.rateLimits.freeTier.dailyPromptLimit,
        DEFAULT_WEBSITE_SETTINGS.rateLimits.freeTier.dailyPromptLimit
      );
      assert.strictEqual(reset.updatedBy, "superadmin@nemolearn.id");
    });
  });
});
