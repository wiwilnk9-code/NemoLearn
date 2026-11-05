import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://epbepzjheexkeqivcoql.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwYmVwempoZWV4a2VxaXZjb3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3OTk2MDYsImV4cCI6MjEwOTM3NTYwNn0.OgUw0HkTKD6RWCYjqy0N78vtG9xFHIjaoPff6euaUE4";

// Cookie-aware storage adapter that syncs auth tokens & PKCE code verifiers between browser cookies and localStorage
const cookieStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      const match = document.cookie.match(new RegExp(`(?:^|; )${encodeURIComponent(key)}=([^;]*)`));
      if (match) return decodeURIComponent(match[1]);
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, value);
      const isSecure = window.location.protocol === "https:";
      document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; max-age=2592000; SameSite=Lax${
        isSecure ? "; Secure" : ""
      }`;
    } catch {}
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
      document.cookie = `${encodeURIComponent(key)}=; path=/; max-age=0; SameSite=Lax`;
    } catch {}
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: cookieStorage,
    flowType: "pkce",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
