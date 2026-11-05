"use client";

import React, { useState, useEffect } from "react";
import { PublicQuestion } from "@/types/question";
import { MathRenderer } from "./MathRenderer";
import {
  Sparkles,
  Flame,
  Check,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Flag,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { playSound } from "@/lib/sound";

export interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  question: PublicQuestion;
  selectedAnswer: "A" | "B" | "C" | "D" | "E" | null;
  onSelectAnswer: (key: "A" | "B" | "C" | "D" | "E") => void;
  disabled?: boolean;
  onReportQuestion?: () => void;
  // Study Mode evaluation & lazy explanation props
  learningMode?: "belajar" | "ujian";
  evaluation?: {
    isCorrect: boolean;
    correctAnswer: "A" | "B" | "C" | "D" | "E";
  } | null;
  explanation?: string | null;
  isExplanationLoading?: boolean;
  explanationError?: string | null;
  explanationDepth?: "singkat" | "normal" | "mendalam";
  onChangeDepth?: (depth: "singkat" | "normal" | "mendalam") => void;
  onRetryExplanation?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  questionNumber,
  totalQuestions,
  question,
  selectedAnswer,
  onSelectAnswer,
  disabled = false,
  onReportQuestion,
  learningMode = "ujian",
  evaluation,
  explanation,
  isExplanationLoading = false,
  explanationError = null,
  explanationDepth = "normal",
  onChangeDepth,
  onRetryExplanation,
}) => {
  const [showHint, setShowHint] = useState(false);

  // Reset hint state when question changes
  useEffect(() => {
    setShowHint(false);
  }, [question.id]);

  const isEvaluated = Boolean(evaluation);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 sm:p-8 shadow-card space-y-6 animate-fade-in transition-all">
      {/* Header Info Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F3F4EE] pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="green" size="md">
            Soal {questionNumber} dari {totalQuestions}
          </Badge>

          {learningMode === "belajar" ? (
            <Badge variant="lime" size="sm">
              <BookOpen className="w-3.5 h-3.5 mr-1 text-[#15803D]" /> Mode Belajar
            </Badge>
          ) : (
            <Badge variant="slate" size="sm">
              Mode Ujian
            </Badge>
          )}

          {question.difficulty === "hots" && (
            <Badge variant="coral" size="md">
              <Flame className="w-3.5 h-3.5 mr-1 text-[#EA580C]" /> Mode HOTS
            </Badge>
          )}

          {question.isAiGenerated && (
            <Badge variant="lime" size="sm">
              <Sparkles className="w-3 h-3 text-[#15803D] mr-1" /> Terverifikasi Kurikulum
            </Badge>
          )}
        </div>

        {onReportQuestion && (
          <button
            type="button"
            onClick={onReportQuestion}
            className="text-[11px] font-semibold text-[#64748B] hover:text-[#DC2626] flex items-center gap-1.5 transition-colors py-1 px-2.5 rounded-lg hover:bg-[#FEF2F2]"
            title="Laporkan kendala pada butir soal ini"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Laporkan Soal</span>
          </button>
        )}
      </div>

      {/* Question Narrative / Stem (with high-legibility KaTeX) */}
      <div className="text-base sm:text-lg font-semibold text-[#0F172A] leading-relaxed break-words min-w-0">
        <MathRenderer text={question.stem} />
      </div>

      {/* Optional Diagram / Illustration */}
      {question.imageUrl && (
        <div className="p-3 sm:p-4 rounded-2xl border border-[#E5E7EB] bg-[#FAF9F5] text-center overflow-hidden">
          <img
            src={question.imageUrl}
            alt="Ilustrasi Soal"
            className="max-h-72 max-w-full w-auto mx-auto object-contain rounded-xl"
          />
        </div>
      )}

      {/* Options A..E */}
      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedAnswer === option.key;
          const isCorrectAnswer = isEvaluated && evaluation?.correctAnswer === option.key;
          const isWrongSelection = isEvaluated && isSelected && !evaluation?.isCorrect;

          let cardStyle = "bg-white border-[#CBD5E1] text-[#0F172A] hover:border-[#16A34A]/50 hover:bg-[#FAF9F5] shadow-xs";
          let pillStyle = "bg-[#F1F5F9] border border-[#CBD5E1] text-[#1E293B] font-bold group-hover:bg-[#E2E8F0]";

          if (isEvaluated) {
            if (isCorrectAnswer) {
              cardStyle = "bg-[#F0FDF4] border-[#16A34A] text-[#15803D] font-semibold shadow-xs ring-1 ring-[#16A34A]/30";
              pillStyle = "bg-[#16A34A] text-white shadow-xs font-extrabold";
            } else if (isWrongSelection) {
              cardStyle = "bg-[#FEF2F2] border-[#EF4444] text-[#991B1B] shadow-xs";
              pillStyle = "bg-[#EF4444] text-white shadow-xs font-extrabold";
            } else {
              cardStyle = "bg-white border-[#E2E8F0] text-[#94A3B8] opacity-75";
              pillStyle = "bg-[#F8FAFC] border border-[#E2E8F0] text-[#94A3B8]";
            }
          } else if (isSelected) {
            cardStyle = "bg-[#F0FDF4] border-[#16A34A] text-[#0F172A] shadow-xs ring-1 ring-[#16A34A]/25";
            pillStyle = "bg-[#16A34A] text-white shadow-xs font-extrabold";
          }

          return (
            <button
              type="button"
              key={option.key}
              disabled={disabled}
              onClick={() => {
                playSound("select");
                onSelectAnswer(option.key);
              }}
              className={cn(
                "w-full p-3.5 sm:p-4.5 rounded-2xl border-2 text-left flex items-start gap-3 sm:gap-4 transition-all duration-150 cursor-pointer group active:scale-[0.99] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2",
                cardStyle
              )}
            >
              {/* Option Letter Key */}
              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-colors mt-0.5",
                  pillStyle
                )}
              >
                {option.key}
              </div>

              {/* Option Text with Math */}
              <div className="text-xs sm:text-sm pt-1 leading-relaxed flex-grow min-w-0 break-words font-medium">
                <MathRenderer text={option.text} />
              </div>

              {/* Right Indicator Slot */}
              <div className="shrink-0 flex items-center gap-1.5 mt-0.5">
                {isEvaluated ? (
                  isCorrectAnswer ? (
                    <Badge variant="green" size="sm">
                      Kunci Benar
                    </Badge>
                  ) : isWrongSelection ? (
                    <Badge variant="rose" size="sm">
                      Pilihan Anda
                    </Badge>
                  ) : null
                ) : (
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150",
                      isSelected
                        ? "bg-[#16A34A] border-2 border-[#16A34A] text-white shadow-xs scale-100"
                        : "border-2 border-[#CBD5E1] bg-white group-hover:border-[#16A34A] group-hover:bg-[#F0FDF4]"
                    )}
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-[#16A34A]/40 transition-colors" />
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Mode Belajar: Evaluated Status Banner */}
      {isEvaluated && (
        <div
          className={cn(
            "p-4 rounded-2xl border flex items-center gap-3 animate-fade-in",
            evaluation?.isCorrect
              ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]"
              : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
          )}
        >
          {evaluation?.isCorrect ? (
            <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-[#DC2626] shrink-0" />
          )}
          <div className="text-xs sm:text-sm font-semibold">
            {evaluation?.isCorrect ? (
              <span>Jawaban Anda benar! Konsep berhasil dipahami dengan tepat.</span>
            ) : (
              <span>
                Jawaban kurang tepat. Kunci jawaban resmi adalah Opsi <strong>{evaluation?.correctAnswer}</strong>.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Mode Belajar: Adaptive Lazy Explanation Box (Stage 1, 3, 7) */}
      {isEvaluated && (
        <div className="border border-[#E2E8F0] bg-[#FAF9F5] rounded-3xl p-5 sm:p-6 space-y-4 animate-fade-in">
          {/* Header & Depth Level Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#16A34A]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0F172A]">Pembahasan Konsep</h4>
                <p className="text-[11px] text-[#64748B]">Telaah solusi interaktif Kurikulum Merdeka</p>
              </div>
            </div>

            {/* Depth Level Selector Buttons: Singkat, Normal, Mendalam */}
            {onChangeDepth && (
              <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#E2E8F0]">
                {(["singkat", "normal", "mendalam"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    disabled={isExplanationLoading}
                    onClick={() => onChangeDepth(d)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize",
                      explanationDepth === d
                        ? "bg-[#16A34A] text-white shadow-xs"
                        : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                    )}
                  >
                    {d === "normal" ? "Normal (Baku)" : d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Explanation Content State */}
          {isExplanationLoading ? (
            <div className="space-y-3 py-3 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#16A34A]">
                <Loader2 className="w-4 h-4 animate-spin text-[#16A34A]" />
                <span>AI sedang menyiapkan pembahasan ({explanationDepth})...</span>
              </div>
              {/* Skeleton loading (Stage 7) */}
              <div className="space-y-2 animate-pulse pt-1">
                <div className="h-4 bg-[#E2E8F0] rounded-lg w-1/3"></div>
                <div className="h-3 bg-[#E2E8F0] rounded-lg w-full"></div>
                <div className="h-3 bg-[#E2E8F0] rounded-lg w-5/6"></div>
                <div className="h-3 bg-[#E2E8F0] rounded-lg w-4/6"></div>
              </div>
            </div>
          ) : explanationError ? (
            <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#991B1B]">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span>{explanationError}</span>
              </div>
              {onRetryExplanation && (
                <button
                  type="button"
                  onClick={onRetryExplanation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#FECACA] text-[#DC2626] font-bold hover:bg-[#FEE2E2] transition-colors shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Coba Lagi</span>
                </button>
              )}
            </div>
          ) : explanation ? (
            <div className="text-xs sm:text-sm text-[#0F172A] leading-relaxed animate-fade-in space-y-2">
              <MathRenderer text={explanation} />
            </div>
          ) : (
            <div className="py-2 text-xs text-[#64748B] flex items-center justify-between">
              <span>Pembahasan siap dipelajari.</span>
              {onRetryExplanation && (
                <button
                  type="button"
                  onClick={onRetryExplanation}
                  className="font-bold text-[#16A34A] hover:underline cursor-pointer"
                >
                  Buka Pembahasan
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hint Accordion */}
      {question.hint && (
        <div className="border-t border-[#F3F4EE] pt-4">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="text-xs font-bold text-[#D97706] hover:text-[#B45309] flex items-center gap-1.5 transition-colors focus:outline-none cursor-pointer"
          >
            <Lightbulb className="w-4 h-4 text-[#D97706]" />
            <span>{showHint ? "Sembunyikan Petunjuk Pengerjaan" : "Butuh Bantuan? Buka Petunjuk Konsep"}</span>
            {showHint ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showHint && (
            <div className="mt-3 p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs sm:text-sm leading-relaxed animate-fade-in space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#B45309]">
                <Lightbulb className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>Arah Rumus & Pendekatan Konseptual:</span>
              </div>
              <div className="text-[#78350F] font-medium pl-5 pt-0.5">
                <MathRenderer text={question.hint} />
              </div>
              <p className="text-[11px] text-[#B45309]/80 pl-5 pt-1 italic">
                *Petunjuk memberikan arah penyelesaian tanpa membocorkan kunci jawaban akhir.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
