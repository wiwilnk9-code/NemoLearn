import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { SessionRepository, QuestionRepository, ResponseRepository, UserRepository } from "@/lib/db";
import { evaluatePracticeSession } from "@/lib/scoring/calculator";
import { PracticeSession } from "@/types/session";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const parentSessionId = params.id;
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED: Anda wajib masuk ke akun terlebih dahulu." },
        { status: 401 }
      );
    }

    const parentSession = SessionRepository.getById(parentSessionId);
    if (!parentSession) {
      return NextResponse.json({ error: "Sesi awal tidak ditemukan." }, { status: 404 });
    }

    if (parentSession.userId !== user.id) {
      return NextResponse.json({ error: "FORBIDDEN: Sesi ini bukan milik Anda." }, { status: 403 });
    }

    const questions = QuestionRepository.getByIds(parentSession.questionIds);
    const responses = ResponseRepository.getBySessionId(parentSessionId);

    // Evaluate parent session to find wrong / empty questions
    const evaluation = evaluatePracticeSession({
      session: parentSession,
      questions,
      responses,
    });

    const failedItems = evaluation.items.filter((item) => !item.isCorrect);

    if (failedItems.length === 0) {
      return NextResponse.json(
        { error: "Hebat! Semua soal pada sesi ini dijawab dengan benar, tidak memerlukan remedial." },
        { status: 400 }
      );
    }

    // Create Remedial Session (Scores on parent session remain unchanged!)
    const remedialSessionId = `sess_remedial_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const remedialSession: PracticeSession = {
      id: remedialSessionId,
      userId: user.id,
      config: {
        ...parentSession.config,
        isRemedial: true,
        parentSessionId: parentSession.id,
        questionCount: failedItems.length,
      },
      status: "active",
      questionIds: failedItems.map((item) => item.question.id),
      score: null,
      correctCount: null,
      wrongCount: null,
      emptyCount: null,
      startedAt: new Date().toISOString(),
    };

    SessionRepository.create(remedialSession);

    return NextResponse.json({
      success: true,
      remedialSessionId,
      questionCount: failedItems.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
