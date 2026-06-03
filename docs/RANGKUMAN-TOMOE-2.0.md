# TOMOE 2.0 — Rangkuman Sistem (untuk Tim)

> **TOMOE 2.0** = sistem **deteksi dini inflasi** (Early Warning System) untuk
> Bank Indonesia / TPID, fokus awal **Sulawesi Tengah**. Memantau harga komoditas
> & inflasi real-time, memprediksi pergerakan harga, menganalisis sentimen publik,
> dan memunculkan peringatan dini tekanan harga per wilayah/komoditas.

Dokumen ini ringkasan arsitektur end-to-end, stack teknologi, database, dan cara
kerja sistem — sebagai onboarding untuk anggota tim baru.

---

## 1. Gambaran Cepat

| Aspek | Ringkasan |
|---|---|
| Domain | Deteksi dini inflasi (harga pangan, IHK, sentimen, peringatan dini) |
| Wilayah awal | Sulawesi Tengah (14 kab/kota), dapat diperluas nasional |
| Pola arsitektur | Microservice terpisah: **UI (Next.js)** ↔ **ML Service (FastAPI)** ↔ **DB (TimescaleDB)** + **ETL (scheduler)** + **Redis** |
| Sumber data | PIHPS (harga pangan), BPS (IHK/inflasi), berita/medsos (sentimen) |
| Status | Prototipe fungsional, jalan end-to-end via Docker |

---

## 2. Arsitektur End-to-End

```
                        ┌──────────────────────────────────────────┐
   Browser  ───────────▶│  FRONTEND — Next.js 14 (App Router)       │
   (pengguna)           │  • Dashboard, charts, peta                 │
                        │  • /api/* (Route Handlers, serverless)     │
                        │  • Auth (JWT), RBAC middleware             │
                        │  • Proxy ML (sisi-server, suntik API key)  │
                        └───────┬───────────────────────┬───────────┘
                                │ SQL (pg)              │ HTTP (+X-API-Key)
                                ▼                        ▼
              ┌─────────────────────────┐    ┌──────────────────────────────┐
              │  DATABASE                │    │  ML SERVICE — FastAPI (Python) │
              │  PostgreSQL 16 +         │    │  • /forecast (SARIMA/LSTM/ens) │
              │  TimescaleDB             │◀───│  • /sentiment (IndoBERT)       │
              │  (hypertable, caggr,     │    │  • /topics (BERTopic)          │
              │   compression)           │    │  • /ews (deteksi anomali)      │
              └───────────▲─────────────┘    └──────────────────────────────┘
                          │ upsert (idempoten + DQ gate)
              ┌───────────┴─────────────┐         ┌──────────────────┐
              │  INGESTION — Scheduler   │         │  REDIS 7         │
              │  APScheduler (Python)    │         │  (cache/queue,   │
              │  • PIHPS harian 06:00    │         │   opsional)      │
              │  • BPS bulanan           │         └──────────────────┘
              │  • Berita tiap 15 mnt    │
              └──────────────────────────┘
                 ▲ scrape          ▲ scrape
            PIHPS BI            BPS WebAPI / berita
```

**Prinsip kunci:** UI tidak pernah memanggil ML service langsung dari browser —
selalu lewat **proxy sisi-server** (`/api/ml/*`) yang menyuntik `ML_API_KEY`,
sehingga rahasia tidak pernah sampai ke browser.

---

## 3. Stack Teknologi (bahasa & framework per layer)

### Frontend — `frontend/`
| Item | Teknologi |
|---|---|
| Bahasa | **TypeScript 5** (strict mode) |
| Framework | **Next.js 14.2** (App Router) + **React 18** |
| Styling | **Tailwind CSS 3.4** |
| Data fetching/cache | **TanStack React Query 5** |
| State global | **Zustand 5** |
| Charts | **Recharts 3** |
| Peta | **Leaflet 1.9** |
| Validasi runtime | **Zod 4** (di batas-kepercayaan data DB/ML) |
| DB client | **node-postgres (`pg`) 8** |
| Util | clsx, tailwind-merge, date-fns, lucide-react |

### ML Service — `ml-service/`
| Item | Teknologi |
|---|---|
| Bahasa | **Python 3.11** |
| Framework | **FastAPI** + **Uvicorn**, **Pydantic 2** |
| Forecasting | **statsmodels** (SARIMA/SARIMAX), **TensorFlow-CPU + tf-keras** (LSTM) |
| NLP sentimen | **Transformers** + **IndoBERT** (`mdhugol/indonesia-bert-sentiment-classification`) |
| Topic modeling | **BERTopic** + **sentence-transformers** |
| Numerik | NumPy, Pandas, scikit-learn |
| DB | SQLAlchemy 2 + psycopg2 |

### Ingestion (ETL) — `ingestion/`
| Item | Teknologi |
|---|---|
| Bahasa | **Python 3.11** |
| Scheduler | **APScheduler** (jobstore persisten di Postgres) |
| HTTP scraping | **httpx** (async) |
| Tulis DB | psycopg2 (upsert idempoten + advisory lock) |

