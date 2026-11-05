/**
 * NemoLearn Math & LaTeX Parser Engine
 *
 * Mendukung standardisasi rendering matematika Kurikulum Merdeka & UTBK SMA:
 * - Pecahan (\frac{a}{b})
 * - Pangkat / Eksponen (x^2, 10^5, m/s^2)
 * - Akar kuadrat & n-akar (\sqrt{x}, \sqrt[3]{x})
 * - Indeks / Subscript (v_0, a_1, F_{ges}, f_k)
 * - Persamaan kuadrat (ax^2 + bx + c = 0)
 * - Limit (\lim_{x \to 0})
 * - Integral tentu & tak tentu (\int, \int_a^b)
 * - Turunan (\frac{df}{dx}, f'(x))
 * - Matriks (\begin{pmatrix} ... \end{pmatrix}, \begin{bmatrix} ... \end{bmatrix})
 * - Vektor (\vec{v}, \mathbf{F})
 * - Simbol fisika & Yunani (\alpha, \beta, \theta, \lambda, \mu, \pi, \Delta, \omega, \Sigma, \Omega)
 * - Satuan ilmiah (\text{m/s}^2, \text{kg}\cdot\text{m/s})
 * - Delimiter Standar: \(...\) untuk inline, \[...\] untuk display (beserta $...$, $$...$$)
 * - Proteksi mata uang ($10, $50) agar tidak tertukar menjadi rumus
 * - Toleransi kesalahan: perbaikan backslash hilang, auto-closing kurung kurawal, dan fallback visual anggun.
 * - Konversi plain text Unicode untuk cetak PDF remedial yang bersih dan mudah dibaca.
 */

import katex from "katex";

export type MathTokenType = "text" | "inline-math" | "display-math";

export interface MathToken {
  type: MathTokenType;
  content: string; // The math LaTeX string or plain text
  raw: string;     // The original unparsed token
  isError?: boolean;
}

/**
 * Escape string untuk rendering HTML aman saat fallback
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Normalisasi notasi desimal koma Indonesia di dalam LaTeX:
 * Mengubah "0,2" menjadi "0{,}2" agar KaTeX tidak menambahkan spasi tanda baca.
 */
export function normalizeMathDecimals(latex: string): string {
  if (!latex) return "";
  return latex.replace(/(\d+),(\d+)/g, "$1{,}$2");
}

/**
 * Memperbaiki backslash yang hilang atau karakter kontrol JSON yang tidak sengaja ter-escape:
 * - \x0crac (form feed) -> \frac
 * - \x08eta (backspace) -> \beta, dsb.
 * - Perintah LaTeX yang kehilangan backslash di awal
 */
