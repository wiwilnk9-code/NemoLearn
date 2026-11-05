"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  variant?: "default" | "subtle" | "elevated" | "accent" | "coral" | "interactive";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, variant = "default", ...props }, ref) => {
    const variantStyles = {
      default: "bg-white border border-[#E2E8F0] shadow-sm",
      subtle: "bg-[#FAF9F5] border border-[#CBD5E1]",
      elevated: "bg-white border border-[#CBD5E1] shadow-md",
      accent: "bg-[#F0FDF4] border border-[#86EFAC]",
      coral: "bg-[#FFF7ED] border border-[#FDBA74]",
      interactive:
        "bg-white border border-[#E2E8F0] shadow-sm hover:border-[#16A34A] hover:shadow-md cursor-pointer active:scale-[0.99]",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl transition-all duration-150",
          variantStyles[variant],
          hoverable &&
            "hover:border-[#CBD5E1] hover:shadow-hover",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-5 sm:p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-base sm:text-lg font-bold leading-tight tracking-tight text-[#0F172A]",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs sm:text-sm text-[#475569] leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 sm:p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-5 sm:p-6 pt-0 border-t border-[#F3F4EE] mt-4",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";
