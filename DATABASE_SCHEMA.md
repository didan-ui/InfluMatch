# Database Schema - UMKM & Influencer Marketing Platform

## Daftar Tabel

### 1. `users`
Menyimpan data semua pengguna (UMKM, Influencer, Admin)

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key (auto) |
| email | VARCHAR | Email unik untuk login |
| name | VARCHAR | Nama lengkap |
| role | ENUM | 'umkm', 'influencer', atau 'admin' |
| avatar_url | VARCHAR | URL foto profil |
| city | VARCHAR | Kota asal |
| is_approved | BOOLEAN | Status approval (default: false) |
| rating | NUMERIC | Rating (0-5) |
| created_at | TIMESTAMP | Waktu pembuatan akun |
| updated_at | TIMESTAMP | Terakhir diupdate |

**Kolom khusus UMKM:**
- brand_name | VARCHAR | Nama brand
- brand_category | VARCHAR | Kategori bisnis (Kuliner, Fashion, dll)

**Kolom khusus Influencer:**
- handle | VARCHAR | Handle/username (Instagram, TikTok, dll)
- followers_num | INTEGER | Jumlah followers
- price_per_post | NUMERIC | Harga per post
- niche | TEXT[] | Array niche (fashion, travel, food, dll)
- engagement | NUMERIC | Engagement rate

---

### 2. `campaigns`
Menyimpan data kampanye marketing

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key (auto) |
| umkm_id | UUID | Foreign key ke users (UMKM) |
| umkm_name | VARCHAR | Nama UMKM (denormalized) |
| name | VARCHAR | Nama kampanye |
| category | VARCHAR | Kategori kampanye |
| description | TEXT | Deskripsi kampanye |
| objective | VARCHAR | Objektif kampanye |
| audience | TEXT | Target audience |
| platform | VARCHAR | Platform media sosial (Instagram, TikTok, dll) |
| tone | VARCHAR | Tone kampanye (casual, formal, dll) |
| budget | NUMERIC | Budget kampanye |
| brief_text | TEXT | Brief lengkap dari AI |
| status | ENUM | 'active', 'completed', 'waiting', 'cancelled' |
| created_at | TIMESTAMP | Waktu dibuat |
| updated_at | TIMESTAMP | Terakhir diupdate |

---

### 3. `campaign_influencers`
Menyimpan relasi kampanye dengan influencer

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key (auto) |
| campaign_id | UUID | Foreign key ke campaigns |
| influencer_id | UUID | Foreign key ke users (influencer) |
| influencer_name | VARCHAR | Nama influencer (denormalized) |
| status | ENUM | 'invited', 'brief_ready', 'escrow_locked', 'content_uploaded', 'completed', 'disputed' |
| submission_url | VARCHAR | URL konten yang diupload |
| escrow_released | BOOLEAN | Status release escrow |
| created_at | TIMESTAMP | Waktu diundang |
| updated_at | TIMESTAMP | Terakhir diupdate |

---

### 4. `escrow_transactions`
Menyimpan transaksi escrow

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key (auto) |
| campaign_id | UUID | Foreign key ke campaigns |
| campaign_name | VARCHAR | Nama kampanye (denormalized) |
| influencer_id | UUID | Foreign key ke users (influencer) |
| influencer_name | VARCHAR | Nama influencer (denormalized) |
| umkm_id | UUID | Foreign key ke users (UMKM) |
| amount | NUMERIC | Jumlah dana |
| status | ENUM | 'released', 'locked', 'pending' |
| created_at | TIMESTAMP | Waktu transaksi |
| updated_at | TIMESTAMP | Terakhir diupdate |

---

### 5. `system_logs`
Menyimpan log sistem untuk audit trail

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key (auto) |
| actor_id | UUID | Foreign key ke users (siapa yang melakukan aksi) |
| actor_name | VARCHAR | Nama actor (denormalized) |
| action | VARCHAR | Jenis aksi |
| details | TEXT | Detail aksi |
| actor_type | ENUM | 'umkm', 'influencer', 'admin' |
| created_at | TIMESTAMP | Waktu aksi |

---

## Relationships (ER Diagram)

```
users (1) ----< (M) campaigns
         └─ umkm_id

users (1) ----< (M) campaign_influencers
         └─ influencer_id

campaigns (1) ----< (M) campaign_influencers

campaigns (1) ----< (M) escrow_transactions

users (1) ----< (M) escrow_transactions
         └─ influencer_id
         └─ umkm_id

users (1) ----< (M) system_logs
         └─ actor_id
```

---

## Notes:
- Semua timestamp menggunakan timezone UTC
- `is_approved` untuk moderation kampanye influencer
- `escrow_transactions` untuk keamanan pembayaran
- `system_logs` untuk tracking dan audit trail
- Beberapa kolom di-denormalisasi untuk query yang lebih cepat
