import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isDirect = searchParams.get("action") === "signin";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nemolearn.vercel.app";
  const redirectTo = `${appUrl}/auth/callback`;

  if (isDirect) {
    const cookieQueue: Array<{ name: string; value: string; options: any }> = [];
    const supabase = createServerSupabaseClient({
      getAll() {
        const cookieHeader = req.headers.get("cookie");
        if (!cookieHeader) return [];
        return cookieHeader
          .split(";")
          .map((part) => {
            const [rawKey, ...rawVal] = part.trim().split("=");
            return {
              name: decodeURIComponent(rawKey || ""),
              value: decodeURIComponent(rawVal.join("=") || ""),
            };
          })
          .filter((c) => Boolean(c.name));
      },
      setAll(cookiesToSet) {
        cookieQueue.push(...cookiesToSet);
      },
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        scopes: "openid email profile",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error || !data.url) {
      return NextResponse.redirect(
        `${appUrl}/login?error=${encodeURIComponent(error?.message || "Gagal menginisiasi Google OAuth.")}`
      );
    }

    const res = NextResponse.redirect(data.url);
    cookieQueue.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, options);
    });
    return res;
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
