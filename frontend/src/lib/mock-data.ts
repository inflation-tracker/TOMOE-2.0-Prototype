import type { InflationData, CommodityPrice, ForecastResult, SentimentScore, EWSAlert, DashboardSummary } from '@/types'

// ─── Deterministic helpers ───────────────────────────────────────────────────
// This module is evaluated twice: once on the server (SSR) and once in the
// client bundle. Math.random(), new Date() and toLocaleString() would each
// diverge between the two renders, producing different text and triggering
// hydration mismatches (React #425). Everything below is seeded / fixed / UTC
// so the server and client always produce byte-identical output.
const NOW = new Date('2026-05-31T00:00:00.000Z')

// Mulberry32 — tiny deterministic PRNG returning a float in [0, 1).
function makeRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ID_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
// Deterministic "Mmm yy" (e.g. "Jun 26") — avoids server/client ICU differences.
const fmtMonthShort = (d: Date) => `${ID_MONTHS_SHORT[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(-2)}`

// ─── 34 Provinsi Indonesia (Nasional) ────────────────────────────────────────
export const provinsiNasional = [
  { code: '11', name: 'Aceh',                    lat: 4.695,   lng: 96.749,  yoy: 2.71, mtm: 0.28, risk: 52 },
  { code: '12', name: 'Sumatera Utara',           lat: 2.115,   lng: 99.543,  yoy: 3.12, mtm: 0.41, risk: 68 },
  { code: '13', name: 'Sumatera Barat',           lat: -0.740,  lng: 100.800, yoy: 2.89, mtm: 0.32, risk: 58 },
  { code: '14', name: 'Riau',                     lat: 0.293,   lng: 101.707, yoy: 3.45, mtm: 0.55, risk: 74 },
  { code: '15', name: 'Jambi',                    lat: -1.610,  lng: 103.617, yoy: 2.65, mtm: 0.25, risk: 47 },
  { code: '16', name: 'Sumatera Selatan',         lat: -3.319,  lng: 104.914, yoy: 2.98, mtm: 0.38, risk: 61 },
  { code: '17', name: 'Bengkulu',                 lat: -3.793,  lng: 102.265, yoy: 2.45, mtm: 0.21, risk: 42 },
  { code: '18', name: 'Lampung',                  lat: -4.557,  lng: 105.406, yoy: 3.21, mtm: 0.47, risk: 65 },
  { code: '19', name: 'Kep. Bangka Belitung',     lat: -2.741,  lng: 106.440, yoy: 2.82, mtm: 0.33, risk: 55 },
  { code: '21', name: 'Kep. Riau',                lat: 3.942,   lng: 108.142, yoy: 3.58, mtm: 0.62, risk: 78 },
  { code: '31', name: 'DKI Jakarta',              lat: -6.211,  lng: 106.845, yoy: 2.95, mtm: 0.35, risk: 60 },
  { code: '32', name: 'Jawa Barat',               lat: -6.917,  lng: 107.619, yoy: 3.08, mtm: 0.42, risk: 64 },
  { code: '33', name: 'Jawa Tengah',              lat: -7.150,  lng: 110.141, yoy: 2.78, mtm: 0.29, risk: 53 },
  { code: '34', name: 'DI Yogyakarta',            lat: -7.797,  lng: 110.370, yoy: 2.61, mtm: 0.24, risk: 46 },
  { code: '35', name: 'Jawa Timur',               lat: -7.536,  lng: 112.239, yoy: 3.72, mtm: 0.68, risk: 87 },
  { code: '36', name: 'Banten',                   lat: -6.406,  lng: 106.064, yoy: 3.15, mtm: 0.44, risk: 66 },
  { code: '51', name: 'Bali',                     lat: -8.409,  lng: 115.188, yoy: 2.55, mtm: 0.22, risk: 44 },
  { code: '52', name: 'Nusa Tenggara Barat',      lat: -8.653,  lng: 117.362, yoy: 2.88, mtm: 0.31, risk: 57 },
  { code: '53', name: 'Nusa Tenggara Timur',      lat: -8.657,  lng: 121.079, yoy: 3.41, mtm: 0.52, risk: 72 },
  { code: '61', name: 'Kalimantan Barat',         lat: -0.139,  lng: 111.088, yoy: 3.25, mtm: 0.48, risk: 67 },
  { code: '62', name: 'Kalimantan Tengah',        lat: -1.681,  lng: 113.382, yoy: 2.92, mtm: 0.36, risk: 59 },
  { code: '63', name: 'Kalimantan Selatan',       lat: -3.093,  lng: 115.282, yoy: 3.18, mtm: 0.45, risk: 65 },
  { code: '64', name: 'Kalimantan Timur',         lat: 0.538,   lng: 116.419, yoy: 3.62, mtm: 0.58, risk: 76 },
  { code: '65', name: 'Kalimantan Utara',         lat: 3.073,   lng: 116.041, yoy: 3.35, mtm: 0.51, risk: 70 },
  { code: '71', name: 'Sulawesi Utara',           lat: 0.624,   lng: 123.975, yoy: 2.68, mtm: 0.26, risk: 49 },
  { code: '72', name: 'Sulawesi Tengah',          lat: -1.430,  lng: 121.446, yoy: 3.12, mtm: 0.40, risk: 63 },
  { code: '73', name: 'Sulawesi Selatan',         lat: -3.662,  lng: 119.974, yoy: 3.48, mtm: 0.54, risk: 73 },
  { code: '74', name: 'Sulawesi Tenggara',        lat: -4.145,  lng: 122.174, yoy: 2.76, mtm: 0.30, risk: 52 },
  { code: '75', name: 'Gorontalo',                lat: 0.540,   lng: 123.060, yoy: 2.52, mtm: 0.20, risk: 40 },
  { code: '76', name: 'Sulawesi Barat',           lat: -2.840,  lng: 119.232, yoy: 2.85, mtm: 0.34, risk: 55 },
  { code: '81', name: 'Maluku',                   lat: -3.238,  lng: 130.145, yoy: 2.48, mtm: 0.19, risk: 38 },
  { code: '82', name: 'Maluku Utara',             lat: 1.571,   lng: 127.808, yoy: 2.65, mtm: 0.27, risk: 45 },
  { code: '91', name: 'Papua Barat',              lat: -1.336,  lng: 133.174, yoy: 3.85, mtm: 0.72, risk: 89 },
  { code: '94', name: 'Papua',                    lat: -4.270,  lng: 138.080, yoy: 4.12, mtm: 0.81, risk: 93 },
]

