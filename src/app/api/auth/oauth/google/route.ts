import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isDirect = searchParams.get("action") === "signin";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nemolearn.vercel.app";
  const redirectTo = `${appUrl}/auth/callback`;

  if (isDirect) {
    const { data, error } = await supabaseServer.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        scopes: "openid email profile",
      },
    });

    if (error || !data.url) {
      return NextResponse.redirect(
        `${appUrl}/login?error=${encodeURIComponent(error?.message || "Gagal menginisiasi Google OAuth.")}`
      );
    }

    return NextResponse.redirect(data.url);
  }

  const isGoogleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return NextResponse.json({
    provider: "google",
    isConfigured: isGoogleConfigured,
    redirectUrl: redirectTo,
    message: isGoogleConfigured
      ? "Google OAuth tersedia dan terkonfigurasi."
      : "Google OAuth siap digunakan melalui Supabase Auth.",
  });
}
