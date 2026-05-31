# PRD — TOMOE 2.0: Early Inflation Detection System

**Versi:** 1.0 (draft) · **Tanggal:** 31 Mei 2026 · **Owner:** rohisrachman
**Fokus wilayah awal:** Sulawesi Tengah · **Stakeholder utama:** TPID, analis BI, viewer publik internal

---

## 1. Problem Statement

Pemantauan inflasi daerah saat ini bersifat **reaktif dan terlambat**: data harga komoditas, IHK BPS, dan sinyal dari berita/sosmed tersebar di banyak sumber, diolah manual, dan baru terbaca setelah lonjakan terjadi. Akibatnya TPID kehilangan jendela waktu untuk intervensi (operasi pasar, distribusi) sebelum harga volatile food memicu inflasi.

TOMOE 2.0 menyatukan ketiga sinyal — **harga aktual, forecast, dan sentiment** — ke dalam satu sistem yang mendeteksi anomali secara dini (early warning) dan menyajikannya di dashboard reaktif, sehingga keputusan intervensi bisa diambil **hari-H, bukan minggu berikutnya**.

---

## 2. Goals & Non-Goals

### Goals
1. **Deteksi dini** — alarm otomatis saat harga melewati ambang 2-sigma, melanggar forecast, atau saat sentiment negatif melonjak.
2. **Forecast yang dapat ditindaklanjuti** — prediksi harga/inflasi per kota & komoditas dengan confidence interval dan metrik akurasi (MAPE) yang transparan.
3. **Konteks kualitatif** — sentiment & topik dari berita/sosmed yang terhubung ke komoditas/wilayah untuk menjelaskan "kenapa".
4. **Dashboard cepat** — semua hasil ML dihitung di background; halaman tinggal baca dari DB (target <2 dtk load).
5. **Pipeline data otomatis** — ingestion harian dari PIHPS & BPS tanpa intervensi manual.

### Non-Goals (v1)
- Bukan platform transaksi/operasi pasar (hanya sinyal & rekomendasi, bukan eksekusi).
- Tidak ada prediksi real-time per-detik — granularitas harian sudah cukup.
- Tidak melayani publik luas — pengguna terbatas internal (TPID/analis/admin).
- Bukan tool training model ML interaktif untuk end-user.
- Cakupan nasional ditunda — v1 fokus Sulteng.

---

## 3. User Stories & Acceptance Criteria

### Modul A — Early Warning System (EWS)
**US-A1** — Sebagai **analis TPID**, saya ingin menerima alert saat harga komoditas melewati ambang 2-sigma, agar bisa segera menyiapkan intervensi.
- Alert ter-generate otomatis saat `actual_value` > `threshold` (2σ historis).
- Setiap alert punya `severity` (low/medium/high), wilayah, komoditas, dan `message` yang jelas.
- Tiga tipe alert didukung: `2sigma`, `forecast_breach`, `sentiment_spike`.

**US-A2** — Sebagai analis, saya ingin meng-*acknowledge* dan me-*resolve* alert, agar tim tahu mana yang sudah ditangani.
- Status berpindah `open → acknowledged → resolved`, tercatat `acknowledged_by`.
- Perubahan status masuk ke `audit_logs`.

### Modul B — Forecast Viewer
**US-B1** — Sebagai analis, saya ingin melihat prediksi harga/inflasi per kota & komoditas, agar bisa mengantisipasi tren.
- Grafik menampilkan nilai prediksi + `lower_bound`/`upper_bound` (CI).
- MAPE model ditampilkan sebagai indikator kepercayaan.
- User dapat memilih model (SARIMA/LSTM/Hybrid) dan rentang waktu.

### Modul C — Sentiment & Topic Dashboard
**US-C1** — Sebagai analis, saya ingin melihat sentiment berita/sosmed per komoditas, agar memahami persepsi publik yang mendahului pergerakan harga.
- Distribusi sentiment (positif/netral/negatif) per komoditas/wilayah.
- Klaster topik (BERTopic) dengan keyword & jumlah dokumen.
- Setiap skor dapat ditelusuri ke `source_url` & `text_snippet`.

### Modul D — Main Inflation Dashboard
**US-D1** — Sebagai **viewer/TPID**, saya ingin satu halaman ringkasan kondisi inflasi terkini, agar cepat paham situasi.
- Menampilkan gauge inflasi (umum/volatile/core), chart tren harga, heatmap wilayah.
- Panel ringkasan alert aktif (open).
- Load awal <2 detik (baca data agregat dari DB, bukan panggil ML live).

### Modul E — Data Ingestion (foundational)
**US-E1** — Sebagai **admin/sistem**, saya ingin data harga & IHK tertarik otomatis setiap hari, agar dashboard selalu fresh.
- Job terjadwal harian (06:00 WITA) menarik PIHPS & BPS.
- Data mentah disimpan, lalu dibersihkan ke tabel ternormalisasi.
- Kegagalan job memunculkan log/alert ke admin.

---

## 4. Metrics & Success Thresholds

| Kategori | Metrik | Target v1 |
|---|---|---|
| **Deteksi** | Lead time alert sebelum lonjakan terkonfirmasi | ≥ 3–7 hari |
| | False positive rate alert | < 30% |
| **Akurasi ML** | MAPE forecast harga komoditas volatile | ≤ 10% |
| | Akurasi klasifikasi sentiment (IndoBERT) | ≥ 80% |
| **Performa** | Load dashboard utama (p95) | < 2 dtk |
| | Uptime ingestion harian | ≥ 95% job sukses |
| **Data** | Freshness data harga | ≤ 1 hari |
| **Adopsi** | Alert yang di-acknowledge oleh TPID | ≥ 70% |

> Catatan: threshold akurasi (MAPE 10%, sentiment 80%) adalah asumsi awal — perlu dikalibrasi setelah baseline data Sulteng terkumpul.

---

## 5. Scope & Timeline Assumptions

**Asumsi:**
- Akses API PIHPS BI & BPS WebAPI tersedia & stabil.
- Sumber berita/sosmed dapat di-scrape secara legal (perlu konfirmasi ToS sosmed).
- Stack mengikuti dokumen arsitektur: Next.js 14 + FastAPI + PostgreSQL/TimescaleDB + Redis.
- Tim kecil; ML & frontend dikerjakan paralel.

**Fase (indikatif):**

| Fase | Cakupan | Estimasi |
|---|---|---|
| **0 — Fondasi** | Setup DB schema, docker-compose, ingestion PIHPS+BPS | 2–3 minggu |
| **1 — Dashboard + Forecast** | Dashboard utama, forecast viewer (SARIMA dulu) | 3–4 minggu |
| **2 — EWS** | Detektor 2-sigma + forecast breach, panel alert | 2–3 minggu |
| **3 — Sentiment** | Pipeline NLP (IndoBERT/BERTopic), dashboard sentiment, alert sentiment spike | 3–4 minggu |
| **4 — Hardening** | Auth/role, audit log, kalibrasi threshold, caching Redis | 2 minggu |

**Risiko utama:** ketersediaan/kualitas data sumber, legalitas scraping sosmed, kalibrasi ambang alert agar tidak banjir false positive, dan beban deploy ML di luar serverless.
