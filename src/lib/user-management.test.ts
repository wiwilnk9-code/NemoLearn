import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { UserRepository, SystemLogRepository, loadDb, saveDb } from "./db";
import { User, UserRole, AdminPermission } from "@/types/user";

describe("TASK 4: User Management & Verification Test Suite", () => {
  beforeEach(() => {
    // Reset seed users for predictable test results
    const db = loadDb();
    db.users = {
      usr_pelajar_01: {
        id: "usr_pelajar_01",
        email: "budi.santoso@siswa.sma.id",
        displayName: "Budi Santoso",
        role: "pelajar",
        school: "SMAN 1 Jakarta",
        status: "active",
        verificationStatus: "verified",
        createdAt: new Date("2026-09-01T08:00:00Z").toISOString(),
        lastActiveAt: new Date("2026-11-04T07:30:00Z").toISOString(),
      },
      usr_pelajar_03: {
        id: "usr_pelajar_03",
        email: "farhan.alamsyah@gmail.com",
        displayName: "Farhan Alamsyah",
        role: "pelajar",
        school: "SMA Negeri 8 Medan",
        status: "suspended",
        verificationStatus: "unverified",
        createdAt: new Date("2026-08-08T12:00:00Z").toISOString(),
      },
      usr_guru_cand_01: {
        id: "usr_guru_cand_01",
        email: "bambang.wijaya@guru.sma.id",
        displayName: "Dr. Bambang Wijaya",
        role: "guru",
        school: "SMA Negeri 3 Yogyakarta",
        nuptk: "8192837461920001",
        subject: "Fisika Quantum",
        portfolioUrl: "https://drive.google.com/portfolio-dr-bambang",
        verificationNote: "SK Kepala Sekolah & Ijazah S3",
        status: "active",
        verificationStatus: "pending",
        createdAt: new Date("2026-10-25T10:00:00Z").toISOString(),
      },
      usr_admin_01: {
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
        ],
        status: "active",
        verificationStatus: "verified",
        createdAt: new Date("2026-08-01T00:00:00Z").toISOString(),
      },
      usr_owner_01: {
        id: "usr_owner_01",
        email: "owner@nemoquiz.edu",
        displayName: "Dr. Hendra Kusuma (Owner)",
        role: "owner",
        status: "active",
        verificationStatus: "verified",
        createdAt: new Date("2026-07-01T00:00:00Z").toISOString(),
      },
    };

    // Seed mock practice session for learning stats
    db.sessions = {
      ses_test_01: {
        id: "ses_test_01",
        userId: "usr_pelajar_01",
        config: {
          subjectId: "fisika_sma",
          topicId: "kinematika",
          mode: "reguler",
        },
        status: "completed",
        questionIds: ["q1", "q2", "q3"],
        score: 85,
        scoreFormatted: "85,00",
        startedAt: new Date("2026-11-04T07:00:00Z").toISOString(),
        completedAt: new Date("2026-11-04T07:25:00Z").toISOString(),
      },
    };

    saveDb(db, true);
  });

  describe("1. Query & Filtering Pengguna (UserRepository.getAll)", () => {
    it("Mengembalikan seluruh pengguna beserta statistik metrik bento", () => {
      const result = UserRepository.getAll();
      assert.strictEqual(result.total, 5);
      assert.ok(result.stats);
      assert.strictEqual(result.stats.total, 5);
      assert.strictEqual(result.stats.active, 4);
      assert.strictEqual(result.stats.suspended, 1);
      assert.strictEqual(result.stats.pendingVerification, 1);
      assert.strictEqual(result.stats.byRole.pelajar, 2);
      assert.strictEqual(result.stats.byRole.guru, 1);
      assert.strictEqual(result.stats.byRole.admin, 1);
      assert.strictEqual(result.stats.byRole.owner, 1);
    });

    it("Dapat menyaring berdasarkan role (misal guru)", () => {
      const result = UserRepository.getAll({ role: "guru" });
      assert.strictEqual(result.total, 1);
      assert.strictEqual(result.users[0].displayName, "Dr. Bambang Wijaya");
    });

    it("Dapat menyaring berdasarkan status verifikasi (misal pending)", () => {
      const result = UserRepository.getAll({ verificationStatus: "pending" });
      assert.strictEqual(result.total, 1);
      assert.strictEqual(result.users[0].id, "usr_guru_cand_01");
      assert.strictEqual(result.users[0].verificationStatus, "pending");
    });

    it("Dapat menyaring akun yang ditangguhkan (suspended)", () => {
      const result = UserRepository.getAll({ status: "suspended" });
      assert.strictEqual(result.total, 1);
      assert.strictEqual(result.users[0].id, "usr_pelajar_03");
      assert.strictEqual(result.users[0].status, "suspended");
    });

    it("Dapat melakukan pencarian multi-atribut (nama, email, NUPTK, sekolah)", () => {
      // Cari nama
      let res = UserRepository.getAll({ search: "bambang" });
      assert.strictEqual(res.total, 1);
      assert.strictEqual(res.users[0].displayName, "Dr. Bambang Wijaya");

      // Cari NUPTK
      res = UserRepository.getAll({ search: "819283746192" });
      assert.strictEqual(res.total, 1);
      assert.strictEqual(res.users[0].id, "usr_guru_cand_01");

      // Cari sekolah
      res = UserRepository.getAll({ search: "Medan" });
      assert.strictEqual(res.total, 1);
      assert.strictEqual(res.users[0].displayName, "Farhan Alamsyah");
    });
  });

  describe("2. Alur Verifikasi Kredensial Pengajar", () => {
    it("Dapat menyetujui (approve) pengajar dan menerbitkan status verified", () => {
      const updated = UserRepository.updateVerificationStatus(
        "usr_guru_cand_01",
        "verified",
        "Dokumen NUPTK valid dan terkonfirmasi Dapodik."
      );

      assert.ok(updated);
      assert.strictEqual(updated.verificationStatus, "verified");
      assert.strictEqual(updated.verificationNote, "Dokumen NUPTK valid dan terkonfirmasi Dapodik.");

      // Periksa dari getAll
      const res = UserRepository.getAll();
      assert.strictEqual(res.stats.pendingVerification, 0);
    });

    it("Dapat menolak (reject) pengajuan kredensial guru dengan catatan", () => {
      const updated = UserRepository.updateVerificationStatus(
        "usr_guru_cand_01",
        "rejected",
        "Lampiran ijazah tidak terbaca dan NUPTK belum aktif."
      );

      assert.ok(updated);
      assert.strictEqual(updated.verificationStatus, "rejected");
      assert.strictEqual(updated.verificationNote, "Lampiran ijazah tidak terbaca dan NUPTK belum aktif.");
    });
  });

  describe("3. Rekam Jejak Belajar & Analitik Pengguna (getLearningStats)", () => {
    it("Menghitung total sesi, sesi selesai, dan rata-rata skor siswa secara akurat", () => {
      const stats = UserRepository.getLearningStats("usr_pelajar_01");
      assert.strictEqual(stats.totalSessions, 1);
      assert.strictEqual(stats.completedSessions, 1);
      assert.strictEqual(stats.avgScoreFormatted, "85,00");
      assert.strictEqual(stats.recentSessions.length, 1);
      assert.strictEqual(stats.recentSessions[0].id, "ses_test_01");
    });

    it("Menangani pengguna tanpa riwayat sesi secara elegan (graceful fallback)", () => {
      const stats = UserRepository.getLearningStats("usr_pelajar_03");
      assert.strictEqual(stats.totalSessions, 0);
      assert.strictEqual(stats.completedSessions, 0);
      assert.strictEqual(stats.avgScoreFormatted, "-");
      assert.strictEqual(stats.recentSessions.length, 0);
    });
  });

  describe("4. Proteksi Hak Akses & Integritas Akun Administratif", () => {
    it("Mencegah penonaktifan (suspend) akun admin/owner terakhir", () => {
      const db = loadDb();
      const adminBackup = db.users["usr_admin_01"];
      delete db.users["usr_admin_01"];
      saveDb(db, true);

      assert.throws(() => {
        UserRepository.updateStatus("usr_owner_01", "suspended");
      }, /Tidak dapat menonaktifkan/);

      // Restore
      db.users["usr_admin_01"] = adminBackup;
      saveDb(db, true);
    });

    it("Mencegah penghapusan satu-satunya admin/owner tersisa", () => {
      const db = loadDb();
      const adminBackup = db.users["usr_admin_01"];
      delete db.users["usr_admin_01"];
      saveDb(db, true);

      assert.throws(() => {
        UserRepository.delete("usr_owner_01");
      }, /Tidak dapat menghapus satu-satunya akun administrator/);

      // Restore
      db.users["usr_admin_01"] = adminBackup;
      saveDb(db, true);
    });

    it("Owner dapat memperbarui hak izin modular (permissions) akun admin", () => {
      const newPerms: AdminPermission[] = ["manage_users", "manage_questions"];
      const updated = UserRepository.updatePermissions("usr_admin_01", newPerms);

      assert.ok(updated);
      assert.deepStrictEqual(updated.permissions, newPerms);
    });
  });
});
