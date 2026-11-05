import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  QuestionRepository,
  SubjectRepository,
  SessionRepository,
  ResponseRepository,
  ExplanationRepository,
} from "@/lib/db";
import { getOrGenerateExplanation } from "@/lib/ai/explanation";
import { ExplanationDepth } from "@/types/question";

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const questionId = params.id;
    const { searchParams } = new URL(req.url);
    const depth = (searchParams.get("depth") as ExplanationDepth) || "normal";
    const sessionId = searchParams.get("sessionId");

    const question = QuestionRepository.getById(questionId);
    if (!question) {
      return NextResponse.json({ error: "Soal tidak ditemukan." }, { status: 404 });
    }

    // Security check jika ada sessionId aktif
    if (sessionId) {
      const session = SessionRepository.getById(sessionId);
      if (session && session.status === "active") {
        if (session.config.learningMode === "ujian") {
          return NextResponse.json(
            { error: "FORBIDDEN: Pembahasan tidak dapat diakses saat Mode Ujian sedang berlangsung." },
            { status: 403 }
          );
        }
        if (session.config.learningMode === "belajar") {
          const resp = ResponseRepository.getBySessionId(sessionId)[questionId];
          if (!resp || !resp.selectedAnswer) {
            return NextResponse.json(
              { error: "FORBIDDEN: Anda wajib menjawab soal ini terlebih dahulu sebelum melihat pembahasan." },
              { status: 403 }
            );
          }
        }
      }
    }

    const version = question.version || 1;
    const cached = ExplanationRepository.get(questionId, depth, version);

    if (cached && cached.content) {
      return NextResponse.json({
        success: true,
        questionId,
        depth: cached.depth,
        explanation: cached.content,
        fromCache: true,
        generatedAt: cached.generatedAt,
      });
    }

    // Jika belum ada di cache
    return NextResponse.json({
      success: true,
      questionId,
      depth,
      explanation: null,
      isPending: true,
      message: "Pembahasan belum di-generate untuk butir soal dan tingkat kedalaman ini.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal mengambil pembahasan." }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const questionId = params.id;
    const question = QuestionRepository.getById(questionId);

    if (!question) {
      return NextResponse.json({ error: "Soal tidak ditemukan." }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const depth: ExplanationDepth = ["singkat", "normal", "mendalam"].includes(body?.depth)
      ? body.depth
      : "normal";
    const sessionId = body?.sessionId;
    const forceRefresh = Boolean(body?.forceRefresh);

    // Security verification untuk integritas ujian & mode belajar (FR-06 & Stage 1 / Stage 2)
    if (sessionId) {
      const session = SessionRepository.getById(sessionId);
      if (session && session.status === "active") {
        // Mode Ujian DILARANG KERAS mengakses pembahasan sebelum submit
        if (session.config.learningMode === "ujian") {
          return NextResponse.json(
            { error: "FORBIDDEN: Pembahasan tidak diizinkan dibuka saat Mode Ujian berlangsung." },
            { status: 403 }
          );
        }

        // Mode Belajar hanya boleh jika soal sudah dijawab oleh pengguna
        if (session.config.learningMode === "belajar") {
          const responses = ResponseRepository.getBySessionId(sessionId);
          const userResp = responses[questionId];
          if (!userResp || !userResp.selectedAnswer) {
            return NextResponse.json(
              { error: "FORBIDDEN: Silakan kirimkan jawaban Anda terlebih dahulu untuk melihat pembahasan." },
              { status: 403 }
            );
          }
        }
      }
    }

    const subject = SubjectRepository.getById(question.subjectId);

    const result = await getOrGenerateExplanation(
      {
        questionId: question.id,
        stem: question.stem,
        options: question.options,
        correctAnswer: question.correctAnswer,
        subjectId: question.subjectId,
        subjectName: subject?.name || question.subjectId,
        topicName: question.topicId,
        subtopic: question.subtopic,
        depth,
      },
      { forceRefresh }
    );

    return NextResponse.json({
      success: true,
      questionId: question.id,
      depth: result.depth,
      explanation: result.content,
      fromCache: result.fromCache,
      latencyMs: result.latencyMs,
      provider: result.provider,
      model: result.model,
    });
  } catch (err: any) {
    console.error("[Explanation API Error]:", err?.message || err);
    return NextResponse.json(
      {
        error: err?.message || "Gagal menghasilkan pembahasan AI.",
        errorCode: err?.code || "AI_ERROR",
      },
      { status: err?.statusCode || 500 }
    );
  }
}
