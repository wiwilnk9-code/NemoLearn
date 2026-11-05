"use client";

import React from "react";
import {
  Globe,
  Bot,
  Gauge,
  AlertTriangle,
  Megaphone,
  ShieldCheck,
} from "lucide-react";

export type SettingsTabId =
  | "tab-general"
  | "tab-ai"
  | "tab-ratelimit"
  | "tab-maintenance"
  | "tab-broadcast"
  | "tab-security";

interface SettingsTabNavProps {
  activeTab: SettingsTabId;
  onTabChange: (tabId: SettingsTabId) => void;
  maintenanceActive: boolean;
  broadcastActive: boolean;
}

export const SettingsTabNav: React.FC<SettingsTabNavProps> = ({
  activeTab,
  onTabChange,
  maintenanceActive,
  broadcastActive,
}) => {
  const tabs: Array<{
    id: SettingsTabId;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
  }> = [
    {
      id: "tab-general",
      label: "Umum & Platform",
      icon: <Globe className="w-4 h-4 text-slate-500" />,
    },
    {
      id: "tab-ai",
      label: "AI Providers & Routing",
      icon: <Bot className="w-4 h-4 text-blue-600" />,
    },
    {
      id: "tab-ratelimit",
      label: "Batas Penggunaan (Rate Limits)",
      icon: <Gauge className="w-4 h-4 text-indigo-600" />,
    },
    {
      id: "tab-maintenance",
      label: "Mode Pemeliharaan",
      icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
      badge: maintenanceActive ? "LOCKDOWN" : undefined,
      badgeColor: "bg-red-500 text-white",
    },
    {
      id: "tab-broadcast",
      label: "Banner Pengumuman",
      icon: <Megaphone className="w-4 h-4 text-emerald-600" />,
      badge: broadcastActive ? "LIVE" : undefined,
      badgeColor: "bg-emerald-500 text-white",
    },
    {
      id: "tab-security",
      label: "Keamanan & Autentikasi",
      icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
    },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
              isActive
                ? "bg-white text-slate-900 font-semibold shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider ${tab.badgeColor}`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
