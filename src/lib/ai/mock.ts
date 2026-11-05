import { AIProvider, QuestionGenRequest, AITestResult, ExplanationGenRequest } from "@/types/ai";
import { Question, QuestionDifficulty } from "@/types/question";
import { QuestionRepository } from "@/lib/db";

interface MockQuestionSeed {
  stem: string;
  options: { key: "A" | "B" | "C" | "D" | "E"; text: string }[];
  correctAnswer: "A" | "B" | "C" | "D" | "E";
  explanation: string;
  hint?: string;
  difficulty: QuestionDifficulty;
  subtopic: string;
}

const QUESTION_BANK: Record<string, Record<string, MockQuestionSeed[]>> = {
  fisika: {
    dinamika: [
      {
        stem: "Sebuah balok bermassa $m = 4\\text{ kg}$ ditarik dengan gaya konstan $F = 30\\text{ N}$ mendatar pada lantai kasar dengan koefisien gesek kinetis $\\mu_k = 0{,}2$. Jika percepatan gravitasi $g = 10\\text{ m/s}^2$, berapakah percepatan balok tersebut?",
        options: [
          { key: "A", text: "$4{,}5\\text{ m/s}^2$" },
          { key: "B", text: "$5{,}5\\text{ m/s}^2$" },
          { key: "C", text: "$6{,}0\\text{ m/s}^2$" },
          { key: "D", text: "$7{,}5\\text{ m/s}^2$" },
          { key: "E", text: "$8{,}0\\text{ m/s}^2$" },
        ],
        correctAnswer: "B",
        explanation: "1. Gaya normal balok pada lantai mendatar: $N = m \\cdot g = 4 \\cdot 10 = 40\\text{ N}$.\n2. Gaya gesek kinetis: $f_k = \\mu_k \\cdot N = 0{,}2 \\cdot 40 = 8\\text{ N}$.\n3. Hukum II Newton: $\\Sigma F = m \\cdot a \\implies F - f_k = m \\cdot a$.\n4. $30 - 8 = 4 \\cdot a \\implies 22 = 4a \\implies a = 5{,}5\\text{ m/s}^2$.\nJawaban yang benar adalah B.",
        difficulty: "sedang",
        subtopic: "Hukum II Newton & Gaya Gesek",
      },
      {
        stem: "Dua buah benda bermassa $m_1 = 3\\text{ kg}$ dan $m_2 = 2\\text{ kg}$ dihubungkan dengan tali ringan melalui katrol licin tanpa gesekan (pesawat Atwood). Tentukan percepatan gerak kedua beban jika $g = 10\\text{ m/s}^2$.",
        options: [
          { key: "A", text: "$1{,}0\\text{ m/s}^2$" },
          { key: "B", text: "$2{,}0\\text{ m/s}^2$" },
          { key: "C", text: "$2{,}5\\text{ m/s}^2$" },
          { key: "D", text: "$3{,}0\\text{ m/s}^2$" },
          { key: "E", text: "$4{,}0\\text{ m/s}^2$" },
        ],
        correctAnswer: "B",
        explanation: "Percepatan pada sistem pesawat Atwood dirumuskan dengan:\n$$a = \\frac{m_1 - m_2}{m_1 + m_2} g$$\nSubstitusi nilai:\n$$a = \\frac{3 - 2}{3 + 2} \\cdot 10 = \\frac{1}{5} \\cdot 10 = 2{,}0\\text{ m/s}^2$$\nJawaban yang benar adalah B.",
        difficulty: "sedang",
        subtopic: "Hukum II Newton & Katrol",
      },
      {
        stem: "Seseorang dengan massa $60\\text{ kg}$ berdiri di atas timbangan di dalam lift. Timbangan menunjukkan angka $720\\text{ N}$. Jika $g = 10\\text{ m/s}^2$, pernyataan manakah mengenai gerak lift yang BENAR? (HOTS)",
        options: [
          { key: "A", text: "Lift bergerak turun dengan percepatan $2\\text{ m/s}^2$" },
          { key: "B", text: "Lift bergerak ke atas dengan percepatan $2\\text{ m/s}^2$" },
          { key: "C", text: "Lift bergerak ke atas dengan kecepatan konstan" },
          { key: "D", text: "Lift bergerak bebas jatuh ke bawah" },
          { key: "E", text: "Lift sedang berhenti total di lantai puncak" },
        ],
        correctAnswer: "B",
        explanation: "1. Berat sesungguhnya orang tersebut adalah $W = m \\cdot g = 60 \\cdot 10 = 600\\text{ N}$.\n2. Berat semu yang ditunjukkan timbangan adalah gaya normal $N = 720\\text{ N}$.\n3. Karena $N > W$, maka lift sedang mengalami percepatan ke atas: $N - W = m \\cdot a$.\n4. $720 - 600 = 60 \\cdot a \\implies 120 = 60a \\implies a = 2\\text{ m/s}^2$ ke atas.\nJawaban yang tepat adalah B.",
        difficulty: "hots",
        subtopic: "Hukum Newton dalam Lift",
      },
      {
        stem: "Dua planet $A$ dan $B$ mengorbit bintang yang sama. Jarak rata-rata planet $A$ ke bintang adalah 4 kali jarak planet $B$ ke bintang. Jika periode revolusi planet $B$ adalah 1 tahun bumi, berapakah periode revolusi planet $A$? (HOTS)",
        options: [
          { key: "A", text: "2 tahun" },
          { key: "B", text: "4 tahun" },
          { key: "C", text: "8 tahun" },
          { key: "D", text: "16 tahun" },
          { key: "E", text: "64 tahun" },
        ],
        correctAnswer: "C",
        explanation: "Berdasarkan Hukum III Kepler:\n$$\\left(\\frac{T_A}{T_B}\\right)^2 = \\left(\\frac{R_A}{R_B}\\right)^3$$\nDiketahui $R_A = 4 R_B$ dan $T_B = 1$ tahun:\n$$\\left(\\frac{T_A}{1}\\right)^2 = 4^3 = 64 \\implies T_A = \\sqrt{64} = 8\\text{ tahun}$$\nJawaban yang benar adalah C.",
        difficulty: "hots",
        subtopic: "Gaya Gravitasi & Hukum Kepler",
      },
      {
        stem: "Balok diletakkan pada bidang miring kasar bersudut $\\theta = 37^\\circ$ ($\\sin 37^\\circ = 0{,}6$, $\\cos 37^\\circ = 0{,}8$). Jika koefisien gesek statis $\\mu_s = 0{,}5$, apakah balok akan meluncur turun?",
        options: [
          { key: "A", text: "Tidak meluncur, karena $\\tan 37^\\circ < \\mu_s$" },
          { key: "B", text: "Meluncur turun, karena $\\tan 37^\\circ = 0{,}75 > \\mu_s$" },
          { key: "C", text: "Tepat akan bergerak dan langsung berhenti lagi" },
          { key: "D", text: "Diam karena gaya gravitasi seimbang dengan gaya normal" },
          { key: "E", text: "Meluncur ke atas karena gaya dorong permukaan" },
        ],
        correctAnswer: "B",
        explanation: "Syarat benda meluncur turun pada bidang miring adalah $w \\sin \\theta > f_{s,\\text{maks}} = \\mu_s w \\cos \\theta$, yang setara dengan $\\tan \\theta > \\mu_s$.\nDisini $\\tan 37^\\circ = \\frac{0{,}6}{0{,}8} = 0{,}75$.\nKarena $0{,}75 > 0{,}5$, gaya penahan tidak mampu menahan komponen gravitasi sejajar bidang, sehingga balok meluncur turun. Jawaban: B.",
        difficulty: "sedang",
        subtopic: "Bidang Miring Kasar",
      },
    ],
    kinematika: [
      {
        stem: "Sebuah mobil bergerak dengan kecepatan awal $v_0 = 10\\text{ m/s}$ dan dipercepat secara beraturan dengan $a = 3\\text{ m/s}^2$. Jarak tempuh mobil setelah melaju selama $t = 4\\text{ sekon}$ adalah...",
        options: [
          { key: "A", text: "$44\\text{ meter}$" },
          { key: "B", text: "$54\\text{ meter}$" },
          { key: "C", text: "$64\\text{ meter}$" },
          { key: "D", text: "$70\\text{ meter}$" },
          { key: "E", text: "$84\\text{ meter}$" },
        ],
        correctAnswer: "C",
        explanation: "Gunakan rumus GLBB untuk jarak:\n$$s = v_0 t + \\frac{1}{2} a t^2$$\n$$s = (10 \\cdot 4) + \\frac{1}{2} (3) (4^2) = 40 + \\frac{1}{2}(3)(16) = 40 + 24 = 64\\text{ m}$$\nJawaban yang benar adalah C.",
        difficulty: "mudah",
        subtopic: "GLBB",
      },
      {
        stem: "Peluru ditembakkan dengan kecepatan awal $v_0 = 40\\text{ m/s}$ pada sudut elevasi $30^\\circ$. Berapakah ketinggian maksimum yang dicapai peluru jika $g = 10\\text{ m/s}^2$?",
        options: [
          { key: "A", text: "$10\\text{ meter}$" },
          { key: "B", text: "$20\\text{ meter}$" },
          { key: "C", text: "$30\\text{ meter}$" },
          { key: "D", text: "$40\\text{ meter}$" },
          { key: "E", text: "$60\\text{ meter}$" },
        ],
        correctAnswer: "B",
        explanation: "Rumus tinggi maksimum gerak parabola:\n$$h_{\\text{maks}} = \\frac{v_0^2 \\sin^2 \\theta}{2g}$$\n$$h_{\\text{maks}} = \\frac{40^2 \\cdot (0{,}5)^2}{2 \\cdot 10} = \\frac{1600 \\cdot 0{,}25}{20} = \\frac{400}{20} = 20\\text{ meter}$$\nJawaban yang benar adalah B.",
        difficulty: "sedang",
        subtopic: "Gerak Parabola",
      },
    ],
  },
  matematika: {
    "aljabar-persamaan": [
      {
        stem: "Jika $\\alpha$ dan $\\beta$ adalah akar-akar dari persamaan kuadrat $2x^2 - 6x + 3 = 0$, tentukan nilai dari $\\alpha^2 + \\beta^2$.",
        options: [
          { key: "A", text: "3" },
          { key: "B", text: "6" },
          { key: "C", text: "9" },
          { key: "D", text: "12" },
          { key: "E", text: "15" },
        ],
        correctAnswer: "B",
        explanation: "Berdasarkan teorema Vieta:\n- $\\alpha + \\beta = -\\frac{b}{a} = -\\frac{-6}{2} = 3$\n- $\\alpha \\cdot \\beta = \\frac{c}{a} = \\frac{3}{2}$\n\nMaka:\n$$\\alpha^2 + \\beta^2 = (\\alpha + \\beta)^2 - 2\\alpha\\beta = 3^2 - 2\\left(\\frac{3}{2}\\right) = 9 - 3 = 6$$\nJawaban yang benar adalah B.",
        difficulty: "sedang",
        subtopic: "Persamaan Kuadrat & Vieta",
      },
      {
        stem: "Himpunan penyelesaian dari pertidaksamaan rasional $\\frac{x - 3}{x + 2} \\le 0$ adalah...",
        options: [
          { key: "A", text: "$\\{x \\mid -2 < x \\le 3\\}$" },
          { key: "B", text: "$\\{x \\mid -2 \\le x \\le 3\\}$" },
          { key: "C", text: "$\\{x \\mid x < -2 \\text{ atau } x \\ge 3\\}$" },
          { key: "D", text: "$\\{x \\mid x \\le -2 \\text{ atau } x > 3\\}$" },
          { key: "E", text: "$\\{x \\mid 2 < x \\le 3\\}$" },
        ],
        correctAnswer: "A",
        explanation: "1. Pembuat nol pembilang: $x - 3 = 0 \\implies x = 3$.\n2. Pembuat nol penyebut: $x + 2 = 0 \\implies x = -2$. Perhatikan bahwa penyebut tidak boleh nol ($x \\neq -2$).\n3. Garis bilangan:\n- Untuk $x < -2$: $(-)/(-) = (+)$\n- Untuk $-2 < x \\le 3$: $(+)/(-) = (-)$\n- Untuk $x > 3$: $(+)/(+) = (+)$\n4. Karena tanda $\\le 0$, daerah negatif yang dipilih adalah $-2 < x \\le 3$.\nJawaban yang benar adalah A.",
        difficulty: "sedang",
        subtopic: "Pertidaksamaan Rasional",
      },
      {
        stem: "Sebuah roket diluncurkan ke atas dengan lintasan berbentuk parabola yang memenuhi tinggi $h(t) = 40t - 5t^2$ dalam meter setelah $t$ detik. Waktu yang dibutuhkan untuk mencapai titik tertinggi dan tinggi maksimumnya berturut-turut adalah... (HOTS)",
        options: [
          { key: "A", text: "$4\\text{ detik}$ dan $80\\text{ meter}$" },
          { key: "B", text: "$4\\text{ detik}$ dan $100\\text{ meter}$" },
          { key: "C", text: "$5\\text{ detik}$ dan $75\\text{ meter}$" },
          { key: "D", text: "$2\\text{ detik}$ dan $60\\text{ meter}$" },
          { key: "E", text: "$8\\text{ detik}$ dan $160\\text{ meter}$" },
        ],
        correctAnswer: "A",
        explanation: "Tinggi maksimum tercapai saat turunan pertama kecepatan sama dengan nol:\n$$h'(t) = 40 - 10t = 0 \\implies 10t = 40 \\implies t = 4\\text{ detik}$$\nTinggi maksimum:\n$$h(4) = 40(4) - 5(4^2) = 160 - 80 = 80\\text{ meter}$$\nJawaban yang benar adalah A.",
        difficulty: "hots",
        subtopic: "Aplikasi Fungsi Kuadrat",
      },
    ],
    trigonometri: [
      {
        stem: "Diketahui $\\tan \\alpha = \\frac{3}{4}$ dengan sudut $\\alpha$ berada di kuadran III. Nilai dari $\\sin \\alpha + \\cos \\alpha$ adalah...",
        options: [
          { key: "A", text: "$-\\frac{7}{5}$" },
          { key: "B", text: "$-\\frac{1}{5}$" },
          { key: "C", text: "$\\frac{1}{5}$" },
          { key: "D", text: "$\\frac{7}{5}$" },
          { key: "E", text: "$-\\frac{5}{7}$" },
        ],
        correctAnswer: "A",
        explanation: "Karena $\\alpha$ di kuadran III, nilai $\\sin \\alpha$ dan $\\cos \\alpha$ bernilai negatif.\nSegitiga siku-siku dengan sisi depan 3 dan samping 4 memiliki sisi miring $\\sqrt{3^2 + 4^2} = 5$.\nMaka $\\sin \\alpha = -\\frac{3}{5}$ dan $\\cos \\alpha = -\\frac{4}{5}$.\n$$\\sin \\alpha + \\cos \\alpha = -\\frac{3}{5} + \\left(-\\frac{4}{5}\\right) = -\\frac{7}{5}$$\nJawaban yang benar adalah A.",
        difficulty: "sedang",
        subtopic: "Perbandingan Trigonometri",
      },
    ],
  },
  kimia: {
    "struktur-atom": [
      {
        stem: "Suatu atom netral memiliki nomor atom 26 dan nomor massa 56. Konfigurasi elektron atom tersebut menurut prinsip Aufbau adalah...",
        options: [
          { key: "A", text: "$[\\text{Ar}]\\, 4s^2\\, 3d^6$" },
          { key: "B", text: "$[\\text{Ar}]\\, 4s^1\\, 3d^7$" },
          { key: "C", text: "$[\\text{Ar}]\\, 3d^8$" },
          { key: "D", text: "$[\\text{Ne}]\\, 3s^2\\, 3p^6\\, 3d^6$" },
          { key: "E", text: "$[\\text{Kr}]\\, 4s^2\\, 3d^6$" },
        ],
        correctAnswer: "A",
        explanation: "Nomor atom 26 (Besi/Fe). Gas mulia sebelum nomor 26 adalah Argon ($[\\text{Ar}]$ dengan 18 elektron). Sisa 8 elektron mengisi subkulit $4s$ sebanyak 2 elektron dan $3d$ sebanyak 6 elektron: $[\\text{Ar}]\\, 4s^2\\, 3d^6$. Jawaban: A.",
        difficulty: "mudah",
        subtopic: "Konfigurasi Elektron",
      },
    ],
  },
  biologi: {
    sel: [
      {
        stem: "Organel sel yang berperan sebagai 'pembangkit tenaga' sel melalui produksi ATP dalam respirasi seluler adalah...",
        options: [
          { key: "A", text: "Mitokondria" },
          { key: "B", text: "Badan Golgi" },
          { key: "C", text: "Retikulum Endoplasma Kasar" },
          { key: "D", text: "Lisosom" },
          { key: "E", text: "Kloroplas" },
        ],
        correctAnswer: "A",
        explanation: "Mitokondria merupakan organel sel eukariotik bermembran ganda tempat terjadinya siklus Krebs dan fosforilasi oksidatif untuk memproduksi molekul energi ATP. Jawaban: A.",
        difficulty: "mudah",
        subtopic: "Organel Sel",
      },
    ],
  },
};

