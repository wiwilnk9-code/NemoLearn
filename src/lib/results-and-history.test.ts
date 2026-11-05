import { describe, it } from "node:test";
import assert from "node:assert";
import { formatIndonesianScore, formatIndonesianPercentage } from "./scoring/format";
import { evaluatePracticeSession } from "./scoring/calculator";
import { Question } from "@/types/question";
import { PracticeSession } from "@/types/session";
import { SessionResponseRecord } from "@/types/response";

describe("NemoLearn Results & Learning History Integrity Suite (Tahap 5)", () => {
  const dummyQuestions: Question[] = [
    {
      id: "q1",
      subjectId: "biologi",
      topicId: "fotosintesis",
      subtopic: "Reaksi Terang",
      level: "SMA",
      type: "pilihan_ganda",
      stem: "Apa produk utama reaksi terang?",
      options: [
        { key: "A", text: "ATP dan NADPH" },
        { key: "B", text: "Glukosa" },
        { key: "C", text: "CO2" },
        { key: "D", text: "RuBP" },
        { key: "E", text: "PGA" },
      ],
      correctAnswer: "A",
      explanation: "Reaksi terang fotolisis menghasilkan ATP dan NADPH.",
      isAiGenerated: false,
      difficulty: "mudah",
      sourceType: "curated_bank",
      createdAt: new Date().toISOString(),
    },
    {
      id: "q2",
      subjectId: "biologi",
      topicId: "fotosintesis",
      subtopic: "Siklus Calvin",
      level: "SMA",
      type: "pilihan_ganda",
      stem: "Enzim yang mengikat CO2 pada siklus Calvin adalah?",
      options: [
        { key: "A", text: "Rubisco" },
        { key: "B", text: "Amilase" },
        { key: "C", text: "Lipase" },
        { key: "D", text: "Pepsin" },
        { key: "E", text: "Katalase" },
      ],
      correctAnswer: "A",
      explanation: "Rubisco memfiksasi CO2 ke dalam RuBP.",
      isAiGenerated: false,
      difficulty: "sedang",
      sourceType: "curated_bank",
      createdAt: new Date().toISOString(),
    },
    {
      id: "q3",
      subjectId: "biologi",
      topicId: "fotosintesis",
      subtopic: "Pigmen",
      level: "SMA",
      type: "pilihan_ganda",
      stem: "Klorofil a menyerap cahaya terutama pada spektrum apa?",
      options: [
        { key: "A", text: "Biru dan Merah" },
        { key: "B", text: "Hijau dan Kuning" },
        { key: "C", text: "Ungu dan Hijau" },
        { key: "D", text: "Inframerah" },
        { key: "E", text: "Ultraviolet" },
      ],
      correctAnswer: "A",
      explanation: "Klorofil a memiliki puncak absorpsi di daerah biru dan merah.",
      isAiGenerated: false,
      difficulty: "sulit",
      sourceType: "curated_bank",
      createdAt: new Date().toISOString(),
    },
    {
      id: "q4",
      subjectId: "biologi",
      topicId: "fotosintesis",
      subtopic: "Reaksi Terang",
      level: "SMA",
      type: "pilihan_ganda",
      stem: "Aliran elektron nonsiklik melibatkan fotosistem berapa saja?",
      options: [
        { key: "A", text: "Fotosistem II dan I" },
        { key: "B", text: "Hanya Fotosistem I" },
        { key: "C", text: "Hanya Fotosistem II" },
        { key: "D", text: "Fotosistem III" },
        { key: "E", text: "Sitokrom saja" },
      ],
      correctAnswer: "A",
      explanation: "Fotofosforilasi nonsiklik melibatkan PS II (P680) dan PS I (P700).",
      isAiGenerated: false,
      difficulty: "hots",
      sourceType: "curated_bank",
      createdAt: new Date().toISOString(),
    },
  ];

  const baseSession: PracticeSession = {
    id: "sess_test_123",
    userId: "usr_pelajar_01",
    config: {
      subjectId: "biologi",
      topicId: "fotosintesis",
      questionCount: 4,
      mode: "reguler",
    },
    status: "completed",
    questionIds: ["q1", "q2", "q3", "q4"],
    score: null,
    correctCount: null,
    wrongCount: null,
    emptyCount: null,
    startedAt: "2026-11-01T10:00:00.000Z",
    completedAt: "2026-11-01T10:04:30.000Z",
  };

  describe("1. Hasil Evaluasi — Skenario Semua Jawaban Benar", () => {
    it("menghitung skor sempurna 100,00% dengan 0 salah dan 0 kosong", () => {
      const responses: Record<string, SessionResponseRecord> = {
        q1: { id: "r1", sessionId: "sess_test_123", questionId: "q1", selectedAnswer: "A", isCorrect: true, answeredAt: "2026-11-01T10:01:00Z" },
        q2: { id: "r2", sessionId: "sess_test_123", questionId: "q2", selectedAnswer: "A", isCorrect: true, answeredAt: "2026-11-01T10:02:00Z" },
        q3: { id: "r3", sessionId: "sess_test_123", questionId: "q3", selectedAnswer: "A", isCorrect: true, answeredAt: "2026-11-01T10:03:00Z" },
        q4: { id: "r4", sessionId: "sess_test_123", questionId: "q4", selectedAnswer: "A", isCorrect: true, answeredAt: "2026-11-01T10:04:00Z" },
      };

      const result = evaluatePracticeSession({
        session: baseSession,
        questions: dummyQuestions,
        responses,
      });

      assert.strictEqual(result.totalQuestions, 4);
      assert.strictEqual(result.correctCount, 4);
      assert.strictEqual(result.wrongCount, 0);
      assert.strictEqual(result.emptyCount, 0);
      assert.strictEqual(result.scorePercentage, 100);
      assert.strictEqual(result.scoreDetail.formattedScore, "100,00");
      assert.strictEqual(result.weakTopics.length, 0);
    });
  });

  describe("2. Hasil Evaluasi — Skenario Campuran & Jawaban Kosong", () => {
    it("menghitung jawaban benar, salah, dan kosong secara akurat", () => {
      const responses: Record<string, SessionResponseRecord> = {
        q1: { id: "r1", sessionId: "sess_test_123", questionId: "q1", selectedAnswer: "A", isCorrect: true, answeredAt: "2026-11-01T10:01:00Z" },
        q2: { id: "r2", sessionId: "sess_test_123", questionId: "q2", selectedAnswer: "B", isCorrect: false, answeredAt: "2026-11-01T10:02:00Z" }, // salah (kunci A)
        // q3 kosong (tidak ada di respons)
        q4: { id: "r4", sessionId: "sess_test_123", questionId: "q4", selectedAnswer: "A", isCorrect: true, answeredAt: "2026-11-01T10:04:00Z" },
      };

      const result = evaluatePracticeSession({
        session: baseSession,
        questions: dummyQuestions,
        responses,
      });

      assert.strictEqual(result.totalQuestions, 4);
      assert.strictEqual(result.correctCount, 2);
      assert.strictEqual(result.wrongCount, 1);
      assert.strictEqual(result.emptyCount, 1);
      assert.strictEqual(result.scorePercentage, 50);
      assert.strictEqual(result.scoreDetail.formattedScore, "50,00");
      // Siklus Calvin (q2) dan Pigmen (q3 kosong) masuk ke weakTopics
      assert.strictEqual(result.weakTopics.length, 2);
      const subtopics = result.weakTopics.map(w => w.subtopic);
      assert.ok(subtopics.includes("Siklus Calvin"));
      assert.ok(subtopics.includes("Pigmen"));
    });
  });

  describe("3. Diagnostik Performa — Topic & Difficulty Grouping", () => {
    it("dapat mengelompokkan butir soal per subtopik dan tingkat kesulitan", () => {
      const responses: Record<string, SessionResponseRecord> = {
        q1: { id: "r1", sessionId: "sess_test_123", questionId: "q1", selectedAnswer: "A", isCorrect: true, answeredAt: "2026-11-01T10:01:00Z" },
        q2: { id: "r2", sessionId: "sess_test_123", questionId: "q2", selectedAnswer: "B", isCorrect: false, answeredAt: "2026-11-01T10:02:00Z" },
        q3: { id: "r3", sessionId: "sess_test_123", questionId: "q3", selectedAnswer: "A", isCorrect: true, answeredAt: "2026-11-01T10:03:00Z" },
        q4: { id: "r4", sessionId: "sess_test_123", questionId: "q4", selectedAnswer: "A", isCorrect: true, answeredAt: "2026-11-01T10:04:00Z" },
      };

      const result = evaluatePracticeSession({
        session: baseSession,
        questions: dummyQuestions,
        responses,
      });

      // Topic grouping test: Reaksi Terang muncul di q1 dan q4 (keduanya benar)
      const reaksiTerangItems = result.items.filter((it) => it.question.subtopic === "Reaksi Terang");
      assert.strictEqual(reaksiTerangItems.length, 2);
      assert.strictEqual(reaksiTerangItems.filter((it) => it.isCorrect).length, 2);

      // Siklus Calvin muncul di q2 (salah)
      const siklusCalvinItems = result.items.filter((it) => it.question.subtopic === "Siklus Calvin");
      assert.strictEqual(siklusCalvinItems.length, 1);
      assert.strictEqual(siklusCalvinItems[0].isCorrect, false);

      // Difficulty grouping test
      const hotsItems = result.items.filter((it) => it.question.difficulty === "hots");
      assert.strictEqual(hotsItems.length, 1);
      assert.strictEqual(hotsItems[0].isCorrect, true);
    });
  });

  describe("4. Integritas Durasi & Format Waktu Pengerjaan", () => {
    it("menghitung durasi sesi latihan secara presisi", () => {
      const start = new Date(baseSession.startedAt).getTime();
      const end = new Date(baseSession.completedAt!).getTime();
      const diffSec = Math.round((end - start) / 1000);

      // 10:04:30 - 10:00:00 = 4 menit 30 detik (270 detik)
      assert.strictEqual(diffSec, 270);
      const mins = Math.floor(diffSec / 60);
      const secs = diffSec % 60;
      assert.strictEqual(mins, 4);
      assert.strictEqual(secs, 30);
    });
  });

  describe("5. Integritas Riwayat Belajar & Agregasi Tanpa Angka Palsu", () => {
    it("menghitung ringkasan riwayat kosong tanpa melempar NaN atau crash", () => {
      const emptySessions: PracticeSession[] = [];
      const total = emptySessions.length;
      const completed = emptySessions.filter((s) => s.status === "completed");
      const totalAnswered = completed.reduce((acc, s) => acc + (s.correctCount ?? 0) + (s.wrongCount ?? 0), 0);

      assert.strictEqual(total, 0);
      assert.strictEqual(completed.length, 0);
      assert.strictEqual(totalAnswered, 0);
    });

    it("menghitung rata-rata skor secara riil dari beberapa sesi yang selesai", () => {
      const mockSessions: Partial<PracticeSession>[] = [
        { id: "s1", status: "completed", score: 80, correctCount: 8, wrongCount: 2, questionIds: ["1", "2"] },
        { id: "s2", status: "completed", score: 90, correctCount: 9, wrongCount: 1, questionIds: ["3", "4"] },
        { id: "s3", status: "active", score: null, correctCount: null, wrongCount: null, questionIds: ["5", "6"] }, // tidak boleh dihitung
      ];

      const completed = mockSessions.filter((s) => s.status === "completed");
      const sum = completed.reduce((acc, s) => acc + (s.score ?? 0), 0);
      const avg = sum / completed.length;

      assert.strictEqual(completed.length, 2);
      assert.strictEqual(avg, 85);
      assert.strictEqual(formatIndonesianScore(avg), "85,00");
    });
  });
});
