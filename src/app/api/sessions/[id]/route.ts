import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { SessionRepository, QuestionRepository, ResponseRepository, SubjectRepository, UserRepository } from "@/lib/db";
import { PublicQuestion } from "@/types/question";
import { evaluatePracticeSession } from "@/lib/scoring/calculator";

export async function GET(req: Request, { params }: { params: { id: string } }) {
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
      return NextResponse.json({ error: "Sesi latihan tidak ditemukan." }, { status: 404 });
    }

    // Authorization: User cannot access other user's private sessions
    if (session.userId !== user.id && user.role !== "admin" && user.role !== "guru") {
      return NextResponse.json({ error: "FORBIDDEN: Anda tidak memiliki hak akses untuk sesi ini." }, { status: 403 });
    }

    const subject = SubjectRepository.getById(session.config.subjectId);
    const topic = subject?.topics.find((t) => t.id === session.config.topicId);
    const questions = QuestionRepository.getByIds(session.questionIds);
    const existingResponses = ResponseRepository.getBySessionId(sessionId);

    // If session is still active: RETURN SANITIZED PUBLIC QUESTIONS
    if (session.status === "active") {
      const publicQuestions: PublicQuestion[] = questions.map((q) => ({
        id: q.id,
        subjectId: q.subjectId,
        topicId: q.topicId,
        subtopic: q.subtopic,
        level: q.level,
        type: q.type,
        stem: q.stem,
        options: q.options,
        difficulty: q.difficulty,
        isAiGenerated: q.isAiGenerated,
        sourceType: q.sourceType,
      }));

      // Map answers as a dictionary { [questionId]: "A" | "B" ... }
      const answersDict: Record<string, "A" | "B" | "C" | "D" | "E" | null> = {};
      Object.values(existingResponses).forEach((r) => {
        answersDict[r.questionId] = r.selectedAnswer;
      });

      // STAGE 2: Untuk Mode Belajar yang aktif, kirimkan status evaluasi HANYA bagi soal yang telah dijawab
      const evaluations: Record<string, { isCorrect: boolean; correctAnswer: string }> = {};
      if (session.config.learningMode === "belajar") {
        Object.values(existingResponses).forEach((r) => {
          if (r.selectedAnswer) {
            const q = questions.find((item) => item.id === r.questionId);
            if (q) {
              evaluations[r.questionId] = {
                isCorrect: r.isCorrect ?? (r.selectedAnswer === q.correctAnswer),
                correctAnswer: q.correctAnswer,
              };
            }
          }
        });
      }

      return NextResponse.json({
        session,
        subjectName: subject?.name || session.config.subjectId,
        topicName: topic?.name || session.config.topicId,
        questions: publicQuestions,
        answers: answersDict,
        evaluations: session.config.learningMode === "belajar" ? evaluations : undefined,
        isCompleted: false,
      });
    }

    // If session is completed: RETURN FULL EVALUATED RESULT
    const result = evaluatePracticeSession({
      session,
      questions,
      responses: existingResponses,
    });

    return NextResponse.json({
      session: result.session,
      subjectName: subject?.name || session.config.subjectId,
      topicName: topic?.name || session.config.topicId,
      result,
      isCompleted: true,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
