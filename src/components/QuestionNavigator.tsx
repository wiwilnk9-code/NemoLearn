"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  answers: Record<string, "A" | "B" | "C" | "D" | "E" | null>;
  questionIds: string[];
  onSelectIndex: (index: number) => void;
  evaluations?: Record<string, { isCorrect: boolean; correctAnswer: "A" | "B" | "C" | "D" | "E" }>;
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  totalQuestions,
  currentIndex,
  answers,
  questionIds,
  onSelectIndex,
  evaluations,
}) => {
  const answeredCount = questionIds.filter((id) => answers[id]).length;
  const progressPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="ui-label text-[#0F172A]">Navigasi Soal</h3>
        <span className="text-xs font-mono font-bold text-[#16A34A]">
          {answeredCount} / {totalQuestions} ({progressPercent}%)
        </span>
      </div>

      {/* Progress Bar */}
      <ProgressBar value={answeredCount} max={totalQuestions} variant="primary" size="xs" />

      {/* Numbers Grid (5 columns) */}
      <div className="grid grid-cols-5 gap-2">
        {questionIds.map((qid, idx) => {
          const isAnswered = !!answers[qid];
          const isActive = idx === currentIndex;
          const evaluation = evaluations ? evaluations[qid] : null;

          let btnColor = "bg-[#F8FAFC] border border-[#CBD5E1] text-[#334155] hover:border-[#16A34A] hover:text-[#0F172A] font-bold";

          if (isActive) {
            btnColor = "bg-[#16A34A] text-white shadow-xs ring-2 ring-[#16A34A] ring-offset-2 font-extrabold";
          } else if (evaluation) {
            btnColor = evaluation.isCorrect
              ? "bg-[#F0FDF4] border border-[#86EFAC] text-[#166534] hover:bg-[#DCFCE7] font-bold shadow-xs"
              : "bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] hover:bg-[#FEE2E2] font-bold shadow-xs";
          } else if (isAnswered) {
            btnColor = "bg-[#F0FDF4] border border-[#86EFAC] text-[#166534] hover:bg-[#DCFCE7] font-bold shadow-xs";
          }

          return (
            <button
              type="button"
              key={qid}
              onClick={() => onSelectIndex(idx)}
              title={`Nomor ${idx + 1}: ${isAnswered ? `Terjawab (Pilihan ${answers[qid]})` : "Belum Dijawab"}`}
              aria-label={`Nomor ${idx + 1}: ${isAnswered ? `Terjawab (Pilihan ${answers[qid]})` : "Belum Dijawab"}`}
              className={cn(
                "h-10 min-h-[40px] rounded-xl text-xs font-bold transition-all relative flex flex-col items-center justify-center cursor-pointer select-none active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2",
                btnColor
              )}
            >
              <span>{idx + 1}</span>
              {isAnswered && (
                <span
                  className={cn(
                    "text-[9px] font-mono -mt-0.5 font-bold",
                    isActive ? "text-white" : evaluation && !evaluation.isCorrect ? "text-[#DC2626]" : "text-[#166534]"
                  )}
                >
                  {answers[qid]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-3 border-t border-[#F3F4EE] flex items-center justify-between text-[11px] text-[#64748B]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-[#F0FDF4] border border-[#86EFAC]" />
          <span>{evaluations ? "Benar/Dijawab" : "Terjawab"}</span>
        </div>
        {evaluations && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-[#FEF2F2] border border-[#FCA5A5]" />
            <span>Salah</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-[#16A34A]" />
          <span className="font-semibold text-[#0F172A]">Aktif</span>
        </div>
      </div>
    </div>
  );
};
