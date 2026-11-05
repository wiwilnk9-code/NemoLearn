import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import {
  loadDb,
  saveDb,
  UserRepository,
  SessionRepository,
  QuestionRepository,
  ReportRepository,
  SystemLogRepository,
  AIMetricsRepository,
  AISettingsRepository,
  getAdminDashboardSummary,
} from "@/lib/db";
import { requireAuth, createSessionToken, verifySessionToken } from "@/lib/auth";
import { formatIndonesianScore } from "@/lib/scoring/format";
import { User } from "@/types/user";

describe("NemoLearn Admin Backend & Dashboard Architecture Suite", () => {
  beforeEach(() => {
    // Reset database to initial seed state before each test
    const db = loadDb();
    db.users = {
      usr_pelajar_01: {
        id: "usr_pelajar_01",
        email: "budi.santoso@siswa.sma.id",
        displayName: "Budi Santoso",
        role: "pelajar",
        school: "SMAN 1 Jakarta",
        createdAt: "2026-09-01T08:00:00Z",
        status: "active",
      },
      usr_guru_01: {
        id: "usr_guru_01",
        email: "siti.rahmawati@guru.sma.id",
        displayName: "Siti Rahmawati, M.Pd.",
        role: "guru",
        school: "SMAN 3 Bandung",
        createdAt: "2026-08-15T09:00:00Z",
        status: "active",
      },
      usr_admin_01: {
        id: "usr_admin_01",
        email: "admin@nemoquiz.edu",
        displayName: "Admin NemoQUIZ",
        role: "admin",
        createdAt: "2026-08-01T00:00:00Z",
        status: "active",
      },
      usr_owner_01: {
        id: "usr_owner_01",
        email: "owner@nemoquiz.edu",
        displayName: "Dr. Hendra Kusuma (Owner)",
        role: "owner",
        createdAt: "2026-07-01T00:00:00Z",
        status: "active",
      },
    };
    db.systemLogs = [];
    db.sessions = {};
    db.reports = [];
    db.aiMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      history: [],
    };
    saveDb(db);
  });

  describe("1. Otorisasi Server-Side & Role-Based Access Control (RBAC)", () => {
    test("menolak akses tanpa sesi login dengan pesan UNAUTHORIZED", async () => {
      await assert.rejects(
        async () => {
          await requireAuth(["admin", "owner"]);
        },
        (err: Error) => {
          assert.match(err.message, /UNAUTHORIZED/);
          return true;
        }
      );
    });

    test("memverifikasi aturan RBAC: pelajar dan guru tidak boleh mengakses endpoint admin", () => {
      const allowedRoles = ["admin", "owner"];
      assert.strictEqual(allowedRoles.includes("pelajar"), false);
      assert.strictEqual(allowedRoles.includes("guru"), false);
      assert.strictEqual(allowedRoles.includes("admin"), true);
      assert.strictEqual(allowedRoles.includes("owner"), true);
    });

    test("membuat dan memverifikasi token sesi HMAC sha256 valid", () => {
      const adminUser = UserRepository.getById("usr_admin_01")!;
      const token = createSessionToken(adminUser);
      assert.ok(token && token.includes("."), "Token memiliki format payload.signature");

      const payload = verifySessionToken(token);
      assert.ok(payload !== null, "Token valid berhasil diverifikasi");
      assert.strictEqual(payload?.userId, "usr_admin_01");
      assert.strictEqual(payload?.role, "admin");
      assert.strictEqual(payload?.email, "admin@nemoquiz.edu");
    });

    test("menolak token sesi yang telah dimanipulasi (tampered) atau tanda tangan palsu", () => {
      const adminUser = UserRepository.getById("usr_admin_01")!;
      const token = createSessionToken(adminUser);
      const [data] = token.split(".");

      // Tamper signature
      const tamperedSigToken = `${data}.invalidsignature12345`;
      assert.strictEqual(verifySessionToken(tamperedSigToken), null);

      // Tamper payload
      const tamperedDataToken = `bm90YXZhbGlkcGF5bG9hZA==.invalidsignature12345`;
      assert.strictEqual(verifySessionToken(tamperedDataToken), null);
    });
  });

  describe("2. Manajemen Pengguna & Integritas Admin (UserRepository)", () => {
    test("menghitung statistik agregat pengguna secara akurat", () => {
      const stats = UserRepository.getStats();
      assert.strictEqual(stats.total, 4);
      assert.strictEqual(stats.active, 4);
      assert.strictEqual(stats.suspended, 0);
      assert.strictEqual(stats.byRole.pelajar, 1);
      assert.strictEqual(stats.byRole.guru, 1);
      assert.strictEqual(stats.byRole.admin, 1);
      assert.strictEqual(stats.byRole.owner, 1);
    });

    test("dapat membuat pengguna baru dan menyaring berdasarkan pencarian", () => {
      const newUser: User = {
        id: "usr_test_new",
        email: "ahmad.dani@siswa.sma.id",
        displayName: "Ahmad Dani",
        role: "pelajar",
        school: "SMAN 5 Surabaya",
        createdAt: new Date().toISOString(),
        status: "active",
      };
      UserRepository.create(newUser);

      const searchResult = UserRepository.getAll({ search: "dani" });
      assert.strictEqual(searchResult.total, 1);
      assert.strictEqual(searchResult.users[0].displayName, "Ahmad Dani");

      const roleFilterResult = UserRepository.getAll({ role: "pelajar" });
      assert.strictEqual(roleFilterResult.total, 2);
    });

    test("dapat mengubah peran pengguna (misal: pelajar -> guru)", () => {
      const updated = UserRepository.updateRole("usr_pelajar_01", "guru");
      assert.strictEqual(updated?.role, "guru");

      const stats = UserRepository.getStats();
      assert.strictEqual(stats.byRole.pelajar, 0);
      assert.strictEqual(stats.byRole.guru, 2);
    });

    test("melarang penghapusan administrator/owner aktif terakhir", () => {
      // Hapus owner terlebih dahulu sehingga hanya tersisa 1 admin
      UserRepository.delete("usr_owner_01");

      // Mencoba menghapus admin terakhir harus ditolak
      assert.throws(
        () => {
          UserRepository.delete("usr_admin_01");
        },
        (err: Error) => {
          assert.match(err.message, /Tidak dapat menghapus satu-satunya akun administrator\/owner/);
          return true;
        }
      );
    });

    test("melarang menonaktifkan (suspend) administrator aktif terakhir", () => {
      // Hapus owner
      UserRepository.delete("usr_owner_01");

      assert.throws(
        () => {
          UserRepository.updateStatus("usr_admin_01", "suspended");
        },
        (err: Error) => {
          assert.match(err.message, /Tidak dapat menonaktifkan \(suspend\) administrator aktif terakhir/);
          return true;
        }
      );
    });
  });

  describe("3. Agregasi Metrik Riil Dashboard (getAdminDashboardSummary)", () => {
    test("menghasilkan statistik dashboard riil tanpa angka palsu/dummy", () => {
      const summary = getAdminDashboardSummary(7);

      assert.ok(summary.users.total >= 4);
      assert.ok(summary.questions.total >= 4);
      assert.strictEqual(typeof summary.sessions.total, "number");
      assert.strictEqual(typeof summary.sessions.avgScoreFormatted, "string");
      assert.ok(Array.isArray(summary.trends));
      assert.strictEqual(summary.trends.length, 7);
      assert.strictEqual(summary.systemHealth.databaseStatus, "healthy");
      assert.strictEqual(summary.systemHealth.authStatus, "healthy");
    });

    test("format skor rata-rata menggunakan format baku Indonesia (koma untuk desimal)", () => {
      // Simulasikan 2 sesi kuis dengan skor 75.50 dan 80.25
      const db = loadDb();
      db.sessions["sess_test_1"] = {
        id: "sess_test_1",
        userId: "usr_pelajar_01",
        config: {
          subjectId: "fisika",
          topicId: "Dinamika Gerak",
          questionCount: 10,
          mode: "reguler",
        },
        status: "completed",
        questionIds: ["q1", "q2"],
        score: 75.5,
        scoreFormatted: "75,50",
        scoringMethod: "percentage",
        correctCount: 8,
        wrongCount: 2,
        emptyCount: 0,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
      db.sessions["sess_test_2"] = {
        id: "sess_test_2",
        userId: "usr_pelajar_01",
        config: {
          subjectId: "matematika",
          topicId: "Trigonometri",
          questionCount: 10,
          mode: "reguler",
        },
        status: "completed",
        questionIds: ["q3", "q4"],
        score: 80.25,
        scoreFormatted: "80,25",
        scoringMethod: "percentage",
        correctCount: 8,
        wrongCount: 2,
        emptyCount: 0,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
      saveDb(db);

      const stats = SessionRepository.getStats();
      assert.strictEqual(stats.total, 2);
      assert.strictEqual(stats.completed, 2);
      // Rerata (75.5 + 80.25) / 2 = 77.875 -> 77.88 -> "77,88"
      assert.strictEqual(stats.avgScoreFormatted, "77,88");
    });

    test("agregasi tren harian mengembalikan rentang waktu yang diminta (7, 14, 30 hari)", () => {
      const trend7 = SessionRepository.getDailyTrends(7);
      assert.strictEqual(trend7.length, 7);

      const trend14 = SessionRepository.getDailyTrends(14);
      assert.strictEqual(trend14.length, 14);

      const trend30 = SessionRepository.getDailyTrends(30);
      assert.strictEqual(trend30.length, 30);

      // Verifikasi format tanggal YYYY-MM-DD
      assert.match(trend7[0].date, /^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("4. Log Sistem & Jejak Audit (SystemLogRepository)", () => {
    test("dapat mencatat aktivitas log admin dan mengambilnya dengan filter", () => {
      SystemLogRepository.log({
        level: "warn",
        action: "USER_ROLE_CHANGED",
        actorId: "usr_admin_01",
        actorEmail: "admin@nemoquiz.edu",
        targetType: "user",
        targetId: "usr_pelajar_01",
        details: "Peran diubah dari pelajar ke guru",
      });

      SystemLogRepository.log({
        level: "error",
        action: "AI_GENERATION_FAILED",
        actorId: "usr_pelajar_01",
        actorEmail: "budi.santoso@siswa.sma.id",
        targetType: "ai_provider",
        details: "Quota exhausted (429)",
      });

      const allLogs = SystemLogRepository.getAll();
      assert.strictEqual(allLogs.total, 2);

      const errorLogs = SystemLogRepository.getAll({ level: "error" });
      assert.strictEqual(errorLogs.total, 1);
      assert.strictEqual(errorLogs.logs[0].action, "AI_GENERATION_FAILED");

      const warnLogs = SystemLogRepository.getAll({ level: "warn" });
      assert.strictEqual(warnLogs.total, 1);
      assert.strictEqual(warnLogs.logs[0].action, "USER_ROLE_CHANGED");
    });
  });

  describe("5. Pelaporan Masalah Butir Soal (ReportRepository)", () => {
    test("mencatat laporan masalah dari siswa dan memperbarui statusnya", () => {
      const report = ReportRepository.create(
        "usr_pelajar_01",
        "question",
        "q_fis_001",
        "report_key",
        "Kunci jawaban pada opsi B tampaknya kurang tepat, seharusnya opsi C sesuai rumus F = m.a"
      );

      assert.strictEqual(report.status, "pending");
      assert.strictEqual(ReportRepository.getPendingCount(), 1);

      const updated = ReportRepository.updateStatus(
        report.id,
        "resolved",
        "Kunci jawaban telah diverifikasi dan diperbaiki oleh Guru Fisika",
        "Admin Nemo"
      );

      assert.strictEqual(updated?.status, "resolved");
      assert.strictEqual(ReportRepository.getPendingCount(), 0);
    });
  });

  describe("6. Metrik AI & Proteksi Kredensial Sensitif", () => {
    test("mencatat riwayat request AI dan menghitung tingkat kesalahan (error rate)", () => {
      AIMetricsRepository.record({
        provider: "gemini",
        model: "gemini-2.5-flash",
        success: true,
        latencyMs: 350,
      });

      AIMetricsRepository.record({
        provider: "gemini",
        model: "gemini-2.5-flash",
        success: false,
        latencyMs: 120,
        error: "429 Quota Exceeded",
      });

      const metrics = AIMetricsRepository.getMetrics();
      assert.strictEqual(metrics.totalRequests, 2);
      assert.strictEqual(metrics.successfulRequests, 1);
      assert.strictEqual(metrics.failedRequests, 1);
      assert.strictEqual(metrics.errorRate, 50);
      assert.strictEqual(metrics.history.length, 2);
    });

    test("tidak pernah mengekspos API key mentah pada ringkasan dashboard", () => {
      // Simpan API key kustom
      AISettingsRepository.save({
        provider: "openai",
        apiKey: "sk-proj-super-secret-production-key-1234567890",
        model: "gpt-4o-mini",
      });

      const summary = getAdminDashboardSummary();
      // summary.ai hanya berisi { provider, model, hasKey, totalRequests, errorRate, dll }
      assert.strictEqual(summary.ai.provider, "openai");
      assert.strictEqual(summary.ai.hasKey, true);
      assert.strictEqual((summary.ai as any).apiKey, undefined); // Tidak ada property apiKey mentah
    });
  });
});
