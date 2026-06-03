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

export const inflationDataSchema = z.object({
  time: z.string(),
  region_id: z.number(),
  region_name: z.string(),
  component: z.enum(['umum', 'volatile', 'core', 'administered']),
  ihk: z.number(),
  mtm: z.number(),
  yoy: z.number(),
  ytd: z.number(),
})

export const groupInflationSchema = z.object({
  group: z.string(),
  mtm: z.number(),
  yoy: z.number(),
  andil: z.number(),
})

export const forecastResultSchema = z.object({
  id: z.number(),
  region_id: z.number(),
  region_name: z.string(),
  component: z.string(),
  model: z.enum(['SARIMA', 'LSTM', 'Ensemble']),
  forecast_date: z.string(),
  run_at: z.string(),
  predicted: z.number(),
  lower_bound: z.number(),
  upper_bound: z.number(),
  mape: z.number(),
})

export const forecastChartPointSchema = z.object({
  date: z.string(),
  actual: z.number().nullable(),
  forecast: z.number().nullable(),
  ci_high: z.number().nullable(),
  ci_low: z.number().nullable(),
})

export const monthlyForecastSchema = z.object({
  month: z.string(),
  yoy_actual: z.number().nullable(),
  yoy_sarima: z.number().nullable(),
  yoy_lstm: z.number().nullable(),
  yoy_ensemble: z.number().nullable(),
  yoy_ci_hi: z.number().nullable(),
  yoy_ci_lo: z.number().nullable(),
  mtm_actual: z.number().nullable(),
  mtm_ensemble: z.number().nullable(),
  mtm_ci_hi: z.number().nullable(),
  mtm_ci_lo: z.number().nullable(),
  is_forecast: z.boolean(),
})

export const forecastResponseSchema = z.object({
  results: z.array(forecastResultSchema),
  monthly: z.array(monthlyForecastSchema),
  chart_data: z.array(forecastChartPointSchema),
})

export const sentimentSummarySchema = z.object({
  commodity: z.string(),
  neg: z.number(),
  neu: z.number(),
  pos: z.number(),
  vol: z.number(),
})

export const sentimentScoreSchema = z.object({
  id: z.number(),
  time: z.string(),
  source_type: z.enum(['news', 'twitter', 'instagram']),
  commodity_name: z.string(),
  region_name: z.string(),
  text_snippet: z.string(),
  sentiment: z.enum(['positif', 'netral', 'negatif']),
  score: z.number(),
  topic_label: z.string(),
})

export const sentimentTimelinePointSchema = z.object({
  date: z.string(),
  negatif: z.number(),
  netral: z.number(),
  positif: z.number(),
})

export const commodityPriceListSchema = z.array(commodityPriceSchema)
export const ewsAlertListSchema = z.array(ewsAlertSchema)
export const inflationDataListSchema = z.array(inflationDataSchema)
export const groupInflationListSchema = z.array(groupInflationSchema)
export const sentimentSummaryListSchema = z.array(sentimentSummarySchema)
export const sentimentScoreListSchema = z.array(sentimentScoreSchema)
export const sentimentTimelineListSchema = z.array(sentimentTimelinePointSchema)
