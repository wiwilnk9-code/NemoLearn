import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { SessionRepository, UserRepository, SubjectRepository } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ sessions: [] });
    }

    const sessions = SessionRepository.getByUserId(user.id);
    const subjects = SubjectRepository.getAll();

    const formatted = sessions.map((s) => {
      const sub = subjects.find((sb) => sb.id === s.config.subjectId);
      const top = sub?.topics.find((t) => t.id === s.config.topicId);

      return {
        ...s,
        subjectName: sub?.name || s.config.subjectId,
        topicName: top?.name || s.config.topicId,
      };
    });

    return NextResponse.json({ sessions: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
