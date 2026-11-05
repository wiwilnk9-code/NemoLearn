import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const isGoogleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return NextResponse.json({
    provider: "google",
    isConfigured: isGoogleConfigured,
    message: isGoogleConfigured
      ? "Google OAuth tersedia dan terkonfigurasi."
      : "Google OAuth belum dikonfigurasi di lingkungan ini. Silakan gunakan autentikasi Email dan Kata Sandi.",
  });
}
