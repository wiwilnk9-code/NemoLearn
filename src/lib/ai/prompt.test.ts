import { describe, it } from "node:test";
import assert from "node:assert";
import { buildModularPrompt, buildSystemPrompt, getSubjectCategory } from "./prompt";
import { QuestionGenRequest } from "@/types/ai";

describe("NemoLearn AI Modular & Optimized Prompt Suite", () => {
  const mathReq: QuestionGenRequest = {
    subjectId: "matematika",
    subjectName: "Matematika",
    topicId: "kalkulus",
    topicName: "Kalkulus & Turunan",
    subtopic: "Turunan Fungsi Aljabar",
    questionCount: 5,
    mode: "reguler",
  };

  const physicsHotsReq: QuestionGenRequest = {
    subjectId: "fisika",
    subjectName: "Fisika",
    topicId: "termodinamika",
    topicName: "Hukum Termodinamika",
    questionCount: 5,
    mode: "hots",
  };

  const indonesianReq: QuestionGenRequest = {
    subjectId: "bahasa-indonesia",
    subjectName: "Bahasa Indonesia",
    topicId: "teks-editorial",
    topicName: "Struktur & Kaidah Teks Editorial",
    questionCount: 5,
    mode: "hots",
  };

  const historyReq: QuestionGenRequest = {
    subjectId: "sejarah",
    subjectName: "Sejarah Indonesia",
    topicId: "proklamasi",
    topicName: "Peristiwa Rengasdengklok",
    questionCount: 5,
    mode: "reguler",
  };

  it("1. Subject Category Classification: Mengklasifikasikan bidang studi dengan tepat", () => {
    assert.strictEqual(getSubjectCategory("matematika", "Matematika"), "exact");
    assert.strictEqual(getSubjectCategory("fisika", "Fisika"), "exact");
    assert.strictEqual(getSubjectCategory("kimia", "Kimia"), "exact");
    assert.strictEqual(getSubjectCategory("bahasa-indonesia", "Bahasa Indonesia"), "language");
    assert.strictEqual(getSubjectCategory("bahasa-inggris", "Bahasa Inggris"), "language");
    assert.strictEqual(getSubjectCategory("sejarah", "Sejarah Indonesia"), "social");
    assert.strictEqual(getSubjectCategory("ekonomi", "Ekonomi"), "social");
    assert.strictEqual(getSubjectCategory("geografi", "Geografi"), "social");
  });

  it("2. Core Prompt: Menghilangkan persona berlebih & sanjungan AI", () => {
    const prompt = buildModularPrompt(mathReq);
    assert.ok(!prompt.includes("Anda adalah pakar"));
    assert.ok(!prompt.includes("guru terbaik"));
    assert.ok(!prompt.includes("bermutu tinggi"));
    assert.ok(!prompt.includes("kaidah EBI"));
    assert.ok(prompt.includes("Buat 5 butir soal pilihan ganda SMA Matematika"));
    assert.ok(prompt.includes("Kalkulus & Turunan (Fokus: Turunan Fungsi Aljabar)"));
  });

  it("3. Subject Module: LaTeX hanya disertakan untuk sains/eksakta (tidak membebani bahasa/sosial)", () => {
    const mathPrompt = buildModularPrompt(mathReq);
    const indonesianPrompt = buildModularPrompt(indonesianReq);
    const historyPrompt = buildModularPrompt(historyReq);

    // Matematika WAJIB memiliki aturan LaTeX
    assert.ok(mathPrompt.includes("notasi LaTeX"));
    assert.ok(mathPrompt.includes("$rumus$"));

    // Bahasa Indonesia TIDAK butuh aturan LaTeX, tetapi butuh stimulus kutipan teks
    assert.ok(!indonesianPrompt.includes("notasi LaTeX"));
    assert.ok(indonesianPrompt.includes("kutipan paragraf/stimulus teks"));

    // Sejarah TIDAK butuh aturan LaTeX, tetapi butuh konteks data/fenomena sosial
    assert.ok(!historyPrompt.includes("notasi LaTeX"));
    assert.ok(historyPrompt.includes("fenomena sosial/alam, atau studi kasus"));
  });

  it("4. Mode Module: Hanya mengirim instruksi mode yang aktif (HOTS vs Reguler)", () => {
    const hotsPrompt = buildModularPrompt(physicsHotsReq);
    const regulerPrompt = buildModularPrompt(mathReq);

    // HOTS prompt
    assert.ok(hotsPrompt.includes("Mode: HOTS"));
    assert.ok(!hotsPrompt.includes("Mode: Reguler"));
    assert.ok(hotsPrompt.includes("studi kasus nyata, analisis"));

    // Reguler prompt
    assert.ok(regulerPrompt.includes("Mode: Reguler"));
    assert.ok(!regulerPrompt.includes("Mode: HOTS"));
  });

  it("5. Explanation Module: Fleksibel dan kondisional", () => {
    const withExplanation = buildModularPrompt(mathReq);
    const withoutExplanation = buildModularPrompt({
      ...mathReq,
      includeExplanation: false,
    });

    assert.ok(withExplanation.includes("penjelasan konsep terstruktur"));
    assert.ok(withoutExplanation.includes("Kosongkan explanation dan hint"));
  });

  it("6. Document Context Module: Hanya disertakan jika pengguna mengunggah dokumen/modul", () => {
    const withoutDoc = buildModularPrompt(mathReq);
    assert.ok(!withoutDoc.includes("Konteks Dokumen Referensi"));

    const withDoc = buildModularPrompt({
      ...mathReq,
      documentContext: "Modul Bab 4: Turunan Fungsi Trigonometri & Aturan Rantai.",
    });
    assert.ok(withDoc.includes("Konteks Dokumen Referensi"));
    assert.ok(withDoc.includes("Turunan Fungsi Trigonometri & Aturan Rantai"));
  });

  it("7. Retry Module: Hanya disertakan saat request retry perbaikan format", () => {
    const normalPrompt = buildModularPrompt(mathReq, false);
    assert.ok(!normalPrompt.includes("PERINGATAN: Respon sebelumnya"));

    const retryPrompt = buildModularPrompt(mathReq, true);
    assert.ok(retryPrompt.includes("PERINGATAN: Respon sebelumnya gagal diparsing"));
  });

  it("8. System Prompt: Ringkas, efisien, dan fokus pada peran tugas", () => {
    const systemPrompt = buildSystemPrompt();
    assert.ok(!systemPrompt.includes("pakar"));
    assert.ok(!systemPrompt.includes("terbaik"));
    assert.strictEqual(
      systemPrompt,
      "Generator soal SMA Kurikulum Merdeka. Format keluaran HANYA JSON array valid sesuai skema."
    );
  });

  it("9. Token & Character Optimization Benchmark", () => {
    // Definisi prompt lama sebelum optimasi untuk benchmark perbandingan
    const oldPrompt = `Anda adalah pakar pembuat soal ujian nasional dan UTBK SMA Kurikulum Merdeka Indonesia.
Buatlah tepat 5 butir soal pilihan ganda bermutu tinggi untuk:
- Tingkat: SMA (Sekolah Menengah Atas)
- Mata Pelajaran: Matematika
- Materi Pokok: Kalkulus & Turunan dengan submateri spesifik: "Turunan Fungsi Aljabar"
- Mode: Reguler (konseptual, pemahaman, dan penerapan rumus standar SMA)

Ketentuan Khusus:
1. Setiap soal WAJIB memiliki:
   - stem: teks pertanyaan yang jelas, lengkap, dan berbobot.
   - options: 5 pilihan jawaban (A, B, C, D, E). Opsi tidak boleh ambigu dan harus realistis (pengecoh yang baik).
   - correctAnswer: tepat satu huruf kapital ("A", "B", "C", "D", atau "E").
   - explanation: pembahasan konsep langkah-demi-langkah yang mendidik dan mudah dipahami siswa SMA.
   - hint: petunjuk konseptual/rumus kunci untuk menuntun siswa (DILARANG membocorkan kunci jawaban atau menyebut huruf opsi langsung).
2. Gunakan notasi LaTeX untuk semua rumus matematika/fisika/kimia dengan format $rumus$ (inline) atau $$rumus$$ (display).
3. Bahasa Indonesia yang digunakan harus baku, natural, dan sesuai kaidah EBI.
4. Jangan ada soal yang menduplikasi stem atau inti pertanyaan lain dalam satu sesi.

Keluarkan HANYA format JSON murni berupa array of objects sesuai struktur berikut:
[
  {
    "stem": "Pertanyaan dengan rumus $x = \\\\frac{-b \\\\pm \\\\sqrt{D}}{2a}$...",
    "options": {
      "A": "Pilihan A",
      "B": "Pilihan B",
      "C": "Pilihan C",
      "D": "Pilihan D",
      "E": "Pilihan E"
    },
    "correctAnswer": "A",
    "explanation": "Langkah 1... Langkah 2... Jadi opsi yang benar adalah A.",
    "hint": "Gunakan rumus kuadrat abc untuk menentukan akar-akar persamaan.",
    "difficulty": "sedang"
  }
]`;

    const newPrompt = buildModularPrompt(mathReq);

    const oldChars = oldPrompt.length;
    const newChars = newPrompt.length;
    const oldWords = oldPrompt.split(/\s+/).length;
    const newWords = newPrompt.split(/\s+/).length;

    // Pengurangan karakter dan kata minimal 50%
    const reductionRatio = (oldChars - newChars) / oldChars;
    assert.ok(reductionRatio >= 0.45, `Expected >= 45% reduction, got ${Math.round(reductionRatio * 100)}%`);
    assert.ok(newWords < oldWords * 0.6, `Expected new words < 60% of old words`);
  });
});
