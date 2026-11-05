"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ChartLegendItem {
  label: string;
  color: string;
  value?: string;
}

export interface AdminChartCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: any;
  granularityOptions?: string[];
  activeGranularity?: string;
  onGranularityChange?: (granularity: string) => void;
  legends?: ChartLegendItem[];
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const AdminChartCard: React.FC<AdminChartCardProps> = ({
  title,
  subtitle,
  badge,
  icon: Icon,
  granularityOptions,
  activeGranularity,
  onGranularityChange,
  legends,
  children,
  footer,
  className,
}) => {
  return (
    <div
      className={cn(
        "bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-sapphire-card flex flex-col justify-between transition-all",
        className
      )}
    >
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            {Icon && (
              <span className="p-1.5 rounded-lg bg-[#EFF4FF] text-[#0B559F] shrink-0">
                <Icon className="w-4 h-4" />
              </span>
            )}
            <h2 className="text-base font-bold text-[#101828] leading-tight">
              {title}
            </h2>
            {badge && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#EFF4FF] text-[#0B559F] border border-[#B2DDFF] font-semibold">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-[#475467] mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Time Granularity Pill Selector */}
        {granularityOptions && granularityOptions.length > 0 && onGranularityChange && (
          <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-1 self-start sm:self-auto shrink-0 shadow-xs">
            {granularityOptions.map((opt) => {
              const isActive = opt === activeGranularity;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onGranularityChange(opt)}
                  className={cn(
                    "px-2.5 py-1 rounded text-xs font-medium transition-colors select-none",
                    isActive
                      ? "bg-[#D1E9FF] text-[#062C54] font-semibold shadow-xs"
                      : "text-[#475467] hover:text-[#101828] hover:bg-[#F1F5F9]"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend Items */}
      {legends && legends.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono mb-4 text-[#475467]">
          {legends.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-sm shrink-0 inline-block"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[#334155]">{item.label}</span>
              {item.value && (
                <span className="text-[#667085] font-semibold">({item.value})</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chart Viewport Canvas */}
      <div className="relative w-full">{children}</div>

      {/* Optional Card Footer */}
      {footer && (
        <div className="pt-4 mt-4 border-t border-[#E2E8F0] text-xs text-[#475467]">
          {footer}
        </div>
      )}
    </div>
  );
};
