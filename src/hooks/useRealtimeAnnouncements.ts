"use client";

import { useState, useEffect, useCallback } from "react";
import { Announcement } from "@/types/announcement";
import { supabase } from "@/lib/supabase/client";

const DISMISSED_KEY = "nemolearn_dismissed_announcements";

function getDismissedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissedId(id: string) {
  if (typeof window === "undefined") return;
  try {
    const set = getDismissedIds();
    set.add(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export function useRealtimeAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const filterUndismissed = useCallback((items: Announcement[]): Announcement[] => {
    const dismissed = getDismissedIds();
    const now = Date.now();
    return items.filter((a) => {
      if (dismissed.has(a.id)) return false;
      if (!a.isActive) return false;
      if (a.validUntil && new Date(a.validUntil).getTime() <= now) return false;
      return true;
    });
  }, []);

  const fetchActive = useCallback(async () => {
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.announcements)) {
          setAnnouncements(filterUndismissed(data.announcements));
        }
      }
    } catch (err) {
      console.warn("[Announcements] Failed to fetch active announcements:", err);
    } finally {
      setLoading(false);
    }
  }, [filterUndismissed]);

  useEffect(() => {
    fetchActive();

    // 1. Supabase Realtime Broadcast & Postgres Changes channel
    const channel = supabase
      .channel("nemo-announcements")
      .on("broadcast", { event: "NEW_ANNOUNCEMENT" }, (payload) => {
        const item = payload.payload as Announcement;
        if (item) {
          setAnnouncements((prev) => {
            const dismissed = getDismissedIds();
            if (dismissed.has(item.id)) return prev;
            return [item, ...prev.filter((a) => a.id !== item.id)];
          });
        }
      })
      .on("broadcast", { event: "UPDATE_ANNOUNCEMENT" }, (payload) => {
        const item = payload.payload as Announcement;
        if (item) {
          setAnnouncements((prev) => {
            if (!item.isActive) {
              return prev.filter((a) => a.id !== item.id);
            }
            return prev.map((a) => (a.id === item.id ? item : a));
          });
        }
      })
      .on("broadcast", { event: "DELETE_ANNOUNCEMENT" }, (payload) => {
        const { id } = (payload.payload || {}) as { id: string };
        if (id) {
          setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        }
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => {
          fetchActive();
        }
      )
      .subscribe();

    // 2. Periodic Polling Fallback (every 60s) in case WebSocket is suspended or dropped
    const interval = setInterval(fetchActive, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchActive]);

  const dismissAnnouncement = useCallback((id: string) => {
    saveDismissedId(id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return {
    announcements,
    loading,
    dismissAnnouncement,
    refresh: fetchActive,
  };
}
