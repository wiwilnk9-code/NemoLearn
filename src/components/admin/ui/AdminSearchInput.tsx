"use client";

import React, { forwardRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminSearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  shortcutHint?: string;
  containerClassName?: string;
}

export const AdminSearchInput = forwardRef<HTMLInputElement, AdminSearchInputProps>(
  (
    {
      value,
      onChange,
      onClear,
      placeholder = "Cari data...",
      shortcutHint,
      containerClassName,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          "relative flex items-center w-full group",
          containerClassName
        )}
      >
        <Search className="absolute left-3 w-4 h-4 text-[#94A3B8] group-hover:text-[#0B559F] transition-colors pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#101828] placeholder:text-[#94A3B8] font-mono transition-all focus:outline-none focus:bg-white focus:border-[#0B559F] focus:ring-2 focus:ring-[#0B559F]/20 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              onClear?.();
            }}
            className="absolute right-2.5 p-1 rounded-md text-[#94A3B8] hover:text-[#101828] hover:bg-[#F1F5F9] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : shortcutHint ? (
          <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[9px] font-mono text-[#667085] bg-[#EFF4FF] border border-[#B2DDFF] rounded pointer-events-none">
            {shortcutHint}
          </kbd>
        ) : null}
      </div>
    );
  }
);
AdminSearchInput.displayName = "AdminSearchInput";
