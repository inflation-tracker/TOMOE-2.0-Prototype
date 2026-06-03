import 'server-only'
import { getPool } from './db'
import {
  mockCommodityPrices,
  mockEWSAlerts,
  mockDashboardSummary,
  mockInflationHistory,
  mockGroupInflation,
  mockForecastResults,
  mockForecastData,
  mockMonthlyForecast,
  mockSentimentSummary,
  mockSentimentFeed,
  mockSentimentTimeline,
} from './mock-data'
import {
  commodityPriceListSchema,
  ewsAlertListSchema,
  forecastResponseSchema,
  groupInflationListSchema,
  inflationDataListSchema,
  sentimentScoreListSchema,
  sentimentSummaryListSchema,
  sentimentTimelineListSchema,
} from './schemas'
import type {
  CommodityPrice,
  EWSAlert,
  DashboardSummary,
  ForecastChartPoint,
  ForecastResponse,
  GroupInflation,
  InflationData,
  MonthlyForecast,
  SentimentResponse,
  SentimentScore,
  SentimentTimelinePoint,
} from '@/types'

// pg returns DECIMAL/NUMERIC as strings — coerce safely.
const num = (v: unknown): number => (v == null ? 0 : Number(v))
const isoDate = (v: unknown): string => new Date(v as string | number | Date).toISOString().slice(0, 10)
const isoTime = (v: unknown): string => new Date(v as string | number | Date).toISOString()
const ID_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const monthLabel = (v: unknown): string => {
  const d = new Date(v as string | number | Date)
  return `${ID_MONTHS_SHORT[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(-2)}`
}

/**
 * Latest price per commodity from the TimescaleDB hypertable, joined to its
 * commodity / market / region. Falls back to mock data if the DB is
 * unreachable or empty, so the dashboard never breaks during a demo.
 */
export async function getCommodityPrices(): Promise<CommodityPrice[]> {
  const pool = getPool()
  if (!pool) return mockCommodityPrices
  try {
    // Bound the scan to the recent window so this stays fast as the hypertable
    // grows (without a time filter, DISTINCT ON scans all history). The
    // market_id tie-break makes "latest price per commodity" deterministic
    // instead of picking an arbitrary market on equal timestamps.
    const { rows } = await pool.query(`
      SELECT DISTINCT ON (cp.commodity_id)
        cp.time, cp.commodity_id,
        c.name AS commodity_name, COALESCE(c.category, '') AS category, COALESCE(c.unit, '') AS unit,
        COALESCE(m.name, 'Pasar Induk') AS market_name,
        COALESCE(r.name, 'Nasional') AS region_name,
        cp.price, cp.price_change
      FROM commodity_prices cp
      JOIN commodities c ON c.id = cp.commodity_id
      LEFT JOIN markets m ON m.id = cp.market_id
      LEFT JOIN regions r ON r.id = m.region_id
      WHERE cp.time > now() - INTERVAL '90 days'
      ORDER BY cp.commodity_id, cp.time DESC, cp.market_id
    `)
    if (rows.length === 0) return mockCommodityPrices
    const mapped = rows.map((r): CommodityPrice => {
      const price = num(r.price)
      const change = num(r.price_change)
      const prev = price - change
      return {
        time: new Date(r.time).toISOString().slice(0, 10),
        commodity_id: Number(r.commodity_id),
        commodity_name: r.commodity_name,
        category: r.category,
        market_name: r.market_name,
        region_name: r.region_name,
        price,
        unit: r.unit,
        price_change: change,
        price_change_pct: prev > 0 ? Number(((change / prev) * 100).toFixed(2)) : 0,
      }
    })
    // Validate the shape at the trust boundary; fall back to mock on drift.
    const parsed = commodityPriceListSchema.safeParse(mapped)
    if (!parsed.success) {
      console.error('[queries] getCommodityPrices shape drift:', parsed.error.issues)
      return mockCommodityPrices
    }
    return parsed.data
  } catch (err) {
    console.error('[queries] getCommodityPrices fell back to mock:', err)
    return mockCommodityPrices
  }
}

