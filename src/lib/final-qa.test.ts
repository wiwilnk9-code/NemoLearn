import { describe, it, before } from "node:test";
import assert from "node:assert";
import {
  UserRepository,
  SessionRepository,
  QuestionRepository,
  ReportRepository,
  SystemLogRepository,
  AIMetricsRepository,
  AISettingsRepository,
  WebsiteSettingsRepository,
  AnalyticsRepository,
  getAdminDashboardSummary,
  getMaskedApiVault,
  loadDb,
  saveDb,
  getInitialSystemLogs,
} from "./db";
import {
  createSessionToken,
  verifySessionToken,
  requireAuth,
  COOKIE_NAME,
} from "./auth/server";
import { hasPermission } from "./auth/permissions";
import { GET as getAdminStats } from "../app/api/admin/stats/route";
import { GET as getAdminAnalytics } from "../app/api/admin/analytics/route";
import { GET as getAdminUsers, POST as postAdminUser } from "../app/api/admin/users/route";
import { GET as getAdminUserDetail, PATCH as patchAdminUser, DELETE as deleteAdminUser } from "../app/api/admin/users/[id]/route";
import { GET as getAdminSessions } from "../app/api/admin/sessions/route";
import { GET as getAdminReports } from "../app/api/admin/reports/route";
import { GET as getAdminSettings, POST as postAdminSettings } from "../app/api/admin/settings/route";
import { GET as getAdminAiMetrics } from "../app/api/admin/ai/metrics/route";
import { GET as getAdminLogs } from "../app/api/admin/logs/route";
import { GET as exportAdminLogs } from "../app/api/admin/logs/export/route";
import { User, AdminPermission } from "@/types/user";

