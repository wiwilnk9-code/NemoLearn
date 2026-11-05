"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "green"
    | "lime"
    | "coral"
    | "charcoal"
    | "teal"
    | "amber"
    | "emerald"
    | "rose"
    | "sky"
    | "slate"
    | "outline"
    | "indigo"
    | "blue";
  size?: "xs" | "sm" | "md";
  dot?: boolean;
  pulseDot?: boolean;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = "green",
  size = "md",
  dot = false,
  pulseDot = false,
  icon,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center font-bold rounded-md border select-none transition-colors";

  const sizeStyles = {
    xs: "px-1.5 py-0.5 text-[9px] tracking-wide gap-1",
    sm: "px-2 py-0.5 text-[10px] tracking-wide gap-1",
    md: "px-2.5 py-1 text-xs tracking-wide gap-1.5",
  };

  const variantStyles = {
    green: "bg-[#F0FDF4] text-[#166534] border-[#86EFAC]",
    lime: "bg-[#F7FEE7] text-[#3F6212] border-[#BEF264]",
    coral: "bg-[#FFF7ED] text-[#9A3412] border-[#FDBA74]",
    charcoal: "bg-[#0F172A] text-[#86EFAC] border-[#334155]",
    teal: "bg-[#F0FDF4] text-[#166534] border-[#86EFAC]",
    amber: "bg-[#FFFBEB] text-[#92400E] border-[#FCD34D]",
    emerald: "bg-[#F0FDF4] text-[#166534] border-[#86EFAC]",
    rose: "bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]",
    sky: "bg-[#F0F9FF] text-[#075985] border-[#7DD3FC]",
    slate: "bg-slate-100 text-slate-800 border-slate-300",
    outline: "bg-white text-slate-900 border-slate-300",
    indigo: "bg-indigo-50 text-indigo-800 border-indigo-200",
    blue: "bg-blue-50 text-blue-800 border-blue-200",
  };

  const dotStyles = {
    green: "bg-[#16A34A]",
    lime: "bg-[#65A30D]",
    coral: "bg-[#EA580C]",
    charcoal: "bg-[#4ADE80]",
    teal: "bg-[#16A34A]",
    amber: "bg-[#D97706]",
    emerald: "bg-[#16A34A]",
    rose: "bg-[#DC2626]",
    sky: "bg-[#0284C7]",
    slate: "bg-[#475569]",
    outline: "bg-[#0F172A]",
    indigo: "bg-[#4338CA]",
    blue: "bg-[#1D4ED8]",
  };

  return (
    <span
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2 shrink-0">
          {pulseDot && (
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                dotStyles[variant]
              )}
            />
          )}
          <span
            className={cn("relative inline-flex rounded-full h-2 w-2", dotStyles[variant])}
          />
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
