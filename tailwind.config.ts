import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        display: [
          '"Space Grotesk"',
          '"Plus Jakarta Sans"',
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      colors: {
        // --- NEW VISUAL IDENTITY: Fresh Botanical Green & Zesty Lime ---
        primary: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          400: "#4ADE80",
          500: "#22C55E",
          600: "#16A34A", // Base Primary
          700: "#15803D", // Primary Hover / Focused
          800: "#166534",
          900: "#14532D",
          950: "#052E16", // Deep Dark Green Charcoal
          DEFAULT: "#16A34A",
        },
        lime: {
          50: "#F7FEE7",
          100: "#ECFCCB",
          200: "#D9F99D",
          300: "#BEF264",
          400: "#A3E635",
          500: "#84CC16",
          600: "#65A30D",
          700: "#4D7C0F",
          DEFAULT: "#84CC16",
        },
        coral: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C", // Base Coral / Warm Orange
          700: "#C2410C",
          800: "#9A3412",
          DEFAULT: "#EA580C",
        },
        // Brand alias mapped to Fresh Green
        brand: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          400: "#4ADE80",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
          800: "#166534",
          900: "#14532D",
          950: "#052E16",
          DEFAULT: "#16A34A",
        },
        // Feedback & Secondary Accents
        accent: {
          amber: "#D97706",
          "amber-hover": "#B45309",
          "amber-soft": "#FFFBEB",
          "amber-border": "#FDE68A",
          coral: "#EA580C",
          "coral-hover": "#C2410C",
          "coral-soft": "#FFF7ED",
          "coral-border": "#FED7AA",
          lime: "#84CC16",
          "lime-soft": "#F7FEE7",
          "lime-border": "#D9F99D",
          emerald: "#16A34A",
          "emerald-hover": "#15803D",
          "emerald-soft": "#F0FDF4",
          "emerald-border": "#BBF7D0",
          rose: "#DC2626",
          "rose-hover": "#B91C1C",
          "rose-soft": "#FEF2F2",
          "rose-border": "#FECACA",
          sky: "#0284C7",
          "sky-hover": "#0369A1",
          "sky-soft": "#F0F9FF",
          "sky-border": "#BAE6FD",
        },
        surface: {
          ground: "#FAF9F5",       // Warm off-white / natural cream
          card: "#FFFFFF",         // Clean crisp white
          subtle: "#F3F4EE",       // Warm subtle container
          tinted: "#F0FDF4",       // Fresh green tinted
          border: "#E5E7EB",       // Hairline border
          "border-hover": "#CBD5E1",
          "border-active": "#16A34A",
          ink: "#0F172A",          // Deep slate charcoal text
          secondary: "#334155",
          muted: "#64748B",
        },
        // Legacy compatibility mappings
        nemo: {
          bg: "#FAF9F5",
          card: "#FFFFFF",
          teal: "#16A34A",
          tealPastel: "#F0FDF4",
          tealBorder: "#BBF7D0",
          navy: "#0F172A",
          slate: "#334155",
          gray: "#64748B",
          border: "#E5E7EB",
          amber: "#D97706",
          amberBg: "#FFFBEB",
          emerald: "#16A34A",
          emeraldBg: "#F0FDF4",
          rose: "#DC2626",
          roseBg: "#FEF2F2",
          sky: "#0284C7",
          skyBg: "#F0F9FF",
        },
        // --- SAPPHIRE: Clean Analytics Light Design System (Admin & Owner Dashboard) ---
        sapphire: {
          ground: "#EEF3F9",       // Cool Ice Blue canvas
          surface: "#F8F9FF",      // Surface tint
          card: "#FFFFFF",         // Crisp white containers
          border: "#E2E8F0",       // Hairline border
          "border-subtle": "#EFF4FF",
          "border-strong": "#CBD5E1",
          text: {
            main: "#101828",       // High contrast primary text
            variant: "#475467",    // Secondary body text
            muted: "#667085",      // Dim labels & axes
          },
          primary: {
            DEFAULT: "#0B559F",    // Ocean Blue
            dim: "#094582",
            container: "#D1E9FF",
            "on-container": "#062C54",
          },
          secondary: {
            DEFAULT: "#53389E",    // Royal Purple
            dim: "#42307D",
            container: "#E9D7FE",
            "on-container": "#2C1C5F",
          },
          tertiary: {
            DEFAULT: "#067BC2",    // Cerulean Cyan
            dim: "#026AA2",
            container: "#E0F2FE",
            "on-container": "#04395E",
          },
          success: {
            DEFAULT: "#0FA97A",    // Emerald Green
            dim: "#08875D",
            container: "#D1FADF",
            "on-container": "#054F38",
          },
          error: {
            DEFAULT: "#F97066",    // Coral Red
            dim: "#D92D20",
            container: "#FEE4E2",
            "on-container": "#7A271A",
          },
          dark: {
            surface: "#0F172A",
            navy: "#18428C",
            deep: "#020F1F",
          },
        },
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
        hover: "0 6px 16px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -2px rgba(15, 23, 42, 0.04)",
        subtle: "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
        "sapphire-card": "0 2px 6px rgba(16, 24, 40, 0.04), 0 1px 2px rgba(16, 24, 40, 0.02)",
        "sapphire-hover": "0 6px 16px rgba(16, 24, 40, 0.06), 0 2px 6px rgba(16, 24, 40, 0.03)",
        "sapphire-dropdown": "0 10px 25px -5px rgba(16, 24, 40, 0.1), 0 8px 10px -6px rgba(16, 24, 40, 0.05)",
      },
      backdropBlur: {
        xs: "2px",
      },
      borderRadius: {
        "sm": "0.375rem",
        "md": "0.5rem",
        "lg": "0.75rem",
        "xl": "1rem",
        "2xl": "1.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-subtle": "pulseSubtle 2s infinite ease-in-out",
        "shimmer": "shimmer 1.5s infinite linear",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
