"use client";

import React, { forwardRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      disabled,
      type = "text",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    return (
      <div className="w-full relative flex flex-col space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-[#334155]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 pointer-events-none text-[#94A3B8] shrink-0">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full h-10 rounded-xl border bg-white px-3.5 text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:border-[#16A34A] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-[#F3F4EE] disabled:text-[#94A3B8]",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              error
                ? "border-[#DC2626] focus-visible:ring-[#DC2626] focus-visible:border-[#DC2626]"
                : "border-[#E5E7EB] hover:border-[#CBD5E1]",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 pointer-events-none text-[#94A3B8] shrink-0">
              {rightIcon}
            </div>
          )}
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
Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, disabled, id, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    return (
      <div className="w-full relative flex flex-col space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-semibold text-[#334155]"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          disabled={disabled}
          className={cn(
            "w-full rounded-xl border bg-white p-3 text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:border-[#16A34A] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-[#F3F4EE] disabled:text-[#94A3B8] resize-y",
            error
              ? "border-[#DC2626] focus-visible:ring-[#DC2626] focus-visible:border-[#DC2626]"
              : "border-[#E5E7EB] hover:border-[#CBD5E1]",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-[11px] font-medium text-[#DC2626] animate-fade-in">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-[#64748B]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, placeholder = "Cari...", ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3 w-4 h-4 text-[#94A3B8] pointer-events-none shrink-0" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full h-10 pl-9 pr-8 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:border-[#16A34A] hover:border-[#CBD5E1]",
            className
          )}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              onClear?.();
            }}
            className="absolute right-2.5 p-0.5 rounded text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F3F4EE] transition-colors"
            aria-label="Bersihkan pencarian"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";
