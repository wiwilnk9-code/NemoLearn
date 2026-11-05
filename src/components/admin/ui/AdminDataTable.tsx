"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface AdminDataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor?: (row: T, index: number) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  emptySubtitle?: string;
  // Pagination
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function AdminDataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = "Belum Ada Data Tersedia",
  emptySubtitle = "Tidak ada rekaman data yang sesuai dengan kueri filter Anda saat ini.",
  currentPage = 1,
  totalPages = 1,
  totalItems,
  pageSize = 10,
  onPageChange,
  className,
}: AdminDataTableProps<T>) {
  const getAlignClass = (align?: "left" | "center" | "right") => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      case "left":
      default:
        return "text-left";
    }
  };

  const startEntry = totalItems ? (currentPage - 1) * pageSize + 1 : 1;
  const endEntry = totalItems ? Math.min(currentPage * pageSize, totalItems) : data.length;

  return (
    <div
      className={cn(
        "bg-white border border-[#E2E8F0] rounded-xl shadow-sapphire-card overflow-hidden",
        className
      )}
    >
      {/* Table Container with Horizontal Scroll */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Header */}
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "px-4 sm:px-5 py-3.5 text-[11px] font-mono uppercase tracking-wider font-semibold text-[#475467] select-none whitespace-nowrap",
                    getAlignClass(col.align),
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-[#E2E8F0] text-xs text-[#101828]">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-16 text-center text-[#667085]"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0B559F]" />
                    <p className="font-medium text-xs text-[#475467]">
                      Memuat rekaman data...
                    </p>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-16 text-center text-[#667085]"
                >
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-1.5">
                    <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] text-[#0B559F] flex items-center justify-center mb-1">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-sm text-[#101828]">
                      {emptyMessage}
                    </p>
                    <p className="text-[11px] text-[#667085] leading-relaxed">
                      {emptySubtitle}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const rowKey = keyExtractor
                  ? keyExtractor(row, rowIndex)
                  : (row as any).id || rowIndex;

                return (
                  <tr
                    key={rowKey}
                    className="hover:bg-[#F8FAFC] transition-colors group"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 sm:px-5 py-3.5 whitespace-nowrap leading-tight",
                          getAlignClass(col.align),
                          col.className
                        )}
                      >
                        {col.render
                          ? col.render(row, rowIndex)
                          : (row as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && data.length > 0 && onPageChange && totalPages > 1 && (
        <div className="px-4 sm:px-5 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#475467] font-mono">
          <div>
            Menampilkan{" "}
            <span className="font-semibold text-[#101828] tabular-nums">
              {startEntry}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-[#101828] tabular-nums">
              {endEntry}
            </span>{" "}
            {totalItems !== undefined && (
              <>
                dari{" "}
                <span className="font-semibold text-[#101828] tabular-nums">
                  {totalItems.toLocaleString()}
                </span>{" "}
                entri
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              aria-label="Halaman Sebelumnya"
              className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#475467] hover:text-[#101828] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNumber = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNumber = currentPage - 2 + i;
                  if (pageNumber > totalPages) pageNumber = totalPages - (4 - i);
                }

                const isActive = pageNumber === currentPage;

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => onPageChange(pageNumber)}
                    className={cn(
                      "w-7 h-7 rounded-lg text-xs font-semibold tabular-nums transition-colors flex items-center justify-center",
                      isActive
                        ? "bg-[#0B559F] text-white shadow-xs"
                        : "bg-white border border-[#E2E8F0] text-[#475467] hover:bg-[#F1F5F9] hover:text-[#101828]"
                    )}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              aria-label="Halaman Berikutnya"
              className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#475467] hover:text-[#101828] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
