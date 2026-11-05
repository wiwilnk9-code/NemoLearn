"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Search,
  MessageSquare,
  Bug,
  Mail,
  ChevronDown,
  ChevronUp,
  Star,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  Cpu,
  TrendingUp,
  ShieldCheck,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface FaqItem {
  q: string;
  a: string;
  category: "akun" | "ai" | "irt" | "remedial" | "privasi";
}

const FAQ_LIST: FaqItem[] = [
  // Akun
  {
    category: "akun",
    q: "Bagaimana cara mendaftar akun di NemoLearn?",
    a: "Anda dapat mendaftar melalui halaman Registrasi (/register). Isi nama lengkap, email aktif, dan kata sandi minimal 8 karakter (memuat huruf dan angka). Setelah mendaftar, periksa kotak masuk email Anda untuk melakukan verifikasi akun.",
  },
  {
    category: "akun",
    q: "Bagaimana jika saya lupa kata sandi?",
    a: "Gunakan tautan 'Lupa kata sandi?' pada halaman Login (/forgot-password). Masukkan alamat email Anda, dan sistem akan menerbitkan instruksi serta token reset kata sandi baru.",
  },
  {
    category: "akun",
    q: "Bagaimana cara menghapus akun dan data pribadi saya?",
    a: "Anda memiliki hak penuh untuk menghapus akun kapan saja. Buka menu Profil Saya (/profile), gulir ke bagian 'Zona Bahaya', lalu klik 'Hapus Akun Saya'. Masukkan kata sandi Anda untuk verifikasi identitas. Data profil Anda akan dihapus secara permanen dari server dan sesi login akan dicabut seketika.",
  },

  // AI & Kuota
  {
    category: "ai",
    q: "Mengapa ada pembatasan kuota pada AI Question Generator?",
    a: "Pemanggilan model kecerdasan buatan (Google Gemini & OpenAI) membutuhkan komputasi cloud yang signifikan. Sistem kuota harian diterapkan agar infrastruktur server tetap stabil, mencegah bot abuse, dan menjamin distribusi akses yang adil bagi seluruh siswa dan guru.",
  },
  {
    category: "ai",
    q: "Bagaimana cara mendapatkan izin akses AI Question Generator?",
    a: "Secara default akun baru memiliki status akses AI terkunci. Anda dapat menghubungi guru pembimbing atau Administrator/Owner sekolah Anda untuk mengaktifkan izin pembuatan soal AI dan menetapkan alokasi kuota harian Anda.",
  },
  {
    category: "ai",
    q: "Apakah soal dan pembahasan yang dihasilkan AI selalu 100% akurat?",
    a: "Tidak. Model kecerdasan buatan bersifat generatif probabilistik dan dapat mengalami halusinasi konsep atau kesalahan hitung. Siswa dan guru diwajibkan meninjau materi secara kritis. Jika menemukan soal yang keliru, Anda dapat menekan tombol 'Laporkan Soal' pada kartu pertanyaan.",
  },

  // IRT Scoring
  {
    category: "irt",
    q: "Apa itu skor IRT (Item Response Theory) 3-PL di NemoLearn?",
    a: "IRT 3-PL (Three-Parameter Logistic) adalah metode penskoran psikometrik modern standar UTBK SNBT. Skor akhir dihitung dengan mempertimbangkan tingkat kesulitan soal (b), daya pembeda butir soal (a), dan probabilitas tebakan semu (c). Nilai disajikan pada rentang skala standar 200 hingga 1000.",
  },
  {
    category: "irt",
    q: "Mengapa jumlah jawaban benar sama tetapi nilai akhir bisa berbeda?",
    a: "Pada penskoran IRT, menjawab benar soal yang berbobot tinggi/sulit memberikan kontribusi skor kemampuan (theta) yang lebih besar dibandingkan hanya menjawab benar soal-soal mudah. Inilah yang membuat penilaian IRT jauh lebih adil dan representatif.",
  },

  // Remedial & PDF
  {
    category: "remedial",
    q: "Bagaimana cara mengunduh lembar remedial PDF?",
    a: "Setelah menyelesaikan sesi latihan, buka halaman Hasil Latihan (/results/[id]). Di sana tersedia tombol 'Cetak Lembar Remedial PDF'. Lembar ini memuat rangkuman konsep, butir soal yang keliru, dan pembahasan langkah demi langkah dengan formula matematika bersih.",
  },

  // Privasi
  {
    category: "privasi",
    q: "Apakah data pribadi saya dikirimkan ke provider AI pihak ketiga?",
    a: "TIDAK. NemoLearn hanya mengirimkan topik materi, stimulus soal, atau cuplikan modul yang diunggah ke API AI. Nama, email, kata sandi, dan data identitas pribadi Anda tidak pernah disertakan dalam payload permintaan ke Google Gemini atau OpenAI.",
  },
];