### Data & Infrastruktur
| Item | Teknologi |
|---|---|
| Database | **PostgreSQL 16 + TimescaleDB** (hypertable time-series) |
| Cache/queue | **Redis 7** (opsional) |
| Kontainer | **Docker** + Docker Compose (dev & prod) |
| CI | **GitHub Actions** (pytest, tsc, lint, build, pip-audit, npm audit) |

---

## 4. Database (PostgreSQL + TimescaleDB)

Sumber kebenaran skema: `db/schema.sql`. Seed: `db/seed.sql`. **11 tabel** dalam 6 domain.

| Domain | Tabel | Isi |
|---|---|---|
| **A. Master** | `regions`, `commodities`, `markets` | wilayah, komoditas, pasar |
| **B. Time-series** (hypertable) | `commodity_prices`, `inflation_index`, `inflation_by_group` | harga harian, IHK/inflasi, inflasi per kelompok |
| **C. Output ML** | `forecasts`, `topics`, `sentiment_scores` | hasil prediksi, topik berita, skor sentimen |
| **D. EWS** | `ews_alerts` | peringatan dini (2σ / forecast breach / sentiment spike) |
| **E. Auth & Audit** | `users`, `audit_logs` | pengguna+role+password_hash, jejak audit |
| **F. Lifecycle** | `commodity_prices_daily` (continuous aggregate) | harga harian teragregasi; + compression & retention policy |

**Fitur TimescaleDB:** hypertable untuk data deret-waktu, **continuous aggregate**
(harga terbaru per hari, agar query dashboard cepat), **compression** (chunk >30 hari),
**retention** (10 tahun). Detail kolom: lihat `docs/` atau `db/schema.sql`.

---

## 5. Alur Data End-to-End

1. **Ingestion** (`ingestion/scheduler.py`) menarik data terjadwal:
   - PIHPS (harga pangan) — harian 06:00 WITA
   - BPS (IHK/inflasi) — bulanan
   - Berita/medsos (sentimen) — tiap 15 menit *(stub, roadmap)*
2. Data lewat **gerbang kualitas** (`ingestion/quality.py`: tolak harga null/0/di luar rentang) lalu **upsert idempoten** (`db_writer.py`, `ON CONFLICT` + advisory lock) → **PostgreSQL**.
3. **ML Service** membaca deret dari DB → hitung **forecast** (SARIMA/LSTM/Ensemble), **sentimen** (IndoBERT), **anomali EWS** → simpan ke `forecasts`/`sentiment_scores`/`ews_alerts`.
4. **Frontend** (`/api/*` route handlers) membaca DB (via `pg`) untuk dashboard, dan memanggil ML lewat **proxy** `/api/ml/*` untuk perhitungan interaktif.
5. Pengguna melihat dashboard: KPI inflasi, tabel harga, grafik forecast, peta risiko, sentimen, daftar peringatan dini.

---

## 6. Komponen Cerdas (ML)

| Fitur | Cara kerja | File |
|---|---|---|
| **Forecast harga/inflasi** | SARIMA (frequency-aware, musiman mingguan utk data harian) + LSTM (lookback 30, CI melebar `σ√h`) + Ensemble (gabung interval via *law of total variance*). MAPE **walk-forward** (out-of-sample). Saat ini **univariat**. | `ml-service/app/forecasting/` |
| **Sentimen** | IndoBERT fine-tuned (positif/netral/negatif) | `ml-service/app/nlp/sentiment.py` |
| **Topic modeling** | BERTopic (indo-sentence-bert) | `ml-service/app/nlp/topic_model.py` |
| **Early Warning** | Deteksi anomali: 2σ klasik **dan** robust median+MAD (log-space, anti false-positive utk harga skewed); forecast-breach; sentiment-spike | `ml-service/app/ews/detector.py` |

**Guard produksi:** endpoint berat di-offload ke threadpool (loop tak ter-block),
dibatasi konkurensi (load-shed 503) + timeout (504), hasil di-cache. Lihat
`ml-service/app/runtime.py`, `cache.py`.

> **Catatan roadmap:** forecast saat ini **univariat** (hanya deret target).
> Rencana upgrade ke **multivariat/SARIMAX** dengan variabel eksogen (harga
> komoditas lagged, dummy kalender Ramadan/Lebaran/panen, kurs, sentimen).

---

## 7. Keamanan

| Lapisan | Implementasi |
|---|---|
| Autentikasi | **JWT sesi** (HS256, Web Crypto — tanpa dependency tambahan), cookie httpOnly. `frontend/src/lib/auth.ts` |
| Otorisasi | **RBAC middleware** di `/api/*` (admin/analyst/tpid/viewer). `frontend/src/middleware.ts` |
| Password | **PBKDF2-SHA256** (tidak pernah plaintext) |
| Rahasia ML | **Proxy sisi-server** menyuntik `ML_API_KEY`; browser tak pernah pegang. `frontend/src/lib/ml-proxy.ts` |
| Audit | `audit_logs` (login, akses data sensitif). `frontend/src/lib/audit.ts` |
| Header | CSP, HSTS, X-Frame-Options DENY, nosniff. `frontend/next.config.mjs` |
| ML service | API key opsional, batas ukuran input, pesan error generik (tak bocorkan internal) |

