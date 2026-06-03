import dynamic from 'next/dynamic'
import { mockMonthlyForecast } from '@/lib/mock-data'
import { getDashboardSummary, getEWSAlerts } from '@/lib/queries'
import { KPICard } from '@/components/ui/kpi-card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Activity, MessageSquare, Calendar, ArrowRight, TrendingUp, Zap } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

const ForecastChart  = dynamic(() => import('@/components/charts/forecast-chart').then(m => m.ForecastChart),  { ssr: false })
const SentimentDonut = dynamic(() => import('@/components/charts/sentiment-donut').then(m => m.SentimentDonut), { ssr: false })

export const metadata = { title: 'Dashboard — TOMOE 2.0' }

export default async function DashboardPage() {
  // Single live source (DB + mock fallback) — same path as Early Warning &
  // /api/dashboard, so KPI counters and the alert banner can't drift apart.
  const [s, allAlerts] = await Promise.all([getDashboardSummary(), getEWSAlerts()])
  const alerts = allAlerts.filter(a => a.status === 'open')
  const highAlerts = alerts.filter(a => a.severity === 'high')

  // Build forecast chart data from monthly forecast
  const chartSlice = mockMonthlyForecast.slice(-12)
  const forecastData = chartSlice.map(d => ({
    date: d.month,
    actual:    d.yoy_actual,
    forecast:  d.yoy_ensemble,
    ci_high:   d.yoy_ci_hi,
    ci_low:    d.yoy_ci_lo,
  }))

  const nextForecast = mockMonthlyForecast.find(d => d.is_forecast)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Selamat Datang, Tim TOMOE 👋</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Monitor pergerakan harga &amp; inflasi nasional secara real-time — data BPS &amp; PIHPS BI.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500 shadow-sm">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(s.last_updated)}</span>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors">
            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
            Export
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {highAlerts.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-sm">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">
              {highAlerts.length} peringatan kritis aktif
            </p>
            <p className="mt-0.5 text-xs text-red-600 truncate">{highAlerts[0].message}</p>
          </div>
          <Link href="/early-warning"
            className="shrink-0 flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors">
            Detail <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard
          title="Inflasi YoY"
          value={`${s.current_inflation.toFixed(2)}%`}
          sub="Nasional · Mei 2026"
          trend={s.inflation_trend}
          icon={<Activity className="h-7 w-7" />}
          accent="red"
        />
        <KPICard
          title="Forecast Jun 2026"
          value={`${nextForecast?.yoy_ensemble?.toFixed(2) ?? '—'}%`}
          sub="Ensemble · CI [3.07, 3.63]"
          icon={<TrendingUp className="h-7 w-7" />}
          accent="amber"
        />
        <KPICard
          title="Alert Aktif"
          value={s.active_alerts}
          sub={`${s.high_alerts} kritis · ${s.active_alerts - s.high_alerts} sedang`}
          icon={<Zap className="h-7 w-7" />}
          accent={s.high_alerts > 0 ? 'red' : 'amber'}
        />
        <KPICard
          title="Sentimen Negatif"
          value={`${s.sentiment_negative_pct}%`}
          sub="IndoBERT · 30 hari terakhir"
          icon={<MessageSquare className="h-7 w-7" />}
          accent={s.sentiment_negative_pct > 60 ? 'red' : 'amber'}
        />
      </div>

      {/* Main content row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Forecast chart — 2 cols */}
        <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.06)]">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Proyeksi Inflasi YoY — Ensemble</h2>
              <p className="text-xs text-gray-400 mt-0.5">Aktual historis + forecast bulanan · Nasional</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full bg-emerald-500 inline-block" />
                Aktual
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full bg-red-400 inline-block border-t-2 border-dashed border-red-400 bg-transparent" />
                Forecast
              </span>
            </div>
          </div>
          <div className="h-[210px]">
            <ForecastChart data={forecastData} />
          </div>
          <div className="mt-3 flex items-center gap-4 border-t border-gray-50 pt-3 text-[10px] text-gray-400">
            <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-red-100 inline-block" /> CI 95%</span>
            <span>Forecast dijalankan 1× per bulan setelah rilis BPS</span>
            <Link href="/forecast" className="ml-auto flex items-center gap-1 text-red-500 font-semibold hover:text-red-700">
              Detail forecast <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Right col: target + sentiment */}
        <div className="flex flex-col gap-4">
          {/* Forecast targets */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.06)]">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Proyeksi Bulanan</h2>
            {[
              { label: 'Jun 2026', value: nextForecast?.yoy_ensemble ?? s.forecast_7d,  ci: `[${nextForecast?.yoy_ci_lo?.toFixed(2)}, ${nextForecast?.yoy_ci_hi?.toFixed(2)}]` },
              { label: 'Jul 2026', value: mockMonthlyForecast.filter(d=>d.is_forecast)[1]?.yoy_ensemble ?? s.forecast_14d, ci: null },
              { label: 'Agt 2026', value: mockMonthlyForecast.filter(d=>d.is_forecast)[2]?.yoy_ensemble ?? s.forecast_30d, ci: null },
            ].map((f, i) => (
              <div key={f.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <span className="text-xs font-medium text-gray-700">{f.label}</span>
                  {f.ci && <p className="text-[9px] text-gray-400 font-mono">{f.ci}</p>}
                </div>
                <span className={`font-mono text-sm font-bold ${i === 0 ? 'text-red-600' : i === 1 ? 'text-orange-500' : 'text-amber-500'}`}>
                  {(f.value ?? 0).toFixed(2)}%
                </span>
              </div>
            ))}
            <p className="mt-2 text-[9px] text-gray-400">MAPE Ensemble: 3.5% · YoY nasional</p>
          </div>

          {/* Sentiment donut */}
          <div className="flex-1 rounded-xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.06)]">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Sentimen Publik</h2>
              <span className="text-[10px] text-gray-400">30 hari</span>
            </div>
            <p className="text-[10px] text-gray-400 mb-2">IndoBERT — media sosial &amp; berita</p>
            <SentimentDonut neg={62} neu={25} pos={13} size={140} />
          </div>
        </div>
      </div>

      {/* Active alerts */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900">Alert Aktif</h2>
            <span className="rounded-full bg-red-500 px-1.5 py-px text-[10px] font-bold text-white">{alerts.length}</span>
          </div>
          <Link href="/early-warning" className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors">
            Lihat semua <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {alerts.slice(0, 3).map(alert => (
            <div key={alert.id} className={`flex items-start gap-3 border-l-4 px-4 py-3 transition-colors hover:bg-gray-50/60 ${
              alert.severity === 'high' ? 'border-l-red-400' : 'border-l-amber-400'
            }`}>
              <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                alert.severity === 'high' ? 'bg-red-100' : 'bg-amber-100'
              }`}>
                <AlertTriangle className={`h-3.5 w-3.5 ${alert.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-gray-800">{alert.commodity_name}</span>
                  <Badge variant={alert.severity === 'high' ? 'red' : 'amber'}>{alert.severity}</Badge>
                  <span className="text-[10px] text-gray-400 truncate">{alert.region_name}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
