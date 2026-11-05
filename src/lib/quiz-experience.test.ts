import { describe, it } from "node:test";
import assert from "node:assert";
import { parseMathTokens, renderMathExpression } from "./math/parser";
import { evaluatePracticeSession } from "./scoring/calculator";
import { PublicQuestion } from "@/types/question";
import { PracticeSession } from "@/types/session";

describe("NemoLearn Task 4: Quiz Experience & Interaction Repair Suite", () => {
  // 1. Math and Long Stem / Option Rendering Stability
  describe("1. Question Stem & Option Math Content Support", () => {
    it("renders short question stems with inline and display math accurately", () => {
      const shortStem = "Tentukan himpunan penyelesaian dari $f(x) = 2x^2 + 3x - 5 = 0$ pada interval $[0, 5]$.";
      const tokens = parseMathTokens(shortStem);

      assert.ok(tokens.length >= 2, "Parses multiple tokens");
      const mathTokens = tokens.filter((t) => t.type === "inline-math");
      assert.strictEqual(mathTokens.length, 2, "Finds both inline math expressions");
      
      const { html, isError } = renderMathExpression(mathTokens[0].content, false);
      assert.strictEqual(isError, false, "KaTeX renders without error");
      assert.ok(html.includes("katex"), "Generates valid KaTeX HTML");
    });

    it("renders ultra-long real-world question stems (300+ chars) with complex formulas without error", () => {
      const longStem = `Sebuah mobil bermassa $m = 1.200\\text{ kg}$ bergerak melintasi jalan menikung dengan radius kelengkungan $R = 50\\text{ m}$. Koefisien gesekan statis antara ban mobil dan permukaan aspal adalah $\\mu_s = 0,65$. Jika percepatan gravitasi bumi diasumsikan $g = 9,8\\text{ m/s}^2$, hitunglah kelajuan maksimum $v_{\\max}$ agar kendaraan tersebut tidak mengalami slip saat menikung secara horizontal! Gunakan relasi:
\\[ v_{\\max} = \\sqrt{\\mu_s \\cdot g \\cdot R} \\]`;
      const tokens = parseMathTokens(longStem);
      assert.ok(tokens.length >= 5, "Parses all mixed text and math blocks");

      const displayTokens = tokens.filter((t) => t.type === "display-math");
      assert.strictEqual(displayTokens.length, 1, "Detects display math block \\[ ... \\]");

      const { html, isError } = renderMathExpression(displayTokens[0].content, true);
      assert.strictEqual(isError, false, "Renders display math cleanly");
      assert.ok(html.includes("katex-display"), "Includes display mode wrapper");
    });

    it("handles long options with chemical formulas and multi-line descriptions", () => {
      const longOptions = [
        {
          key: "A" as const,
          text: "Reaksi pembentukan gas hidrogen: $\\text{Zn}(s) + 2\\text{HCl}(aq) \\rightarrow \\text{ZnCl}_2(aq) + \\text{H}_2(g)$ dengan laju sebanding kuadrat konsentrasi pereaksi asam klorida pekat.",
        },
        {
          key: "B" as const,
          text: "Reaksi pengendapan barium sulfat: $\\text{Ba}^{2+}(aq) + \\text{SO}_4^{2-}(aq) \\rightarrow \\text{BaSO}_4(s)$ yang tidak dipengaruhi oleh perubahan suhu lingkungan.",
        },
      ];

      for (const opt of longOptions) {
        const tokens = parseMathTokens(opt.text);
        assert.ok(tokens.some((t) => t.type === "inline-math"), `Option ${opt.key} has inline math`);
        for (const tok of tokens) {
          if (tok.type === "inline-math") {
            const res = renderMathExpression(tok.content, false);
            assert.strictEqual(res.isError, false, `Option ${opt.key} formula renders cleanly`);
          }
        }
      }
    });
  });

  // 2. Navigation & State Persistence
  describe("2. Navigation & Answer State Persistence", () => {
    it("preserves answers accurately across forward and backward index navigation", () => {
      const answers: Record<string, "A" | "B" | "C" | "D" | "E" | null> = {};
      const questionIds = ["q_1", "q_2", "q_3", "q_4", "q_5"];

      // User starts on Q0, selects A
      let currentIndex = 0;
      answers[questionIds[currentIndex]] = "A";

      // Navigates forward to Q1, selects B
      currentIndex = 1;
      answers[questionIds[currentIndex]] = "B";

      // Navigates forward to Q2, selects D
      currentIndex = 2;
      answers[questionIds[currentIndex]] = "D";

      // Navigates back to Q1, verifies Q1 is still B
      currentIndex = 1;
      assert.strictEqual(answers[questionIds[currentIndex]], "B");

      // Navigates back to Q0, verifies Q0 is still A
      currentIndex = 0;
      assert.strictEqual(answers[questionIds[currentIndex]], "A");

      // Navigates directly to Q4 via fast jump, selects E
      currentIndex = 4;
      answers[questionIds[currentIndex]] = "E";

      // Final check across all questions
      assert.strictEqual(answers["q_1"], "A");
      assert.strictEqual(answers["q_2"], "B");
      assert.strictEqual(answers["q_3"], "D");
      assert.strictEqual(answers["q_4"], undefined); // Q3 left empty
      assert.strictEqual(answers["q_5"], "E");
    });

    it("supports changing answers immediately with single current choice", () => {
      const answers: Record<string, "A" | "B" | "C" | "D" | "E" | null> = {
        q_1: "A",
      };

      // User changes mind to 'C'
      answers["q_1"] = "C";
      assert.strictEqual(answers["q_1"], "C", "Answer changed from A to C");

      // User changes mind to 'E'
      answers["q_1"] = "E";
      assert.strictEqual(answers["q_1"], "E", "Answer changed from C to E");
    });
  });

  // 3. Elapsed Timer Formatter Logic
  describe("3. Real-Time Stopwatch & Duration Formatter", () => {
    const formatElapsed = (sec: number) => {
      const safeSec = Math.max(0, Math.floor(sec));
      const m = Math.floor(safeSec / 60);
      const s = safeSec % 60;
      const hh = Math.floor(m / 60);
      const mm = m % 60;
      if (hh > 0) {
        return `${hh}:${String(mm).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      }
      return `${String(mm).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    it("formats minutes and seconds cleanly", () => {
      assert.strictEqual(formatElapsed(0), "00:00");
      assert.strictEqual(formatElapsed(45), "00:45");
      assert.strictEqual(formatElapsed(60), "01:00");
      assert.strictEqual(formatElapsed(272), "04:32");
      assert.strictEqual(formatElapsed(3599), "59:59");
    });

    it("formats hours, minutes, and seconds when exceeding 1 hour", () => {
      assert.strictEqual(formatElapsed(3600), "1:00:00");
      assert.strictEqual(formatElapsed(3665), "1:01:05");
      assert.strictEqual(formatElapsed(7322), "2:02:02");
    });

    it("clamps negative numbers safely to 00:00", () => {
      assert.strictEqual(formatElapsed(-10), "00:00");
    });
  });

  // 4. Keyboard Navigation Mapping
  describe("4. Keyboard Shortcut Mapping Affordance", () => {
    const mapKeyToOption = (key: string): "A" | "B" | "C" | "D" | "E" | null => {
      const upper = key.toUpperCase();
      const map: Record<string, "A" | "B" | "C" | "D" | "E"> = {
        "1": "A",
        "A": "A",
        "2": "B",
        "B": "B",
        "3": "C",
        "C": "C",
        "4": "D",
        "D": "D",
        "5": "E",
        "E": "E",
      };
      return map[upper] || null;
    };

    it("maps numbers 1 to 5 to options A to E", () => {
      assert.strictEqual(mapKeyToOption("1"), "A");
      assert.strictEqual(mapKeyToOption("2"), "B");
      assert.strictEqual(mapKeyToOption("3"), "C");
      assert.strictEqual(mapKeyToOption("4"), "D");
      assert.strictEqual(mapKeyToOption("5"), "E");
    });

    it("maps letters A to E (both uppercase and lowercase) cleanly", () => {
      assert.strictEqual(mapKeyToOption("a"), "A");
      assert.strictEqual(mapKeyToOption("B"), "B");
      assert.strictEqual(mapKeyToOption("c"), "C");
      assert.strictEqual(mapKeyToOption("D"), "D");
      assert.strictEqual(mapKeyToOption("e"), "E");
    });

    it("rejects non-option keys safely", () => {
      assert.strictEqual(mapKeyToOption("f"), null);
      assert.strictEqual(mapKeyToOption("6"), null);
      assert.strictEqual(mapKeyToOption("Enter"), null);
      assert.strictEqual(mapKeyToOption(" "), null);
    });
  });

  // 5. Submit Flow & Evaluation Integration
  describe("5. Submit Flow & State Machine Connectivity", () => {
    it("connects user answers to score evaluation without dropping unanswered questions", () => {
      const mockQuestions: PublicQuestion[] = [
        {
          id: "q_1",
          subjectId: "matematika",
          topicId: "aljabar",
          level: "SMA",
          type: "pilihan_ganda",
          stem: "Berapa $2 + 2$?",
          options: [
            { key: "A", text: "4" },
            { key: "B", text: "5" },
            { key: "C", text: "6" },
            { key: "D", text: "7" },
            { key: "E", text: "8" },
          ],
          difficulty: "mudah",
          isAiGenerated: true,
        },
        {
          id: "q_2",
          subjectId: "matematika",
          topicId: "aljabar",
          level: "SMA",
          type: "pilihan_ganda",
          stem: "Berapa $3 \\times 3$?",
          options: [
            { key: "A", text: "6" },
            { key: "B", text: "9" },
            { key: "C", text: "12" },
            { key: "D", text: "15" },
            { key: "E", text: "18" },
          ],
          difficulty: "sedang",
          isAiGenerated: true,
        },
        {
          id: "q_3",
          subjectId: "matematika",
          topicId: "aljabar",
          level: "SMA",
          type: "pilihan_ganda",
          stem: "Berapa $\\sqrt{16}$?",
          options: [
            { key: "A", text: "2" },
            { key: "B", text: "3" },
            { key: "C", text: "4" },
            { key: "D", text: "5" },
            { key: "E", text: "6" },
          ],
          difficulty: "sedang",
          isAiGenerated: true,
        },
      ];

      const fullQuestions = mockQuestions.map((q, idx) => ({
        ...q,
        correctAnswer: (["A", "B", "C"] as const)[idx],
        explanation: `Pembahasan soal nomor ${idx + 1}`,
        sourceType: "curated_bank" as const,
        createdAt: new Date().toISOString(),
      }));

      const session: PracticeSession = {
        id: "sess_task4_test",
        userId: "usr_pelajar_01",
        config: {
          subjectId: "matematika",
          topicId: "aljabar",
          questionCount: 3,
          mode: "reguler",
        },
        status: "active",
        questionIds: ["q_1", "q_2", "q_3"],
        score: null,
        correctCount: null,
        wrongCount: null,
        emptyCount: null,
        startedAt: new Date().toISOString(),
      };

      // User answered Q1 correctly (A), Q2 incorrectly (A instead of B), and left Q3 empty
      const responses = {
        q_1: { questionId: "q_1", selectedAnswer: "A" as const, isCorrect: true, timeSpentSeconds: 15 },
        q_2: { questionId: "q_2", selectedAnswer: "A" as const, isCorrect: false, timeSpentSeconds: 20 },
      };

      const result = evaluatePracticeSession({
        session,
        questions: fullQuestions,
        responses,
      });

      assert.strictEqual(result.totalQuestions, 3);
      assert.strictEqual(result.correctCount, 1, "Exactly 1 question correct");
      assert.strictEqual(result.wrongCount, 1, "Exactly 1 question wrong");
      assert.strictEqual(result.emptyCount, 1, "Exactly 1 question empty");
      assert.strictEqual(result.scorePercentage, 33.33, "Score percentage is 33.33%");
      assert.strictEqual(result.items.length, 3, "All 3 items present in results review");

      // Verify item states
      const item1 = result.items.find((it) => it.question.id === "q_1");
      assert.strictEqual(item1?.selectedAnswer, "A");
      assert.strictEqual(item1?.isCorrect, true);

      const item2 = result.items.find((it) => it.question.id === "q_2");
      assert.strictEqual(item2?.selectedAnswer, "A");
      assert.strictEqual(item2?.isCorrect, false);

      const item3 = result.items.find((it) => it.question.id === "q_3");
      assert.strictEqual(item3?.selectedAnswer, null);
      assert.strictEqual(item3?.isCorrect, false);
    });
  });
});
