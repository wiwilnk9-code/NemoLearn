import { describe, it } from "node:test";
import assert from "node:assert";
import {
  PALETTE,
  TYPOGRAPHY,
  SPACING,
  RADII,
  SHADOWS,
  Z_INDEX,
  BUTTON_VARIANTS,
  BUTTON_SIZES,
  BADGE_VARIANTS,
  BADGE_SIZES,
  CARD_VARIANTS,
  getButtonClasses,
  getBadgeClasses,
  toast,
} from "@/lib/design-system";

describe("NemoLearn Design System & Visual Identity Suite (Tahap 1)", () => {
  it("1. Palette Kontrak Visual: Fresh Botanical Green menggantikan warna lama (#4F46E5)", () => {
    // Primary Fresh Botanical Green
    assert.strictEqual(PALETTE.primary[600], "#16A34A");
    assert.strictEqual(PALETTE.primary[700], "#15803D");
    assert.strictEqual(PALETTE.primary[800], "#166534");
    assert.strictEqual(PALETTE.primary[50], "#F0FDF4");
    assert.strictEqual(PALETTE.primary[950], "#052E16"); // Deep Charcoal Pine

    // Pastikan tidak ada warna indigo generik (#4F46E5) di palette primary
    assert.notStrictEqual(PALETTE.primary[600], "#4F46E5");
    assert.notStrictEqual(PALETTE.primary[700], "#4338CA");
  });

  it("2. Zesty Lime & Solar Coral: Warna aksen playful, interaktif, dan penanda HOTS", () => {
    // Zesty Lime
    assert.strictEqual(PALETTE.lime[500], "#84CC16");
    assert.strictEqual(PALETTE.lime[600], "#65A30D");
    assert.strictEqual(PALETTE.lime[50], "#F7FEE7");

    // Solar Coral Accent
    assert.strictEqual(PALETTE.coral[600], "#EA580C");
    assert.strictEqual(PALETTE.coral[700], "#C2410C");
    assert.strictEqual(PALETTE.coral[50], "#FFF7ED");
  });

  it("3. Surface & Canvas Tokens: Warm off-white / natural cream ground & high-contrast ink", () => {
    assert.strictEqual(PALETTE.surface.ground, "#FAF9F5");
    assert.strictEqual(PALETTE.surface.card, "#FFFFFF");
    assert.strictEqual(PALETTE.surface.subtle, "#F3F4EE");
    assert.strictEqual(PALETTE.surface.border, "#E5E7EB");
    assert.strictEqual(PALETTE.surface.tinted, "#F0FDF4");
    assert.strictEqual(PALETTE.text.primary, "#0F172A");
    assert.strictEqual(PALETTE.text.secondary, "#334155");
    assert.strictEqual(PALETTE.text.muted, "#64748B");
  });

  it("4. Status Tokens: Sukses, Error, Warning, dan Info terdefinisi tegas", () => {
    // Sukses: Fresh Green
    assert.strictEqual(PALETTE.status.success.solid, "#16A34A");
    assert.strictEqual(PALETTE.status.success.light, "#F0FDF4");

    // Error: Crimson
    assert.strictEqual(PALETTE.status.error.solid, "#DC2626");
    assert.strictEqual(PALETTE.status.error.light, "#FEF2F2");

    // Warning: Amber
    assert.strictEqual(PALETTE.status.warning.solid, "#D97706");
    assert.strictEqual(PALETTE.status.warning.light, "#FFFBEB");

    // Info: Sky
    assert.strictEqual(PALETTE.status.info.solid, "#0284C7");
    assert.strictEqual(PALETTE.status.info.light, "#F0F9FF");
  });

  it("5. Skala Tipografi: Hierarki teks, weight, dan line-height optimal untuk belajar", () => {
    assert.ok(TYPOGRAPHY.fontFamily.sans.includes("sans"));
    assert.strictEqual(TYPOGRAPHY.fontSize.xs[0], "0.75rem");
    assert.strictEqual(TYPOGRAPHY.fontSize.sm[0], "0.875rem");
    assert.strictEqual(TYPOGRAPHY.fontSize.base[0], "1rem");
    assert.strictEqual(TYPOGRAPHY.fontSize.xl[0], "1.25rem");
    assert.strictEqual(TYPOGRAPHY.fontSize["2xl"][0], "1.5rem");
    assert.strictEqual(TYPOGRAPHY.fontWeight.bold, "700");
  });

  it("6. Spacing, Border Radius, Elevation, dan Z-Index: Terstandarisasi", () => {
    // Spacing
    assert.strictEqual(SPACING[1], "0.25rem");
    assert.strictEqual(SPACING[4], "1rem");
    assert.strictEqual(SPACING[6], "1.5rem");

    // Radii
    assert.strictEqual(RADII.sm, "0.375rem");
    assert.strictEqual(RADII.md, "0.5rem");
    assert.strictEqual(RADII.lg, "0.75rem");
    assert.strictEqual(RADII.xl, "1rem");
    assert.strictEqual(RADII.full, "9999px");

    // Shadows
    assert.ok(SHADOWS.card.includes("rgba(15, 23, 42"));
    assert.ok(SHADOWS.hover.includes("rgba(15, 23, 42"));

    // Z-Index layering
    assert.ok(Z_INDEX.tooltip > Z_INDEX.toast);
    assert.ok(Z_INDEX.toast > Z_INDEX.modal);
    assert.ok(Z_INDEX.modal > Z_INDEX.dropdown);
  });

  it("7. Button Variants: Menghasilkan kelas Tailwind yang tepat untuk seluruh varian", () => {
    const primaryClass = getButtonClasses("primary", "md");
    assert.ok(primaryClass.includes("#16A34A"));
    assert.ok(primaryClass.includes("text-white"));

    const secondaryClass = getButtonClasses("secondary", "md");
    assert.ok(secondaryClass.includes("#F0FDF4"));
    assert.ok(secondaryClass.includes("#15803D"));

    const tertiaryClass = getButtonClasses("tertiary", "sm");
    assert.ok(tertiaryClass.includes("bg-transparent"));

    const coralClass = getButtonClasses("coral", "sm");
    assert.ok(coralClass.includes("#EA580C"));

    const dangerClass = getButtonClasses("danger", "md");
    assert.ok(dangerClass.includes("#DC2626"));

    const successClass = getButtonClasses("success", "md");
    assert.ok(successClass.includes("#16A34A"));
  });

  it("8. Badge Variants: Menghasilkan style tag yang kontras dan nyaman (green, lime, coral, charcoal)", () => {
    const greenBadge = getBadgeClasses("green", "sm");
    assert.ok(greenBadge.includes("#15803D"));

    const limeBadge = getBadgeClasses("lime", "xs");
    assert.ok(limeBadge.includes("#4D7C0F"));

    const coralBadge = getBadgeClasses("coral", "md");
    assert.ok(coralBadge.includes("#C2410C"));

    const charcoalBadge = getBadgeClasses("charcoal", "sm");
    assert.ok(charcoalBadge.includes("#052E16"));
  });

  it("9. Card Variants: Mendukung default, subtle, elevated, accent, coral, dan interactive", () => {
    assert.ok(CARD_VARIANTS.default.includes("border-[#E5E7EB]"));
    assert.ok(CARD_VARIANTS.interactive.includes("hover:border-[#16A34A]/50"));
    assert.ok(CARD_VARIANTS.interactive.includes("cursor-pointer"));
    assert.ok(CARD_VARIANTS.accent.includes("bg-[#F0FDF4]"));
    assert.ok(CARD_VARIANTS.coral.includes("bg-[#FFF7ED]"));
  });

  it("10. Toast Notification: Dispatcher singleton bekerja tanpa crash dan memicu subscriber", () => {
    let receivedMessage = "";
    let receivedType = "";

    const unsubscribe = toast.subscribe((msg) => {
      receivedMessage = msg.message;
      receivedType = msg.type;
    });

    const item = toast.success("Konfigurasi tersimpan!", "Berhasil");
    assert.strictEqual(item.type, "success");
    assert.strictEqual(receivedMessage, "Konfigurasi tersimpan!");
    assert.strictEqual(receivedType, "success");

    toast.warning("Waktu latihan hampir habis", "Peringatan");
    assert.strictEqual(receivedMessage, "Waktu latihan hampir habis");
    assert.strictEqual(receivedType, "warning");

    toast.error("Gagal memuat materi", "Kesalahan");
    assert.strictEqual(receivedMessage, "Gagal memuat materi");
    assert.strictEqual(receivedType, "error");

    unsubscribe();
  });
});
