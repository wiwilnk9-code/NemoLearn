import { describe, it } from "node:test";
import assert from "node:assert";
import { getAdminDashboardSummary, AnalyticsRepository } from "@/lib/db";

describe("TASK 3: Overview & Executive Analytics Suite", () => {
  describe("1. Agregasi Real-Time KPI Cards (getAdminDashboardSummary)", () => {
    it("menghitung metrik 5 kartu KPI utama dari data aktual database", () => {
      const summary = getAdminDashboardSummary(30);

      // 1. KPI Pengguna
      assert.ok(typeof summary.users.total === "number", "Total pengguna harus berupa angka");
      assert.ok(typeof summary.users.active === "number", "Pengguna aktif harus berupa angka");
      assert.ok(summary.users.total >= summary.users.active, "Total pengguna >= pengguna aktif");

      // 2. KPI Bank Soal
      assert.ok(typeof summary.questions.total === "number", "Total soal harus berupa angka");
      assert.ok(typeof summary.questions.hots === "number", "Soal HOTS harus berupa angka");
      assert.ok(summary.questions.total >= (summary.questions.hots || 0), "Total soal >= soal HOTS");

      // 3. KPI Aktivitas Belajar
      assert.ok(typeof summary.sessions.total === "number", "Total sesi harus berupa angka");
      assert.ok(typeof summary.sessions.completed === "number", "Sesi selesai harus berupa angka");

      // 4. KPI Permintaan AI
      assert.ok(typeof summary.ai.totalRequests === "number", "Total AI requests harus berupa angka");
      assert.ok(typeof summary.ai.errorRate === "number", "Error rate AI harus berupa angka");

      // 5. Tren Harian
      assert.ok(Array.isArray(summary.trends), "Trends harus berupa array");
      assert.strictEqual(summary.trends.length, 30, "Trends harus sesuai dengan 30 hari yang diminta");
    });
  });

  describe("2. User Analytics & Pertumbuhan Pengguna (AnalyticsRepository)", () => {
    it("menghasilkan tren pertumbuhan pengguna dinamis untuk rentang 7, 14, dan 30 hari", () => {
      const analytics7 = AnalyticsRepository.getFullAnalytics(7);
      const analytics14 = AnalyticsRepository.getFullAnalytics(14);
      const analytics30 = AnalyticsRepository.getFullAnalytics(30);

      assert.strictEqual(analytics7.userGrowth.trend.length, 7);
      assert.strictEqual(analytics14.userGrowth.trend.length, 14);
      assert.strictEqual(analytics30.userGrowth.trend.length, 30);

      // Verifikasi urutan tanggal sekuensial
      const firstDate = new Date(analytics7.userGrowth.trend[0].date).getTime();
      const lastDate = new Date(analytics7.userGrowth.trend[6].date).getTime();
      assert.ok(lastDate >= firstDate, "Tanggal terakhir harus lebih baru atau sama dengan tanggal awal");
    });
  });

  describe("3. Learning Analytics & Distribusi Mata Pelajaran", () => {
    it("menghitung proporsi mata pelajaran kurikulum SMA secara presisi untuk Donut Chart", () => {
      const analytics = AnalyticsRepository.getFullAnalytics(30);
      const { bySubject } = analytics.questionBank;

      assert.ok(Array.isArray(bySubject), "bySubject harus berupa array");
      assert.ok(bySubject.length > 0, "Harus ada mata pelajaran dalam bank soal");

      bySubject.forEach((sub) => {
        assert.ok(typeof sub.subjectId === "string", "subjectId harus string");
        assert.ok(typeof sub.subjectName === "string", "subjectName harus string");
        assert.ok(typeof sub.total === "number", "total butir harus number");
        assert.ok(sub.percentage >= 0 && sub.percentage <= 100, "Persentase harus 0 - 100%");
      });
    });

    it("menghitung efisiensi penyelesaian sesi belajar pada platform", () => {
      const analytics = AnalyticsRepository.getFullAnalytics(30);
      const { platformActivity } = analytics;

      assert.ok(typeof platformActivity.totalStartedInPeriod === "number");
      assert.ok(typeof platformActivity.totalCompletedInPeriod === "number");
      assert.ok(
        platformActivity.completionRateInPeriod >= 0 && platformActivity.completionRateInPeriod <= 100,
        "Completion rate harus valid antara 0% dan 100%"
      );
    });
  });

  describe("4. AI Analytics & Distribusi Provider", () => {
    it("mencatat histori latensi riil, provider aktif, dan rate keberhasilan request", () => {
      const analytics = AnalyticsRepository.getFullAnalytics(30);
      const { aiAnalytics } = analytics;

      assert.ok(typeof aiAnalytics.totalRequests === "number");
      assert.ok(typeof aiAnalytics.successRate === "number");
      assert.ok(Array.isArray(aiAnalytics.byProvider), "byProvider harus berupa array");
      assert.ok(Array.isArray(aiAnalytics.dailyTrend), "dailyTrend harus berupa array");
    });
  });

  describe("5. Recent Activity & Audit Trail Forensik", () => {
    it("mengembalikan riwayat aktivitas terkini dari siswa dan log audit sistem", () => {
      const summary = getAdminDashboardSummary(7);

      assert.ok(Array.isArray(summary.recentSessions), "recentSessions harus array");
      assert.ok(Array.isArray(summary.recentLogs), "recentLogs harus array");

      // Setiap log harus memiliki data aktor, timestamp, dan level
      summary.recentLogs.forEach((log) => {
        assert.ok(log.id, "Log ID harus ada");
        assert.ok(log.action, "Log action harus ada");
        assert.ok(log.actorEmail, "Log actorEmail harus ada");
        assert.ok(log.timestamp, "Log timestamp harus ada");
      });
    });
  });

  describe("6. Real-Time Host Engine & Diagnostics Subsistem", () => {
    it("menyediakan status diagnostik riil untuk Database, AI Engine, dan Next.js API Server", () => {
      const summary = getAdminDashboardSummary(7);
      const { systemHealth } = summary;

      assert.ok(systemHealth, "systemHealth harus ada");
      assert.ok(["Healthy", "Degraded", "Unavailable", "Unknown"].includes(systemHealth.database.status));
      assert.ok(typeof systemHealth.database.latencyMs === "number");
      assert.ok(["Healthy", "Degraded", "Unavailable", "Unknown"].includes(systemHealth.aiProvider.status));
      assert.ok(["Healthy", "Degraded", "Unavailable", "Unknown"].includes(systemHealth.apiServer.status));
      assert.ok(typeof systemHealth.apiServer.memoryUsageMb === "number");
    });
  });
});