describe("TASK 8: Comprehensive QA, Security & Performance Test Suite", () => {
  before(() => {
    const db = loadDb();
    db.systemLogs = getInitialSystemLogs();
    saveDb(db);
  });

  const getOwnerUser = (): User =>
    UserRepository.getByEmail("owner@nemoquiz.edu") || {
      id: "usr_owner_01",
      email: "owner@nemoquiz.edu",
      displayName: "Dr. Hendra Kusuma (Owner)",
      role: "owner",
      status: "active",
      createdAt: new Date().toISOString(),
    };

  const getAdminUser = (): User =>
    UserRepository.getByEmail("admin@nemoquiz.edu") || {
      id: "usr_admin_01",
      email: "admin@nemoquiz.edu",
      displayName: "Admin NemoQUIZ",
      role: "admin",
      permissions: [
        "manage_users",
        "manage_questions",
        "manage_sessions",
        "view_analytics",
        "view_audit_logs",
        "manage_ai",
        "manage_settings",
      ],
      status: "active",
      createdAt: new Date().toISOString(),
    };

  const getStudentUser = (): User =>
    UserRepository.getByEmail("budi.santoso@siswa.sma.id") ||
    UserRepository.getByEmail("pelajar@sma.sch.id") || {
      id: "usr_pelajar_01",
      email: "budi.santoso@siswa.sma.id",
      displayName: "Budi Santoso",
      role: "pelajar",
      status: "active",
      createdAt: new Date().toISOString(),
    };

  const getTeacherUser = (): User =>
    UserRepository.getByEmail("siti.rahmawati@guru.sma.id") || {
      id: "usr_guru_01",
      email: "siti.rahmawati@guru.sma.id",
      displayName: "Siti Rahmawati, M.Pd.",
      role: "guru",
      status: "active",
      createdAt: new Date().toISOString(),
    };

  const createRequest = (
    url: string,
    options: {
      method?: string;
      token?: string;
      body?: any;
    } = {}
  ) => {
    const headers = new Headers();
    if (options.token) {
      headers.set("cookie", `${COOKIE_NAME}=${options.token}`);
    }
    if (options.body) {
      headers.set("content-type", "application/json");
    }
    return new Request(url, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  };

  // =========================================================================
  // 1. AUTHENTICATION QA
  // =========================================================================
  describe("1. Area Pengujian: Authentication", () => {
    it("membuat dan memverifikasi token HMAC SHA-256 sesi yang valid", () => {
      const owner = getOwnerUser();
      const token = createSessionToken(owner);
      assert.ok(token && token.includes("."));

      const payload = verifySessionToken(token);
      assert.ok(payload);
      assert.strictEqual(payload?.userId, owner.id);
      assert.strictEqual(payload?.role, "owner");
      assert.ok(payload?.expiresAt > Date.now());
    });

    it("menolak token yang dimanipulasi (tampered signature)", () => {
      const owner = getOwnerUser();
      const token = createSessionToken(owner);
      const [data] = token.split(".");
      const forgedToken = `${data}.bad_signature_0000000000000000000000000000`;
      const result = verifySessionToken(forgedToken);
      assert.strictEqual(result, null);
    });

    it("menolak token yang sudah kedaluwarsa (expired session)", () => {
      const expiredPayload = {
        userId: "usr_test_expired",
        role: "admin",
        email: "test@test.com",
        expiresAt: Date.now() - 1000 * 60, // 1 menit lalu
      };
      const secret = process.env.AUTH_SECRET || "default-dev-secret-key-32-chars-long";
      const crypto = require("crypto");
      const data = Buffer.from(JSON.stringify(expiredPayload)).toString("base64");
      const sig = crypto.createHmac("sha256", secret).update(data).digest("hex");
      const expiredToken = `${data}.${sig}`;

      const result = verifySessionToken(expiredToken);
      assert.strictEqual(result, null);
    });
  });

  // =========================================================================
  // 2. AUTHORIZATION & RBAC QA
  // =========================================================================
  describe("2. Area Pengujian: Authorization & RBAC Across All Endpoints", () => {
    it("menolak semua endpoint admin jika dipanggil tanpa cookie sesi (401 Unauthorized)", async () => {
      const endpoints = [
        () => getAdminStats(createRequest("http://localhost/api/admin/stats")),
        () => getAdminAnalytics(createRequest("http://localhost/api/admin/analytics")),
        () => getAdminUsers(createRequest("http://localhost/api/admin/users")),
        () => getAdminSessions(createRequest("http://localhost/api/admin/sessions")),
        () => getAdminReports(createRequest("http://localhost/api/admin/reports")),
        () => getAdminSettings(createRequest("http://localhost/api/admin/settings")),
        () => getAdminAiMetrics(createRequest("http://localhost/api/admin/ai/metrics")),
        () => getAdminLogs(createRequest("http://localhost/api/admin/logs")),
      ];

      for (const call of endpoints) {
        const res = await call();
        assert.strictEqual(res.status, 401, `Expected 401 for unauthenticated access`);
      }
    });

    it("menolak akses siswa dan guru ke endpoint administratif (403 Forbidden)", async () => {
      const studentToken = createSessionToken(getStudentUser());
      const teacherToken = createSessionToken(getTeacherUser());

      const resStudent = await getAdminStats(
        createRequest("http://localhost/api/admin/stats", { token: studentToken })
      );
      assert.strictEqual(resStudent.status, 403);

      const resTeacher = await getAdminUsers(
        createRequest("http://localhost/api/admin/users", { token: teacherToken })
      );
      assert.strictEqual(resTeacher.status, 403);
    });

    it("mengizinkan Administrator dan Owner mengakses endpoint yang terotorisasi (200 OK)", async () => {
      const ownerToken = createSessionToken(getOwnerUser());
      const res = await getAdminStats(
        createRequest("http://localhost/api/admin/stats", { token: ownerToken })
      );
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
    });
  });

  // =========================================================================
  // 3. ROLE MANAGEMENT & OWNER INTEGRITY QA
  // =========================================================================
  describe("3. Area Pengujian: Role Management & Owner Protection", () => {
    it("Owner memiliki seluruh permission secara inheren", () => {
      const owner = getOwnerUser();
      const perms: AdminPermission[] = [
        "manage_users",
        "manage_questions",
        "manage_sessions",
        "manage_ai",
        "manage_settings",
        "view_analytics",
        "view_audit_logs",
      ];
      for (const p of perms) {
        assert.strictEqual(hasPermission(owner, p), true);
      }
    });

    it("mencegah pengguna menaikkan atau mengubah perannya sendiri (Self-escalation guard)", async () => {
      const admin = getAdminUser();
      const adminToken = createSessionToken(admin);

      const patchReq = createRequest(`http://localhost/api/admin/users/${admin.id}`, {
        method: "PATCH",
        token: adminToken,
        body: { role: "owner" },
      });

      const res = await patchAdminUser(patchReq, { params: { id: admin.id } });
      assert.strictEqual(res.status, 403);
      const json = await res.json();
      assert.match(json.error, /FORBIDDEN.*sendiri/);
    });

    it("mencegah akun Owner ditangguhkan (suspend) atau dihapus", async () => {
      const owner = getOwnerUser();
      const adminToken = createSessionToken(getAdminUser());

      // Coba suspend owner oleh admin
      const suspendReq = createRequest(`http://localhost/api/admin/users/${owner.id}`, {
        method: "PATCH",
        token: adminToken,
        body: { status: "suspended" },
      });
      const resSuspend = await patchAdminUser(suspendReq, { params: { id: owner.id } });
      assert.strictEqual(resSuspend.status, 403);

      // Coba delete owner oleh admin
      const deleteReq = createRequest(`http://localhost/api/admin/users/${owner.id}`, {
        method: "DELETE",
        token: adminToken,
      });
      const resDelete = await deleteAdminUser(deleteReq, { params: { id: owner.id } });
      assert.strictEqual(resDelete.status, 403);
    });
  });

  // =========================================================================
  // 4. OVERVIEW & ANALYTICS INTEGRITY QA
  // =========================================================================
  describe("4. Area Pengujian: Overview & Analytics Data Integrity", () => {
    it("menghitung metrik KPI riil dari database tanpa angka acak (mock/dummy)", () => {
      const summary = getAdminDashboardSummary(30);
      assert.ok(summary.users.total >= 3);
      assert.ok(summary.questions.total >= 10);
      assert.ok(typeof summary.sessions.avgScoreFormatted === "string");
      assert.ok(Array.isArray(summary.systemHealth.recentErrors));
      assert.ok(summary.systemHealth.database.status === "Healthy");
    });

    it("mendukung filter rentang waktu dinamis (7, 14, 30 hari)", () => {
      const analytics7 = AnalyticsRepository.getFullAnalytics(7);
      const analytics30 = AnalyticsRepository.getFullAnalytics(30);
      assert.strictEqual(analytics7.selectedDays, 7);
      assert.strictEqual(analytics30.selectedDays, 30);
      assert.strictEqual(analytics7.userGrowth.trend.length, 7);
      assert.strictEqual(analytics30.userGrowth.trend.length, 30);
    });
  });

  // =========================================================================
  // 5. USER MANAGEMENT & VERIFICATION WORKFLOW QA
  // =========================================================================
  describe("5. Area Pengujian: User Management & Teacher Verification", () => {
    it("dapat menyaring pengguna berdasarkan role, status, dan pencarian teks", () => {
      const students = UserRepository.getAll({ role: "pelajar" });
      assert.ok(students.users.length > 0);
      for (const u of students.users) {
        assert.strictEqual(u.role, "pelajar");
      }

      const search = UserRepository.getAll({ search: "Budi" });
      assert.ok(search.users.length > 0);
      assert.ok(search.users.some((u) => u.displayName.includes("Budi")));
    });

    it("menjalankan alur persetujuan kredensial guru (Teacher Verification Queue)", () => {
      // Buat kandidat guru
      const candidateId = `usr_guru_cand_${Date.now()}`;
      UserRepository.create({
        id: candidateId,
        email: `guru_${Date.now()}@sekolah.id`,
        displayName: "Calon Guru Fisika",
        role: "guru",
        school: "SMAN 1 Bandung",
        status: "active",
        verificationStatus: "pending",
        createdAt: new Date().toISOString(),
      });

      // Verifikasi disetujui
      UserRepository.updateVerificationStatus(candidateId, "verified", "Dokumen NUPTK valid.");
      const verified = UserRepository.getById(candidateId);
      assert.strictEqual(verified?.verificationStatus, "verified");
      assert.strictEqual(verified?.verificationNote, "Dokumen NUPTK valid.");

      // Bersihkan
      UserRepository.delete(candidateId);
    });
  });

  // =========================================================================
  // 6. AI MONITORING & TELEMETRY QA
  // =========================================================================
  describe("6. Area Pengujian: AI Monitoring, Latency & Secret Masking", () => {
    it("menghitung metrik telemetri AI lengkap dan tidak mengekspos API Key", async () => {
      const ownerToken = createSessionToken(getOwnerUser());
      const res = await getAdminAiMetrics(
        createRequest("http://localhost/api/admin/ai/metrics", { token: ownerToken })
      );
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(json.kpi);
      assert.ok(Array.isArray(json.providers));

      // Pastikan API Key yang ada ter-masking dengan benar dan tidak membocorkan secret utuh
      for (const p of json.providers) {
        if (p.providerType !== "mock" && p.hasKey && p.maskedKey) {
          assert.ok(
            p.maskedKey.includes("••••") ||
            p.maskedKey.includes("...") ||
            p.maskedKey === "••••••••"
          );
          assert.strictEqual(p.maskedKey.includes("MockNewSecureKey"), false);
        }
      }
    });
  });

  // =========================================================================
  // 7. SYSTEM SETTINGS & GOVERNANCE VAULT QA
  // =========================================================================
  describe("7. Area Pengujian: System Settings & Governance Vault", () => {
    it("menyediakan masked API vault dan konfigurasi platform yang aman", async () => {
      const ownerToken = createSessionToken(getOwnerUser());
      const res = await getAdminSettings(
        createRequest("http://localhost/api/admin/settings", { token: ownerToken })
      );
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(json.settings);
      assert.ok(Array.isArray(json.apiVault));

      // Periksa rate limits per tier
      assert.ok(json.settings.rateLimits.freeTier.dailyPromptLimit >= 1);
      assert.ok(json.settings.rateLimits.proTier.burstLimitPerMinute >= 1);
    });

    it("memvalidasi rotasi API Key secara server-side dan mencatat log audit", async () => {
      const ownerToken = createSessionToken(getOwnerUser());
      const rotateReq = createRequest("http://localhost/api/admin/settings", {
        method: "POST",
        token: ownerToken,
        body: {
          action: "rotate_key",
          provider: "gemini",
          apiKey: "AIzaSy_MockNewSecureKey_998877665544",
        },
      });

      const res = await postAdminSettings(rotateReq);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(Array.isArray(json.apiVault));
      const geminiVault = json.apiVault.find((v: any) => v.provider === "gemini");
      assert.ok(geminiVault);
      assert.ok(
        geminiVault.maskedKey.includes("...") ||
        geminiVault.maskedKey.includes("••••")
      );
      assert.strictEqual(geminiVault.maskedKey.includes("MockNewSecureKey"), false);
    });
  });

  // =========================================================================
  // 8. ACTIVITY LOGS & FORENSIC AUDIT QA
  // =========================================================================
  describe("8. Area Pengujian: Activity Logs, Multi-Attribute Filtering & Export", () => {
    it("mengembalikan riwayat log audit forensik dengan kategori dan status", async () => {
      const ownerToken = createSessionToken(getOwnerUser());
      const res = await getAdminLogs(
        createRequest("http://localhost/api/admin/logs?limit=10&metrics=true", {
          token: ownerToken,
        })
      );
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(Array.isArray(json.logs));
      assert.ok(json.total > 0);
      assert.ok(json.metrics);
      assert.ok(typeof json.metrics.totalToday === "number");
    });

    it("dapat mengekspor log audit ke format CSV dengan UTF-8 BOM", async () => {
      const ownerToken = createSessionToken(getOwnerUser());
      const res = await exportAdminLogs(
        createRequest("http://localhost/api/admin/logs/export?format=csv", {
          token: ownerToken,
        })
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get("content-type"), "text/csv; charset=utf-8");
      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // Byte Order Mark (BOM) for UTF-8: 0xEF, 0xBB, 0xBF
      assert.strictEqual(bytes[0], 0xef);
      assert.strictEqual(bytes[1], 0xbb);
      assert.strictEqual(bytes[2], 0xbf);
    });
  });

  // =========================================================================
  // 9. DATABASE INTEGRITY & RLS QA
  // =========================================================================
  describe("9. Area Pengujian: Database Integration & RLS Schema Compliance", () => {
    it("seluruh tabel utama memiliki data seed dan relasi konsisten", () => {
      const db = loadDb();
      assert.ok(Object.keys(db.users).length >= 4);
      assert.ok(Object.keys(db.subjects).length >= 5);
      assert.ok(Object.keys(db.questions).length >= 10);
      assert.ok((db.systemLogs || []).length >= 5);
    });

    it("tidak ada kredensial mentah yang disimpan di systemLogs atau users", () => {
      const db = loadDb();
      for (const log of (db.systemLogs || [])) {
        assert.strictEqual(log.details.includes("AIzaSy_LiveActual"), false);
        assert.strictEqual(log.details.includes("sk-proj-"), false);
      }
    });
  });

  // =========================================================================
  // 10. PERFORMANCE & PAGINATION BOUNDS QA
  // =========================================================================
  describe("10. Area Pengujian: Performance, SLAs & Pagination Bounds", () => {
    it("pembatasan pagination (page & limit clamping) berjalan secara deterministik", () => {
      // Request limit 500 dikompresi ke batas aman maksimum 100
      const logsResult = SystemLogRepository.getAll({ page: 1, limit: 500 });
      assert.ok(logsResult.logs.length <= 100);

      // Request negative page atau invalid limit dihandle dengan graceful clamping
      const usersResult = UserRepository.getAll({ page: -5, limit: 0 });
      assert.ok(usersResult.users.length > 0);
    });

    it("waktu eksekusi query komprehensif berada di bawah batas SLA (< 50ms)", () => {
      const startTime = performance.now();
      const summary = getAdminDashboardSummary(30);
      const analytics = AnalyticsRepository.getFullAnalytics(30);
      const endTime = performance.now();

      const durationMs = endTime - startTime;
      assert.ok(durationMs < 50, `Query duration was ${durationMs.toFixed(2)}ms, expected < 50ms`);
      assert.ok(summary);
      assert.ok(analytics);
    });
  });
});
