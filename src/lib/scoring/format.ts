/**
 * NemoLearn Scoring Format Helper
 * Menangani pembulatan matematis dua desimal dan format penulisan angka baku Indonesia.
 */

/**
 * Membulatkan angka secara matematis ke tepat dua angka di belakang koma (half up).
 */
export function roundToTwoDecimals(value: number): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Memformat angka skor ke format angka baku Bahasa Indonesia dengan tepat dua desimal:
 * - Menggunakan koma (,) sebagai pemisah desimal.
 * - Menggunakan titik (.) sebagai pemisah ribuan.
 *
 * Contoh:
 * - 0        -> "0,00"
 * - 76.25    -> "76,25"
 * - 100      -> "100,00"
 * - 650.5    -> "650,50"
 * - 1000     -> "1.000,00"
 * - 200      -> "200,00"
 */
export function formatIndonesianScore(value: number): string {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return "0,00";
  }

  const rounded = roundToTwoDecimals(value);
  const isNegative = rounded < 0;
  const absValue = Math.abs(rounded);

  const fixed = absValue.toFixed(2); // "1000.00"
  const [intPart, decPart] = fixed.split(".");

  // Format pemisah ribuan dengan titik (.)
  const withThousandSeparator = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  const result = `${withThousandSeparator},${decPart}`;
  return isNegative ? `-${result}` : result;
}

/**
 * Helper untuk memformat persentase dengan format Indonesia:
 * Contoh: 76.25 -> "76,25%"
 */
export function formatIndonesianPercentage(value: number): string {
  return `${formatIndonesianScore(value)}%`;
}
