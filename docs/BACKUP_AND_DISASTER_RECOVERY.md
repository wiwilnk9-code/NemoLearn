# NEMOLEARN — DATABASE BACKUP & DISASTER RECOVERY RUNBOOK

**Target Platform**: Supabase PostgreSQL (`epbepzjheexkeqivcoql` / Region `ap-southeast-1`)  
**Production Host**: Vercel Serverless Edge/Node.js Runtime  
**Document Status**: Official Production Runbook  
**Last Updated**: November 2026  

---

## 1. EXECUTIVE SUMMARY & SERVICE LEVEL TARGETS

NemoLearn maintains a multi-tiered data resilience strategy combining automated continuous physical backups, Point-In-Time-Recovery (PITR), and cold-standby logical dumps.

| Metric | Target SLA | Strategy |
|---|---|---|
| **RPO (Recovery Point Objective)** | < 5 Menit (PITR) / < 24 Jam (Cold Backup) | Continuous WAL archiving + Daily snapshots |
| **RTO (Recovery Time Objective)** | < 30 Menit | Automated cloud restore + Fallback memory hydration |
| **Retention Window** | 7 Hari (Pro) / 30 Hari (Enterprise) | Automated rolling retention policy |
| **Backup Storage** | Multi-AZ Encrypted Storage (AES-256) | Managed cloud infrastructure |

---

## 2. BACKUP ARCHITECTURE

```mermaid
flowchart TD
    subgraph Primary ["Primary Production Database (Supabase ap-southeast-1)"]
        PG["PostgreSQL 15 Engine"]
        WAL["Write-Ahead Logs (WAL)"]
        Snap["Daily Base Backups (00:00 UTC)"]
    end

    subgraph Archival ["Storage & Archival Tier"]
        S3WAL["Encrypted WAL Stream (Continuous)"]
        S3Snap["Encrypted Daily Snapshots (7-30 Days)"]
        LogicalDump["Weekly Manual Logical Export (pg_dump)"]
    end

    subgraph Recovery ["Disaster Recovery Options"]
        PITR["Point-In-Time-Recovery (Exact Second)"]
        SnapRestore["Full Snapshot Restoration"]
        ColdRestore["Standby Instance Hydration"]
    end

    PG --> WAL --> S3WAL --> PITR
    PG --> Snap --> S3Snap --> SnapRestore
    PG --> LogicalDump --> ColdRestore
```

### 2.1. Automated Physical Backups (Managed by Supabase)
- **Continuous WAL Archiving**: Every database transaction is streamed to WAL storage within seconds.
- **Daily Full Snapshots**: Executed daily during off-peak hours (00:00 UTC / 07:00 WIB).
- **Encryption**: Backups are encrypted at rest using AES-256 and encrypted in transit via TLS 1.3.

### 2.2. Periodic Logical Backups (`pg_dump`)
In addition to managed infrastructure backups, administrative operators maintain offsite logical exports before major schema migrations.

---

## 3. POINT-IN-TIME-RECOVERY (PITR) PROCEDURE

Jika terjadi insiden fatal (misal: data corruption, human error, atau accidental table drop), lakukan pemulihan ke detik persis sebelum insiden terjadi:

### Langkah-Langkah Pemulihan:

1. **Akses Supabase Management Dashboard**:
   - Buka `https://supabase.com/dashboard/project/epbepzjheexkeqivcoql/database/backups/pitr`.
2. **Tentukan Titik Waktu Restorasi (Timestamp)**:
   - Identifikasi waktu pasti insiden dari `system_logs` (misal: `2026-11-05 14:15:22 UTC`).
   - Pilih waktu restorasi 1–2 menit sebelum insiden terjadi (misal: `2026-11-05 14:14:00 UTC`).
3. **Pilih Metode Restorasi**:
   - **Opsi A (In-Place Restore)**: Mengembalikan project produksi yang ada ke titik waktu tersebut. Layanan akan down sementara selama proses restorasi berlangsung (estimasi 5–15 menit).
   - **Opsi B (Restore to New Project - Direkomendasikan)**: Membuat project klon sementara untuk memverifikasi integritas data sebelum dialihkan.
4. **Verifikasi Data Pasca-Restorasi**:
   - Jalankan script audit integritas data (periksa jumlah user, bank soal, dan sesi kuis).
5. **Alihkan Aplikasi**:
   - Jika menggunakan Opsi B, perbarui environment variables di Vercel:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
   - Trigger Redeployment di Vercel Dashboard.

---

## 4. PROSEDUR BACKUP MANUAL / LOGICAL EXPORT (`pg_dump`)

Jalankan perintah berikut sebelum melakukan perubahan schema atau rilis rute besar:

### 4.1. Ekspor Skema & Data Penuh

```bash
# Set connection string dari Supabase Settings > Database > Connection Strings (URI)
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.epbepzjheexkeqivcoql.supabase.co:5432/postgres"

# Ekspor database terkompresi
pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="nemolearn_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### 4.2. Ekspor Tabel Kritis Tertentu Saja

```bash
# Backup khusus bank soal, pengguna, dan log aktivitas
pg_dump "$DATABASE_URL" \
  --table=public.users \
  --table=public.questions \
  --table=public.practice_sessions \
  --table=public.responses \
  --table=public.system_logs \
  --format=plain \
  --file="nemolearn_critical_tables.sql"
```

### 4.3. Restorasi dari File Dump

```bash
# Restorasi ke database target
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  -d "$DATABASE_URL" \
  "nemolearn_backup_filename.dump"
```

---

## 5. RECOVERY TESTING & DRILL SCHEDULE

Untuk menjamin kesiapan disaster recovery di produksi:
- **Jadwal Uji Coba**: Dilakukan secara berkala setiap kuartal (setiap 3 bulan).
- **Prosedur Uji Coba**:
  1. Clone snapshot database ke staging sandbox.
  2. Jalankan rangkaian test suite otomatis NemoLearn (`npm test`).
  3. Verifikasi konsistensi relasi data foreign key antar tabel.
  4. Dokumentasikan waktu eksekusi aktual untuk memastikan SLA RTO < 30 menit tetap terpenuhi.

---

## 6. INCIDENT RESPONSE CHECKLIST

Jika terjadi pemadaman total atau kegagalan database:

- [ ] **T0 + 0m**: Aktifkan Maintenance Mode melalui Owner Dashboard / System Settings (`/admin/settings`).
- [ ] **T0 + 5m**: Periksa Supabase Status Page (`https://status.supabase.com`) dan AWS ap-southeast-1 status.
- [ ] **T0 + 10m**: Tentukan strategi pemulihan (apakah perlu PITR atau beralih ke failover instance).
- [ ] **T0 + 20m**: Eksekusi pemulihan data sesuai panduan PITR di atas.
- [ ] **T0 + 25m**: Jalankan healthcheck endpoint `/api/admin/ai/ping` dan verifikasi login admin.
- [ ] **T0 + 30m**: Nonaktifkan Maintenance Mode dan umumkan status pemulihan sistem melalui Broadcast Banner.
