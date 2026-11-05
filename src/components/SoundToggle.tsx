"use client";

import React, { useState, useEffect } from "react";
import {
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Check,
  X,
  Play,
} from "lucide-react";
import {
  getSoundSettings,
  setSoundSettings,
  subscribeSoundSettings,
  playSound,
  SoundSettings,
} from "@/lib/sound";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface SoundToggleProps {
  className?: string;
  showLabel?: boolean;
  popoverPlacement?: "bottom" | "top";
}

export const SoundToggle: React.FC<SoundToggleProps> = ({
  className,
  showLabel = false,
  popoverPlacement = "bottom",
}) => {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<SoundSettings>({
    enabled: false,
    volume: 0.5,
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSettings(getSoundSettings());
    const unsubscribe = subscribeSoundSettings((updated) => {
      setSettings(updated);
    });
    return () => unsubscribe();
  }, []);

  const isEnabled = mounted && settings.enabled;

  // Keyboard accessibility: dismiss popover on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleToggle = () => {
    const next = setSoundSettings({ enabled: !settings.enabled });
    if (next.enabled) {
      playSound("select");
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setSoundSettings({ volume: vol });
  };

  const handleTestSound = () => {
    playSound("milestone");
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Pengaturan Efek Suara"
        className={cn(
          "flex items-center gap-2 p-2 rounded-xl transition-all cursor-pointer border select-none focus:outline-hidden",
          isEnabled
            ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A] hover:bg-[#DCFCE7]"
            : "bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
        )}
        title={
          mounted
            ? isEnabled
              ? `Efek Suara Aktif (${Math.round(settings.volume * 100)}%)`
              : "Efek Suara Nonaktif"
            : "Efek Suara Nonaktif"
        }
      >
        {isEnabled ? (
          <Volume2 className="w-4 h-4 animate-pulse-subtle" />
        ) : (
          <VolumeX className="w-4 h-4" />
        )}
        {showLabel && (
          <span className="text-xs font-semibold">
            {isEnabled ? "Suara Aktif" : "Suara Nonaktif"}
          </span>
        )}
      </button>

      {/* Audio Settings Popover Dialog */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={cn(
              "absolute z-50 w-72 rounded-3xl bg-white border border-[#E2E8F0] p-4 shadow-xl space-y-4 animate-scale-in text-[#0F172A]",
              popoverPlacement === "top"
                ? "left-0 bottom-full mb-2"
                : "right-0 top-full mt-2"
            )}
          >
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-[#0F172A]">
                  Efek Suara Gamifikasi
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[#0F172A]">Aktifkan Suara</p>
                <p className="text-[10px] text-[#64748B]">Feedback taktil & kuis</p>
              </div>
              <button
                type="button"
                onClick={handleToggle}
                className={cn(
                  "w-11 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-hidden",
                  settings.enabled ? "bg-[#16A34A]" : "bg-[#CBD5E1]"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full bg-white transition-transform transform shadow-xs absolute top-1",
                    settings.enabled ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>

            {/* Volume Slider (if enabled) */}
            {settings.enabled && (
              <div className="space-y-2 pt-1 animate-fade-in">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#64748B]">Tingkat Volume:</span>
                  <span className="font-mono font-bold text-[#16A34A]">
                    {Math.round(settings.volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={settings.volume}
                  onChange={handleVolumeChange}
                  className="w-full accent-[#16A34A] cursor-pointer"
                />

                {/* Preview Button */}
                <div className="pt-1">
                  <Button
                    variant="outline"
                    size="xs"
                    className="w-full rounded-xl"
                    onClick={handleTestSound}
                    leftIcon={<Play className="w-3 h-3 text-[#16A34A]" />}
                  >
                    Uji Bunyi Suara
                  </Button>
                </div>
              </div>
            )}

            <p className="text-[10px] text-[#94A3B8] leading-relaxed italic border-t border-[#F1F5F9] pt-2">
              Sintesis AudioContext Web Audio API murni. Bebas kuota dan offline.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
