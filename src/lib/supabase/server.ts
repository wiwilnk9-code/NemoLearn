import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://epbepzjheexkeqivcoql.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwYmVwempoZWV4a2VxaXZjb3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3OTk2MDYsImV4cCI6MjEwOTM3NTYwNn0.OgUw0HkTKD6RWCYjqy0N78vtG9xFHIjaoPff6euaUE4";

export const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Creates a scoped Supabase client with cookie storage support for PKCE token exchange in server route handlers
 */
export function createServerSupabaseClient(cookieHeader?: string | null) {
  const cookieMap: Record<string, string> = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach((part) => {
      const [k, ...v] = part.trim().split("=");
      if (k) cookieMap[decodeURIComponent(k)] = decodeURIComponent(v.join("="));
    });
  }

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwYmVwempoZWV4a2VxaXZjb3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3OTk2MDYsImV4cCI6MjEwOTM3NTYwNn0.OgUw0HkTKD6RWCYjqy0N78vtG9xFHIjaoPff6euaUE4";

  return createClient(supabaseUrl, anonKey, {
    auth: {
      flowType: "pkce",
      persistSession: false,
      storage: {
        getItem: (key: string) => cookieMap[key] || null,
        setItem: () => {},
        removeItem: () => {},
      },
    },
  });
}
