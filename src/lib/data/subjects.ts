import { Subject } from "@/types/subject";

export const SMA_SUBJECTS: Subject[] = [
  {
    id: "matematika",
    name: "Matematika",
    category: "saintek",
    icon: "Calculator",
    topics: [
      {
        id: "aljabar-persamaan",
        name: "Aljabar & Persamaan Kuadrat",
        subtopics: ["Persamaan Kuadrat", "Fungsi Kuadrat", "Pertidaksamaan Rasional"],
      },
      {
        id: "trigonometri",
        name: "Trigonometri",
        subtopics: ["Perbandingan Trigonometri", "Identitas Trigonometri", "Aturan Sinus & Cosinus"],
      },
      {
        id: "kalkulus",
        name: "Kalkulus (Turunan & Integral)",
        subtopics: ["Limit Fungsi", "Turunan Aljabar", "Aplikasi Turunan", "Integral Tak Tentu"],
      },
      {
        id: "barisan-deret",
        name: "Barisan & Deret",
        subtopics: ["Aritmetika", "Geometri", "Deret Geometri Tak Hingga"],
      },
      {
        id: "matriks-transformasi",
        name: "Matriks & Transformasi Geometri",
        subtopics: ["Operasi Matriks", "Determinan & Invers", "Translasi & Rotasi"],
      },
      {
        id: "peluang-kombinatorika",
        name: "Peluang & Kombinatorika",
        subtopics: ["Kaidah Pencacahan", "Permutasi & Kombinasi", "Peluang Kejadian Majemuk"],
      },
    ],
  },
  {
    id: "fisika",
    name: "Fisika",
    category: "saintek",
    icon: "Zap",
    topics: [
      {
        id: "kinematika",
        name: "Kinematika Gerak Lurus",
        subtopics: ["GLB & GLBB", "Gerak Parabola", "Gerak Melingkar Beraturan"],
      },
      {
        id: "dinamika",
        name: "Dinamika Gerak & Hukum Newton",
        subtopics: ["Hukum I & II Newton", "Hukum III Newton & Gaya Gesek", "Gaya Gravitasi"],
      },
      {
        id: "usaha-energi",
        name: "Usaha dan Energi",
        subtopics: ["Konsep Usaha", "Teorema Usaha-Energi", "Hukum Kekekalan Energi Mekanik"],
      },
      {
        id: "momentum-impuls",
        name: "Momentum dan Impuls",
        subtopics: ["Impuls & Perubahan Momentum", "Tumbukan Lenting Sempurna & Sebagian"],
      },
      {
        id: "termodinamika",
        name: "Suhu, Kalor & Termodinamika",
        subtopics: ["Asas Black", "Perpindahan Kalor", "Hukum Termodinamika I & II"],
      },
      {
        id: "listrik-magnet",
        name: "Listrik Statis & Dinamis",
        subtopics: ["Hukum Coulomb", "Rangkaian Arus Searah (Ohm & Kirchhoff)", "Gaya Lorentz"],
      },
    ],
  },
  {
    id: "kimia",
    name: "Kimia",
    category: "saintek",
    icon: "FlaskConical",
    topics: [
      {
        id: "struktur-atom",
        name: "Struktur Atom & Sistem Periodik",
        subtopics: ["Konfigurasi Elektron", "Sifat Keperiodikan Unsur", "Bilangan Kuantum"],
      },
      {
        id: "ikatan-kimia",
        name: "Ikatan Kimia & Bentuk Molekul",
        subtopics: ["Ikatan Ion & Kovalen", "Teori VSEPR", "Gaya Antarmolekul"],
      },
      {
        id: "stoikiometri",
        name: "Stoikiometri & Hukum Dasar Kimia",
        subtopics: ["Konsep Mol", "Kadar Zat", "Pereaksi Pembatas"],
      },
      {
        id: "termokimia",
        name: "Termokimia & Laju Reaksi",
        subtopics: ["Entalpi Reaksi & Hukum Hess", "Faktor Laju Reaksi", "Orde Reaksi"],
      },
      {
        id: "asam-basa",
        name: "Asam Basa & Larutan Penyangga",
        subtopics: ["Teori Asam Basa", "pH Asam/Basa", "Larutan Buffer", "Hidrolisis Garam"],
      },
    ],
  },
  {
    id: "biologi",
    name: "Biologi",
    category: "saintek",
    icon: "Dna",
    topics: [
      {
        id: "sel",
        name: "Struktur & Fungsi Sel",
        subtopics: ["Organel Sel", "Transpor Membran", "Perbedaan Sel Tumbuhan & Hewan"],
      },
      {
        id: "metabolisme",
        name: "Metabolisme Sel",
        subtopics: ["Kerja Enzim", "Respirasi Aerob & Anaerob", "Fotosintesis"],
      },
      {
        id: "genetika",
        name: "Genetika & Pewarisan Sifat",
        subtopics: ["DNA, RNA & Sintesis Protein", "Hukum Mendel", "Penyimpangan Semu Hukum Mendel"],
      },
      {
        id: "ekologi",
        name: "Ekologi & Perubahan Lingkungan",
        subtopics: ["Rantai Makanan & Jaring-jaring", "Daur Biogeokimia", "Dampak Polusi"],
      },
    ],
  },
  {
    id: "ekonomi",
    name: "Ekonomi",
    category: "soshum",
    icon: "TrendingUp",
    topics: [
      {
        id: "konsep-ekonomi",
        name: "Konsep Dasar Ekonomi & Kelangkaan",
        subtopics: ["Biaya Peluang", "Masalah Pokok Ekonomi", "Sistem Ekonomi"],
      },
      {
        id: "mekanisme-pasar",
        name: "Mekanisme Pasar & Elastisitas",
        subtopics: ["Hukum Permintaan & Penawaran", "Harga Keseimbangan", "Elastisitas"],
      },
      {
        id: "pendapatan-nasional",
        name: "Pendapatan Nasional & Kebijakan",
        subtopics: ["Komponen PDB/GNP", "Inflasi", "Kebijakan Moneter & Fiskal"],
      },
      {
        id: "akuntansi",
        name: "Akuntansi Dasar",
        subtopics: ["Persamaan Dasar Akuntansi", "Jurnal Umum", "Buku Besar"],
      },
    ],
  },
  {
    id: "bahasa-indonesia",
    name: "Bahasa Indonesia",
    category: "umum",
    icon: "BookOpen",
    topics: [
      {
        id: "teks-informasi",
        name: "Pemahaman Teks & Ide Pokok",
        subtopics: ["Gagasan Utama & Pendukung", "Simpulan & Rangkuman", "Makna Tersirat"],
      },
      {
        id: "kaidah-kebahasaan",
        name: "Kaidah Kebahasaan & Kalimat Efektif",
        subtopics: ["Ejaan Bahasa Indonesia (EBI)", "Konjungsi & Diksi", "Kalimat Efektif"],
      },
      {
        id: "teks-argumentasi",
        name: "Teks Editorial & Argumentasi",
        subtopics: ["Struktur Teks Editorial", "Fakta vs Opini", "Keberpihakan Penulis"],
      },
    ],
  },
  {
    id: "bahasa-inggris",
    name: "Bahasa Inggris",
    category: "umum",
    icon: "Globe",
    topics: [
      {
        id: "reading-comprehension",
        name: "Reading Comprehension & Inferences",
        subtopics: ["Main Idea & Purpose", "Detail Information", "Context Clues & Vocabulary"],
      },
      {
        id: "grammar-structure",
        name: "Grammar & Sentence Structure",
        subtopics: ["Tenses in Context", "Passive Voice", "Conditional Sentences (Type 1, 2, 3)"],
      },
      {
        id: "exposition-texts",
        name: "Analytical & Hortatory Exposition",
        subtopics: ["Thesis, Arguments, Reiteration", "Connectives & Modals"],
      },
    ],
  },
];
