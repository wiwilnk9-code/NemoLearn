import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  SessionRepository,
  QuestionRepository,
  ResponseRepository,
  UserRepository,
  NotificationRepository,
  syncSessionUpsert,
  syncResponseUpsert,
} from "@/lib/db";
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

    const session = await SessionRepository.getByIdAsync(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 404 });
    }

    if (session.userId !== user.id) {
      return NextResponse.json({ error: "FORBIDDEN: Sesi ini bukan milik Anda." }, { status: 403 });
    }

    const questions = await QuestionRepository.getByIdsAsync(session.questionIds);
    const responses = await ResponseRepository.getBySessionIdAsync(sessionId);

    // Evaluate session using official server-side rules
    const evaluation = evaluatePracticeSession({
      session,
      questions,
      responses,
    });

    // Mark individual response records as evaluated & sync to Supabase
    const responseSyncPromises = evaluation.items.map((item) => {
      ResponseRepository.markEvaluated(sessionId, item.question.id, item.isCorrect);
      return syncResponseUpsert({
        id: `${sessionId}:${item.question.id}`,
        sessionId,
        questionId: item.question.id,
        selectedAnswer: item.selectedAnswer,
        isCorrect: item.isCorrect,
        answeredAt: new Date().toISOString(),
      });
    });
    await Promise.all(responseSyncPromises);

    // Persist completed status and snapshot score in SessionRepository & await Supabase sync
    const updatedSession = SessionRepository.update(sessionId, {
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

    if (updatedSession) {
      await syncSessionUpsert(updatedSession);
    }

    // Trigger in-app notification upon session completion
    try {
      const scoreNum = evaluation.session.score ?? 0;
      await NotificationRepository.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: user.id,
        title: "Latihan Soal Selesai!",
        message: `Selamat, Anda menyelesaikan latihan dengan skor ${evaluation.session.scoreFormatted || scoreNum}. Benar: ${evaluation.correctCount}, Salah: ${evaluation.wrongCount}.`,
        type: "practice",
        isRead: false,
        link: `/results/${sessionId}`,
        createdAt: new Date().toISOString(),
      });
    } catch (notifErr) {
      console.warn("[SessionSubmit] Failed to dispatch completion notification:", notifErr);
    }

    return NextResponse.json({
      success: true,
      result: evaluation,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