// ─── Inflation History (24 bulan, data nasional) ──────────────────────────────
export const mockInflationHistory: InflationData[] = [
  ...Array.from({ length: 24 }, (_, i) => {
    const date = new Date(Date.UTC(2024, i, 1))
    const base = 2.5 + Math.sin(i * 0.4) * 0.6 + i * 0.03
    return {
      time: date.toISOString().slice(0, 10),
      region_id: 0,
      region_name: 'Nasional',
      component: 'umum' as const,
      ihk: 110 + i * 0.4,
      mtm: parseFloat((0.2 + Math.sin(i * 0.8) * 0.25).toFixed(2)),
      yoy: parseFloat(base.toFixed(2)),
      ytd: parseFloat((base * 0.3).toFixed(2)),
    }
  }),
  ...Array.from({ length: 24 }, (_, i) => {
    const date = new Date(Date.UTC(2024, i, 1))
    const base = 3.2 + Math.cos(i * 0.3) * 1.2
    return {
      time: date.toISOString().slice(0, 10),
      region_id: 0,
      region_name: 'Nasional',
      component: 'volatile' as const,
      ihk: 108 + i * 0.5,
      mtm: parseFloat((0.4 + Math.cos(i * 0.9) * 0.5).toFixed(2)),
      yoy: parseFloat(base.toFixed(2)),
      ytd: parseFloat((base * 0.3).toFixed(2)),
    }
  }),
  ...Array.from({ length: 24 }, (_, i) => {
    const date = new Date(Date.UTC(2024, i, 1))
    return {
      time: date.toISOString().slice(0, 10),
      region_id: 0,
      region_name: 'Nasional',
      component: 'core' as const,
      ihk: 112 + i * 0.3,
      mtm: parseFloat((0.15 + Math.sin(i * 0.5) * 0.1).toFixed(2)),
      yoy: parseFloat((1.8 + i * 0.025).toFixed(2)),
      ytd: parseFloat((0.6 + i * 0.008).toFixed(2)),
    }
  }),
]

