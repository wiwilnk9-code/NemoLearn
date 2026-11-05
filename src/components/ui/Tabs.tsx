"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  badge?: string;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: "pills" | "line" | "cards";
  size?: "sm" | "md";
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeId,
  onChange,
  variant = "pills",
  size = "md",
  className,
}) => {
  if (variant === "line") {
    return (
      <div
        role="tablist"
        className={cn(
          "flex items-center gap-6 border-b border-[#E5E7EB] overflow-x-auto no-scrollbar",
          className
        )}
      >
        {items.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative pb-3 flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors select-none whitespace-nowrap",
                isActive
                  ? "text-[#16A34A]"
                  : "text-[#64748B] hover:text-[#0F172A]",
                tab.disabled && "opacity-40 cursor-not-allowed"
              )}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-mono",
                    isActive
                      ? "bg-[#DCFCE7] text-[#15803D]"
                      : "bg-[#F3F4EE] text-[#64748B]"
                  )}
                >
                  {tab.count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#16A34A] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Variant: Pills (Default)
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex p-1 bg-[#F3F4EE] rounded-xl gap-1 border border-[#E5E7EB] overflow-x-auto no-scrollbar",
        className
      )}
    >
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        const sizeClasses = {
          sm: "h-7 px-2.5 text-xs gap-1.5",
          md: "h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm gap-2",
        };

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 select-none whitespace-nowrap",
              sizeClasses[size],
              isActive
                ? "bg-white text-[#15803D] shadow-xs font-bold"
                : "text-[#64748B] hover:text-[#0F172A] hover:bg-white/50",
              tab.disabled && "opacity-40 cursor-not-allowed"
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                  isActive
                    ? "bg-[#F0FDF4] text-[#15803D]"
                    : "bg-[#E5E7EB] text-[#64748B]"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
