# Panduan Penyiapan Akun Owner Utama NemoLearn

Dokumen ini menjelaskan prosedur penetapan akun Supabase Authentication yang telah terdaftar sebagai **Owner Utama** platform NemoLearn secara aman, konsisten, dan terotorisasi penuh di tingkat server.

---

## 1. Arsitektur Role & Keamanan NemoLearn

NemoLearn menerapkan arsitektur otorisasi berbasis peran (**Role-Based Access Control / RBAC**) yang terdesentralisasi namun terpusat secara otoritatif di sisi server (**Server-Authoritative**):

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE AUTH (AUTH.USERS)               │
│  app_metadata: { role: 'owner' }   <-- Otoritatif Server    │
│  user_metadata: { name: '...' }    <-- Ditolak untuk Auth   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Sinkronisasi 2 arah
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 POSTGRESQL (PUBLIC.USERS)                   │
│  role: 'owner'                                              │
│  permissions: ['manage_users', 'manage_ai', ...]            │
└──────────────────────────────┬──────────────────────────────┘
                               │ Validasi Sesi
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              COOKIE SESI (NEMOQUIZ_SESSION)                 │
│  HMAC SHA-256 signed token -> { userId, role: 'owner' }     │
│  - Bypass otomatis ke seluruh fitur /admin                  │
│  - Hak prerogatif mengelola Admin & Pengaturan AI           │
│  - Dilindungi dari eskalasi hak akses mandiri               │
└─────────────────────────────────────────────────────────────┘
```

### Jaminan Keamanan (Security Guardrails):
1. **Tidak Ada Akun Duplikat**: Script hanya mempromosikan akun yang sudah terdaftar di Supabase Auth berdasarkan `OWNER_EMAIL`.
2. **Pencarian Tunggal (Exact Match)**: Script memvalidasi bahwa akun ditemukan tepat satu kali. Jika ditemukan 0 atau >1, operasi langsung dibatalkan.
3. **Penyimpanan Role pada `app_metadata`**: Role tersimpan di `auth.users.raw_app_meta_data`. Klien browser pengguna dilarang memodifikasi field ini.
4. **Isolasi `user_metadata`**: Metadata klien tidak pernah dipercaya sebagai sumber otorisasi atau privilege check.
5. **Kerahasiaan Kunci Layanan**: `SUPABASE_SERVICE_ROLE_KEY` hanya digunakan di lingkungan server/lokal tertutup dan **tidak pernah** diberi prefix `NEXT_PUBLIC_` atau dikomit ke Git.
6. **Integritas Akun**: Script tidak pernah mengubah kata sandi, email, maupun status verifikasi akun.

---

## 2. Prasyarat & Variabel Lingkungan

Sebelum menjalankan script bootstrap, pastikan variabel lingkungan berikut tersedia di terminal Anda atau di dalam file `.env.local`:

| Variabel Lingkungan | Deskripsi | Wajib? | Contoh / Sumber |
| :--- | :--- | :--- | :--- |
| `OWNER_EMAIL` | Alamat email akun Anda yang sudah terdaftar di Supabase Auth NemoLearn | Ya | `wildannk9@gmail.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Kunci rahasia Service Role Supabase (akses admin) | Ya | Supabase Dashboard → Settings → API → `service_role secret` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase Anda | Opsional (Otomatis) | `https://epbepzjheexkeqivcoql.supabase.co` |

> [!CAUTION]
> **JANGAN PERNAH** membagikan `SUPABASE_SERVICE_ROLE_KEY` atau mengunggah file yang berisi kunci ini ke GitHub! Kunci ini memiliki hak akses bypass penuh ke database Anda.

---

## 3. Cara Menjalankan Script Bootstrap

Script dapat dijalankan dengan beberapa mode sesuai preferensi Anda:

### Opsi A: Mode Interaktif (Paling Aman & Direkomendasikan)
Jalankan perintah berikut pada terminal:
```bash
npm run bootstrap:owner
```
Script akan:
1. Meminta Anda memasukkan `OWNER_EMAIL` (jika belum diset di environment).
2. Meminta Anda memasukkan `SUPABASE_SERVICE_ROLE_KEY` (jika belum diset di environment).
3. Mencari akun di Supabase Auth dan menampilkan rincian akun (UUID, email, nama, role saat ini).
4. Meminta Anda mengetik konfirmasi: `Ketik 'YA' untuk mengonfirmasi perubahan ini: `.

---

### Opsi B: Menggunakan Environment Variable Sekali Pakai (One-Liner)

**Di PowerShell (Windows):**
```powershell
$env:OWNER_EMAIL="wildannk9@gmail.com"
$env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
npm run bootstrap:owner
```

**Di Linux / macOS / Git Bash:**
```bash
OWNER_EMAIL="wildannk9@gmail.com" SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..." npm run bootstrap:owner
```

---

### Opsi C: Menggunakan Opsi CLI Flags

```bash
# Memberikan argumen langsung via flag
npm run bootstrap:owner -- --email="wildannk9@gmail.com"

# Melewati konfirmasi prompt interaktif secara otomatis (misal CI/CD atau script otomatis)
npm run bootstrap:owner -- --email="wildannk9@gmail.com" --yes
```

---

### Opsi D: Uji Coba Simulasi (Dry-Run Mode)
Gunakan mode dry-run untuk memastikan akun terdeteksi dengan tepat tanpa mengubah data di database:
```bash
npm run bootstrap:owner -- --email="wildannk9@gmail.com" --dry-run
```

---

## 4. Cara Memeriksa Hasil Perubahan

