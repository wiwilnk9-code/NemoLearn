"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GraduationCap, Menu, X, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const LandingNavbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard accessibility: dismiss mobile menu on Escape key
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  const navLinks = [
    { href: "#hero", label: "Beranda" },
    { href: "#tentang", label: "Tentang NemoLearn" },
    { href: "#fitur", label: "Fitur Unggulan" },
    { href: "#cara-kerja", label: "Cara Kerja" },
    { href: "#showcase", label: "Simulasi Ujian" },
    { href: "#keunggulan", label: "Keunggulan" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        isScrolled
          ? "bg-[#FAF9F5]/95 backdrop-blur-md border-b border-[#E2E0D8] shadow-xs"
          : "bg-[#FAF9F5] border-b border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="#hero"
          className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] rounded-xl p-1"
        >
          <div className="w-10 h-10 rounded-xl bg-[#15803D] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
            <GraduationCap className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-xl font-bold tracking-tight text-[#0F172A]">
                Nemo<span className="text-[#15803D]">Learn</span>
              </span>
              <span className="text-[10px] font-bold text-[#15803D] bg-[#F0FDF4] px-1.5 py-0.5 rounded border border-[#BBF7D0]">
                SMA
              </span>
            </div>
            <span className="text-[11px] font-medium text-[#64748B] -mt-0.5 hidden sm:inline">
              Platform Latihan Mandiri &amp; AI
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7" aria-label="Navigasi Utama">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#475569] hover:text-[#0F172A] hover:border-b-2 hover:border-[#15803D] pb-0.5 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-[#0F172A] hover:text-[#15803D] hover:bg-black/5 transition-colors"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-sm font-semibold shadow-xs hover:shadow-sm transition-all duration-150 flex items-center gap-2 active:scale-[0.98]"
          >
            <span>Coba Gratis</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0] sm:hidden"
          >
            Masuk
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-[#0F172A] hover:bg-black/5 transition-colors"
            aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu navigasi"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Over Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E2E0D8] bg-[#FAF9F5] px-4 pt-3 pb-6 space-y-4 animate-fade-in shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E0D8]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Navigasi Halaman
            </span>
            <span className="text-[11px] font-semibold text-[#15803D] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#BBF7D0]">
              Kurikulum Merdeka 2026
            </span>
          </div>
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-[#0F172A] hover:bg-black/5 hover:text-[#15803D] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-2 border-t border-[#E2E0D8] flex flex-col gap-2.5">
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-xl border border-[#CBD5E1] text-center text-sm font-semibold text-[#0F172A] hover:bg-black/5 transition-colors"
            >
              Masuk Akun
            </Link>
            <Link
              href="/register"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#15803D] text-white text-center text-sm font-semibold shadow-xs flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Coba Gratis Sekarang</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
