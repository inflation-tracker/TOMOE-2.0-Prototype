import { z } from 'zod'

// Runtime schemas for data crossing a trust boundary (DB rows, ML service).
// These catch shape drift at the source instead of letting `any`-shaped data
// flow into the UI and blow up far from the cause.

export const commodityPriceSchema = z.object({
  time: z.string(),
  commodity_id: z.number(),
  commodity_name: z.string(),
  category: z.string(),
  market_name: z.string(),
  region_name: z.string(),
  price: z.number(),
  unit: z.string(),
  price_change: z.number(),
  price_change_pct: z.number(),
})

export const ewsAlertSchema = z.object({
  id: z.number(),
  triggered_at: z.string(),
  region_name: z.string(),
  commodity_name: z.string(),
  alert_type: z.enum(['2sigma', 'forecast_breach', 'sentiment_spike']),
  severity: z.enum(['low', 'medium', 'high']),
  actual_value: z.number(),
  threshold: z.number(),
  message: z.string(),
  status: z.enum(['open', 'acknowledged', 'resolved']),
})

export const dashboardSummarySchema = z.object({
  current_inflation: z.number(),
  inflation_trend: z.number(),
  active_alerts: z.number(),
  high_alerts: z.number(),
  commodities_monitored: z.number(),
  sentiment_negative_pct: z.number(),
  last_updated: z.string(),
  forecast_7d: z.number(),
  forecast_14d: z.number(),
  forecast_30d: z.number(),
})

export const commodityPriceListSchema = z.array(commodityPriceSchema)
export const ewsAlertListSchema = z.array(ewsAlertSchema)