> **Demo:** semua akun seed pakai password `tomoe123` (PBKDF2). **WAJIB diganti**
> sebelum produksi, dan set `AUTH_SECRET`/`ML_API_KEY`/`POSTGRES_PASSWORD` via env.

---

## 8. DevOps & Cara Menjalankan

### Development (lokal, Docker)
```bash
cp .env.example .env            # isi nilai bila perlu
docker compose up -d --build    # db + redis + ml-service + frontend (+ ingestion)
# Frontend  → http://localhost:3000
# ML API    → http://localhost:8000   (/docs untuk Swagger)
```
Dev compose **mount source code** sebagai volume (hot-reload): edit kode langsung
tercermin tanpa rebuild image.

### Production
- Dockerfile produksi multi-stage, **non-root**: `frontend/Dockerfile.prod`, `ml-service/Dockerfile.prod`, `ingestion/Dockerfile.prod`.
- `docker-compose.prod.yml`: tag image dipin, resource limit, restart policy, `npm ci`, DB/Redis tak ter-expose ke host, `AUTH_REQUIRED=true`.
```bash
POSTGRES_PASSWORD=… ML_API_KEY=… AUTH_SECRET=… \
  docker compose -f docker-compose.prod.yml up -d --build
```

### CI — `.github/workflows/ci.yml`
Tiap push/PR ke `main`: pytest (ML + ingestion), `tsc`, lint, build, pip-audit, npm audit.

### Testing
- ML: `cd ml-service && pytest` (23 test) · Ingestion: `cd ingestion && pytest` (7 test)
- Frontend: `npx tsc --noEmit` + `npm run lint`

---

## 9. Variabel Lingkungan (env)

| Variabel | Dipakai | Catatan |
|---|---|---|
| `DATABASE_URL` | frontend, ml, ingestion | koneksi Postgres |
| `ML_INTERNAL_URL` | frontend (server) | URL ML service (bukan publik) |
| `ML_API_KEY` | frontend proxy + ml | rahasia bersama; kosong = auth ML nonaktif (dev) |
| `AUTH_SECRET` | frontend | kunci HMAC sesi JWT — random panjang di prod |
| `AUTH_REQUIRED` | frontend | `true` = kunci seluruh `/api` (prod) |
| `POSTGRES_PASSWORD` | db | — |
| `BPS_API_KEY` | ingestion | kosong = scraper BPS pakai mock/skip |
| `REDIS_URL` | ml | — |

Template lengkap: `.env.example`. **Jangan commit** `.env`/`.env.local` (sudah di-gitignore).

---

## 10. Deployment ke Vercel (ringkas)

Vercel **hanya** menjalankan Next.js. Komponen lain di-host terpisah:
- **DB** → **Timescale Cloud** (dukung hypertable/caggr) via connection pooler.
- **ML Service** → Railway/Render/Fly.io (pakai `Dockerfile.prod`), set `ML_INTERNAL_URL` ke URL-nya.
- **Ingestion** → Vercel Cron (panggil route `/api/cron/*`) atau worker eksternal.
- **Redis** (bila perlu) → Upstash.

Detail langkah deploy bisa dibuatkan terpisah (`docs/DEPLOY-VERCEL.md`).

---

## 11. Struktur Repo

```
TOMOE-2.0/
├── frontend/          Next.js (UI + /api + auth + proxy ML)
│   └── src/{app,components,lib,store,types}
├── ml-service/        FastAPI (forecast, sentimen, topik, EWS)
│   └── app/{forecasting,nlp,ews}
├── ingestion/         APScheduler ETL (scraper PIHPS/BPS + writer + DQ)
├── db/                schema.sql (TimescaleDB), schema.postgres.sql, seed.sql
├── docs/              dokumentasi (termasuk file ini)
├── docker-compose.yml / docker-compose.prod.yml
└── .github/workflows/ CI
```

---

## 12. Status & Roadmap

**Sudah jalan:** stack end-to-end (Docker), dashboard, auth+RBAC, forecast univariat
(SARIMA/LSTM/Ensemble) dgn MAPE walk-forward, sentimen IndoBERT, EWS robust, ETL
idempoten + gerbang kualitas, CI.

**Roadmap:**
1. **Forecast multivariat/SARIMAX** dengan variabel eksogen (harga komoditas lagged, kalender Ramadan/Lebaran/panen, kurs, sentimen).
2. Parser HTML PIHPS riil (saat ini skip non-JSON), ingestion BPS ke `inflation_index`.
3. Pipeline berita → sentimen otomatis (job 15 menit).
4. Model registry + perbandingan backtest, SHAP untuk penjelasan "kenapa inflasi naik".
5. UI login + manajemen pengguna.

---

*Dokumen ini dibuat sebagai onboarding tim. Untuk detail teknis, rujuk kode &
`db/schema.sql`.*
