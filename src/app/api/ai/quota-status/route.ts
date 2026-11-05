import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserQuotaStatus } from "@/lib/ai/quota-manager";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = (await getCurrentUser(req)) || (await getCurrentUser());
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED: Anda harus login untuk melihat status kuota AI." },
        { status: 401 }
      );
    }

    const quota = getUserQuotaStatus(user);
    return NextResponse.json({
      success: true,
      quota,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Gagal mengambil status kuota AI." },
      { status: 500 }
    );
  }
}
