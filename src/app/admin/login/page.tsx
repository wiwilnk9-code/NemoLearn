"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Crown,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { clientLogin } from "@/lib/auth/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await clientLogin({
        email: email.trim().toLowerCase(),
        password,
      });

      if (!res.success || !res.user) {
        throw new Error(res.error || "Gagal memproses autentikasi sesi admin.");
      }

      if (res.user.role !== "admin" && res.user.role !== "owner") {
        throw new Error(
          "Akun ini bukan administrator atau owner resmi (Role: " +
            res.user.role +
            "). Akses ditolak oleh firewall backend."
        );
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan saat masuk.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (targetEmail: string, targetPass: string) => {
    setEmail(targetEmail);
    setPassword(targetPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#EEF3F9] flex flex-col justify-center items-center p-4 sm:p-6 font-sans antialiased text-[#101828]">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0B559F] text-white shadow-md shadow-[#0B559F]/20 mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] text-[11px] font-mono uppercase font-semibold mb-2">
            <span>SECURE GATEWAY</span>
            <span>•</span>
            <span>AP-SOUTHEAST-1</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline text-[#101828] tracking-tight">
            NemoLearn Governance
          </h1>
          <p className="text-sm text-[#475467] mt-1 max-w-sm mx-auto">
            Portal Autentikasi Khusus Pemilik &amp; Administrator Platform
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[#FEE4E2] border border-[#FECDCA] text-[#D92D20] text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {/* Main Login Card */}
        <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-2xl overflow-hidden p-6 sm:p-8">
          <form onSubmit={handleFormLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#344054] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#667085]" />
                Alamat Email Administratif
              </label>
              <input
                type="email"
                required
                placeholder="owner@nemoquiz.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D0D5DD] text-sm focus:outline-none focus:ring-2 focus:ring-[#0B559F]/20 focus:border-[#0B559F] transition text-[#101828] bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#344054] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#667085]" />
                Kata Sandi Otoritas
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#D0D5DD] text-sm focus:outline-none focus:ring-2 focus:ring-[#0B559F]/20 focus:border-[#0B559F] transition text-[#101828] bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#101828] transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-[#0B559F] hover:bg-[#094582] text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memverifikasi Otorisasi Sesi...
                </>
              ) : (
                <>
                  Masuk ke Governance Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Fill Preset for Reviewers */}
          <div className="mt-6 pt-5 border-t border-[#E2E8F0] space-y-2">
            <span className="text-[11px] font-mono uppercase text-[#667085] tracking-wider block font-semibold">
              Kredensial Penguji Resmi (Auto-Fill):
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("owner@nemoquiz.edu", "OwnerNemo2026!")}
                className="p-2.5 rounded-xl border border-[#D6BBFB] bg-[#F9F5FF] text-left hover:bg-[#F4EBFF] transition"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#53389E]">
                  <Crown className="w-3.5 h-3.5" />
                  Platform Owner
                </div>
                <div className="text-[10px] text-[#667085] font-mono mt-0.5 truncate">
                  owner@nemoquiz.edu
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("admin@nemoquiz.edu", "AdminNemo2026!")}
                className="p-2.5 rounded-xl border border-[#B2DDFF] bg-[#EFF8FF] text-left hover:bg-[#D1E9FF] transition"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#175CD3]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Administrator
                </div>
                <div className="text-[10px] text-[#667085] font-mono mt-0.5 truncate">
                  admin@nemoquiz.edu
                </div>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E2E8F0] text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#475467] hover:text-[#101828] transition font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Beranda Siswa
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
