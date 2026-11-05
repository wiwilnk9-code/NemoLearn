"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "card" | "avatar" | "button";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "default",
  ...props
}) => {
  const variantStyles = {
    default: "rounded-lg",
    card: "rounded-xl border border-[#E5E7EB]",
    avatar: "rounded-full",
    button: "rounded-xl h-10",
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-[#E5E7EB]/80",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
};

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className,
}) => {
  return (
    <div className={cn("space-y-2 w-full", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-3.5 bg-[#E5E7EB]/80 rounded-md animate-pulse",
            i === lines - 1 && lines > 1 ? "w-2/3" : "w-full"
          )}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        "p-5 rounded-xl border border-[#E5E7EB] bg-white space-y-4 shadow-card",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-center space-x-3">
        <Skeleton variant="avatar" className="w-10 h-10 shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
};