export class MockAIProvider implements AIProvider {
  name = "Bank Soal Kurikulum Merdeka (Offline)";
  providerType = "mock" as const;

  async testConnection(): Promise<AITestResult> {
    return {
      success: true,
      message: "Bank Soal Kurikulum Merdeka (Offline / Curated Bank) siap dan aktif.",
      provider: "mock",
      model: "curated-sma-bank-v1",
      latencyMs: 1,
    };
  }

  async generateQuestions(req: QuestionGenRequest): Promise<Question[]> {
    const { subjectId, topicId, subtopic, questionCount, mode } = req;
    const requestedCount = Math.min(Math.max(questionCount, 1), 30);

    // 1. Ambil soal yang sudah dipublikasikan dari Database Bank Soal (buatan Guru & Admin)
    const existingDbQuestions = QuestionRepository.findPublished({
      subjectId,
      topicId,
      mode: mode === "hots" ? "hots" : undefined,
      limit: requestedCount,
    });

    if (existingDbQuestions.length >= requestedCount) {
      return existingDbQuestions.slice(0, requestedCount);
    }

    const results: Question[] = [...existingDbQuestions];
    const needed = requestedCount - results.length;

    const subjectPool = QUESTION_BANK[subjectId.toLowerCase()] || {};
    const topicSeeds: MockQuestionSeed[] = subjectPool[topicId.toLowerCase()] || [];

    // Filter by mode if requested (HOTS) strictly within the requested topic
    let filteredSeeds = topicSeeds;
    if (mode === "hots") {
      filteredSeeds = topicSeeds.filter((s) => s.difficulty === "hots");
    }

    let seedIdx = 0;
    const usedStems = new Set(results.map((q) => q.stem));

    for (let i = 0; i < needed; i++) {
      let seed: MockQuestionSeed;

      if (filteredSeeds.length > 0) {
        seed = filteredSeeds[seedIdx % filteredSeeds.length];
        seedIdx++;
      } else {
        // Fallback procedural question generator for any subject/topic
        seed = this.generateProceduralQuestion(req, i + 1);
      }

      // Variation modifier to ensure unique questions when questionCount > seed count
      const isVariation = usedStems.has(seed.stem) || (i >= filteredSeeds.length && filteredSeeds.length > 0);
      const questionStem = isVariation
        ? `[Variasi ${i + 1}] ${seed.stem}`
        : seed.stem;

      usedStems.add(questionStem);

      results.push({
        id: `q_${subjectId}_${topicId}_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
        subjectId,
        topicId,
        subtopic: subtopic || seed.subtopic,
        level: "SMA",
        type: "pilihan_ganda",
        stem: questionStem,
        options: seed.options,
        correctAnswer: seed.correctAnswer,
        explanation: seed.explanation,
        hint: seed.hint || (seed.subtopic ? `Perhatikan konsep dasar materi ${seed.subtopic}.` : undefined),
        isAiGenerated: false,
        difficulty: mode === "hots" ? "hots" : seed.difficulty,
        sourceType: "curated_bank",
        sourceReference: `Kurikulum Merdeka SMA - ${req.subjectName} (${req.topicName})`,
        createdAt: new Date().toISOString(),
      });
    }

    return results;
  }

  private generateProceduralQuestion(
    req: QuestionGenRequest,
    index: number
  ): MockQuestionSeed {
    const isHots = req.mode === "hots";
    const subtopicTitle = req.subtopic || req.topicName;

    if (isHots) {
      return {
        stem: `Perhatikan studi kasus berikut terkait materi ${subtopicTitle} (${req.subjectName}). Pada sebuah eksperimen terkontrol, variabel $X$ ditingkatkan secara berkala dari kondisi awal $X_0$ menuju $2X_0$. Analisislah dampak perubahan tersebut terhadap stabilitas sistem berdasarkan prinsip dasar ${req.topicName}!`,
        options: [
          { key: "A", text: "Efisiensi sistem menurun drastis karena resistansi internal meningkat secara eksponensial." },
          { key: "B", text: "Respon sistem meningkat sebanding secara linier tanpa merusak kesetimbangan awal." },
          { key: "C", text: "Terjadi kondisi saturasi yang menyebabkan penurunan laju reaksi secara bertahap." },
          { key: "D", text: "Keseimbangan dinamis bergeser ke arah yang meminimalkan gangguan sesuai prinsip kesetimbangan." },
          { key: "E", text: "Sistem tidak mengalami perubahan apapun karena variabel $X$ bersifat independen." },
        ],
        correctAnswer: "D",
        explanation: `Analisis Konseptual:\nBerdasarkan prinsip kesetimbangan dan hukum konservasi pada materi ${req.topicName}, setiap induksi perubahan pada variabel sistem akan diimbangi oleh pergeseran kompensatoris untuk mencapai keadaan ekuilibrium baru.\nDengan demikian, opsi D merupakan jawaban yang paling tepat secara analitis.`,
        difficulty: "hots",
        subtopic: subtopicTitle,
      };
    }

    return {
      stem: `Berdasarkan kaidah dasar materi ${subtopicTitle} pada mata pelajaran ${req.subjectName}, manakah pernyataan berikut yang paling tepat menggambarkan karakteristik utama dari konsep tersebut?`,
      options: [
        { key: "A", text: `Prinsip utama berfokus pada hubungan kausalitas dan parameter terukur pada fenomena ${req.topicName}.` },
        { key: "B", text: "Hanya berlaku dalam kondisi vakum absolut tanpa memperhitungkan variabel lingkungan." },
        { key: "C", text: "Merupakan pendekatan empiris tanpa landasan teoritis yang dapat diuji ulang." },
        { key: "D", text: "Menolak seluruh hukum kekekalan yang telah berlaku sebelumnya." },
        { key: "E", text: "Tidak dapat diaplikasikan dalam penyelesaian masalah nyata di tingkat SMA." },
      ],
      correctAnswer: "A",
      explanation: `Pembahasan:\nPada konsep dasar ${req.topicName}, pemahaman hubungan kausalitas antar variabel merupakan pondasi utama dalam memecahkan soal-soal latihan secara terstruktur.\nJawaban yang benar adalah A.`,
      difficulty: "sedang",
      subtopic: subtopicTitle,
    };
  }

  async generateExplanation(req: ExplanationGenRequest): Promise<string> {
    const depth = req.depth || "normal";
    const correctOpt = req.options.find((o) => o.key === req.correctAnswer);
    const correctText = correctOpt ? correctOpt.text : `Opsi ${req.correctAnswer}`;

    // Cek apakah ada pembahasan bawaan dari database untuk butir soal ini
    const existing = QuestionRepository.getById(req.questionId);
    const baseExplanation =
      existing?.explanation && existing.explanation.length > 15
        ? existing.explanation
        : `Berdasarkan prinsip kurikulum SMA ${req.subjectName}, opsi **${req.correctAnswer}** (${correctText}) merupakan jawaban yang paling tepat.`;

    if (depth === "singkat") {
      return `Jawaban yang benar adalah **${req.correctAnswer}** (${correctText}). Alasan utama: konsep dasar ${req.subjectName} membuktikan hubungan kausalitas yang konsisten dengan pilihan ini.`;
    }

    if (depth === "mendalam") {
      return `### Pembahasan Mendalam (Kurikulum Merdeka SMA)\n\n1. **Konsep & Landasan Teori:**\nPada materi ${req.subjectName} (${req.topicName || "SMA"}), penyelesaian didasarkan pada penalaran analitis dan prinsip formal keilmuan.\n\n2. **Langkah Solusi Runtut:**\n${baseExplanation}\n\n3. **Analisis Pilihan Lain & Pengecoh:**\nOpsi selain ${req.correctAnswer} merupakan distractor umum yang timbul jika siswa melewatkan asumsi dasar atau keliru dalam menginterpretasi notasi.\n\n4. **Tips Mencegah Miskonsepsi:**\nPerhatikan variabel pembatas dan pastikan memeriksa kembali kesesuaian dimensi/satuan sebelum memilih jawaban akhir.`;
    }

    // Normal (default)
    return `### Pembahasan Konsep:\n${baseExplanation}\n\nDengan demikian, pilihan yang tepat adalah **${req.correctAnswer}**.`;
  }
}
