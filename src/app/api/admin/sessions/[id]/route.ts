import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { SessionRepository, SystemLogRepository, ResponseRepository, QuestionRepository } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(["admin", "owner"], "manage_sessions", req);
    const sessionId = params.id;

    const session = SessionRepository.getById(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sesi latihan tidak ditemukan." },
        { status: 404 }
      );
    }

    const responses = ResponseRepository.getBySessionId(sessionId);
    const questions = QuestionRepository.getByIds(session.questionIds);

    return NextResponse.json({
      success: true,
      session,
      responses,
      questions,
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes("FORBIDDEN");
    const isUnauthorized = err.message?.includes("UNAUTHORIZED");
    const status = isForbidden ? 403 : isUnauthorized ? 401 : 500;

    return NextResponse.json(
      { success: false, error: err.message || "Gagal memuat detail sesi." },
      { status }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAuth(["admin", "owner"], "manage_sessions", req);
    const sessionId = params.id;

    const existing = SessionRepository.getById(sessionId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak ditemukan." },
        { status: 404 }
      );
    }

    SessionRepository.delete(sessionId);

    SystemLogRepository.log({
      level: "warn",
      action: "SESSION_DELETED",
      actorId: admin.id,
      actorEmail: admin.email,
      targetType: "session",
      targetId: sessionId,
      details: `Admin ${admin.displayName} menghapus sesi latihan ${sessionId} (Mata Pelajaran: ${existing.config.subjectId}).`,
    });

    return NextResponse.json({
      success: true,
      message: "Sesi latihan berhasil dihapus.",
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes("FORBIDDEN");
    const isUnauthorized = err.message?.includes("UNAUTHORIZED");
    const status = isForbidden ? 403 : isUnauthorized ? 401 : 500;

    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus sesi." },
      { status }
    );
  }
}
