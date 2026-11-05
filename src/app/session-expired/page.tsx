"use client";

import React from "react";
import Link from "next/link";
import { Clock, LogIn, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function SessionExpiredPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12 bg-slate-50/50">
      <div className="max-w-md w-full animate-fade-in text-center space-y-6">
        {/* Clock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <Clock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold font-mono uppercase bg-amber-50 text-amber-700 border border-amber-200">
            HTTP 401 • SESSION TIMEOUT
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-headline">
            Sesi Anda Telah Berakhir
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            Demi menjaga keamanan data dan akun Anda, sesi autentikasi secara otomatis ditutup setelah melewati batas waktu aktif.
          </p>
        </div>

        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-6 text-center space-y-4">
          <p className="text-xs text-slate-500">
            Silakan masuk kembali untuk melanjutkan pengerjaan soal, melihat progres riwayat belajar, atau mengelola portal.
          </p>

          <div className="pt-2">
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm transition shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              Masuk Kembali Sekarang
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
