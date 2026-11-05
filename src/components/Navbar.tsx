"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@/types/user";
import {
  BookOpen,
  Sparkles,
  History,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  GraduationCap,
  ChevronDown,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
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
      router.push("/login");
    } catch (err) {
      console.error("Logout gagal:", err);
    }
  };

  const navLinks = [
    { href: "/", label: "Beranda", icon: BookOpen },
    { href: "/generator", label: "Buat Latihan", icon: Sparkles },
    { href: "/history", label: "Riwayat", icon: History },
    { href: "/profile", label: "Profil", icon: UserIcon },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#EAE7F2] text-[#302B43] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7957E8] to-[#6485F5] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-[#302B43] tracking-tight">
                Nemo<span className="text-[#7957E8]">Learn</span>
              </span>
              <span className="text-[10px] block uppercase tracking-wider font-semibold text-[#858096] -mt-1">
                SMA AI Learning
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#EDE5FF] text-[#7957E8] font-bold"
                      : "text-[#858096] hover:text-[#302B43] hover:bg-[#F7F6FC]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User & Role Switcher */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F7F6FC] border border-[#EAE7F2] shadow-xs transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-[#EDE5FF] text-[#7957E8] border border-[#DFCFFF] flex items-center justify-center font-bold text-xs">
                    {currentUser.displayName.charAt(0)}
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-[#302B43] leading-tight">
                      {currentUser.displayName}
                    </p>
                    <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded font-mono text-[10px] uppercase font-bold tracking-wider bg-[#EDE5FF] text-[#7957E8] border border-[#DFCFFF]">
                      {currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#858096] ml-1" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-[#EAE7F2] rounded-2xl shadow-xl py-2 z-50 text-[#302B43] animate-fade-in">
                    <div className="px-4 py-2.5 border-b border-[#EAE7F2]">
                      <p className="text-[11px] text-[#858096]">Masuk sebagai:</p>
                      <p className="text-sm font-bold text-[#302B43] truncate">{currentUser.displayName}</p>
                      <p className="text-xs text-[#858096] truncate">{currentUser.email}</p>
                    </div>

                    <div className="px-3 py-1.5 text-[11px] font-semibold text-[#858096] uppercase tracking-wider">
                      Uji Peran (Role RBAC Demo)
                    </div>
                    <button
                      onClick={() => handleSwitchUser("usr_pelajar_01")}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-[#F7F6FC] flex items-center justify-between ${
                        currentUser.role === "pelajar" ? "text-[#7957E8] font-bold bg-[#EDE5FF]/50" : ""
                      }`}
                    >
                      <span>Budi Santoso (Pelajar SMA)</span>
                      <span className="text-[10px] bg-[#EDE5FF] text-[#7957E8] px-1.5 py-0.5 rounded font-bold">Pelajar</span>
                    </button>
                    <button
                      onClick={() => handleSwitchUser("usr_guru_01")}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-[#F7F6FC] flex items-center justify-between ${
                        currentUser.role === "guru" ? "text-[#6485F5] font-bold bg-[#E7EEFF]/50" : ""
                      }`}
                    >
                      <span>Siti Rahmawati (Guru SMA)</span>
                      <span className="text-[10px] bg-[#E7EEFF] text-[#6485F5] px-1.5 py-0.5 rounded font-bold">Guru</span>
                    </button>
                    <button
                      onClick={() => handleSwitchUser("usr_admin_01")}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-[#F7F6FC] flex items-center justify-between ${
                        currentUser.role === "admin" ? "text-[#047857] font-bold bg-[#E8FAF4]/50" : ""
                      }`}
                    >
                      <span>Admin NemoLearn</span>
                      <span className="text-[10px] bg-[#E8FAF4] text-[#047857] px-1.5 py-0.5 rounded font-bold">Admin</span>
                    </button>
                    <button
                      onClick={() => handleSwitchUser("usr_owner_01")}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-[#F7F6FC] flex items-center justify-between ${
                        currentUser.role === "owner" ? "text-[#D97706] font-bold bg-[#FFF4E5]/50" : ""
                      }`}
                    >
                      <span>Dr. Hendra Kusuma (Owner)</span>
                      <span className="text-[10px] bg-[#FFF4E5] text-[#D97706] px-1.5 py-0.5 rounded font-bold">Owner</span>
                    </button>

                    {(currentUser.role === "admin" || currentUser.role === "owner") && (
                      <div className="border-t border-[#EAE7F2] mt-1 pt-1">
                        <Link
                          href="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-left px-4 py-2 text-xs text-[#7957E8] hover:bg-[#EDE5FF]/40 flex items-center justify-between font-bold"
                        >
                          <span>Buka Panel Admin</span>
                          <span className="text-[10px] bg-[#EDE5FF] text-[#7957E8] px-1.5 py-0.5 rounded">Dashboard</span>
                        </Link>
                      </div>
                    )}

                    <div className="border-t border-[#EAE7F2] mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-xs text-[#E11D48] hover:bg-[#FFF1F2] flex items-center gap-2 transition-colors font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Keluar (Logout)
                      </button>
                    </div>
                  </div>
                </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#7957E8] hover:bg-[#6744db] text-white shadow-sm transition-colors"
              >
                Masuk
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-[#F7F6FC] border border-[#EAE7F2] text-[#858096] hover:text-[#302B43]"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#EAE7F2] px-4 pt-2 pb-4 space-y-2 animate-fade-in">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                  isActive ? "bg-[#EDE5FF] text-[#7957E8] font-bold" : "text-[#858096] hover:bg-[#F7F6FC]"
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}

          {currentUser && (
            <div className="pt-2 border-t border-[#EAE7F2] space-y-2">
              <div className="px-3.5 py-2">
                <p className="text-xs text-[#858096]">Pengguna Aktif:</p>
                <p className="text-sm font-semibold text-[#302B43]">{currentUser.displayName}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#EDE5FF] text-[#7957E8] border border-[#DFCFFF]">
                  Peran: {currentUser.role}
                </span>
              </div>

              {(currentUser.role === "admin" || currentUser.role === "owner") && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-[#7957E8] bg-[#EDE5FF]/40 hover:bg-[#EDE5FF] transition-colors"
                >
                  <span>Buka Panel Admin</span>
                  <span className="text-[10px] bg-[#EDE5FF] text-[#7957E8] px-1.5 py-0.5 rounded border border-[#DFCFFF]">
                    Dashboard
                  </span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm text-[#E11D48] hover:bg-[#FFF1F2] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
