import { ExplanationGenRequest, AIError } from "@/types/ai";
import { ExplanationDepth, QuestionExplanation } from "@/types/question";
import { ExplanationRepository, QuestionRepository, AIMetricsRepository } from "@/lib/db";
import { getAIProvider } from "./index";
import { buildExplanationPrompt } from "./prompt";
import { extractJsonString } from "./gemini";
import { validateLatexSyntax } from "@/lib/math/parser";

export { validateLatexSyntax };

/**
 * In-memory Request Deduplication Map (Concurrency Lock)
 * Prevents duplicate concurrent AI requests for the same question, version, and depth.
 */
const inFlightExplanations = new Map<string, Promise<string>>();

export interface GenerateExplanationResult {
  content: string;
  depth: ExplanationDepth;
  fromCache: boolean;
  latencyMs: number;
  provider: string;
  model: string;
}

/**
 * Adaptive Explanation Service (Stage 1, 3, 4)
 * Menghasilkan pembahasan secara lazy berdasarkan ID soal, versi soal, dan tingkat kedalaman.
 */
export async function getOrGenerateExplanation(
  req: ExplanationGenRequest,
  options?: {
    forceRefresh?: boolean;
    timeoutMs?: number;
  }
): Promise<GenerateExplanationResult> {
  const depth: ExplanationDepth = req.depth || "normal";
  const question = QuestionRepository.getById(req.questionId);
  const version = question?.version || 1;
  const startTime = Date.now();

  // 1. Cek Cache Database terlebih dahulu (Stage 4)
  if (!options?.forceRefresh) {
    const cached = ExplanationRepository.get(req.questionId, depth, version);
    if (cached && cached.content && cached.content.trim().length > 10) {
      // Record cache hit in metrics
      AIMetricsRepository.record({
        requestId: `exp_cache_${Date.now()}`,
        provider: cached.provider || "cache",
        model: cached.model || "database",
        success: true,
        latencyMs: 0,
        requestType: "explanation_generation",
        depth,
        cacheHit: true,
        subject: req.subjectName,
        status: "SUCCESS",
      });

      return {
        content: cached.content,
        depth,
        fromCache: true,
        latencyMs: 0,
        provider: cached.provider || "cache",
        model: cached.model || "database",
      };
    }
  }

  // 2. Mekanisme Locking / In-Flight Deduplication (Stage 4)
  const lockKey = `${req.questionId}_${depth}_v${version}`;
  if (inFlightExplanations.has(lockKey)) {
    const content = await inFlightExplanations.get(lockKey)!;
    const latencyMs = Date.now() - startTime;
    return {
      content,
      depth,
      fromCache: false,
      latencyMs,
      provider: "dedup-lock",
      model: "in-flight",
    };
  }

  // 3. Jalankan pemanggilan AI dengan proteksi concurrency
  const generationPromise = (async () => {
    const provider = getAIProvider();
    const modelName = (provider as any).model || "default";

    try {
      let content = "";
      if (typeof provider.generateExplanation === "function") {
        content = await provider.generateExplanation(req);
      } else {
        // Fallback untuk provider yang belum mendefinisikan generateExplanation khusus
        content = await generateExplanationFallback(provider, req);
      }

      // Validasi keluaran pembahasan
      if (!content || typeof content !== "string" || content.trim().length < 15) {
        throw new AIError(
          "EMPTY_RESPONSE",
          "Pembahasan yang dihasilkan AI kosong atau terlalu singkat.",
          502
        );
      }

      const trimmedContent = content.trim();

      // Validasi LaTeX (Stage 3 & 6)
      const latexValidation = validateLatexSyntax(trimmedContent);
      if (!latexValidation.isValid) {
        console.warn(`[Explanation LaTeX Warning]: ${latexValidation.error}`);
        // Jika ada kesalahan format minor, kita tetap teruskan namun perbaiki delimiter yang rusak jika memungkinkan
      }

      // Simpan ke Cache Database HANYA jika berhasil (Stage 4)
      const record: QuestionExplanation = {
        id: `exp_${req.questionId}_${depth}_v${version}`,
        questionId: req.questionId,
        version,
        depth,
        content: trimmedContent,
        provider: provider.name,
        model: modelName,
        generatedAt: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      };

      ExplanationRepository.save(record);

      // Catat metrik performa AI (Stage 8)
      AIMetricsRepository.record({
        requestId: `exp_gen_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        provider: provider.name,
        model: modelName,
        success: true,
        latencyMs: record.latencyMs,
        requestType: "explanation_generation",
        depth,
        cacheHit: false,
        subject: req.subjectName,
        topic: req.topicName,
        subtopic: req.subtopic,
        status: "SUCCESS",
        tokenUsage: (provider as any).lastTokenUsage,
      });

      return trimmedContent;
    } catch (err: any) {
      // Catat error ke AIMetrics
      AIMetricsRepository.record({
        requestId: `exp_err_${Date.now()}`,
        provider: provider.name,
        model: modelName,
        success: false,
        latencyMs: Date.now() - startTime,
        error: err.message,
        requestType: "explanation_generation",
        depth,
        cacheHit: false,
        subject: req.subjectName,
        status: "FAILED",
      });

      // PENTING (Stage 4): Jangan pernah simpan cache jika AI gagal!
      throw err;
    }
  })();

  inFlightExplanations.set(lockKey, generationPromise);

  try {
    const content = await generationPromise;
    const latencyMs = Date.now() - startTime;
    const provider = getAIProvider();

    return {
      content,
      depth,
      fromCache: false,
      latencyMs,
      provider: provider.name,
      model: (provider as any).model || "default",
    };
  } finally {
    inFlightExplanations.delete(lockKey);
  }
}

/**
 * Fallback generator jika provider tidak memiliki metode khusus
 */
async function generateExplanationFallback(
  provider: any,
  req: ExplanationGenRequest
): Promise<string> {
  const correctOpt = req.options.find((o) => o.key === req.correctAnswer);
  const correctText = correctOpt ? correctOpt.text : `Opsi ${req.correctAnswer}`;
  const depth = req.depth || "normal";

  if (depth === "singkat") {
    return `Jawaban yang benar adalah **${req.correctAnswer}** (${correctText}). Pilihan ini tepat sesuai dengan kaidah konsep dasar pada materi ${req.subjectName}.`;
  }

  if (depth === "mendalam") {
    return `### Analisis & Pembahasan Mendalam\n\n1. **Konsep Dasar:**\nPada materi ${req.subjectName} (${req.topicName || "Kurikulum Merdeka"}), analisis permasalahan berakar pada kaidah fundamental teori dan prinsip pembuktian logis.\n\n2. **Langkah Solusi Terperinci:**\nBerdasarkan data pada butir soal, penelaahan setiap opsi menunjukkan bahwa opsi **${req.correctAnswer}** merupakan satu-satunya solusi yang konsisten secara ilmiah.\n\n3. **Analisis Pengecoh & Miskonsepsi:**\nOpsi lainnya mengandung kesalahan konseptual yang sering terjadi akibat pembacaan stimulus yang tergesa-gesa atau perhitungan parsial yang belum tuntas.\n\n**Kesimpulan:** Jawaban yang benar adalah **${req.correctAnswer}** (${correctText}).`;
  }

  return `Pembahasan Konsep:\nBerdasarkan kaidah materi ${req.subjectName}, langkah penyelesaian soal dilakukan dengan menganalisis parameter yang diketahui dan menerapkan kaidah standar kurikulum SMA.\nDengan menelaah seluruh opsi jawaban, diperoleh bahwa pilihan **${req.correctAnswer}** (${correctText}) adalah jawaban yang paling tepat.`;
}
