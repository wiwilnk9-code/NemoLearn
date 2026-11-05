"use client";

import React, { forwardRef } from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// --- REUSABLE BASE CARD ---
export interface AdminCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export const AdminCard = forwardRef<HTMLDivElement, AdminCardProps>(
  ({ className, hoverable = false, padding = "md", children, ...props }, ref) => {
    const paddingStyles = {
      none: "p-0",
      sm: "p-4",
      md: "p-5 sm:p-6",
      lg: "p-6 sm:p-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "bg-white border border-[#E2E8F0] rounded-xl shadow-sapphire-card transition-all duration-150",
          hoverable && "hover:bg-[#F8FAFC] hover:border-[#CBD5E1] hover:shadow-sapphire-hover cursor-pointer",
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AdminCard.displayName = "AdminCard";

export const AdminCardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
));
AdminCardHeader.displayName = "AdminCardHeader";

export const AdminCardTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-base font-bold leading-tight tracking-tight text-[#101828]",
      className
    )}
    {...props}
  />
));
AdminCardTitle.displayName = "AdminCardTitle";

export const AdminCardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-[#475467] leading-relaxed", className)}
    {...props}
  />
));
AdminCardDescription.displayName = "AdminCardDescription";

export const AdminCardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
));
AdminCardContent.displayName = "AdminCardContent";

export const AdminCardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center pt-4 border-t border-[#E2E8F0] text-xs text-[#475467]",
      className
    )}
    {...props}
  />
));
AdminCardFooter.displayName = "AdminCardFooter";

// --- SAPPHIRE 5-COLOR KPI METRIC CARD ---
export interface AdminMetricCardProps {
  title: string;
  value: string | number;
  icon?: any;
  color?: "blue" | "purple" | "cyan" | "emerald" | "coral";
  trend?: {
    value: string;
    label?: string;
    direction?: "up" | "down" | "neutral";
  };
  progressPercent?: number;
  className?: string;
  onClick?: () => void;
}

export const AdminMetricCard: React.FC<AdminMetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color = "blue",
  trend,
  progressPercent,
  className,
  onClick,
}) => {
  const colorStyles = {
    blue: {
      badgeBg: "bg-[#D1E9FF]",
      badgeText: "text-[#0B559F]",
      badgeBorder: "border-[#B2DDFF]",
      progressFill: "bg-[#0B559F]",
      trendText: "text-[#0B559F]",
    },
    purple: {
      badgeBg: "bg-[#E9D7FE]",
      badgeText: "text-[#53389E]",
      badgeBorder: "border-[#D6BBFB]",
      progressFill: "bg-[#53389E]",
      trendText: "text-[#53389E]",
    },
    cyan: {
      badgeBg: "bg-[#E0F2FE]",
      badgeText: "text-[#067BC2]",
      badgeBorder: "border-[#BAE6FD]",
      progressFill: "bg-[#067BC2]",
      trendText: "text-[#067BC2]",
    },
    emerald: {
      badgeBg: "bg-[#D1FADF]",
      badgeText: "text-[#0FA97A]",
      badgeBorder: "border-[#A6F4C5]",
      progressFill: "bg-[#0FA97A]",
      trendText: "text-[#0FA97A]",
    },
    coral: {
      badgeBg: "bg-[#FEE4E2]",
      badgeText: "text-[#D92D20]",
      badgeBorder: "border-[#FECDCA]",
      progressFill: "bg-[#F97066]",
      trendText: "text-[#D92D20]",
    },
  }[color];

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sapphire-card hover:shadow-sapphire-hover hover:bg-[#F8FAFC] transition-all flex flex-col justify-between group",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Header Row: Label & Icon */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-wider text-[#475467] font-semibold truncate pr-2">
          {title}
        </span>
        {Icon && (
          <span
            className={cn(
              "p-2 rounded-lg shrink-0 border transition-transform group-hover:scale-105",
              colorStyles.badgeBg,
              colorStyles.badgeText,
              colorStyles.badgeBorder
            )}
          >
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>

      {/* Metric Value & Trend */}
      <div>
        <div className="text-2xl font-sans font-bold text-[#101828] tracking-tight tabular-nums">
          {value}
        </div>

        {trend && (
          <div className="flex items-center gap-1.5 mt-2 text-xs font-mono">
            {trend.direction === "up" && (
              <ArrowUpRight className={cn("w-3.5 h-3.5", colorStyles.trendText)} />
            )}
            {trend.direction === "down" && (
              <ArrowDownRight className="w-3.5 h-3.5 text-[#D92D20]" />
            )}
            {trend.direction === "neutral" && (
              <Minus className="w-3.5 h-3.5 text-[#667085]" />
            )}
            <span className={cn("font-semibold", colorStyles.trendText)}>
              {trend.value}
            </span>
            {trend.label && (
              <span className="text-[#667085] text-[11px] truncate">{trend.label}</span>
            )}
          </div>
        )}
      </div>

      {/* Progress Track at bottom */}
      {progressPercent !== undefined && (
        <div className="w-full bg-[#EFF4FF] h-1.5 rounded-full mt-4 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", colorStyles.progressFill)}
            style={{ width: `${Math.min(Math.max(progressPercent, 0), 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};
