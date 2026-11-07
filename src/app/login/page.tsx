"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Target,
  ShieldCheck,
  Check,
  TrendingUp,
} from "lucide-react";
import { MathRenderer } from "@/components/MathRenderer";
import { clientLogin, clientSignInWithGoogle } from "@/lib/auth/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletedMsg, setDeletedMsg] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("deleted") === "true") {
        setDeletedMsg(true);
      }
      const err = params.get("error");
      if (err) {
        if (err === "cancelled" || err === "access_denied") {
          setErrorMessage("Autentikasi Google dibatalkan oleh pengguna.");
        } else if (
          err === "redirect_mismatch" ||
          err.toLowerCase().includes("redirect_uri_mismatch")
        ) {
          setErrorMessage(
            "Konfigurasi URL callback Google OAuth belum sesuai. Pastikan redirect URI Supabase telah ditambahkan di Google Cloud Console."
          );
        } else if (err === "provider_disabled") {
          setErrorMessage(
            "Google OAuth provider belum diaktifkan di Supabase Dashboard. Hubungi Administrator platform."
          );
        } else if (err === "suspended") {
          setErrorMessage(
            "Akun ini telah dinonaktifkan (suspended) oleh Administrator."
          );
        } else {
          setErrorMessage(decodeURIComponent(err));
        }
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Silakan masukkan alamat email dan kata sandi Anda.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await clientLogin({
        email: email.trim().toLowerCase(),
        password,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Gagal melakukan autentikasi login.");
      } else {
        // Arahkan ke dashboard sesuai role
        const role = res.user?.role;
        if (role === "admin" || role === "owner") {
          router.push("/admin");
        } else {
          router.push("/");
        }
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await clientSignInWithGoogle();
      if (!res.success) {
        const msg = res.error || "";
        if (
          msg.toLowerCase().includes("not enabled") ||
          msg.toLowerCase().includes("unsupported provider") ||
          msg.toLowerCase().includes("validation_failed")
        ) {
          setErrorMessage(
            "Google OAuth belum diaktifkan di Supabase Dashboard. Silakan hubungi Administrator atau gunakan login Email & Kata Sandi."
          );
        } else {
          setErrorMessage(
            res.error || "Gagal menghubungkan ke layanan Google OAuth."
          );
        }
        setIsLoading(false);
        return;
      }

      if (res.url) {
        window.location.href = res.url;
      } else {
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Gagal menghubungkan ke layanan Google OAuth."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#0F172A] flex flex-col font-sans antialiased selection:bg-[#DCFCE7] selection:text-[#15803D]">
      {/* 1. Minimal Editorial Brand Header */}
      <header className="w-full bg-[#FAF9F5]/90 backdrop-blur-md border-b border-[#E2E0D8]/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo NemoLearn */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#15803D] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#0F172A]">
                Nemo<span className="text-[#15803D]">Learn</span>
              </span>
              <span className="text-[10px] font-semibold text-[#64748B] -mt-1 hidden sm:inline">
                Ruang Latihan Mandiri SMA
              </span>
            </div>
          </Link>

          {/* Right Header Navigation Links */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span>Kurikulum Merdeka &amp; SNBT Terpadu</span>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-[#475569] hover:text-[#0F172A] hover:bg-black/5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Body Split Screen (Desktop 2 Columns / Mobile Stack) */}
      <div className="flex-1 flex items-center py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* KOLOM KIRI (Brand Authority & Live Active Study Session Preview) */}
          <section className="lg:col-span-7 flex flex-col justify-center space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0FDF4] text-[#15803D] w-fit border border-[#BBF7D0] shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Akses Belajar Mandiri Terstruktur
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#0F172A] leading-tight">
                Selamat Datang Kembali di{" "}
                <span className="text-[#15803D]">Ruang Belajar.</span>
              </h1>
              <p className="text-sm sm:text-base text-[#475569] max-w-xl leading-relaxed">
                Lanjutkan latihan berbasis penalaran logika, analisis butir adaptif IRT 3-PL, dan penguasaan konsep matematika &amp; sains nasional tanpa distraksi.
              </p>
            </div>

            {/* Mockup Live Study Session Card */}
            <div className="bg-white rounded-2xl border border-[#E2E0D8] p-5 sm:p-6 shadow-xs space-y-4 max-w-xl">
              {/* Profile Bar */}
              <div className="flex items-start justify-between border-b border-[#F3F4EE] pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#15803D] font-bold text-sm flex items-center justify-center border border-[#BBF7D0]">
                    AR
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#0F172A]">Ahmad Rizky</h3>
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF9F5] border border-[#E2E0D8] text-[10px] font-semibold text-[#475569]">
                        Kelas 12 IPA
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#EA580C] font-semibold mt-0.5">
                      <Target className="w-3.5 h-3.5" />
                      <span>FK Universitas Indonesia &bull; Target Skor IRT 720</span>
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#15803D] bg-[#F0FDF4] px-2.5 py-1 rounded-md border border-[#BBF7D0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                  Sesi Terakhir
                </span>
              </div>

              {/* KaTeX Formula Box */}
              <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E2E0D8] space-y-2">
                <div className="flex justify-between items-center text-xs text-[#64748B]">
                  <span className="font-semibold text-[#0F172A]">
                    Penalaran Matematika &bull; Turunan Implisit
                  </span>
                  <span className="font-mono font-bold text-[#15803D]">Soal #8</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#E2E0D8] text-center overflow-x-auto text-[#0F172A]">
                  <MathRenderer text="\\[ f'(x) = \lim_{\Delta x \to 0} \frac{x^3 + 3x^2\Delta x - x^3}{\Delta x} = 3x^2 \\]" />
                </div>
                <div className="flex items-center justify-between text-xs text-[#475569] pt-1">
                  <span>Status: <strong className="text-[#0F172A]">8/10 Soal Terselesaikan</strong></span>
                  <span className="text-[#15803D] font-bold">Akurasi 87,5%</span>
                </div>
                <div className="w-full bg-[#E2E0D8] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#15803D] h-full rounded-full w-[87.5%]" />
                </div>
              </div>

              {/* Badges Strip */}
              <div className="flex flex-wrap gap-2 pt-0.5 text-xs text-[#475569]">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#FAF9F5] rounded-lg border border-[#E2E0D8]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                  <span>15.000+ Pelajar Aktif</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#FAF9F5] rounded-lg border border-[#E2E0D8]">
                  <TrendingUp className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>Algoritma 3-PL IRT</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#FAF9F5] rounded-lg border border-[#E2E0D8]">
                  <Check className="w-3.5 h-3.5 text-[#15803D]" />
                  <span>Bank Soal KaTeX</span>
                </div>
              </div>
            </div>

            {/* Student Quote */}
            <p className="text-xs text-[#64748B] italic max-w-xl">
              &ldquo;Penjelasan berbasis first-principles di NemoLearn mengubah skor IRT UTBK saya dari 560 ke 745 hanya dalam 8 minggu.&rdquo;
              <span className="not-italic font-bold text-[#0F172A]"> &mdash; Nabila A., STEI ITB 2024</span>
            </p>
          </section>

          {/* KOLOM KANAN (Focused Authentication Card) */}
          <section className="lg:col-span-5 w-full">
            <div className="bg-white rounded-2xl border border-[#E2E0D8] shadow-sm p-6 sm:p-8 md:p-9 relative">
              {/* Form Title & Subtitle */}
              <div className="space-y-1.5 mb-6">
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                  Masuk ke Akun Anda
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B]">
                  Masukkan email terdaftar untuk melanjutkan simulasi dan target belajarmu hari ini.
                </p>
              </div>

              {/* Deleted Confirmation Banner */}
              {deletedMsg && (
                <div className="mb-5 p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-xs flex items-start gap-2.5 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#15803D]" />
                  <span className="font-medium leading-relaxed">
                    Akun Anda beserta data pribadi telah berhasil dihapus secara permanen dari NemoLearn. Seluruh sesi login telah dicabut.
                  </span>
                </div>
              )}

              {/* Error Alert Box */}
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs flex items-start gap-2.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
                  <span className="font-medium leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Authentication Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-bold text-[#0F172A]"
                  >
                    Alamat Email Siswa / Sekolah
                  </label>
                  <div className="relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="login-email"
                      type="email"
                      required
                      placeholder="nama@siswa.sma.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-[#CBD5E1] rounded-xl text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#15803D] focus:ring-2 focus:ring-[#15803D]/20 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Password Input with Visibility Toggle */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-bold text-[#0F172A]"
                    >
                      Kata Sandi
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-[#15803D] hover:text-[#166534] font-semibold hover:underline"
                    >
                      Lupa sandi?
                    </Link>
                  </div>
                  <div className="relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-white border border-[#CBD5E1] rounded-xl text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#15803D] focus:ring-2 focus:ring-[#15803D]/20 transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#94A3B8] hover:text-[#0F172A] transition-colors"
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#CBD5E1] text-[#15803D] focus:ring-[#15803D]/20 cursor-pointer"
                    />
                    <span className="text-xs text-[#475569]">Ingat saya selama 30 hari</span>
                  </label>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 sm:h-12 bg-[#15803D] hover:bg-[#166534] disabled:bg-[#94A3B8] text-white font-bold text-sm rounded-xl shadow-xs transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi Akun...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Platform</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-5 sm:my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E2E0D8]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-[#94A3B8] font-semibold">Atau</span>
                </div>
              </div>

              {/* Official Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#FAF9F5] text-[#0F172A] font-semibold text-xs sm:text-sm shadow-2xs flex items-center justify-center gap-3 transition-colors active:scale-[0.98] cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Masuk dengan Akun Google</span>
              </button>

              {/* Registration Link */}
              <div className="mt-6 pt-5 border-t border-[#F3F4EE] text-center">
                <p className="text-xs text-[#64748B]">
                  Belum memiliki akun NemoLearn?{" "}
                  <Link
                    href="/register"
                    className="font-bold text-[#15803D] hover:underline inline-flex items-center gap-1.5 ml-1"
                  >
                    <span>Daftar sekarang</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold border border-[#BBF7D0]">
                      Gratis
                    </span>
                  </Link>
                </p>
              </div>
            </div>

            {/* Security Guarantee Micro-badge */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[#64748B] text-xs">
              <ShieldCheck className="w-4 h-4 text-[#15803D]" />
              <span>Enkripsi Aman TLS 1.3 &bull; Data Terlindungi</span>
            </div>
          </section>
        </div>
      </div>

      {/* 3. Editorial Footer */}
      <footer className="bg-[#F4F4F0] border-t border-[#E2E0D8] py-6 text-[#64748B] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>
            &copy; 2026 NemoLearn Indonesia. Platform Latihan Soal &amp; Evaluasi Terpadu SMA.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/terms" className="hover:text-[#15803D] transition-colors">
              Ketentuan
            </Link>
            <Link href="/privacy" className="hover:text-[#15803D] transition-colors">
              Privasi
            </Link>
            <Link href="/help" className="hover:text-[#15803D] transition-colors">
              Pusat Bantuan
            </Link>
            <span className="text-[#CBD5E1]">&bull;</span>
            <span className="flex items-center gap-1.5 text-[#0F172A] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              Jakarta-1: Normal
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