// ─── Monthly Forecast (YoY & MtM) — 1x per bulan ────────────────────────────
// Historical: Jan 2024 – Mei 2026 (28 bulan), Forecast: Jun–Des 2026 (7 bulan)
export const mockMonthlyForecast = (() => {
  const months: {
    month: string
    yoy_actual: number | null
    yoy_sarima: number | null
    yoy_lstm: number | null
    yoy_ensemble: number | null
    yoy_ci_hi: number | null
    yoy_ci_lo: number | null
    mtm_actual: number | null
    mtm_ensemble: number | null
    mtm_ci_hi: number | null
    mtm_ci_lo: number | null
    is_forecast: boolean
  }[] = []

  // Historical actuals Jan 2024 – Mei 2026
  const historicalYoY = [
    2.57, 2.75, 3.05, 3.00, 2.84, 2.51, 2.13, 2.12, 1.84, 1.71, 1.55, 1.57, // 2024
    2.21, 2.43, 2.65, 2.81, 2.90, 2.85, 2.70, 2.80, 2.90, 3.00, 3.08, 3.10, // 2025
    3.12, 3.18, 3.25, 3.28, 3.12,                                              // Jan–Mei 2026
  ]
  const historicalMtM = [
    0.41, 0.32, 0.52, 0.33, 0.18, -0.08, 0.21, -0.05, 0.19, 0.22, 0.28, 0.35,
    0.38, 0.31, 0.49, 0.38, 0.22, -0.02, 0.18, -0.03, 0.22, 0.29, 0.32, 0.37,
    0.40, 0.35, 0.48, 0.31, 0.32,
  ]

  for (let i = 0; i < historicalYoY.length; i++) {
    const d = new Date(Date.UTC(2024, i, 1))
    months.push({
      month: fmtMonthShort(d),
      yoy_actual: historicalYoY[i],
      yoy_sarima: null,
      yoy_lstm: null,
      yoy_ensemble: null,
      yoy_ci_hi: null,
      yoy_ci_lo: null,
      mtm_actual: historicalMtM[i],
      mtm_ensemble: null,
      mtm_ci_hi: null,
      mtm_ci_lo: null,
      is_forecast: false,
    })
  }

  // Forecast Jun–Des 2026 (7 bulan)
  const forecastYoY = [3.35, 3.48, 3.62, 3.71, 3.65, 3.58, 3.52]
  const forecastMtM  = [0.38, 0.41, 0.45, 0.39, 0.29, 0.22, 0.18]
  const fcRng = makeRng(20260601)
  for (let i = 0; i < forecastYoY.length; i++) {
    const d = new Date(Date.UTC(2026, 5 + i, 1))
    const spread = 0.12 + i * 0.05
    const mSpread = 0.05 + i * 0.02
    months.push({
      month: fmtMonthShort(d),
      yoy_actual: null,
      yoy_sarima: parseFloat((forecastYoY[i] + (fcRng() - 0.5) * 0.1).toFixed(2)),
      yoy_lstm: parseFloat((forecastYoY[i] + (fcRng() - 0.5) * 0.15).toFixed(2)),
      yoy_ensemble: forecastYoY[i],
      yoy_ci_hi: parseFloat((forecastYoY[i] + spread).toFixed(2)),
      yoy_ci_lo: parseFloat((forecastYoY[i] - spread).toFixed(2)),
      mtm_actual: null,
      mtm_ensemble: forecastMtM[i],
      mtm_ci_hi: parseFloat((forecastMtM[i] + mSpread).toFixed(2)),
      mtm_ci_lo: parseFloat((forecastMtM[i] - mSpread).toFixed(2)),
      is_forecast: true,
    })
  }

  return months
})()

