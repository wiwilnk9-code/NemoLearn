import { describe, it } from "node:test";
import assert from "node:assert";
import {
  validateQuestion,
  detectHintLeakage,
  sanitizeHint,
} from "./questionValidator";

describe("NemoLearn Question Validation & Consistency Guard", () => {
  const validQuestionInput = {
    stem: "Sebuah balok bermassa $m = 4\\text{ kg}$ ditarik dengan gaya $F = 20\\text{ N}$ mendatar pada lantai licin. Berapakah percepatan balok?",
    options: [
      { key: "A" as const, text: "$2\\text{ m/s}^2$" },
      { key: "B" as const, text: "$5\\text{ m/s}^2$" },
      { key: "C" as const, text: "$8\\text{ m/s}^2$" },
      { key: "D" as const, text: "$10\\text{ m/s}^2$" },
      { key: "E" as const, text: "$12\\text{ m/s}^2$" },
    ],
    correctAnswer: "B",
    explanation: "Gunakan Hukum II Newton: $\\Sigma F = ma \\implies a = F/m = 20/4 = 5\\text{ m/s}^2$. Jawaban benar adalah B.",
    hint: "Gunakan hubungan gaya, massa, dan percepatan dari Hukum II Newton: $a = F/m$.",
    subjectId: "fisika",
    topicId: "dinamika",
    difficulty: "sedang",
    grade: "11",
  };

  // =========================================================================
  // SUB-SUITE 1: VALIDASI KELENGKAPAN SOAL & STRUKTUR OPSI
  // =========================================================================
  describe("1. Validasi Struktur & Kelayakan Soal", () => {
    it("menerima soal yang lengkap dan memenuhi seluruh kriteria kurikulum SMA", () => {
      const result = validateQuestion(validQuestionInput);
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
      assert.strictEqual(result.sanitizedHint, validQuestionInput.hint);
    });

    it("menolak soal jika pilihan opsi kurang dari 5 (misal hanya 4 opsi A-D)", () => {
      const invalidOptions = validQuestionInput.options.slice(0, 4);
      const result = validateQuestion({
        ...validQuestionInput,
        options: invalidOptions,
      });
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("opsi 'E'")));
    });

    it("menolak soal jika ada teks opsi yang kosong atau hanya spasi", () => {
      const optionsWithEmpty = [
        ...validQuestionInput.options.slice(0, 2),
        { key: "C" as const, text: "   " },
        ...validQuestionInput.options.slice(3),
      ];
      const result = validateQuestion({
        ...validQuestionInput,
        options: optionsWithEmpty,
      });
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("opsi 'C'")));
    });

    it("menolak soal jika kunci jawaban tidak valid (bukan salah satu dari A..E)", () => {
      const result = validateQuestion({
        ...validQuestionInput,
        correctAnswer: "F",
      });
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("Kunci jawaban")));
    });

    it("menolak soal jika teks pertanyaan (stem) terlalu pendek atau kosong", () => {
      const result = validateQuestion({
        ...validQuestionInput,
        stem: "Pendek?",
      });
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("minimal 8 karakter")));
    });

    it("menolak soal jika pembahasan konsep (explanation) kosong atau terlalu pendek", () => {
      const result = validateQuestion({
        ...validQuestionInput,
        explanation: "B.",
      });
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("Pembahasan")));
    });
  });

  // =========================================================================
  // SUB-SUITE 2: VALIDASI KESESUAIAN METADATA KURIKULUM
  // =========================================================================
  describe("2. Validasi Kesesuaian Metadata Kurikulum", () => {
    it("menolak jika mata pelajaran tidak terdaftar dalam Kurikulum SMA", () => {
      const result = validateQuestion({
        ...validQuestionInput,
        subjectId: "astronomi_gaib",
      });
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("tidak valid")));
    });

    it("menolak jika materi pokok tidak cocok dengan mata pelajaran yang dipilih", () => {
      const result = validateQuestion({
        ...validQuestionInput,
        subjectId: "fisika",
        topicId: "sel", // "sel" adalah materi Biologi, bukan Fisika
      });
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("tidak cocok")));
    });

    it("menolak jika tingkat kesulitan di luar opsi standar (mudah, sedang, sulit, hots)", () => {
      const result = validateQuestion({
        ...validQuestionInput,
        difficulty: "super_ekstrem",
      });
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes("Tingkat kesulitan")));
    });
  });

  // =========================================================================
  // SUB-SUITE 3: VALIDASI & SANITASI PETUNJUK (ANTI-LEAKAGE)
  // =========================================================================
  describe("3. Deteksi Pembocoran Jawaban pada Petunjuk (Hint Anti-Leakage)", () => {
    it("menerima petunjuk konseptual yang aman tanpa membocorkan kunci", () => {
      const safeHint = "Ingat kembali rumus GLBB untuk jarak tempuh: $s = v_0 t + \\frac{1}{2} a t^2$.";
      assert.strictEqual(detectHintLeakage(safeHint, "B"), false);
      assert.strictEqual(sanitizeHint(safeHint, "B"), safeHint);
    });

    it("mendeteksi pembocoran kunci langsung: 'Kunci jawaban adalah B'", () => {
      const leakedHint = "Kunci jawaban adalah B. Hitung saja dengan teliti.";
      assert.strictEqual(detectHintLeakage(leakedHint, "B"), true);
      const sanitized = sanitizeHint(leakedHint, "B");
      assert.ok(!sanitized?.includes("Kunci jawaban adalah B"));
      assert.ok(sanitized?.includes("Gunakan pemahaman konsep"));
    });

    it("mendeteksi pembocoran kunci: 'Pilihlah opsi C'", () => {
      const leakedHint = "Pilihlah opsi C karena nilainya paling tepat.";
      assert.strictEqual(detectHintLeakage(leakedHint, "C"), true);
      const sanitized = sanitizeHint(leakedHint, "C");
      assert.ok(!sanitized?.includes("Pilihlah opsi C"));
    });

    it("mendeteksi pembocoran kunci: 'Jawabannya: A'", () => {
      const leakedHint = "Jawabannya: A.";
      assert.strictEqual(detectHintLeakage(leakedHint, "A"), true);
    });

    it("membersihkan hint yang membocorkan kunci saat memvalidasi butir soal", () => {
      const result = validateQuestion({
        ...validQuestionInput,
        correctAnswer: "B",
        hint: "Kunci jawaban adalah B.",
      });
      // Soal tetap valid karena hint otomatis disanitasi secara aman
      assert.strictEqual(result.isValid, true);
      assert.ok(!result.sanitizedHint?.includes("Kunci jawaban adalah B"));
      assert.ok(result.sanitizedHint?.includes("Gunakan pemahaman konsep"));
    });
  });
});
