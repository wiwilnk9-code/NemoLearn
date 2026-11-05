import { NextResponse } from "next/server";
import { SubjectRepository } from "@/lib/db";

export async function GET() {
  try {
    const subjects = SubjectRepository.getAll();
    return NextResponse.json({ subjects });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
