"use client";

import { useState, useEffect, useCallback } from "react";
import { UserNotification } from "@/types/notification";
import { supabase } from "@/lib/supabase/client";

export function useRealtimeNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount ?? data.notifications.filter((n: any) => !n.isRead).length);
        }
      }
    } catch (err) {
      console.warn("[Notifications] Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();

    // 1. Supabase Realtime channel for user's notifications
    const channel = supabase
      .channel(`user-notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as any;
          if (newNotif) {
            const formatted: UserNotification = {
              id: newNotif.id,
              userId: newNotif.user_id,
              title: newNotif.title,
              message: newNotif.message,
              type: newNotif.type,
              isRead: Boolean(newNotif.is_read),
              readAt: newNotif.read_at,
              link: newNotif.link,
              createdAt: newNotif.created_at,
            };
            setNotifications((prev) => [formatted, ...prev.filter((n) => n.id !== formatted.id)]);
            setUnreadCount((c) => c + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    // 2. Periodic Polling Fallback (every 45s)
    const interval = setInterval(fetchNotifications, 45000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [userId, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.warn("[Notifications] Failed to mark read on server:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: now })));
    setUnreadCount(0);

    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch (err) {
      console.warn("[Notifications] Failed to mark all read on server:", err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