export function repairMissingBackslashes(text: string): string {
  if (!text) return "";

  let fixed = text;

  // 1. Tangani artefak karakter kontrol akibat unescaping JSON standar
  fixed = fixed.replace(/\x0crac\b/g, "\\frac");
  fixed = fixed.replace(/\x08eta\b/g, "\\beta");
  fixed = fixed.replace(/\x08egin\b/g, "\\begin");
  fixed = fixed.replace(/\x08ar\b/g, "\\bar");

  // 2. Tangani double backslash berlebih pada delimiter yang lolos ke parser
  fixed = fixed.replace(/\\\\([()\[\]])/g, "\\$1");

  // 3. Perbaiki perintah LaTeX umum yang kehilangan backslash jika diikuti kurung kurawal
  // Contoh: "frac{1}{2}" -> "\frac{1}{2}", "sqrt{x}" -> "\sqrt{x}"
  fixed = fixed.replace(/(^|[^\\a-zA-Z])(frac|sqrt|text|mathbf|vec|overline)\{/g, "$1\\$2{");
  fixed = fixed.replace(/(^|[^\\a-zA-Z])sqrt\[/g, "$1\\sqrt[");

  return fixed;
}

/**
 * Memeriksa apakah token antara $ dan $ adalah teks biasa / mata uang (bukan formula matematika).
 */
function isCurrencyOrProse(content: string): boolean {
  const trimmed = content.trim();

  // Jika berupa murni angka harga/uang tanpa simbol matematika
  if (/^\d+(?:[.,]\d+)?(?:\s*(?:ribu|juta|miliar|dollar|usd|per\s+\w+))?$/i.test(trimmed)) {
    return true;
  }

  // Jika mengandung kata-kata penghubung bahasa Indonesia biasa tanpa operator matematika atau backslash
  const hasMathChars = /[\\+\-\*\/\^_{}=<>~\|\(\)\[\]]/.test(trimmed);
  const hasCommonProseWords = /\b(dan|atau|adalah|di|ke|dari|untuk|yang|harga|senilai|rupiah|dollar)\b/i.test(
    trimmed
  );

  if (hasCommonProseWords && !hasMathChars) {
    return true;
  }

  return false;
}

/**
 * Mendeteksi apakah suatu teks unwrapped (misal isi opsi jawaban)
 * merupakan ekspresi matematika atau formula sains.
 */
export function isFormulaLike(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();

  // Jika diawali perintah LaTeX standar
  if (
    /^\\(?:frac|sqrt|sum|int|begin|alpha|beta|theta|lambda|mu|pi|Delta|omega|Sigma|vec|mathbf|lim|log|ln|sin|cos|tan)\b/.test(
      trimmed
    )
  ) {
    return true;
  }

  // Pola persamaan aljabar atau fisika umum (misal: "x^2 - 4x + 4 = 0", "v_0 + at", "m/s^2", "E = mc^2")
  if (
    /^(?:[a-zA-Z]\^[\d\-a-zA-Z]+|[a-zA-Z]_[a-zA-Z\d]+|[a-zA-Z]\s*=\s*[\d\-a-zA-Z\+\*\/]+)/.test(
      trimmed
    )
  ) {
    return true;
  }

  // Jika mengandung pangkat atau subscript dan karakter aljabar
  if (/[a-zA-Z]\^[\d\-a-zA-Z]+/.test(trimmed) || /[a-zA-Z]_[a-zA-Z\d]+/.test(trimmed)) {
    // Pastikan bukan sekedar kata umum
    if (/[=+\-*\/<>]/.test(trimmed) || /^\S+$/.test(trimmed)) {
      return true;
    }
  }

  return false;
}

/**
 * Normalisasi delimiter matematika:
 * Mengubah $$...$$ dan $...$ menjadi \[...\] dan \(...\) secara aman,
 * melindungi simbol dollar mata uang, dan menutup delimiter yang tidak seimbang.
 */
export function normalizeMathDelimiters(text: string): string {
  if (!text) return "";

  let cleaned = repairMissingBackslashes(text);

  // Normalisasi delimiter display LaTeX: $$...$$ -> \[...\]
  cleaned = cleaned.replace(/\$\$([\s\S]*?)\$\$/g, (_match, inner) => {
    return `\\[${inner.trim()}\\]`;
  });

  // Normalisasi inline dollar: $...$ -> \(...\) kecuali mata uang / teks biasa
  const dollarRegex = /\$([^\$\n]+?)\$/g;
  cleaned = cleaned.replace(dollarRegex, (match, inner) => {
    if (isCurrencyOrProse(inner)) {
      return match;
    }
    return `\\(${inner.trim()}\\)`;
  });

  // Auto-close unclosed inline math delimiter jika ganjil: \( tanpa \)
  const openCount = (cleaned.match(/\\\(/g) || []).length;
  const closeCount = (cleaned.match(/\\\)/g) || []).length;
  if (openCount > closeCount) {
    cleaned += "\\)".repeat(openCount - closeCount);
  }

  // Auto-close unclosed display math delimiter jika ganjil: \[ tanpa \]
  const openDispCount = (cleaned.match(/\\\[/g) || []).length;
  const closeDispCount = (cleaned.match(/\\\]/g) || []).length;
  if (openDispCount > closeDispCount) {
    cleaned += "\\]".repeat(openDispCount - closeDispCount);
  }

  return cleaned;
}

/**
 * Memecah teks masukan menjadi array token (teks biasa, inline math, display math).
 */
export function parseMathTokens(text: string): MathToken[] {
  if (!text) return [];

  const ESCAPED_DOLLAR = "___NEMO_ESCAPED_DOLLAR___";
  // 1. Amankan dollar yang di-escape (\$)
  let sanitized = text.replace(/\\\$/g, ESCAPED_DOLLAR);

  // 2. Normalisasi delimiter dan perbaiki backslash
  sanitized = normalizeMathDelimiters(sanitized);

  // 3. Tokenisasi dengan regex yang mendukung:
  // - \[ ... \] (display math)
  // - \( ... \) (inline math)
  const mathRegex = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$(?:[^\$\n]+?)\$)/g;
  const rawParts = sanitized.split(mathRegex);
  const tokens: MathToken[] = [];

  for (const part of rawParts) {
    if (!part) continue;

    // Kembalikan dollar yang di-escape
    const unescaped = part.replace(new RegExp(ESCAPED_DOLLAR, "g"), "$");

    // Display Math: \[ ... \]
    if (unescaped.startsWith("\\[") && unescaped.endsWith("\\]") && unescaped.length >= 4) {
      const math = unescaped.slice(2, -2).trim();
      tokens.push({
        type: "display-math",
        content: normalizeMathDecimals(math),
        raw: unescaped,
      });
      continue;
    }

    // Inline Math: \( ... \)
    if (unescaped.startsWith("\\(") && unescaped.endsWith("\\)") && unescaped.length >= 4) {
      const math = unescaped.slice(2, -2).trim();
      tokens.push({
        type: "inline-math",
        content: normalizeMathDecimals(math),
        raw: unescaped,
      });
      continue;
    }

    // Inline Math sisa $ ... $ jika ada yang belum dinormalisasi
    if (unescaped.startsWith("$") && unescaped.endsWith("$") && unescaped.length >= 2) {
      const inner = unescaped.slice(1, -1).trim();
      if (isCurrencyOrProse(inner)) {
        tokens.push({
          type: "text",
          content: unescaped,
          raw: unescaped,
        });
      } else {
        tokens.push({
          type: "inline-math",
          content: normalizeMathDecimals(inner),
          raw: unescaped,
        });
      }
      continue;
    }

    // Unwrapped Standalone Formula Detection (misalnya opsi jawaban atau cuplikan rumus):
    // Jika sebuah token berdiri sendiri dan memenuhi isFormulaLike
    const trimmed = unescaped.trim();
    if (isFormulaLike(trimmed)) {
      tokens.push({
        type: "inline-math",
        content: normalizeMathDecimals(trimmed),
        raw: unescaped,
      });
      continue;
    }

    // Teks biasa
    tokens.push({
      type: "text",
      content: unescaped,
      raw: unescaped,
    });
  }

  return tokens;
}

const mathCache = new Map<string, { html: string; isError: boolean }>();
const MAX_MATH_CACHE = 1500;

/**
 * Menyeimbangkan kurung kurawal yang belum tertutup sebelum masuk ke KaTeX
 */
function autoCloseBraces(latex: string): string {
  let depth = 0;
  for (let i = 0; i < latex.length; i++) {
    if (latex[i] === "{" && (i === 0 || latex[i - 1] !== "\\")) {
      depth++;
    } else if (latex[i] === "}" && (i === 0 || latex[i - 1] !== "\\")) {
      depth--;
    }
  }
  if (depth > 0) {
    return latex + "}".repeat(depth);
  }
  return latex;
}

/**
 * Merender ekspresi matematika ke HTML via KaTeX secara aman tanpa melempar uncaught exception.
 * Menggunakan memoisasi cache untuk menghindari komputasi ulang KaTeX yang mahal.
 */
export function renderMathExpression(
  math: string,
  displayMode: boolean
): { html: string; isError: boolean } {
  if (!math || !math.trim()) {
    return { html: "", isError: false };
  }

  const normalizedMath = autoCloseBraces(normalizeMathDecimals(math.trim()));
  const cacheKey = `${displayMode ? "D:" : "I:"}${normalizedMath}`;
  const cached = mathCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const renderedHtml = katex.renderToString(normalizedMath, {
      displayMode,
      throwOnError: false, // Tidak melempar exception pada sintaks tak valid
      errorColor: "#ef4444", // Warna merah lembut untuk penanda sintaks bermasalah
      strict: false,
      trust: false, // Mencegah eksekusi script / HTML injection
    });

    const result = { html: renderedHtml, isError: false };

    // Bounded cache maintenance (FIFO eviction)
    if (mathCache.size >= MAX_MATH_CACHE) {
      const oldestKey = mathCache.keys().next().value;
      if (oldestKey) mathCache.delete(oldestKey);
    }
    mathCache.set(cacheKey, result);

    return result;
  } catch (err) {
    // Fallback darurat jika KaTeX crash tak terduga
    console.warn("[KaTeX Parse Warning] Gagal merender matematika:", math, err);
    const fallback = {
      html: `<code class="font-mono text-rose-500 bg-rose-50 px-1 py-0.5 rounded text-xs">${escapeHtml(
        math
      )}</code>`,
      isError: true,
    };
    mathCache.set(cacheKey, fallback);
    return fallback;
  }
}

