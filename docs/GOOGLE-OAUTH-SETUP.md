# Panduan Konfigurasi Google OAuth NemoLearn & Supabase Auth

Dokumen ini berisi panduan resmi langkah demi langkah untuk mengonfigurasi integrasi **Google OAuth** pada platform **NemoLearn** melalui **Supabase Auth**.

---

## Ringkasan Alur & Perbedaan URL Penting

> [!IMPORTANT]
> Sangat penting memahami perbedaan antara dua URL pengalihan (redirect URL) berikut agar tidak terjadi error `redirect_uri_mismatch`:
>
> 1. **Google OAuth Authorized Redirect URI (Google Cloud Console):**
>    Ini adalah URL callback milik **Supabase Auth**:
>    `https://epbepzjheexkeqivcoql.supabase.co/auth/v1/callback`
>
> 2. **Supabase Redirect URL (Supabase Dashboard):**
>    Ini adalah URL callback milik aplikasi **NemoLearn**:
>    - Production: `https://nemolearn.vercel.app/auth/callback` (atau domain kustom Anda)
>    - Development: `http://localhost:3000/auth/callback`

```
[Pengguna] 
    │
    ▼ (1. Klik "Masuk dengan Akun Google")
[NemoLearn Frontend] 
    │
    ▼ (2. signInWithOAuth via PKCE)
[Supabase Auth Service] 
    │
    ▼ (3. Redirect ke Google OAuth Consent)
[Google Accounts] 
    │
    ▼ (4. Callback ke Supabase: /auth/v1/callback)
[Supabase Auth Service] 
    │
    ▼ (5. Callback ke NemoLearn: /auth/callback?code=...)
[NemoLearn Server: exchangeCodeForSession] 
    │
    ▼ (6. Set HTTP-Only Session & Role Student/Pelajar)
[Dashboard Pelajar / Admin]
```

---

## Bagian 1 — Konfigurasi di Google Cloud Console

