import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { SessionRepository, ResponseRepository, QuestionRepository, UserRepository, syncResponseUpsert } from "@/lib/db";

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

    if (session.status === "completed") {
      return NextResponse.json(
        { error: "Sesi ini telah selesai disubmit. Jawaban tidak dapat diubah lagi." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { questionId, selectedAnswer } = body;

    if (!questionId || !session.questionIds.includes(questionId)) {
      return NextResponse.json({ error: "Soal tidak valid untuk sesi ini." }, { status: 400 });
    }

    const validAnswer =
      selectedAnswer && ["A", "B", "C", "D", "E"].includes(selectedAnswer)
        ? (selectedAnswer as "A" | "B" | "C" | "D" | "E")
        : null;

    // Idempotent save & await Supabase sync
    const record = ResponseRepository.saveAnswer(sessionId, questionId, validAnswer);
    await syncResponseUpsert(record);

    // STAGE 2: MODE BELAJAR vs MODE UJIAN
    if (session.config.learningMode === "belajar") {
      const questions = await QuestionRepository.getByIdsAsync([questionId]);
      const question = questions[0] || QuestionRepository.getById(questionId);
      const isCorrect = Boolean(validAnswer && question && validAnswer === question.correctAnswer);
      ResponseRepository.markEvaluated(sessionId, questionId, isCorrect);
      await syncResponseUpsert({
        ...record,
        isCorrect,
      });

      return NextResponse.json({
        success: true,
        questionId,
        selectedAnswer: record.selectedAnswer,
        savedAt: record.answeredAt,
        learningMode: "belajar",
        isCorrect,
        correctAnswer: question ? question.correctAnswer : null,
      });
    }

    // MODE UJIAN:
    // PENTING: Jangan tampilkan kunci jawaban atau evaluasi benar/salah selama ujian berlangsung!
    return NextResponse.json({
      success: true,
      questionId,
      selectedAnswer: record.selectedAnswer,
      savedAt: record.answeredAt,
      learningMode: "ujian",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
