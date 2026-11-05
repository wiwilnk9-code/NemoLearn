import { describe, it } from "node:test";
import assert from "node:assert";
import { validateQuestionBatch } from "./validator";
import { extractJsonString, sanitizeLatexInJson } from "./gemini";
import { QuestionGenRequest, RawAiQuestionOutput } from "@/types/ai";

describe("AI Output Validator - PRD Requirements", () => {
  const req: QuestionGenRequest = {
    subjectId: "fisika",
    subjectName: "Fisika",
    topicId: "dinamika",
    topicName: "Dinamika Gerak",
    questionCount: 2,
    mode: "reguler",
  };

  it("validates well-formed questions successfully", () => {
    const raw: RawAiQuestionOutput[] = [
      {
        stem: "Sebuah benda bermassa 2 kg didorong dengan gaya 10 N...",
        options: {
          A: "5 m/s^2",
          B: "10 m/s^2",
          C: "15 m/s^2",
          D: "20 m/s^2",
          E: "25 m/s^2",
        },
        correctAnswer: "A",
        explanation: "Gunakan F = m . a maka a = F / m = 10 / 2 = 5 m/s^2",
      },
      {
        stem: "Gaya aksi dan reaksi menurut Hukum III Newton adalah...",
        options: {
          A: "Bekerja pada benda yang sama",
          B: "Bekerja pada dua benda yang berbeda",
          C: "Besarnya selalu berbeda",
          D: "Arahnya searah",
          E: "Saling meniadakan gerak",
        },
        correctAnswer: "B",
        explanation: "Hukum III Newton menyatakan gaya aksi-reaksi bekerja pada dua benda berbeda.",
      },
    ];

    const result = validateQuestionBatch(raw, req);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].correctAnswer, "A");
    assert.strictEqual(result[0].options.length, 5);
    assert.strictEqual(result[1].correctAnswer, "B");
  });

  it("filters out questions with missing options or invalid correct answer", () => {
    const raw: any[] = [
      {
        stem: "Soal dengan opsi tidak lengkap",
        options: { A: "1", B: "2" }, // Missing C, D, E
        correctAnswer: "A",
        explanation: "Penjelasan",
      },
      {
        stem: "Soal dengan kunci jawaban invalid",
        options: { A: "1", B: "2", C: "3", D: "4", E: "5" },
        correctAnswer: "Z", // Invalid key
        explanation: "Penjelasan",
      },
      {
        stem: "Soal yang valid dan memenuhi semua syarat format PRD",
        options: { A: "1", B: "2", C: "3", D: "4", E: "5" },
        correctAnswer: "C",
        explanation: "Penjelasan lengkap",
      },
    ];

    const result = validateQuestionBatch(raw, req);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].correctAnswer, "C");
  });

  it("prevents obvious duplicate questions", () => {
    const raw: RawAiQuestionOutput[] = [
      {
        stem: "Apakah bunyi Hukum I Newton tentang kelembaman?",
        options: { A: "1", B: "2", C: "3", D: "4", E: "5" },
        correctAnswer: "A",
        explanation: "Penjelasan",
      },
      {
        stem: "Apakah bunyi Hukum I Newton tentang kelembaman?", // Duplicate!
        options: { A: "1", B: "2", C: "3", D: "4", E: "5" },
        correctAnswer: "A",
        explanation: "Penjelasan",
      },
    ];

    const result = validateQuestionBatch(raw, req);
    assert.strictEqual(result.length, 1);
  });

  it("normalizes array options and alternative property names from LLM output", () => {
    const raw: any[] = [
      {
        // Using 'pertanyaan' instead of 'stem'
        pertanyaan: "Sebuah bola dilempar ke atas dengan kecepatan 20 m/s...",
        // Array of 5 option strings
        options: [
          "A. 10 meter",
          "B. 20 meter",
          "C. 30 meter",
          "D. 40 meter",
          "E. 50 meter",
        ],
        // Using 'jawaban' with 'B.' prefix
        jawaban: "B. 20 meter",
        pembahasan: "Ketinggian maksimum h = v0^2 / 2g = 400 / 20 = 20 meter.",
        petunjuk: "Gunakan hubungan energi mekanik atau rumus GLBB.",
      },
    ];

    const result = validateQuestionBatch(raw, req);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].correctAnswer, "B");
    assert.strictEqual(result[0].options.length, 5);
    assert.strictEqual(result[0].options[0].key, "A");
    assert.strictEqual(result[0].options[0].text, "10 meter");
    assert.strictEqual(result[0].options[1].key, "B");
    assert.strictEqual(result[0].options[1].text, "20 meter");
    assert.ok(result[0].explanation.includes("h = v0^2 / 2g"));
    assert.ok(result[0].hint?.includes("GLBB"));
  });

  it("safely sanitizes unescaped LaTeX math formulas inside JSON strings from LLM", () => {
    // Simulated raw output from LLM containing raw unescaped LaTeX math commands (\frac, \text, \lambda, \sqrt)
    const rawLlmOutput = '```json\n[\n  {\n    "stem": "Hitunglah nilai dari \\frac{1}{2} m \\text{ kg} dengan \\lambda = 500 nm dan $v = \\sqrt{2gh}$!",\n    "options": {\n      "A": "\\frac{1}{4} \\text{ m/s}",\n      "B": "\\frac{1}{2} \\text{ m/s}",\n      "C": "1 \\text{ m/s}",\n      "D": "2 \\text{ m/s}",\n      "E": "4 \\text{ m/s}"\n    },\n    "correctAnswer": "B",\n    "explanation": "Langkah pertama: $a = \\frac{F}{m}$. Mengingat $\\sum F = 0$."\n  }\n]\n```';

    const cleanJson = extractJsonString(rawLlmOutput);
    // This MUST parse without throwing SyntaxError:
    const parsed = JSON.parse(cleanJson);
    assert.strictEqual(Array.isArray(parsed), true);
    assert.strictEqual(parsed.length, 1);
    assert.ok(parsed[0].stem.includes("\\frac{1}{2}"));
    assert.ok(parsed[0].stem.includes("\\text{ kg}"));
    assert.ok(parsed[0].stem.includes("\\lambda = 500 nm"));
    assert.ok(parsed[0].options.A.includes("\\frac{1}{4}"));
    assert.ok(parsed[0].explanation.includes("\\sum F = 0"));
  });
});
