/**
 * NemoLearn Client-Side Authentication Helpers
 * Dikhususkan untuk komponen frontend ("use client").
 * 100% bebas dari next/headers, Node.js crypto, fs, dan modul server-only.
 */

import { User } from "@/types/user";
export * from "./permissions";

/**
 * Mengambil profil user yang sedang aktif dari API session endpoint.
 */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user || null;
  } catch (err) {
    console.error("[ClientAuth] Gagal memuat profil user:", err);
    return null;
  }
}

export interface ClientLoginCredentials {
  email?: string;
  password?: string;
  userId?: string;
}

/**
 * Melakukan login akun secara client-side via /api/auth/login.
 * Mendukung format email & password riil, serta userId (backward compatibility).
 */
export async function clientLogin(
  credentials: string | ClientLoginCredentials
): Promise<{ success: boolean; user?: User; error?: string; emailVerified?: boolean }> {
  try {
    const payload = typeof credentials === "string" ? { userId: credentials } : credentials;
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data?.error || "Gagal melakukan autentikasi login." };
    }
    return { success: true, user: data?.user, emailVerified: data?.emailVerified };
  } catch (err: any) {
    return { success: false, error: err?.message || "Terjadi kesalahan jaringan." };
  }
}

export interface ClientRegisterData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  parentalConsent?: boolean;
  school?: string;
  gender?: "laki-laki" | "perempuan" | "rahasia";
}

/**
 * Mendaftarkan akun pelajar baru secara mandiri.
 */
export async function clientRegister(
  data: ClientRegisterData
): Promise<{ success: boolean; message?: string; error?: string; user?: User; verificationToken?: string }> {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: result?.error || "Pendaftaran gagal." };
    }
    return {
      success: true,
      message: result?.message,
      user: result?.user,
      verificationToken: result?.verificationToken,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Terjadi kesalahan jaringan saat mendaftar." };
  }
}

/**
 * Meminta tautan pemulihan kata sandi (Forgot Password).
 */
export async function clientForgotPassword(
  email: string
): Promise<{ success: boolean; message?: string; error?: string; resetToken?: string }> {
  try {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: result?.error || "Gagal memproses permohonan pemulihan." };
    }
    return { success: true, message: result?.message, resetToken: result?.resetToken };
  } catch (err: any) {
    return { success: false, error: err?.message || "Terjadi kesalahan jaringan." };
  }
}

/**
 * Mengubah kata sandi menggunakan token pemulihan (Reset Password).
 */
export async function clientResetPassword(
  params: { token: string; password: string; confirmPassword: string }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: result?.error || "Gagal mengatur ulang kata sandi." };
    }
    return { success: true, message: result?.message };
  } catch (err: any) {
    return { success: false, error: err?.message || "Terjadi kesalahan jaringan." };
  }
}

/**
 * Memverifikasi alamat email via token.
 */
export async function clientVerifyEmail(
  token: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: "GET",
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: result?.error || "Verifikasi email gagal." };
    }
    return { success: true, message: result?.message };
  } catch (err: any) {
    return { success: false, error: err?.message || "Terjadi kesalahan jaringan." };
  }
}

/**
 * Melakukan logout akun secara client-side via /api/auth/logout.
 */
export async function clientLogout(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch (err) {
    console.error("[ClientAuth] Gagal melakukan logout:", err);
    return false;
  }
}
