import { describe, it } from "node:test";
import assert from "node:assert";
import {
  SessionRepository,
  QuestionRepository,
  ResponseRepository,
  AnnouncementRepository,
  NotificationRepository,
  WebsiteSettingsRepository,
} from "@/lib/db";
import { PracticeSession } from "@/types/session";
import { Question } from "@/types/question";
import { evaluatePracticeSession } from "@/lib/scoring/calculator";
import { OpenRouterProvider } from "@/lib/ai/openrouter";
import { getAIProvider, getActiveAISettings } from "@/lib/ai";

describe("NemoLearn Master QA — End-to-End Suite", () => {
  describe("1. Practice Session Retrieval, Answering & Scoring End-to-End", () => {
    const mockStudentId = "usr_student_test_99";
    const testSessionId = `sess_qa_${Date.now()}`;

    const testQuestions: Question[] = [
      {
        id: `q_test_${Date.now()}_1`,
        subjectId: "matematika",
        topicId: "aljabar-persamaan",
        level: "SMA",
        type: "pilihan_ganda",
        stem: "Berapa akar dari persamaan $x^2 - 4 = 0$ untuk $x > 0$?",
        options: [
          { key: "A", text: "1" },
          { key: "B", text: "2" },
          { key: "C", text: "3" },
          { key: "D", text: "4" },
          { key: "E", text: "5" },
        ],
        correctAnswer: "B",
        explanation: "x^2 = 4, maka x = 2 atau x = -2. Karena x > 0, x = 2.",
        isAiGenerated: false,
        difficulty: "mudah",
        sourceType: "curated_bank",
        status: "published",
        version: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: `q_test_${Date.now()}_2`,
        subjectId: "matematika",
        topicId: "aljabar-persamaan",
        level: "SMA",
        type: "pilihan_ganda",
        stem: "Jika $2x + 4 = 10$, maka $x = ...$",
        options: [
          { key: "A", text: "2" },
          { key: "B", text: "3" },
          { key: "C", text: "4" },
          { key: "D", text: "5" },
          { key: "E", text: "6" },
        ],
        correctAnswer: "B",
        explanation: "2x = 6, x = 3.",
        isAiGenerated: false,
        difficulty: "mudah",
        sourceType: "curated_bank",
        status: "published",
        version: 1,
        createdAt: new Date().toISOString(),
      },
    ];

    it("1.1. Menyimpan soal dan membuat sesi latihan aktif", async () => {
      QuestionRepository.saveBatch(testQuestions);

      const newSession: PracticeSession = {
        id: testSessionId,
        userId: mockStudentId,
        config: {
          subjectId: "matematika",
          topicId: "aljabar-persamaan",
          questionCount: 2,
          mode: "reguler",
          learningMode: "ujian",
        },
        status: "active",
        questionIds: testQuestions.map((q) => q.id),
        score: null,
        correctCount: null,
        wrongCount: null,
        emptyCount: null,
        startedAt: new Date().toISOString(),
      };

      const created = SessionRepository.create(newSession);
      assert.strictEqual(created.id, testSessionId);
      assert.strictEqual(created.status, "active");
    });

    it("1.2. Mengambil sesi latihan secara asinkron via getByIdAsync", async () => {
      const session = await SessionRepository.getByIdAsync(testSessionId);
      assert.ok(session, "Sesi latihan harus dapat ditemukan");
      assert.strictEqual(session.id, testSessionId);
      assert.strictEqual(session.questionIds.length, 2);

      const questions = await QuestionRepository.getByIdsAsync(session.questionIds);
      assert.strictEqual(questions.length, 2);
      assert.strictEqual(questions[0].id, testQuestions[0].id);
    });

    it("1.3. Menyimpan jawaban pengguna dan mengevaluasi hasil akhir", async () => {
      // Simpan jawaban Q1 = B (benar), Q2 = A (salah)
      ResponseRepository.saveAnswer(testSessionId, testQuestions[0].id, "B");
      ResponseRepository.saveAnswer(testSessionId, testQuestions[1].id, "A");

      const session = await SessionRepository.getByIdAsync(testSessionId);
      assert.ok(session);
      const questions = await QuestionRepository.getByIdsAsync(session.questionIds);
      const responses = await ResponseRepository.getBySessionIdAsync(testSessionId);

      assert.strictEqual(responses[testQuestions[0].id].selectedAnswer, "B");
      assert.strictEqual(responses[testQuestions[1].id].selectedAnswer, "A");

      // Evaluasi sesi
      const evaluation = evaluatePracticeSession({
        session,
        questions,
        responses,
      });

      assert.strictEqual(evaluation.correctCount, 1);
      assert.strictEqual(evaluation.wrongCount, 1);
      assert.strictEqual(evaluation.emptyCount, 0);
      assert.strictEqual(evaluation.totalQuestions, 2);

      // Tandai sesi selesai
      const completed = SessionRepository.update(testSessionId, {
        status: "completed",
        score: evaluation.session.score,
        correctCount: evaluation.correctCount,
        wrongCount: evaluation.wrongCount,
        completedAt: new Date().toISOString(),
      });

      assert.ok(completed);
      assert.strictEqual(completed.status, "completed");
      assert.strictEqual(completed.correctCount, 1);
    });
  });

  describe("2. Realtime Announcements & Role Targeting", () => {
    it("2.1. Membuat pengumuman dan memfilter berdasarkan role", async () => {
      const annId = `ann_test_${Date.now()}`;
      await AnnouncementRepository.create({
        id: annId,
        title: "Ujian Akhir Semester Dimulai",
        message: "Seluruh siswa kelas XII harap bersiap.",
        type: "info",
        targetRole: "pelajar",
        isActive: true,
        validUntil: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: "admin@nemoquiz.edu",
      });

      const studentAnnouncements = await AnnouncementRepository.getActive("pelajar");
      const foundStudent = studentAnnouncements.some((a) => a.id === annId);
      assert.ok(foundStudent, "Siswa harus melihat pengumuman ber-role 'pelajar'");

      const teacherAnnouncements = await AnnouncementRepository.getActive("guru");
      const foundTeacher = teacherAnnouncements.some((a) => a.id === annId);
      assert.strictEqual(foundTeacher, false, "Guru tidak boleh melihat pengumuman khusus 'pelajar'");

      // Owner and Admin can always see everything
      const ownerAnnouncements = await AnnouncementRepository.getActive("owner");
      assert.ok(ownerAnnouncements.some((a) => a.id === annId));
    });

    it("2.2. Mengabaikan pengumuman yang sudah kedaluwarsa (validUntil)", async () => {
      const expiredId = `ann_exp_${Date.now()}`;
      await AnnouncementRepository.create({
        id: expiredId,
        title: "Pengumuman Masa Lalu",
        message: "Sudah lewat.",
        type: "warning",
        targetRole: "all",
        isActive: true,
        validUntil: new Date(Date.now() - 3600000).toISOString(), // 1 jam lalu
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      });

      const activeList = await AnnouncementRepository.getActive("all");
      assert.strictEqual(
        activeList.some((a) => a.id === expiredId),
        false,
        "Pengumuman kedaluwarsa tidak boleh muncul di daftar aktif"
      );
    });
  });

  describe("3. Realtime Notifications System", () => {
    const testUserId = `usr_notif_${Date.now()}`;

    it("3.1. Membuat notifikasi in-app dan menghitung unread badge", async () => {
      const notif1 = `notif_${Date.now()}_1`;
      const notif2 = `notif_${Date.now()}_2`;

      await NotificationRepository.create({
        id: notif1,
        userId: testUserId,
        title: "Latihan Selesai",
        message: "Skor Anda: 85.00",
        type: "practice",
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      await NotificationRepository.create({
        id: notif2,
        userId: testUserId,
        title: "Tanggapan Laporan Soal",
        message: "Laporan butir soal Anda telah ditinjau guru.",
        type: "report",
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      const unreadCount = await NotificationRepository.getUnreadCount(testUserId);
      assert.strictEqual(unreadCount, 2, "Unread count harus tepat 2");

      // Mark single read
      await NotificationRepository.markRead(notif1);
      const unreadAfterSingle = await NotificationRepository.getUnreadCount(testUserId);
      assert.strictEqual(unreadAfterSingle, 1, "Unread count harus berkurang jadi 1");

      // Mark all read
      await NotificationRepository.markAllRead(testUserId);
      const unreadAfterAll = await NotificationRepository.getUnreadCount(testUserId);
      assert.strictEqual(unreadAfterAll, 0, "Unread count harus 0 setelah markAllRead");
    });
  });

  describe("4. Maintenance Mode & Lockdown Guard", () => {
    it("4.1. Mengaktifkan dan menonaktifkan mode pemeliharaan", () => {
      const initial = WebsiteSettingsRepository.get();
      assert.strictEqual(initial.maintenanceMode, false);

      const updated = WebsiteSettingsRepository.update({
        maintenance: {
          enabled: true,
          scope: "all",
          message: "Pemeliharaan terjadwal server NemoLearn.",
          estimatedEndTime: "15:00 WIB",
          bypassIpWhitelist: [],
        },
      });

      assert.strictEqual(updated.maintenanceMode, true);
      assert.strictEqual(updated.maintenance.enabled, true);

      // Matikan kembali agar tidak mengganggu sistem lain
      const restored = WebsiteSettingsRepository.update({
        maintenance: {
          enabled: false,
          scope: "all",
          message: "",
          estimatedEndTime: "",
          bypassIpWhitelist: [],
        },
      });

      assert.strictEqual(restored.maintenanceMode, false);
    });
  });

  describe("5. OpenRouter AI Provider Adapter", () => {
    it("5.1. Inisialisasi OpenRouterProvider dengan model dan baseUrl default", () => {
      const provider = new OpenRouterProvider("test_key_sk_or_123");
      assert.strictEqual(provider.name, "OpenRouter AI Provider");
      assert.strictEqual(provider.providerType, "openrouter");
      assert.strictEqual(provider.baseUrl, "https://openrouter.ai/api/v1");
      assert.ok(provider.model.length > 0);
    });

    it("5.2. Mengembalikan error CONFIG_MISSING jika API key kosong", async () => {
      const provider = new OpenRouterProvider("");
      const testRes = await provider.testConnection();
      assert.strictEqual(testRes.success, false);
      assert.strictEqual(testRes.errorType, "CONFIG_MISSING");
    });

    it("5.3. Terintegrasi secara tepat ke provider factory getAIProvider", () => {
      const provider = getAIProvider({
        provider: "openrouter",
        apiKey: "sk-or-test-mock-key",
        model: "anthropic/claude-3.5-sonnet",
      });

      assert.strictEqual(provider.providerType, "openrouter");
      assert.strictEqual(provider.name, "OpenRouter AI Provider");
      assert.strictEqual((provider as any).model, "anthropic/claude-3.5-sonnet");
    });
  });
});
