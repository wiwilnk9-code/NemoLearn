"use client";

import React, { useMemo } from "react";
import { parseMathTokens, renderMathExpression } from "@/lib/math/parser";

interface MathRendererProps {
  text: string;
  className?: string;
  asBlock?: boolean;
}

/**
 * Helper to safely render lightweight markdown formatting (bold, italic, inline code)
 * on plain-text tokens without using unsanitized dangerouslySetInnerHTML.
 */
function renderFormattedText(text: string, keyPrefix: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const formatRegex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
    let match: RegExpExecArray | null;

    while ((match = formatRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }

      if (match[2] !== undefined) {
        // **bold**
        parts.push(
          <strong key={`${keyPrefix}-b-${lineIdx}-${match.index}`} className="font-bold text-[#0F172A]">
            {match[2]}
          </strong>
        );
      } else if (match[3] !== undefined) {
        // *italic*
        parts.push(
          <em key={`${keyPrefix}-i-${lineIdx}-${match.index}`} className="italic">
            {match[3]}
          </em>
        );
      } else if (match[4] !== undefined) {
        // `code`
        parts.push(
          <code
            key={`${keyPrefix}-c-${lineIdx}-${match.index}`}
            className="rounded bg-[#F1F5F9] px-1 py-0.5 font-mono text-xs text-[#0F172A]"
          >
            {match[4]}
          </code>
        );
      }

      lastIndex = formatRegex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }

    return (
      <React.Fragment key={`${keyPrefix}-line-${lineIdx}`}>
        {parts.length > 0 ? parts : line}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

/**
 * MathRenderer: Komponen rendering matematika standar Kurikulum Merdeka & UTBK SMA
 * - Mendukung pecahan, pangkat, akar, indeks, integral, sigma, limit, turunan, pertidaksamaan, matriks, vektor, dan simbol Yunani.
 * - Mendukung delimiter: \(...\) untuk inline, \[...\] untuk display (beserta $...$, $$...$$).
 * - Menjaga teks biasa (termasuk mata uang $10, $50) tidak diubah menjadi rumus secara keliru.
 * - Render markdown ringan (bold, italic, code) pada teks penjelasan tanpa unsanitized dangerouslySetInnerHTML.
 * - Menangani LaTeX tidak valid secara anggun dengan fallback visual tanpa merusak seluruh antarmuka.
 */
export const MathRenderer: React.FC<MathRendererProps> = React.memo(({
  text,
  className = "",
  asBlock = false,
}) => {
  const parts = useMemo(() => {
    if (!text) return null;

    const tokens = parseMathTokens(text);

    return tokens.map((token, idx) => {
      if (token.type === "display-math") {
        const { html, isError } = renderMathExpression(token.content, true);

        return (
          <span
            key={`display-${idx}`}
            className="my-3 block overflow-x-auto py-1 text-center font-normal"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }

      if (token.type === "inline-math") {
        const { html, isError } = renderMathExpression(token.content, false);

        return (
          <span
            key={`inline-${idx}`}
            className="inline-block px-0.5 align-baseline font-normal"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }

      // Plain text with safe markdown formatting (bold, italic, code, newlines)
      return (
        <React.Fragment key={`text-${idx}`}>
          {renderFormattedText(token.content, `t-${idx}`)}
        </React.Fragment>
      );
    });
  }, [text]);

  if (!text) return null;

  const Wrapper = asBlock ? "div" : "span";
  return <Wrapper className={`math-content leading-relaxed ${className}`}>{parts}</Wrapper>;
});

MathRenderer.displayName = "MathRenderer";
