# TOMOE 2.0 — Data Contract MVP

Dokumen ini adalah kontrak bentuk data untuk demo/MVP. Selama sumber data riil
belum stabil, dummy data harus mengikuti kontrak ini agar frontend, ingestion,
database, dan ML service tidak berubah-ubah shape.

## Prinsip

- **Grain jelas.** Setiap dataset punya unit observasi: per hari, per bulan, per
  komoditas, per pasar, atau per wilayah.
- **Kode stabil.** Join lintas layer memakai `region_code`, `commodity_code`,
  dan `market_id`/`market_code`, bukan nama tampilan.
- **Waktu ISO.** Semua timestamp memakai ISO 8601. Tanggal harian boleh
  `YYYY-MM-DD`; timestamp event memakai timezone.
- **Angka numerik asli.** Nilai harga, indeks, forecast, sentimen, dan metrik
  dikirim sebagai number, bukan string.
- **Dummy realistis.** Dummy boleh sintetis, tapi harus berada pada rentang
  harga/inflasi yang masuk akal dan lolos quality gate.

## Scope MVP

Level demo utama: **Sulawesi Tengah** dengan dukungan agregat provinsi dan
beberapa kabupaten/kota/pasar. Dataset nasional boleh dipakai sebagai fallback
visual, tapi kontrak produksi tetap sama.

## Master Data

### `regions`

Grain: satu row per wilayah administratif.

| Field | Type | Required | Contoh | Catatan |
|---|---:|:---:|---|---|
| `code` | string | yes | `7200` | Kode BPS/wilayah internal stabil |
| `name` | string | yes | `Sulawesi Tengah` | Nama tampilan |
| `type` | enum | yes | `provinsi` | `provinsi`, `kota`, `kabupaten` |
| `parent_code` | string/null | no | null | Untuk kab/kota isi kode provinsi |
| `latitude` | number/null | no | `-1.4300` | Untuk peta |
| `longitude` | number/null | no | `121.4456` | Untuk peta |

Dummy row:

```json
{
  "code": "7271",
  "name": "Kota Palu",
  "type": "kota",
  "parent_code": "7200",
  "latitude": -0.9003,
  "longitude": 119.8779
}
```

### `commodities`

Grain: satu row per komoditas pantauan.

| Field | Type | Required | Contoh | Catatan |
|---|---:|:---:|---|---|
| `code` | string | yes | `CABAI_MERAH` | Stabil, uppercase snake case |
| `name` | string | yes | `Cabai Merah Keriting` | Nama tampilan |
| `category` | string | yes | `Bahan Makanan` | Kelompok UI |
| `unit` | string | yes | `kg` | `kg`, `liter`, `tabung` |
| `is_volatile` | boolean | yes | `true` | Volatile food/komoditas rawan |

Dummy row:

```json
{
  "code": "CABAI_MERAH",
  "name": "Cabai Merah Keriting",
  "category": "Bahan Makanan",
  "unit": "kg",
  "is_volatile": true
}
```

### `markets`

Grain: satu row per pasar/titik pantau harga.

| Field | Type | Required | Contoh | Catatan |
|---|---:|:---:|---|---|
| `name` | string | yes | `Pasar Inpres Manonda` | Nama tampilan |
| `region_code` | string | yes | `7271` | FK ke `regions.code` |
| `source` | enum | yes | `PIHPS` | `PIHPS`, `BPS`, `manual` |
| `is_active` | boolean | yes | `true` | Pasar aktif dipakai dashboard |

## Time-Series Input

### Harga Komoditas Harian

Target DB: `commodity_prices`.

Grain: satu row per `date + commodity_code + market_id`.

| Field | Type | Required | Contoh | Catatan |
|---|---:|:---:|---|---|
| `date` | date | yes | `2026-06-01` | Hari observasi harga |
| `region_code` | string | yes | `7271` | Denormalisasi untuk ingestion |
| `market_name` | string | yes | `Pasar Inpres Manonda` | Di-resolve ke `market_id` |
| `commodity_code` | string | yes | `CABAI_MERAH` | Di-resolve ke `commodity_id` |
| `price` | number | yes | `80000` | Rupiah per unit, harus > 0 |
| `price_change` | number/null | no | `2500` | Selisih dari observasi sebelumnya |
| `source` | string | yes | `PIHPS` | `PIHPS`, `PANEL_PANGAN`, `MANUAL` |
| `ingested_at` | timestamp | no | `2026-06-01T06:00:00+08:00` | Waktu masuk pipeline |

Quality rules:

- `price > 0`
- `price` berada pada rentang wajar per komoditas
- duplikat `date + commodity_code + market_name` harus di-upsert, bukan insert
  ganda
- missing `price` tidak boleh masuk tabel final

Dummy rows:

