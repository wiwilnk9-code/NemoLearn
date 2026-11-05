"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: "primary" | "lime" | "coral" | "gradient";
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = "primary",
  size = "md",
  showLabel = false,
  label,
  animated = false,
  className,
  ...props
}) => {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  const sizeClasses = {
    xs: "h-1.5",
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const variantClasses = {
    primary: "bg-[#16A34A]",
    lime: "bg-[#84CC16]",
    coral: "bg-[#EA580C]",
    gradient: "bg-gradient-to-r from-[#16A34A] via-[#84CC16] to-[#EA580C]",
  };

  return (
    <div className={cn("w-full flex flex-col space-y-1.5", className)} {...props}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs font-semibold text-[#334155]">
          <span>{label}</span>
          <span className="font-mono text-[#0F172A]">{percentage}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn(
          "w-full bg-[#E5E7EB] rounded-full overflow-hidden relative",
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            variantClasses[variant],
            animated && "animate-pulse-subtle"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
