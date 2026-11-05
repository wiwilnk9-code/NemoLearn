"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@/types/user";
import {
  LayoutDashboard,
  Sparkles,
  History,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  GraduationCap,
  ChevronDown,
  Layers,
  ShieldCheck,
  Check,
  Flame,
  HelpCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SoundToggle } from "@/components/SoundToggle";
import { cn } from "@/lib/utils";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Keyboard accessibility: dismiss mobile drawer and user menu on Escape key
  useEffect(() => {
    if (!isMobileOpen && !isUserMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsUserMenuOpen(false);
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, isUserMenuOpen]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, [pathname]);

  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setIsUserMenuOpen(false);
        setIsMobileOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error("Gagal beralih akun:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      setIsMobileOpen(false);
      router.push("/login");
    } catch (err) {
      console.error("Logout gagal:", err);
    }
  };

  const learningNavLinks = [
    { href: "/", label: "Beranda", icon: LayoutDashboard },
    {
      href: "/generator",
      label: "Buat Latihan",
      icon: Sparkles,
      badge: "AI",
      badgeVariant: "coral" as const,
    },
    { href: "/bank-soal", label: "Bank Soal SMA", icon: Layers },
    { href: "/history", label: "Riwayat & Evaluasi", icon: History },
  ];

  const accountNavLinks = [
    { href: "/profile", label: "Profil Saya", icon: UserIcon },
    { href: "/help", label: "Pusat Bantuan", icon: HelpCircle },
    ...(currentUser?.role === "admin" || currentUser?.role === "owner" || currentUser?.role === "guru"
      ? [
          {
            href: "/admin",
            label: "Panel Kontrol",
            icon: ShieldCheck,
            badge: currentUser.role === "guru" ? "Guru" : "Admin",
            badgeVariant: (currentUser.role === "guru" ? "sky" : "charcoal") as any,
          },
        ]
      : []),
  ];

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "guru":
        return "sky";
      case "admin":
      case "owner":
        return "charcoal";
      default:
        return "green";
    }
  };

  // Mobile Bottom Navigation items
  const mobileBottomItems = [
    { href: "/", label: "Beranda", icon: LayoutDashboard },
    { href: "/bank-soal", label: "Bank Soal", icon: Layers },
    {
      href: "/generator",
      label: "Latihan",
      icon: Sparkles,
      isCenterAction: true,
    },
    { href: "/history", label: "Riwayat", icon: History },
    { href: "/profile", label: "Profil", icon: UserIcon },
  ];

  // Hide student sidebar on admin panel, practice room, and login page
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/practice") ||
    pathname === "/login"
  ) {
    return null;
  }

  return (
    <>
      {/* 1. Mobile Top Navigation Header (< 1024px) */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 py-2.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[#16A34A] flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-[#0F172A] tracking-tight">
              Nemo<span className="text-[#16A34A]">Learn</span>
            </span>
            <span className="text-[10px] font-bold text-[#15803D] bg-[#F0FDF4] px-1.5 py-0.5 rounded border border-[#BBF7D0]">
              SMA
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <SoundToggle />
          {currentUser ? (
            <button
              onClick={() => setIsMobileOpen(true)}
              className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-[#FAF9F5] border border-[#E5E7EB] hover:border-[#16A34A] transition-colors"
            >
              <span className="text-xs font-semibold text-[#0F172A] max-w-[100px] truncate">
                {currentUser.displayName.split(" ")[0]}
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#15803D] font-bold text-xs flex items-center justify-center border border-[#BBF7D0]">
                {currentUser.displayName.charAt(0)}
              </div>
            </button>
          ) : (
            <Link
              href="/login"
              className="text-xs font-semibold text-[#16A34A] hover:text-[#15803D] px-3 py-1.5 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4]"
            >
              Masuk
            </Link>
          )}

          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-xl text-[#0F172A] hover:bg-[#F3F4EE] transition-colors"
            aria-label="Buka Menu"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* 2. Mobile Bottom Navigation Bar (< 1024px) */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] px-2 py-1.5 flex items-center justify-around shadow-lg"
      >
        {mobileBottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isCenterAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-5 group"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-all group-active:scale-95",
                    isActive
                      ? "bg-[#EA580C] shadow-[#EA580C]/30"
                      : "bg-[#16A34A] shadow-[#16A34A]/30 group-hover:bg-[#15803D]"
                  )}
                >
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold mt-1 transition-colors",
                    isActive ? "text-[#EA580C]" : "text-[#15803D]"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors relative min-w-[56px]",
                isActive
                  ? "text-[#16A34A] font-bold"
                  : "text-[#64748B] hover:text-[#0F172A]"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
              <span className="text-[10px] mt-0.5 leading-tight">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-1 h-1 rounded-full bg-[#16A34A]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* 3. Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 4. Desktop Sidebar Shell & Mobile Slide-over Drawer */}
      <aside
        aria-hidden={!isMobileOpen}
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-[#E5E7EB] flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0",
          isMobileOpen
            ? "translate-x-0 shadow-2xl visible"
            : "-translate-x-full lg:translate-x-0 invisible lg:visible"
        )}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header Brand */}
          <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
            <Link
              href="/"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#16A34A] flex items-center justify-center text-white shadow-xs group-hover:bg-[#15803D] transition-all group-active:scale-95">
                <GraduationCap className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-extrabold text-[#0F172A] tracking-tight leading-none">
                    Nemo<span className="text-[#16A34A]">Learn</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                  <span className="text-[11px] text-[#64748B] font-medium leading-none">
                    Kurikulum Merdeka SMA
                  </span>
                </div>
              </div>
            </Link>

            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F3F4EE]"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Group 1: Pembelajaran */}
          <div className="px-3 pt-4 pb-2 space-y-1">
            <p className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Pembelajaran
            </p>

            {learningNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all group",
                    isActive
                      ? "bg-[#F0FDF4] text-[#166534] font-bold shadow-xs border border-[#86EFAC]"
                      : "text-[#334155] hover:text-[#0F172A] hover:bg-[#FAF9F5]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isActive
                          ? "text-[#16A34A]"
                          : "text-[#64748B] group-hover:text-[#16A34A]"
                      )}
                    />
                    <span>{link.label}</span>
                  </div>

                  {link.badge && (
                    <Badge variant={link.badgeVariant} size="xs">
                      {link.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Group 2: Akun & Administrasi */}
          <div className="px-3 pt-2 pb-4 space-y-1 flex-1">
            <p className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Akun & Menu
            </p>

            {accountNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all group",
                    isActive
                      ? "bg-[#F0FDF4] text-[#166534] font-bold shadow-xs border border-[#86EFAC]"
                      : "text-[#334155] hover:text-[#0F172A] hover:bg-[#FAF9F5]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isActive
                          ? "text-[#16A34A]"
                          : "text-[#64748B] group-hover:text-[#16A34A]"
                      )}
                    />
                    <span>{link.label}</span>
                  </div>

                  {link.badge && (
                    <Badge variant={link.badgeVariant} size="xs">
                      {link.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Profile & Role Switcher Footer */}
          <div className="p-3 border-t border-[#E5E7EB] bg-[#FAF9F5] space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-medium text-[#64748B]">Efek Audio</span>
              <SoundToggle popoverPlacement="top" />
            </div>
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-white hover:bg-[#F0FDF4] border border-[#E5E7EB] hover:border-[#BBF7D0] transition-all text-left shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#15803D] font-bold text-xs flex items-center justify-center border border-[#BBF7D0] shrink-0">
                      {currentUser.displayName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-[#0F172A] truncate leading-tight">
                        {currentUser.displayName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <Badge variant={getRoleBadgeVariant(currentUser.role)} size="xs">
                          {currentUser.role.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-[#64748B] shrink-0 ml-1 transition-transform",
                      isUserMenuOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* Switcher Dropdown Popover */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-2 z-50 max-h-[70vh] overflow-y-auto animate-scale-in">
                    <div className="px-2.5 py-2 border-b border-[#F3F4EE] mb-1">
                      <p className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider">
                        Profil Aktif
                      </p>
                      <p className="text-xs font-bold text-[#0F172A] truncate">
                        {currentUser.displayName}
                      </p>
                      <p className="text-[11px] text-[#64748B] truncate">
                        {currentUser.email}
                      </p>
                    </div>

                    <p className="px-2.5 py-1 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                      Beralih Akun (Demo)
                    </p>

                    {[
                      { id: "usr_pelajar_01", name: "Budi (Pelajar)", role: "pelajar" },
                      { id: "usr_guru_01", name: "Siti (Guru)", role: "guru" },
                      { id: "usr_admin_01", name: "Admin Nemo", role: "admin" },
                      { id: "usr_owner_01", name: "Dr. Hendra (Owner)", role: "owner" },
                    ].map((demoUser) => {
                      const isCurrent = currentUser.role === demoUser.role;
                      return (
                        <button
                          key={demoUser.id}
                          type="button"
                          onClick={() => handleSwitchUser(demoUser.id)}
                          className={cn(
                            "w-full text-left px-2.5 py-2 text-xs rounded-xl flex items-center justify-between transition-colors",
                            isCurrent
                              ? "bg-[#F0FDF4] text-[#15803D] font-bold"
                              : "text-[#0F172A] hover:bg-[#FAF9F5]"
                          )}
                        >
                          <span>{demoUser.name}</span>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-[#16A34A]" />}
                        </button>
                      );
                    })}

                    <div className="border-t border-[#F3F4EE] mt-1.5 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-2.5 py-2 text-xs text-[#DC2626] hover:bg-[#FEF2F2] rounded-xl flex items-center gap-2 transition-colors font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Keluar Akun
                      </button>
                    </div>
                  </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="w-full h-10 rounded-xl text-xs font-semibold bg-[#16A34A] hover:bg-[#15803D] text-white flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                Masuk Akun
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
