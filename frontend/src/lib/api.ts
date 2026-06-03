import type {
  DashboardSummary, InflationData, GroupInflation, CommodityPrice,
  ForecastResponse, SentimentResponse, SentimentScore, SentimentTimelinePoint,
  EWSAlert, Provinsi, User, CommodityForecastBundle,
} from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

// Caching ownership is intentionally split, with NO overlap:
//   * server route cache  → each route's `dynamic`/`revalidate` export
//   * client cache        → React Query staleTime (see providers.tsx)
// So fetchJSON deliberately does NOT pass Next's `revalidate` (which is ignored
// in the browser and for force-dynamic routes anyway) — that avoids a third,
// contradictory caching layer.
async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
  return res.json()
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
  return res.json()
}

// Typed client over the /api/* route tree. The shapes below MUST stay in sync
// with the route handlers — both sides import the same types from @/types.
export const api = {
  dashboard: {
    summary: () => fetchJSON<DashboardSummary>(`${API_BASE}/api/dashboard`),
  },
  inflation: {
    history: (component?: string) =>
      fetchJSON<InflationData[]>(`${API_BASE}/api/inflation${component ? `?component=${component}` : ''}`),
    groups: () => fetchJSON<GroupInflation[]>(`${API_BASE}/api/inflation/groups`),
  },
  commodities: {
    prices: () => fetchJSON<CommodityPrice[]>(`${API_BASE}/api/commodities`),
  },
  forecast: {
    latest: () => fetchJSON<ForecastResponse>(`${API_BASE}/api/forecast`),
    // Per-commodity forecast bundle also carries the price history series.
    commodity: (id: number) => fetchJSON<CommodityForecastBundle>(`${API_BASE}/api/forecast/commodity/${id}`),
  },
  sentiment: {
    summary: () => fetchJSON<SentimentResponse>(`${API_BASE}/api/sentiment`),
    feed: () => fetchJSON<SentimentScore[]>(`${API_BASE}/api/sentiment/feed`),
    timeline: () => fetchJSON<SentimentTimelinePoint[]>(`${API_BASE}/api/sentiment/timeline`),
  },
  ews: {
    alerts: () => fetchJSON<EWSAlert[]>(`${API_BASE}/api/ews`),
  },
  geospatial: {
    provinces: () => fetchJSON<Provinsi[]>(`${API_BASE}/api/geospatial`),
  },
  users: {
    list: () => fetchJSON<User[]>(`${API_BASE}/api/users`),
  },
  // ML calls go through our own server-side proxy routes, which inject the ML
  // API key. The browser never holds that secret (a NEXT_PUBLIC_* var would).
  ml: {
    runForecast: (params: unknown) => postJSON<unknown>(`${API_BASE}/api/ml/forecast`, params),
    runSentiment: (text: string) => postJSON<unknown>(`${API_BASE}/api/ml/sentiment`, { text }),
  },
}
