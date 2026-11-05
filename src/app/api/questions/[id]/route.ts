import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { QuestionRepository, SubjectRepository } from "@/lib/db";
import { QuestionDifficulty, QuestionGrade, QuestionOption, QuestionStatus } from "@/types/question";
import { sanitizeHint } from "@/lib/validation/questionValidator";

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const questionId = params.id;
    const question = QuestionRepository.getById(questionId);

    if (!question) {
      return NextResponse.json({ error: "Soal tidak ditemukan." }, { status: 404 });
    }

    // Cek otorisasi jika soal berstatus draft
    if (question.status === "draft") {
      const user = await getCurrentUser();
      const isAdmin = user?.role === "admin" || user?.role === "owner";
      const isOwner = user && question.createdBy === user.id;

      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          { error: "FORBIDDEN: Anda tidak memiliki izin mengakses soal draft ini." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ success: true, question });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal mengambil rincian soal." }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED: Anda wajib masuk ke akun terlebih dahulu." },
        { status: 401 }
      );
    }

    const questionId = params.id;
    const existing = QuestionRepository.getById(questionId);

    if (!existing) {
      return NextResponse.json({ error: "Soal tidak ditemukan." }, { status: 404 });
    }

    // Otorisasi Kepemilikan (Ownership & RBAC):
    // Admin / Owner dapat mengedit semua soal.
    // Guru HANYA boleh mengedit soal yang ia buat sendiri (createdBy === user.id).
    const isAdmin = user.role === "admin" || user.role === "owner";
    const isOwnerTeacher = user.role === "guru" && existing.createdBy === user.id;

    if (!isAdmin && !isOwnerTeacher) {
      return NextResponse.json(
        { error: "FORBIDDEN: Anda tidak memiliki izin mengedit soal milik guru atau instansi lain." },
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

    const updates: any = {};

    if (stem !== undefined) {
      if (typeof stem !== "string" || stem.trim().length < 5) {
        return NextResponse.json(
          { error: "Teks soal wajib diisi dan minimal 5 karakter." },
          { status: 400 }
        );
      }
      updates.stem = stem.trim();
    }

    if (subjectId !== undefined) {
      const subject = SubjectRepository.getById(subjectId);
      if (!subject) {
        return NextResponse.json({ error: "Mata pelajaran tidak ditemukan." }, { status: 404 });
      }
      updates.subjectId = subjectId;

      if (topicId !== undefined) {
        const topicExists = subject.topics.some((t) => t.id === topicId);
        if (!topicExists) {
          return NextResponse.json(
            { error: "Materi pokok tidak cocok dengan mata pelajaran yang dipilih." },
            { status: 400 }
          );
        }
        updates.topicId = topicId;
      }
    } else if (topicId !== undefined) {
      const subject = SubjectRepository.getById(existing.subjectId);
      const topicExists = subject?.topics.some((t) => t.id === topicId);
      if (!topicExists) {
        return NextResponse.json(
          { error: "Materi pokok tidak ditemukan pada mata pelajaran soal ini." },
          { status: 400 }
        );
      }
      updates.topicId = topicId;
    }

    if (subtopic !== undefined) {
      updates.subtopic = subtopic ? String(subtopic).trim() : undefined;
    }

    if (grade !== undefined) {
      const validGrades: QuestionGrade[] = ["10", "11", "12", "SMA"];
      updates.grade = validGrades.includes(grade) ? grade : "SMA";
    }

    if (difficulty !== undefined) {
      const validDifficulties: QuestionDifficulty[] = ["mudah", "sedang", "sulit", "hots"];
      if (!validDifficulties.includes(difficulty)) {
        return NextResponse.json(
          { error: "Tingkat kesulitan tidak valid (pilihan: mudah, sedang, sulit, hots)." },
          { status: 400 }
        );
      }
      updates.difficulty = difficulty;
    }

    if (options !== undefined) {
      if (!Array.isArray(options) || options.length !== 5) {
        return NextResponse.json(
          { error: "Soal pilihan ganda wajib memiliki 5 opsi jawaban (A, B, C, D, E)." },
          { status: 400 }
        );
      }
      const requiredKeys: ("A" | "B" | "C" | "D" | "E")[] = ["A", "B", "C", "D", "E"];
      const normalizedOptions: QuestionOption[] = [];
      for (const key of requiredKeys) {
        const match = options.find((opt: any) => opt.key === key);
        if (!match || !match.text || typeof match.text !== "string" || !match.text.trim()) {
          return NextResponse.json(
            { error: `Teks opsi pilihan ${key} wajib diisi dan tidak boleh kosong.` },
            { status: 400 }
          );
        }
        normalizedOptions.push({ key, text: match.text.trim() });
      }
      updates.options = normalizedOptions;
    }

    if (correctAnswer !== undefined) {
      const requiredKeys = ["A", "B", "C", "D", "E"];
      if (!requiredKeys.includes(correctAnswer)) {
        return NextResponse.json(
          { error: "Kunci jawaban harus berupa salah satu dari A, B, C, D, atau E." },
          { status: 400 }
        );
      }
      updates.correctAnswer = correctAnswer;
    }

    if (explanation !== undefined) {
      if (typeof explanation !== "string" || explanation.trim().length < 5) {
        return NextResponse.json(
          { error: "Pembahasan konsep soal wajib diisi (minimal 5 karakter)." },
          { status: 400 }
        );
      }
      updates.explanation = explanation.trim();
    }

    if (hint !== undefined) {
      const targetKey = updates.correctAnswer || existing.correctAnswer;
      updates.hint = hint ? sanitizeHint(String(hint), targetKey) : undefined;
    }

    if (imageUrl !== undefined) {
      updates.imageUrl = imageUrl ? String(imageUrl).trim() : undefined;
    }

    if (status !== undefined) {
      updates.status = status === "draft" ? "draft" : "published";
    }

    const updated = QuestionRepository.update(questionId, updates);

    return NextResponse.json({
      success: true,
      message: "Soal berhasil diperbarui.",
      question: updated,
    });
  } catch (err: any) {
    console.error("[Questions PUT Error]:", err);
    return NextResponse.json({ error: err.message || "Gagal memperbarui soal." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED: Anda wajib masuk ke akun terlebih dahulu." },
        { status: 401 }
      );
    }

    const questionId = params.id;
    const existing = QuestionRepository.getById(questionId);

    if (!existing) {
      return NextResponse.json({ error: "Soal tidak ditemukan." }, { status: 404 });
    }

    // Otorisasi Penghapusan (RBAC):
    // Admin / Owner dapat menghapus soal apapun.
    // Guru HANYA boleh menghapus soal miliknya sendiri.
    const isAdmin = user.role === "admin" || user.role === "owner";
    const isOwnerTeacher = user.role === "guru" && existing.createdBy === user.id;

    if (!isAdmin && !isOwnerTeacher) {
      return NextResponse.json(
        { error: "FORBIDDEN: Anda tidak memiliki izin menghapus soal milik orang lain." },
        { status: 403 }
      );
    }

    const deleted = QuestionRepository.delete(questionId);
    if (!deleted) {
      return NextResponse.json({ error: "Gagal menghapus soal dari database." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Soal berhasil dihapus dari Bank Soal.",
      questionId,
    });
  } catch (err: any) {
    console.error("[Questions DELETE Error]:", err);
    return NextResponse.json({ error: err.message || "Gagal menghapus soal." }, { status: 500 });
  }
}
