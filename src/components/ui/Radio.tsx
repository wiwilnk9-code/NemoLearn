"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: string;
  error?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      className,
      label,
      description,
      error,
      checked = false,
      disabled = false,
      id,
      onChange,
      ...props
    },
    ref
  ) => {
    const radioId = id || (typeof label === "string" ? `radio-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    return (
      <div className="flex flex-col space-y-1 text-left">
        <label
          htmlFor={radioId}
          className={cn(
            "group inline-flex items-start gap-2.5 cursor-pointer select-none",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="relative flex items-center justify-center shrink-0 mt-0.5">
            <input
              id={radioId}
              type="radio"
              ref={ref}
              checked={checked}
              disabled={disabled}
              onChange={onChange}
              className="sr-only"
              {...props}
            />
            <div
              className={cn(
                "w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-150 group-focus-within:ring-2 group-focus-within:ring-[#16A34A] group-focus-within:ring-offset-1",
                checked
                  ? "bg-[#16A34A] border-[#16A34A] shadow-xs"
                  : error
                  ? "bg-white border-[#DC2626] group-hover:border-[#B91C1C]"
                  : "bg-white border-[#CBD5E1] group-hover:border-[#16A34A]",
                disabled && "bg-[#F3F4EE] border-[#E5E7EB]"
              )}
            >
              {checked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </div>
          {(label || description) && (
            <div className="flex flex-col">
              {label && (
                <span
                  className={cn(
                    "text-xs sm:text-sm font-medium text-[#0F172A] leading-tight",
                    disabled && "text-[#94A3B8]"
                  )}
                >
                  {label}
                </span>
              )}
              {description && (
                <span className="text-[11px] text-[#64748B] mt-0.5 leading-normal">
                  {description}
                </span>
              )}
            </div>
          )}
        </label>
        {error && <p className="text-[11px] font-medium text-[#DC2626] pl-6 animate-fade-in">{error}</p>}
      </div>
    );
  }
);
Radio.displayName = "Radio";
