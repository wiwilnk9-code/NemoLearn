import { describe, it } from "node:test";
import assert from "node:assert";
import { evaluatePracticeSession } from "./calculator";
import { checkIRTEligibility, estimateAbilityEAP, scaleThetaToScore } from "./irt";
import { formatIndonesianScore, formatIndonesianPercentage, roundToTwoDecimals } from "./format";
import { Question } from "@/types/question";
import { PracticeSession } from "@/types/session";
import { SessionResponseRecord } from "@/types/response";

describe("NemoLearn Scoring Engine — IRT 3PL & Transparent Fallback Suite", () => {
  // 1. Data Soal Tanpa Kalibrasi (Latihan Mandiri / Bank Soal Standar)
  const uncalibratedQuestions: Question[] = [
    {
      id: "uq1",
      subjectId: "fisika",
      topicId: "dinamika",
      level: "SMA",
      type: "pilihan_ganda",
      stem: "Soal Uncalibrated 1",
      options: [
        { key: "A", text: "A" },
        { key: "B", text: "B" },
      ],
      correctAnswer: "A",
      explanation: "Pembahasan 1",
      isAiGenerated: false,
      difficulty: "sedang",
      sourceType: "curated_bank",
      createdAt: new Date().toISOString(),
    },
    {
      id: "uq2",
      subjectId: "fisika",
      topicId: "dinamika",
      level: "SMA",
      type: "pilihan_ganda",
      stem: "Soal Uncalibrated 2",
      options: [
        { key: "A", text: "A" },
        { key: "B", text: "B" },
      ],
      correctAnswer: "B",
      explanation: "Pembahasan 2",
      isAiGenerated: false,
      difficulty: "sedang",
      sourceType: "curated_bank",
      createdAt: new Date().toISOString(),
    },
    {
      id: "uq3",
      subjectId: "fisika",
      topicId: "kinematika",
      level: "SMA",
      type: "pilihan_ganda",
      stem: "Soal Uncalibrated 3",
      options: [
        { key: "A", text: "A" },
        { key: "B", text: "B" },
      ],
      correctAnswer: "C" as any,
      explanation: "Pembahasan 3",
      isAiGenerated: false,
      difficulty: "sedang",
      sourceType: "curated_bank",
      createdAt: new Date().toISOString(),
    },
    {
      id: "uq4",
      subjectId: "fisika",
      topicId: "kinematika",
      level: "SMA",
      type: "pilihan_ganda",
      stem: "Soal Uncalibrated 4",
      options: [
        { key: "A", text: "A" },
        { key: "B", text: "B" },
      ],
      correctAnswer: "D" as any,
      explanation: "Pembahasan 4",
      isAiGenerated: false,
      difficulty: "sedang",
      sourceType: "curated_bank",
      createdAt: new Date().toISOString(),
    },
  ];

  // 2. Data Soal Terkalibrasi IRT (dengan parameter b, a, c yang valid)
  const calibratedIRTQuestions: Question[] = [
    {
      id: "irt_q1",
      subjectId: "fisika",
      topicId: "dinamika",
      level: "SMA",
      type: "pilihan_ganda",
      stem: "Soal Kalibrasi IRT 1 (Mudah)",
      options: [
        { key: "A", text: "A" },
        { key: "B", text: "B" },
      ],
      correctAnswer: "A",
      explanation: "Pembahasan IRT 1",
      isAiGenerated: false,
      difficulty: "mudah",
      sourceType: "curated_bank",
      createdAt: new Date().toISOString(),
      irt: {
        difficulty: -1.2, // b
        discrimination: 1.1, // a
        guessing: 0.2, // c
        isCalibrated: true,
      },
    },
    {
      id: "irt_q2",
      subjectId: "fisika",
      topicId: "dinamika",
      level: "SMA",
      type: "pilihan_ganda",
      stem: "Soal Kalibrasi IRT 2 (Sedang)",
      options: [
        { key: "A", text: "A" },
        { key: "B", text: "B" },
      ],
      correctAnswer: "B",
      explanation: "Pembahasan IRT 2",
      isAiGenerated: false,
      difficulty: "sedang",
      sourceType: "curated_bank",
      createdAt: new Date().toISOString(),
      irt: {
        difficulty: 0.1, // b
        discrimination: 1.4, // a
        guessing: 0.2, // c
        isCalibrated: true,
      },
    },
    {
      id: "irt_q3",
      subjectId: "fisika",
      topicId: "kinematika",
      level: "SMA",
      type: "pilihan_ganda",
      stem: "Soal Kalibrasi IRT 3 (Sukar)",
      options: [
        { key: "A", text: "A" },
        { key: "B", text: "B" },
      ],
      correctAnswer: "C" as any,
      explanation: "Pembahasan IRT 3",
      isAiGenerated: false,
      difficulty: "sulit",
      sourceType: "curated_bank",
      createdAt: new Date().toISOString(),
      irt: {
        difficulty: 1.5, // b
        discrimination: 1.6, // a
        guessing: 0.2, // c
        isCalibrated: true,
      },
    },
    {
      id: "irt_q4",
      subjectId: "fisika",
      topicId: "kinematika",
      level: "SMA",
      type: "pilihan_ganda",
      stem: "Soal Kalibrasi IRT 4 (Sangat Sukar)",
      options: [
        { key: "A", text: "A" },
        { key: "B", text: "B" },
      ],
      correctAnswer: "D" as any,
      explanation: "Pembahasan IRT 4",
      isAiGenerated: false,
      difficulty: "hots",
      sourceType: "curated_bank",
      createdAt: new Date().toISOString(),
      irt: {
        difficulty: 2.2, // b
        discrimination: 1.8, // a
        guessing: 0.2, // c
        isCalibrated: true,
      },
    },
  ];

  const createDummySession = (questionIds: string[]): PracticeSession => ({
    id: `sess_test_${Date.now()}`,
    userId: "usr_pelajar_01",
    config: {
      subjectId: "fisika",
      topicId: "dinamika",
      questionCount: questionIds.length,
      mode: "reguler",
    },
    status: "active",
    questionIds,
    score: null,
    correctCount: null,
    wrongCount: null,
    emptyCount: null,
    startedAt: new Date().toISOString(),
  });

  // =========================================================================
  // SUB-SUITE 1: FORMAT ANGKA BAKU INDONESIA
  // =========================================================================
  describe("1. Format Angka Baku Indonesia (formatIndonesianScore)", () => {
    it("memformat nilai nol menjadi '0,00'", () => {
      assert.strictEqual(formatIndonesianScore(0), "0,00");
    });

    it("memformat skor pecahan dengan koma desimal tepat dua angka: 76.25 -> '76,25'", () => {
      assert.strictEqual(formatIndonesianScore(76.25), "76,25");
      assert.strictEqual(formatIndonesianScore(33.33333), "33,33");
      assert.strictEqual(formatIndonesianScore(66.66667), "66,67");
    });

    it("memformat skor ribuan dengan pemisah titik (.) dan koma desimal (,): 1000 -> '1.000,00'", () => {
      assert.strictEqual(formatIndonesianScore(1000), "1.000,00");
      assert.strictEqual(formatIndonesianScore(200), "200,00");
      assert.strictEqual(formatIndonesianScore(654.32), "654,32");
    });

    it("menangani nilai null, undefined, atau NaN secara anggun tanpa crash", () => {
      assert.strictEqual(formatIndonesianScore(null as any), "0,00");
      assert.strictEqual(formatIndonesianScore(undefined as any), "0,00");
      assert.strictEqual(formatIndonesianScore(NaN), "0,00");
    });

    it("memformat persentase dengan formatIndonesianPercentage", () => {
      assert.strictEqual(formatIndonesianPercentage(76.25), "76,25%");
      assert.strictEqual(formatIndonesianPercentage(100), "100,00%");
      assert.strictEqual(formatIndonesianPercentage(0), "0,00%");
    });

    it("pembulatan matematis dua desimal (roundToTwoDecimals)", () => {
      assert.strictEqual(roundToTwoDecimals(1 / 3 * 100), 33.33);
      assert.strictEqual(roundToTwoDecimals(2 / 3 * 100), 66.67);
      assert.strictEqual(roundToTwoDecimals(99.999), 100);
    });
  });

  // =========================================================================
  // SUB-SUITE 2: AUDIT KELAYAKAN METODE PENILAIAN (IRT vs FALLBACK)
  // =========================================================================
  describe("2. Audit Kesiapan IRT (checkIRTEligibility)", () => {
    it("menolak IRT jika butir soal tidak memiliki parameter kalibrasi empiris", () => {
      const items = uncalibratedQuestions.map((q) => ({ question: q, isCorrect: true }));
      const audit = checkIRTEligibility(items);
      assert.strictEqual(audit.isEligible, false);
      assert.ok(audit.reason.includes("belum melalui kalibrasi"));
    });

    it("menolak IRT jika jumlah soal kurang dari batas minimal (3 butir)", () => {
      const items = calibratedIRTQuestions.slice(0, 2).map((q) => ({ question: q, isCorrect: true }));
      const audit = checkIRTEligibility(items);
      assert.strictEqual(audit.isEligible, false);
      assert.ok(audit.reason.includes("terlalu sedikit"));
    });

    it("menyetujui IRT jika butir soal terkalibrasi dan jumlah memadai (>= 3 butir)", () => {
      const items = calibratedIRTQuestions.map((q) => ({ question: q, isCorrect: true }));
      const audit = checkIRTEligibility(items);
      assert.strictEqual(audit.isEligible, true);
    });
  });

  // =========================================================================
  // SUB-SUITE 3: SISTEM FALLBACK TRANSPARAN (0,00 – 100,00)
  // =========================================================================
  describe("3. Sistem Skor Fallback Transparan (0,00 – 100,00)", () => {
    it("menghasilkan skor minimum 0,00 ketika semua jawaban salah", () => {
      const session = createDummySession(uncalibratedQuestions.map((q) => q.id));
      const responses: Record<string, SessionResponseRecord> = {
        uq1: { id: "r1", sessionId: session.id, questionId: "uq1", selectedAnswer: "B", isCorrect: null, answeredAt: "" }, // salah
        uq2: { id: "r2", sessionId: session.id, questionId: "uq2", selectedAnswer: "A", isCorrect: null, answeredAt: "" }, // salah
        uq3: { id: "r3", sessionId: session.id, questionId: "uq3", selectedAnswer: "A", isCorrect: null, answeredAt: "" }, // salah
        uq4: { id: "r4", sessionId: session.id, questionId: "uq4", selectedAnswer: "A", isCorrect: null, answeredAt: "" }, // salah
      };

      const result = evaluatePracticeSession({
        session,
        questions: uncalibratedQuestions,
        responses,
      });

      assert.strictEqual(result.correctCount, 0);
      assert.strictEqual(result.wrongCount, 4);
      assert.strictEqual(result.emptyCount, 0);
      assert.strictEqual(result.scoreDetail.scoreValue, 0.0);
      assert.strictEqual(result.scoreDetail.formattedScore, "0,00");
      assert.strictEqual(result.scoreDetail.method, "percentage");
      assert.strictEqual(result.scoreDetail.scale, "0-100");
      assert.strictEqual(result.scoreDetail.label, "Skor Latihan (Persentase)");
      assert.strictEqual(result.session.scoreFormatted, "0,00");
    });

    it("menghasilkan skor maksimum 100,00 ketika semua jawaban benar", () => {
      const session = createDummySession(uncalibratedQuestions.map((q) => q.id));
      const responses: Record<string, SessionResponseRecord> = {
        uq1: { id: "r1", sessionId: session.id, questionId: "uq1", selectedAnswer: "A", isCorrect: null, answeredAt: "" }, // benar
        uq2: { id: "r2", sessionId: session.id, questionId: "uq2", selectedAnswer: "B", isCorrect: null, answeredAt: "" }, // benar
        uq3: { id: "r3", sessionId: session.id, questionId: "uq3", selectedAnswer: "C", isCorrect: null, answeredAt: "" }, // benar
        uq4: { id: "r4", sessionId: session.id, questionId: "uq4", selectedAnswer: "D", isCorrect: null, answeredAt: "" }, // benar
      };

      const result = evaluatePracticeSession({
        session,
        questions: uncalibratedQuestions,
        responses,
      });

      assert.strictEqual(result.correctCount, 4);
      assert.strictEqual(result.wrongCount, 0);
      assert.strictEqual(result.scoreDetail.scoreValue, 100.0);
      assert.strictEqual(result.scoreDetail.formattedScore, "100,00");
      assert.strictEqual(result.session.scoreFormatted, "100,00");
    });

    it("menangani nilai pecahan dengan benar: 1/3 benar = 33,33 dan 2/3 benar = 66,67", () => {
      const threeQuestions = uncalibratedQuestions.slice(0, 3);
      const session1 = createDummySession(threeQuestions.map((q) => q.id));
      // 1 dari 3 benar
      const responses1: Record<string, SessionResponseRecord> = {
        uq1: { id: "r1", sessionId: session1.id, questionId: "uq1", selectedAnswer: "A", isCorrect: null, answeredAt: "" }, // benar
        uq2: { id: "r2", sessionId: session1.id, questionId: "uq2", selectedAnswer: "A", isCorrect: null, answeredAt: "" }, // salah
        uq3: { id: "r3", sessionId: session1.id, questionId: "uq3", selectedAnswer: "A", isCorrect: null, answeredAt: "" }, // salah
      };

      const result1 = evaluatePracticeSession({
        session: session1,
        questions: threeQuestions,
        responses: responses1,
      });

      assert.strictEqual(result1.correctCount, 1);
      assert.strictEqual(result1.scoreDetail.scoreValue, 33.33);
      assert.strictEqual(result1.scoreDetail.formattedScore, "33,33");

      // 2 dari 3 benar
      const session2 = createDummySession(threeQuestions.map((q) => q.id));
      const responses2: Record<string, SessionResponseRecord> = {
        uq1: { id: "r1", sessionId: session2.id, questionId: "uq1", selectedAnswer: "A", isCorrect: null, answeredAt: "" }, // benar
        uq2: { id: "r2", sessionId: session2.id, questionId: "uq2", selectedAnswer: "B", isCorrect: null, answeredAt: "" }, // benar
        uq3: { id: "r3", sessionId: session2.id, questionId: "uq3", selectedAnswer: "A", isCorrect: null, answeredAt: "" }, // salah
      };

      const result2 = evaluatePracticeSession({
        session: session2,
        questions: threeQuestions,
        responses: responses2,
      });

      assert.strictEqual(result2.correctCount, 2);
      assert.strictEqual(result2.scoreDetail.scoreValue, 66.67);
      assert.strictEqual(result2.scoreDetail.formattedScore, "66,67");
    });

    it("memastikan jawaban kosong (unanswered) tidak pernah dianggap benar", () => {
      const session = createDummySession(uncalibratedQuestions.map((q) => q.id));
      const responses: Record<string, SessionResponseRecord> = {
        uq1: { id: "r1", sessionId: session.id, questionId: "uq1", selectedAnswer: "A", isCorrect: null, answeredAt: "" }, // benar
        // uq2, uq3, uq4 tidak dijawab sama sekali
      };

      const result = evaluatePracticeSession({
        session,
        questions: uncalibratedQuestions,
        responses,
      });

      assert.strictEqual(result.correctCount, 1);
      assert.strictEqual(result.wrongCount, 0);
      assert.strictEqual(result.emptyCount, 3);
      assert.strictEqual(result.scoreDetail.scoreValue, 25.0);
      assert.strictEqual(result.scoreDetail.formattedScore, "25,00");
    });

    it("menyediakan penjelasan transparan (notes) pada fallback tanpa mencampur aduk skala", () => {
      const session = createDummySession(uncalibratedQuestions.map((q) => q.id));
      const result = evaluatePracticeSession({
        session,
        questions: uncalibratedQuestions,
        responses: {},
      });

      assert.strictEqual(result.scoreDetail.method, "percentage");
      assert.strictEqual(result.scoreDetail.scale, "0-100");
      assert.ok(result.scoreDetail.scoringNotes.includes("fallback transparan"));
      assert.strictEqual(result.scoreDetail.isIrtEligible, false);
    });
  });

  // =========================================================================
  // SUB-SUITE 4: SISTEM SKOR IRT 3PL BAYESIAN EAP (200,00 – 1.000,00)
  // =========================================================================
  describe("4. Sistem Skor IRT 3PL Bayesian EAP (200,00 – 1.000,00)", () => {
    it("mengaktifkan metode IRT secara otomatis saat soal memiliki parameter kalibrasi valid", () => {
      const session = createDummySession(calibratedIRTQuestions.map((q) => q.id));
      const responses: Record<string, SessionResponseRecord> = {
        irt_q1: { id: "r1", sessionId: session.id, questionId: "irt_q1", selectedAnswer: "A", isCorrect: null, answeredAt: "" }, // benar (mudah)
        irt_q2: { id: "r2", sessionId: session.id, questionId: "irt_q2", selectedAnswer: "B", isCorrect: null, answeredAt: "" }, // benar (sedang)
        irt_q3: { id: "r3", sessionId: session.id, questionId: "irt_q3", selectedAnswer: "A", isCorrect: null, answeredAt: "" }, // salah (sukar)
        irt_q4: { id: "r4", sessionId: session.id, questionId: "irt_q4", selectedAnswer: "A", isCorrect: null, answeredAt: "" }, // salah (sangat sukar)
      };

      const result = evaluatePracticeSession({
        session,
        questions: calibratedIRTQuestions,
        responses,
      });

      assert.strictEqual(result.scoreDetail.method, "irt");
      assert.strictEqual(result.scoreDetail.scale, "200-1000");
      assert.strictEqual(result.scoreDetail.label, "Skor IRT");
      assert.strictEqual(result.scoreDetail.isIrtEligible, true);

      // Rentang skor IRT wajib 200,00 s.d 1000,00
      assert.ok(result.scoreDetail.scoreValue >= 200.0);
      assert.ok(result.scoreDetail.scoreValue <= 1000.0);
      // Format angka Indonesia 2 desimal
      assert.match(result.scoreDetail.formattedScore, /^\d{1,3}(\.\d{3})*,\d{2}$/);
      assert.ok(typeof result.scoreDetail.theta === "number");
      assert.ok(typeof result.scoreDetail.standardError === "number");
    });

    it("skor minimum IRT terkunci pada batas bawah 200,00 ketika semua respon salah (0 benar)", () => {
      const session = createDummySession(calibratedIRTQuestions.map((q) => q.id));
      const responses: Record<string, SessionResponseRecord> = {
        irt_q1: { id: "r1", sessionId: session.id, questionId: "irt_q1", selectedAnswer: "B", isCorrect: null, answeredAt: "" },
        irt_q2: { id: "r2", sessionId: session.id, questionId: "irt_q2", selectedAnswer: "A", isCorrect: null, answeredAt: "" },
        irt_q3: { id: "r3", sessionId: session.id, questionId: "irt_q3", selectedAnswer: "A", isCorrect: null, answeredAt: "" },
        irt_q4: { id: "r4", sessionId: session.id, questionId: "irt_q4", selectedAnswer: "A", isCorrect: null, answeredAt: "" },
      };

      const result = evaluatePracticeSession({
        session,
        questions: calibratedIRTQuestions,
        responses,
      });

      assert.strictEqual(result.correctCount, 0);
      assert.strictEqual(result.scoreDetail.scoreValue, 200.0);
      assert.strictEqual(result.scoreDetail.formattedScore, "200,00");
      assert.strictEqual(result.session.scoreFormatted, "200,00");
    });

    it("skor maksimum IRT terkunci pada batas atas 1.000,00 ketika semua respon benar (100% benar)", () => {
      const session = createDummySession(calibratedIRTQuestions.map((q) => q.id));
      const responses: Record<string, SessionResponseRecord> = {
        irt_q1: { id: "r1", sessionId: session.id, questionId: "irt_q1", selectedAnswer: "A", isCorrect: null, answeredAt: "" },
        irt_q2: { id: "r2", sessionId: session.id, questionId: "irt_q2", selectedAnswer: "B", isCorrect: null, answeredAt: "" },
        irt_q3: { id: "r3", sessionId: session.id, questionId: "irt_q3", selectedAnswer: "C", isCorrect: null, answeredAt: "" },
        irt_q4: { id: "r4", sessionId: session.id, questionId: "irt_q4", selectedAnswer: "D", isCorrect: null, answeredAt: "" },
      };

      const result = evaluatePracticeSession({
        session,
        questions: calibratedIRTQuestions,
        responses,
      });

      assert.strictEqual(result.correctCount, 4);
      assert.strictEqual(result.scoreDetail.scoreValue, 1000.0);
      assert.strictEqual(result.scoreDetail.formattedScore, "1.000,00");
      assert.strictEqual(result.session.scoreFormatted, "1.000,00");
    });

    it("menghitung estimasi kemampuan Bayesian EAP yang meningkat secara konsisten seiring bertambahnya jawaban benar", () => {
      // Siswa A menjawab 3 butir benar (mudah, sedang, sukar)
      const items3Correct = [
        { question: calibratedIRTQuestions[0], isCorrect: true },
        { question: calibratedIRTQuestions[1], isCorrect: true },
        { question: calibratedIRTQuestions[2], isCorrect: true },
        { question: calibratedIRTQuestions[3], isCorrect: false },
      ];
      // Siswa B hanya menjawab 1 butir benar (hanya mudah)
      const items1Correct = [
        { question: calibratedIRTQuestions[0], isCorrect: true },
        { question: calibratedIRTQuestions[1], isCorrect: false },
        { question: calibratedIRTQuestions[2], isCorrect: false },
        { question: calibratedIRTQuestions[3], isCorrect: false },
      ];

      const eap3 = estimateAbilityEAP(items3Correct);
      const eap1 = estimateAbilityEAP(items1Correct);

      // Secara psikometri IRT, siswa dengan performa lebih baik memiliki estimasi theta lebih tinggi
      assert.ok(
        eap3.theta > eap1.theta,
        `Siswa dengan 3 benar (theta: ${eap3.theta}) harus lebih tinggi dari 1 benar (theta: ${eap1.theta})`
      );

      const score3 = scaleThetaToScore(eap3.theta, 3, 4);
      const score1 = scaleThetaToScore(eap1.theta, 1, 4);
      assert.ok(
        score3 > score1,
        `Skor skala UTBK 3 benar (${score3}) harus lebih tinggi dari 1 benar (${score1})`
      );
    });

    it("mendukung forceMethod: 'irt' maupun 'percentage' secara eksplisit", () => {
      const session = createDummySession(calibratedIRTQuestions.map((q) => q.id));
      const responses: Record<string, SessionResponseRecord> = {
        irt_q1: { id: "r1", sessionId: session.id, questionId: "irt_q1", selectedAnswer: "A", isCorrect: null, answeredAt: "" },
      };

      // Paksa ke persentase meskipun soal punya kalibrasi IRT
      const resultPercentage = evaluatePracticeSession({
        session,
        questions: calibratedIRTQuestions,
        responses,
        forceMethod: "percentage",
      });
      assert.strictEqual(resultPercentage.scoreDetail.method, "percentage");
      assert.strictEqual(resultPercentage.scoreDetail.scale, "0-100");

      // Paksa ke IRT meskipun uncalibrated
      const resultIRT = evaluatePracticeSession({
        session,
        questions: uncalibratedQuestions,
        responses,
        forceMethod: "irt",
      });
      assert.strictEqual(resultIRT.scoreDetail.method, "irt");
      assert.strictEqual(resultIRT.scoreDetail.scale, "200-1000");
    });
  });

  // =========================================================================
  // SUB-SUITE 5: ROBUSTNESS, EDGE CASES & BACKWARD COMPATIBILITY
  // =========================================================================
  describe("5. Keamanan & Penanganan Kasus Ekstrem (Edge Cases)", () => {
    it("menangani sesi tanpa butir soal (0 soal) secara aman tanpa pembagian nol", () => {
      const session = createDummySession([]);
      const result = evaluatePracticeSession({
        session,
        questions: [],
        responses: {},
      });

      assert.strictEqual(result.totalQuestions, 0);
      assert.strictEqual(result.correctCount, 0);
      assert.strictEqual(result.scoreDetail.scoreValue, 0);
      assert.strictEqual(result.scoreDetail.formattedScore, "0,00");
    });

    it("mengabaikan butir soal yang tidak valid atau null di dalam array pertanyaan", () => {
      const mixedQuestions = [
        uncalibratedQuestions[0],
        null as any,
        { id: "invalid_no_correct_answer" } as any,
      ];
      const session = createDummySession(["uq1"]);
      const responses: Record<string, SessionResponseRecord> = {
        uq1: { id: "r1", sessionId: session.id, questionId: "uq1", selectedAnswer: "A", isCorrect: null, answeredAt: "" },
      };

      const result = evaluatePracticeSession({
        session,
        questions: mixedQuestions,
        responses,
      });

      assert.strictEqual(result.totalQuestions, 1);
      assert.strictEqual(result.correctCount, 1);
      assert.strictEqual(result.scoreDetail.scoreValue, 100.0);
      assert.strictEqual(result.scoreDetail.formattedScore, "100,00");
    });

    it("mempertahankan integritas metadata penilaian sesi untuk audit riwayat (snapshot integrity)", () => {
      const session = createDummySession(uncalibratedQuestions.map((q) => q.id));
      const responses: Record<string, SessionResponseRecord> = {
        uq1: { id: "r1", sessionId: session.id, questionId: "uq1", selectedAnswer: "A", isCorrect: null, answeredAt: "" },
      };

      const result = evaluatePracticeSession({
        session,
        questions: uncalibratedQuestions,
        responses,
      });

      // Pastikan seluruh field snapshot tersimpan di objek session yang diperbarui
      assert.strictEqual(result.session.status, "completed");
      assert.strictEqual(result.session.score, 25.0);
      assert.strictEqual(result.session.scoreFormatted, "25,00");
      assert.strictEqual(result.session.scoringMethod, "percentage");
      assert.strictEqual(result.session.scoringScale, "0-100");
      assert.strictEqual(result.session.scoringVersion, "v1.0-percentage");
      assert.strictEqual(result.session.scoreLabel, "Skor Latihan (Persentase)");
      assert.ok(result.session.completedAt);
    });
  });
});
