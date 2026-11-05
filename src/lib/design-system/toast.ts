/**
 * NemoLearn Toast Notification System — Event Dispatcher Singleton
 */

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

export type ToastListener = (toast: ToastMessage) => void;

export const TOAST_EVENT = "nemolearn:toast";

// In-memory subscriber list for environment-agnostic execution (Node/SSR/Browser)
const listeners: Set<ToastListener> = new Set();

export const toast = {
  subscribe(listener: ToastListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSubscriberCount(): number {
    return listeners.size;
  },

  show(message: string, type: ToastType = "info", title?: string, duration = 4000): ToastMessage {
    const item: ToastMessage = {
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      message,
      title,
      duration,
    };

    // Notify in-memory listeners
    listeners.forEach((listener) => {
      try {
        listener(item);
      } catch (err) {
        console.error("Toast listener error:", err);
      }
    });

    // Notify window if present (DOM browser context)
    if (typeof window !== "undefined") {
      const event = new CustomEvent(TOAST_EVENT, { detail: item });
      window.dispatchEvent(event);
    }

    return item;
  },

  success(message: string, title?: string, duration?: number): ToastMessage {
    return this.show(message, "success", title, duration);
  },

  error(message: string, title?: string, duration?: number): ToastMessage {
    return this.show(message, "error", title, duration);
  },

  warning(message: string, title?: string, duration?: number): ToastMessage {
    return this.show(message, "warning", title, duration);
  },

  info(message: string, title?: string, duration?: number): ToastMessage {
    return this.show(message, "info", title, duration);
  },
};
