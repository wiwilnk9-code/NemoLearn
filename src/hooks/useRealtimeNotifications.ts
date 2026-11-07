"use client";

import { useSyncExternalStore, useCallback } from "react";
import { UserNotification } from "@/types/notification";
import { supabase } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface NotificationState {
  notifications: UserNotification[];
  unreadCount: number;
  loading: boolean;
}

const EMPTY_STATE: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
};

const INITIAL_LOADING_STATE: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: true,
};

// Module-level singleton store and channel lifecycle manager
interface StoreManager {
  userId: string | null;
  state: NotificationState;
  channel: RealtimeChannel | null;
  pollingTimer: NodeJS.Timeout | null;
  cleanupTimer: NodeJS.Timeout | null;
  subscribers: Set<() => void>;
  refCount: number;
}

const store: StoreManager = {
  userId: null,
  state: EMPTY_STATE,
  channel: null,
  pollingTimer: null,
  cleanupTimer: null,
  subscribers: new Set(),
  refCount: 0,
};

function notifySubscribers() {
  store.subscribers.forEach((callback) => {
    try {
      callback();
    } catch (err) {
      console.warn("[Notifications] Subscriber notify error:", err);
    }
  });
}

function teardownChannel() {
  if (store.channel) {
    try {
      supabase.removeChannel(store.channel);
    } catch (err) {
      console.warn("[Notifications] Error removing channel:", err);
    }
    store.channel = null;
  }
  if (store.pollingTimer) {
    clearInterval(store.pollingTimer);
    store.pollingTimer = null;
  }
}

async function fetchNotifications(userId: string) {
  try {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.notifications) && store.userId === userId) {
        store.state = {
          notifications: data.notifications,
          unreadCount: data.unreadCount ?? data.notifications.filter((n: any) => !n.isRead).length,
          loading: false,
        };
        notifySubscribers();
      }
    }
  } catch (err) {
    console.warn("[Notifications] Failed to fetch notifications:", err);
  } finally {
    if (store.userId === userId && store.state.loading) {
      store.state = { ...store.state, loading: false };
      notifySubscribers();
    }
  }
}

function subscribeUser(userId: string, onStoreChange: () => void): () => void {
  // Cancel pending cleanup if a component remounted or second component mounted
  if (store.cleanupTimer) {
    clearTimeout(store.cleanupTimer);
    store.cleanupTimer = null;
  }

  // If user changed, tear down previous user channel immediately
  if (store.userId !== userId) {
    teardownChannel();
    store.userId = userId;
    store.state = { ...INITIAL_LOADING_STATE };
    store.refCount = 0;
  }

  store.subscribers.add(onStoreChange);
  store.refCount++;

  // Initialize channel and initial fetch once for this userId
  if (!store.channel) {
    fetchNotifications(userId);

    // Clean up any lingering channel with this name to ensure .on() is never called after subscribe()
    try {
      const existing = supabase
        .getChannels()
        .find(
          (c) =>
            c.topic === `realtime:user-notifications:${userId}` ||
            c.topic === `user-notifications:${userId}`
        );
      if (existing) {
        supabase.removeChannel(existing);
      }
    } catch (err) {
      console.warn("[Notifications] Error cleaning up lingering channels:", err);
    }

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
          if (newNotif && store.userId === userId) {
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
            store.state = {
              ...store.state,
              notifications: [
                formatted,
                ...store.state.notifications.filter((n) => n.id !== formatted.id),
              ],
              unreadCount: store.state.unreadCount + 1,
            };
            notifySubscribers();
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
          if (store.userId === userId) {
            fetchNotifications(userId);
          }
        }
      );

    // Ensure .subscribe() is called strictly AFTER all .on() handlers are registered
    channel.subscribe((status, err) => {
      if (err) {
        console.warn(`[Notifications] Realtime subscribe error for ${userId}:`, err);
      }
    });

    store.channel = channel;

    // Periodic Polling Fallback (every 45s)
    store.pollingTimer = setInterval(() => {
      if (store.userId === userId) {
        fetchNotifications(userId);
      }
    }, 45000);
  }

  return () => {
    unsubscribeUser(userId, onStoreChange);
  };
}

function unsubscribeUser(userId: string, onStoreChange: () => void) {
  store.subscribers.delete(onStoreChange);
  store.refCount = Math.max(0, store.refCount - 1);

  // If no more mounted components reference this user, schedule cleanup with debounce
  if (store.refCount === 0) {
    if (store.cleanupTimer) {
      clearTimeout(store.cleanupTimer);
    }
    store.cleanupTimer = setTimeout(() => {
      if (store.refCount === 0) {
        teardownChannel();
        store.userId = null;
        store.state = EMPTY_STATE;
      }
    }, 500);
  }
}

async function markNotificationAsRead(userId: string, id: string) {
  if (store.userId !== userId) return;
  const now = new Date().toISOString();
  store.state = {
    ...store.state,
    notifications: store.state.notifications.map((n) =>
      n.id === id ? { ...n, isRead: true, readAt: now } : n
    ),
    unreadCount: Math.max(0, store.state.unreadCount - 1),
  };
  notifySubscribers();

  try {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  } catch (err) {
    console.warn("[Notifications] Failed to mark read on server:", err);
  }
}

async function markAllNotificationsAsRead(userId: string) {
  if (store.userId !== userId) return;
  const now = new Date().toISOString();
  store.state = {
    ...store.state,
    notifications: store.state.notifications.map((n) => ({ ...n, isRead: true, readAt: now })),
    unreadCount: 0,
  };
  notifySubscribers();

  try {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  } catch (err) {
    console.warn("[Notifications] Failed to mark all read on server:", err);
  }
}

function getStoreSnapshot(userId?: string): NotificationState {
  if (!userId) {
    return EMPTY_STATE;
  }
  if (store.userId === userId) {
    return store.state;
  }
  return INITIAL_LOADING_STATE;
}

export function useRealtimeNotifications(userId?: string) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!userId) return () => {};
      return subscribeUser(userId, onStoreChange);
    },
    [userId]
  );

  const getSnapshot = useCallback(() => {
    return getStoreSnapshot(userId);
  }, [userId]);

  const getServerSnapshot = useCallback(() => {
    return EMPTY_STATE;
  }, []);

  const storeState = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!userId) return;
      await markNotificationAsRead(userId, id);
    },
    [userId]
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    await markAllNotificationsAsRead(userId);
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    await fetchNotifications(userId);
  }, [userId]);

  return {
    notifications: storeState.notifications,
    unreadCount: storeState.unreadCount,
    loading: storeState.loading,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}
