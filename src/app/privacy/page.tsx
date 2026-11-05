"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  Lock,
  Eye,
  Server,
  Trash2,
  Cpu,
  Mail,
  AlertTriangle,
  FileText,
  UserCheck,
  Clock,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 animate-fade-in text-[#0F172A]">
      {/* Header Banner */}
      <div className="space-y-3 border-b border-[#E5E7EB] pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="green" size="md">
            <Shield className="w-3.5 h-3.5 mr-1" />
            Privasi & Perlindungan Data
          </Badge>
          <span className="text-xs font-mono text-[#64748B]">Versi Dokumen: 2026.11</span>
          <span className="text-xs text-[#94A3B8]">&bull;</span>
          <span className="text-xs text-[#64748B]">Berlaku Efektif: 4 November 2026</span>
        </div>
        <h1 className="editorial-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
          Kebijakan Privasi NemoLearn
        </h1>
        <p className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-3xl">
          NemoLearn berkomitmen menjaga privasi, keamanan data, dan integritas proses belajar Anda.
          Dokumen ini menjelaskan secara transparan bagaimana data pribadi, riwayat latihan, dan berkas modul Anda dikelola, disimpan, diproses, serta dihapus.
        </p>

        {/* Legal Review Disclaimer Alert */}
        <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[#B45309]">Pemberitahuan Peninjauan Hukum (Legal Draft Notice)</p>
            <p className="leading-relaxed">
              Dokumen kebijakan privasi ini merupakan <strong>draft teknis dan operasional sistem</strong> yang disusun berlandaskan prinsip Undang-Undang No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP). Dokumen ini harus ditinjau dan divalidasi oleh pengelola bersama penasihat hukum sebelum publikasi final.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Articles */}
      <div className="space-y-8 text-sm leading-relaxed text-[#334155]">
        {/* 1. Data yang Dikumpulkan */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
            <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center text-xs font-mono">
              1
            </div>
            <h2>Data Pribadi yang Kami Kumpulkan</h2>
          </div>
          <p>
            Dalam mengoperasikan platform edukasi NemoLearn, kami mengumpulkan kategori data berikut secara proporsional sesuai kebutuhan fungsional:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-white space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-xs text-[#0F172A]">
                <UserCheck className="w-4 h-4 text-[#16A34A]" />
                Informasi Profil Akun
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Nama lengkap, alamat email, kata sandi (disimpan dalam bentuk cryptographic hash scrypt satu arah dengan salt), asal sekolah, jenis kelamin, dan peran pengguna (Pelajar, Guru, atau Administrator).
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-white space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-xs text-[#0F172A]">
                <FileText className="w-4 h-4 text-[#16A34A]" />
                Riwayat Belajar & Evaluasi
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Sesi latihan, waktu mulai dan selesai, butir soal yang dikerjakan, pilihan jawaban, waktu respons per soal, skor penskoran IRT (Item Response Theory 3-PL), persentase ketuntasan, dan diagnosa remedial.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-white space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-xs text-[#0F172A]">
                <Cpu className="w-4 h-4 text-[#EA580C]" />
                Riwayat Penggunaan AI
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Konsumsi kuota harian, model AI yang dipanggil (Gemini / OpenAI), jumlah token prompt & completion, latensi respons, topik atau materi yang diminta untuk pembuatan soal, serta catatan kesalahan generasi.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-white space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-xs text-[#0F172A]">
                <Server className="w-4 h-4 text-[#2563EB]" />
                Dokumen & Berkas Referensi
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Konteks teks atau dokumen referensi modul belajar yang diunggah oleh guru atau siswa sebagai stimulus untuk pembuatan soal latihan berbasis kurikulum.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Tujuan Penggunaan Data */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
            <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center text-xs font-mono">
              2
            </div>
            <h2>Tujuan Penggunaan Data</h2>
          </div>
          <p>Data pribadi dan operasional Anda diproses semata-mata untuk tujuan:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm text-[#475569]">
            <li>Menyediakan layanan latihan soal adaptif berbasis Kurikulum Merdeka dan simulasi UTBK.</li>
            <li>Mengalkulasi estimasi kemampuan belajar siswa melalui algoritma psikometrik IRT 3-Parameter Logistic.</li>
            <li>Menghasilkan petunjuk konseptual dan pembahasan langkah demi langkah yang dipersonalisasi.</li>
            <li>Mengelola kuota AI dan mencegah penyalahgunaan infrastruktur komputasi server.</li>
            <li>Melakukan audit keamanan sistem, mencegah akses tidak sah, dan menindaklanjuti kendala teknis.</li>
          </ul>
        </section>

        {/* 3. Penggunaan Provider AI Pihak Ketiga */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
            <div className="w-7 h-7 rounded-lg bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center text-xs font-mono">
              3
            </div>
            <h2>Pemrosesan oleh Provider AI Pihak Ketiga</h2>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF7ED]/60 border border-[#FED7AA] space-y-3">
            <p className="font-bold text-xs sm:text-sm text-[#9A3412]">
              Transparansi Pemrosesan Large Language Model (LLM):
            </p>
            <p className="text-xs text-[#7C2D12] leading-relaxed">
              Ketika Anda menggunakan fitur <strong>AI Question Generator</strong> atau <strong>Adaptive Step-by-Step Explanation</strong>, stimulus materi, topik soal, atau cuplikan dokumen referensi yang Anda masukkan dikirimkan ke penyedia layanan AI eksternal kami, yaitu:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-xs text-[#7C2D12]">
              <li><strong>Google Gemini API</strong> (Google Cloud Platform)</li>
              <li><strong>OpenAI API / OpenAI-Compatible Provider</strong> (sebagai sistem failover otomatis)</li>
            </ul>
            <div className="border-t border-[#FED7AA] pt-2.5 text-xs text-[#9A3412] space-y-1">
              <p>
                <strong>Perlindungan Data Identitas:</strong> NemoLearn <em>TIDAK PERNAH</em> mengirimkan nama lengkap, alamat email, password, nomor kontak, atau informasi identitas pribadi (PII) Anda ke provider AI pihak ketiga.
              </p>
              <p className="italic">
                <strong>Himbauan Pengguna:</strong> Dilarang keras memasukkan data pribadi sensitif (seperti NIK, data keuangan, informasi rahasia keluarga) ke dalam kolom topik soal atau teks modul stimulus.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Penyimpanan & Keamanan Data */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
            <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center text-xs font-mono">
              4
            </div>
            <h2>Penyimpanan & Standar Keamanan Data</h2>
          </div>
          <p>
            Semua data tersimpan pada klaster database PostgreSQL terkelola (Supabase) dengan arsitektur keamanan:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm text-[#475569]">
            <li><strong>Row Level Security (RLS):</strong> Akses data pada level baris database dibatasi ketat sehingga setiap siswa hanya dapat mengakses data miliknya sendiri.</li>
            <li><strong>Enkripsi In-Transit & At-Rest:</strong> Transmisi data diamankan dengan TLS 1.3 / HTTPS dan penyimpanan data dienkripsi dengan standar industri AES-256.</li>
            <li><strong>Session Cookies Aman:</strong> Sesi login menggunakan cookie HTTP-only, Secure, dan SameSite=Lax untuk menangkal serangan Cross-Site Scripting (XSS) dan CSRF.</li>
          </ul>
        </section>

        {/* 5. Jangka Waktu Penyimpanan (Retensi Data) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
            <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center text-xs font-mono">
              5
            </div>
            <h2>Jangka Waktu Penyimpanan (Retensi)</h2>
          </div>
          <p>
            Kami menerapkan kebijakan retensi data berjenjang untuk memastikan data tidak disimpan lebih lama dari yang diperlukan:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#E5E7EB] rounded-xl overflow-hidden">
              <thead className="bg-[#FAF9F5] text-[#0F172A] font-bold border-b border-[#E5E7EB]">
                <tr>
                  <th className="p-3">Kategori Data</th>
                  <th className="p-3">Masa Retensi</th>
                  <th className="p-3">Tindakan Akhir Masa Retensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                <tr>
                  <td className="p-3 font-medium">Akun & Profil Aktif</td>
                  <td className="p-3">Selama akun berstatus aktif</td>
                  <td className="p-3">Dihapus permanen saat pengguna meminta penghapusan akun</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Riwayat Pengerjaan Soal</td>
                  <td className="p-3">Maksimal 2 tahun ajaran aktif</td>
                  <td className="p-3">Dianonimkan untuk kalibrasi bank soal tanpa keterkaitan identitas</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Log Audit Forensik & Keamanan</td>
                  <td className="p-3">1 tahun</td>
                  <td className="p-3">Dibersihkan secara otomatis sesuai siklus log rotation</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Riwayat Token & Kuota AI</td>
                  <td className="p-3">90 hari</td>
                  <td className="p-3">Diarsipkan ke bentuk agregat anonim</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 6. Hak Pengguna & Fitur Hapus Akun Mandiri */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
            <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center text-xs font-mono">
              6
            </div>
            <h2>Hak Anda & Mekanisme Penghapusan Akun (Right to Erasure)</h2>
          </div>
          <p>
            Sesuai regulasi privasi yang berlaku, Anda memiliki hak penuh untuk mengakses, memperbaiki, mengunduh, serta menghapus data pribadi Anda:
          </p>
          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-xs text-[#0F172A]">
              <Trash2 className="w-4 h-4 text-[#DC2626]" />
              Fitur Hapus Akun Mandiri (Self-Service Deletion)
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Anda dapat menghapus akun Anda kapan saja secara mandiri melalui menu <strong>Profil &rarr; Zona Bahaya &rarr; Hapus Akun Saya</strong>. Saat permintaan penghapusan diproses oleh server:
            </p>
            <ul className="list-disc list-inside text-xs text-[#64748B] space-y-1 pl-2">
              <li>Nama lengkap, email, kata sandi, asal sekolah, dan kredensial Anda akan dihapus secara permanen.</li>
              <li>Sesi login yang sedang aktif dicabut seketika.</li>
              <li>Sesi latihan kuis akan dianonimkan (anonymized) sehingga statistik tingkat kesulitan bank soal tetap terjaga tanpa dapat ditelusuri kembali ke diri Anda.</li>
            </ul>
            <div className="pt-2">
              <Link href="/profile">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] hover:underline">
                  Kunjungi Halaman Pengaturan Akun
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* 7. Perlindungan Pelajar & Pengguna Anak */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
            <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center text-xs font-mono">
              7
            </div>
            <h2>Perlindungan Pelajar & Pengguna di Bawah Umur</h2>
          </div>
          <p>
            Platform NemoLearn dirancang terutama bagi pelajar jenjang SMA / MA / SMK dan sederajat (rentang usia 15–18 tahun). Sejalan dengan kepatuhan perlindungan anak:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm text-[#475569]">
            <li>Pendaftaran akun oleh pelajar di bawah usia 18 tahun mensyaratkan adanya konfirmasi izin atau bimbingan dari orang tua, wali, atau sekolah yang bersangkutan.</li>
            <li>NemoLearn tidak mengizinkan penargetan iklan komersial maupun pengumpulan data perilaku komersial terhadap siswa.</li>
            <li>Orang tua atau wali berhak meminta peninjauan atau penghapusan data anak mereka dengan menghubungi petugas privasi kami.</li>
          </ul>
        </section>

        {/* 8. Kontak Pengelola & Petugas Perlindungan Data */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
            <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center text-xs font-mono">
              8
            </div>
            <h2>Kontak Pengelola & Permohonan Hak Privasi</h2>
          </div>
          <p>
            Jika Anda memiliki pertanyaan seputar kebijakan privasi, ingin menyampaikan permohonan akses data, atau mengajukan keluhan terkait data pribadi, silakan hubungi kami melalui:
          </p>
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E7EB] space-y-2 text-xs">
            <p><strong>Pengelola:</strong> Tim Tata Kelola Privasi NemoLearn</p>
            <p><strong>Email Dukungan & DPO:</strong> <a href="mailto:privacy@nemolearn.id" className="text-[#16A34A] font-bold hover:underline">privacy@nemolearn.id</a> / <a href="mailto:support@nemolearn.id" className="text-[#16A34A] font-bold hover:underline">support@nemolearn.id</a></p>
            <p><strong>Pusat Bantuan Daring:</strong> <Link href="/help" className="text-[#16A34A] font-bold hover:underline">Pusat Bantuan & FAQ NemoLearn</Link></p>
            <p><strong>Waktu Operasional:</strong> Senin – Jumat, 08.00 – 17.00 WIB (respon maksimal 1x24 jam kerja)</p>
          </div>
        </section>
      </div>

      {/* Footer Navigation */}
      <div className="border-t border-[#E5E7EB] pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-[#64748B]">
        <div>
          <span>Menyetujui dokumen ini? Baca juga </span>
          <Link href="/terms" className="font-bold text-[#16A34A] hover:underline">
            Ketentuan Layanan NemoLearn
          </Link>
        </div>
        <Link href="/" className="font-semibold text-[#0F172A] hover:text-[#16A34A]">
          &larr; Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