/** EWS alerts joined to region + commodity, newest first. Falls back to mock. */
export async function getEWSAlerts(): Promise<EWSAlert[]> {
  const pool = getPool()
  if (!pool) return mockEWSAlerts
  try {
    const { rows } = await pool.query(`
      SELECT e.id, e.triggered_at,
        r.name AS region_name, c.name AS commodity_name,
        e.alert_type, e.severity, e.actual_value, e.threshold, e.message, e.status
      FROM ews_alerts e
      JOIN commodities c ON c.id = e.commodity_id
      JOIN regions r ON r.id = e.region_id
      ORDER BY e.triggered_at DESC
    `)
    if (rows.length === 0) return mockEWSAlerts
    const mapped = rows.map((r): EWSAlert => ({
      id: Number(r.id),
      triggered_at: new Date(r.triggered_at).toISOString(),
      region_name: r.region_name,
      commodity_name: r.commodity_name,
      alert_type: r.alert_type,
      severity: r.severity,
      actual_value: num(r.actual_value),
      threshold: num(r.threshold),
      message: r.message ?? '',
      status: r.status,
    }))
    const parsed = ewsAlertListSchema.safeParse(mapped)
    if (!parsed.success) {
      console.error('[queries] getEWSAlerts shape drift:', parsed.error.issues)
      return mockEWSAlerts
    }
    return parsed.data
  } catch (err) {
    console.error('[queries] getEWSAlerts fell back to mock:', err)
    return mockEWSAlerts
  }
}