### 1. Membuat Google Cloud Project
1. Masuk ke [Google Cloud Console](https://console.cloud.google.com/).
2. Buat proyek baru atau pilih proyek yang sudah ada (contoh nama proyek: `NemoLearn-Auth`).
3. Pastikan proyek yang aktif adalah proyek tersebut.

### 2. Mengatur OAuth Consent Screen (Branding & Audience)
1. Buka menu navigasi kiri: **APIs & Services** → **OAuth consent screen** (atau **Branding**).
2. Pilih **User Type**: **External** (agar dapat diakses oleh siswa dan guru dengan akun Google publik).
3. Klik **Create**.
4. Lengkapi informasi aplikasi:
   - **App name**: `NemoLearn`
   - **User support email**: Pilih email administrator/developer Anda.
   - **App logo**: (Opsional) Unggah logo resmi NemoLearn.
   - **Application home page**: `https://nemolearn.vercel.app` (atau domain produksi Anda).
   - **Application privacy policy link**: `https://nemolearn.vercel.app/privacy`
   - **Application terms of service link**: `https://nemolearn.vercel.app/terms`
   - **Developer contact information**: Masukkan alamat email admin pengelola.
5. Pada bagian **Scopes**, tambahkan scope standar (non-sensitive):
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
6. Simpan konfigurasi.
7. Pada menu **Publishing status**, ubah status aplikasi menjadi **In Production** (atau tambahkan email penguji jika masih dalam mode Testing).

### 3. Membuat OAuth Client ID
1. Buka menu navigasi kiri: **APIs & Services** → **Credentials**.
2. Klik tombol **+ CREATE CREDENTIALS** di bagian atas, lalu pilih **OAuth client ID**.
3. Pilih **Application type**: **Web application**.
4. Beri nama: `NemoLearn Web Client`.
5. Pada bagian **Authorized JavaScript origins**, tambahkan:
   - `https://nemolearn.vercel.app` (Domain produksi Vercel)
   - `http://localhost:3000` (Untuk pengujian development lokal)
   - *(Tambahkan juga domain kustom Anda jika menggunakan custom domain).*
6. Pada bagian **Authorized redirect URIs**, masukkan URL Callback Supabase aktual:
   ```
   https://epbepzjheexkeqivcoql.supabase.co/auth/v1/callback
   ```
   > [!WARNING]
   > Jangan memasukkan URL NemoLearn di sini! Google OAuth harus mengarahkan token kembali ke Supabase (`https://epbepzjheexkeqivcoql.supabase.co/auth/v1/callback`), yang kemudian akan menukarkan kredensial dan meneruskannya ke NemoLearn.
7. Klik **Create**.
8. Simpan **Client ID** dan **Client Secret** yang ditampilkan di jendela popup.

---

## Bagian 2 — Konfigurasi di Supabase Dashboard

Project Reference: `epbepzjheexkeqivcoql`  
Supabase Project URL: `https://epbepzjheexkeqivcoql.supabase.co`

### 1. Mengaktifkan Google Provider
1. Buka [Supabase Dashboard](https://supabase.com/dashboard/project/epbepzjheexkeqivcoql).
2. Pilih menu navigasi kiri: **Authentication** → **Sign In / Providers** (atau **Providers**).
3. Cari dan klik provider **Google**.
4. Aktifkan sakelar **Enable Google provider**.
5. Masukkan kredensial yang diperoleh dari Google Cloud:
   - **Client ID**: Tempel Client ID Google Anda.
   - **Client Secret**: Tempel Client Secret Google Anda.
6. Pastikan opsi **Skip nonce check** dibiarkan default sesuai anjuran Supabase.
7. Klik tombol **Save**.

### 2. Mengatur URL Configuration di Supabase
1. Di Supabase Dashboard, buka menu navigasi kiri: **Authentication** → **URL Configuration**.
2. Pada kolom **Site URL**:
   - Masukkan URL utama NemoLearn: `https://nemolearn.vercel.app`
3. Pada kolom **Redirect URLs** (Additional Redirect URLs), klik **Add URL** dan daftarkan:
   - `https://nemolearn.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback`
   - *(Jika menggunakan preview URL Vercel wildcard, Anda dapat menambahkan `https://*-<team-name>.vercel.app/auth/callback`).*
4. Klik **Save**.

---

## Bagian 3 — Verifikasi & Pengujian Alur

Setelah konfigurasi di atas disimpan oleh pemilik proyek:

1. **Pengujian Login Google:**
   - Buka halaman login NemoLearn: `https://nemolearn.vercel.app/login` (atau `http://localhost:3000/login`).
   - Klik tombol **"Masuk dengan Akun Google"**.
   - Sistem akan mengarahkan ke halaman persetujuan Google (*accounts.google.com*).
   - Pilih akun Google Anda dan berikan izin profil & email.
   - Google mengarahkan kembali ke Supabase, lalu Supabase mengarahkan ke `/auth/callback`.
   - Route Handler NemoLearn menukarkan kode PKCE menjadi sesi aktif.
   - Pengguna baru otomatis dibuat dengan peran **Pelajar (Student)** dan dialihkan ke beranda `/`.

2. **Pengujian Account Linking:**
   - Jika pengguna sebelumnya mendaftar menggunakan Email & Kata Sandi dengan alamat email yang sama, login melalui Google OAuth akan secara otomatis menautkan akun tanpa membuat duplikasi data (`AUTH_OAUTH_ACCOUNT_LINKED`).
   - Peran asli pengguna (misal: Guru SMA atau Administrator) tetap dipertahankan dan tidak akan diturunkan.

3. **Pengujian Pembatalan (User Cancelled):**
   - Klik tombol Google Login, lalu klik batalkan pada halaman Google.
   - NemoLearn akan menangkap parameter `error=access_denied` dan menampilkan pesan ramah: *"Autentikasi Google dibatalkan oleh pengguna."*

---

## Bagian 4 — Panduan Troubleshooting

| Error Code / Gejala | Penyebab | Solusi |
| :--- | :--- | :--- |
| `redirect_uri_mismatch` | URL Callback Supabase belum didaftarkan di Google Cloud Console. | Pastikan `https://epbepzjheexkeqivcoql.supabase.co/auth/v1/callback` ada di daftar **Authorized redirect URIs** pada OAuth Client ID di Google Cloud. |
| `Google OAuth belum diaktifkan` | Sakelar Google Provider belum diaktifkan atau Client ID/Secret belum disimpan di Supabase. | Masuk ke Supabase Dashboard → Authentication → Providers → Google, aktifkan provider dan simpan Client ID & Secret. |
| Pengguna tidak kembali ke NemoLearn | URL callback NemoLearn belum ditambahkan di Supabase Redirect URLs. | Tambahkan `https://nemolearn.vercel.app/auth/callback` di Supabase → Authentication → URL Configuration. |
| Sesi tidak tersimpan saat refresh | Cookie browser diblokir atau SameSite policy. | NemoLearn menggunakan HTTP-Only SameSite Lax cookie yang aman dan kompatibel dengan seluruh browser modern. |