/**
 * Konversi representasi LaTeX menjadi teks bersih dengan simbol Unicode
 * untuk keperluan cetak PDF, notifikasi, pencarian, dan fallback teks murni.
 * Mendukung pecahan, akar, pangkat, subscript, simbol fisika, dan operator.
 */
export function cleanLatexForPlainText(text: string): string {
  if (!text) return "";

  let res = repairMissingBackslashes(text);

  // 1. Bersihkan wrapper delimiter
  res = res
    .replace(/\\\[([\s\S]*?)\\\]/g, " $1 ")
    .replace(/\\\(([\s\S]*?)\\\)/g, " $1 ")
    .replace(/\$\$([\s\S]*?)\$\$/g, " $1 ")
    .replace(/\$([^\$\n]+?)\$/g, " $1 ");

  // 2. Format Pecahan (\frac{a}{b})
  res = res.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)");

  // 3. Format Akar (\sqrt{x}, \sqrt[3]{x})
  res = res.replace(/\\sqrt\[3\]\{([^}]+)\}/g, "∛($1)");
  res = res.replace(/\\sqrt\[(\d+)\]\{([^}]+)\}/g, "($1)√($2)");
  res = res.replace(/\\sqrt\{([^}]+)\}/g, "√($1)");

  // 4. Format Pangkat Eksponen umum ke karakter Unicode SuperScript
  const superscriptMap: Record<string, string> = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
    "+": "⁺",
    "-": "⁻",
    "=": "⁼",
    "(": "⁽",
    ")": "⁾",
    "n": "ⁿ",
  };

  res = res.replace(/\^\{?([\d\+\-n]+)\}?/g, (_match, exp) => {
    let replaced = "";
    for (const ch of exp) {
      replaced += superscriptMap[ch] || `^${ch}`;
    }
    return replaced;
  });

  // 5. Format Subscript / Indeks umum ke karakter Unicode SubScript
  const subscriptMap: Record<string, string> = {
    "0": "₀",
    "1": "₁",
    "2": "₂",
    "3": "₃",
    "4": "₄",
    "5": "₅",
    "6": "₆",
    "7": "₇",
    "8": "₈",
    "9": "₉",
    "a": "ₐ",
    "e": "ₑ",
    "i": "ᵢ",
    "j": "ⱼ",
    "k": "ₖ",
    "m": "ₘ",
    "o": "ₒ",
    "p": "ₚ",
    "r": "ᵣ",
    "s": "ₛ",
    "t": "ₜ",
    "u": "ᵤ",
    "v": "ᵥ",
    "x": "ₓ",
  };

  res = res.replace(/_\{?([0-9a-z]+)\}?/g, (_match, sub) => {
    let replaced = "";
    for (const ch of sub) {
      if (subscriptMap[ch]) {
        replaced += subscriptMap[ch];
      } else {
        return `_${sub}`; // Fallback jika tidak semua ada di unicode
      }
    }
    return replaced;
  });

  // 6. Format Simbol Yunani
  const greekMap: Record<string, string> = {
    "\\alpha": "α",
    "\\beta": "β",
    "\\gamma": "γ",
    "\\theta": "θ",
    "\\lambda": "λ",
    "\\mu": "μ",
    "\\pi": "π",
    "\\rho": "ρ",
    "\\sigma": "σ",
    "\\tau": "τ",
    "\\phi": "φ",
    "\\omega": "ω",
    "\\Delta": "Δ",
    "\\Sigma": "Σ",
    "\\Omega": "Ω",
  };

  for (const [cmd, sym] of Object.entries(greekMap)) {
    res = res.replaceAll(cmd, sym);
  }

  // 7. Format Operator Matematika & Logika
  const operatorMap: Record<string, string> = {
    "\\times": "×",
    "\\cdot": "·",
    "\\div": "÷",
    "\\pm": "±",
    "\\mp": "∓",
    "\\le": "≤",
    "\\leq": "≤",
    "\\ge": "≥",
    "\\geq": "≥",
    "\\neq": "≠",
    "\\ne": "≠",
    "\\approx": "≈",
    "\\equiv": "≡",
    "\\sim": "~",
    "\\infty": "∞",
    "\\int": "∫",
    "\\sum": "∑",
    "\\partial": "∂",
    "\\nabla": "∇",
    "\\circ": "°",
    "^\\circ": "°",
    "\\to": "→",
    "\\rightarrow": "→",
    "\\implies": "⇒",
    "\\iff": "⇔",
    "\\in": "∈",
    "\\subset": "⊂",
    "\\subseteq": "⊆",
    "\\cup": "∪",
    "\\cap": "∩",
    "\\quad": "  ",
    "\\qquad": "    ",
    "\\,": " ",
  };

  for (const [cmd, sym] of Object.entries(operatorMap)) {
    res = res.replaceAll(cmd, sym);
  }

  // 8. Bersihkan wrapper teks & gaya huruf
  res = res
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\mathbf\{([^}]+)\}/g, "$1")
    .replace(/\\vec\{([^}]+)\}/g, "$1")
    .replace(/\\bar\{([^}]+)\}/g, "$1")
    .replace(/\\hat\{([^}]+)\}/g, "$1")
    .replace(/\\overline\{([^}]+)\}/g, "$1")
    .replace(/\\left|\\right/g, "")
    .replace(/\{,\}/g, ",")
    .replace(/\\([a-zA-Z]+)/g, "$1") // Sisa command yang tidak dipetakan
    .replace(/[{}]/g, "")           // Bersihkan kurung kurawal sisa
    .replace(/\s+/g, " ")           // Rapikan spasi berlebih
    .trim();

  return res;
}

