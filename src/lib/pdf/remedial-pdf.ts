import { jsPDF } from "jspdf";
import { QuestionResultItem } from "@/types/session";
import { cleanLatexForPlainText } from "@/lib/math/parser";

interface GenerateRemedialPdfOptions {
  sessionTitle: string;
  subjectName: string;
  topicName: string;
  userName: string;
  dateStr: string;
  items: QuestionResultItem[];
  includeExplanations: boolean;
}

/**
 * Strips raw LaTeX math wrappers into clean printable text representation
 * e.g. $m = 4\text{ kg}$ -> m = 4 kg, \frac{a}{b} -> a/b
 */
function cleanLatexForPdf(text: string): string {
  return cleanLatexForPlainText(text);
}

export function generateRemedialPdf(options: GenerateRemedialPdfOptions): jsPDF {
  const { sessionTitle, subjectName, topicName, userName, dateStr, items, includeExplanations } =
    options;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  function checkPageBreak(neededHeight: number) {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = 18;
      drawHeaderBanner();
    }
  }

  function drawHeaderBanner() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("NemoQUIZ — Lembar Latihan & Remedial Terarah SMA", margin, 10);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 12, pageWidth - margin, 12);
  }

  // Cover / Header on First Page
  drawHeaderBanner();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Deep Navy
  doc.text("LEMBAR LATIHAN REMEDIAL SISWA", margin, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Mata Pelajaran: ${subjectName} | Materi: ${topicName}`, margin, y);
  y += 5;
  doc.text(`Nama Pelajar: ${userName} | Tanggal Cetak: ${dateStr}`, margin, y);
  y += 5;
  doc.text(`Fokus Remedial: ${items.length} butir soal yang perlu diulang / diperdalam`, margin, y);
  y += 7;

  doc.setDrawColor(6, 182, 212); // Cyan line
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Render Each Remedial Question
  items.forEach((item, index) => {
    checkPageBreak(38);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Soal No. ${index + 1}`, margin, y);
    y += 5;

    // Stem
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);

    const cleanedStem = cleanLatexForPdf(item.question.stem);
    const stemLines = doc.splitTextToSize(cleanedStem, contentWidth);
    doc.text(stemLines, margin, y);
    y += stemLines.length * 4.5 + 2;

    // Options A..E
    item.question.options.forEach((opt) => {
      checkPageBreak(8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const optText = `[ ${opt.key} ]  ${cleanLatexForPdf(opt.text)}`;
      const optLines = doc.splitTextToSize(optText, contentWidth - 4);
      doc.text(optLines, margin + 4, y);
      y += optLines.length * 4.2;
    });

    y += 3;

    // Workspace / Ruang Jawaban Siswa
    checkPageBreak(20);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "FD");

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Ruang Coretan & Analisis Pengerjaan Siswa:", margin + 3, y + 5);
    y += 24;

    // Explanations if opted in
    if (includeExplanations) {
      checkPageBreak(25);
      doc.setFillColor(240, 249, 255);
      doc.setDrawColor(186, 230, 253);
      doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(3, 105, 161);
      doc.text(`Kunci Jawaban: ${item.correctAnswer} | Pembahasan Konsep:`, margin + 3, y + 4.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      const cleanedExp = cleanLatexForPdf(item.explanation);
      const expLines = doc.splitTextToSize(cleanedExp, contentWidth - 6);
      doc.text(expLines.slice(0, 4), margin + 3, y + 9);
      y += 26;
    }
  });

  // Footer page numbering
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Halaman ${i} dari ${pageCount} — NemoQUIZ Pembelajaran Mandiri SMA`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  return doc;
}
