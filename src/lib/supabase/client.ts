import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://epbepzjheexkeqivcoql.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwYmVwempoZWV4a2VxaXZjb3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3OTk2MDYsImV4cCI6MjEwOTM3NTYwNn0.OgUw0HkTKD6RWCYjqy0N78vtG9xFHIjaoPff6euaUE4";

/**
 * Standard Supabase browser client with built-in SSR cookie synchronization.
 * Uses `@supabase/ssr` to ensure PKCE verifiers, session tokens, and refresh flows
 * are stored across browser cookies and readable by server route handlers.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

