"use client";

import React from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-[#CBD5E1] bg-[#FAF9F5] max-w-md mx-auto",
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#15803D] mb-4 shadow-xs">
        {icon || <FolderOpen className="w-7 h-7 stroke-[1.75]" />}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-[#0F172A] mb-1.5 tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#64748B] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};
