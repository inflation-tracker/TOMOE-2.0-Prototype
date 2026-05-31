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
