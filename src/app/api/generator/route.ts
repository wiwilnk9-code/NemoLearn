import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  SubjectRepository,
  QuestionRepository,
  SessionRepository,
  UserRepository,
  AIMetricsRepository,
  SystemLogRepository,
} from "@/lib/db";
import { getAIProvider } from "@/lib/ai";
import { MockAIProvider } from "@/lib/ai/mock";
import { PracticeSession } from "@/types/session";
import { PracticeMode, LearningMode, Question } from "@/types/question";
import { AIError, AIErrorCode } from "@/types/ai";
import { getActiveAISettings } from "@/lib/ai";
import {
  reserveAiQuota,
  confirmAiQuota,
  releaseAiQuota,
  getUserQuotaStatus,
  ReservationResult,
} from "@/lib/ai/quota-manager";

export async function GET(req: Request) {
  try {
    const active = getActiveAISettings();
    const user = (await getCurrentUser(req)) || (await getCurrentUser());
    const quota = user ? getUserQuotaStatus(user) : null;

    return NextResponse.json({
      success: true,
      provider: active.provider,
      model: active.model,
      hasKey: Boolean(active.apiKey || active.provider === "mock"),
      quota,
    });
  } catch {
    return NextResponse.json({
      success: true,
      provider: "mock",
      model: "curated-sma-bank",
      hasKey: true,
      quota: null,
    });
  }
}

