"use client";

import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delayMs?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  delayMs = 150,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const show = () => {
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayMs);
  };

  const hide = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsVisible(false);
  };

  const positionStyles = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowStyles = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-[#0F172A] border-x-transparent border-b-transparent border-t-4 border-x-4 border-b-0",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-[#0F172A] border-x-transparent border-t-transparent border-b-4 border-x-4 border-t-0",
    left: "left-full top-1/2 -translate-y-1/2 border-l-[#0F172A] border-y-transparent border-r-transparent border-l-4 border-y-4 border-r-0",
    right: "right-full top-1/2 -translate-y-1/2 border-r-[#0F172A] border-y-transparent border-l-transparent border-r-4 border-y-4 border-l-0",
  };

  return (
    <div
      className="relative inline-flex items-center justify-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {isVisible && content && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 px-2.5 py-1 text-[11px] font-medium leading-tight text-white bg-[#0F172A] rounded-md shadow-md whitespace-nowrap pointer-events-none animate-scale-in",
            positionStyles[position],
            className
          )}
        >
          {content}
          <div className={cn("absolute w-0 h-0", arrowStyles[position])} />
        </div>
      )}
    </div>
  );
};
