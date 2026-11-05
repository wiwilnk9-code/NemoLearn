"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface AdminDateRangeSelectorProps {
  ranges?: string[];
  activeRange?: string;
  onChange?: (range: string) => void;
  className?: string;
}

const DEFAULT_RANGES = [
  "7 Hari Terakhir",
  "30 Hari Terakhir",
  "Kuartal Ini",
  "Kustom",
];

export const AdminDateRangeSelector: React.FC<AdminDateRangeSelectorProps> = ({
  ranges = DEFAULT_RANGES,
  activeRange = "30 Hari Terakhir",
  onChange,
  className,
}) => {
  return (
    <div
      className={cn(
        "inline-flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1 shadow-xs select-none",
        className
      )}
    >
      {ranges.map((range) => {
        const isActive = range === activeRange;
        return (
          <button
            key={range}
            type="button"
            onClick={() => onChange?.(range)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              isActive
                ? "bg-[#D1E9FF] text-[#062C54] font-semibold shadow-xs"
                : "text-[#475467] hover:text-[#101828] hover:bg-[#F1F5F9]"
            )}
          >
            {range}
          </button>
        );
      })}
    </div>
  );
};
