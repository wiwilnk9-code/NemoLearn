import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { QuestionRepository, SubjectRepository } from "@/lib/db";
import { Question, QuestionDifficulty, QuestionGrade, QuestionOption, QuestionStatus } from "@/types/question";
import { validateQuestion } from "@/lib/validation/questionValidator";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED: Anda wajib masuk ke akun terlebih dahulu." },
        { status: 401 }
      );
    }

    const canManage = user.role === "guru" || user.role === "admin" || user.role === "owner";
    if (!canManage) {
      return NextResponse.json(
        { error: "FORBIDDEN: Hanya guru dan administrator yang diizinkan mengimpor butir soal." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const rawQuestions = body.questions;
    const defaultStatus: QuestionStatus = body.defaultStatus === "draft" ? "draft" : "published";

    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      return NextResponse.json(
        { error: "Format salah: 'questions' harus berupa array yang berisi minimal 1 butir soal." },
        { status: 400 }
      );
    }

    if (rawQuestions.length > 50) {
      return NextResponse.json(
        { error: "Batas maksimal impor dalam satu kali pengiriman adalah 50 butir soal." },
        { status: 400 }
      );
    }

    const validQuestions: Question[] = [];
    const validationErrors: string[] = [];

    rawQuestions.forEach((raw, idx) => {
      const itemNum = idx + 1;

      const validation = validateQuestion({
        stem: raw.stem,
        options: raw.options,
        correctAnswer: raw.correctAnswer,
        explanation: raw.explanation,
        hint: raw.hint,
        subjectId: raw.subjectId,
        topicId: raw.topicId,
        difficulty: raw.difficulty,
        grade: raw.grade,
      });

      if (!validation.isValid) {
        validationErrors.push(`Soal #${itemNum}: ${validation.errors.join("; ")}`);
        return;
      }

      const requiredKeys: ("A" | "B" | "C" | "D" | "E")[] = ["A", "B", "C", "D", "E"];
      const normalizedOptions: QuestionOption[] = [];

      if (Array.isArray(raw.options)) {
        for (const key of requiredKeys) {
          const match = raw.options.find((opt: any) => opt.key === key);
          normalizedOptions.push({ key, text: match.text.trim() });
        }
      } else if (raw.options && typeof raw.options === "object") {
        for (const key of requiredKeys) {
          normalizedOptions.push({ key, text: raw.options[key].trim() });
        }
      }

      const validDifficulties: QuestionDifficulty[] = ["mudah", "sedang", "sulit", "hots"];
      const difficulty: QuestionDifficulty = validDifficulties.includes(raw.difficulty) ? raw.difficulty : "sedang";

      const validGrades: QuestionGrade[] = ["10", "11", "12", "SMA"];
      const grade: QuestionGrade = validGrades.includes(raw.grade) ? raw.grade : "SMA";

      const finalStatus: QuestionStatus =
        raw.status === "draft" || raw.status === "published" ? raw.status : defaultStatus;

      validQuestions.push({
        id: `q_imp_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        subjectId: raw.subjectId,
        topicId: raw.topicId,
        subtopic: raw.subtopic ? String(raw.subtopic).trim() : undefined,
        level: "SMA",
        grade,
        type: "pilihan_ganda",
        stem: raw.stem.trim(),
        options: normalizedOptions,
        correctAnswer: raw.correctAnswer,
        explanation: raw.explanation.trim(),
        hint: validation.sanitizedHint,
        imageUrl: raw.imageUrl ? String(raw.imageUrl).trim() : undefined,
        isAiGenerated: false,
        difficulty,
        sourceType: "manual",
        status: finalStatus,
        createdBy: user.id,
        createdByName: user.displayName,
        createdAt: new Date().toISOString(),
      });
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Validasi impor gagal pada beberapa butir soal.",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    QuestionRepository.saveBatch(validQuestions);

    return NextResponse.json({
      success: true,
      message: `${validQuestions.length} butir soal berhasil diimpor ke Bank Soal.`,
      count: validQuestions.length,
      importedQuestions: validQuestions,
    });
  } catch (err: any) {
    console.error("[Questions Import Error]:", err);
    return NextResponse.json({ error: err.message || "Gagal mengimpor soal." }, { status: 500 });
  }
}
