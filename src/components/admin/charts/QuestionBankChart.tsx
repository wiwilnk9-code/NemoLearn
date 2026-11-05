"use client";

import React, { useState } from "react";
import { Layers, Sparkles, BookOpen, AlertCircle, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuestionBankAnalytics } from "@/types/admin";

interface QuestionBankChartProps {
  data: QuestionBankAnalytics;
  loading?: boolean;
  error?: string | null;
}

export const QuestionBankChart: React.FC<QuestionBankChartProps> = ({
  data,
  loading = false,
  error = null,
}) => {
  const [activeTab, setActiveTab] = useState<"subject" | "difficulty" | "source" | "topics">("subject");

  if (error) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-red-200 text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h4 className="text-sm font-bold text-[#0F172A]">Gagal Memuat Distribusi Bank Soal</h4>
        <p className="text-xs text-red-600">{error}</p>
      </div>
    );
  }

  const isEmpty = !data || (data.hotsProportion && data.hotsProportion.total === 0);

  if (isEmpty && !loading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-[#E2E8F0] text-center space-y-2">
        <Layers className="w-8 h-8 text-[#94A3B8] mx-auto" />
        <h4 className="text-sm font-bold text-[#0F172A]">Bank Soal Kosong</h4>
        <p className="text-xs text-[#64748B]">
          Belum ada butir soal yang tersimpan di database kurikulum SMA.
        </p>
      </div>
    );
  }

  const { bySubject = [], byDifficulty = [], bySourceType = [], byTopic = [], hotsProportion } = data;

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header & Category Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
              Distribusi Bank Soal Kurikulum SMA
            </h3>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
              {hotsProportion?.total || 0} Butir Soal
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            {hotsProportion?.hots || 0} butir HOTS ({hotsProportion?.hotsPercentage || 0}%) &bull; Kategori dan tingkat kesulitan nyata tersimpan di database
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex flex-wrap items-center bg-[#F1F5F9] p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          {[
            { id: "subject", label: "Mata Pelajaran" },
            { id: "difficulty", label: "Kesulitan" },
            { id: "source", label: "Sumber Soal" },
            { id: "topics", label: "Top Materi" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                activeTab === tab.id
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-xs font-semibold text-[#0F172A]">
          Memperbarui data distribusi bank soal...
        </div>
      )}

      {/* Tab 1: By Subject */}
      {!loading && activeTab === "subject" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bySubject.map((s, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E2E8F0] space-y-2 hover:border-[#16A34A]/50 transition-all"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span className="font-bold text-[#0F172A]">{s.subjectName}</span>
                  </div>
                  <span className="font-mono font-bold text-[#0F172A]">
                    {s.total} butir ({s.percentage}%)
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
                  <div
                    className="h-full bg-[#16A34A] rounded-full transition-all duration-500"
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-[#64748B]">
                  <span className="flex items-center gap-1 text-[#EA580C] font-semibold">
                    <Sparkles className="w-3 h-3" />
                    {s.hotsCount} butir HOTS
                  </span>
                  <span>{s.total > 0 ? Math.round((s.hotsCount / s.total) * 100) : 0}% rasio HOTS</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: By Difficulty */}
      {!loading && activeTab === "difficulty" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {byDifficulty.map((d, idx) => {
              const colors = {
                mudah: { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-[#16A34A]", border: "border-emerald-200" },
                sedang: { bg: "bg-blue-50", text: "text-blue-700", bar: "bg-[#2563EB]", border: "border-blue-200" },
                sulit: { bg: "bg-amber-50", text: "text-amber-700", bar: "bg-[#D97706]", border: "border-amber-200" },
                hots: { bg: "bg-orange-50", text: "text-orange-700", bar: "bg-[#EA580C]", border: "border-orange-200" },
              }[d.difficulty];

              return (
                <div
                  key={idx}
                  className={cn("p-5 rounded-2xl border space-y-3", colors.bg, colors.border)}
                >
                  <div className="flex justify-between items-start">
                    <span className={cn("text-xs font-bold uppercase tracking-wider", colors.text)}>
                      {d.label}
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-[#0F172A]">
                      {d.count}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="h-2 w-full rounded-full bg-white/70 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", colors.bar)}
                        style={{ width: `${d.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-[#64748B] pt-0.5">
                      <span>Proporsi Bank</span>
                      <span className="font-bold">{d.percentage}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* HOTS vs Regular Comparison Card */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#0F172A]">Klasifikasi HOTS vs Reguler:</span>
                <p className="text-[11px] text-[#64748B]">
                  {hotsProportion?.hots} Soal HOTS ({hotsProportion?.hotsPercentage}%) berbanding {hotsProportion?.reguler} Soal Reguler ({100 - (hotsProportion?.hotsPercentage || 0)}%)
                </p>
              </div>
            </div>
            <div className="w-full sm:w-48 h-3 rounded-full bg-[#E2E8F0] overflow-hidden flex">
              <div
                className="bg-[#EA580C] h-full"
                style={{ width: `${hotsProportion?.hotsPercentage || 0}%` }}
                title="HOTS"
              />
              <div
                className="bg-[#2563EB] h-full"
                style={{ width: `${100 - (hotsProportion?.hotsPercentage || 0)}%` }}
                title="Reguler"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: By Source Type */}
      {!loading && activeTab === "source" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {bySourceType.map((s, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-[#E2E8F0] space-y-2 hover:border-[#16A34A]/50 transition-all"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#0F172A]">{s.label}</span>
                  <span className="font-mono font-extrabold text-base text-[#0F172A]">
                    {s.count}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      s.sourceType === "curated_bank"
                        ? "bg-[#16A34A]"
                        : s.sourceType === "ai_generated"
                        ? "bg-[#7C3AED]"
                        : "bg-[#2563EB]"
                    )}
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#64748B] text-right font-semibold">
                  {s.percentage}% dari total butir
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Top Topics */}
      {!loading && activeTab === "topics" && (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-2.5">Peringkat</th>
                  <th className="px-4 py-2.5">Materi Pokok / Topik</th>
                  <th className="px-4 py-2.5">Mata Pelajaran</th>
                  <th className="px-4 py-2.5 text-right">Jumlah Butir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {byTopic.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-bold text-[#64748B]">#{idx + 1}</td>
                    <td className="px-4 py-2.5 font-bold text-[#0F172A]">{t.topicName}</td>
                    <td className="px-4 py-2.5 text-[#64748B]">{t.subjectName || "-"}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-extrabold text-[#16A34A]">
                      {t.total} soal
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
