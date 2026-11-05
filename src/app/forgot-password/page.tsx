"use client";

import React, { useState } from "react";
import Link from "next/link";
import { KeyRound, Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { clientForgotPassword } from "@/lib/auth/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ message: string; resetToken?: string } | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage("Silakan masukkan alamat email akun Anda.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await clientForgotPassword(email.trim().toLowerCase());
      if (!res.success) {
        setErrorMessage(res.error || "Gagal memproses permohonan pemulihan kata sandi.");
      } else {
        setSuccessInfo({
          message:
            res.message ||
            "Jika alamat email terdaftar, instruksi pemulihan telah dikirimkan ke kotak masuk Anda.",
          resetToken: res.resetToken,
        });
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
          <div className="w-14 h-14 rounded-2xl bg-orange-600 text-white flex items-center justify-center mx-auto shadow-md shadow-orange-600/20 mb-3">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-headline">
            Lupa Kata Sandi?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Masukkan email terdaftar untuk menerima tautan pemulihan kata sandi
          </p>
        </div>

        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {successInfo ? (
            <div className="text-center py-4 space-y-5">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 font-headline">
                  Permintaan Terkirim
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {successInfo.message}
                </p>
              </div>

              {successInfo.resetToken && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 text-left space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    Mode Pengujian / Akses Cepat:
                  </p>
                  <p className="text-[11px]">
                    Token pemulihan Anda telah dibuat. Anda dapat langsung mengatur ulang kata sandi dengan tombol di bawah:
                  </p>
                  <div className="pt-2">
                    <Link
                      href={`/reset-password?token=${encodeURIComponent(successInfo.resetToken)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white font-medium text-xs hover:bg-amber-700 transition"
                    >
                      Buka Form Atur Ulang Sandi
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100">
                <Link
                  href="/login"
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
                >
                  ← Kembali ke Halaman Masuk
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Alamat Email Akun
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Kirim Instruksi Pemulihan
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
                Ingat kata sandi Anda?{" "}
                <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
                  Masuk di sini
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
