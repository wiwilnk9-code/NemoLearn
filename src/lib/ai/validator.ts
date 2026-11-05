import { QuestionGenRequest, RawAiQuestionOutput } from "@/types/ai";
import { Question, QuestionDifficulty } from "@/types/question";
import { sanitizeHint } from "@/lib/validation/questionValidator";
import { validateLatexSyntax } from "@/lib/math/parser";

export function validateQuestionBatch(
  rawList: RawAiQuestionOutput[],
  req: QuestionGenRequest
): Question[] {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    throw new Error("Daftar soal hasil generasi kosong.");
  }

  const validQuestions: Question[] = [];
  const stemSet = new Set<string>();

  for (let i = 0; i < rawList.length; i++) {
    const raw = rawList[i];
    if (!raw || typeof raw !== "object") continue;

    // 1. Flexible stem resolution
    const stemCandidate = raw.stem || (raw as any).question || (raw as any).pertanyaan || (raw as any).soal;
    if (!stemCandidate || typeof stemCandidate !== "string" || stemCandidate.trim().length < 10) {
      continue;
    }
    const cleanStem = stemCandidate.trim();

    // Stem duplicate detection
    const normalizedStem = cleanStem.toLowerCase().replace(/[\s\W]+/g, "");
    if (stemSet.has(normalizedStem)) {
      continue; // Skip duplicate question
    }
    stemSet.add(normalizedStem);

    // 2. Flexible options resolution (supports object {A, B, C, D, E} or array ["...", "..."])
    const keys: ("A" | "B" | "C" | "D" | "E")[] = ["A", "B", "C", "D", "E"];
    const formattedOptions: { key: "A" | "B" | "C" | "D" | "E"; text: string }[] = [];
    let optionsValid = true;

    if (Array.isArray(raw.options)) {
      if (raw.options.length < 5) {
        continue;
      }
      for (let idx = 0; idx < 5; idx++) {
        const item = raw.options[idx];
        const key = keys[idx];
        let optText = "";
        if (typeof item === "string") {
          optText = item.trim();
        } else if (item && typeof item === "object") {
          optText = String(item.text || item.value || item.label || item.pilihan || "").trim();
        }
        if (!optText) {
          optionsValid = false;
          break;
        }
        // Strip leading key prefix if LLM duplicated it (e.g. "A. Pilihan A" -> "Pilihan A")
        const strippedText = optText.replace(/^[A-E][.:\-)]\s*/i, "").trim() || optText;
        formattedOptions.push({ key, text: strippedText });
      }
    } else if (raw.options && typeof raw.options === "object") {
      for (const k of keys) {
        const optText = (raw.options as any)[k] ?? (raw.options as any)[k.toLowerCase()];
        if (!optText || typeof optText !== "string" || optText.trim().length === 0) {
          optionsValid = false;
          break;
        }
        const strippedText = optText.trim().replace(/^[A-E][.:\-)]\s*/i, "").trim() || optText.trim();
        formattedOptions.push({ key: k, text: strippedText });
      }
    } else {
      continue;
    }

    if (!optionsValid || formattedOptions.length < 5) {
      continue;
    }

    // STAGE 6: Periksa opsi duplikat yang tidak disengaja
    const optTextSet = new Set(formattedOptions.map((o) => o.text.trim().toLowerCase()));
    if (optTextSet.size < 5) {
      continue;
    }

    // STAGE 6: Validasi format LaTeX pada stem
    const stemLatexCheck = validateLatexSyntax(cleanStem);
    if (!stemLatexCheck.isValid) {
      continue;
    }

    // 3. Flexible correct answer resolution
    const rawAnswerCandidate = String(
      raw.correctAnswer ||
        (raw as any).correct_answer ||
        (raw as any).jawaban ||
        (raw as any).kunci ||
        (raw as any).answer ||
        ""
    ).trim().toUpperCase();

    const answerMatch = rawAnswerCandidate.match(/\b([A-E])\b/) || rawAnswerCandidate.match(/([A-E])/);
    if (!answerMatch) {
      continue;
    }
    const validCorrectAnswer = answerMatch[1] as "A" | "B" | "C" | "D" | "E";

    // 4. Flexible explanation resolution (Stage 1: can be empty for lazy generation)
    const explanationCandidate =
      raw.explanation ||
      (raw as any).pembahasan ||
      (raw as any).penjelasan ||
      (raw as any).reasoning ||
      (raw as any).keterangan;

    const explanation =
      explanationCandidate && typeof explanationCandidate === "string" && explanationCandidate.trim().length > 5
        ? explanationCandidate.trim()
        : "";

    // 5. Sanitize and preserve hint
    const hintCandidate = raw.hint || (raw as any).petunjuk || (raw as any).clue || (raw as any).tips;
    const cleanHint = sanitizeHint(hintCandidate, validCorrectAnswer);

    const difficulty: QuestionDifficulty =
      req.mode === "hots" ? "hots" : raw.difficulty || "sedang";

    validQuestions.push({
      id: `q_ai_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
      subjectId: req.subjectId,
      topicId: req.topicId,
      subtopic: req.subtopic,
      level: "SMA",
      type: "pilihan_ganda",
      stem: cleanStem,
      options: formattedOptions,
      correctAnswer: validCorrectAnswer,
      explanation,
      hint: cleanHint,
      isAiGenerated: true,
      difficulty,
      sourceType: "ai",
      sourceReference: `Generasi AI Model - ${req.subjectName} (${req.topicName})`,
      version: 1,
      createdAt: new Date().toISOString(),
    });

    if (validQuestions.length >= req.questionCount) {
      break;
    }
  }

  if (validQuestions.length === 0) {
    throw new Error("Validasi soal gagal: struktur respon AI tidak memenuhi kriteria penerimaan kurikulum SMA.");
  }

  return validQuestions;
}