```json
[
  {
    "date": "2026-06-01",
    "region_code": "7271",
    "market_name": "Pasar Inpres Manonda",
    "commodity_code": "CABAI_MERAH",
    "price": 80000,
    "price_change": 2500,
    "source": "PIHPS",
    "ingested_at": "2026-06-01T06:00:00+08:00"
  },
  {
    "date": "2026-06-01",
    "region_code": "7271",
    "market_name": "Pasar Inpres Manonda",
    "commodity_code": "BERAS_PREM",
    "price": 15200,
    "price_change": 100,
    "source": "PIHPS",
    "ingested_at": "2026-06-01T06:00:00+08:00"
  }
]
```

### Inflasi/IHK Bulanan

Target DB: `inflation_index`.

Grain: satu row per `month + region_code + component`.

| Field | Type | Required | Contoh | Catatan |
|---|---:|:---:|---|---|
| `month` | date | yes | `2026-05-01` | Tanggal hari pertama bulan |
| `region_code` | string | yes | `7200` | Provinsi/nasional sesuai scope |
| `component` | enum | yes | `umum` | `umum`, `volatile`, `core`, `administered` |
| `ihk` | number/null | no | `112.4567` | Indeks Harga Konsumen |
| `mtm` | number/null | no | `0.32` | Persen month-to-month |
| `yoy` | number/null | no | `3.12` | Persen year-on-year |
| `ytd` | number/null | no | `1.45` | Persen year-to-date |
| `source` | string | yes | `BPS` | Untuk audit ingestion |

Dummy row:

```json
{
  "month": "2026-05-01",
  "region_code": "7200",
  "component": "umum",
  "ihk": 112.4567,
  "mtm": 0.32,
  "yoy": 3.12,
  "ytd": 1.45,
  "source": "BPS"
}
```

### Inflasi Per Kelompok

Target DB: `inflation_by_group`.

Grain: satu row per `month + region_code + group_name`.

| Field | Type | Required | Contoh |
|---|---:|:---:|---|
| `month` | date | yes | `2026-05-01` |
| `region_code` | string | yes | `7200` |
| `group_name` | string | yes | `Makanan, Minuman, dan Tembakau` |
| `ihk` | number/null | no | `115.4321` |
| `mtm` | number/null | no | `0.48` |
| `yoy` | number/null | no | `4.21` |
| `andil_mtm` | number/null | no | `0.12` |

## Text/Sentiment Input

Target DB: `sentiment_scores` dan `topics`.

Grain: satu row per dokumen/teks yang dianalisis.

| Field | Type | Required | Contoh | Catatan |
|---|---:|:---:|---|---|
| `time` | timestamp | yes | `2026-06-01T08:30:00+08:00` | Waktu publish/capture |
| `source_url` | string/null | no | `https://...` | URL artikel/post |
| `source_type` | enum | yes | `news` | `news`, `twitter`, `instagram`, `other` |
| `region_code` | string/null | no | `7271` | null bila tidak terdeteksi |
| `commodity_code` | string/null | no | `CABAI_MERAH` | null bila umum |
| `text` | string | yes | `Harga cabai...` | Input NLP |
| `language` | string | yes | `id` | MVP hanya Bahasa Indonesia |

Output NLP:

| Field | Type | Required | Contoh |
|---|---:|:---:|---|
| `sentiment` | enum | yes | `negatif` |
| `score` | number | yes | `-0.91` |
| `confidence` | number | yes | `0.95` |
| `topic_label` | string/null | no | `volatile_food` |

Dummy row:

```json
{
  "time": "2026-06-01T08:30:00+08:00",
  "source_url": null,
  "source_type": "twitter",
  "region_code": "7271",
  "commodity_code": "CABAI_MERAH",
  "text": "Cabai merah tembus 80ribu/kg, dapur makin berat nih warga Palu.",
  "language": "id",
  "sentiment": "negatif",
  "score": -0.91,
  "confidence": 0.95,
  "topic_label": "volatile_food"
}
```

## ML Output

### Forecast

Target DB: `forecasts`.

Grain: satu row per `run_at + forecast_date + region + target + model`.

| Field | Type | Required | Contoh | Catatan |
|---|---:|:---:|---|---|
| `run_at` | timestamp | yes | `2026-06-01T07:00:00+08:00` | Waktu model dijalankan |
| `forecast_date` | date | yes | `2026-06-08` | Tanggal prediksi |
| `region_code` | string | yes | `7200` | Scope prediksi |
| `commodity_code` | string/null | no | `CABAI_MERAH` | null untuk inflasi |
| `component` | string/null | no | `umum` | null untuk komoditas |
| `model` | enum | yes | `Ensemble` | `SARIMA`, `LSTM`, `Ensemble`, `Prophet` |
| `predicted` | number | yes | `83500` | Nilai prediksi |
| `lower_bound` | number/null | no | `79000` | CI bawah |
| `upper_bound` | number/null | no | `88000` | CI atas |
| `mape` | number/null | no | `8.14` | Dari backtest/holdout |
| `params` | object/null | no | `{ "horizon": 7 }` | Metadata model |

Dummy row:

```json
{
  "run_at": "2026-06-01T07:00:00+08:00",
  "forecast_date": "2026-06-08",
  "region_code": "7271",
  "commodity_code": "CABAI_MERAH",
  "component": null,
  "model": "Ensemble",
  "predicted": 83500,
  "lower_bound": 79000,
  "upper_bound": 88000,
  "mape": 8.14,
  "params": {
    "horizon": 7,
    "seasonal_periods": 7,
    "backtest_folds": 8
  }
}
```

### EWS Alert

Target DB: `ews_alerts`.

Grain: satu row per alert event.

| Field | Type | Required | Contoh |
|---|---:|:---:|---|
| `triggered_at` | timestamp | yes | `2026-06-01T07:05:00+08:00` |
| `region_code` | string | yes | `7271` |
| `commodity_code` | string | yes | `CABAI_MERAH` |
| `alert_type` | enum | yes | `forecast_breach` |
| `severity` | enum | yes | `high` |
| `actual_value` | number/null | no | `80000` |
| `threshold` | number/null | no | `65000` |
| `message` | string | yes | `Harga cabai merah melampaui ambang...` |
| `status` | enum | yes | `open` |
| `metadata` | object/null | no | `{ "detector": "robust_mad" }` |

Allowed values:

- `alert_type`: `2sigma`, `forecast_breach`, `sentiment_spike`
- `severity`: `low`, `medium`, `high`
- `status`: `open`, `acknowledged`, `resolved`

## API Response Contract

Frontend route handlers may join DB tables and return denormalized names. These
shapes must stay aligned with `frontend/src/types/index.ts`.

### `GET /api/commodities`

```json
[
  {
    "time": "2026-06-01",
    "commodity_id": 2,
    "commodity_name": "Cabai Merah Keriting",
    "category": "Bahan Makanan",
    "market_name": "Pasar Inpres Manonda",
    "region_name": "Kota Palu",
    "price": 80000,
    "unit": "kg",
    "price_change": 2500,
    "price_change_pct": 3.23
  }
]
```

### `GET /api/inflation`

```json
[
  {
    "time": "2026-05-01",
    "region_id": 1,
    "region_name": "Sulawesi Tengah",
    "component": "umum",
    "ihk": 112.4567,
    "mtm": 0.32,
    "yoy": 3.12,
    "ytd": 1.45
  }
]
```

### `GET /api/forecast`

```json
{
  "results": [
    {
      "id": 1,
      "region_id": 1,
      "region_name": "Sulawesi Tengah",
      "component": "umum",
      "model": "Ensemble",
      "forecast_date": "2026-06-30",
      "run_at": "2026-06-01T07:00:00+08:00",
      "predicted": 3.35,
      "lower_bound": 3.07,
      "upper_bound": 3.63,
      "mape": 3.5
    }
  ],
  "monthly": [],
  "chart_data": []
}
```

### `GET /api/ews`

```json
[
  {
    "id": 1,
    "triggered_at": "2026-06-01T07:05:00+08:00",
    "region_name": "Kota Palu",
    "commodity_name": "Cabai Merah Keriting",
    "alert_type": "2sigma",
    "severity": "high",
    "actual_value": 80000,
    "threshold": 65000,
    "message": "Harga cabai merah melampaui ambang 2-sigma.",
    "status": "open"
  }
]
```

### `POST /forecast/backtest` ML Service

Request:

```json
{
  "series": [76000, 77000, 78000, 80000],
  "model": "sarima",
  "horizon": 7,
  "initial_train_size": 60,
  "step_size": 7,
  "max_folds": 8,
  "seasonal_periods": 7
}
```

Response:

```json
{
  "model": "SARIMA",
  "fold_count": 8,
  "horizon": 7,
  "metrics": {
    "mape": 8.14,
    "mae": 2450.25,
    "rmse": 3102.44
  },
  "folds": []
}
```

## Minimum Dummy Dataset For Demo

Untuk demo tanpa data riil, isi minimal:

- `regions`: 1 provinsi + 3 kab/kota
- `commodities`: 8-12 komoditas, minimal 3 volatile
- `markets`: minimal 2 pasar di Palu + 1 pasar kabupaten
- `commodity_prices`: minimal 90 hari per komoditas untuk forecast/backtest
- `inflation_index`: minimal 24 bulan untuk `umum`, `volatile`, `core`
- `inflation_by_group`: minimal 12 bulan untuk 5 kelompok utama
- `sentiment_scores`: minimal 30 hari, 50-100 dokumen dummy
- `topics`: minimal 5 topik
- `forecasts`: 7/14/30 hari per komoditas prioritas
- `ews_alerts`: 3-5 alert campuran status/severity

## Acceptance Criteria

- Frontend tidak perlu tahu apakah data berasal dari dummy atau riil; shape sama.
- Route API tidak mengembalikan field numerik sebagai string.
- ML forecast menerima `series: number[]` dan mengembalikan panjang prediksi sama
  dengan `steps`/`horizon`.
- Semua dummy data lolos constraint `db/schema.sql`.
- Bila sumber riil belum tersedia, seed/fallback harus tetap mengikuti kontrak ini.
