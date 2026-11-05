import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { QuestionRepository, SubjectRepository } from "@/lib/db";
import { Question, QuestionDifficulty, QuestionGrade, QuestionOption, QuestionStatus } from "@/types/question";
import { validateQuestion } from "@/lib/validation/questionValidator";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    const url = new URL(req.url);

    const subjectId = url.searchParams.get("subjectId") || undefined;
    const topicId = url.searchParams.get("topicId") || undefined;
    const grade = url.searchParams.get("grade") || undefined;
    const difficulty = url.searchParams.get("difficulty") || undefined;
    const statusParam = url.searchParams.get("status") || undefined;
    const search = url.searchParams.get("search") || undefined;
    const mineOnly = url.searchParams.get("mineOnly") === "true";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    const isAdmin = user?.role === "admin" || user?.role === "owner";
    const isTeacher = user?.role === "guru";

    // Otorisasi status draft:
    // Hanya Admin dan Guru pemilik yang diizinkan melihat soal draft.
    // Pelajar dan tamu hanya diizinkan melihat soal publikasi.
    let status: QuestionStatus | "all" | undefined = undefined;
    let includeDrafts = false;

    if (isAdmin) {
      status = statusParam as QuestionStatus | "all" | undefined;
      includeDrafts = true;
    } else if (isTeacher) {
      includeDrafts = true;
      if (statusParam === "draft") {
        status = "draft";
      } else if (statusParam === "published") {
        status = "published";
      } else {
        status = "all";
      }
    } else {
      // Pelajar / tamu: hanya melihat published
      status = "published";
      includeDrafts = false;
    }

    const filters = {
      subjectId,
      topicId,
      grade,
      difficulty,
      status,
      search,
      mineOnly: isTeacher || isAdmin ? mineOnly : false,
      createdBy: user?.id,
      page,
      limit,
      includeDrafts,
    };

    const { questions, total, stats } = QuestionRepository.getAll(filters);

    // Filter tambahan untuk guru: guru hanya boleh melihat draft miliknya sendiri
    let authorizedQuestions = questions;
    if (isTeacher && !isAdmin) {
      authorizedQuestions = questions.filter((q) => {
        if (q.status === "draft") {
          return q.createdBy === user?.id;
        }
        return true;
      });
    }

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      questions: authorizedQuestions,
      total,
      page,
      limit,
      totalPages,
      stats,
    });
  } catch (err: any) {
    console.error("[Questions GET Error]:", err);
    return NextResponse.json({ error: err.message || "Gagal mengambil bank soal." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED: Anda wajib masuk ke akun terlebih dahulu." },
        { status: 401 }
      );
    }

    // Role-Based Authorization
    const canManage = user.role === "guru" || user.role === "admin" || user.role === "owner";
    if (!canManage) {
      return NextResponse.json(
        { error: "FORBIDDEN: Hanya guru dan administrator yang diizinkan menambahkan soal baru." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      subjectId,
      topicId,
      subtopic,
      grade,
      difficulty,
      stem,
      options,
      correctAnswer,
      explanation,
      hint,
      imageUrl,
      status,
    } = body;

    // Validasi Terpadu Menggunakan Question Validator
    const validation = validateQuestion({
      stem,
      options,
      correctAnswer,
      explanation,
      hint,
      subjectId,
      topicId,
      difficulty,
      grade,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors[0], details: validation.errors },
        { status: 400 }
      );
    }

    const requiredKeys: ("A" | "B" | "C" | "D" | "E")[] = ["A", "B", "C", "D", "E"];
    const normalizedOptions: QuestionOption[] = [];

    for (const key of requiredKeys) {
      const match = (options as any[]).find((opt: any) => opt.key === key);
      normalizedOptions.push({
        key,
        text: match.text.trim(),
      });
    }

    const validGrades: QuestionGrade[] = ["10", "11", "12", "SMA"];
    const finalGrade: QuestionGrade = validGrades.includes(grade) ? grade : "SMA";
    const finalStatus: QuestionStatus = status === "draft" ? "draft" : "published";

    const newQuestionId = `q_man_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newQuestion: Question = {
      id: newQuestionId,
      subjectId,
      topicId,
      subtopic: subtopic ? String(subtopic).trim() : undefined,
      level: "SMA",
      grade: finalGrade,
      type: "pilihan_ganda",
      stem: stem.trim(),
      options: normalizedOptions,
      correctAnswer: correctAnswer as "A" | "B" | "C" | "D" | "E",
      explanation: explanation.trim(),
      hint: validation.sanitizedHint,
      imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
      isAiGenerated: false,
      difficulty,
      sourceType: "manual",
      status: finalStatus,
      createdBy: user.id,
      createdByName: user.displayName,
      createdAt: new Date().toISOString(),
    };

    QuestionRepository.create(newQuestion);

    return NextResponse.json(
      {
        success: true,
        message:
          finalStatus === "draft"
            ? "Soal berhasil disimpan sebagai draft."
            : "Soal berhasil dipublikasikan ke Bank Soal.",
        question: newQuestion,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[Questions POST Error]:", err);
    return NextResponse.json({ error: err.message || "Gagal menyimpan soal." }, { status: 500 });
  }
}
