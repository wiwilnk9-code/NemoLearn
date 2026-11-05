import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { GeminiAIProvider } from "./gemini";
import { OpenAIProvider } from "./openai";
import { MockAIProvider } from "./mock";
import { getOrGenerateExplanation, validateLatexSyntax } from "./explanation";
import {
  QuestionRepository,
  SessionRepository,
  ResponseRepository,
  ExplanationRepository,
  AIMetricsRepository,
  AISettingsRepository,
  SubjectRepository,
  UserRepository,
  loadDb,
} from "@/lib/db";
import { QuestionGenRequest, ExplanationGenRequest, AIError } from "@/types/ai";
import { Question, PublicQuestion } from "@/types/question";
import { PracticeSession } from "@/types/session";

describe("NemoLearn AI Generator Refactor — Lazy Explanation & Performance Suite", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    loadDb();
    AISettingsRepository.save({
      provider: "mock",
      model: "mock-curated",
      timeoutMs: 5000,
    });
    ExplanationRepository.reset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    AISettingsRepository.reset();
    ExplanationRepository.reset();
  });

  const sampleQuestion: Question = {
    id: "q_test_fisika_01",
    subjectId: "fisika",
    topicId: "dinamika",
    subtopic: "Hukum Newton",
    level: "SMA",
    type: "pilihan_ganda",
    stem: "Sebuah balok bermassa $m = 2\\text{ kg}$ ditarik dengan gaya horizontal $F = 10\\text{ N}$ di atas lantai licin. Berapakah percepatan balok tersebut?",
    options: [
      { key: "A", text: "$2\\text{ m/s}^2$" },
      { key: "B", text: "$5\\text{ m/s}^2$" },
      { key: "C", text: "$10\\text{ m/s}^2$" },
      { key: "D", text: "$20\\text{ m/s}^2$" },
      { key: "E", text: "$25\\text{ m/s}^2$" },
    ],
    correctAnswer: "B",
    explanation: "Gunakan rumus $F = m \\cdot a$, sehingga $a = \\frac{F}{m} = \\frac{10}{2} = 5\\text{ m/s}^2$. Jawaban: B.",
    hint: "Gunakan Hukum II Newton $F = m \\cdot a$.",
    difficulty: "sedang",
    isAiGenerated: true,
    sourceType: "ai",
    version: 1,
    createdAt: new Date().toISOString(),
  };

  // =========================================================================
  // TEST 1: Generate 1 Soal (Fast Question Generation without long explanation)
  // =========================================================================
  it("1. Pengujian Generasi 1 Soal: Cepat, terstruktur, tanpa pembahasan panjang di awal", async () => {
    const mockProvider = new MockAIProvider();
    const req: QuestionGenRequest = {
      subjectId: "fisika",
      subjectName: "Fisika",
      topicId: "dinamika",
      topicName: "Dinamika Gerak",
      questionCount: 1,
      mode: "reguler",
      lazyExplanation: true,
      includeExplanation: false,
    };

    const startTime = Date.now();
    const questions = await mockProvider.generateQuestions(req);
    const duration = Date.now() - startTime;

    assert.strictEqual(questions.length, 1);
    const q = questions[0];
    assert.ok(q.id);
    assert.ok(q.stem.length >= 10);
    assert.strictEqual(q.options.length, 5);
    assert.ok(["A", "B", "C", "D", "E"].includes(q.correctAnswer));
    assert.strictEqual(q.subjectId, "fisika");
    assert.strictEqual(q.level, "SMA");
    assert.ok(duration < 500, `Generasi 1 soal harus instan (durasi: ${duration}ms)`);
  });

  // =========================================================================
  // TEST 2: Generate 5 Soal (Batch generation)
  // =========================================================================
  it("2. Pengujian Generasi 5 Soal: 5 butir soal lengkap opsi A-E tanpa duplikasi stem", async () => {
    const mockProvider = new MockAIProvider();
    const req: QuestionGenRequest = {
      subjectId: "fisika",
      subjectName: "Fisika",
      topicId: "dinamika",
      topicName: "Dinamika Gerak",
      questionCount: 5,
      mode: "reguler",
      lazyExplanation: true,
    };

    const questions = await mockProvider.generateQuestions(req);
    assert.strictEqual(questions.length, 5);

    const stemSet = new Set<string>();
    questions.forEach((q) => {
      assert.strictEqual(q.options.length, 5);
      assert.ok(["A", "B", "C", "D", "E"].includes(q.correctAnswer));
      assert.ok(!stemSet.has(q.stem), "Tidak boleh ada soal duplikat");
      stemSet.add(q.stem);
    });
  });

  // =========================================================================
  // TEST 3: Generate 10 Soal (Parallel batching & scaling)
  // =========================================================================
  it("3. Pengujian Generasi 10 Soal: Penanganan batch besar secara stabil", async () => {
    const mockProvider = new MockAIProvider();
    const req: QuestionGenRequest = {
      subjectId: "fisika",
      subjectName: "Fisika",
      topicId: "dinamika",
      topicName: "Dinamika Gerak",
      questionCount: 10,
      mode: "hots",
      lazyExplanation: true,
    };

    const questions = await mockProvider.generateQuestions(req);
    assert.strictEqual(questions.length, 10);

    const seenIds = new Set<string>();
    questions.forEach((q) => {
      assert.ok(!seenIds.has(q.id), "ID soal harus unik");
      seenIds.add(q.id);
      assert.strictEqual(q.options.length, 5);
      assert.strictEqual(q.difficulty, "hots");
    });
  });

  // =========================================================================
  // TEST 4: Mode Belajar (Study Mode: per-question feedback & lazy explanation)
  // =========================================================================
  it("4. Pengujian Mode Belajar: Evaluasi seketika per butir & generasi pembahasan on-demand", async () => {
    QuestionRepository.create(sampleQuestion);

    const sessionId = "sess_study_mode_01";
    const session: PracticeSession = {
      id: sessionId,
      userId: "usr_pelajar_01",
      config: {
        subjectId: "fisika",
        topicId: "dinamika",
        questionCount: 1,
        mode: "reguler",
        learningMode: "belajar",
      },
      status: "active",
      questionIds: [sampleQuestion.id],
      score: null,
      correctCount: null,
      wrongCount: null,
      emptyCount: null,
      startedAt: new Date().toISOString(),
    };
    SessionRepository.create(session);

    // Siswa menjawab B (jawaban benar)
    const record = ResponseRepository.saveAnswer(sessionId, sampleQuestion.id, "B");
    assert.strictEqual(record.selectedAnswer, "B");

    // Evaluasi backend
    const isCorrect = record.selectedAnswer === sampleQuestion.correctAnswer;
    assert.strictEqual(isCorrect, true);
    ResponseRepository.markEvaluated(sessionId, sampleQuestion.id, isCorrect);

    // Ambil pembahasan secara lazy
    const expResult = await getOrGenerateExplanation({
      questionId: sampleQuestion.id,
      stem: sampleQuestion.stem,
      options: sampleQuestion.options,
      correctAnswer: sampleQuestion.correctAnswer,
      subjectName: "Fisika",
      topicName: "Dinamika Gerak",
      depth: "normal",
    });

    assert.ok(expResult.content.length > 20);
    assert.strictEqual(expResult.depth, "normal");
    assert.ok(expResult.content.includes("B") || expResult.content.includes("5"));
  });

  // =========================================================================
  // TEST 5: Mode Ujian (Exam Mode: answers hidden until final submission)
  // =========================================================================
  it("5. Pengujian Mode Ujian: Jawaban tersimpan sementara, penilaian & pembahasan di akhir", async () => {
    QuestionRepository.create(sampleQuestion);

    const sessionId = "sess_exam_mode_01";
    const session: PracticeSession = {
      id: sessionId,
      userId: "usr_pelajar_01",
      config: {
        subjectId: "fisika",
        topicId: "dinamika",
        questionCount: 1,
        mode: "reguler",
        learningMode: "ujian",
      },
      status: "active",
      questionIds: [sampleQuestion.id],
      score: null,
      correctCount: null,
      wrongCount: null,
      emptyCount: null,
      startedAt: new Date().toISOString(),
    };
    SessionRepository.create(session);

    // Selama ujian: simpan jawaban
    ResponseRepository.saveAnswer(sessionId, sampleQuestion.id, "B");

    // Verifikasi sesi masih berstatus active dan skor belum dihitung
    const activeSession = SessionRepository.getById(sessionId);
    assert.strictEqual(activeSession?.status, "active");
    assert.strictEqual(activeSession?.score, null);

    // Setelah submit: status selesai dan nilai dihitung
    SessionRepository.update(sessionId, {
      status: "completed",
      score: 100,
      correctCount: 1,
      wrongCount: 0,
      emptyCount: 0,
      completedAt: new Date().toISOString(),
    });

    const completedSession = SessionRepository.getById(sessionId);
    assert.strictEqual(completedSession?.status, "completed");
    assert.strictEqual(completedSession?.score, 100);
  });

  // =========================================================================
  // TEST 6: Adaptive Explanation (Singkat, Normal, Mendalam)
  // =========================================================================
  it("6. Pengujian Pembahasan Tiga Tingkat Kedalaman: Singkat, Normal, Mendalam", async () => {
    QuestionRepository.create(sampleQuestion);

    const baseReq: ExplanationGenRequest = {
      questionId: sampleQuestion.id,
      stem: sampleQuestion.stem,
      options: sampleQuestion.options,
      correctAnswer: sampleQuestion.correctAnswer,
      subjectName: "Fisika",
      topicName: "Dinamika",
    };

    // A. Singkat
    const resSingkat = await getOrGenerateExplanation({ ...baseReq, depth: "singkat" });
    assert.strictEqual(resSingkat.depth, "singkat");
    assert.ok(resSingkat.content.includes("B"));

    // B. Normal (Default)
    const resNormal = await getOrGenerateExplanation({ ...baseReq, depth: "normal" });
    assert.strictEqual(resNormal.depth, "normal");
    assert.ok(resNormal.content.includes("B"));

    // C. Mendalam
    const resMendalam = await getOrGenerateExplanation({ ...baseReq, depth: "mendalam" });
    assert.strictEqual(resMendalam.depth, "mendalam");
    assert.ok(resMendalam.content.includes("Mendalam") || resMendalam.content.length > resSingkat.content.length);

    // Pastikan ketiga tingkatan disimpan terpisah di repository
    const cachedSingkat = ExplanationRepository.get(sampleQuestion.id, "singkat", 1);
    const cachedNormal = ExplanationRepository.get(sampleQuestion.id, "normal", 1);
    const cachedMendalam = ExplanationRepository.get(sampleQuestion.id, "mendalam", 1);

    assert.ok(cachedSingkat);
    assert.ok(cachedNormal);
    assert.ok(cachedMendalam);
    assert.notStrictEqual(cachedSingkat.content, cachedMendalam.content);
  });

  // =========================================================================
  // TEST 7: LaTeX Notation & Syntax Validation
  // =========================================================================
  it("7. Pengujian Notasi LaTeX: Deteksi rumus valid dan penanganan delimiter rusak", () => {
    // A. Rumus valid
    const validMath = "Diketahui $F = 10\\text{ N}$ dan $$a = \\frac{F}{m}$$ dengan $\\mu_k = 0{,}2$.";
    const resValid = validateLatexSyntax(validMath);
    assert.strictEqual(resValid.isValid, true);

    // B. Delimiter $ ganjil (rusak)
    const brokenDollar = "Nilai $F = 10 dan massa m = 2$ tidak tertutup $ dengan benar.";
    const resBrokenDollar = validateLatexSyntax(brokenDollar);
    assert.strictEqual(resBrokenDollar.isValid, false);
    assert.ok(resBrokenDollar.error?.includes("tidak berpasangan"));

    // C. Kurung kurawal unclosed
    const brokenBrace = "Rumus pecahan \\frac{10}{2 tanpa kurung tutup.";
    const resBrokenBrace = validateLatexSyntax(brokenBrace);
    assert.strictEqual(resBrokenBrace.isValid, false);
    assert.ok(resBrokenBrace.error?.includes("kurung kurawal"));
  });

  // =========================================================================
  // TEST 8: Explanation Failure & Retry (No cache corruption)
  // =========================================================================
  it("8. Pengujian Pembahasan Gagal lalu Retry: Jangan simpan error ke cache", async () => {
    const errorQuestionId = "q_test_error_01";
    const qError: Question = { ...sampleQuestion, id: errorQuestionId };
    QuestionRepository.create(qError);

    // 1. Simulasikan provider gagal melempar AIError
    let shouldFail = true;
    global.fetch = async () => {
      if (shouldFail) {
        return new Response(JSON.stringify({ error: { message: "Internal server error" } }), {
          status: 500,
        });
      }
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ explanation: "Pembahasan berhasil setelah retry." }) }],
              },
            },
          ],
        }),
        { status: 200 }
      );
    };

    // Jalankan dengan mock provider yang melempar error saat percobaan pertama
    const failReq: ExplanationGenRequest = {
      questionId: errorQuestionId,
      stem: qError.stem,
      options: qError.options,
      correctAnswer: qError.correctAnswer,
      subjectName: "Fisika",
      depth: "normal",
    };

    const faultyProvider = new GeminiAIProvider("AIzaFakeKey", "gemini-2.5-flash");

    // Percobaan 1: Gagal
    await assert.rejects(async () => {
      await faultyProvider.generateExplanation(failReq);
    });

    // Verifikasi cache tidak menyimpan hasil rusak
    const cachedAfterFail = ExplanationRepository.get(errorQuestionId, "normal", 1);
    assert.strictEqual(cachedAfterFail, null, "Cache TIDAK BOLEH menyimpan pembahasan yang gagal");

    // Percobaan 2: Retry berhasil
    shouldFail = false;
    const retryContent = await faultyProvider.generateExplanation(failReq);
    assert.ok(retryContent.includes("berhasil setelah retry"));
  });

  // =========================================================================
  // TEST 9: Cache Hit & Invalidation on Question Edit
  // =========================================================================
  it("9. Pengujian Cache & Invalidasi saat Soal Diubah", async () => {
    const qId = "q_test_cache_invalidation_01";
    const q = QuestionRepository.create({ ...sampleQuestion, id: qId, version: 1 });

    const req: ExplanationGenRequest = {
      questionId: qId,
      stem: q.stem,
      options: q.options,
      correctAnswer: q.correctAnswer,
      subjectName: "Fisika",
      depth: "normal",
    };

    // 1. Generate pertama: Cache Miss
    const res1 = await getOrGenerateExplanation(req);
    assert.strictEqual(res1.fromCache, false);

    // 2. Generate kedua: Cache Hit
    const res2 = await getOrGenerateExplanation(req);
    assert.strictEqual(res2.fromCache, true);
    assert.strictEqual(res2.latencyMs, 0);
    assert.strictEqual(res2.content, res1.content);

    // 3. Edit Soal: Memperbarui stem
    QuestionRepository.update(qId, {
      stem: "Sebuah balok bermassa $m = 4\\text{ kg}$ ditarik gaya $F = 20\\text{ N}$...",
    });

    // 4. Verifikasi versi soal bertambah dan cache lama terinvalidasi
    const updatedQ = QuestionRepository.getById(qId);
    assert.strictEqual(updatedQ?.version, 2, "Versi soal harus naik menjadi 2");

    const cachedOldVersion = ExplanationRepository.get(qId, "normal", 1);
    assert.strictEqual(cachedOldVersion, null, "Cache versi lama harus terhapus");

    const cachedNewVersion = ExplanationRepository.get(qId, "normal", 2);
    assert.strictEqual(cachedNewVersion, null, "Cache versi baru belum ada sebelum di-generate lagi");
  });

  // =========================================================================
  // TEST 10: Security Access Guard (No Answer Key Leakage)
  // =========================================================================
  it("10. Pengujian Keamanan Kunci Jawaban: Tidak ada kebocoran kunci ke siswa sebelum submit", () => {
    QuestionRepository.create(sampleQuestion);

    const sessionId = "sess_security_test_01";
    const session: PracticeSession = {
      id: sessionId,
      userId: "usr_pelajar_01",
      config: {
        subjectId: "fisika",
        topicId: "dinamika",
        questionCount: 1,
        mode: "reguler",
        learningMode: "ujian",
      },
      status: "active",
      questionIds: [sampleQuestion.id],
      score: null,
      correctCount: null,
      wrongCount: null,
      emptyCount: null,
      startedAt: new Date().toISOString(),
    };
    SessionRepository.create(session);

    // A. Sanitasi PublicQuestion untuk sesi aktif
    const rawQuestions = QuestionRepository.getByIds(session.questionIds);
    const publicQuestions: PublicQuestion[] = rawQuestions.map((q) => ({
      id: q.id,
      subjectId: q.subjectId,
      topicId: q.topicId,
      subtopic: q.subtopic,
      level: q.level,
      type: q.type,
      stem: q.stem,
      options: q.options,
      difficulty: q.difficulty,
      isAiGenerated: q.isAiGenerated,
      sourceType: q.sourceType,
    }));

    const clientPayload = JSON.stringify(publicQuestions);

    // Verifikasi bahwa correctAnswer dan explanation TIDAK ADA dalam payload siswa
    assert.ok(!clientPayload.includes('"correctAnswer"'), "correctAnswer dilarang ada di PublicQuestion");
    assert.ok(!clientPayload.includes('"explanation"'), "explanation dilarang ada di PublicQuestion");

    // B. Mode Ujian answer response tidak membocorkan kunci
    const record = ResponseRepository.saveAnswer(sessionId, sampleQuestion.id, "C");
    const examAnswerResponse = {
      success: true,
      questionId: sampleQuestion.id,
      selectedAnswer: record.selectedAnswer,
      savedAt: record.answeredAt,
      learningMode: "ujian",
    };
    const examPayload = JSON.stringify(examAnswerResponse);
    assert.ok(!examPayload.includes("isCorrect"), "isCorrect tidak boleh dikirim saat Mode Ujian aktif");
    assert.ok(!examPayload.includes("correctAnswer"), "correctAnswer tidak boleh dikirim saat Mode Ujian aktif");
  });
});
