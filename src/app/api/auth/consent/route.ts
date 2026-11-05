import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { UserRepository } from "@/lib/db";

export const dynamic = "force-dynamic";

const CURRENT_TOS_VERSION = "2026.11";
const CURRENT_PRIVACY_VERSION = "2026.11";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    return NextResponse.json({
      success: true,
      currentPolicy: {
        tosVersion: CURRENT_TOS_VERSION,
        privacyVersion: CURRENT_PRIVACY_VERSION,
        effectiveDate: "2026-11-04",
      },
      userConsent: user
        ? {
            tosAcceptedAt: user.tosAcceptedAt,
            privacyAcceptedAt: user.privacyAcceptedAt,
            tosVersion: user.tosVersion || "2026.11",
            privacyVersion: user.privacyVersion || "2026.11",
            parentalConsentConfirmed: Boolean(user.parentalConsentConfirmed),
            isUpToDate:
              user.tosVersion === CURRENT_TOS_VERSION &&
              user.privacyVersion === CURRENT_PRIVACY_VERSION,
          }
        : null,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED: Wajib login." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { agreeTerms, agreePrivacy, parentalConsent } = body;

    if (!agreeTerms || !agreePrivacy) {
      return NextResponse.json(
        { success: false, error: "Anda wajib menyetujui Ketentuan Layanan dan Kebijakan Privasi versi terbaru." },
        { status: 400 }
      );
    }

    const updated = UserRepository.updateConsent(user.id, {
      tosVersion: CURRENT_TOS_VERSION,
      privacyVersion: CURRENT_PRIVACY_VERSION,
      parentalConsent: Boolean(parentalConsent),
    });

    return NextResponse.json({
      success: true,
      message: "Persetujuan kebijakan privasi dan ketentuan layanan berhasil diperbarui.",
      user: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
