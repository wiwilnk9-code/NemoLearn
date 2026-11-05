import { QuestionGenRequest, ExplanationGenRequest } from "@/types/ai";

/**
 * Subject category classification for conditional prompt modules
 */
export type SubjectCategory = "exact" | "language" | "social" | "general";

export function getSubjectCategory(subjectId: string, subjectName: string): SubjectCategory {
  const id = subjectId.toLowerCase().trim();
  const name = subjectName.toLowerCase().trim();

  // Exact sciences (Mathematics, Physics, Chemistry)
  if (
    id === "matematika" ||
    id === "fisika" ||
    id === "kimia" ||
    name.includes("matematika") ||
    name.includes("fisika") ||
    name.includes("kimia")
  ) {
    return "exact";
  }

  // Social & Life sciences (History, Biology, Economics, Geography, Sociology)
  if (
    id.includes("sejarah") ||
    id === "biologi" ||
    id === "ekonomi" ||
    id === "geografi" ||
    id === "sosiologi" ||
    name.includes("sejarah") ||
    name.includes("biologi") ||
    name.includes("ekonomi") ||
    name.includes("geografi") ||
    name.includes("sosiologi")
  ) {
    return "social";
  }

  // Languages (Bahasa Indonesia, Bahasa Inggris)
  if (
    id.includes("bahasa") ||
    id === "indonesia" ||
    id === "inggris" ||
    name.startsWith("bahasa") ||
    name === "bahasa indonesia" ||
    name === "bahasa inggris"
  ) {
    return "language";
  }

  return "general";
}

/**
 * Concise task-oriented system prompt for Chat Completion APIs (OpenAI / OpenAI-compatible).
 * Stripped of unnecessary persona, fluff, and bragging.
 */
export function buildSystemPrompt(): string {
  return "Generator soal SMA Kurikulum Merdeka. Format keluaran HANYA JSON array valid sesuai skema.";
}

/**
 * Modular and dynamic prompt builder.
 * Follows strict modular structure:
 * - Module A: Core Prompt (Task contract & JSON schema)
 * - Module B: Subject Module (Conditional LaTeX or reading stimulus)
 * - Module C: Mode Module (Conditional HOTS vs Reguler)
 * - Module D: Difficulty Module (Conditional difficulty level)
 * - Module E: Explanation Module (Conditional explanation & hint)
 * - Module F: Document Context (Conditional user upload / reference)
 * - Module G: Retry Prefix (Conditional on format retry)
 */
export function buildModularPrompt(req: QuestionGenRequest, isRetry = false): string {
  const parts: string[] = [];

  // Module G: Retry Prefix (only included on retry)
  if (isRetry) {
    parts.push("PERINGATAN: Respon sebelumnya gagal diparsing. Keluarkan HANYA JSON array valid tanpa teks markdown pembuka/penutup.");
  }

  // Module A: Core Task Header
  const subtopicText = req.subtopic?.trim() ? ` (Fokus: ${req.subtopic.trim()})` : "";
  parts.push(
    `Buat ${req.questionCount} butir soal pilihan ganda SMA ${req.subjectName}:`,
    `- Topik: ${req.topicName}${subtopicText}`
  );

  // Module C: Mode Module (only relevant mode is emitted)
  if (req.mode === "hots") {
    parts.push("- Mode: HOTS (soal berbasis stimulus, studi kasus nyata, analisis, dan penalaran kontekstual, bukan hafalan).");
  } else {
    parts.push("- Mode: Reguler (pemahaman konsep dan penerapan rumus standar SMA).");
  }

  // Module D: Difficulty Module
  const difficulty = req.difficulty || (req.mode === "hots" ? "hots" : "sedang");
  parts.push(`- Tingkat Kesulitan: ${difficulty}`);

  // Module B: Subject-Specific Module (strictly conditional)
  const category = getSubjectCategory(req.subjectId, req.subjectName);
  if (category === "exact") {
    // Only exact sciences receive LaTeX math instructions
    parts.push(
      "Ketentuan Rumus: Gunakan notasi LaTeX ($rumus$ inline \\( ... \\) atau display \\[ ... \\]) hanya saat perlu (pecahan/akar/aljabar/fisika). Teks verbal pakai teks biasa. Escape backslash di JSON (\\\\frac, \\\\sqrt, \\\\( ... \\\\))."
    );
  } else if (category === "language") {
    // Language subjects receive stimulus / text excerpt instruction
    parts.push("Ketentuan Bahasa: Sertakan kutipan paragraf/stimulus teks singkat pada stem sebagai bahan analisis soal.");
  } else if (category === "social") {
    // Social sciences receive contextual phenomenon instruction
    parts.push("Ketentuan Materi: Berikan stimulus berupa data, fenomena sosial/alam, atau studi kasus nyata.");
  }

  // Module E: Explanation & Hint Module (only if not explicitly disabled or lazy)
  const includeExplanation = req.lazyExplanation ? false : req.includeExplanation !== false;
  if (includeExplanation) {
    parts.push("Ketentuan Pembahasan: Berikan penjelasan konsep terstruktur per butir dan petunjuk (hint) yang DILARANG membocorkan kunci/opsi.");
  } else {
    parts.push("Ketentuan Pembahasan: Kosongkan explanation dan hint.");
  }

  // Module F: Document Context (only included when uploaded/provided)
  if (req.documentContext && req.documentContext.trim()) {
    parts.push(`Konteks Dokumen Referensi:\n"""\n${req.documentContext.trim()}\n"""\nBuat soal berdasarkan dokumen referensi di atas.`);
  }

  // Core Output Schema (clean, compact, strictly typed)
  parts.push(
    "Keluarkan HANYA format JSON array valid:",
    `[
  {
    "stem": "Pertanyaan soal...",
    "options": {
      "A": "Pilihan A",
      "B": "Pilihan B",
      "C": "Pilihan C",
      "D": "Pilihan D",
      "E": "Pilihan E"
    },
    "correctAnswer": "A",
    "explanation": "${includeExplanation ? "Langkah pembahasan konseptual..." : ""}",
    "hint": "${includeExplanation ? "Petunjuk konseptual..." : ""}",
    "difficulty": "${difficulty}"
  }
]`
  );

  return parts.join("\n");
}