export default function HelpCenterPage() {
  const [activeTab, setActiveTab] = useState<"faq" | "feedback" | "bug" | "contact">("faq");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  // Form states for feedback / bug report
  const [feedbackCategory, setFeedbackCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const filteredFaqs = FAQ_LIST.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSendForm = async (type: "feedback" | "bug_report" | "contact_support") => {
    setIsSubmitting(true);
    setSubmitSuccess(null);
    setSubmitError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          category: feedbackCategory,
          subject,
          message,
          rating: type === "feedback" ? rating : undefined,
          guestEmail: guestEmail.trim() || undefined,
          guestName: guestName.trim() || undefined,
          deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Gagal mengirim formulir.");
      }

      setSubmitSuccess(data?.message || "Pesan Anda berhasil dikirim!");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      setSubmitError(err.message || "Terjadi kesalahan saat mengirim pesan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 animate-fade-in text-[#0F172A]">
      {/* Header Banner */}
      <div className="space-y-3 text-center sm:text-left border-b border-[#E5E7EB] pb-6">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <Badge variant="green" size="md">
            <HelpCircle className="w-3.5 h-3.5 mr-1" />
            Pusat Bantuan & Dukungan
          </Badge>
          <span className="text-xs text-[#64748B]">Layanan Pelanggan NemoLearn</span>
        </div>
        <h1 className="editorial-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
          Pusat Bantuan NemoLearn
        </h1>
        <p className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-2xl">
          Temukan jawaban atas pertanyaan umum seputar latihan soal, penilaian IRT, AI Generator, privasi akun, atau kirimkan masukan dan laporan kendala teknis.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-[#FAF9F5] border border-[#E5E7EB] rounded-2xl overflow-x-auto text-xs font-bold">
        <button
          onClick={() => { setActiveTab("faq"); setSubmitSuccess(null); }}
          className={cn(
            "px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
            activeTab === "faq"
              ? "bg-white text-[#16A34A] shadow-xs border border-[#E5E7EB]"
              : "text-[#64748B] hover:text-[#0F172A]"
          )}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Tanya Jawab (FAQ)</span>
        </button>

        <button
          onClick={() => { setActiveTab("feedback"); setSubmitSuccess(null); }}
          className={cn(
            "px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
            activeTab === "feedback"
              ? "bg-white text-[#16A34A] shadow-xs border border-[#E5E7EB]"
              : "text-[#64748B] hover:text-[#0F172A]"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Kirim Masukan</span>
        </button>

        <button
          onClick={() => { setActiveTab("bug"); setSubmitSuccess(null); }}
          className={cn(
            "px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
            activeTab === "bug"
              ? "bg-white text-[#DC2626] shadow-xs border border-[#E5E7EB]"
              : "text-[#64748B] hover:text-[#0F172A]"
          )}
        >
          <Bug className="w-4 h-4" />
          <span>Laporkan Bug</span>
        </button>

        <button
          onClick={() => { setActiveTab("contact"); setSubmitSuccess(null); }}
          className={cn(
            "px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
            activeTab === "contact"
              ? "bg-white text-[#2563EB] shadow-xs border border-[#E5E7EB]"
              : "text-[#64748B] hover:text-[#0F172A]"
          )}
        >
          <Mail className="w-4 h-4" />
          <span>Hubungi Dukungan</span>
        </button>
      </div>

      {/* TAB 1: FAQ */}
      {activeTab === "faq" && (
        <div className="space-y-6">
          {/* Search & Category Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari topik pertanyaan (misal: IRT, kuota AI, hapus akun, PDF)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#CBD5E1] rounded-2xl text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { id: "all", label: "Semua Topik" },
                { id: "akun", label: "Akun & Keamanan" },
                { id: "ai", label: "AI Generator" },
                { id: "irt", label: "Penilaian IRT" },
                { id: "remedial", label: "Remedial & PDF" },
                { id: "privasi", label: "Privasi Data" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl transition-colors cursor-pointer",
                    selectedCategory === cat.id
                      ? "bg-[#16A34A] text-white font-bold"
                      : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accordion List */}
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="p-8 text-center text-[#64748B] text-xs bg-white border border-[#E5E7EB] rounded-2xl">
                Tidak ada pertanyaan yang sesuai dengan kata kunci &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              filteredFaqs.map((faq, idx) => {
                const isOpen = expandedFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-[#E5E7EB] bg-white rounded-2xl overflow-hidden transition-all shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-[#FAF9F5] transition-colors"
                    >
                      <span className="font-bold text-xs sm:text-sm text-[#0F172A]">
                        {faq.q}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#64748B] shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#64748B] shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-[#475569] leading-relaxed border-t border-[#F1F5F9]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Kirim Feedback */}
      {activeTab === "feedback" && (
        <Card className="p-6 sm:p-8 space-y-5 border-[#E5E7EB] bg-white shadow-xs">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
              Kirimkan Masukan & Saran Anda
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Bantu kami menyempurnakan NemoLearn untuk kenyamanan belajar siswa SMA seluruh Indonesia.
            </p>
          </div>

          {submitSuccess && (
            <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{submitSuccess}</span>
            </div>
          )}

          {submitError && (
            <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendForm("feedback");
            }}
            className="space-y-4 text-xs"
          >
            {/* Rating */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Bagaimana pengalaman belajar Anda di NemoLearn?
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "w-6 h-6",
                        star <= rating
                          ? "fill-[#F59E0B] text-[#F59E0B]"
                          : "text-[#CBD5E1]"
                      )}
                    />
                  </button>
                ))}
                <span className="text-xs text-[#64748B] ml-2 font-bold">
                  {rating === 5
                    ? "Sangat Bagus"
                    : rating === 4
                    ? "Bagus"
                    : rating === 3
                    ? "Cukup"
                    : rating === 2
                    ? "Kurang"
                    : "Perlu Peningkatan"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Kategori Masukan
              </label>
              <select
                value={feedbackCategory}
                onChange={(e) => setFeedbackCategory(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#16A34A]"
              >
                <option value="general">Umum / Kesan Belajar</option>
                <option value="soal">Kualitas Bank Soal & Pembahasan</option>
                <option value="ai">AI Generator & Kecepatan Respons</option>
                <option value="ui_ux">Tampilan & Kemudahan Navigasi</option>
                <option value="remedial">Sistem Evaluasi IRT & PDF Remedial</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Subjek Masukan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Saran penambahan bank soal Kimia UTBK"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#16A34A]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Isi Masukan / Saran Terperinci <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Tuliskan pengalaman atau saran perbaikan Anda secara lengkap..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#16A34A]"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Mengirim Masukan...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Kirim Masukan
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 3: Laporkan Bug */}
      {activeTab === "bug" && (
        <Card className="p-6 sm:p-8 space-y-5 border-[#FECACA] bg-[#FEF2F2]/20 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <Bug className="w-4 h-4" />
              Layanan Pelaporan Kendala Teknis (Bug Report)
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Jika Anda menemukan galat sistem, tombol tidak merespons, atau formula yang rusak, laporkan segera agar dapat diperbaiki tim engineer.
            </p>
          </div>

          {submitSuccess && (
            <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{submitSuccess}</span>
            </div>
          )}

          {submitError && (
            <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendForm("bug_report");
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Kategori Kendala Teknis
              </label>
              <select
                value={feedbackCategory}
                onChange={(e) => setFeedbackCategory(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-rose-500"
              >
                <option value="ui_glitch">Tampilan Rusak / CSS Berantakan</option>
                <option value="math_rendering">Rumus Matematika Tidak Terbaca</option>
                <option value="server_error">Error Server / Respon 500</option>
                <option value="quiz_issue">Sesi Ujian Macet / Jawaban Tidak Tersimpan</option>
                <option value="pdf_download">Lembar Remedial PDF Gagal Diunduh</option>
                <option value="other">Kendala Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Judul Kendala <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Rumus pecahan KaTeX tidak muncul pada soal Fisika nomor 3"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Langkah-Langkah Menemukan Kendala (Steps to Reproduce) <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="1. Buka halaman latihan...&#10;2. Pilih mata pelajaran...&#10;3. Klik tombol submit, muncul pesan galat..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                size="sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Mengirim Laporan Bug...
                  </>
                ) : (
                  <>
                    <Bug className="w-3.5 h-3.5 mr-1.5" />
                    Kirim Laporan Bug
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 4: Contact Support */}
      {activeTab === "contact" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="sm:col-span-1 p-6 space-y-4 border-[#E5E7EB] bg-[#FAF9F5]">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-[#0F172A]">Informasi Kontak</h3>
              <p className="text-xs text-[#64748B]">Saluran resmi komunikasi NemoLearn</p>
            </div>

            <div className="space-y-3 text-xs text-[#475569]">
              <div>
                <p className="font-bold text-[#0F172A]">Email Layanan:</p>
                <a href="mailto:support@nemolearn.id" className="text-[#16A34A] font-semibold hover:underline">
                  support@nemolearn.id
                </a>
              </div>
              <div>
                <p className="font-bold text-[#0F172A]">Email Petugas Privasi:</p>
                <a href="mailto:privacy@nemolearn.id" className="text-[#16A34A] font-semibold hover:underline">
                  privacy@nemolearn.id
                </a>
              </div>
              <div>
                <p className="font-bold text-[#0F172A]">Jam Operasional:</p>
                <p>Senin – Jumat, 08.00 – 17.00 WIB</p>
              </div>
              <div>
                <p className="font-bold text-[#0F172A]">Target Respons:</p>
                <p>Maksimal 1 x 24 jam kerja</p>
              </div>
            </div>
          </Card>

          <Card className="sm:col-span-2 p-6 sm:p-8 space-y-4 border-[#E5E7EB] bg-white">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#0F172A]">Kirim Pesan Langsung</h3>
              <p className="text-xs text-[#64748B]">Tim teknis kami siap membantu kebutuhan belajar dan pengajaran Anda.</p>
            </div>

            {submitSuccess && (
              <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {submitError && (
              <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendForm("contact_support");
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nama Pengirim</label>
                  <input
                    type="text"
                    placeholder="Nama lengkap Anda"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#16A34A]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Alamat Email Balasan</label>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#16A34A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Subjek Pertanyaan <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pertanyaan integrasi bank soal untuk sekolah"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Pesan Lengkap <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tuliskan pertanyaan atau kebutuhan Anda..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#16A34A]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Kirim Pesan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
