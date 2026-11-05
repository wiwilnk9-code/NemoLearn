# Panduan Branding Google OAuth: NemoLearn

Panduan resmi untuk mengatur identitas aplikasi **NemoLearn** pada Google OAuth Consent Screen dan Google Account Chooser agar pengguna melihat identitas resmi platform (bukan alamat teknis Supabase).

---

## 1. Memahami Penyebab Tampilan "Lanjutkan ke epbepzjheexkeqivcoql.supabase.co"

Ketika pengguna mengklik **"Masuk dengan Akun Google"**, Google Account Chooser menampilkan dua elemen identitas:

1. **Nama Aplikasi (App Name):** Identitas yang diatur di menu *Branding / OAuth Consent Screen*.
2. **Domain Pengalihan (Redirect Domain):** Hostname dari URL `redirect_uri` yang dikirim oleh klien.

Dalam arsitektur Supabase Auth, alur pengalihan adalah:
```
NemoLearn Frontend ──> Supabase Auth ──> Google OAuth ──> Callback Supabase ──> Callback NemoLearn
```

Karena authorization request ke Google dikirim dengan parameter `redirect_uri=https://epbepzjheexkeqivcoql.supabase.co/auth/v1/callback`, Google akan menampilkan teks:
> *"Lanjutkan ke epbepzjheexkeqivcoql.supabase.co"*

Kondisi ini terjadi karena:
- Menu **Branding** di Google Cloud Console belum diisi atau belum dipublikasikan (*Publish App*).
- Status publikasi masih berada di mode **Testing**, sehingga Google memprioritaskan URL teknis pengalihan ketimbang identitas brand.
- Authorized Domains belum didaftarkan di Google Cloud Console.

> [!WARNING]
> **JANGAN PERNAH** mengubah Authorized Redirect URI di Google Cloud Console dari `https://epbepzjheexkeqivcoql.supabase.co/auth/v1/callback` menjadi domain NemoLearn. Hal tersebut akan langsung merusak proses token exchange dan menyebabkan error fatal `redirect_uri_mismatch`.

---

## 2. Langkah Konfigurasi Manual di Google Cloud Console

Langkah-langkah berikut harus dilakukan secara manual oleh pemilik project (Project Owner) di Google Cloud Console:

### Langkah 1: Buka Google Auth Platform Branding
1. Masuk ke [Google Cloud Console](https://console.cloud.google.com/).
2. Pastikan proyek yang aktif adalah proyek Google Cloud untuk NemoLearn.
3. Di panel menu kiri, buka **APIs & Services** → **OAuth consent screen** (pada UI baru: **Google Auth Platform** → **Branding**).

### Langkah 2: Lengkapi Identitas Aplikasi (App Information)
Isi formulir branding dengan data akurat:

| Bidang (Field) | Nilai yang Harus Diisi | Keterangan |
| :--- | :--- | :--- |
| **App name** | `NemoLearn` | Nama resmi aplikasi yang akan muncul di layar izin |
| **User support email** | *(Pilih email administrator Anda)* | Email yang dapat dihubungi pengguna jika terjadi kendala |
| **App logo** | File logo NemoLearn (120x120 px) | Format PNG/JPG, maksimal 1 MB |

### Langkah 3: URL Domain Aplikasi (App Domain)
Gunakan rute resmi yang telah tersedia di NemoLearn:

| Bidang (Field) | Nilai URL | Status Rute NemoLearn |
| :--- | :--- | :--- |
| **Application home page** | `https://nemolearn.vercel.app` | Tersedia (`/`) |
| **Application privacy policy link** | `https://nemolearn.vercel.app/privacy` | Tersedia (`/privacy`) |
| **Application terms of service link** | `https://nemolearn.vercel.app/terms` | Tersedia (`/terms`) |

> [!NOTE]
> Rute `/privacy` dan `/terms` sudah aktif dan terintegrasi di dalam kode NemoLearn. Jangan menggunakan URL placeholder atau tautan palsu.

### Langkah 4: Daftarkan Authorized Domains
Pada bagian **Authorized domains**, tambahkan:
- `nemolearn.vercel.app` (domain aplikasi produksi)
- `supabase.co` (domain provider autentikasi Supabase)
- *(Domain kustom Anda jika nantinya menggunakan custom domain, misal `nemoquiz.edu`)*

### Langkah 5: Kontak Pengembang (Developer Contact Information)
- **Email addresses**: Masukkan alamat email penanggung jawab teknis aplikasi.

Klik **Save and Continue** (Simpan dan Lanjutkan).

---

## 3. Konfigurasi Audience dan Status Publikasi (Publishing Status)

Secara default, Google Cloud membuat consent screen dalam status **Testing**.

### Dampak Status Testing:
- Hanya email yang didaftarkan pada daftar *Test users* yang dapat login.
- Pengguna umum akan menerima peringatan `Error 403: access_denied` (*The developer hasn’t given you access to this app*).
- Google tidak menampilkan brand secara penuh.

### Langkah Memindahkan ke Production:
1. Buka tab **Audience** di bawah *Google Auth Platform*.
2. Pada bagian **Publishing status**, klik tombol **PUBLISH APP**.
3. Konfirmasikan dialog pemindahan status.

### Apakah Butuh Verifikasi Google Berbayar (App Verification)?
**TIDAK.**
NemoLearn hanya meminta **non-sensitive scopes**:
- `openid`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

Untuk scope non-sensitif ini, Google **tidak memerlukan** audit pihak ketiga berbayar (CASA tier assessment). Aplikasi dapat langsung beroperasi di status **In production**. Jika muncul tanda peringatan *Unverified App* di awal, pengguna cukup mengklik *Advanced* → *Go to NemoLearn*, atau verifikasi kepemilikan domain dapat diselesaikan melalui [Google Search Console](https://search.google.com/search-console).

---

## 4. Verifikasi Tipe OAuth Client ID

Pastikan kredensial OAuth Client yang dibuat dan digunakan di Supabase memenuhi kriteria berikut:
1. Buka **APIs & Services** → **Credentials**.
2. Klik nama OAuth 2.0 Client ID yang digunakan.
3. **Application type**: Wajib **Web application** (Aplikasi Web).
4. **Authorized JavaScript origins**:
   - `https://nemolearn.vercel.app`
   - `http://localhost:3000`
5. **Authorized redirect URIs**:
   - `https://epbepzjheexkeqivcoql.supabase.co/auth/v1/callback`

Salin **Client ID** dan **Client Secret**, lalu pastikan kedua nilai tersebut telah tersimpan di **Supabase Dashboard** → **Authentication** → **Providers** → **Google**.

---

## 5. Solusi Lanjutan: Menghilangkan Domain Supabase Secara Menyeluruh (Custom Domain)

Jika ingin agar teks domain Supabase tidak muncul sama sekali di browser pengguna dan sepenuhnya digantikan oleh subdomain NemoLearn:

1. Diperlukan fitur **Custom Domain** pada Supabase (tersedia di Supabase Pro Plan).
2. Konfigurasikan CNAME pada DNS domain Anda, misalnya:
   `auth.nemolearn.com` ──> `epbepzjheexkeqivcoql.supabase.co`
3. Setelah custom domain aktif di Supabase:
   - Authorized Redirect URI di Google Cloud diubah ke: `https://auth.nemolearn.com/auth/v1/callback`
   - `NEXT_PUBLIC_SUPABASE_URL` di Vercel diubah ke: `https://auth.nemolearn.com`
4. Dengan langkah ini, Google Account Chooser akan menampilkan *"Lanjutkan ke auth.nemolearn.com"*.

---

## 6. Checklist Sebelum Pengujian

- [ ] App Name di Google Cloud diisi `NemoLearn`.
- [ ] User support email terhubung ke email administrator aktif.
- [ ] Application home page: `https://nemolearn.vercel.app`.
- [ ] Privacy Policy: `https://nemolearn.vercel.app/privacy`.
- [ ] Terms of Service: `https://nemolearn.vercel.app/terms`.
- [ ] Authorized domains mencakup `nemolearn.vercel.app` dan `supabase.co`.
- [ ] Publishing status telah diubah ke **In production** (Publish App).
- [ ] Client ID & Client Secret aktif di Supabase Auth Google Provider.
- [ ] Callback URI Supabase tetap: `https://epbepzjheexkeqivcoql.supabase.co/auth/v1/callback`.
