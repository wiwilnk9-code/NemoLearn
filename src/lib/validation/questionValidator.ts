/**
 * NemoLearn Question Validation & Consistency Guard
 *
 * Mengawal integritas, konsistensi, dan mutu pedagogis butir soal:
 * - Validasi 5 pilihan opsi wajib (A, B, C, D, E) untuk standar SMA/UTBK.
 * - Validasi kunci jawaban tunggal yang cocok dengan daftar opsi.
 * - Validasi kelengkapan teks soal (stem) dan pembahasan konseptual.
 * - Validasi petunjuk (hint) agar tidak membocorkan kunci jawaban secara langsung.
 * - Validasi kesesuaian metadata mata pelajaran, materi pokok, jenjang, dan tingkat kesulitan.
 */

import { Question, QuestionDifficulty, QuestionGrade, QuestionOption } from "@/types/question";
import { SMA_SUBJECTS } from "@/lib/data/subjects";

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedHint?: string;
}

/**
 * Deteksi apakah teks petunjuk secara eksplisit membocorkan huruf kunci jawaban
 * Contoh bocor: "Pilihlah opsi B", "Kunci jawaban: C", "Jawabannya adalah A"
 */
export function detectHintLeakage(hint: string, correctAnswer: string): boolean {
  if (!hint || !correctAnswer) return false;

  const directPatterns = [
    new RegExp(`\\b(kunci|jawaban|jawabannya)\\s*(?:yang\\s+benar)?\\s*(?:adalah|:|=|yaitu)?\\s*${correctAnswer}\\b`, "i"),
    new RegExp(`\\b(pilih|pilihlah)\\s*(?:opsi|pilihan)?\\s*${correctAnswer}\\b`, "i"),
    new RegExp(`\\bopsi\\s*${correctAnswer}\\s*(?:adalah\\s+jawaban\\s+yang\\s+benar|benar)\\b`, "i"),
  ];

  return directPatterns.some((p) => p.test(hint));
}

/**
 * Membersihkan petunjuk jika mengandung pembocoran kunci langsung
 */
export function sanitizeHint(hint: string | undefined, correctAnswer: string): string | undefined {
  if (!hint) return undefined;
  const trimmed = hint.trim();
  if (!trimmed) return undefined;

  if (detectHintLeakage(trimmed, correctAnswer)) {
    // Ganti kalimat pembocor menjadi petunjuk umum yang aman
    return "Gunakan pemahaman konsep dan rumus terkait untuk menganalisis setiap pilihan jawaban.";
  }

  return trimmed;
}

export interface QuestionValidationInput {
  stem: string;
  options: QuestionOption[] | Record<string, string>;
  correctAnswer: string;
  explanation: string;
  hint?: string;
  subjectId: string;
  topicId: string;
  difficulty?: string;
  grade?: string;
}

/**
 * Validasi komprehensif untuk satu butir soal (digunakan oleh AI validator, manual form, dan import JSON)
 */
export function validateQuestion(input: QuestionValidationInput): ValidationResult {
  const errors: string[] = [];

  // 1. Validasi Teks Soal (Stem)
  if (!input.stem || typeof input.stem !== "string" || input.stem.trim().length < 8) {
    errors.push("Teks soal (stem) wajib diisi dengan jelas (minimal 8 karakter).");
  }

  // 2. Validasi Mata Pelajaran & Materi Pokok
  if (!input.subjectId || typeof input.subjectId !== "string") {
    errors.push("Mata pelajaran wajib ditentukan.");
  } else {
    const subject = SMA_SUBJECTS.find((s) => s.id === input.subjectId);
    if (!subject) {
      errors.push(`Mata pelajaran '${input.subjectId}' tidak valid.`);
    } else if (input.topicId) {
      const topicExists = subject.topics.some((t) => t.id === input.topicId);
      if (!topicExists) {
        errors.push(`Materi pokok '${input.topicId}' tidak cocok dengan mata pelajaran ${subject.name}.`);
      }
    } else {
      errors.push("Materi pokok (topicId) wajib ditentukan.");
    }
  }

  // 3. Validasi Opsi Jawaban (Wajib 5 pilihan: A, B, C, D, E)
  const requiredKeys: ("A" | "B" | "C" | "D" | "E")[] = ["A", "B", "C", "D", "E"];
  let optionMap: Record<string, string> = {};

  if (Array.isArray(input.options)) {
    for (const opt of input.options) {
      if (opt && opt.key && typeof opt.text === "string") {
        optionMap[opt.key] = opt.text.trim();
      }
    }
  } else if (input.options && typeof input.options === "object") {
    optionMap = input.options;
  }

  for (const k of requiredKeys) {
    const optVal = optionMap[k];
    if (!optVal || typeof optVal !== "string" || optVal.trim().length === 0) {
      errors.push(`Pilihan jawaban opsi '${k}' wajib diisi dan tidak boleh kosong.`);
    }
  }

  // 4. Validasi Kunci Jawaban
  const normalizedKey = String(input.correctAnswer || "").trim().toUpperCase();
  if (!requiredKeys.includes(normalizedKey as any)) {
    errors.push("Kunci jawaban wajib ditentukan dan harus berupa salah satu dari A, B, C, D, atau E.");
  }

  // 5. Validasi Pembahasan Konseptual
  if (!input.explanation || typeof input.explanation !== "string" || input.explanation.trim().length < 5) {
    errors.push("Pembahasan konsep wajib diisi minimal 5 karakter untuk menunjang evaluasi siswa.");
  }

  // 6. Validasi & Sanitasi Petunjuk (Hint)
  let cleanHint: string | undefined = undefined;
  if (input.hint && typeof input.hint === "string" && input.hint.trim().length > 0) {
    cleanHint = sanitizeHint(input.hint.trim(), normalizedKey);
    if (detectHintLeakage(input.hint, normalizedKey)) {
      // Catat peringatan tetapi tidak membatalkan soal karena sudah diamankan oleh sanitizeHint
    }
  }

  // 7. Validasi Kesesuaian Metadata Tingkat Kesulitan
  if (input.difficulty) {
    const validDifficulties: QuestionDifficulty[] = ["mudah", "sedang", "sulit", "hots"];
    if (!validDifficulties.includes(input.difficulty as any)) {
      errors.push(`Tingkat kesulitan '${input.difficulty}' tidak valid. Pilihan: mudah, sedang, sulit, hots.`);
    }
  }

  // 8. Validasi Jenjang Kelas
  if (input.grade) {
    const validGrades: QuestionGrade[] = ["10", "11", "12", "SMA"];
    if (!validGrades.includes(input.grade as any)) {
      errors.push(`Jenjang kelas '${input.grade}' tidak valid. Pilihan: 10, 11, 12, SMA.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedHint: cleanHint,
  };
}
