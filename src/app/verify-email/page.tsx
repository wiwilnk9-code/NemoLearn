"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Mail,
  ArrowRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { clientVerifyEmail } from "@/lib/auth/client";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [tokenInput, setTokenInput] = useState(tokenFromUrl);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  // State untuk pengiriman ulang
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (tokenFromUrl) {
      verifyToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const verifyToken = async (tok: string) => {
    if (!tok.trim()) return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await clientVerifyEmail(tok.trim());
      if (res.success) {
        setStatus("success");
        setMessage(res.message || "Email Anda berhasil diverifikasi!");
      } else {
        setStatus("error");
        setMessage(res.error || "Token verifikasi tidak valid atau telah kedaluwarsa.");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Terjadi kesalahan jaringan saat memverifikasi.");
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setResendLoading(true);
    setResendMessage(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resendEmail: resendEmail.trim() }),
      });
      const data = await res.json();
      setResendMessage(data.message || "Tautan baru telah dikirim jika email terdaftar.");
    } catch {
      setResendMessage("Gagal mengirim ulang email. Silakan coba lagi.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12 bg-slate-50/50">
      <div className="max-w-md w-full animate-fade-in space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-600/20 mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-headline">
            Verifikasi Email
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Konfirmasikan alamat email Anda untuk membuka seluruh fitur NemoLearn
          </p>
        </div>

        {/* State Card */}
        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8 space-y-5">
          {status === "loading" && (
            <div className="text-center py-6 space-y-3">
              <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-800">
                Memvalidasi Token Verifikasi...
              </p>
              <p className="text-xs text-slate-500">Mohon tunggu sebentar.</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 font-headline">
                  Email Berhasil Diverifikasi!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {message}
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
          )}

          {status === "error" && (
            <div className="py-2 space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="font-medium leading-relaxed">{message}</span>
              </div>

              {/* Form Input Manual Token */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-700">
                  Masukkan Token Verifikasi Manual:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="tok_verif_..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-mono"
                  />
                  <Button
                    onClick={() => verifyToken(tokenInput)}
                    className="bg-brand-600 hover:bg-brand-700 text-white text-xs px-3 rounded-xl"
                  >
                    Verifikasi
                  </Button>
                </div>
              </div>
            </div>
          )}

          {status === "idle" && !tokenFromUrl && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs space-y-1">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-brand-600" />
                  Cek Kotak Masuk Email Anda
                </p>
                <p className="text-slate-500">
                  Tautan aktivasi telah dikirimkan saat Anda mendaftar. Jika Anda memiliki kode token, masukkan di bawah ini:
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">
                  Kode Token Verifikasi:
                </label>
                <input
                  type="text"
                  placeholder="tok_verif_..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-mono"
                />
                <Button
                  onClick={() => verifyToken(tokenInput)}
                  disabled={!tokenInput.trim()}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm py-2 rounded-xl mt-2"
                >
                  Verifikasi Akun
                </Button>
              </div>
            </div>
          )}

          {/* Resend Verification Section */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              Tidak menerima email verifikasi?
            </h4>

            {resendMessage && (
              <p className="text-xs text-brand-700 bg-brand-50 p-2.5 rounded-lg border border-brand-200 font-medium">
                {resendMessage}
              </p>
            )}

            <form onSubmit={handleResend} className="flex gap-2">
              <input
                type="email"
                placeholder="Masukkan email Anda"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-900 bg-white"
              />
              <button
                type="submit"
                disabled={resendLoading || !resendEmail.trim()}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition disabled:opacity-50"
              >
                {resendLoading ? "Mengirim..." : "Kirim Ulang"}
              </button>
            </form>
          </div>

          <div className="pt-2 text-center text-xs text-slate-500">
            <Link href="/login" className="hover:text-slate-800 transition">
              ← Kembali ke Halaman Masuk
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