// ─── Commodity Prices ────────────────────────────────────────────────────────
const commodities = [
  { id: 1, name: 'Beras Premium', category: 'Bahan Makanan', unit: 'kg', base: 14800 },
  { id: 2, name: 'Cabai Merah Keriting', category: 'Bahan Makanan', unit: 'kg', base: 55000 },
  { id: 3, name: 'Bawang Merah', category: 'Bahan Makanan', unit: 'kg', base: 38000 },
  { id: 4, name: 'Minyak Goreng Curah', category: 'Bahan Makanan', unit: 'liter', base: 18500 },
  { id: 5, name: 'Daging Sapi Murni', category: 'Bahan Makanan', unit: 'kg', base: 145000 },
  { id: 6, name: 'Telur Ayam Ras', category: 'Bahan Makanan', unit: 'kg', base: 29000 },
  { id: 7, name: 'Gula Pasir Lokal', category: 'Bahan Makanan', unit: 'kg', base: 16500 },
  { id: 8, name: 'Tepung Terigu', category: 'Bahan Makanan', unit: 'kg', base: 13000 },
  { id: 9, name: 'Kedelai Impor', category: 'Bahan Makanan', unit: 'kg', base: 12500 },
  { id: 10, name: 'BBM Pertalite', category: 'Energi', unit: 'liter', base: 10000 },
  { id: 11, name: 'LPG 3 Kg', category: 'Energi', unit: 'tabung', base: 21000 },
]

const priceRng = makeRng(770077)
export const mockCommodityPrices: CommodityPrice[] = commodities.map((c) => {
  const change = (priceRng() - 0.4) * c.base * 0.05
  const price = Math.round(c.base + change)
  return {
    time: NOW.toISOString().slice(0, 10),
    commodity_id: c.id,
    commodity_name: c.name,
    category: c.category,
    market_name: 'Pasar Induk Nasional',
    region_name: 'Nasional',
    price,
    unit: c.unit,
    price_change: Math.round(change),
    price_change_pct: parseFloat(((change / c.base) * 100).toFixed(2)),
  }
})

export function mockCommodityHistory(commodityId: number, days = 30) {
  const c = commodities.find((x) => x.id === commodityId) ?? commodities[0]
  // Seed by commodity+range so the series is identical on every call (server or client).
  const rng = makeRng(commodityId * 7919 + days)
  let price = c.base
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(NOW)
    date.setUTCDate(date.getUTCDate() - (days - 1 - i))
    price = price * (1 + (rng() - 0.48) * 0.02)
    return { time: date.toISOString().slice(0, 10), price: Math.round(price) }
  })
}

// Legacy: keepfor dashboard chart compatibility
export function mockForecastData(days = 14) {
  const historical = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(NOW)
    d.setUTCDate(d.getUTCDate() - (7 - i))
    return { date: d.toISOString().slice(0, 10), actual: 14800 + i * 15, forecast: null, ci_high: null, ci_low: null }
  })
  const forecast = Array.from({ length: days }, (_, i) => {
    const d = new Date(NOW)
    d.setUTCDate(d.getUTCDate() + i + 1)
    const predicted = 14890 + (i + 1) * 30
    return {
      date: d.toISOString().slice(0, 10),
      actual: null,
      forecast: predicted,
      ci_high: predicted + 200 + i * 40,
      ci_low: predicted - 150 - i * 20,
    }
  })
  return [...historical, ...forecast]
}

