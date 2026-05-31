const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''
const ML_BASE = process.env.NEXT_PUBLIC_ML_URL ?? 'http://localhost:8000'

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
  return res.json()
}

export const api = {
  dashboard: {
    summary: () => fetchJSON<unknown>(`${API_BASE}/api/dashboard`),
  },
  inflation: {
    history: (component?: string) =>
      fetchJSON<unknown>(`${API_BASE}/api/inflation${component ? `?component=${component}` : ''}`),
    groups: () => fetchJSON<unknown>(`${API_BASE}/api/inflation/groups`),
  },
  commodities: {
    prices: () => fetchJSON<unknown>(`${API_BASE}/api/commodities`),
    history: (id: number) => fetchJSON<unknown>(`${API_BASE}/api/commodities/${id}/history`),
  },
  forecast: {
    latest: () => fetchJSON<unknown>(`${API_BASE}/api/forecast`),
    commodity: (id: number) => fetchJSON<unknown>(`${API_BASE}/api/forecast/commodity/${id}`),
  },
  sentiment: {
    summary: () => fetchJSON<unknown>(`${API_BASE}/api/sentiment`),
    feed: () => fetchJSON<unknown>(`${API_BASE}/api/sentiment/feed`),
    timeline: () => fetchJSON<unknown>(`${API_BASE}/api/sentiment/timeline`),
  },
  ews: {
    alerts: () => fetchJSON<unknown>(`${API_BASE}/api/ews`),
    timeline: () => fetchJSON<unknown>(`${API_BASE}/api/ews/timeline`),
  },
  ml: {
    runForecast: (params: unknown) =>
      fetch(`${ML_BASE}/forecast/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) }).then((r) => r.json()),
    runSentiment: (text: string) =>
      fetch(`${ML_BASE}/sentiment/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }).then((r) => r.json()),
  },
}
