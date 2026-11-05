/**
 * NemoLearn Design System — Tokens, Scales & Component Style Contracts
 * Identitas Visual Baru: Fresh Botanical Green, Zesty Lime, Warm Cream Ground, Deep Charcoal Pine & Solar Coral
 */

export const PALETTE = {
  // Primary: Fresh Botanical Green (Segar, modern, edukatif, dan ramah belajar)
  primary: {
    50: "#F0FDF4",
    100: "#DCFCE7",
    200: "#BBF7D0",
    300: "#86EFAC",
    400: "#4ADE80",
    500: "#22C55E",
    600: "#16A34A", // Base Primary
    700: "#15803D", // Primary Hover / Focused
    800: "#166534", // Primary Active
    900: "#14532D",
    950: "#052E16", // Deep Dark Green Charcoal
  },

  // Zesty Lime: Memberikan energi playful & interaktif pada badge dan highlights
  lime: {
    50: "#F7FEE7",
    100: "#ECFCCB",
    200: "#D9F99D",
    300: "#BEF264",
    400: "#A3E635",
    500: "#84CC16", // Base Lime
    600: "#65A30D",
    700: "#4D7C0F",
  },

  // Accent: Solar Coral & Warm Tangerine (Aksen HOTS, streaks, batas waktu, dan CTAs dinamis)
  coral: {
    50: "#FFF7ED",
    100: "#FFEDD5",
    200: "#FED7AA",
    300: "#FDBA74",
    400: "#FB923C",
    500: "#F97316",
    600: "#EA580C", // Base Coral Accent
    700: "#C2410C",
    800: "#9A3412",
  },

  // Surfaces: Warm Off-White / Natural Cream Canvas & Crisp Surface Cards
  surface: {
    ground: "#FAF9F5",      // Latar belakang warm off-white (nyaman dan anti silau)
    card: "#FFFFFF",        // Kartu materi, soal, modal
    subtle: "#F3F4EE",      // Secondary container / warm subtle card
    tinted: "#F0FDF4",      // Fresh green tinted background (pilihan terpilih, baris aktif)
    tintedLime: "#F7FEE7",  // Lime tinted background
    tintedCoral: "#FFF7ED", // Coral tinted background (soal HOTS)
    border: "#E5E7EB",      // Garis batas hairline halus
    borderHover: "#CBD5E1", // Garis batas saat hover
    borderFocus: "#16A34A", // Outline fokus keyboard
  },

  // Typography Ink: High-Contrast Charcoal Slate Keterbacaan Tinggi
  text: {
    primary: "#0F172A",    // Judul & stem teks soal (Dark Charcoal)
    secondary: "#334155",  // Body text, opsi jawaban, deskripsi materi
    muted: "#64748B",      // Helper text, metadata waktu, nomor soal
    subtle: "#94A3B8",     // Placeholder input & ikon sekunder
    inverse: "#FFFFFF",    // Teks kontras di atas tombol solid
    forest: "#166534",     // Aksen teks hijau tua
    coral: "#C2410C",      // Aksen teks coral HOTS
  },

  // Status Tokens: Jelas, Aksesibel, dan Tegas
  status: {
    success: {
      light: "#F0FDF4",
      border: "#BBF7D0",
      solid: "#16A34A",
      dark: "#14532D",
      text: "#15803D",
    },
    error: {
      light: "#FEF2F2",
      border: "#FECACA",
      solid: "#DC2626",
      dark: "#991B1B",
      text: "#991B1B",
    },
    warning: {
      light: "#FFFBEB",
      border: "#FDE68A",
      solid: "#D97706",
      dark: "#92400E",
      text: "#92400E",
    },
    info: {
      light: "#F0F9FF",
      border: "#BAE6FD",
      solid: "#0284C7",
      dark: "#075985",
      text: "#075985",
    },
  },
} as const;

export const TYPOGRAPHY = {
  fontFamily: {
    sans: 'var(--font-sans, "Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
    mono: 'var(--font-mono, "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)',
  },
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }],        // 12px
    sm: ["0.875rem", { lineHeight: "1.25rem" }],    // 14px
    base: ["1rem", { lineHeight: "1.5rem" }],       // 16px
    lg: ["1.125rem", { lineHeight: "1.75rem" }],    // 18px
    xl: ["1.25rem", { lineHeight: "1.75rem" }],     // 20px
    "2xl": ["1.5rem", { lineHeight: "2rem" }],      // 24px
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px
    "4xl": ["2.25rem", { lineHeight: "2.5rem" }],   // 36px
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },
  letterSpacing: {
    tight: "-0.025em",
    normal: "0em",
    wide: "0.025em",
    wider: "0.05em",
  },
} as const;

