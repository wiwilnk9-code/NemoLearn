"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface FilterTabItem {
  id: string;
  label: string;
  count?: number | string;
  badgeVariant?: "blue" | "purple" | "emerald" | "coral";
}

export interface AdminFilterBarProps {
  tabs?: FilterTabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  statusIndicator?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const AdminFilterBar: React.FC<AdminFilterBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  statusIndicator,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-sapphire-card space-y-3",
        className
      )}
    >
      {/* Category Tabs Row (if tabs provided) */}
      {tabs && tabs.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange?.(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 select-none",
                    isActive
                      ? "bg-[#0B559F] text-white font-semibold shadow-xs"
                      : "text-[#475467] hover:text-[#101828] hover:bg-[#F1F5F9]"
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                        isActive
                          ? "bg-white/20 text-white font-bold"
                          : "bg-[#EFF4FF] text-[#0B559F]"
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {statusIndicator && (
            <div className="flex items-center text-xs font-mono text-[#667085] shrink-0">
              {statusIndicator}
            </div>
          )}
        </div>
      )}

      {/* Main Filter Controls Slot */}
      {children && <div>{children}</div>}
    </div>
  );
};
