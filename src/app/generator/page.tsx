import React, { Suspense } from "react";
import { GeneratorForm } from "@/components/GeneratorForm";
import { Lightbulb, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export const metadata = {
  title: "Buat Latihan Baru — NemoLearn",
  description: "Konfigurasikan paket latihan soal mandiri Kurikulum Merdeka SMA dengan asisten AI cerdas.",
};

export default function GeneratorPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <Badge variant="green" size="md" pulseDot dot>
          Kurikulum Merdeka SMA 2026
        </Badge>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight">
          Buat Sesi Latihan Baru
        </h1>
        <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
          Tentukan mata pelajaran, topik materi pokok, jumlah butir soal, dan mode latihan. Asisten cerdas NemoLearn akan menyusun kuis interaktif berstandar nasional secara instan.
        </p>
      </div>

      {/* Main Generator Form wrapped in Suspense for useSearchParams */}
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-16 text-[#64748B] space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#16A34A]" />
            <p className="text-xs font-semibold">Memuat formulir konfigurasi latihan...</p>
          </div>
        }
      >
        <GeneratorForm />
      </Suspense>

      {/* Guidelines Footer Card */}
      <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-card text-xs text-[#475569] flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-[#0F172A] text-xs">Panduan Pilihan Mode Latihan:</p>
          <p className="leading-relaxed">
            Gunakan <strong className="text-[#EA580C]">Mode HOTS (Higher Order Thinking Skills)</strong> untuk mengasah kemampuan pemecahan masalah kontekstual, penalaran grafik sains, dan analisis data berbobot ujian nasional SNBT/UTBK. Kunci jawaban dan pembahasan konsep terstruktur akan terbuka lengkap setelah seluruh soal selesai dikerjakan.
          </p>
        </div>
      </div>
    </div>
  );
}
