import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { SessionRepository, QuestionRepository, ResponseRepository, UserRepository } from "@/lib/db";
import { evaluatePracticeSession } from "@/lib/scoring/calculator";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionId = params.id;
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED: Anda wajib masuk ke akun terlebih dahulu." },
        { status: 401 }
      );
    }

    const session = SessionRepository.getById(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 404 });
    }

    if (session.userId !== user.id) {
      return NextResponse.json({ error: "FORBIDDEN: Sesi ini bukan milik Anda." }, { status: 403 });
    }

    const questions = QuestionRepository.getByIds(session.questionIds);
    const responses = ResponseRepository.getBySessionId(sessionId);

    // Evaluate session using official server-side rules
    const evaluation = evaluatePracticeSession({
      session,
      questions,
      responses,
    });

    // Mark individual response records as evaluated
    evaluation.items.forEach((item) => {
      ResponseRepository.markEvaluated(sessionId, item.question.id, item.isCorrect);
    });

    // Persist completed status and snapshot score in SessionRepository
    SessionRepository.update(sessionId, {
      status: "completed",
      score: evaluation.session.score,
      scoreFormatted: evaluation.session.scoreFormatted,
      scoringMethod: evaluation.session.scoringMethod,
      scoringScale: evaluation.session.scoringScale,
      scoringVersion: evaluation.session.scoringVersion,
      scoreLabel: evaluation.session.scoreLabel,
      theta: evaluation.session.theta,
      standardError: evaluation.session.standardError,
      correctCount: evaluation.correctCount,
      wrongCount: evaluation.wrongCount,
      emptyCount: evaluation.emptyCount,
      completedAt: evaluation.session.completedAt,
    });

    return NextResponse.json({
      success: true,
      result: evaluation,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
