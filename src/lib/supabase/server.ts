import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://epbepzjheexkeqivcoql.supabase.co";
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwYmVwempoZWV4a2VxaXZjb3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3OTk2MDYsImV4cCI6MjEwOTM3NTYwNn0.OgUw0HkTKD6RWCYjqy0N78vtG9xFHIjaoPff6euaUE4";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

/**
 * Supabase client for privileged administrative server-side operations.
 */
export const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Creates a scoped Supabase server client with `@supabase/ssr` cookie storage support.
 * Guarantees standard cookie naming, chunking, and PKCE code verifier compatibility with `createBrowserClient`.
 */
export function createServerSupabaseClient(
  cookieOptions?:
    | CookieMethodsServer
    | {
        cookies?: {
          getAll?: () => Array<{ name: string; value: string }>;
          setAll?: (cookiesToSet: Array<{ name: string; value: string; options: any }>) => void;
        };
        cookieHeader?: string | null;
        onSetCookie?: (name: string, value: string, options: any) => void;
      }
    | string
    | null
) {
  // If direct CookieMethodsServer (getAll & setAll) is provided
  if (
    cookieOptions &&
    typeof cookieOptions === "object" &&
    "getAll" in cookieOptions &&
    typeof (cookieOptions as any).getAll === "function"
  ) {
    return createServerClient(supabaseUrl, anonKey, {
      cookies: cookieOptions as CookieMethodsServer,
    });
  }

  // If wrapped in { cookies: { getAll, setAll } }
  if (
    cookieOptions &&
    typeof cookieOptions === "object" &&
    "cookies" in cookieOptions &&
    cookieOptions.cookies &&
    typeof cookieOptions.cookies.getAll === "function"
  ) {
    return createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll: () => cookieOptions.cookies!.getAll!(),
        setAll: (cookiesToSet) => cookieOptions.cookies?.setAll?.(cookiesToSet),
      },
    });
  }

  // If a cookie header string or { cookieHeader, onSetCookie } was provided
  const headerStr =
    typeof cookieOptions === "string"
      ? cookieOptions
      : (cookieOptions as any)?.cookieHeader ?? null;
  const onSet = (cookieOptions as any)?.onSetCookie;

  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        if (!headerStr) return [];
        return headerStr
          .split(";")
          .map((part: string) => {
            const [rawKey, ...rawVal] = part.trim().split("=");
            return {
              name: decodeURIComponent(rawKey || ""),
              value: decodeURIComponent(rawVal.join("=") || ""),
            };
          })
          .filter((c: { name: string }) => Boolean(c.name));
      },
      setAll(cookiesToSet) {
        if (onSet) {
          cookiesToSet.forEach(({ name, value, options }) => onSet(name, value, options));
        }
      },
    },
  });
}

