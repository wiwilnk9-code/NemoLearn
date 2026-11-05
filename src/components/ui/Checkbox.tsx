"use client";

import React, { forwardRef, useEffect, useRef } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: string;
  error?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      description,
      error,
      indeterminate = false,
      checked = false,
      disabled = false,
      id,
      onChange,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const ref = (forwardedRef as React.RefObject<HTMLInputElement>) || internalRef;
    const checkboxId = id || (typeof label === "string" ? `checkbox-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    useEffect(() => {
      if (ref && "current" in ref && ref.current) {
        ref.current.indeterminate = indeterminate;
      }
    }, [indeterminate, ref]);

    const isCheckedOrIndeterminate = checked || indeterminate;

    return (
      <div className="flex flex-col space-y-1 text-left">
        <label
          htmlFor={checkboxId}
          className={cn(
            "group inline-flex items-start gap-2.5 cursor-pointer select-none",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="relative flex items-center justify-center shrink-0 mt-0.5">
            <input
              id={checkboxId}
              type="checkbox"
              ref={ref}
              checked={checked}
              disabled={disabled}
              onChange={onChange}
              className="sr-only"
              {...props}
            />
            <div
              className={cn(
                "w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-150 group-focus-within:ring-2 group-focus-within:ring-[#16A34A] group-focus-within:ring-offset-1",
                isCheckedOrIndeterminate
                  ? "bg-[#16A34A] border-[#16A34A] text-white shadow-xs"
                  : error
                  ? "bg-white border-[#DC2626] group-hover:border-[#B91C1C]"
                  : "bg-white border-[#CBD5E1] group-hover:border-[#16A34A]",
                disabled && "bg-[#F3F4EE] border-[#E5E7EB] text-[#94A3B8]"
              )}
            >
              {indeterminate ? (
                <Minus className="w-3 h-3 stroke-[3]" />
              ) : checked ? (
                <Check className="w-3 h-3 stroke-[3]" />
              ) : null}
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
Checkbox.displayName = "Checkbox";
