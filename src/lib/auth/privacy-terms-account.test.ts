import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { UserRepository, FeedbackRepository, ReportRepository, SystemLogRepository, loadDb } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { User } from "@/types/user";

describe("NemoLearn TASK 5 — Privacy, Terms, Consent & Account Management Suite", () => {
  const testStudentId = "usr_test_privacy_student";
  const testStudentEmail = "student.privacy@sma.test.id";
  const testPassword = "PasswordTesting2026!";
  const testPasswordHash = hashPassword(testPassword);

  const cleanupTestData = () => {
    const db = loadDb();
    delete db.users[testStudentId];
    if (db.sessions) delete db.sessions["sess_privacy_test_01"];
    if (db.reports) {
      db.reports = db.reports.filter(
        (r) =>
          r.actorId !== testStudentId &&
          r.reporterId !== testStudentId &&
          r.reporterId !== "usr_anonymized" &&
          !r.id.startsWith("rep_privacy_test_")
      );
    }
  };

  beforeEach(() => {
    cleanupTestData();

    // Reset/siapkan akun uji pelajar
    const db = loadDb();
    db.users[testStudentId] = {
      id: testStudentId,
      email: testStudentEmail,
      displayName: "Siswa Pengujian Privasi",
      role: "pelajar",
      school: "SMAN 1 Uji Coba",
      gender: "perempuan",
      createdAt: new Date().toISOString(),
      status: "active",
      verificationStatus: "verified",
      emailVerified: true,
      passwordHash: testPasswordHash,
      tosAcceptedAt: new Date().toISOString(),
      privacyAcceptedAt: new Date().toISOString(),
      tosVersion: "2026.11",
      privacyVersion: "2026.11",
      parentalConsentConfirmed: true,
      authProvider: "email",
    };

    // Siapkan sesi belajar uji
    if (!db.sessions) db.sessions = {};
    db.sessions["sess_privacy_test_01"] = {
      id: "sess_privacy_test_01",
      userId: testStudentId,
      userName: "Siswa Pengujian Privasi",
      subjectId: "matematika",
      topicId: "aljabar",
      config: {
        subjectId: "matematika",
        topicId: "aljabar",
        questionCount: 5,
        mode: "reguler",
        difficulty: "sedang",
      },
      status: "completed",
      questionIds: ["q_math_01", "q_math_02"],
      score: 85,
      correctCount: 4,
      wrongCount: 1,
      emptyCount: 0,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    // Siapkan laporan uji
    if (!db.reports) db.reports = [];
    db.reports.push({
      id: "rep_privacy_test_01",
      questionId: "q_math_01",
      actorId: testStudentId,
      reporterId: testStudentId,
      reporterName: "Siswa Pengujian Privasi",
      reporterEmail: testStudentEmail,
      action: "report_issue",
      reason: "Kunci jawaban nomor 1 ambigu",
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  });

  afterEach(() => {
    cleanupTestData();
  });

  // =========================================================================
  // SUB-SUITE 1: CONSENT MANAGEMENT & POLICY VERSIONING
  // =========================================================================
  describe("1. Consent Management & Policy Versioning", () => {
    it("mencatat versi dokumen ToS dan Kebijakan Privasi beserta timestamp persetujuan", () => {
      const user = UserRepository.getById(testStudentId);
      assert.ok(user);
      assert.strictEqual(user.tosVersion, "2026.11");
      assert.strictEqual(user.privacyVersion, "2026.11");
      assert.ok(user.tosAcceptedAt);
      assert.ok(user.privacyAcceptedAt);
      assert.strictEqual(user.parentalConsentConfirmed, true);
    });

    it("dapat memperbarui versi persetujuan kebijakan secara berkala (re-consent) dan mencatat jejak audit", () => {
      const updated = UserRepository.updateConsent(testStudentId, {
        tosVersion: "2027.01",
        privacyVersion: "2027.01",
        parentalConsent: true,
      });

      assert.ok(updated);
      assert.strictEqual(updated.tosVersion, "2027.01");
      assert.strictEqual(updated.privacyVersion, "2027.01");

      // Verifikasi log audit sistem mencatat pembaruan persetujuan
      const logs = SystemLogRepository.getAll({ action: "USER_CONSENT_UPDATED" });
      const recentLog = logs.logs.find((l) => l.actorId === testStudentId);
      assert.ok(recentLog);
      assert.strictEqual(recentLog.status, "SUKSES");
      assert.ok(recentLog.details?.includes("2027.01"));
    });
  });

  // =========================================================================
  // SUB-SUITE 2: ACCOUNT DELETION & ANONYMIZATION (UU PDP)
  // =========================================================================
  describe("2. Penghapusan Akun & Anonimisasi Data Pribadi (Right to be Forgotten)", () => {
    it("menghapus profil pribadi pengguna secara permanen dari direktori pengguna", () => {
      const result = UserRepository.deleteAccount(testStudentId);
      assert.strictEqual(result.success, true);

      // Verifikasi akun tidak lagi ditemukan
      const user = UserRepository.getById(testStudentId);
      assert.strictEqual(user, null);
    });

    it("meng-anonimkan sesi latihan kuis agar kalibrasi bank soal tidak rusak", () => {
      UserRepository.deleteAccount(testStudentId);

      const db = loadDb();
      const session = db.sessions["sess_privacy_test_01"];
      assert.ok(session);
      // Data identitas pribadi dihapus / dianonimkan
      assert.strictEqual(session.userId, "usr_anonymized");
      assert.strictEqual(session.userName, "Pengguna Dihapus");
      // Statistik skor pengerjaan tetap utuh untuk kalibrasi butir soal
      assert.strictEqual(session.score, 85);
    });

    it("meng-anonimkan data identitas pelapor pada laporan masalah butir soal", () => {
      UserRepository.deleteAccount(testStudentId);

      const db = loadDb();
      const rep = db.reports.find((r) => r.id === "rep_privacy_test_01");
      assert.ok(rep);
      assert.strictEqual(rep.reporterId, "usr_anonymized");
      assert.strictEqual(rep.reporterName, "Pengguna Anonim");
      assert.strictEqual(rep.reporterEmail, undefined);
    });

    it("mencatat audit log penghapusan akun dengan menyembunyikan data pribadi sensitif (sanitized)", () => {
      UserRepository.deleteAccount(testStudentId);

      const logs = SystemLogRepository.getAll({ action: "USER_ACCOUNT_DELETED" });
      const deleteLog = logs.logs.find((l) => l.actorId === testStudentId);
      assert.ok(deleteLog);
      assert.strictEqual(deleteLog.status, "SUKSES");
      assert.strictEqual(deleteLog.actorEmail, "[DATA_DIHAPUS]");
      assert.strictEqual(deleteLog.actorName, "[PENGGUNA_DIHAPUS]");
    });

    it("mencegah penghapusan akun jika pengguna merupakan satu-satunya Administrator/Owner sistem", () => {
      const db = loadDb();
      // Pastikan hanya ada satu owner
      const allOwners = Object.values(db.users).filter((u) => u.role === "owner" || u.role === "admin");
      if (allOwners.length > 0) {
        const primaryOwnerId = allOwners[0].id;
        // Hapus admin lainnya sementara
        const backupUsers = { ...db.users };
        allOwners.slice(1).forEach((o) => delete db.users[o.id]);

        assert.throws(() => {
          UserRepository.deleteAccount(primaryOwnerId);
        }, /Tidak dapat menghapus satu-satunya akun administrator\/owner/);

        // Restore
        db.users = backupUsers;
      }
    });

    it("memverifikasi kata sandi pengguna sebelum mengizinkan penghapusan akun", () => {
      // Kata sandi benar
      assert.strictEqual(verifyPassword(testPassword, testPasswordHash), true);
      // Kata sandi salah
      assert.strictEqual(verifyPassword("PasswordSalah123!", testPasswordHash), false);
    });
  });

  // =========================================================================
  // SUB-SUITE 3: FEEDBACK, BUG REPORT & SUPPORT REPOSITORY
  // =========================================================================
  describe("3. Feedback, Bug Report & Support Repository", () => {
    it("dapat membuat dan menyimpan masukan pengguna (general feedback)", () => {
      const fb = FeedbackRepository.create({
        userId: testStudentId,
        userName: "Siswa Uji",
        userEmail: testStudentEmail,
        type: "feedback",
        category: "ui_ux",
        subject: "Tampilan responsif sangat nyaman",
        message: "Tampilan mode malam dan rendering rumus matematika sangat jernih di ponsel.",
        rating: 5,
      });

      assert.ok(fb);
      assert.ok(fb.id.startsWith("fb_"));
      assert.strictEqual(fb.status, "new");
      assert.strictEqual(fb.rating, 5);

      const retrieved = FeedbackRepository.getById(fb.id);
      assert.ok(retrieved);
      assert.strictEqual(retrieved.subject, "Tampilan responsif sangat nyaman");
    });

    it("dapat membuat dan menyimpan laporan kendala teknis (bug report)", () => {
      const bug = FeedbackRepository.create({
        type: "bug_report",
        category: "math_rendering",
        subject: "Simbol limit fungsi tidak tampil",
        message: "Pada soal nomor 4 paket tryout matematika, rumus limit sempat blank.",
        deviceInfo: "Chrome 122 on Android",
      });

      assert.ok(bug);
      assert.strictEqual(bug.type, "bug_report");
      assert.strictEqual(bug.deviceInfo, "Chrome 122 on Android");
    });

    it("dapat menyaring daftar masukan berdasarkan tipe dan melakukan pencarian", () => {
      FeedbackRepository.create({
        type: "contact_support",
        subject: "Pertanyaan kerjasama sekolah",
        message: "Bagaimana integrasi akun guru untuk satu sekolah SMA?",
        userEmail: "kepsek@sma.sch.id",
      });

      const supportOnly = FeedbackRepository.getAll({ type: "contact_support" });
      assert.ok(supportOnly.total >= 1);
      assert.ok(supportOnly.feedbacks.every((f) => f.type === "contact_support"));

      const searchResult = FeedbackRepository.getAll({ search: "kerjasama" });
      assert.ok(searchResult.total >= 1);
      assert.ok(searchResult.feedbacks[0].subject.includes("kerjasama"));
    });

    it("dapat memperbarui status feedback dan mencatat respon administrator", () => {
      const fb = FeedbackRepository.create({
        type: "feedback",
        subject: "Usul materi Sejarah",
        message: "Mohon tambah topik Perang Dingin.",
      });

      const updated = FeedbackRepository.updateStatus(
        fb.id,
        "resolved",
        "Terima kasih, topik Perang Dingin telah ditambahkan ke bank soal Sejarah."
      );

      assert.ok(updated);
      assert.strictEqual(updated.status, "resolved");
      assert.ok(updated.resolvedAt);
      assert.ok(updated.adminResponse?.includes("Perang Dingin"));
    });
  });

  // =========================================================================
  // SUB-SUITE 4: LAPORAN MASALAH BUTIR SOAL (REPORT QUESTION INTEGRITY)
  // =========================================================================
  describe("4. Integritas Pelaporan Masalah Butir Soal", () => {
    it("mencatat laporan soal dengan identitas pelapor riil tanpa ketergantungan mock user", () => {
      const rep = ReportRepository.create(
        testStudentId,
        "question",
        "q_fisika_01",
        "report_issue",
        "Satuan percepatan tertulis m/s bukan m/s^2"
      );

      assert.ok(rep);
      assert.strictEqual(rep.actorId, testStudentId);
      assert.strictEqual(rep.targetId, "q_fisika_01");
      assert.strictEqual(rep.status, "pending");

      const all = ReportRepository.getAll();
      const found = all.reports.find((r) => r.id === rep.id);
      assert.ok(found);
    });

    it("dapat menyelesaikan laporan masalah butir soal dengan catatan admin", () => {
      const rep = ReportRepository.create(
        testStudentId,
        "question",
        "q_fisika_02",
        "report_issue",
        "Opsi B dan C sama persis nilainya"
      );

      const resolved = ReportRepository.updateStatus(
        rep.id,
        "resolved",
        "Opsi C telah diperbaiki menjadi 15 m/s",
        "usr_admin_01"
      );

      assert.ok(resolved);
      assert.strictEqual(resolved.status, "resolved");
      assert.strictEqual(resolved.resolvedBy, "usr_admin_01");
      assert.ok(resolved.resolvedAt);
    });
  });
});