/**
 * Adaptive Explanation Prompt Builder
 * Generates structured explanation prompts with 3 depth levels:
 * - singkat: Jawaban benar dan alasan utama (concise).
 * - normal: Penjelasan konsep dan langkah penyelesaian runtut (default).
 * - mendalam: Konsep, rumus, alternatif, analisis kesalahan umum (in-depth).
 */
export function buildExplanationPrompt(req: ExplanationGenRequest): string {
  const depth = req.depth || "normal";
  const category = getSubjectCategory(req.subjectId || "", req.subjectName);
  const isExact = req.isExactSubject !== undefined ? req.isExactSubject : category === "exact";

  const optionsText = req.options
    .map((opt) => `${opt.key}. ${opt.text}`)
    .join("\n");

  const correctOpt = req.options.find((o) => o.key === req.correctAnswer);
  const correctText = correctOpt ? correctOpt.text : "";

  const lines: string[] = [
    `Buat pembahasan edukatif untuk butir soal SMA Kurikulum Merdeka berikut:`,
    `- Mata Pelajaran: ${req.subjectName}${req.topicName ? ` (${req.topicName})` : ""}`,
    `- Soal:\n"""\n${req.stem}\n"""`,
    `- Pilihan Opsi:\n${optionsText}`,
    `- Kunci Jawaban Resmi: Opsi ${req.correctAnswer} (${correctText})`,
    `PERHATIAN MUTLAK: Jawaban yang benar adalah Opsi ${req.correctAnswer}. Pembahasan Anda HARUS membuktikan dan mendukung kebenaran opsi ${req.correctAnswer}. DILARANG KERAS menyimpulkan jawaban lain atau bertentangan dengan kunci.`,
  ];

  if (isExact || req.stem.includes("\\(") || req.stem.includes("\\[") || req.stem.includes("$")) {
    lines.push(
      "Ketentuan Notasi Matematika & Rumus:\n" +
      "- Gunakan notasi LaTeX HANYA ketika diperlukan untuk rumus, persamaan, besaran fisika, atau simbol ilmiah.\n" +
      "- Gunakan teks biasa untuk uraian kalimat verbal dan penjelasan konsep.\n" +
      "- Gunakan delimiter baku: inline \\( ... \\) dan display \\[ ... \\]. Contoh: \\(v = v_0 + at\\), \\[E = mc^2\\].\n" +
      "- Pastikan semua notasi valid KaTeX dan backslash di-escape dengan benar dalam JSON (\\\\frac, \\\\sqrt, \\\\( ... \\\\))."
    );
  }

  if (depth === "singkat") {
    lines.push(
      `Tingkat Kedalaman: SINGKAT.\nBerikan uraian ringkas dan padat (1-2 paragraf) yang langsung menyatakan kunci jawaban yang benar dan alasan konsep utamanya.`
    );
  } else if (depth === "mendalam") {
    lines.push(
      `Tingkat Kedalaman: MENDALAM.\nBerikan pembahasan komprehensif yang mencakup:\n1. Konsep dasar dan teori yang mendasari soal.\n2. Penurunan rumus atau langkah penyelesaian terperinci secara sistematis.\n3. Alternatif metode penyelesaian cepat (jika ada).\n4. Analisis mengapa opsi-opsi pengecoh lainnya salah.\n5. Peringatan tentang miskonsepsi atau kekeliruan umum siswa.`
    );
  } else {
    // normal
    lines.push(
      `Tingkat Kedalaman: NORMAL.\nBerikan penjelasan konsep yang runtut dan langkah-langkah penyelesaian/perhitungan secara sistematis dari pemahaman masalah hingga kesimpulan akhir bahwa opsi ${req.correctAnswer} adalah jawaban yang benar.`
    );
  }

  lines.push(
    `Keluarkan HANYA format JSON valid:\n{\n  "explanation": "Isi uraian pembahasan lengkap..."\n}`
  );

  return lines.join("\n\n");
}
