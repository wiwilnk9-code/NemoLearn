import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  reserveAiQuota,
  confirmAiQuota,
  releaseAiQuota,
  getUserQuotaStatus,
  getAdminAiQuotaOverview,
  grantUserAiAccess,
  revokeUserAiAccess,
  setUserQuotaOverride,
  updateAiQuotaSettings,
  getJakartaDateString,
  getNextJakartaMidnightIso,
  checkRateLimit,
  resetRateLimitsForTesting,
  hasAiAccess,
  getUserEffectiveDailyQuota,
  getAiQuotaConfig,
} from "./ai/quota-manager";
import {
  UserRepository,
  UserQuotaRepository,
  WebsiteSettingsRepository,
} from "./db";
import { User } from "@/types/user";
import { createSessionToken } from "./auth/server";
import { GET as getQuotaStatus } from "@/app/api/ai/quota-status/route";
import {
  GET as getAdminQuotas,
  POST as postAdminQuotas,
  PATCH as patchAdminQuotas,
} from "@/app/api/admin/ai/quotas/route";
import { POST as postGenerator } from "@/app/api/generator/route";

describe("NemoLearn TASK 3 — AI Quota Management & Usage Control Suite", () => {
  let ownerUser: User;
  let studentUser: User;
  let testStudent: User;

  beforeEach(() => {
    resetRateLimitsForTesting();

    // Pastikan konfigurasi kuota dalam kondisi default
    const currentSettings = WebsiteSettingsRepository.get();
    WebsiteSettingsRepository.update({
      aiQuota: {
        enabled: true,
        emergencyShutdown: false,
        ownerDailyQuota: 50,
        defaultUserDailyQuota: 10,
        globalDailyLimit: 200,
        globalDailyQuestionsLimit: 2000,
        rateLimitRpm: 5,
        maxQuestionsPerRequest: 15,
        timezone: "Asia/Jakarta",
      },
    });

    ownerUser = UserRepository.getById("usr_owner_01")!;
    studentUser = UserRepository.getById("usr_pelajar_01")!;

    // Buat akun tes khusus untuk isolasi mutasi hak akses
    const testId = `usr_test_${Date.now()}`;
    testStudent = UserRepository.create({
      id: testId,
      email: `${testId}@siswa.sma.id`,
      displayName: "Siswa Pengujian Kuota",
      role: "pelajar",
      emailVerified: true,
      hasAiAccess: false,
      createdAt: new Date().toISOString(),
      status: "active",
    });
  });

  describe("1. Authorized AI Access & Role Isolation", () => {
    it("Owner selalu memiliki akses AI secara inheren tanpa perlu izin manual", () => {
      assert.strictEqual(hasAiAccess(ownerUser), true);
      const quota = getUserEffectiveDailyQuota(ownerUser);
      assert.strictEqual(quota, 50);
    });

    it("Default akun siswa baru TIDAK memiliki izin akses AI (hasAiAccess: false)", () => {
      assert.strictEqual(hasAiAccess(testStudent), false);
    });

    it("Owner dapat memberikan izin akses AI kepada siswa", () => {
      const updated = grantUserAiAccess(testStudent.id, ownerUser);
      assert.strictEqual(updated.hasAiAccess, true);
      assert.strictEqual(updated.aiAccessGrantedBy, ownerUser.id);
      assert.ok(updated.aiAccessGrantedAt);

      const reloaded = UserRepository.getById(testStudent.id)!;
      assert.strictEqual(reloaded.hasAiAccess, true);
      assert.strictEqual(hasAiAccess(reloaded), true);
    });

    it("Owner dapat mencabut izin akses AI dari siswa", () => {
      grantUserAiAccess(testStudent.id, ownerUser);
      const revoked = revokeUserAiAccess(testStudent.id, ownerUser);
      assert.strictEqual(revoked.hasAiAccess, false);

      const reloaded = UserRepository.getById(testStudent.id)!;
      assert.strictEqual(reloaded.hasAiAccess, false);
      assert.strictEqual(hasAiAccess(reloaded), false);
    });

    it("Siswa atau pengguna non-owner DILARANG memberikan izin akses AI (Privilege Escalation Guard)", () => {
      assert.throws(
        () => grantUserAiAccess(testStudent.id, studentUser),
        /FORBIDDEN/
      );
    });

    it("Pengguna dilarang memberikan izin atau mengubah kuota untuk dirinya sendiri", () => {
      assert.throws(
        () => grantUserAiAccess(ownerUser.id, ownerUser),
        /INVALID_ACTION/
      );
      assert.throws(
        () => setUserQuotaOverride(ownerUser.id, 100, ownerUser),
        /INVALID_ACTION/
      );
    });

    it("Akses AI Owner tidak dapat dicabut", () => {
      assert.throws(
        () => revokeUserAiAccess(ownerUser.id, ownerUser),
        /INVALID_ACTION/
      );
    });
  });

  describe("2. Kuota Individual Override & Konfigurasi Batas", () => {
    it("Siswa menggunakan default daily quota (10 kali/hari) jika tidak ada override", () => {
      grantUserAiAccess(testStudent.id, ownerUser);
      const quota = getUserEffectiveDailyQuota(testStudent);
      assert.strictEqual(quota, 10);
    });

    it("Owner dapat menetapkan kuota harian individual override untuk pengguna tertentu", () => {
      grantUserAiAccess(testStudent.id, ownerUser);
      const updated = setUserQuotaOverride(testStudent.id, 25, ownerUser);
      assert.strictEqual(updated.dailyAiQuotaOverride, 25);

      const quota = getUserEffectiveDailyQuota(updated);
      assert.strictEqual(quota, 25);
    });

    it("Owner dapat mereset kuota harian individual override kembali ke default", () => {
      setUserQuotaOverride(testStudent.id, 30, ownerUser);
      const reset = setUserQuotaOverride(testStudent.id, null, ownerUser);
      assert.strictEqual(reset.dailyAiQuotaOverride, undefined);

      const quota = getUserEffectiveDailyQuota(reset);
      assert.strictEqual(quota, 10);
    });

    it("Owner dapat memperbarui konfigurasi kuota global platform", () => {
      const newConfig = updateAiQuotaSettings(
        {
          ownerDailyQuota: 60,
          defaultUserDailyQuota: 15,
          globalDailyLimit: 300,
          maxQuestionsPerRequest: 12,
        },
        ownerUser
      );

      assert.strictEqual(newConfig.ownerDailyQuota, 60);
      assert.strictEqual(newConfig.defaultUserDailyQuota, 15);
      assert.strictEqual(newConfig.globalDailyLimit, 300);
      assert.strictEqual(newConfig.maxQuestionsPerRequest, 12);
      assert.strictEqual(newConfig.timezone, "Asia/Jakarta");
    });
  });

  describe("3. Mekanisme Reservasi Atomik, Konfirmasi, dan Refund Kuota", () => {
    it("Menolak reservasi untuk siswa yang belum memiliki izin akses (403 UNAUTHORIZED_AI_ACCESS)", () => {
      const res = reserveAiQuota(testStudent, 5);
      assert.strictEqual(res.success, false);
      if (!res.success) {
        assert.strictEqual(res.statusCode, 403);
        assert.strictEqual(res.code, "UNAUTHORIZED_AI_ACCESS");
      }
    });

    it("Menolak permintaan jika jumlah soal melebihi batas maksimum per request (400 EXCEEDS_MAX_QUESTIONS)", () => {
      grantUserAiAccess(testStudent.id, ownerUser);
      const res = reserveAiQuota(testStudent, 16); // max 15
      assert.strictEqual(res.success, false);
      if (!res.success) {
        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.code, "EXCEEDS_MAX_QUESTIONS");
      }
    });

    it("Reservasi berhasil menginkremen requestsReserved dan mengurangi sisa kuota", () => {
      grantUserAiAccess(testStudent.id, ownerUser);
      const res = reserveAiQuota(testStudent, 10);
      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.ok(res.reservationId);
        assert.strictEqual(res.remainingQuota, 9); // 10 - 1

        const record = UserQuotaRepository.get(testStudent.id, res.quotaDate);
        assert.ok(record);
        assert.strictEqual(record.requestsReserved, 1);
        assert.strictEqual(record.requestsUsed, 0);
      }
    });

    it("Konfirmasi penggunaan berhasil: decrement requestsReserved & increment requestsUsed", () => {
      grantUserAiAccess(testStudent.id, ownerUser);
      const res = reserveAiQuota(testStudent, 10);
      assert.strictEqual(res.success, true);
      if (res.success) {
        confirmAiQuota({
          userId: testStudent.id,
          reservationId: res.reservationId,
          quotaDate: res.quotaDate,
          questionsCount: 10,
          tokensConsumed: 1500,
        });

        const record = UserQuotaRepository.get(testStudent.id, res.quotaDate);
        assert.ok(record);
        assert.strictEqual(record.requestsReserved, 0);
        assert.strictEqual(record.requestsUsed, 1);
        assert.strictEqual(record.questionsGenerated, 10);
        assert.strictEqual(record.tokensConsumed, 1500);
      }
    });

    it("Refund kuota saat error provider AI: melepaskan reservasi TANPA menambah pemakaian", () => {
      grantUserAiAccess(testStudent.id, ownerUser);
      const res = reserveAiQuota(testStudent, 10);
      assert.strictEqual(res.success, true);
      if (res.success) {
        releaseAiQuota({
          userId: testStudent.id,
          reservationId: res.reservationId,
          quotaDate: res.quotaDate,
          reason: "Gemini API Timeout error",
        });

        const record = UserQuotaRepository.get(testStudent.id, res.quotaDate);
        assert.ok(record);
        assert.strictEqual(record.requestsReserved, 0);
        assert.strictEqual(record.requestsUsed, 0); // Kuota utuh kembali!
      }
    });

    it("Menolak permintaan saat kuota harian pengguna habis (429 USER_QUOTA_EXHAUSTED)", () => {
      grantUserAiAccess(testStudent.id, ownerUser);
      setUserQuotaOverride(testStudent.id, 2, ownerUser); // limit 2

      const r1 = reserveAiQuota(testStudent, 5);
      assert.strictEqual(r1.success, true);
      if (r1.success) {
        confirmAiQuota({
          userId: testStudent.id,
          reservationId: r1.reservationId,
          questionsCount: 5,
        });
      }

      const r2 = reserveAiQuota(testStudent, 5);
      assert.strictEqual(r2.success, true);
      if (r2.success) {
        confirmAiQuota({
          userId: testStudent.id,
          reservationId: r2.reservationId,
          questionsCount: 5,
        });
      }

      // Permintaan ke-3 harus ditolak karena kuota 2 telah habis
      const r3 = reserveAiQuota(testStudent, 5);
      assert.strictEqual(r3.success, false);
      if (!r3.success) {
        assert.strictEqual(r3.statusCode, 429);
        assert.strictEqual(r3.code, "USER_QUOTA_EXHAUSTED");
      }
    });

    it("Mencegah race condition ketika beberapa permintaan masuk secara bersamaan", () => {
      grantUserAiAccess(testStudent.id, ownerUser);
      setUserQuotaOverride(testStudent.id, 3, ownerUser);

      // Lakukan 5 reservasi beruntun
      const results = [
        reserveAiQuota(testStudent, 5),
        reserveAiQuota(testStudent, 5),
        reserveAiQuota(testStudent, 5),
        reserveAiQuota(testStudent, 5),
        reserveAiQuota(testStudent, 5),
      ];

      const successful = results.filter((r) => r.success);
      const rejected = results.filter((r) => !r.success);

      assert.strictEqual(successful.length, 3);
      assert.strictEqual(rejected.length, 2);
    });
  });

  describe("4. Sliding-Window Rate Limit & Emergency AI Shutdown", () => {
    it("Sliding-window rate limiter memblokir permintaan melebihi 5 RPM", () => {
      const uid = "usr_rate_limit_test";
      for (let i = 0; i < 5; i++) {
        const check = checkRateLimit(uid, 5);
        assert.strictEqual(check.allowed, true);
      }
      const sixth = checkRateLimit(uid, 5);
      assert.strictEqual(sixth.allowed, false);
      assert.ok(sixth.retryAfterSeconds! > 0);
    });

    it("Emergency AI Shutdown memblokir seluruh generasi soal seketika (503 EMERGENCY_SHUTDOWN)", () => {
      grantUserAiAccess(testStudent.id, ownerUser);
      updateAiQuotaSettings({ emergencyShutdown: true }, ownerUser);

      const res = reserveAiQuota(testStudent, 5);
      assert.strictEqual(res.success, false);
      if (!res.success) {
        assert.strictEqual(res.statusCode, 503);
        assert.strictEqual(res.code, "EMERGENCY_SHUTDOWN");
      }

      // Bahkan Owner pun terblokir jika emergency shutdown aktif
      const ownerRes = reserveAiQuota(ownerUser, 5);
      assert.strictEqual(ownerRes.success, false);
      if (!ownerRes.success) {
        assert.strictEqual(ownerRes.statusCode, 503);
      }

      // Pulihkan kembali emergency shutdown ke false agar tidak mempengaruhi pengujian lain
      updateAiQuotaSettings({ emergencyShutdown: false }, ownerUser);
    });
  });

  describe("5. Timezone Asia/Jakarta & Midnight 00:00 Reset", () => {
    it("Menghitung tanggal kuota secara tepat dalam zona waktu Asia/Jakarta (WIB)", () => {
      const dateStr = getJakartaDateString();
      assert.match(dateStr, /^\d{4}-\d{2}-\d{2}$/);
    });

    it("Menghitung reset midnight 00:00 WIB berikutnya dalam format ISO yang valid", () => {
      const midnightIso = getNextJakartaMidnightIso();
      assert.ok(midnightIso);
      const parsed = new Date(midnightIso);
      assert.ok(!isNaN(parsed.getTime()));
      assert.ok(parsed.getTime() > Date.now());
    });
  });

  describe("6. API Endpoints Security & Authorization Integration", () => {
    it("GET /api/ai/quota-status mengembalikan 401 jika tanpa sesi", async () => {
      const req = new Request("http://localhost:3000/api/ai/quota-status");
      const res = await getQuotaStatus(req);
      assert.strictEqual(res.status, 401);
    });

    it("GET /api/ai/quota-status mengembalikan status kuota akurat untuk user login", async () => {
      grantUserAiAccess(testStudent.id, ownerUser);
      const token = createSessionToken(testStudent);
      const req = new Request("http://localhost:3000/api/ai/quota-status", {
        headers: { cookie: `nemoquiz_session=${token}` },
      });
      const res = await getQuotaStatus(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.quota.hasAiAccess, true);
      assert.strictEqual(data.quota.dailyQuota, 10);
      assert.strictEqual(data.quota.remainingToday, 10);
    });

    it("GET /api/admin/ai/quotas menolak akses siswa (403 FORBIDDEN)", async () => {
      const token = createSessionToken(studentUser);
      const req = new Request("http://localhost:3000/api/admin/ai/quotas", {
        headers: { cookie: `nemoquiz_session=${token}` },
      });
      const res = await getAdminQuotas(req);
      assert.strictEqual(res.status, 403);
    });

    it("GET /api/admin/ai/quotas mengizinkan Owner dan mengembalikan ringkasan lengkap", async () => {
      const token = createSessionToken(ownerUser);
      const req = new Request("http://localhost:3000/api/admin/ai/quotas", {
        headers: { cookie: `nemoquiz_session=${token}` },
      });
      const res = await getAdminQuotas(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.stats);
      assert.ok(Array.isArray(data.users));
    });

    it("PATCH /api/admin/ai/quotas memungkinkan Owner memberikan izin dan mengubah kuota", async () => {
      const token = createSessionToken(ownerUser);

      // 1. Grant access
      const grantReq = new Request("http://localhost:3000/api/admin/ai/quotas", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: `nemoquiz_session=${token}`,
        },
        body: JSON.stringify({
          action: "grant",
          targetUserId: testStudent.id,
        }),
      });
      const grantRes = await patchAdminQuotas(grantReq);
      assert.strictEqual(grantRes.status, 200);

      // 2. Override quota
      const overrideReq = new Request("http://localhost:3000/api/admin/ai/quotas", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: `nemoquiz_session=${token}`,
        },
        body: JSON.stringify({
          action: "override",
          targetUserId: testStudent.id,
          dailyAiQuotaOverride: 40,
        }),
      });
      const overrideRes = await patchAdminQuotas(overrideReq);
      assert.strictEqual(overrideRes.status, 200);

      const reloaded = UserRepository.getById(testStudent.id)!;
      assert.strictEqual(reloaded.hasAiAccess, true);
      assert.strictEqual(reloaded.dailyAiQuotaOverride, 40);
    });

    it("POST /api/generator menolak siswa yang belum memiliki izin akses AI (403)", async () => {
      const token = createSessionToken(testStudent);
      const req = new Request("http://localhost:3000/api/generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `nemoquiz_session=${token}`,
        },
        body: JSON.stringify({
          subjectId: "matematika",
          topicId: "aljabar-persamaan",
          questionCount: 5,
          fallbackToManual: true,
        }),
      });

      const res = await postGenerator(req);
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.code, "UNAUTHORIZED_AI_ACCESS");
    });

    it("POST /api/generator mengizinkan generasi soal saat siswa telah diberi izin oleh Owner", async () => {
      grantUserAiAccess(testStudent.id, ownerUser);
      const token = createSessionToken(testStudent);
      const req = new Request("http://localhost:3000/api/generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `nemoquiz_session=${token}`,
        },
        body: JSON.stringify({
          subjectId: "matematika",
          topicId: "aljabar-persamaan",
          questionCount: 5,
          fallbackToManual: true,
        }),
      });

      const res = await postGenerator(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.sessionId);

      // Verifikasi kuota terkonsumsi di database
      const dateStr = getJakartaDateString();
      const quotaRecord = UserQuotaRepository.get(testStudent.id, dateStr);
      assert.ok(quotaRecord);
      assert.strictEqual(quotaRecord.requestsUsed, 1);
      assert.strictEqual(quotaRecord.requestsReserved, 0);
    });
  });
});