export const SPACING = {
  0.5: "0.125rem", // 2px
  1: "0.25rem",    // 4px
  1.5: "0.375rem", // 6px
  2: "0.5rem",     // 8px
  2.5: "0.625rem", // 10px
  3: "0.75rem",    // 12px
  4: "1rem",       // 16px
  5: "1.25rem",    // 20px
  6: "1.5rem",     // 24px
  8: "2rem",       // 32px
  10: "2.5rem",    // 40px
  12: "3rem",      // 48px
  16: "4rem",      // 64px
} as const;

export const RADII = {
  sm: "0.375rem", // 6px - badges & small tags
  md: "0.5rem",   // 8px - inputs, buttons
  lg: "0.75rem",  // 12px - cards, dialogs
  xl: "1rem",     // 16px - feature containers
  "2xl": "1.5rem",// 24px - hero cards, big modals
  full: "9999px", // pills, circular controls
} as const;

export const SHADOWS = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)",
  card: "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
  hover: "0 6px 16px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -2px rgba(15, 23, 42, 0.04)",
  subtle: "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
} as const;

export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  toast: 1060,
  tooltip: 1070,
} as const;

// Button Component Variants
export const BUTTON_VARIANTS = {
  primary: "bg-[#16A34A] hover:bg-[#15803D] active:bg-[#166534] text-white shadow-sm focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2",
  secondary: "bg-[#F0FDF4] hover:bg-[#DCFCE7] active:bg-[#BBF7D0] text-[#15803D] border border-[#BBF7D0] focus-visible:ring-2 focus-visible:ring-[#16A34A]",
  tertiary: "bg-transparent hover:bg-[#F3F4EE] active:bg-[#E5E7EB] text-[#334155] hover:text-[#0F172A] focus-visible:ring-2 focus-visible:ring-[#16A34A]",
  coral: "bg-[#EA580C] hover:bg-[#C2410C] active:bg-[#9A3412] text-white shadow-sm focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:ring-offset-2",
  outline: "bg-white hover:bg-[#FAF9F5] active:bg-[#F3F4EE] text-[#0F172A] border border-[#E5E7EB] hover:border-[#16A34A] hover:text-[#16A34A]",
  ghost: "bg-transparent hover:bg-[#F3F4EE] text-[#334155] hover:text-[#0F172A]",
  danger: "bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white shadow-sm focus-visible:ring-2 focus-visible:ring-[#DC2626]",
  success: "bg-[#16A34A] hover:bg-[#15803D] active:bg-[#166534] text-white shadow-sm",
} as const;

export const BUTTON_SIZES = {
  xs: "px-2.5 py-1 text-xs rounded-md font-medium",
  sm: "px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium",
  md: "px-4 py-2.5 text-sm rounded-xl font-medium",
  lg: "px-5 py-3 text-base rounded-xl font-semibold",
} as const;

// Badge Component Variants
export const BADGE_VARIANTS = {
  green: "bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]",
  lime: "bg-[#F7FEE7] text-[#4D7C0F] border border-[#D9F99D]",
  coral: "bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA]",
  charcoal: "bg-[#052E16] text-[#BBF7D0] border border-[#14532D]",
  sky: "bg-[#F0F9FF] text-[#0369A1] border border-[#BAE6FD]",
  rose: "bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]",
  amber: "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]",
  outline: "bg-transparent text-[#334155] border border-[#CBD5E1]",
  // Legacy alias
  teal: "bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]",
  emerald: "bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]",
  slate: "bg-[#F8FAFC] text-[#334155] border border-[#E2E8F0]",
} as const;

export const BADGE_SIZES = {
  xs: "text-[10px] px-1.5 py-0.5",
  sm: "text-xs px-2.5 py-0.5",
  md: "text-sm px-3 py-1",
} as const;

// Card Component Variants
export const CARD_VARIANTS = {
  default: "bg-white border border-[#E5E7EB] shadow-card",
  subtle: "bg-[#FAF9F5] border border-[#E5E7EB]",
  elevated: "bg-white border border-[#E5E7EB] shadow-md",
  accent: "bg-[#F0FDF4] border border-[#BBF7D0] shadow-sm",
  coral: "bg-[#FFF7ED] border border-[#FED7AA] shadow-sm",
  interactive: "bg-white border border-[#E5E7EB] shadow-card hover:shadow-hover hover:border-[#16A34A]/50 transition-all duration-200 cursor-pointer",
} as const;

// Helper functions to resolve utility classes
export function getButtonClasses(
  variant: keyof typeof BUTTON_VARIANTS = "primary",
  size: keyof typeof BUTTON_SIZES = "md"
): string {
  return `${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]}`;
}

export function getBadgeClasses(
  variant: keyof typeof BADGE_VARIANTS = "green",
  size: keyof typeof BADGE_SIZES = "sm"
): string {
  return `${BADGE_VARIANTS[variant]} ${BADGE_SIZES[size]}`;
}
