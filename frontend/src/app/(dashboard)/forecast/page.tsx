'use client'
import { useState } from 'react'
import { mockMonthlyForecast, mockForecastResults } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { ChartFrame } from '@/components/charts/chart-frame'
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine,
} from 'recharts'
import { Info, Calendar, Cpu } from 'lucide-react'

type Metric = 'yoy' | 'mtm'

const MODEL_COLORS = { SARIMA: '#6366f1', LSTM: '#f59e0b', Ensemble: '#ef4444' }

const CustomTooltip = ({ active, payload, label, metric }: {
  active?: boolean; payload?: { name: string; color: string; value: number; dataKey: string }[];
  label?: string; metric: Metric
}) => {
  if (!active || !payload?.length) return null
  const fmt = (v: number) => metric === 'yoy' ? `${v.toFixed(2)}%` : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
  return (
    <div className="rounded-xl border border-gray-200 bg-white/95 backdrop-blur px-3.5 py-2.5 shadow-xl text-xs min-w-[160px]">
      <p className="mb-2 font-semibold text-gray-500 font-mono tracking-wide">{label}</p>
      {payload.filter(p => p.value !== null && p.value !== undefined && !['ci_hi','ci_lo'].includes(p.name)).map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
            <span className="text-gray-600">{p.name}</span>
          </span>
          <span className="font-mono font-bold" style={{ color: p.color }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function ForecastPage() {
  const [metric, setMetric] = useState<Metric>('yoy')
  const [showCI, setShowCI]   = useState(true)
  const [showAll, setShowAll] = useState(false)

  const displayData = showAll ? mockMonthlyForecast : mockMonthlyForecast.slice(-18)
  const lastActual  = mockMonthlyForecast.filter(d => !d.is_forecast).at(-1)
  const yoyLines = metric === 'yoy'
  const forecastMeta = mockForecastResults.filter(r => r.component === 'umum')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Forecasting Inflasi</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Peramalan inflasi bulanan (YoY &amp; MtM) — SARIMA · LSTM · Ensemble · Nasional
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="h-3.5 w-3.5" />
          <span>Diperbarui 1x/bulan · Run terakhir: 1 Jun 2026</span>
        </div>
      </div>

      {/* Model accuracy cards */}
      <div className="grid grid-cols-3 gap-4">
        {forecastMeta.map(r => (
          <div key={r.model} className={`rounded-xl border bg-white p-4 shadow-sm transition-all ${r.model === 'Ensemble' ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: MODEL_COLORS[r.model as keyof typeof MODEL_COLORS] }} />
                <span className="text-xs font-bold text-gray-700">{r.model}</span>
                {r.model === 'Ensemble' && <Badge variant="red" className="text-[9px]">Rekomendasi</Badge>}
              </div>
              <span className="font-mono text-[10px] text-gray-400">MAPE {r.mape}%</span>
            </div>
            <div className="space-y-1.5">
              <div>
                <p className="text-[10px] text-gray-400">Forecast YoY Jun 2026</p>
                <p className="font-mono text-2xl font-bold text-gray-900">{r.predicted.toFixed(2)}<span className="text-sm font-normal text-gray-400">%</span></p>
              </div>
              <div className="text-[10px] text-gray-400 font-mono">
                CI 95%: [{r.lower_bound.toFixed(2)}, {r.upper_bound.toFixed(2)}]
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Komponen disagregasi */}
      <div className="grid grid-cols-4 gap-3">
        {mockForecastResults.map(r => (
          <div key={r.id} className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">{r.component}</p>
            <p className="font-mono text-lg font-bold text-gray-900">{r.predicted.toFixed(2)}<span className="text-xs text-gray-400">%</span></p>
            <div className="mt-1 text-[10px] text-gray-400">
              <span className="text-gray-500 font-medium">YoY Jun 2026</span> · {r.model}
            </div>
          </div>
        ))}
      </div>

      {/* Main chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        {/* Chart controls */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Tren &amp; Proyeksi Inflasi Bulanan</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Aktual historis + forecast Ensemble dengan confidence interval 95%
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* YoY/MtM toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {(['yoy', 'mtm'] as Metric[]).map(m => (
                <button key={m} onClick={() => setMetric(m)}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${metric === m ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
            {/* CI toggle */}
            <button onClick={() => setShowCI(v => !v)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${showCI ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-200 bg-white text-gray-500'}`}>
              CI 95%
            </button>
            {/* Range toggle */}
            <button onClick={() => setShowAll(v => !v)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
              {showAll ? 'Tampil 18 bulan' : 'Tampil semua'}
            </button>
          </div>
        </div>

        {/* ChartFrame defers the chart to the client and only mounts it once the
            box is measured (>0), avoiding both the Recharts width(-1) warning and
            the SSR hydration mismatch (React #425). */}
        <ChartFrame height="18rem">
          {({ width, height }) => (
          <ComposedChart width={width} height={height} data={displayData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#9ca3af' }}
                tickLine={false} axisLine={{ stroke: '#e5e7eb' }}
                interval={showAll ? 2 : 1}
              />
              <YAxis
                tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#9ca3af' }}
                tickLine={false} axisLine={false}
                tickFormatter={v => v.toFixed(1) + '%'}
                domain={yoyLines ? [1.0, 5.5] : [-0.3, 1.2]}
                width={44}
              />
              <Tooltip content={<CustomTooltip metric={metric} />} />

              {/* Forecast region shading */}
              {showCI && yoyLines && (
                <>
                  <Area dataKey="yoy_ci_hi" name="ci_hi" fill="rgba(239,68,68,0.07)" stroke="none" connectNulls={false} />
                  <Area dataKey="yoy_ci_lo" name="ci_lo" fill="rgba(239,68,68,0.07)" stroke="none" connectNulls={false} />
                </>
              )}
              {showCI && !yoyLines && (
                <>
                  <Area dataKey="mtm_ci_hi" name="ci_hi" fill="rgba(239,68,68,0.07)" stroke="none" connectNulls={false} />
                  <Area dataKey="mtm_ci_lo" name="ci_lo" fill="rgba(239,68,68,0.07)" stroke="none" connectNulls={false} />
                </>
              )}

              {/* Forecast divider line */}
              <ReferenceLine x={lastActual?.month} stroke="#d1d5db" strokeDasharray="4 3"
                label={{ value: 'Forecast →', position: 'insideTopRight', fontSize: 9, fill: '#9ca3af', fontFamily: 'Plus Jakarta Sans' }} />

              {/* Actual */}
              {yoyLines
                ? <Line dataKey="yoy_actual" name="Aktual" stroke="#22a05a" strokeWidth={2.5} dot={{ r: 2.5, fill: '#22a05a' }} connectNulls={false} />
                : <Line dataKey="mtm_actual" name="Aktual" stroke="#22a05a" strokeWidth={2.5} dot={{ r: 2.5, fill: '#22a05a' }} connectNulls={false} />
              }

              {/* Model forecasts (YoY only) */}
              {yoyLines && <>
                <Line dataKey="yoy_sarima"   name="SARIMA"   stroke={MODEL_COLORS.SARIMA}   strokeWidth={1.5} strokeDasharray="5 3" dot={{ r: 2 }} connectNulls={false} />
                <Line dataKey="yoy_lstm"     name="LSTM"     stroke={MODEL_COLORS.LSTM}     strokeWidth={1.5} strokeDasharray="5 3" dot={{ r: 2 }} connectNulls={false} />
                <Line dataKey="yoy_ensemble" name="Ensemble" stroke={MODEL_COLORS.Ensemble} strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 3, fill: MODEL_COLORS.Ensemble }} connectNulls={false} />
              </>}
              {!yoyLines && (
                <Line dataKey="mtm_ensemble" name="Ensemble" stroke={MODEL_COLORS.Ensemble} strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 3, fill: MODEL_COLORS.Ensemble }} connectNulls={false} />
              )}

              <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'Plus Jakarta Sans', paddingTop: 12 }}
                formatter={v => <span className="text-gray-600">{v}</span>} />
            </ComposedChart>
          )}
        </ChartFrame>

        {/* Info bar */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-[10px] text-gray-400 border-t border-gray-50 pt-3">
          <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> Ensemble = 40% SARIMA + 60% LSTM</span>
          <span className="flex items-center gap-1"><Info className="h-3 w-3" /> Forecast dijalankan 1× per bulan setelah rilis BPS</span>
          <span className="ml-auto font-mono">{metric === 'yoy' ? `Aktual terkini: ${lastActual?.yoy_actual?.toFixed(2)}% YoY` : `Aktual terkini: +${lastActual?.mtm_actual?.toFixed(2)}% MtM`}</span>
        </div>
      </div>

      {/* Forecast table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Tabel Hasil Peramalan</h2>
          <Badge variant="gray">Cadence: 1× per bulan</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-2.5 font-semibold text-gray-500">Bulan</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-right font-mono">YoY Aktual</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-right font-mono">SARIMA</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-right font-mono">LSTM</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-right font-mono">Ensemble</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-right font-mono">CI 95%</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-right font-mono">MtM Aktual</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-right font-mono">MtM Forecast</th>
              </tr>
            </thead>
            <tbody>
              {mockMonthlyForecast.slice(-12).map((row, i) => (
                <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 ${row.is_forecast ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-700">
                    {row.month}
                    {row.is_forecast && <span className="ml-1.5 text-[9px] text-red-400 font-sans">forecast</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-900">
                    {row.yoy_actual != null ? `${row.yoy_actual.toFixed(2)}%` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-indigo-600">
                    {row.yoy_sarima != null ? `${row.yoy_sarima.toFixed(2)}%` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-amber-600">
                    {row.yoy_lstm != null ? `${row.yoy_lstm.toFixed(2)}%` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-red-600">
                    {row.yoy_ensemble != null ? `${row.yoy_ensemble.toFixed(2)}%` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-gray-400 text-[10px]">
                    {row.yoy_ci_lo != null ? `[${row.yoy_ci_lo.toFixed(2)}, ${row.yoy_ci_hi!.toFixed(2)}]` : '—'}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-semibold ${row.mtm_actual != null ? (row.mtm_actual >= 0 ? 'text-red-500' : 'text-emerald-500') : 'text-gray-300'}`}>
                    {row.mtm_actual != null ? `${row.mtm_actual >= 0 ? '+' : ''}${row.mtm_actual.toFixed(2)}%` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-red-400">
                    {row.mtm_ensemble != null ? `+${row.mtm_ensemble.toFixed(2)}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
