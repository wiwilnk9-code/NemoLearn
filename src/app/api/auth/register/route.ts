import { NextResponse } from "next/server";
import { UserRepository, SystemLogRepository } from "@/lib/db";
import {
  hashPassword,
  validatePasswordStrength,
  generateCryptoToken,
  sanitizeUserOutput,
} from "@/lib/auth/password";
import { User } from "@/types/user";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      displayName,
      email,
      password,
      confirmPassword,
      agreeTerms,
      agreePrivacy,
      school,
      gender,
    } = body;

    // 1. Validasi Keberadaan Input Wajib
    if (!displayName || typeof displayName !== "string" || displayName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Nama lengkap wajib diisi minimal 2 karakter." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Alamat email wajib diisi." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, error: "Format alamat email tidak valid." },
        { status: 400 }
      );
    }

    // 2. Validasi Kata Sandi & Konfirmasi
    if (!password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Kata sandi dan konfirmasi kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Konfirmasi kata sandi tidak cocok dengan kata sandi." },
        { status: 400 }
      );
    }

    const passCheck = validatePasswordStrength(password);
    if (!passCheck.isValid) {
      return NextResponse.json(
        { success: false, error: passCheck.message || "Kata sandi tidak memenuhi kriteria keamanan." },
        { status: 400 }
      );
    }

    // 3. Validasi Persetujuan Ketentuan Layanan (ToS) & Kebijakan Privasi
    if (agreeTerms !== true) {
      return NextResponse.json(
        { success: false, error: "Anda wajib menyetujui Ketentuan Layanan (Terms of Service)." },
        { status: 400 }
      );
    }

    if (agreePrivacy !== true) {
      return NextResponse.json(
        { success: false, error: "Anda wajib menyetujui Kebijakan Privasi (Privacy Policy)." },
        { status: 400 }
      );
    }

    // 4. Cek Keberadaan Email di Database (Anti-Duplikasi)
    const existingUser = UserRepository.getByEmail(trimmedEmail);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Alamat email ini sudah terdaftar. Silakan masuk atau gunakan email lain." },
        { status: 409 }
      );
    }

    // 5. Aturan Keamanan Peran: Registrasi publik SELALU menghasilkan role 'pelajar' (Student)
    // Mencegah privilege escalation (frontend dilarang memilih admin/owner)
    const secureRole = "pelajar";

    // 6. Registrasi Supabase Auth (signUp)
    let supabaseAuthId: string | undefined;
    if (process.env.NODE_ENV !== "test") {
      try {
        const { data: sbAuth, error: sbError } = await supabaseServer.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              display_name: displayName.trim(),
              role: secureRole,
              school: school ? String(school).trim() : null,
              gender: gender || "rahasia",
            },
          },
        });

        if (sbError) {
          const errMsg = sbError.message?.toLowerCase() || "";
          if (errMsg.includes("already registered") || errMsg.includes("user already exists") || sbError.status === 422) {
            return NextResponse.json(
              { success: false, error: "Alamat email ini sudah terdaftar. Silakan masuk atau gunakan email lain." },
              { status: 409 }
            );
          }
          console.warn("[Register] Supabase signUp warning:", sbError.message);
        } else if (sbAuth?.user) {
          supabaseAuthId = sbAuth.user.id;
        }
      } catch (sbErr: any) {
        console.warn("[Register] Supabase signUp exception:", sbErr?.message || sbErr);
      }
    }

    const userId = supabaseAuthId || `usr_reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const verificationToken = `tok_verif_${generateCryptoToken(24)}`;
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 jam
    const hashedPassword = hashPassword(password);
    const nowIso = new Date().toISOString();

    const newUser: User = {
      id: userId,
      authProviderId: supabaseAuthId,
      email: trimmedEmail,
      displayName: displayName.trim(),
      role: secureRole,
      school: school ? String(school).trim() : undefined,
      gender: gender === "laki-laki" || gender === "perempuan" ? gender : "rahasia",
      createdAt: nowIso,
      status: "active",
      verificationStatus: "unverified",
      emailVerified: false,
      verificationToken,
      verificationTokenExpires: verificationExpires,
      passwordHash: hashedPassword,
      tosAcceptedAt: nowIso,
      privacyAcceptedAt: nowIso,
      tosVersion: "2026.11",
      privacyVersion: "2026.11",
      parentalConsentConfirmed: Boolean(body.parentalConsent),
      authProvider: "email",
    };

    UserRepository.create(newUser);

    // Sinkronkan peran default ke app_metadata Supabase Auth
    if (process.env.NODE_ENV !== "test" && supabaseAuthId) {
      try {
        await supabaseServer.auth.admin.updateUserById(supabaseAuthId, {
          app_metadata: { role: secureRole },
        });
      } catch {}
    }

    // 7. Rekam Jejak Audit Sistem
    SystemLogRepository.log({
      level: "info",
      action: "USER_REGISTER",
      actorId: userId,
      actorEmail: trimmedEmail,
      actorName: displayName.trim(),
      actorRole: secureRole,
      targetType: "user",
      targetId: userId,
      details: `Pendaftaran akun mandiri baru (${trimmedEmail}) dengan peran '${secureRole}'. Menunggu verifikasi email.`,
      status: "SUKSES",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pendaftaran berhasil! Silakan periksa email Anda untuk memverifikasi akun.",
        user: sanitizeUserOutput(newUser),
        verificationToken: process.env.NODE_ENV === "production" ? undefined : verificationToken,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[/api/auth/register Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memproses pendaftaran pengguna." },
      { status: 500 }
    );
  }
}
