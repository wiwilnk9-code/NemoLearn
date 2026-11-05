"use client";

import React from "react";
import { AdminBreadcrumb, BreadcrumbItem } from "@/components/admin/AdminBreadcrumb";
import { cn } from "@/lib/utils";

interface AdminContentContainerProps {
  children: React.ReactNode;
  breadcrumbItems?: BreadcrumbItem[];
  subsystemTag?: string;
  pulseLive?: boolean;
  showBreadcrumb?: boolean;
  className?: string;
}

export const AdminContentContainer: React.FC<AdminContentContainerProps> = ({
  children,
  breadcrumbItems,
  subsystemTag,
  pulseLive = false,
  showBreadcrumb = true,
  className,
}) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#EEF3F9] text-[#101828]">
      <div
        className={cn(
          "max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6",
          className
        )}
      >
        {showBreadcrumb && (
          <div className="pt-1 pb-2">
            <AdminBreadcrumb
              items={breadcrumbItems}
              subsystemTag={subsystemTag}
              pulseLive={pulseLive}
            />
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
