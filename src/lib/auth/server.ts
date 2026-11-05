/**
 * NemoLearn Server-Side Authentication & Session Management
 * Hanya boleh dieksekusi di Server Component, Route Handler (API), atau getServerSideProps.
 * Melakukan validasi kriptografi token sesi, cookie HTTP-Only, dan otorisasi RBAC.
 */

import { User, UserRole, AdminPermission } from "@/types/user";
import { UserRepository } from "@/lib/db";
import { hasPermission } from "./permissions";
import crypto from "crypto";
import { cookies } from "next/headers";

export const COOKIE_NAME = "nemoquiz_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (dalam detik)

export interface SessionPayload {
  userId: string;
  role: UserRole;
  email: string;
  emailVerified?: boolean;
  expiresAt: number;
}

/**
 * Membuat HMAC SHA-256 signature untuk mencegah manipulasi token sesi oleh client
 */
function signPayload(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

/**
 * Membuat token sesi statis yang ditandatangani secara kriptografis
 */
export function createSessionToken(user: User): string {
  const secret = process.env.AUTH_SECRET || "default-dev-secret-key-32-chars-long";
  const payload: SessionPayload = {
    userId: user.id,
    role: user.role,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = signPayload(data, secret);
  return `${data}.${signature}`;
}

/**
 * Memverifikasi integritas tanda tangan dan waktu kedaluwarsa token sesi
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [data, signature] = token.split(".");
    if (!data || !signature) return null;

    const secret = process.env.AUTH_SECRET || "default-dev-secret-key-32-chars-long";
    const expectedSig = signPayload(data, secret);
    if (signature !== expectedSig) return null;

    const payload: SessionPayload = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    if (Date.now() > payload.expiresAt) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Helper server-side untuk membaca token dari string cookie atau request headers
 */
export function extractTokenFromCookieHeader(cookieHeader?: string | null): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE_NAME) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

/**
 * Mengambil data user yang sedang login dari sesi cookie.
 * Mendukung pemanggilan di:
 * 1. App Router Server Component / Route Handler (melalui next/headers cookies())
 * 2. Pages Router / Standard Request (melalui argumen request atau cookie string)
 */
export async function getCurrentUser(
  requestOrCookies?: Request | { cookies?: any; headers?: any } | string
): Promise<User | null> {
  try {
    let sessionToken: string | null = null;

    // A. Jika cookie string langsung diteruskan
    if (typeof requestOrCookies === "string") {
      sessionToken = requestOrCookies;
    }
    // B. Jika Request object standar diteruskan (Route Handler / Pages Router req)
    else if (requestOrCookies && "headers" in requestOrCookies) {
      const headers = requestOrCookies.headers;
      const cookieHeader =
        typeof headers?.get === "function"
          ? headers.get("cookie")
          : (headers as any)?.cookie;

      // Juga periksa jika req.cookies sudah di-parse (Next.js Pages Router)
      if ((requestOrCookies as any).cookies?.[COOKIE_NAME]) {
        sessionToken = (requestOrCookies as any).cookies[COOKIE_NAME];
      } else {
        sessionToken = extractTokenFromCookieHeader(cookieHeader);
      }
    }
    // C. Default: Gunakan next/headers cookies() di Server Component / Route Handler
    else {
      try {
        const cookieStore = cookies();
        const sessionCookie = cookieStore.get(COOKIE_NAME);
        sessionToken = sessionCookie?.value || null;
      } catch {
        // Fallback jika dipanggil di luar konteks request Next.js (misal test runner)
        sessionToken = null;
      }
    }

    if (!sessionToken) return null;

    const payload = verifySessionToken(sessionToken);
    if (!payload) return null;

    // Verifikasi keberadaan dan keaktifan user langsung di database (server authoritative)
    const user = UserRepository.getById(payload.userId);
    if (!user || user.status !== "active") return null;

    return user;
  } catch (err: any) {
    if (err?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("[ServerAuth] Gagal memvalidasi sesi:", err);
    return null;
  }
}

/**
 * Pengecekan otorisasi server-side (Least-Privilege Enforcement).
 * Mencegah eskalasi hak akses di sisi browser dan memvalidasi role serta granular permissions.
 */
export async function requireAuth(
  allowedRoles?: UserRole[],
  requiredPermission?: AdminPermission,
  requestContext?: Request | { cookies?: any; headers?: any } | string
): Promise<User> {
  const user = await getCurrentUser(requestContext);
  if (!user) {
    throw new Error("UNAUTHORIZED: Pengguna wajib login terlebih dahulu.");
  }

  // Validasi peran (role check)
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN: Anda tidak memiliki hak akses untuk tindakan ini.");
  }

  // Owner memiliki hak akses penuh secara inheren
  if (user.role === "owner") {
    return user;
  }

  // Validasi permission granular untuk role admin
  if (requiredPermission && user.role === "admin") {
    if (!hasPermission(user, requiredPermission)) {
      throw new Error(
        `FORBIDDEN: Akun Anda tidak memiliki izin '${requiredPermission}'. Hubungi Owner platform.`
      );
    }
  }

  return user;
}

/**
 * Validasi otorisasi server-side yang mewajibkan email terverifikasi.
 */
export async function requireVerifiedEmail(
  allowedRoles?: UserRole[],
  requiredPermission?: AdminPermission,
  requestContext?: Request | { cookies?: any; headers?: any } | string
): Promise<User> {
  const user = await requireAuth(allowedRoles, requiredPermission, requestContext);
  if (!user.emailVerified) {
    throw new Error("EMAIL_UNVERIFIED: Alamat email Anda belum diverifikasi. Silakan periksa email aktivasi Anda.");
  }
  return user;
}

export * from "./password";