export async function POST(req: Request) {
  const requestId = `gen_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const startTime = Date.now();
  let reservation: ReservationResult | null = null;
  let user: any = null;

  try {
    user = (await getCurrentUser(req)) || (await getCurrentUser());
    if (!user) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED: Anda harus login untuk mengakses Generator Latihan Soal.",
          code: "UNAUTHORIZED",
          requestId,
        },
        { status: 401 }
      );
    }

    // Email verification check (Task 2: unverified users cannot generate sessions)
    if (user && user.emailVerified === false) {
      return NextResponse.json(
        {
          error: "EMAIL_UNVERIFIED: Alamat email Anda belum diverifikasi. Silakan periksa email aktivasi Anda sebelum memulai latihan soal.",
          code: "EMAIL_UNVERIFIED",
          requestId,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { subjectId, topicId, subtopic, questionCount, mode, learningMode, fallbackToManual } = body;

    // Server-side strict validations (FR-03 & PRD Rules)
    if (!subjectId || typeof subjectId !== "string") {
      return NextResponse.json(
        { error: "Mata pelajaran wajib dipilih.", requestId },
        { status: 400 }
      );
    }

    const subject = SubjectRepository.getById(subjectId);
    if (!subject) {
      return NextResponse.json(
        { error: "Mata pelajaran tidak ditemukan.", requestId },
        { status: 404 }
      );
    }

    if (!topicId || typeof topicId !== "string") {
      return NextResponse.json(
        { error: "Materi pokok wajib dipilih.", requestId },
        { status: 400 }
      );
    }

    const topic = subject.topics.find((t) => t.id === topicId);
    if (!topic) {
      return NextResponse.json(
        { error: "Materi pokok tidak ditemukan dalam mata pelajaran terkait.", requestId },
        { status: 404 }
      );
    }

    const parsedCount = Number(questionCount);
    if (isNaN(parsedCount) || parsedCount < 1 || parsedCount > 30) {
      return NextResponse.json(
        { error: "Jumlah soal harus berupa angka valid antara 1 hingga 30 butir.", requestId },
        { status: 400 }
      );
    }

    const validMode: PracticeMode = mode === "hots" ? "hots" : "reguler";
    const validLearningMode: LearningMode = learningMode === "belajar" ? "belajar" : "ujian";

    // Reserve AI quota atomically before calling AI provider (Task 3: Quota Reservation)
    reservation = reserveAiQuota(user, parsedCount);
    if (!reservation.success) {
      return NextResponse.json(
        {
          error: reservation.message,
          code: reservation.code,
          requestId,
          retryAfterSeconds: reservation.retryAfterSeconds,
        },
        {
          status: reservation.statusCode,
          headers: reservation.retryAfterSeconds
            ? { "Retry-After": String(reservation.retryAfterSeconds) }
            : undefined,
        }
      );
    }

    const baseQuestionReq = {
      subjectId,
      subjectName: subject.name,
      topicId,
      topicName: topic.name,
      subtopic: subtopic ? String(subtopic).trim() : undefined,
      mode: validMode,
      level: "SMA" as const,
      lazyExplanation: true,
      includeExplanation: false,
    };

    const provider = getAIProvider();
    const modelName = (provider as any).model || "default";

    let generatedQuestions: Question[] = [];
    let isFallback = false;
    let fallbackReason: string | null = null;
    let capturedAiError: any = null;

    // --- STRATEGY 1: Mock / Curated Bank ---
    if (provider.providerType === "mock") {
      generatedQuestions = await provider.generateQuestions({
        ...baseQuestionReq,
        questionCount: parsedCount,
      });
      isFallback = true;
      fallbackReason = "Sistem berjalan dalam mode Bank Soal Kurikulum SMA (offline/mock).";
    } else {
      // --- STRATEGY 2: AI Provider with Chunking / Batching ---
      // For large counts (> 5), batch in parallel chunks of 5 to avoid token clipping and inference timeouts.
      const BATCH_SIZE = 5;
      const batchSizes: number[] = [];
      let rem = parsedCount;
      while (rem > 0) {
        const size = Math.min(BATCH_SIZE, rem);
        batchSizes.push(size);
        rem -= size;
      }

      // Controlled concurrency: up to 2 parallel batches at a time
      const accumulatedQuestions: Question[] = [];
      const batchErrors: any[] = [];

      for (let i = 0; i < batchSizes.length; i += 2) {
        const slice = batchSizes.slice(i, i + 2);
        const promises = slice.map((count) =>
          provider.generateQuestions({
            ...baseQuestionReq,
            questionCount: count,
          })
        );

        const results = await Promise.allSettled(promises);
        for (const res of results) {
          if (res.status === "fulfilled") {
            accumulatedQuestions.push(...res.value);
          } else {
            batchErrors.push(res.reason);
          }
        }

        // If initial batches failed and 0 questions acquired, stop further attempts
        if (accumulatedQuestions.length === 0 && batchErrors.length > 0) {
          break;
        }
      }

      // Deduplicate questions by normalized stem
      const seenStems = new Set<string>();
      const uniqueAiQuestions: Question[] = [];
      for (const q of accumulatedQuestions) {
        const norm = q.stem.toLowerCase().replace(/[\s\W]+/g, "");
        if (!seenStems.has(norm)) {
          seenStems.add(norm);
          uniqueAiQuestions.push(q);
        }
      }

      if (uniqueAiQuestions.length >= parsedCount) {
        // Complete AI success
        generatedQuestions = uniqueAiQuestions.slice(0, parsedCount);
      } else if (uniqueAiQuestions.length > 0) {
        // Partial AI success (some batches succeeded, some failed or stems duplicate)
        if (fallbackToManual === true) {
          // Fill remainder from Curated Bank Soal
          const missingCount = parsedCount - uniqueAiQuestions.length;
          console.warn(
            `[Generator Batching] Partial AI success (${uniqueAiQuestions.length}/${parsedCount}). Fulfilling ${missingCount} questions from Bank Soal.`
          );
          const mockProvider = new MockAIProvider();
          const fallbackBatch = await mockProvider.generateQuestions({
            ...baseQuestionReq,
            questionCount: missingCount,
          });

          generatedQuestions = [...uniqueAiQuestions, ...fallbackBatch];
          isFallback = true;
          fallbackReason = `${uniqueAiQuestions.length} butir soal disintesis via AI, ${missingCount} butir dilengkapi dari Bank Soal SMA terkurasi.`;
        } else {
          // Client has NOT authorized fallback yet. Inform about partial questions.
          const firstErr = batchErrors[0];
          const errCode: AIErrorCode = firstErr instanceof AIError ? firstErr.code : "SERVER_ERROR";
          const errStatus = firstErr instanceof AIError ? firstErr.statusCode : 502;
          const errMsg = firstErr?.message || "Sebagian pembuatan soal via AI terhenti.";

          AIMetricsRepository.record({
            requestId,
            provider: provider.name,
            model: modelName,
            success: false,
            latencyMs: Date.now() - startTime,
            error: `[PARTIAL_${errCode}] ${errMsg} (${uniqueAiQuestions.length}/${parsedCount} berhasil)`,
            subject: subject.name,
            topic: topic.name,
            subtopic: subtopic || undefined,
            questionCount: parsedCount,
            generatedCount: uniqueAiQuestions.length,
            status: "PARTIAL",
            isFallback: false,
          });

          if (reservation && reservation.success) {
            releaseAiQuota({
              userId: user.id,
              reservationId: reservation.reservationId,
              quotaDate: reservation.quotaDate,
              reason: errMsg,
            });
          }

          return NextResponse.json(
            {
              error: `Berhasil membuat ${uniqueAiQuestions.length} dari ${parsedCount} butir soal via AI. Batch selanjutnya terkendala: ${errMsg}. Anda dapat melanjutkan dengan melengkapi dari Bank Soal SMA.`,
              errorCode: errCode,
              provider: provider.name,
              canFallbackToManual: true,
              partialCount: uniqueAiQuestions.length,
              requestId,
            },
            { status: errStatus }
          );
        }
      } else {
        // Total AI failure across all batches
        capturedAiError = batchErrors[0] || new AIError("SERVER_ERROR", "Seluruh batch generasi AI gagal.");
      }
    }

    // Handle full failure if no questions were generated
    if (generatedQuestions.length === 0 && capturedAiError) {
      const errCode: AIErrorCode = capturedAiError instanceof AIError ? capturedAiError.code : "UNKNOWN_ERROR";
      const errStatus = capturedAiError instanceof AIError ? capturedAiError.statusCode : 500;
      const errMsg = capturedAiError?.message || "Pembuatan soal via AI gagal.";

      AIMetricsRepository.record({
        requestId,
        provider: provider.name,
        model: modelName,
        success: false,
        latencyMs: Date.now() - startTime,
        error: `[${errCode}] ${errMsg}`,
        subject: subject.name,
        topic: topic.name,
        subtopic: subtopic || undefined,
        questionCount: parsedCount,
        generatedCount: 0,
        status: "FAILED",
        isFallback: false,
      });

      SystemLogRepository.log({
        level: "error",
        action: "AI_GENERATION_FAILED",
        actorId: user.id,
        actorEmail: user.email,
        targetType: "ai_provider",
        targetId: provider.name,
        details: `[${requestId}] Gagal generate soal via ${provider.name} (${modelName}): [${errCode}] ${errMsg}`,
      });

      if (fallbackToManual === true) {
        console.warn(`[Generator Fallback] Falling back fully to Curated Bank due to: ${errMsg}`);
        const mockProvider = new MockAIProvider();
        generatedQuestions = await mockProvider.generateQuestions({
          ...baseQuestionReq,
          questionCount: parsedCount,
        });
        isFallback = true;
        fallbackReason = errMsg;
      } else {
        if (reservation && reservation.success) {
          releaseAiQuota({
            userId: user.id,
            reservationId: reservation.reservationId,
            quotaDate: reservation.quotaDate,
            reason: errMsg,
          });
        }
        return NextResponse.json(
          {
            error: errMsg,
            errorCode: errCode,
            provider: provider.name,
            canFallbackToManual: true,
            requestId,
          },
          { status: errStatus }
        );
      }
    }

    if (!generatedQuestions || generatedQuestions.length === 0) {
      if (reservation && reservation.success) {
        releaseAiQuota({
          userId: user.id,
          reservationId: reservation.reservationId,
          quotaDate: reservation.quotaDate,
          reason: "No questions generated",
        });
      }
      return NextResponse.json(
        { error: "Pembuatan soal gagal, bank soal tidak mengembalikan butir soal.", requestId },
        { status: 502 }
      );
    }

    const latencyMs = Date.now() - startTime;
    const finalStatus = isFallback
      ? provider.providerType === "mock"
        ? "SUCCESS"
        : "FALLBACK"
      : "SUCCESS";

    // Record telemetry for owner/admin
    AIMetricsRepository.record({
      requestId,
      requestType: "question_generation",
      provider: isFallback && provider.providerType !== "mock" ? `${provider.name} + Bank Soal` : provider.name,
      model: modelName,
      success: true,
      latencyMs,
      subject: subject.name,
      topic: topic.name,
      subtopic: subtopic || undefined,
      questionCount: parsedCount,
      generatedCount: generatedQuestions.length,
      status: finalStatus,
      isFallback,
      tokenUsage: (provider as any).lastTokenUsage,
    });

    SystemLogRepository.log({
      level: isFallback && provider.providerType !== "mock" ? "warn" : "info",
      action: isFallback ? "AI_GENERATION_FALLBACK" : "AI_GENERATION_SUCCESS",
      actorId: user.id,
      actorEmail: user.email,
      targetType: "ai_provider",
      targetId: provider.name,
      details: `[${requestId}] Berhasil membuat ${generatedQuestions.length} butir soal (${validMode.toUpperCase()}) untuk ${subject.name} - ${topic.name} dalam ${latencyMs}ms. Provider: ${provider.name}${isFallback ? ` (Mode: Fallback/Bank Soal - ${fallbackReason})` : ""}.`,
    });

    // Save questions in Database
    QuestionRepository.saveBatch(generatedQuestions);

    // Confirm AI quota usage upon successfully generated questions (Task 3)
    if (reservation && reservation.success) {
      confirmAiQuota({
        userId: user.id,
        reservationId: reservation.reservationId,
        quotaDate: reservation.quotaDate,
        questionsCount: generatedQuestions.length,
        tokensConsumed: (provider as any).lastTokenUsage?.totalTokens || 0,
      });
    }

    // Create active practice session
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newSession: PracticeSession = {
      id: sessionId,
      userId: user.id,
      config: {
        subjectId,
        topicId,
        subtopic: subtopic ? String(subtopic).trim() : undefined,
        questionCount: generatedQuestions.length,
        mode: validMode,
        learningMode: validLearningMode,
      },
      status: "active",
      questionIds: generatedQuestions.map((q) => q.id),
      score: null,
      correctCount: null,
      wrongCount: null,
      emptyCount: null,
      startedAt: new Date().toISOString(),
    };

    SessionRepository.create(newSession);

    return NextResponse.json({
      success: true,
      sessionId,
      requestId,
      questionCount: generatedQuestions.length,
      mode: validMode,
      learningMode: validLearningMode,
      isFallback,
      fallbackReason,
      providerUsed: isFallback
        ? provider.providerType === "mock"
          ? "mock_curated_bank"
          : `${provider.name} + fallback_bank`
        : provider.name,
      latencyMs,
    });
  } catch (err: any) {
    console.error("[Generator Route Critical Error]:", err?.message || err);
    if (reservation && reservation.success && user) {
      releaseAiQuota({
        userId: user.id,
        reservationId: reservation.reservationId,
        quotaDate: reservation.quotaDate,
        reason: err?.message || "Critical internal error",
      });
    }
    return NextResponse.json(
      {
        error: err?.message || "Terjadi kesalahan internal saat membuat latihan.",
        requestId,
      },
      { status: 500 }
    );
  }
}
