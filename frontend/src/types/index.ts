export interface InflationData {
  time: string
  region_id: number
  region_name: string
  component: 'umum' | 'volatile' | 'core' | 'administered'
  ihk: number
  mtm: number
  yoy: number
  ytd: number
}

export interface CommodityPrice {
  time: string
  commodity_id: number
  commodity_name: string
  category: string
  market_name: string
  region_name: string
  price: number
  unit: string
  price_change: number
  price_change_pct: number
}

export interface ForecastResult {
  id: number
  region_id: number
  region_name: string
  component: string
  model: 'SARIMA' | 'LSTM' | 'Ensemble'
  forecast_date: string
  run_at: string
  predicted: number
  lower_bound: number
  upper_bound: number
  mape: number
}

export interface SentimentScore {
  id: number
  time: string
  source_type: 'news' | 'twitter' | 'instagram'
  commodity_name: string
  region_name: string
  text_snippet: string
  sentiment: 'positif' | 'netral' | 'negatif'
  score: number
  topic_label: string
}

export interface EWSAlert {
  id: number
  triggered_at: string
  region_name: string
  commodity_name: string
  alert_type: '2sigma' | 'forecast_breach' | 'sentiment_spike'
  severity: 'low' | 'medium' | 'high'
  actual_value: number
  threshold: number
  message: string
  status: 'open' | 'acknowledged' | 'resolved'
}

export interface DashboardSummary {
  current_inflation: number
  inflation_trend: number
  active_alerts: number
  high_alerts: number
  commodities_monitored: number
  sentiment_negative_pct: number
  last_updated: string
  forecast_7d: number
  forecast_14d: number
  forecast_30d: number
}

export interface GroupInflation {
  group: string
  mtm: number
  yoy: number
  andil: number
}

export interface SentimentSummary {
  commodity: string
  neg: number
  neu: number
  pos: number
  vol: number
}

export interface SentimentTimelinePoint {
  date: string
  negatif: number
  netral: number
  positif: number
}

export interface SentimentResponse {
  summary: SentimentSummary[]
  overall: { neg: number; neu: number; pos: number }
}

export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'analyst' | 'tpid' | 'viewer'
  region: string
  last_login: string
}

export interface CommodityForecastBundle {
  commodity_id: number
  chart_data: ForecastChartPoint[]
  history: { date: string; price: number }[]
}

export interface Provinsi {
  code: string
  name: string
  lat: number
  lng: number
  yoy: number
  mtm: number
  risk: number
}

export interface MonthlyForecast {
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
}

export interface ForecastChartPoint {
  date: string
  actual: number | null
  forecast: number | null
  ci_high: number | null
  ci_low: number | null
}

export interface ForecastResponse {
  results: ForecastResult[]
  monthly: MonthlyForecast[]
  chart_data: ForecastChartPoint[]
}
