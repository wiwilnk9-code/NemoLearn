import { describe, it } from "node:test";
import assert from "node:assert";
import {
  parseMathTokens,
  renderMathExpression,
  normalizeMathDecimals,
  repairMissingBackslashes,
  normalizeMathDelimiters,
  cleanLatexForPlainText,
  validateLatexSyntax,
  isFormulaLike,
  escapeHtml,
} from "./parser";

describe("NemoLearn Math & LaTeX Parser Engine (TASK 4 - Comprehensive Test Suite)", () => {
  // =========================================================================
  // CATEGORY 1: PECAHAN (FRACTIONS)
  // =========================================================================
  describe("1. Pecahan (Fractions)", () => {
    it("merender pecahan standar \\frac{a}{b}", () => {
      const res = renderMathExpression("\\frac{3}{4}", false);
      assert.strictEqual(res.isError, false);
      assert.ok(res.html.includes("frac-line"));
    });

    it("merender pecahan bertingkat / bersarang", () => {
      const res = renderMathExpression("\\frac{\\frac{1}{2}}{\\frac{3}{4}}", true);
      assert.strictEqual(res.isError, false);
      assert.ok(res.html.includes("katex-display"));
    });

    it("mengonversi pecahan ke plain text bersih untuk PDF", () => {
      assert.strictEqual(cleanLatexForPlainText("\\frac{1}{2}"), "(1 / 2)");
      assert.strictEqual(cleanLatexForPlainText("\\frac{a + b}{c - d}"), "(a + b / c - d)");
    });
  });

  // =========================================================================
  // CATEGORY 2: AKAR (ROOTS)
  // =========================================================================
  describe("2. Akar (Square Roots & N-th Roots)", () => {
    it("merender akar kuadrat \\sqrt{x}", () => {
      const res = renderMathExpression("\\sqrt{b^2 - 4ac}", false);
      assert.strictEqual(res.isError, false);
      assert.ok(res.html.includes("sqrt"));
    });

    it("merender akar pangkat-n \\sqrt[3]{x}", () => {
      const res = renderMathExpression("\\sqrt[3]{27} = 3", false);
      assert.strictEqual(res.isError, false);
      assert.ok(res.html.includes("sqrt"));
    });

    it("mengonversi akar ke plain text Unicode untuk PDF", () => {
      assert.strictEqual(cleanLatexForPlainText("\\sqrt{x}"), "√(x)");
      assert.strictEqual(cleanLatexForPlainText("\\sqrt[3]{8}"), "∛(8)");
      assert.strictEqual(cleanLatexForPlainText("\\sqrt[4]{16}"), "(4)√(16)");
    });
  });

  // =========================================================================
  // CATEGORY 3: PANGKAT & EKSPONEN (POWERS & EXPONENTS)
  // =========================================================================
  describe("3. Pangkat & Eksponen (Powers & Exponents)", () => {
    it("merender pangkat aljabar dan bilangan: x^2, 10^5, m/s^2", () => {
      const res = renderMathExpression("x^2 + 10^5 + \\text{m/s}^2", false);
      assert.strictEqual(res.isError, false);
      assert.ok(res.html.includes("katex"));
    });

    it("merender pangkat negatif: x^{-1}, 10^{-3}", () => {
      const res = renderMathExpression("v = 10^{-3} \\text{ m/s}", false);
      assert.strictEqual(res.isError, false);
    });

    it("mengonversi eksponen ke karakter superskrip Unicode untuk PDF", () => {
      assert.strictEqual(cleanLatexForPlainText("x^2 + y^3"), "x² + y³");
      assert.strictEqual(cleanLatexForPlainText("10^5"), "10⁵");
      assert.strictEqual(cleanLatexForPlainText("m/s^2"), "m/s²");
    });
  });

  // =========================================================================
  // CATEGORY 4: SUBSCRIPT & INDEKS
  // =========================================================================
  describe("4. Subscript & Indeks (Indices)", () => {
    it("merender subscript fisika dan matematika: v_0, a_1, F_{ges}, f_k", () => {
      const res = renderMathExpression("v_0 + a_1 + F_{ges} + f_k", false);
      assert.strictEqual(res.isError, false);
      assert.ok(res.html.includes("katex"));
    });

    it("mengonversi subscript ke karakter subskrip Unicode untuk PDF", () => {
      assert.strictEqual(cleanLatexForPlainText("v_0"), "v₀");
      assert.strictEqual(cleanLatexForPlainText("a_1"), "a₁");
      assert.strictEqual(cleanLatexForPlainText("f_k"), "fₖ");
    });
  });

  // =========================================================================
  // CATEGORY 5: PERSAMAAN KUADRAT
  // =========================================================================
  describe("5. Persamaan Kuadrat (Quadratic Equations)", () => {
    it("merender persamaan kuadrat lengkap dengan rumus abc", () => {
      const res = renderMathExpression(
        "ax^2 + bx + c = 0 \\implies x_{1,2} = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
        true
      );
      assert.strictEqual(res.isError, false);
      assert.ok(res.html.includes("katex-display"));
    });

    it("mendeteksi persamaan kuadrat tanpa pembungkus sebagai formula aljabar", () => {
      assert.strictEqual(isFormulaLike("x^2 - 4x + 4 = 0"), true);
      const tokens = parseMathTokens("x^2 - 4x + 4 = 0");
      assert.strictEqual(tokens.length, 1);
      assert.strictEqual(tokens[0].type, "inline-math");
    });
  });

  // =========================================================================
  // CATEGORY 6: LIMIT
  // =========================================================================
  describe("6. Limit Fungsi", () => {
    it("merender rumus limit: \\lim_{x \\to 0} \\frac{\\sin x}{x} = 1", () => {
      const res = renderMathExpression("\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1", true);
      assert.strictEqual(res.isError, false);
      assert.ok(res.html.includes("lim"));
    });

    it("mengonversi limit ke plain text Unicode untuk PDF", () => {
      const cleaned = cleanLatexForPlainText("\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1");
      assert.ok(cleaned.includes("→"));
      assert.ok(cleaned.includes("(sin x / x)"));
    });
  });

  // =========================================================================
  // CATEGORY 7: INTEGRAL
  // =========================================================================
  describe("7. Integral Tentu & Tak Tentu", () => {
    it("merender integral tentu dengan batas: \\int_0^\\pi \\sin(x) dx", () => {
      const res = renderMathExpression("\\int_0^\\pi \\sin(x) dx", true);
      assert.strictEqual(res.isError, false);
      assert.ok(res.html.includes("katex-display"));
    });

    it("mengonversi simbol integral ke plain text Unicode ∫ untuk PDF", () => {
      const cleaned = cleanLatexForPlainText("\\int_0^1 x^2 dx");
      assert.ok(cleaned.includes("∫"));
      assert.ok(cleaned.includes("x²"));
    });
  });

  // =========================================================================
  // CATEGORY 8: TURUNAN (DERIVATIVES)
  // =========================================================================
  describe("8. Turunan (Derivatives)", () => {
    it("merender turunan Leibniz dan aksen: \\frac{df}{dx}, f'(x)", () => {
      const res = renderMathExpression("\\frac{df}{dx} = 3x^2 \\quad f'(x) = 6x", false);
      assert.strictEqual(res.isError, false);
      assert.ok(res.html.includes("katex"));
    });
  });

  // =========================================================================
  // CATEGORY 9: MATRIKS (MATRICES)
  // =========================================================================
  describe("9. Matriks (Matrices)", () => {
    it("merender matriks 2x2 pmatrix", () => {
      const res = renderMathExpression("\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}", true);
      assert.strictEqual(res.isError, false);
      assert.ok(res.html.includes("matrix"));
    });

    it("merender matriks bmatrix (siku)", () => {
      const res = renderMathExpression("\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}", true);
      assert.strictEqual(res.isError, false);
      assert.ok(res.html.includes("matrix"));
    });
  });

  // =========================================================================
  // CATEGORY 10: SIMBOL FISIKA & YUNANI
  // =========================================================================
  describe("10. Simbol Fisika & Karakter Yunani", () => {
    it("merender simbol Yunani lengkap: \\alpha, \\beta, \\theta, \\lambda, \\mu, \\pi, \\Delta, \\omega, \\Sigma, \\Omega", () => {
      const res = renderMathExpression(
        "\\alpha + \\beta + \\theta + \\lambda + \\mu + \\pi + \\Delta + \\omega + \\Sigma + \\Omega",
        false
      );
      assert.strictEqual(res.isError, false);
      assert.ok(res.html.includes("katex"));
    });

    it("merender vektor fisika: \\vec{v}, \\mathbf{F}", () => {
      const res = renderMathExpression("\\vec{v} = \\mathbf{F} \\cdot t", false);
      assert.strictEqual(res.isError, false);
      assert.ok(res.html.includes("katex"));
    });

    it("mengonversi simbol Yunani dan operator fisika ke Unicode untuk PDF", () => {
      const cleaned = cleanLatexForPlainText("\\alpha = 30^\\circ, \\quad \\mu = 0,2, \\quad \\lambda = 500 \\text{ nm}");
      assert.ok(cleaned.includes("α"));
      assert.ok(cleaned.includes("°"));
      assert.ok(cleaned.includes("μ"));
      assert.ok(cleaned.includes("λ"));
    });
  });

  // =========================================================================
  // CATEGORY 11: SATUAN ILMIAH
  // =========================================================================
  describe("11. Satuan Ilmiah (Scientific Units)", () => {
    it("merender satuan ilmiah dengan pangkat dan dot: m/s^2, kg*m/s", () => {
      const res = renderMathExpression("a = 9{,}8\\text{ m/s}^2 \\quad p = 20\\text{ kg}\\cdot\\text{m/s}", false);
      assert.strictEqual(res.isError, false);
      assert.ok(res.html.includes("katex"));
    });
  });

  // =========================================================================
  // CATEGORY 12: OPSI DENGAN LATEX (STANDALONE & UNWRAPPED)
  // =========================================================================
  describe("12. Opsi Jawaban dengan LaTeX", () => {
    it("mengenali dan mem-parsing opsi terbungkus \\( ... \\)", () => {
      const tokens = parseMathTokens("\\(\\frac{1}{2}\\sqrt{3}\\)");
      assert.strictEqual(tokens.length, 1);
      assert.strictEqual(tokens[0].type, "inline-math");
      assert.strictEqual(tokens[0].content, "\\frac{1}{2}\\sqrt{3}");
    });

    it("mengenali opsi unwrapped tanpa delimiter sebagai math token", () => {
      const tokens = parseMathTokens("\\frac{1}{2}\\sqrt{3}");
      assert.strictEqual(tokens.length, 1);
      assert.strictEqual(tokens[0].type, "inline-math");
      assert.strictEqual(tokens[0].content, "\\frac{1}{2}\\sqrt{3}");
    });

    it("mengenali opsi aljabar fisika unwrapped: v_0 + at", () => {
      const tokens = parseMathTokens("v_0 + at");
      assert.strictEqual(tokens.length, 1);
      assert.strictEqual(tokens[0].type, "inline-math");
    });
  });

  // =========================================================================
  // CATEGORY 13: PEMBAHASAN CAMPURAN TEKS & LATEX
  // =========================================================================
  describe("13. Pembahasan Campuran Teks & LaTeX", () => {
    it("memecah pembahasan terstruktur menjadi token teks dan rumus secara terisolasi", () => {
      const text =
        "Langkah 1: Gunakan rumus GLBB \\(v_t = v_0 + a t\\).\n" +
        "Substitusikan nilai \\(v_0 = 0\\) dan \\(a = 2\\text{ m/s}^2\\):\n" +
        "\\[v_t = 0 + 2(5) = 10\\text{ m/s}\\]\n" +
        "Jadi, kecepatan akhir benda adalah 10 m/s.";

      const tokens = parseMathTokens(text);
      assert.ok(tokens.length >= 5);

      const inlineTokens = tokens.filter((t) => t.type === "inline-math");
      const displayTokens = tokens.filter((t) => t.type === "display-math");
      const textTokens = tokens.filter((t) => t.type === "text");

      assert.strictEqual(inlineTokens.length, 3);
      assert.strictEqual(displayTokens.length, 1);
      assert.ok(textTokens.length >= 3);
    });

    it("mempertahankan token display math \\[...\\] dan $$...$$ secara seimbang", () => {
      const tokens = parseMathTokens("Rumus energi potensial:\n\\[E_p = mgh\\]\nSelesai.");
      const display = tokens.find((t) => t.type === "display-math");
      assert.ok(display);
      assert.strictEqual(display.content, "E_p = mgh");
    });
  });

  // =========================================================================
  // CATEGORY 14: SOAL NON-MATEMATIKA TANPA DELIMITER
  // =========================================================================
  describe("14. Soal Non-Matematika Tanpa Delimiter", () => {
    it("menjaga soal Sejarah / Bahasa tetap murni sebagai teks biasa tanpa token rumus palsu", () => {
      const stem = "Siapakah tokoh yang memproklamasikan kemerdekaan Indonesia pada tanggal 17 Agustus 1945?";
      const tokens = parseMathTokens(stem);
      assert.strictEqual(tokens.length, 1);
      assert.strictEqual(tokens[0].type, "text");
      assert.strictEqual(tokens[0].content, stem);
    });

    it("tidak mengubah harga mata uang ($10, $50) menjadi formula matematika", () => {
      const stem = "Sebuah komoditas ekspor dijual seharga $50 per unit di pasar internasional.";
      const tokens = parseMathTokens(stem);
      const mathTokens = tokens.filter((t) => t.type !== "text");
      assert.strictEqual(mathTokens.length, 0);
    });
  });

  // =========================================================================
  // CATEGORY 15: PERBAIKAN BACKSLASH & AUTO-CLOSING BRACES
  // =========================================================================
  describe("15. Perbaikan Backslash Rusak & Toleransi Sintaks", () => {
    it("memperbaiki artefak form-feed JSON: \\x0crac -> \\frac", () => {
      const fixed = repairMissingBackslashes("\x0crac{1}{2}");
      assert.strictEqual(fixed, "\\frac{1}{2}");
    });

    it("memperbaiki perintah LaTeX yang kehilangan backslash di awal: frac{a}{b}", () => {
      const fixed = repairMissingBackslashes("Nilainya adalah frac{3}{4}");
      assert.strictEqual(fixed, "Nilainya adalah \\frac{3}{4}");
    });

    it("auto-close kurung kurawal yang belum tertutup tanpa crashing KaTeX", () => {
      // Unclosed curly brace in \frac{1}{2
      const res = renderMathExpression("\\frac{1}{2", false);
      assert.ok(res.html.length > 0);
      assert.strictEqual(res.isError, false);
    });

    it("menangani kurung kurawal yang sangat rusak tanpa melempar uncaught fatal error", () => {
      const res = renderMathExpression("\\frac{{{{", false);
      assert.ok(res.html.length > 0);
    });

    it("menormalisasi notasi desimal koma Indonesia: 0,2 -> 0{,}2", () => {
      assert.strictEqual(normalizeMathDecimals("\\mu = 0,2"), "\\mu = 0{,}2");
      assert.strictEqual(normalizeMathDecimals("a = 3,14\\text{ m/s}"), "a = 3{,}14\\text{ m/s}");
    });

    it("mengamankan karakter khusus HTML dengan escapeHtml", () => {
      const escaped = escapeHtml("<script>alert('xss')</script> & \"test\"");
      assert.ok(!escaped.includes("<script>"));
      assert.ok(escaped.includes("&lt;script&gt;"));
      assert.ok(escaped.includes("&amp;"));
    });

    it("memvalidasi sintaks kurung kurawal yang tidak seimbang dengan validateLatexSyntax", () => {
      assert.strictEqual(validateLatexSyntax("x + y = z").isValid, true);
      assert.strictEqual(validateLatexSyntax("{x + y").isValid, false);
    });
  });
});
