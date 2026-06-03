# TOMOE 2.0

**Sistem Deteksi Dini Inflasi (Early Warning System)** untuk Bank Indonesia / TPID —
fokus awal **Sulawesi Tengah**. Memantau harga komoditas & inflasi real-time,
memprediksi pergerakan harga (SARIMA/LSTM/Ensemble), menganalisis sentimen publik
(IndoBERT), dan memunculkan peringatan dini tekanan harga per wilayah/komoditas.

> 📄 Ringkasan arsitektur lengkap untuk tim: [`docs/RANGKUMAN-TOMOE-2.0.md`](docs/RANGKUMAN-TOMOE-2.0.md)

---

## Arsitektur singkat

```
Browser ─▶ Frontend (Next.js)  ─SQL─▶  PostgreSQL + TimescaleDB
              │  /api/* + auth          ▲
              │  proxy ML (server-side) │ upsert (idempoten + DQ gate)
              └─HTTP(+key)─▶ ML Service (FastAPI)   Ingestion (APScheduler)
                            forecast/sentimen/EWS   PIHPS · BPS · berita
```

| Layer | Bahasa | Framework / Tools |
|---|---|---|
| Frontend | TypeScript 5 | Next.js 14 (App Router), React 18, Tailwind 3, React Query 5, Zustand 5, Zod 4, Recharts, Leaflet |
| ML Service | Python 3.11 | FastAPI, statsmodels (SARIMA), TensorFlow-CPU (LSTM), Transformers/IndoBERT, BERTopic |
| Ingestion | Python 3.11 | APScheduler, httpx, psycopg2 |
| Data | — | PostgreSQL 16 + TimescaleDB, Redis 7 |
| Infra | — | Docker Compose, GitHub Actions, Husky |

---

## Menjalankan (Development)

Prasyarat: **Docker** (+ Docker Compose). Lihat catatan Colima di bawah bila pakai macOS tanpa Docker Desktop.

```bash
cp .env.example .env          # sesuaikan bila perlu
docker compose up -d --build  # db + redis + ml-service + frontend (+ ingestion)
```

- Frontend  → http://localhost:3000
- ML API    → http://localhost:8000  (Swagger: `/docs`)

Compose dev me-*mount* source code (hot-reload): edit kode langsung tercermin
tanpa rebuild image. Untuk re-seed DB (skema/seed berubah): `docker compose down -v && docker compose up -d`.

**Login demo:** `admin@bi.go.id` / `tomoe123` (juga `analyst@bi.go.id`, `viewer@tpid.go.id`).
⚠️ Ganti password & secret sebelum produksi.

### Production
```bash
POSTGRES_PASSWORD=… ML_API_KEY=… AUTH_SECRET=… \
  docker compose -f docker-compose.prod.yml up -d --build
```
Image produksi: multi-stage, non-root, resource limit, `AUTH_REQUIRED=true`.

---

## Git Hooks (Husky) 🐶

Repo ini memakai **Husky** untuk menjalankan pemeriksaan otomatis di Git, supaya
pelanggaran standar tertangkap **di laptop** sebelum masuk repo / CI.

### Setup (sekali, untuk anggota baru)
```bash
npm install        # di ROOT repo — script "prepare" otomatis meng-install hook
```
Cukup itu. Hook langsung aktif untuk semua anggota tim (tidak perlu langkah manual).

### Hook yang aktif

| Hook | Kapan | Yang dijalankan |
|---|---|---|
| **pre-commit** | tiap `git commit` | Jika ada `.ts/.tsx` ter-stage → `tsc --noEmit` + `next lint` (frontend). File `.py` ter-stage → `py_compile`. |
| **pre-push** | tiap `git push` | `pytest` ML + ingestion (otomatis dilewati jika env Python tak tersedia — CI tetap menjalankan). |

### Catatan penggunaan
- Hook gagal → commit/push **dibatalkan**; perbaiki dulu errornya.
- Pemeriksaan berlapis: **pre-commit** (cepat) → **pre-push** (test) → **GitHub Actions** (lengkap di server).
- Bypass darurat (hindari kecuali benar-benar perlu): `git commit --no-verify` / `git push --no-verify`.
- Konfigurasi hook ada di [`.husky/`](.husky/); tooling di [`package.json`](package.json) root.

---

## Standar Kode (TypeScript)

Wajib dipatuhi (di-enforce oleh pre-commit + CI):
1. **Tanpa** `as any`, `as unknown as`, `@ts-ignore`.
2. Definisikan `interface`/`type` untuk shape yang belum jelas.
3. Pakai **type guard / narrowing** untuk cek runtime.
4. Data eksternal (DB row, JWT, response ML) → validasi **Zod**.
5. Prefer **`satisfies`** daripada `as`.
6. Jelaskan tipe yang dipakai (komentar singkat).

---

## Testing

```bash
# ML service (23 test)
cd ml-service && pip install -r requirements.txt -r requirements-dev.txt && pytest

# Ingestion (7 test)
cd ingestion && pip install -r requirements.txt pytest && pytest

# Frontend
cd frontend && npm install && npx tsc --noEmit && npm run lint && npm run build
```

CI (GitHub Actions, [`.github/workflows/ci.yml`](.github/workflows/ci.yml)) menjalankan
semua ini + `pip-audit` & `npm audit` pada tiap push/PR ke `main`.

---

## Variabel Lingkungan

Template lengkap: [`.env.example`](.env.example). Yang utama:

| Variabel | Dipakai | Catatan |
|---|---|---|
| `DATABASE_URL` | frontend, ml, ingestion | koneksi Postgres |
| `ML_INTERNAL_URL` | frontend (server) | URL ML service (bukan publik) |
| `ML_API_KEY` | frontend proxy + ml | rahasia bersama; kosong = auth ML nonaktif (dev) |
| `AUTH_SECRET` | frontend | kunci HMAC sesi JWT — random panjang di prod |
| `AUTH_REQUIRED` | frontend | `true` = kunci seluruh `/api` (prod) |
| `POSTGRES_PASSWORD` | db | — |
| `BPS_API_KEY` | ingestion | kosong = scraper BPS skip |

**Jangan commit** `.env` / `.env.local` (sudah di-gitignore).

---

## Struktur Repo

```
TOMOE-2.0/
├── frontend/          Next.js (UI + /api + auth + proxy ML)
├── ml-service/        FastAPI (forecast, sentimen, topik, EWS)
├── ingestion/         APScheduler ETL (scraper + writer + DQ gate)
├── db/                schema.sql + seed.sql (PostgreSQL/TimescaleDB)
├── docs/              dokumentasi (RANGKUMAN, dll)
├── .husky/            Git hooks
├── .github/workflows/ CI
├── docker-compose.yml / docker-compose.prod.yml
└── package.json       tooling root (Husky)
```

---

## Deployment ke Vercel (ringkas)

Vercel hanya menjalankan Next.js. Komponen lain di-host terpisah:
- **DB** → Timescale Cloud (via connection pooler)
- **ML Service** → Railway/Render/Fly.io (`ml-service/Dockerfile.prod`)
- **Ingestion** → Vercel Cron atau worker eksternal
- **Redis** → Upstash (bila perlu)

---

## Catatan macOS / Colima

Bila Docker via **Colima** (VM di SSD eksternal): set `COLIMA_HOME` dan pastikan SSD tercolok.
```bash
export COLIMA_HOME="/Volumes/Rohis SSD/colima"
colima start          # nyalakan VM dulu
docker compose up -d
```