Setelah script berhasil dijalankan dengan pesan sukses:

### 1. Periksa Melalui Supabase Dashboard
1. Buka [Supabase Dashboard](https://supabase.com/dashboard).
2. Masuk ke menu **Authentication** → **Users**.
3. Cari akun email Anda, klik titik tiga (`...`) atau baris pengguna.
4. Periksa bagian **User Metadata & App Metadata**:
   ```json
   {
     "provider": "google",
     "providers": ["google"],
     "role": "owner"
   }
   ```
   Pastikan `"role": "owner"` terdapat di dalam `app_metadata`.

### 2. Periksa Melalui PostgreSQL Table Editor
1. Di Supabase Dashboard, buka **Table Editor** → tabel `users`.
2. Cari baris dengan email Anda.
3. Kolom `role` bernilai `'owner'`.
4. Kolom `permissions` berisi seluruh izin administratif (`manage_users`, `manage_questions`, `manage_ai`, dll).

### 3. Periksa Melalui Log Audit Sistem
1. Buka tabel `system_logs`.
2. Anda akan melihat log dengan action `BOOTSTRAP_OWNER_PROMOTION` mencatat tanggal, target ID akun, dan status perubahan.

---

## 5. Cara Logout dan Login Ulang untuk Memperbarui Sesi

Sesi autentikasi NemoLearn dikelola menggunakan cookie HTTP-Only bertanda tangan kriptografis (`nemoquiz_session`). Jika Anda sebelumnya telah membuka aplikasi di browser saat role Anda masih `pelajar`:

1. **Logout**:
   - Klik tombol Profil / Avatar Anda di navigasi pojok kanan atas NemoLearn, lalu pilih **Keluar (Logout)**.
   - Atau kunjungi URL: `https://nemolearn.vercel.app/login?logout=true`.
2. **Login Kembali**:
   - Buka `https://nemolearn.vercel.app/login`.
   - Masuk menggunakan tombol **Lanjutkan dengan Google** (atau email & password akun Anda).
3. **Penerbitan Sesi Otomatis**:
   - Server OAuth callback NemoLearn akan membaca `app_metadata.role` yang telah bernilai `owner`.
   - Server otomatis menerbitkan token sesi baru dengan `role: "owner"`.
   - Pengguna dengan role `owner` akan secara otomatis diarahkan langsung ke halaman `/admin`.

---

## 6. Hak Akses & Fitur Owner di NemoLearn

Setelah masuk sebagai Owner, Anda memiliki akses tanpa batas ke:

| Area Dashboard | Fitur Utama |
| :--- | :--- |
| **Ringkasan (Overview)** | Statistik pertumbuhan pengguna harian, telemetri DAU/WAU, dan ringkasan platform. |
| **Manajemen Pengguna** | Daftar seluruh akun, verifikasi pengajar (NUPTK), suspend/aktivasi akun, dan pengangkatan Admin baru. |
| **Bank Soal SMA** | Pengelolaan butir soal Kurikulum SMA, validasi kunci jawaban, dan pembahasan materi. |
| **Sesi Ujian & Latihan** | Pemantauan sesi kuis real-time, evaluasi skor IRT 3-PL, dan remediasi siswa. |
| **AI Monitoring & Quota** | Pemilihan provider AI (Gemini 2.5 Flash / GPT-4o-mini), pengujian latensi API, kontrol kuota token harian per siswa, dan bypass kuota untuk akun VIP. |
| **Pengaturan Website** | Siaran banner pengumuman, toggle mode pemeliharaan, dan kebijakan platform. |
| **Audit Logs** | Jejak forensik keamanan real-time, ekspor CSV/JSON dari mutasi pengguna dan insiden keamanan. |

---

## 7. Cara Mengembalikan Role (Rollback / Revert)

Jika suatu saat Anda ingin menurunkan hak akses akun kembali menjadi peran biasa (misalnya untuk pengujian antarmuka dari sudut pandang siswa atau guru), Anda dapat menjalankan script rollback:

```bash
# Mengembalikan role akun menjadi 'pelajar' (default)
npm run bootstrap:owner -- --email="wildannk9@gmail.com" --revert=pelajar

# Atau mengubah role akun menjadi 'guru'
npm run bootstrap:owner -- --email="wildannk9@gmail.com" --revert=guru

# Atau mengubah role akun menjadi 'admin'
npm run bootstrap:owner -- --email="wildannk9@gmail.com" --revert=admin
```

Setelah menjalankan perintah revert:
1. Logout dari NemoLearn.
2. Login kembali untuk memperbarui cookie sesi.
3. Hak akses Owner akan dicabut sesuai dengan role yang ditentukan.

---

## 8. Panduan Troubleshooting

- **Error: "Akun dengan email '...' tidak ditemukan di Supabase Auth"**:
  Pastikan akun Anda sudah terdaftar terlebih dahulu. Lakukan login satu kali di `https://nemolearn.vercel.app/login` via Google OAuth agar akun Anda tercatat di Supabase Auth.
- **Error: "Gagal mengakses Supabase Auth Admin API"**:
  Pastikan Anda menggunakan `SUPABASE_SERVICE_ROLE_KEY` (bukan Anon Key). Anon Key tidak memiliki izin administratif untuk membaca daftar pengguna atau memodifikasi `app_metadata`.
- **Setelah login ulang, halaman /admin masih menampilkan 'Akses Ditolak'**:
  Pastikan Anda telah melakukan logout secara bersih (menghapus cookie `nemoquiz_session`). Tutup browser atau gunakan mode Incognito / Private Window untuk memverifikasi.