/**
 * Validasi sintaks LaTeX dasar agar tidak merusak antarmuka pengguna
 */
export function validateLatexSyntax(text: string): { isValid: boolean; error?: string } {
  if (!text) return { isValid: true };

  // Hitung jumlah delimiter $ (inline) yang tidak di-escape
  const singleDollarMatches = text.match(/(?<!\\)\$/g);
  if (singleDollarMatches && singleDollarMatches.length % 2 !== 0) {
    return {
      isValid: false,
      error: "Delimiter inline LaTeX ($) tidak berpasangan (jumlah ganjil).",
    };
  }

  // Hitung delimiter $$ (display)
  const doubleDollarMatches = text.match(/(?<!\\)\$\$/g);
  if (doubleDollarMatches && doubleDollarMatches.length % 2 !== 0) {
    return {
      isValid: false,
      error: "Delimiter display LaTeX ($$) tidak berpasangan.",
    };
  }

  // Cek kurung kurawal buka-tutup dalam ekspresi matematika LaTeX dasar
  let braceDepth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{" && (i === 0 || text[i - 1] !== "\\")) {
      braceDepth++;
    } else if (text[i] === "}" && (i === 0 || text[i - 1] !== "\\")) {
      braceDepth--;
      if (braceDepth < 0) {
        return {
          isValid: false,
          error: "Kurung kurawal tutup LaTeX '}' tidak memiliki pasangan buka.",
        };
      }
    }
  }

  if (braceDepth !== 0) {
    return {
      isValid: false,
      error: "Terdapat kurung kurawal LaTeX '{' yang belum ditutup.",
    };
  }

  return { isValid: true };
}
