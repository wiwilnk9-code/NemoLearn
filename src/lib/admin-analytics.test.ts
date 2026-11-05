import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import {
  loadDb,
  saveDb,
  UserRepository,
  SessionRepository,
  QuestionRepository,
  AIMetricsRepository,
  AnalyticsRepository,
} from "@/lib/db";

describe("NemoLearn Dynamic Admin Analytics & Database Charts Suite (Task 6)", () => {
  beforeEach(() => {
    const db = loadDb();
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgoStr = twoDaysAgo.split("T")[0];
    const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString();
    const fiftyDaysAgo = new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Seed Real Users with Different Timestamps
    db.users = {
      usr_old_01: {
        id: "usr_old_01",
        email: "old@sma.id",
        displayName: "Siswa Angkatan Lama",
        role: "pelajar",
        createdAt: fiftyDaysAgo,
        status: "active",
      },
      usr_mid_01: {
        id: "usr_mid_01",
        email: "mid@sma.id",
        displayName: "Siswa Menengah",
        role: "pelajar",
        createdAt: twentyDaysAgo,
        status: "active",
      },
      usr_recent_01: {
        id: "usr_recent_01",
        email: "recent@sma.id",
        displayName: "Siswa Baru",
        role: "pelajar",
        createdAt: twoDaysAgo,
        status: "active",
      },
      usr_today_01: {
        id: "usr_today_01",
        email: "today@sma.id",
        displayName: "Siswa Hari Ini",
        role: "pelajar",
        createdAt: now.toISOString(),
        status: "active",
      },
      usr_admin_01: {
        id: "usr_admin_01",
        email: "admin@nemoquiz.edu",
        displayName: "Admin NemoLearn",
        role: "admin",
        createdAt: fiftyDaysAgo,
        status: "active",
      },
    };

    // 2. Seed Real Practice Sessions with IRT and Fallback Scoring
    db.sessions = {
      sess_irt_01: {
        id: "sess_irt_01",
        userId: "usr_today_01",
        userName: "Siswa Hari Ini",
        subjectId: "matematika",
        subjectName: "Matematika",
        status: "completed",
        score: 720.5,
        scoreFormatted: "720,50",
        scoringMethod: "irt_3pl",
        startedAt: now.toISOString(),
        completedAt: now.toISOString(),
        config: { mode: "practice", subjectId: "matematika", topicId: "aljabar", totalQuestions: 10, difficulty: "hots" },
        questionIds: ["q_01", "q_02"],
      },
      sess_irt_02: {
        id: "sess_irt_02",
        userId: "usr_recent_01",
        userName: "Siswa Baru",
        subjectId: "fisika",
        subjectName: "Fisika",
        status: "completed",
        score: 480.0,
        scoreFormatted: "480,00",
        scoringMethod: "irt_3pl",
        startedAt: twoDaysAgo,
        completedAt: twoDaysAgo,
        config: { mode: "practice", subjectId: "fisika", topicId: "mekanika", totalQuestions: 10, difficulty: "sedang" },
        questionIds: ["q_03"],
      },
      sess_fb_01: {
        id: "sess_fb_01",
        userId: "usr_recent_01",
        userName: "Siswa Baru",
        subjectId: "biologi",
        subjectName: "Biologi",
        status: "completed",
        score: 80.0,
        scoreFormatted: "80,00",
        scoringMethod: "percentage_fallback",
        startedAt: twoDaysAgo,
        completedAt: twoDaysAgo,
        config: { mode: "practice", subjectId: "biologi", topicId: "genetika", totalQuestions: 5, difficulty: "mudah" },
        questionIds: ["q_04"],
      },
      sess_inprog_01: {
        id: "sess_inprog_01",
        userId: "usr_mid_01",
        userName: "Siswa Menengah",
        subjectId: "kimia",
        subjectName: "Kimia",
        status: "active",
        score: null,
        scoringMethod: null,
        startedAt: now.toISOString(),
        config: { mode: "practice", subjectId: "kimia", topicId: "larutan", totalQuestions: 5, difficulty: "sedang" },
        questionIds: ["q_05"],
      },
    };

    // 3. Seed Real AI Metrics History
    db.aiMetrics = {
      totalRequests: 3,
      successfulRequests: 2,
      failedRequests: 1,
      history: [
        {
          timestamp: now.toISOString(),
          provider: "gemini",
          model: "gemini-1.5-flash",
          subject: "Matematika",
          topic: "Kalkulus",
          success: true,
          latencyMs: 1250,
          status: "SUCCESS",
        },
        {
          timestamp: twoDaysAgo,
          provider: "openai",
          model: "gpt-4o-mini",
          subject: "Fisika",
          topic: "Termodinamika",
          success: true,
          latencyMs: 980,
          status: "SUCCESS",
        },
        {
          timestamp: twoDaysAgo,
          provider: "gemini",
          model: "gemini-1.5-flash",
          subject: "Kimia",
          topic: "Stoikiometri",
          success: false,
          latencyMs: 2500,
          error: "Rate limit reached (429)",
          status: "FAILED",
        },
      ],
    };

    saveDb(db);
  });

  describe("1. Grafik Pertumbuhan Pengguna (User Growth)", () => {
    test("menghitung tren harian dan kumulatif pengguna berdasarkan tanggal registrasi riil", () => {
      const growth7 = AnalyticsRepository.getUserGrowth(7);
      assert.strictEqual(growth7.totalUsersOverall, 5, "Total seluruh akun pengguna harus 5");
      assert.strictEqual(growth7.trend.length, 7, "Rentang 7 hari harus mengembalikan 7 titik data");

      // Verifikasi bahwa pengguna yang mendaftar hari ini dan 2 hari lalu tercatat
      assert.ok(growth7.totalNewInPeriod >= 2, "Harus ada minimal 2 pengguna baru dalam 7 hari terakhir");

      // Verifikasi titik data terakhir (hari ini)
      const todayPoint = growth7.trend[growth7.trend.length - 1];
      assert.strictEqual(todayPoint.newUsers, 1, "Satu pengguna baru mendaftar hari ini");
      assert.strictEqual(todayPoint.cumulativeUsers, 5, "Total kumulatif di akhir periode harus 5");
    });

    test("mendukung filter 14 hari dan 30 hari secara dinamis", () => {
      const growth14 = AnalyticsRepository.getUserGrowth(14);
      assert.strictEqual(growth14.trend.length, 14);

      const growth30 = AnalyticsRepository.getUserGrowth(30);
      assert.strictEqual(growth30.trend.length, 30);
      assert.ok(growth30.totalNewInPeriod >= 3, "Dalam 30 hari harus mencakup mid, recent, dan today");
    });
  });

  describe("2. Grafik Aktivitas Platform (Platform Activity)", () => {
    test("mencatat sesi dimulai, sesi selesai, dan pengguna aktif harian secara terpisah", () => {
      const activity = AnalyticsRepository.getPlatformActivity(7);
      assert.strictEqual(activity.trend.length, 7);

      assert.strictEqual(activity.totalStartedInPeriod, 4, "Total sesi dimulai dalam 7 hari adalah 4");
      assert.strictEqual(activity.totalCompletedInPeriod, 3, "Total sesi selesai dalam 7 hari adalah 3");
      assert.strictEqual(activity.completionRateInPeriod, 75, "Rasio penyelesaian: 3 / 4 = 75%");

      // Titik hari ini
      const todayPoint = activity.trend[activity.trend.length - 1];
      assert.strictEqual(todayPoint.startedSessions, 2, "Hari ini ada 2 sesi dimulai");
      assert.strictEqual(todayPoint.completedSessions, 1, "Hari ini ada 1 sesi selesai");
      assert.strictEqual(todayPoint.activeUsers, 2, "Dua pengguna aktif hari ini");
    });
  });

  describe("3. Grafik Penggunaan AI (AI Usage & Latency)", () => {
    test("menghitung metrik penggunaan AI, distribusi provider, dan latensi riil", () => {
      const ai = AnalyticsRepository.getAIAnalytics(7);
      assert.strictEqual(ai.totalRequests, 3);
      assert.strictEqual(ai.successfulRequests, 2);
      assert.strictEqual(ai.failedRequests, 1);
      assert.strictEqual(ai.successRate, 66.7);
      assert.ok(ai.avgLatencyMs > 0, "Rata-rata latensi harus dihitung");

      // Distribusi Provider
      const geminiProvider = ai.byProvider.find((p) => p.provider === "gemini");
      assert.ok(geminiProvider);
      assert.strictEqual(geminiProvider.count, 2);

      const openaiProvider = ai.byProvider.find((p) => p.provider === "openai");
      assert.ok(openaiProvider);
      assert.strictEqual(openaiProvider.count, 1);

      // Verifikasi keamanan: Tidak ada API key yang diekspos
      const serialized = JSON.stringify(ai);
      assert.strictEqual(serialized.includes("AI_KEY"), false);
      assert.strictEqual(serialized.includes("apiKey"), false);
    });
  });

  describe("4. Grafik Bank Soal (Question Bank Distribution)", () => {
    test("menghitung distribusi mata pelajaran, tingkat kesulitan, dan proporsi HOTS", () => {
      const qb = AnalyticsRepository.getQuestionBankAnalytics();
      assert.ok(Array.isArray(qb.bySubject), "Harus memiliki array distribusi mata pelajaran");
      assert.ok(qb.bySubject.length > 0);

      // Verifikasi proporsi kesulitan
      assert.strictEqual(qb.byDifficulty.length, 4);
      const hotsDiff = qb.byDifficulty.find((d) => d.difficulty === "hots");
      assert.ok(hotsDiff);

      // Verifikasi proporsi HOTS vs Reguler
      assert.ok(typeof qb.hotsProportion.hots === "number");
      assert.ok(typeof qb.hotsProportion.reguler === "number");
      assert.strictEqual(qb.hotsProportion.hots + qb.hotsProportion.reguler, qb.hotsProportion.total);
    });
  });

  describe("5. Grafik Hasil Pengerjaan (Score Distribution)", () => {
    test("MEMISAHKAN DENGAN KETAT skala IRT 3-PL (200–1000) dan skala Fallback Persentase (0–100)", () => {
      const scores = AnalyticsRepository.getScoreDistributionAnalytics(7);

      // 1. Verifikasi Data IRT 3-PL
      assert.strictEqual(scores.irt3pl.totalSessions, 2, "Harus ada 2 sesi dinilai dengan IRT");
      assert.ok(scores.irt3pl.avgScoreNumeric > 200, "Rata-rata IRT harus berada di atas batas bawah 200");
      assert.strictEqual(scores.irt3pl.minScore, 480.0);
      assert.strictEqual(scores.irt3pl.maxScore, 720.5);
      assert.strictEqual(scores.irt3pl.ranges.length, 4);

      // Rentang 400 - 599 harus ada 1 sesi (skor 480)
      const range400_599 = scores.irt3pl.ranges.find((r) => r.range === "400 - 599");
      assert.strictEqual(range400_599?.count, 1);

      // Rentang 600 - 799 harus ada 1 sesi (skor 720.5)
      const range600_799 = scores.irt3pl.ranges.find((r) => r.range === "600 - 799");
      assert.strictEqual(range600_799?.count, 1);

      // 2. Verifikasi Data Fallback Persentase
      assert.strictEqual(scores.fallbackPercentage.totalSessions, 1, "Harus ada 1 sesi fallback");
      assert.strictEqual(scores.fallbackPercentage.avgScoreNumeric, 80.0);
      assert.strictEqual(scores.fallbackPercentage.minScore, 80.0);
      assert.strictEqual(scores.fallbackPercentage.maxScore, 80.0);
      assert.strictEqual(scores.fallbackPercentage.ranges.length, 4);

      // Rentang 76% - 100% harus ada 1 sesi (skor 80%)
      const range76_100 = scores.fallbackPercentage.ranges.find((r) => r.range === "76% - 100%");
      assert.strictEqual(range76_100?.count, 1);

      // 3. Verifikasi Status Penyelesaian Sesi
      assert.strictEqual(scores.completionStats.total, 4);
      assert.strictEqual(scores.completionStats.completed, 3);
      assert.strictEqual(scores.completionStats.inProgress, 1);
      assert.strictEqual(scores.completionStats.completionRate, 75);
    });
  });

  describe("6. Ringkasan Penuh Analitik (getFullAnalytics)", () => {
    test("menghasilkan objek analitik komprehensif lengkap tanpa angka acak atau palsu", () => {
      const full = AnalyticsRepository.getFullAnalytics(7);
      assert.strictEqual(full.selectedDays, 7);
      assert.ok(full.generatedAt);
      assert.ok(full.userGrowth);
      assert.ok(full.platformActivity);
      assert.ok(full.aiAnalytics);
      assert.ok(full.questionBank);
      assert.ok(full.scoreAnalytics);
    });
  });
});