/**
 * Dashboard summary. The headline scalars (inflation, sentiment) stay on the
 * mock baseline until their BPS/IndoBERT queries land, but the alert and
 * commodity counters are DERIVED from the same live sources the rest of the UI
 * uses — so the KPI cards never drift from the Early-Warning list / commodity
 * table. Single source of truth for both the page and /api/dashboard.
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [alerts, prices] = await Promise.all([getEWSAlerts(), getCommodityPrices()])
  const open = alerts.filter((a) => a.status === 'open')
  const high = open.filter((a) => a.severity === 'high')
  return {
    ...mockDashboardSummary,
    active_alerts: open.length,
    high_alerts: high.length,
    commodities_monitored: prices.length,
    last_updated: new Date().toISOString(),
  }
}

export async function getInflationHistory(component?: string | null): Promise<InflationData[]> {
  const pool = getPool()
  const fallback = component
    ? mockInflationHistory.filter((d) => d.component === component)
    : mockInflationHistory
  if (!pool) return fallback
  try {
    const params: string[] = []
    const where = component ? 'WHERE ii.component = $1' : ''
    if (component) params.push(component)
    const { rows } = await pool.query(`
      SELECT ii.time, ii.region_id, COALESCE(r.name, 'Nasional') AS region_name,
        ii.component, ii.ihk, ii.mtm, ii.yoy, ii.ytd
      FROM inflation_index ii
      JOIN regions r ON r.id = ii.region_id
      ${where}
      ORDER BY ii.time ASC, ii.component
    `, params)
    if (rows.length === 0) return fallback
    const mapped = rows.map((r): InflationData => ({
      time: isoDate(r.time),
      region_id: Number(r.region_id),
      region_name: r.region_name,
      component: r.component,
      ihk: num(r.ihk),
      mtm: num(r.mtm),
      yoy: num(r.yoy),
      ytd: num(r.ytd),
    }))
    const parsed = inflationDataListSchema.safeParse(mapped)
    if (!parsed.success) {
      console.error('[queries] getInflationHistory shape drift:', parsed.error.issues)
      return fallback
    }
    return parsed.data
  } catch (err) {
    console.error('[queries] getInflationHistory fell back to mock:', err)
    return fallback
  }
}

export async function getGroupInflation(): Promise<GroupInflation[]> {
  const pool = getPool()
  if (!pool) return mockGroupInflation
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT ON (group_name)
        group_name, mtm, yoy, andil_mtm
      FROM inflation_by_group
      ORDER BY group_name, time DESC
    `)
    if (rows.length === 0) return mockGroupInflation
    const mapped = rows.map((r): GroupInflation => ({
      group: r.group_name,
      mtm: num(r.mtm),
      yoy: num(r.yoy),
      andil: num(r.andil_mtm),
    }))
    const parsed = groupInflationListSchema.safeParse(mapped)
    if (!parsed.success) {
      console.error('[queries] getGroupInflation shape drift:', parsed.error.issues)
      return mockGroupInflation
    }
    return parsed.data
  } catch (err) {
    console.error('[queries] getGroupInflation fell back to mock:', err)
    return mockGroupInflation
  }
}

export async function getForecastResponse(): Promise<ForecastResponse> {
  const pool = getPool()
  const fallback: ForecastResponse = {
    results: mockForecastResults,
    monthly: mockMonthlyForecast,
    chart_data: mockForecastData(14),
  }
  if (!pool) return fallback
  try {
    const [{ rows: resultRows }, { rows: inflationRows }, { rows: forecastRows }] = await Promise.all([
      pool.query(`
        SELECT f.id, f.region_id, COALESCE(r.name, 'Nasional') AS region_name,
          COALESCE(f.component, c.name, '') AS component,
          f.model, f.forecast_date, f.run_at,
          f.predicted, f.lower_bound, f.upper_bound, f.mape
        FROM forecasts f
        LEFT JOIN regions r ON r.id = f.region_id
        LEFT JOIN commodities c ON c.id = f.commodity_id
        ORDER BY f.forecast_date ASC, f.model
      `),
      pool.query(`
        SELECT ii.time, ii.yoy, ii.mtm
        FROM inflation_index ii
        WHERE ii.component = 'umum'
        ORDER BY ii.time ASC
      `),
      pool.query(`
        SELECT f.forecast_date, f.model, f.predicted, f.lower_bound, f.upper_bound
        FROM forecasts f
        WHERE f.commodity_id IS NULL AND f.component = 'umum'
        ORDER BY f.forecast_date ASC, f.model
      `),
    ])
    if (resultRows.length === 0 && inflationRows.length === 0) return fallback

    const results = resultRows.map((r): ForecastResponse['results'][number] => ({
      id: Number(r.id),
      region_id: Number(r.region_id),
      region_name: r.region_name,
      component: r.component,
      model: r.model,
      forecast_date: isoDate(r.forecast_date),
      run_at: isoTime(r.run_at),
      predicted: num(r.predicted),
      lower_bound: num(r.lower_bound),
      upper_bound: num(r.upper_bound),
      mape: num(r.mape),
    }))

    const byMonth = new Map<string, MonthlyForecast>()
    for (const r of inflationRows) {
      const key = isoDate(r.time)
      byMonth.set(key, {
        month: monthLabel(r.time),
        yoy_actual: num(r.yoy),
        yoy_sarima: null,
        yoy_lstm: null,
        yoy_ensemble: null,
        yoy_ci_hi: null,
        yoy_ci_lo: null,
        mtm_actual: num(r.mtm),
        mtm_ensemble: null,
        mtm_ci_hi: null,
        mtm_ci_lo: null,
        is_forecast: false,
      })
    }
    for (const r of forecastRows) {
      const key = isoDate(r.forecast_date)
      const existing = byMonth.get(key) ?? {
        month: monthLabel(r.forecast_date),
        yoy_actual: null,
        yoy_sarima: null,
        yoy_lstm: null,
        yoy_ensemble: null,
        yoy_ci_hi: null,
        yoy_ci_lo: null,
        mtm_actual: null,
        mtm_ensemble: null,
        mtm_ci_hi: null,
        mtm_ci_lo: null,
        is_forecast: true,
      }
      if (r.model === 'SARIMA') existing.yoy_sarima = num(r.predicted)
      if (r.model === 'LSTM') existing.yoy_lstm = num(r.predicted)
      if (r.model === 'Ensemble') {
        existing.yoy_ensemble = num(r.predicted)
        existing.yoy_ci_hi = num(r.upper_bound)
        existing.yoy_ci_lo = num(r.lower_bound)
      }
      existing.is_forecast = existing.yoy_actual == null
      byMonth.set(key, existing)
    }
    const monthly = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value)

    const chart_data: ForecastChartPoint[] = [
      ...inflationRows.slice(-12).map((r): ForecastChartPoint => ({
        date: monthLabel(r.time),
        actual: num(r.yoy),
        forecast: null,
        ci_high: null,
        ci_low: null,
      })),
      ...forecastRows
        .filter((r) => r.model === 'Ensemble')
        .map((r): ForecastChartPoint => ({
          date: monthLabel(r.forecast_date),
          actual: null,
          forecast: num(r.predicted),
          ci_high: num(r.upper_bound),
          ci_low: num(r.lower_bound),
        })),
    ]
    const body: ForecastResponse = { results, monthly, chart_data }
    const parsed = forecastResponseSchema.safeParse(body)
    if (!parsed.success) {
      console.error('[queries] getForecastResponse shape drift:', parsed.error.issues)
      return fallback
    }
    return parsed.data
  } catch (err) {
    console.error('[queries] getForecastResponse fell back to mock:', err)
    return fallback
  }
}

export async function getSentimentFeed(): Promise<SentimentScore[]> {
  const pool = getPool()
  if (!pool) return mockSentimentFeed
  try {
    const { rows } = await pool.query(`
      SELECT s.id, s.time, s.source_type,
        COALESCE(c.name, 'Umum') AS commodity_name,
        COALESCE(r.name, 'Nasional') AS region_name,
        COALESCE(s.text_snippet, '') AS text_snippet,
        s.sentiment, s.score,
        COALESCE(t.label, 'umum') AS topic_label
      FROM sentiment_scores s
      LEFT JOIN commodities c ON c.id = s.commodity_id
      LEFT JOIN regions r ON r.id = s.region_id
      LEFT JOIN topics t ON t.id = s.topic_id
      ORDER BY s.time DESC
      LIMIT 100
    `)
    if (rows.length === 0) return mockSentimentFeed
    const mapped = rows.map((r): SentimentScore => ({
      id: Number(r.id),
      time: isoTime(r.time),
      source_type: r.source_type,
      commodity_name: r.commodity_name,
      region_name: r.region_name,
      text_snippet: r.text_snippet,
      sentiment: r.sentiment,
      score: num(r.score),
      topic_label: r.topic_label,
    }))
    const parsed = sentimentScoreListSchema.safeParse(mapped)
    if (!parsed.success) {
      console.error('[queries] getSentimentFeed shape drift:', parsed.error.issues)
      return mockSentimentFeed
    }
    return parsed.data
  } catch (err) {
    console.error('[queries] getSentimentFeed fell back to mock:', err)
    return mockSentimentFeed
  }
}

export async function getSentimentSummary(): Promise<SentimentResponse> {
  const pool = getPool()
  const fallback: SentimentResponse = {
    summary: mockSentimentSummary,
    overall: { neg: 62, neu: 25, pos: 13 },
  }
  if (!pool) return fallback
  try {
    const { rows } = await pool.query(`
      SELECT COALESCE(c.name, 'Umum') AS commodity,
        COUNT(*)::INT AS vol,
        COUNT(*) FILTER (WHERE s.sentiment = 'negatif')::INT AS neg_count,
        COUNT(*) FILTER (WHERE s.sentiment = 'netral')::INT AS neu_count,
        COUNT(*) FILTER (WHERE s.sentiment = 'positif')::INT AS pos_count
      FROM sentiment_scores s
      LEFT JOIN commodities c ON c.id = s.commodity_id
      WHERE s.time > now() - INTERVAL '30 days'
      GROUP BY COALESCE(c.name, 'Umum')
      ORDER BY vol DESC
    `)
    if (rows.length === 0) return fallback
    const summary = rows.map((r) => {
      const vol = Number(r.vol)
      return {
        commodity: r.commodity,
        neg: vol > 0 ? Math.round((Number(r.neg_count) / vol) * 100) : 0,
        neu: vol > 0 ? Math.round((Number(r.neu_count) / vol) * 100) : 0,
        pos: vol > 0 ? Math.round((Number(r.pos_count) / vol) * 100) : 0,
        vol,
      }
    })
    const totals = summary.reduce(
      (acc, row) => ({
        neg: acc.neg + row.neg * row.vol,
        neu: acc.neu + row.neu * row.vol,
        pos: acc.pos + row.pos * row.vol,
        vol: acc.vol + row.vol,
      }),
      { neg: 0, neu: 0, pos: 0, vol: 0 },
    )
    const body: SentimentResponse = {
      summary,
      overall: totals.vol > 0
        ? {
            neg: Math.round(totals.neg / totals.vol),
            neu: Math.round(totals.neu / totals.vol),
            pos: Math.round(totals.pos / totals.vol),
          }
        : fallback.overall,
    }
    const parsed = sentimentSummaryListSchema.safeParse(body.summary)
    if (!parsed.success) {
      console.error('[queries] getSentimentSummary shape drift:', parsed.error.issues)
      return fallback
    }
    return body
  } catch (err) {
    console.error('[queries] getSentimentSummary fell back to mock:', err)
    return fallback
  }
}

export async function getSentimentTimeline(): Promise<SentimentTimelinePoint[]> {
  const pool = getPool()
  if (!pool) return mockSentimentTimeline
  try {
    const { rows } = await pool.query(`
      SELECT date_trunc('day', time)::DATE AS date,
        COUNT(*) FILTER (WHERE sentiment = 'negatif')::INT AS negatif,
        COUNT(*) FILTER (WHERE sentiment = 'netral')::INT AS netral,
        COUNT(*) FILTER (WHERE sentiment = 'positif')::INT AS positif
      FROM sentiment_scores
      WHERE time > now() - INTERVAL '30 days'
      GROUP BY date
      ORDER BY date ASC
    `)
    if (rows.length === 0) return mockSentimentTimeline
    const mapped = rows.map((r): SentimentTimelinePoint => ({
      date: isoDate(r.date),
      negatif: Number(r.negatif),
      netral: Number(r.netral),
      positif: Number(r.positif),
    }))
    const parsed = sentimentTimelineListSchema.safeParse(mapped)
    if (!parsed.success) {
      console.error('[queries] getSentimentTimeline shape drift:', parsed.error.issues)
      return mockSentimentTimeline
    }
    return parsed.data
  } catch (err) {
    console.error('[queries] getSentimentTimeline fell back to mock:', err)
    return mockSentimentTimeline
  }
}
