import { NextResponse } from "next/server";
import { getCurrentUser, requireAuth } from "@/lib/auth/server";
import { FeedbackRepository, SystemLogRepository } from "@/lib/db";
import { FeedbackType } from "@/types/feedback";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    const body = await req.json().catch(() => ({}));
    const { type = "feedback", category, subject, message, rating, deviceInfo, guestEmail, guestName } = body;

    if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Subjek pesan minimal 3 karakter." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "Isi pesan atau laporan minimal 5 karakter." },
        { status: 400 }
      );
    }

    const validTypes: FeedbackType[] = ["feedback", "bug_report", "contact_support"];
    const feedbackType: FeedbackType = validTypes.includes(type) ? type : "feedback";

    const feedback = FeedbackRepository.create({
      userId: user?.id,
      userName: user ? user.displayName : (guestName ? String(guestName).trim() : "Tamu"),
      userEmail: user ? user.email : (guestEmail ? String(guestEmail).trim() : undefined),
      type: feedbackType,
      category: category ? String(category).trim() : "general",
      subject: subject.trim(),
      message: message.trim(),
      rating: typeof rating === "number" && rating >= 1 && rating <= 5 ? rating : undefined,
      deviceInfo: deviceInfo ? String(deviceInfo).slice(0, 255) : undefined,
    });

    SystemLogRepository.log({
      level: "info",
      action: "USER_FEEDBACK_SUBMITTED",
      actorId: user?.id || "guest",
      actorEmail: user?.email || guestEmail,
      actorName: user?.displayName || guestName || "Tamu",
      actorRole: user?.role || "tamu",
      targetType: "feedback",
      targetId: feedback.id,
      details: `Masukan tipe '${feedbackType}' dikirim: "${subject.trim().slice(0, 80)}"`,
      status: "SUKSES",
      category: "system",
    });

    return NextResponse.json({
      success: true,
      message: "Terima kasih! Pesan dan masukan Anda berhasil kami terima.",
      feedbackId: feedback.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengirim masukan." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    await requireAuth(["admin", "owner"], undefined, req);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as FeedbackType | null;
    const status = searchParams.get("status") as any;
    const search = searchParams.get("search") || undefined;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 50;

    const result = FeedbackRepository.getAll({
      type: type || undefined,
      status: status || undefined,
      search,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    const status = err.message?.startsWith("UNAUTHORIZED") ? 401 : err.message?.startsWith("FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
