import 'server-only'
import { getPool } from './db'
import { mockCommodityPrices, mockEWSAlerts, mockDashboardSummary } from './mock-data'
import { commodityPriceListSchema, ewsAlertListSchema } from './schemas'
import type { CommodityPrice, EWSAlert, DashboardSummary } from '@/types'

// pg returns DECIMAL/NUMERIC as strings — coerce safely.
const num = (v: unknown): number => (v == null ? 0 : Number(v))

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
