import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  cleanDistDir: true,
  experimental: {
    webpackBuildWorker: false,
  },
  eslint: {
    // Ignore ESLint during builds to prevent non-interactive terminal prompt hangs
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Verified separately via tsc --noEmit to avoid worker IPC deadlocks
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // Disable disk packfile caching to prevent OneDrive errno -4094 write lock collisions
    config.cache = false;
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "src"),
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob: https://lh3.googleusercontent.com",
              "connect-src 'self' https://epbepzjheexkeqivcoql.supabase.co wss://epbepzjheexkeqivcoql.supabase.co https://generativelanguage.googleapis.com https://api.openai.com https://api.groq.com https://openrouter.ai https://accounts.google.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.google.com https://*.supabase.co",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
