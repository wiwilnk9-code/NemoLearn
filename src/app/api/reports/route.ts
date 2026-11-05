import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ReportRepository, UserRepository } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    const actorId = user ? user.id : "guest_anonymous";

    const body = await req.json();
    const { targetType, targetId, action, reason } = body;

    if (!targetType || !targetId || !reason) {
      return NextResponse.json(
        { error: "Parameter laporan (targetType, targetId, reason) tidak lengkap." },
        { status: 400 }
      );
    }

    const report = ReportRepository.create(
      actorId,
      String(targetType).slice(0, 64),
      String(targetId).slice(0, 128),
      String(action || "report").slice(0, 64),
      String(reason).slice(0, 1000)
    );

    if (user) {
      report.reporterEmail = user.email;
      report.reporterName = user.displayName;
    }

    return NextResponse.json({ success: true, message: "Laporan berhasil dicatat." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
