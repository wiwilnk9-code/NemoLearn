"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "coral"
    | "accent"
    | "subtle"
    | "outline"
    | "ghost"
    | "danger"
    | "success";
  size?: "xs" | "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2";

    const sizeStyles = {
      xs: "h-7 px-2.5 text-[11px] rounded-md gap-1",
      sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
      md: "h-10 px-4 text-xs sm:text-sm rounded-xl gap-2",
      lg: "h-11 px-5 text-sm sm:text-base rounded-xl gap-2.5",
    };

    const variantStyles = {
      // Primary: Fresh Botanical Green
      primary:
        "bg-[#16A34A] text-white hover:bg-[#15803D] active:bg-[#166534] shadow-xs",
      // Secondary: Soft Fresh Mint Container
      secondary:
        "bg-[#F0FDF4] text-[#166534] font-bold border border-[#86EFAC] hover:bg-[#DCFCE7] active:bg-[#BBF7D0]",
      // Tertiary: Subtle neutral without border
      tertiary:
        "bg-transparent text-[#1E293B] font-semibold hover:bg-[#F1F5F9] hover:text-[#0F172A] active:bg-[#E2E8F0]",
      // Coral / Accent: Solar Coral for HOTS & urgent actions
      coral:
        "bg-[#EA580C] text-white hover:bg-[#C2410C] active:bg-[#9A3412] shadow-xs focus-visible:ring-[#EA580C]",
      accent:
        "bg-[#EA580C] text-white hover:bg-[#C2410C] active:bg-[#9A3412] shadow-xs focus-visible:ring-[#EA580C]",
      // Subtle: Warm cream/lime pill
      subtle:
        "bg-[#F7FEE7] text-[#3F6212] font-bold border border-[#BEF264] hover:bg-[#ECFCCB]",
      // Outline: Clean card border
      outline:
        "bg-white border border-[#CBD5E1] text-[#0F172A] font-semibold hover:bg-[#FAF9F5] hover:border-[#16A34A] hover:text-[#166534] shadow-xs",
      // Ghost: Borderless slate
      ghost:
        "bg-transparent text-[#334155] font-semibold hover:bg-[#F1F5F9] hover:text-[#0F172A] active:bg-[#E2E8F0]",
      // Danger: Crimson
      danger:
        "bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] shadow-xs focus-visible:ring-[#DC2626]",
      // Success: Green
      success:
        "bg-[#16A34A] text-white hover:bg-[#15803D] active:bg-[#166534] shadow-xs",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
