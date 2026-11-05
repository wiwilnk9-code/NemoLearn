"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { clientLogin, clientSignInWithGoogle } from "@/lib/auth/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletedMsg, setDeletedMsg] = useState(false);
  const [showQuickFill, setShowQuickFill] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("deleted") === "true") {
        setDeletedMsg(true);
      }
      const err = params.get("error");
      if (err) {
        if (err === "cancelled" || err === "access_denied") {
          setErrorMessage("Autentikasi Google dibatalkan oleh pengguna.");
        } else if (err === "redirect_mismatch" || err.toLowerCase().includes("redirect_uri_mismatch")) {
          setErrorMessage("Konfigurasi URL callback Google OAuth belum sesuai. Pastikan redirect URI Supabase telah ditambahkan di Google Cloud Console.");
        } else if (err === "provider_disabled") {
          setErrorMessage("Google OAuth provider belum diaktifkan di Supabase Dashboard. Hubungi Administrator platform.");
        } else if (err === "suspended") {
          setErrorMessage("Akun ini telah dinonaktifkan (suspended) oleh Administrator.");
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
          setErrorMessage(res.error || "Gagal menghubungkan ke layanan Google OAuth.");
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
      setErrorMessage(err?.message || "Gagal menghubungkan ke layanan Google OAuth.");
      setIsLoading(false);
    }
  };

  const quickFillAccounts = [
    {
      label: "Pelajar (Budi Santoso)",
      email: "budi.santoso@siswa.sma.id",
      pass: "PelajarNemo2026!",
      role: "pelajar",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      label: "Guru SMA (Siti Rahmawati)",
      email: "siti.rahmawati@guru.sma.id",
      pass: "GuruNemo2026!",
      role: "guru",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      label: "Admin NemoQUIZ",
      email: "admin@nemoquiz.edu",
      pass: "AdminNemo2026!",
      role: "admin",
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      label: "Platform Owner",
      email: "owner@nemoquiz.edu",
      pass: "OwnerNemo2026!",
      role: "owner",
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
  ];

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12 bg-slate-50/50">
      <div className="max-w-md w-full animate-fade-in space-y-4">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-600/20 mb-3">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-headline">
            Masuk ke Nemo<span className="text-brand-600">Learn</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Platform Latihan Mandiri &amp; Evaluasi Soal SMA Berbasis AI
          </p>
        </div>

        {/* Main Login Card */}
        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden p-6 sm:p-8">
          {deletedMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="font-medium leading-relaxed">
                Akun Anda beserta data pribadi telah berhasil dihapus secara permanen dari NemoLearn. Seluruh sesi login telah dicabut.
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Alamat Email
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

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Kata Sandi
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  Lupa sandi?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition text-slate-900 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memverifikasi Akun...
                </>
              ) : (
                <>
                  Masuk ke Platform
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">Atau</span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm flex items-center justify-center gap-2.5 transition shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            Masuk dengan Akun Google
          </button>

          {/* Footer Register Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
            Belum memiliki akun NemoLearn?{" "}
            <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
              Daftar sekarang
            </Link>
          </div>
        </Card>

        {/* Quick Fill Dropdown (Reviewer Convenience with Real Passwords) */}
        <div className="rounded-xl border border-slate-200 bg-white/80 backdrop-blur-xs p-3">
          <button
            type="button"
            onClick={() => setShowQuickFill(!showQuickFill)}
            className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-800 transition font-medium"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Isi Cepat Akun Demo (Pengujian Kredensial Riil)
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showQuickFill ? "rotate-180" : ""}`}
            />
          </button>

          {showQuickFill && (
            <div className="mt-3 pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade-in">
              {quickFillAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.pass);
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs transition hover:shadow-xs ${acc.color}`}
                >
                  <p className="font-semibold">{acc.label}</p>
                  <p className="text-[11px] opacity-80 font-mono truncate">{acc.email}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
