"use client";

import React, { useState, useRef, useEffect, forwardRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = "Pilih opsi...",
  error,
  disabled = false,
  className,
  size = "md",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-3.5 text-xs sm:text-sm",
  };

  return (
    <div ref={containerRef} className={cn("relative w-full flex flex-col space-y-1.5 text-left", className)}>
      {label && (
        <label className="text-xs font-semibold text-[#334155]">
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full rounded-xl border bg-white flex items-center justify-between font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-1 select-none",
          sizeClasses[size],
          disabled
            ? "bg-[#F3F4EE] text-[#94A3B8] border-[#E5E7EB] cursor-not-allowed"
            : error
            ? "border-[#DC2626] text-[#0F172A]"
            : isOpen
            ? "border-[#16A34A] ring-1 ring-[#16A34A] text-[#0F172A]"
            : "border-[#E5E7EB] text-[#0F172A] hover:border-[#CBD5E1]"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
          <span className={cn("truncate", !selected && "text-[#94A3B8] font-normal")}>
            {selected ? selected.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-[#64748B] transition-transform duration-200 shrink-0 ml-2",
            isOpen && "rotate-180 text-[#16A34A]"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-[#E5E7EB] bg-white p-1.5 shadow-lg animate-scale-in">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm rounded-lg transition-colors text-left",
                  isSelected
                    ? "bg-[#F0FDF4] text-[#15803D] font-bold"
                    : "text-[#0F172A] hover:bg-[#FAF9F5]",
                  opt.disabled && "opacity-40 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#16A34A] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="text-[11px] font-medium text-[#DC2626] animate-fade-in">{error}</p>}
    </div>
  );
};

export interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, label, error, helperText, children, disabled, id, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    return (
      <div className="w-full relative flex flex-col space-y-1.5 text-left">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-[#334155]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full h-10 appearance-none rounded-xl border bg-white pl-3.5 pr-9 text-xs sm:text-sm font-semibold text-[#0F172A] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:border-[#16A34A] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-[#F3F4EE] disabled:text-[#94A3B8]",
              error ? "border-[#DC2626]" : "border-[#E5E7EB] hover:border-[#CBD5E1]",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="w-4 h-4 text-[#64748B] pointer-events-none absolute right-3" />
        </div>
        {error ? (
          <p className="text-[11px] font-medium text-[#DC2626] animate-fade-in">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-[#64748B]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
NativeSelect.displayName = "NativeSelect";