// ─── Forecast model results (per model, per bulan) ───────────────────────────
export const mockForecastResults: ForecastResult[] = [
  { id: 1, region_id: 0, region_name: 'Nasional', component: 'umum', model: 'SARIMA',   forecast_date: '2026-06-01', run_at: NOW.toISOString(), predicted: 3.33, lower_bound: 3.05, upper_bound: 3.61, mape: 4.2 },
  { id: 2, region_id: 0, region_name: 'Nasional', component: 'umum', model: 'LSTM',     forecast_date: '2026-06-01', run_at: NOW.toISOString(), predicted: 3.38, lower_bound: 3.10, upper_bound: 3.66, mape: 3.8 },
  { id: 3, region_id: 0, region_name: 'Nasional', component: 'umum', model: 'Ensemble', forecast_date: '2026-06-01', run_at: NOW.toISOString(), predicted: 3.35, lower_bound: 3.07, upper_bound: 3.63, mape: 3.5 },
  { id: 4, region_id: 0, region_name: 'Nasional', component: 'volatile', model: 'Ensemble', forecast_date: '2026-06-01', run_at: NOW.toISOString(), predicted: 5.12, lower_bound: 4.20, upper_bound: 6.04, mape: 6.1 },
  { id: 5, region_id: 0, region_name: 'Nasional', component: 'core',    model: 'Ensemble', forecast_date: '2026-06-01', run_at: NOW.toISOString(), predicted: 2.18, lower_bound: 1.95, upper_bound: 2.41, mape: 2.9 },
  { id: 6, region_id: 0, region_name: 'Nasional', component: 'administered', model: 'Ensemble', forecast_date: '2026-06-01', run_at: NOW.toISOString(), predicted: 1.42, lower_bound: 1.10, upper_bound: 1.74, mape: 3.1 },
]

// ─── Sentiment ───────────────────────────────────────────────────────────────
export const mockSentimentSummary = [
  { commodity: 'Beras',   neg: 55, neu: 26, pos: 19, vol: 1840 },
  { commodity: 'Cabai',   neg: 78, neu: 14, pos: 8,  vol: 2130 },
  { commodity: 'Minyak',  neg: 40, neu: 35, pos: 25, vol: 980  },
  { commodity: 'Telur',   neg: 22, neu: 28, pos: 50, vol: 760  },
  { commodity: 'Bawang',  neg: 61, neu: 24, pos: 15, vol: 1250 },
  { commodity: 'Daging',  neg: 48, neu: 30, pos: 22, vol: 890  },
]

const sentRng = makeRng(530530)
export const mockSentimentTimeline = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 4, 1 + i))
  return {
    date: d.toISOString().slice(0, 10),
    negatif: Math.round(40 + Math.sin(i * 0.5) * 15 + sentRng() * 8),
    netral:  Math.round(30 - Math.sin(i * 0.3) *  5 + sentRng() * 5),
    positif: Math.round(25 - Math.sin(i * 0.5) * 10 + sentRng() * 5),
  }
})

export const mockSentimentFeed: SentimentScore[] = [
  { id: 1, time: NOW.toISOString(), source_type: 'news',      commodity_name: 'Beras',        region_name: 'Nasional', text_snippet: 'Harga beras premium naik signifikan di pasar induk akibat musim kemarau yang berkepanjangan...', sentiment: 'negatif', score: -0.82, topic_label: 'kenaikan_harga' },
  { id: 2, time: NOW.toISOString(), source_type: 'twitter',   commodity_name: 'Cabai',        region_name: 'Jawa Timur', text_snippet: 'Cabai merah tembus 80ribu/kg, dapur makin berat nih! Tolong pemerintah turun tangan...', sentiment: 'negatif', score: -0.91, topic_label: 'volatile_food' },
  { id: 3, time: NOW.toISOString(), source_type: 'news',      commodity_name: 'Telur',        region_name: 'Jawa Barat', text_snippet: 'Harga telur ayam stabil, peternak lokal berhasil tingkatkan produksi di tengah cuaca ekstrem...', sentiment: 'positif', score: 0.65, topic_label: 'stabilitas_harga' },
  { id: 4, time: NOW.toISOString(), source_type: 'instagram', commodity_name: 'Minyak Goreng', region_name: 'DKI Jakarta', text_snippet: 'Minyak goreng curah mulai langka di beberapa pasar tradisional Jakarta, harga naik 15%...', sentiment: 'negatif', score: -0.73, topic_label: 'kelangkaan' },
  { id: 5, time: NOW.toISOString(), source_type: 'news',      commodity_name: 'Bawang Merah', region_name: 'Jawa Tengah', text_snippet: 'Operasi pasar TPID berhasil stabilkan harga bawang merah di beberapa kabupaten...', sentiment: 'positif', score: 0.58, topic_label: 'intervensi_pasar' },
]

