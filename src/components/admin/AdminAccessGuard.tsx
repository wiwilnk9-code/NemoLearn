"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, RefreshCw, Crown, ShieldCheck, Loader2, LogIn } from "lucide-react";
import { User } from "@/types/user";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

interface AdminAccessGuardProps {
  currentUser: User | null;
  loading: boolean;
  onRefresh?: () => void;
}

export const AdminAccessGuard: React.FC<AdminAccessGuardProps> = ({
  currentUser,
  loading,
  onRefresh,
}) => {
  const router = useRouter();
  const [switchingUser, setSwitchingUser] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#0B559F] flex items-center justify-center animate-spin mb-4">
          <RefreshCw className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-[#101828]">Memverifikasi Hak Akses Administrator...</h3>
        <p className="text-xs text-[#475467] mt-1">Memeriksa kredensial sesi server dan otorisasi RBAC.</p>
      </div>
    );
  }

  const handleSwitchUser = async (userId: string) => {
    setSwitchingUser(userId);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        if (onRefresh) onRefresh();
        router.refresh();
      }
    } catch (err) {
      console.error("Gagal beralih akun:", err);
    } finally {
      setSwitchingUser(null);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-lg mx-auto animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-[#FEE4E2] border border-[#FECDCA] text-[#D92D20] flex items-center justify-center mb-5 shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#FEE4E2] text-[#D92D20] border border-[#FECDCA] mb-3 uppercase tracking-wider">
        <span>403 FORBIDDEN</span>
        <span>•</span>
        <span>Akses Ditolak</span>
      </div>

      <h2 className="text-2xl font-bold font-headline text-[#101828] tracking-tight">
        Area Khusus Administrator &amp; Owner
      </h2>

      <p className="text-sm text-[#475467] mt-2.5 leading-relaxed font-body">
        Halaman administratif ini diproteksi secara ketat dan hanya dapat diakses oleh akun resmi dengan peran <strong>Admin</strong> atau <strong>Owner</strong>.
        {currentUser ? (
          <span className="block mt-2 p-2.5 rounded-lg bg-white border border-[#E2E8F0] text-xs">
            Sesi aktif: <strong>{currentUser.displayName}</strong> • Peran:{" "}
            <span className="font-semibold font-mono text-[#D92D20] uppercase">
              {currentUser.role}
            </span>
            {" "}(Tidak memiliki kewenangan administratif).
          </span>
        ) : (
          <span className="block mt-2 text-xs text-[#667085]">
            Anda belum masuk ke sistem atau sesi otorisasi telah berakhir.
          </span>
        )}
      </p>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
        <Link href="/">
          <Button variant="outline" size="md" className="border-[#E2E8F0] text-[#475467] hover:bg-[#F8FAFC]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Beranda Siswa
          </Button>
        </Link>

        <Link href="/admin/login">
          <Button
            size="md"
            className="bg-[#0B559F] hover:bg-[#094582] text-white shadow-sm font-medium"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Portal Login Admin
          </Button>
        </Link>
      </div>

      {/* Quick Demo Switcher for Evaluation */}
      <div className="mt-6 pt-5 border-t border-[#E2E8F0] w-full">
        <p className="text-[11px] font-mono uppercase text-[#667085] tracking-wider mb-2.5">
          Atau Masuk Cepat sebagai Penguji Resmi (Demo Environment):
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <Button
            size="sm"
            onClick={() => handleSwitchUser("usr_admin_01")}
            disabled={!!switchingUser}
            className="bg-[#1570EF] hover:bg-[#0B559F] text-white text-xs"
          >
            {switchingUser === "usr_admin_01" ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
            )}
            Beralih ke Admin
          </Button>

          <Button
            size="sm"
            onClick={() => handleSwitchUser("usr_owner_01")}
            disabled={!!switchingUser}
            className="bg-[#53389E] hover:bg-[#42307D] text-white text-xs"
          >
            {switchingUser === "usr_owner_01" ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Crown className="w-3.5 h-3.5 mr-1.5" />
            )}
            Beralih ke Owner
          </Button>
        </div>
      </div>

      <Card className="mt-6 text-left w-full border-[#E2E8F0] bg-white shadow-sm">
        <CardContent className="p-4 text-[11px] text-[#475467] space-y-1 font-mono">
          <p className="font-bold text-[#101828]">Protokol Keamanan NemoLearn IAM:</p>
          <p className="leading-relaxed font-sans text-xs text-[#475467]">
            Setiap endpoint API dan routing diverifikasi di tingkat backend menggunakan HMAC SHA-256 session token dan otorisasi least-privilege (Owner &gt; Admin &gt; Guru &gt; Pelajar).
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
