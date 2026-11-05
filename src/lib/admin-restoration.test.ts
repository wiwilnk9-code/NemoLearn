import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import {
  loadDb,
  saveDb,
  UserRepository,
  AIMetricsRepository,
  AISettingsRepository,
  SystemLogRepository,
  getAdminDashboardSummary,
} from "@/lib/db";

describe("NemoLearn Admin Monitoring & Subsystem Health Restoration Suite (Task 5)", () => {
  beforeEach(() => {
    const db = loadDb();
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString();

    db.users = {
      usr_recent_01: {
        id: "usr_recent_01",
        email: "recent@sma.id",
        displayName: "Siswa Baru",
        role: "pelajar",
        school: "SMAN 1 Jakarta",
        createdAt: tenDaysAgo,
        status: "active",
      },
      usr_old_01: {
        id: "usr_old_01",
        email: "old@sma.id",
        displayName: "Siswa Lama",
        role: "pelajar",
        school: "SMAN 2 Jakarta",
        createdAt: fortyDaysAgo,
        status: "active",
      },
      usr_admin_01: {
        id: "usr_admin_01",
        email: "admin@nemoquiz.edu",
        displayName: "Admin NemoLearn",
        role: "admin",
        createdAt: fortyDaysAgo,
        status: "active",
      },
    };

    db.systemLogs = [
      {
        id: "log_test_01",
        timestamp: new Date().toISOString(),
        level: "error",
        action: "AI_GENERATION_FAILED",
        actorId: "usr_admin_01",
        actorEmail: "admin@nemoquiz.edu",
        actorRole: "admin",
        target: "gemini-flash-1.5",
        details: "API quota exhausted or network socket timeout",
      },
      {
        id: "log_test_02",
        timestamp: new Date().toISOString(),
        level: "info",
        action: "USER_LOGIN",
        actorId: "usr_recent_01",
        actorEmail: "recent@sma.id",
        actorRole: "pelajar",
        target: "auth_service",
        details: "User successfully authenticated",
      },
    ];

    db.aiMetrics = {
      totalRequests: 2,
      successfulRequests: 1,
      failedRequests: 1,
      history: [
        {
          timestamp: new Date().toISOString(),
          provider: "gemini",
          model: "gemini-1.5-flash",
          subject: "Fisika",
          topic: "Termodinamika",
          success: true,
          latencyMs: 1420,
          status: "SUCCESS",
          retryCount: 0,
        },
        {
          timestamp: new Date().toISOString(),
          provider: "gemini",
          model: "gemini-1.5-flash",
          subject: "Biologi",
          topic: "Genetika",
          success: false,
          latencyMs: 3200,
          status: "FAILED",
          error: "Rate limit reached (429)",
          retryCount: 2,
        },
      ],
    };

    saveDb(db);
  });

  describe("1. Perhitungan Pengguna Baru (30 Hari Terakhir)", () => {
    test("menghitung newUsers berdasarkan createdAt <= 30 hari yang lalu", () => {
      const stats = UserRepository.getStats();
      assert.strictEqual(stats.total, 3);
      assert.strictEqual(stats.newUsers, 1, "Hanya satu user yang didaftarkan dalam 30 hari terakhir");
    });
  });

  describe("2. Pemulihan Monitoring Kesehatan Subsistem (Real Subsystem Health)", () => {
    test("memverifikasi status subsistem database berbasis latensi dan penyimpanan riil", () => {
      const summary = getAdminDashboardSummary();
      const dbHealth = summary.systemHealth.database;

      assert.ok(dbHealth, "Objek database health harus tersedia");
      assert.ok(["Healthy", "Degraded", "Unavailable"].includes(dbHealth.status));
      assert.ok(typeof dbHealth.latencyMs === "number", "Latensi harus berupa angka milidetik");
      assert.ok(typeof dbHealth.itemsCount === "number", "Jumlah item database harus terhitung");
      assert.ok(dbHealth.fileStore.includes(".json"), "Path penyimpanan JSON harus terdefinisi");
      assert.strictEqual(typeof dbHealth.isSyncWithDisk, "boolean");
      assert.ok(dbHealth.lastCheckedAt, "Timestamp pemeriksaan riil harus terisi");
    });

    test("memverifikasi status subsistem AI Provider dari konfigurasi riil dan metrik history", () => {
      const summary = getAdminDashboardSummary();
      const aiHealth = summary.systemHealth.aiProvider;

      assert.ok(aiHealth, "Objek AI Provider health harus tersedia");
      assert.ok(["Healthy", "Degraded", "Unavailable", "Unknown"].includes(aiHealth.status));
      assert.ok(aiHealth.name.includes("AI Generation Engine"));
      assert.ok(typeof aiHealth.errorRate === "number", "Tingkat error harus dihitung riil");
      assert.ok(typeof aiHealth.avgLatencyMs === "number", "Rata-rata latensi harus dihitung");
    });

    test("memverifikasi status runtime API dan memori proses Node.js", () => {
      const summary = getAdminDashboardSummary();
      const apiHealth = summary.systemHealth.apiServer;

      assert.ok(apiHealth, "Objek API Server health harus tersedia");
      assert.ok(["Healthy", "Degraded", "Unavailable"].includes(apiHealth.status));
      assert.ok(typeof apiHealth.uptimeSeconds === "number" && apiHealth.uptimeSeconds >= 0, "Uptime proses harus valid");
      assert.ok(typeof apiHealth.memoryUsageMb === "number" && apiHealth.memoryUsageMb > 0, "Memory heap harus terukur");
      assert.ok(typeof apiHealth.errorLogsCount24h === "number", "Jumlah error 24 jam harus terhitung");
    });
  });

  describe("3. Pemulihan Histori Permintaan AI & Log Operasional", () => {
    test("menampilkan daftar permintaan AI terbaru (recentAIRequests) dengan rincian lengkap", () => {
      const summary = getAdminDashboardSummary();
      assert.ok(Array.isArray(summary.systemHealth.recentAIRequests));
      assert.strictEqual(summary.systemHealth.recentAIRequests.length, 2);

      const firstReq = summary.systemHealth.recentAIRequests[0];
      assert.strictEqual(firstReq.subject, "Fisika");
      assert.strictEqual(firstReq.status, "SUCCESS");

      const secondReq = summary.systemHealth.recentAIRequests[1];
      assert.strictEqual(secondReq.subject, "Biologi");
      assert.strictEqual(secondReq.status, "FAILED");
      assert.strictEqual(secondReq.error, "Rate limit reached (429)");
    });

    test("menampilkan daftar error operasional terbaru (recentErrors)", () => {
      const summary = getAdminDashboardSummary();
      assert.ok(Array.isArray(summary.systemHealth.recentErrors));
      assert.ok(summary.systemHealth.recentErrors.length >= 1);
      
      const latestError = summary.systemHealth.recentErrors[0];
      assert.ok(["AI_PROVIDER", "DATABASE", "AUTH", "SYSTEM"].includes(latestError.source));
      assert.ok(typeof latestError.message === "string" && latestError.message.length > 0);
    });
  });

  describe("4. Integritas Log Audit Sistem (SystemLogRepository)", () => {
    test("dapat melakukan pencarian log berdasarkan aksi dan level", () => {
      const errorResult = SystemLogRepository.getAll({ level: "error" });
      assert.strictEqual(errorResult.total, 1);
      assert.strictEqual(errorResult.logs[0].action, "AI_GENERATION_FAILED");

      const infoResult = SystemLogRepository.getAll({ level: "info" });
      assert.strictEqual(infoResult.total, 1);
      assert.strictEqual(infoResult.logs[0].action, "USER_LOGIN");
    });
  });
});