// ─── EWS Alerts ─────────────────────────────────────────────────────────────
export const mockEWSAlerts: EWSAlert[] = [
  { id: 1, triggered_at: NOW.toISOString(),                                  region_name: 'Jawa Timur',    commodity_name: 'Cabai Merah Keriting', alert_type: '2sigma',          severity: 'high',   actual_value: 80000, threshold: 65000,  message: 'Harga cabai merah melampaui ambang 2-sigma. Tekanan inflasi volatile food tinggi di Jatim.', status: 'open' },
  { id: 2, triggered_at: new Date(NOW.getTime() - 3_600_000).toISOString(),  region_name: 'Papua Barat',   commodity_name: 'Beras Premium',        alert_type: 'forecast_breach', severity: 'high',   actual_value: 15200, threshold: 14800,  message: 'Harga beras melebihi batas atas forecast. Potensi kenaikan IHK kelompok bahan makanan.', status: 'open' },
  { id: 3, triggered_at: new Date(NOW.getTime() - 7_200_000).toISOString(),  region_name: 'Nasional',      commodity_name: 'Bawang Merah',         alert_type: 'sentiment_spike', severity: 'medium', actual_value: -0.85, threshold: -0.70,  message: 'Lonjakan sentimen negatif bawang merah di media sosial nasional. Pantau persediaan.', status: 'acknowledged' },
  { id: 4, triggered_at: new Date(NOW.getTime() - 86_400_000).toISOString(), region_name: 'Kep. Riau',     commodity_name: 'Minyak Goreng Curah',  alert_type: '2sigma',          severity: 'medium', actual_value: 20000, threshold: 18800,  message: 'Harga minyak goreng melebihi threshold normal.', status: 'resolved' },
  { id: 5, triggered_at: new Date(NOW.getTime() - 172_800_000).toISOString(),region_name: 'Papua',         commodity_name: 'Beras Premium',        alert_type: 'forecast_breach', severity: 'high',   actual_value: 18500, threshold: 16000,  message: 'Harga beras Papua jauh di atas forecast. Perlu intervensi distribusi segera.', status: 'open' },
]

// ─── Dashboard Summary ───────────────────────────────────────────────────────
export const mockDashboardSummary: DashboardSummary = {
  current_inflation: 3.12,
  inflation_trend: 0.18,
  active_alerts: 3,
  high_alerts: 2,
  commodities_monitored: 11,
  sentiment_negative_pct: 62,
  last_updated: NOW.toISOString(),
  forecast_7d: 3.28,
  forecast_14d: 3.42,
  forecast_30d: 3.70,
}

// ─── Inflasi Pengeluaran ─────────────────────────────────────────────────────
export const mockGroupInflation = [
  { group: 'Makanan, Minuman, Tembakau',         mtm: 0.54, yoy: 4.21, andil: 1.42 },
  { group: 'Pakaian & Alas Kaki',                mtm: 0.12, yoy: 1.85, andil: 0.08 },
  { group: 'Perumahan, Air, Listrik',             mtm: 0.08, yoy: 1.20, andil: 0.22 },
  { group: 'Perlengkapan Rumah Tangga',           mtm: 0.05, yoy: 0.98, andil: 0.04 },
  { group: 'Kesehatan',                           mtm: 0.22, yoy: 2.15, andil: 0.09 },
  { group: 'Transportasi',                        mtm: -0.15, yoy: 1.42, andil: -0.07 },
  { group: 'Informasi & Komunikasi',              mtm: -0.02, yoy: -0.45, andil: -0.01 },
  { group: 'Rekreasi, Olahraga, Budaya',          mtm: 0.18, yoy: 1.68, andil: 0.05 },
  { group: 'Pendidikan',                          mtm: 0.32, yoy: 3.10, andil: 0.11 },
  { group: 'Penyediaan Makanan & Minuman',        mtm: 0.28, yoy: 2.45, andil: 0.14 },
  { group: 'Perawatan Pribadi & Jasa Lainnya',   mtm: 0.15, yoy: 2.12, andil: 0.07 },
]

// Legacy alias
export const mockRegionalInflation = provinsiNasional.map(p => ({
  region: p.name,
  yoy: p.yoy,
  risk_score: p.risk,
  alerts: p.risk >= 80 ? 2 : p.risk >= 60 ? 1 : 0,
}))
