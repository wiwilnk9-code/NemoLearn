import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  QuestionRepository,
  UserRepository,
  SubjectRepository,
  SessionRepository,
  ResponseRepository,
  loadDb,
} from "@/lib/db";
import { MockAIProvider } from "@/lib/ai/mock";
import { evaluatePracticeSession } from "@/lib/scoring/calculator";
import { Question } from "@/types/question";
import { PracticeSession } from "@/types/session";

describe("NemoQUIZ — Bank Soal, Manual Question Management & AI Fallback Suite", () => {
  const teacherId = "usr_guru_01";
  const studentId = "usr_pelajar_01";
  const adminId = "usr_admin_01";

  beforeEach(() => {
    // Ensure initial seeds are loaded in database
    loadDb();
  });

  // =========================================================================
  // 1. Database-backed Question Bank Initialization & Verification
  // =========================================================================
  it("1. Bank soal terisi dengan butir soal kurikulum SMA terstandar (Fisika, Matematika, Kimia, Biologi)", () => {
    const { questions, total, stats } = QuestionRepository.getAll();

    assert.ok(total > 0, "Bank soal memiliki koleksi pertanyaan awal");
    assert.ok(stats.totalPublished > 0, "Ada soal yang dipublikasikan");
    assert.ok(stats.totalHots > 0, "Ada soal berkategori HOTS");

    // Pastikan setiap butir soal memenuhi standar Kurikulum SMA
    questions.forEach((q) => {
      assert.ok(q.id, "ID soal terdefinisi");
      assert.ok(q.stem.length >= 5, "Teks soal memiliki panjang memadai");
      assert.strictEqual(q.options.length, 5, "Memiliki 5 opsi jawaban (A, B, C, D, E)");
      assert.ok(["A", "B", "C", "D", "E"].includes(q.correctAnswer), "Kunci jawaban valid");
      assert.ok(q.explanation.length >= 5, "Memiliki pembahasan konseptual");
      assert.strictEqual(q.level, "SMA", "Jenjang SMA");
    });
  });

  // =========================================================================
  // 2. Teacher Manual Question CRUD & Draft/Publish Workflow
  // =========================================================================
  it("2. Guru dapat menambahkan soal baru secara manual (Draft & Publikasi)", () => {
    const teacher = UserRepository.getById(teacherId)!;
    assert.strictEqual(teacher.role, "guru");

    // A. Buat soal baru sebagai draft
    const draftId = `q_test_draft_${Date.now()}`;
    const newDraft: Question = {
      id: draftId,
      subjectId: "fisika",
      topicId: "dinamika",
      subtopic: "Uji Coba Gaya Gesek",
      level: "SMA",
      grade: "11",
      type: "pilihan_ganda",
      stem: "Sebuah balok bermassa $3\\text{ kg}$ ditarik gaya horizontal $15\\text{ N}$...",
      options: [
        { key: "A", text: "$1\\text{ m/s}^2$" },
        { key: "B", text: "$2\\text{ m/s}^2$" },
        { key: "C", text: "$3\\text{ m/s}^2$" },
        { key: "D", text: "$4\\text{ m/s}^2$" },
        { key: "E", text: "$5\\text{ m/s}^2$" },
      ],
      correctAnswer: "E",
      explanation: "Hukum II Newton $a = F/m = 15/3 = 5\\text{ m/s}^2$.",
      hint: "Bagi gaya dengan massa balok.",
      difficulty: "sedang",
      status: "draft",
      isAiGenerated: false,
      sourceType: "manual",
      createdBy: teacher.id,
      createdByName: teacher.displayName,
      createdAt: new Date().toISOString(),
    };

    QuestionRepository.create(newDraft);

    // Ambil kembali dan verifikasi
    const fetchedDraft = QuestionRepository.getById(draftId);
    assert.ok(fetchedDraft);
    assert.strictEqual(fetchedDraft.status, "draft");
    assert.strictEqual(fetchedDraft.createdBy, teacherId);

    // B. Publikasikan soal draft tersebut
    const updated = QuestionRepository.update(draftId, {
      status: "published",
      subtopic: "Gaya Gesek Terpublikasi",
    });

    assert.ok(updated);
    assert.strictEqual(updated.status, "published");
    assert.strictEqual(updated.subtopic, "Gaya Gesek Terpublikasi");
    assert.ok(updated.updatedAt, "Timestamp update terekam");

    // C. Hapus soal setelah pengujian
    const deleted = QuestionRepository.delete(draftId);
    assert.strictEqual(deleted, true);
    assert.strictEqual(QuestionRepository.getById(draftId), null);
  });

  // =========================================================================
  // 3. Authorization & RBAC Checks: Guru Milik Sendiri vs Guru Lain vs Admin
  // =========================================================================
  it("3. Otorisasi Akses: Guru hanya boleh mengedit/menghapus soal miliknya; Admin boleh mengelola seluruh soal", () => {
    const teacherA = UserRepository.getById(teacherId)!; // Siti Rahmawati
    const otherTeacherId = "usr_guru_lain";
    const admin = UserRepository.getById(adminId)!; // Admin NemoQUIZ
    const student = UserRepository.getById(studentId)!; // Budi Santoso

    // Buat soal milik Teacher A
    const qAId = `q_test_teacher_a_${Date.now()}`;
    const questionA: Question = {
      id: qAId,
      subjectId: "matematika",
      topicId: "aljabar-persamaan",
      level: "SMA",
      grade: "10",
      type: "pilihan_ganda",
      stem: "Tentukan akar dari $x^2 - 4 = 0$...",
      options: [
        { key: "A", text: "$x = \\pm 2$" },
        { key: "B", text: "$x = \\pm 4$" },
        { key: "C", text: "$x = 0$" },
        { key: "D", text: "$x = 1$" },
        { key: "E", text: "$x = 2$" },
      ],
      correctAnswer: "A",
      explanation: "$x^2 = 4 \\implies x = \\pm 2$.",
      difficulty: "mudah",
      status: "published",
      isAiGenerated: false,
      sourceType: "manual",
      createdBy: teacherA.id,
      createdByName: teacherA.displayName,
      createdAt: new Date().toISOString(),
    };
    QuestionRepository.create(questionA);

    // Fungsi helper penentu izin edit/delete sesuai logika route handler
    function checkEditPermission(user: { id: string; role: string }, q: Question): boolean {
      if (user.role === "admin" || user.role === "owner") return true;
      if (user.role === "guru" && q.createdBy === user.id) return true;
      return false;
    }

    // A. Teacher A (pemilik) boleh mengedit soal miliknya
    assert.strictEqual(checkEditPermission(teacherA, questionA), true);

    // B. Teacher lain (bukan pemilik) DITOLAK mengedit soal Teacher A
    const teacherB = { id: otherTeacherId, role: "guru" as const };
    assert.strictEqual(checkEditPermission(teacherB, questionA), false);

    // C. Siswa DITOLAK mengedit atau menghapus soal
    assert.strictEqual(checkEditPermission(student, questionA), false);

    // D. Admin DIIZINKAN mengedit soal siapapun
    assert.strictEqual(checkEditPermission(admin, questionA), true);

    // Cleanup
    QuestionRepository.delete(qAId);
  });

  // =========================================================================
  // 4. Draft Visibility Isolation (Siswa tidak boleh melihat soal draft)
  // =========================================================================
  it("4. Soal berstatus draft terisolasi: Siswa tidak dapat melihat draft dalam Bank Soal", () => {
    // Cari semua soal untuk siswa (includeDrafts = false)
    const publicResults = QuestionRepository.getAll({ includeDrafts: false });
    const hasAnyDraft = publicResults.questions.some((q) => q.status === "draft");
    assert.strictEqual(hasAnyDraft, false, "Tidak boleh ada soal draft yang bocor ke daftar publik");

    // B. Untuk admin / guru pembuat: draft dapat dilihat
    const adminDrafts = QuestionRepository.getAll({ includeDrafts: true, status: "draft" });
    assert.ok(adminDrafts.total >= 1, "Admin dapat melihat soal draft");
    assert.ok(adminDrafts.questions.every((q) => q.status === "draft"));
  });

  // =========================================================================
  // 5. Search, Filter, and Pagination
  // =========================================================================
  it("5. Fitur pencarian kata kunci, penyaringan mata pelajaran, materi, dan pagination bekerja akurat", () => {
    // A. Filter berdasarkan mapel Fisika
    const fisikaOnly = QuestionRepository.getAll({ subjectId: "fisika" });
    assert.ok(fisikaOnly.questions.length > 0);
    fisikaOnly.questions.forEach((q) => {
      assert.strictEqual(q.subjectId, "fisika");
    });

    // B. Filter berdasarkan tingkat kesulitan HOTS
    const hotsOnly = QuestionRepository.getAll({ difficulty: "hots" });
    assert.ok(hotsOnly.questions.length > 0);
    hotsOnly.questions.forEach((q) => {
      assert.strictEqual(q.difficulty, "hots");
    });

    // C. Pencarian kata kunci stem
    const searchVieta = QuestionRepository.getAll({ search: "Vieta" });
    assert.ok(searchVieta.questions.length >= 1);
    assert.ok(searchVieta.questions[0].stem.includes("Vieta") || searchVieta.questions[0].explanation.includes("Vieta"));

    // D. Pagination
    const page1 = QuestionRepository.getAll({ page: 1, limit: 2 });
    assert.strictEqual(page1.questions.length, 2);
    const page2 = QuestionRepository.getAll({ page: 2, limit: 2 });
    assert.strictEqual(page2.questions.length, 2);
    assert.notStrictEqual(page1.questions[0].id, page2.questions[0].id, "Halaman kedua memiliki butir soal yang berbeda");
  });

  // =========================================================================
  // 6. Bulk Import Validation
  // =========================================================================
  it("6. Impor soal massal (JSON) memvalidasi skema wajib dan menyimpan batch", () => {
    const importBatch: Question[] = [
      {
        id: `q_imp_test_1_${Date.now()}`,
        subjectId: "biologi",
        topicId: "sel",
        subtopic: "Membran Sel",
        level: "SMA",
        grade: "11",
        type: "pilihan_ganda",
        stem: "Fosfolipid bilayer merupakan struktur utama penyusun membran sel yang memiliki sifat...",
        options: [
          { key: "A", text: "Amfifatik (hidrofilik dan hidrofobik)" },
          { key: "B", text: "Hidrofobik murni" },
          { key: "C", text: "Hidrofilik murni" },
          { key: "D", text: "Rigid tidak fleksibel" },
          { key: "E", text: "Kedap air sepenuhnya" },
        ],
        correctAnswer: "A",
        explanation: "Fosfolipid memiliki kepala bermuatan polar (hidrofilik) dan ekor asam lemak nonpolar (hidrofobik).",
        difficulty: "sedang",
        status: "published",
        isAiGenerated: false,
        sourceType: "manual",
        createdBy: teacherId,
        createdByName: "Siti Rahmawati, M.Pd.",
        createdAt: new Date().toISOString(),
      },
    ];

    QuestionRepository.saveBatch(importBatch);

    const imported = QuestionRepository.getById(importBatch[0].id);
    assert.ok(imported);
    assert.strictEqual(imported.correctAnswer, "A");
    assert.strictEqual(imported.options[0].text.includes("Amfifatik"), true);

    // Cleanup
    QuestionRepository.delete(importBatch[0].id);
  });

  // =========================================================================
  // 7. AI Fallback to Database Bank Soal (No Fake Questions)
  // =========================================================================
  it("7. Fallback AI menggunakan bank soal terkurasi database secara jujur (isAiGenerated: false)", async () => {
    const provider = new MockAIProvider();

    // Permintaan 3 soal fisika dinamika
    const fallbackQuestions = await provider.generateQuestions({
      subjectId: "fisika",
      subjectName: "Fisika",
      topicId: "dinamika",
      topicName: "Dinamika Gerak & Hukum Newton",
      questionCount: 3,
      mode: "reguler",
      level: "SMA",
    });

    assert.strictEqual(fallbackQuestions.length, 3, "Mengembalikan tepat 3 butir soal");

    fallbackQuestions.forEach((q) => {
      // Keharusan Kejujuran: TIDAK BOLEH diklaim sebagai buatan AI
      assert.strictEqual(q.isAiGenerated, false, "Wajib menandai isAiGenerated = false");
      assert.ok(["curated_bank", "manual"].includes(q.sourceType));
      assert.strictEqual(q.options.length, 5);
      assert.ok(["A", "B", "C", "D", "E"].includes(q.correctAnswer));
      assert.ok(q.explanation.length > 10, "Memiliki pembahasan detail");
    });
  });

  // =========================================================================
  // 8. End-to-End: Published Bank Question in Practice Session & Scoring
  // =========================================================================
  it("8. Soal Bank Soal yang dipublikasikan dapat dikerjakan siswa dalam sesi kuis dan dinilai secara akurat", () => {
    // 1. Ambil soal terpublikasi dari bank soal
    const candidates = QuestionRepository.findPublished({
      subjectId: "fisika",
      topicId: "dinamika",
      limit: 2,
    });
    assert.ok(candidates.length >= 2, "Tersedia minimal 2 soal untuk latihan");

    const q1 = candidates[0];
    const q2 = candidates[1];

    // 2. Buat sesi latihan menggunakan ID soal dari bank
    const sessionId = `sess_test_bank_${Date.now()}`;
    const testSession: PracticeSession = {
      id: sessionId,
      userId: studentId,
      config: {
        subjectId: "fisika",
        topicId: "dinamika",
        questionCount: 2,
        mode: "reguler",
      },
      status: "active",
      questionIds: [q1.id, q2.id],
      score: null,
      correctCount: null,
      wrongCount: null,
      emptyCount: null,
      startedAt: new Date().toISOString(),
    };
    SessionRepository.create(testSession);

    // 3. Siswa menjawab: q1 dijawab benar, q2 dijawab salah
    const wrongAnswerForQ2 = q2.correctAnswer === "A" ? "B" : "A";
    ResponseRepository.saveAnswer(sessionId, q1.id, q1.correctAnswer); // Benar
    ResponseRepository.saveAnswer(sessionId, q2.id, wrongAnswerForQ2 as any); // Salah

    const savedResponses = ResponseRepository.getBySessionId(sessionId);

    // 4. Evaluasi hasil sesi kuis
    const evaluation = evaluatePracticeSession({
      session: testSession,
      questions: [q1, q2],
      responses: savedResponses,
    });

    assert.strictEqual(evaluation.correctCount, 1);
    assert.strictEqual(evaluation.wrongCount, 1);
    assert.strictEqual(evaluation.emptyCount, 0);
    assert.strictEqual(evaluation.scorePercentage, 50.0); // 1 dari 2 = 50%
    assert.strictEqual(evaluation.items.length, 2);

    // Pastikan penjelasan terungkap pada hasil evaluasi
    assert.strictEqual(evaluation.items[0].explanation, q1.explanation);
    assert.strictEqual(evaluation.items[1].explanation, q2.explanation);
  });
});
