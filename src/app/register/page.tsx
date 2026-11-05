"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
  School,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { clientRegister } from "@/lib/auth/client";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeParentalConsent, setAgreeParentalConsent] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    message: string;
    token?: string;
  } | null>(null);

  // Evaluasi kekuatan kata sandi secara interaktif
  const hasMinLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const isPassMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!displayName.trim()) {
      setErrorMessage("Nama lengkap wajib diisi.");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Alamat email wajib diisi.");
      return;
    }
    if (!hasMinLength || !hasNumber || !hasLetter) {
      setErrorMessage("Kata sandi harus minimal 8 karakter dan memuat huruf serta angka.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    if (!agreeTerms || !agreePrivacy) {
      setErrorMessage("Anda wajib menyetujui Ketentuan Layanan dan Kebijakan Privasi.");
      return;
    }
    if (!agreeParentalConsent) {
      setErrorMessage("Anda wajib mengonfirmasi batas usia / izin orang tua untuk perlindungan data pelajar.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await clientRegister({
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        school: school.trim() || undefined,
        agreeTerms,
        agreePrivacy,
        parentalConsent: agreeParentalConsent,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Pendaftaran gagal. Silakan coba lagi.");
      } else {
        setSuccessData({
          message: res.message || "Pendaftaran berhasil! Silakan periksa email Anda.",
          token: res.verificationToken,
        });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Terjadi gangguan jaringan saat mendaftar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12 bg-slate-50/50">
      <div className="max-w-lg w-full animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-600/20 mb-3">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-headline">
            Daftar Akun Nemo<span className="text-brand-600">Learn</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Mulai latihan soal kurikulum SMA adaptif &amp; evaluasi IRT gratis
          </p>
        </div>

        {/* Success State Card */}
        {successData ? (
          <Card className="bg-white border-brand-200 shadow-sm rounded-2xl p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 font-headline">
                Pendaftaran Berhasil!
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                {successData.message}
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 text-left space-y-1 mt-4">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-brand-600" />
                  Langkah Verifikasi Email:
                </p>
                <p>
                  1. Periksa kotak masuk pada email <strong>{email}</strong>.
                </p>
                <p>
                  2. Klik tautan verifikasi atau gunakan tombol di bawah untuk mengaktifkan akun secara langsung.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {successData.token && (
                <Link
                  href={`/verify-email?token=${encodeURIComponent(successData.token)}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 transition shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Verifikasi Sekarang
                </Link>
              )}
              <Link
                href="/login"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-medium text-sm hover:bg-slate-200 transition"
              >
                Halaman Masuk
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Card>
        ) : (
          /* Registration Form Card */
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden p-6 sm:p-8">
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nama Lengkap */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  Nama Lengkap Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition text-slate-900 bg-white"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Alamat Email Aktif <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="nama@siswa.sma.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition text-slate-900 bg-white"
                />
              </div>

              {/* Asal Sekolah (Opsional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-slate-400" />
                  Asal Sekolah <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SMAN 1 Jakarta"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition text-slate-900 bg-white"
                />
              </div>

              {/* Kata Sandi */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Minimal 8 karakter (huruf & angka)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition text-slate-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength hints */}
                {password && (
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                    <span
                      className={`flex items-center gap-1 ${
                        hasMinLength ? "text-emerald-600 font-medium" : "text-slate-400"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Min. 8 karakter
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        hasNumber && hasLetter ? "text-emerald-600 font-medium" : "text-slate-400"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Huruf &amp; Angka
                    </span>
                  </div>
                )}
              </div>

              {/* Konfirmasi Kata Sandi */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Ulangi kata sandi Anda"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition text-slate-900 bg-white ${
                    confirmPassword
                      ? isPassMatch
                        ? "border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-500"
                        : "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                      : "border-slate-200 focus:ring-brand-500/20 focus:border-brand-500"
                  }`}
                />
                {confirmPassword && !isPassMatch && (
                  <p className="text-[11px] text-rose-500 font-medium">
                    Kata sandi tidak cocok.
                  </p>
                )}
              </div>

              {/* ToS & Privacy Checkboxes */}
              <div className="pt-2 space-y-2.5 text-xs text-slate-600">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>
                    Saya menyetujui{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-brand-600 font-semibold hover:underline"
                    >
                      Ketentuan Layanan
                    </Link>{" "}
                    NemoLearn dan berjanji menggunakan platform secara jujur.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>
                    Saya menyetujui{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-brand-600 font-semibold hover:underline"
                    >
                      Kebijakan Privasi
                    </Link>{" "}
                    terkait pemrosesan data belajar & transparansi penggunaan AI pihak ketiga.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeParentalConsent}
                    onChange={(e) => setAgreeParentalConsent(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-[11px] text-slate-500 leading-snug">
                    <strong className="text-slate-700">Perlindungan Pelajar:</strong> Saya menyatakan berusia minimal 18 tahun, atau telah memperoleh izin/bimbingan dari orang tua, wali, atau pihak sekolah/guru yang berwenang.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mendaftarkan Akun...
                    </>
                  ) : (
                    <>
                      Daftar Sekarang
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Footer Links */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
              Sudah memiliki akun NemoLearn?{" "}
              <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
                Masuk di sini
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
