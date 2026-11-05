"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  AlertTriangle,
  Scale,
  Sparkles,
  ShieldAlert,
  Ban,
  HelpCircle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 animate-fade-in text-[#0F172A]">
      {/* Header Banner */}
      <div className="space-y-3 border-b border-[#E5E7EB] pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="lime" size="md">
            <Scale className="w-3.5 h-3.5 mr-1" />
            Ketentuan Layanan
          </Badge>
          <span className="text-xs font-mono text-[#64748B]">Versi Dokumen: 2026.11</span>
          <span className="text-xs text-[#94A3B8]">&bull;</span>
          <span className="text-xs text-[#64748B]">Berlaku Efektif: 4 November 2026</span>
        </div>
        <h1 className="editorial-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
          Ketentuan Layanan NemoLearn
        </h1>
        <p className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-3xl">
          Selamat datang di NemoLearn. Ketentuan Layanan ini mengatur hak, kewajiban, dan batasan penggunaan platform latihan soal adaptif, AI Generator, evaluasi IRT, dan bank soal SMA Kurikulum Merdeka.
        </p>

        {/* Legal Review Disclaimer Alert */}
        <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[#B45309]">Pemberitahuan Peninjauan Hukum (Legal Draft Notice)</p>
            <p className="leading-relaxed">
              Ketentuan ini merupakan <strong>draft teknis dan tata kelola platform NemoLearn</strong>. Seluruh klausul wajib ditinjau dan divalidasi oleh penasihat hukum resmi sebelum platform diluncurkan secara komersial atau publik terbuka.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Articles */}
      <div className="space-y-8 text-sm leading-relaxed text-[#334155]">
        {/* 1. Penerimaan Ketentuan & Kelayakan */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
            <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center text-xs font-mono">
              1
            </div>
            <h2>Penerimaan Ketentuan & Batas Usia Pelajar</h2>
          </div>
          <p>
            Dengan membuat akun, mengakses, atau menggunakan layanan NemoLearn, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh isi Ketentuan Layanan ini serta Kebijakan Privasi kami.
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm text-[#475569]">
            <li><strong>Kelayakan Usia:</strong> Layanan ditujukan untuk pelajar jenjang SMA / MA / SMK dan sederajat, guru, serta tenaga pendidik.</li>
            <li><strong>Pelajar di Bawah 18 Tahun:</strong> Pengguna yang berusia di bawah 18 tahun wajib memperoleh persetujuan atau berada dalam pengawasan orang tua, wali, atau guru pembimbing sebelum melakukan pendaftaran.</li>
            <li>Jika Anda tidak menyetujui salah satu klausul dalam dokumen ini, Anda tidak diperkenankan menggunakan platform NemoLearn.</li>
          </ul>
        </section>

        {/* 2. PENTING: Penggunaan AI & Penafian Akurasi */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
            <div className="w-7 h-7 rounded-lg bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center text-xs font-mono">
              2
            </div>
            <h2>Fitur AI & Penafian Akurasi Soal (AI Accuracy Disclaimer)</h2>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FEF2F2]/60 border border-[#FECACA] space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#991B1B]">
              <Sparkles className="w-4 h-4 text-[#EA580C]" />
              PERINGATAN RESMI: Output AI Bersifat Generatif & Wajib Diverifikasi
            </div>
            <p className="text-xs text-[#991B1B] leading-relaxed">
              NemoLearn memanfaatkan model kecerdasan buatan (Large Language Model) pihak ketiga untuk membantu pembuatan soal latihan, petunjuk konseptual, dan pembahasan langkah demi langkah. Pengguna memahami dan menyetujui bahwa:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-[#991B1B]">
              <li>
                <strong>Potensi Kesalahan:</strong> Hasil generasi AI dapat mengandung kesalahan konsep, kekeliruan perhitungan matematika, ketidaktepatan kunci jawaban, atau halusinasi informasi.
              </li>
              <li>
                <strong>Kewajiban Verifikasi:</strong> Siswa dan guru <strong>wajib meninjau secara kritis dan memverifikasi kebenaran materi</strong> terhadap buku teks resmi Kurikulum Merdeka atau referensi resmi Kemendikbudristek.
              </li>
              <li>
                <strong>Fasilitas Koreksi:</strong> NemoLearn menyediakan tombol <em>&ldquo;Laporkan Soal&rdquo;</em> pada setiap kartu pertanyaan untuk melaporkan ketidaktepatan materi agar dapat segera ditinjau dan diperbaiki oleh tim kurator.
              </li>
              <li>
                <strong>Bukan Pengganti Guru:</strong> Fitur AI merupakan alat bantu latihan mandiri dan tidak dimaksudkan sebagai pengganti pengajaran resmi guru di sekolah.
              </li>
            </ul>
          </div>
        </section>

        {/* 3. Batasan Layanan & Kuota AI */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
            <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center text-xs font-mono">
              3
            </div>
            <h2>Batasan Layanan & Alokasi Kuota</h2>
          </div>
          <p>
            Untuk menjaga ketersediaan server dan kestabilan biaya operasional bersama:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm text-[#475569]">
            <li><strong>Akses AI Terkendali:</strong> Pembuatan soal via AI Generator diatur oleh kebijakan kuota harian (Daily Quota) berbasis waktu Asia/Jakarta (WIB) yang dikelola oleh Administrator/Owner platform.</li>
            <li><strong>Rate Limiting:</strong> Sistem menerapkan pembatasan frekuensi permintaan per menit (Rate Limit) untuk mencegah spamming.</li>
            <li><strong>Ketersediaan Layanan:</strong> Kami berusaha menjaga ketersediaan platform 24/7, namun platform dapat mengalami kendala tak terduga, gangguan jaringan provider, atau jeda pemeliharaan berkala (*scheduled maintenance*).</li>
          </ul>
        </section>

        {/* 4. Tanggung Jawab & Larangan Pengguna */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
            <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center text-xs font-mono">
              4
            </div>
            <h2>Larangan Penggunaan & Larangan Penyalahgunaan</h2>
          </div>
          <p>Selama menggunakan platform NemoLearn, pengguna DILARANG KERAS untuk:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-white space-y-1 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-xs text-[#DC2626]">
                <Ban className="w-3.5 h-3.5" />
                Scraping & Eksploitasi
              </div>
              <p className="text-xs text-[#64748B]">
                Menggunakan bot, scraper, crawler, atau alat otomatis untuk menyedot bank soal atau membebani server tanpa izin tertulis.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-white space-y-1 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-xs text-[#DC2626]">
                <Ban className="w-3.5 h-3.5" />
                Prompt Injection & Manipulasi
              </div>
              <p className="text-xs text-[#64748B]">
                Mencoba mengeksploitasi prompt generator AI, membocorkan API key rahasia, atau memanipulasi kuota dan otorisasi sistem.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-white space-y-1 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-xs text-[#DC2626]">
                <Ban className="w-3.5 h-3.5" />
                Konten Ilegal & Berbahaya
              </div>
              <p className="text-xs text-[#64748B]">
                Mengunggah berkas atau stimulus teks yang melanggar hak cipta, memuat pornografi, ujaran kebencian, SARA, atau instruksi berbahaya.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-white space-y-1 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-xs text-[#DC2626]">
                <Ban className="w-3.5 h-3.5" />
                Kecurangan Ujian Resmi
              </div>
              <p className="text-xs text-[#64748B]">
                Menggunakan platform untuk melakukan kecurangan saat ujian resmi sekolah atau ujian nasional yang melarang bantuan alat AI.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Penangguhan & Penghentian Akun */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
            <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center text-xs font-mono">
              5
            </div>
            <h2>Penangguhan Akun (Suspension) & Penghentian Layanan</h2>
          </div>
          <p>
            NemoLearn berhak menangguhkan (*suspend*), mencabut izin akses AI, atau menghapus akun secara sepihak jika:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm text-[#475569]">
            <li>Pengguna terbukti melanggar klausul larangan dalam Ketentuan Layanan ini.</li>
            <li>Terjadi aktivitas mencurigakan yang mengancam stabilitas, keamanan, atau reputasi platform.</li>
            <li>Pengguna menyalahgunakan hak verifikasi guru dengan mengunggah sertifikat palsu.</li>
          </ul>
        </section>

        {/* 6. Hak Pengguna Menghapus Akun */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
            <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center text-xs font-mono">
              6
            </div>
            <h2>Penghentian Mandiri oleh Pengguna (Hapus Akun)</h2>
          </div>
          <p>
            Pengguna dapat menghentikan penggunaan layanan dan menghapus akun beserta seluruh data pribadi secara mandiri kapan pun melalui halaman <strong>Profil &rarr; Hapus Akun</strong>. Proses penghapusan akun bersifat final dan tidak dapat dibatalkan.
          </p>
        </section>

        {/* 7. Batasan Tanggung Jawab */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
            <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center text-xs font-mono">
              7
            </div>
            <h2>Batasan Tanggung Jawab (Limitation of Liability)</h2>
          </div>
          <p>
            Sejauh diizinkan oleh hukum yang berlaku di Republik Indonesia, NemoLearn dan pengembangnya tidak bertanggung jawab atas:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm text-[#475569]">
            <li>Hasil ujian resmi atau nilai akademis siswa di sekolah yang didasarkan semata-mata pada latihan di platform ini.</li>
            <li>Kerugian tidak langsung yang timbul akibat kesalahan interpretasi terhadap keluaran model AI.</li>
            <li>Kehilangan data sementara akibat kendala infrastruktur telekomunikasi pihak ketiga.</li>
          </ul>
        </section>

        {/* 8. Kontak Bantuan & Dukungan */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
            <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center text-xs font-mono">
              8
            </div>
            <h2>Kontak Bantuan & Prosedur Banding</h2>
          </div>
          <p>
            Jika Anda mengalami kendala operasional, ingin mengajukan banding atas penangguhan akun, atau memiliki pertanyaan seputar ketentuan ini, hubungi kami di:
          </p>
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E7EB] space-y-2 text-xs">
            <p><strong>Pusat Bantuan:</strong> <Link href="/help" className="text-[#16A34A] font-bold hover:underline">Pusat Bantuan & FAQ NemoLearn</Link></p>
            <p><strong>Email Layanan:</strong> <a href="mailto:support@nemolearn.id" className="text-[#16A34A] font-bold hover:underline">support@nemolearn.id</a></p>
            <p><strong>Waktu Tanggapan:</strong> Tim kami akan merespons dalam waktu 1x24 jam kerja.</p>
          </div>
        </section>
      </div>

      {/* Footer Navigation */}
      <div className="border-t border-[#E5E7EB] pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-[#64748B]">
        <div>
          <span>Ingin memahami perlindungan data Anda? Baca </span>
          <Link href="/privacy" className="font-bold text-[#16A34A] hover:underline">
            Kebijakan Privasi NemoLearn
          </Link>
        </div>
        <Link href="/" className="font-semibold text-[#0F172A] hover:text-[#16A34A]">
          &larr; Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
