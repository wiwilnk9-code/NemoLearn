"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { clientResetPassword } from "@/lib/auth/client";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const isPassMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage("Token pemulihan kata sandi tidak ditemukan pada tautan ini.");
      return;
    }

    if (!hasMinLength || !hasNumber || !hasLetter) {
      setErrorMessage("Kata sandi baru minimal 8 karakter dan memuat kombinasi huruf serta angka.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak sesuai dengan kata sandi baru.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await clientResetPassword({
        token,
        password,
        confirmPassword,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Gagal mengatur ulang kata sandi.");
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Terjadi gangguan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12 bg-slate-50/50">
      <div className="max-w-md w-full animate-fade-in space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-600/20 mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-headline">
            Atur Ulang Kata Sandi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Buat kata sandi baru yang aman untuk akun NemoLearn Anda
          </p>
        </div>

        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {!token && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="space-y-1">
                <p className="font-semibold">Token Tidak Ditemukan</p>
                <p>
                  Silakan buka tautan pemulihan yang dikirimkan ke email Anda, atau minta tautan baru melalui{" "}
                  <Link href="/forgot-password" className="underline font-semibold">
                    halaman lupa kata sandi
                  </Link>
                  .
                </p>
              </div>
            </div>
          )}

          {isSuccess ? (
            <div className="text-center py-4 space-y-5">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 font-headline">
                  Kata Sandi Berhasil Diperbarui!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Kata sandi baru Anda telah aktif. Silakan masuk menggunakan kata sandi baru Anda.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition shadow-xs"
                >
                  Masuk Sekarang
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Kata Sandi Baru */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={!token}
                    placeholder="Minimal 8 karakter (huruf & angka)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition text-slate-900 bg-white disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

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

              {/* Konfirmasi Kata Sandi Baru */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={!token}
                  placeholder="Ulangi kata sandi baru Anda"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition text-slate-900 bg-white disabled:opacity-50 ${
                    confirmPassword
                      ? isPassMatch
                        ? "border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-500"
                        : "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                      : "border-slate-200 focus:ring-brand-500/20 focus:border-brand-500"
                  }`}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !token}
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan Kata Sandi...
                  </>
                ) : (
                  <>
                    Simpan Kata Sandi Baru
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
                <Link href="/login" className="hover:text-slate-800 transition">
                  ← Kembali ke Halaman Masuk
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
