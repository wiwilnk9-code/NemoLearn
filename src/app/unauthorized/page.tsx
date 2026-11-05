"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home, LogIn } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12 bg-slate-50/50">
      <div className="max-w-md w-full animate-fade-in text-center space-y-6">
        {/* Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold font-mono uppercase bg-rose-50 text-rose-700 border border-rose-200">
            HTTP 403 • FORBIDDEN
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-headline">
            Akses Ditolak
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            Akun Anda tidak memiliki izin atau peran yang diperlukan untuk mengakses sumber daya ini.
          </p>
        </div>

        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-6 text-left space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Kemungkinan Penyebab:
          </h3>
          <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
            <li>Anda masuk sebagai <strong>Pelajar/Siswa</strong> saat mencoba membuka panel Administrator.</li>
            <li>Akun pengajar Anda masih dalam status verifikasi (pending review).</li>
            <li>Izin modular (permissions) pada akun Anda belum diaktifkan oleh Pemilik Platform.</li>
          </ul>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs sm:text-sm transition shadow-xs"
            >
              <Home className="w-4 h-4" />
              Ke Beranda Siswa
            </Link>
            <Link
              href="/login"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs sm:text-sm transition"
            >
              <LogIn className="w-4 h-4" />
              Ganti Akun
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
