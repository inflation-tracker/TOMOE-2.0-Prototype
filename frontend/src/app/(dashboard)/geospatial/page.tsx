'use client'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { provinsiNasional } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, MapPin } from 'lucide-react'

// Leaflet must be dynamically imported (no SSR)
const IndonesiaMap = dynamic(
  () => import('@/components/charts/indonesia-map').then(m => m.IndonesiaMap),
  { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-xl text-xs text-gray-400">Memuat peta…</div> }
)

type Province = typeof provinsiNasional[number]

function riskBadge(risk: number) {
  if (risk >= 80) return <Badge variant="red">Tinggi</Badge>
  if (risk >= 65) return <Badge variant="amber">Sedang-Tinggi</Badge>
  if (risk >= 50) return <Badge variant="amber">Sedang</Badge>
  return <Badge variant="green">Rendah</Badge>
}

function riskDot(risk: number) {
  if (risk >= 80) return 'bg-red-400'
  if (risk >= 65) return 'bg-orange-400'
  if (risk >= 50) return 'bg-amber-400'
  return 'bg-emerald-400'
}

export default function GeospatialPage() {
  const [selected, setSelected] = useState<Province | null>(null)
  const [sortBy, setSortBy]     = useState<'risk' | 'yoy' | 'mtm'>('risk')

  const sorted = [...provinsiNasional].sort((a, b) => b[sortBy] - a[sortBy])
  const top5   = sorted.slice(0, 5)

  const high   = provinsiNasional.filter(p => p.risk >= 80).length
  const medium = provinsiNasional.filter(p => p.risk >= 50 && p.risk < 80).length
  const low    = provinsiNasional.filter(p => p.risk < 50).length
  const avgYoY = (provinsiNasional.reduce((s, p) => s + p.yoy, 0) / provinsiNasional.length).toFixed(2)

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Peta Risiko Inflasi</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Distribusi tekanan inflasi 34 provinsi se-Indonesia — data nasional BPS + PIHPS
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /> ≥80 Tinggi</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-400" /> 65–79 Sedang-Tinggi</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> 50–64 Sedang</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> &lt;50 Rendah</span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Rata-Rata YoY Nasional', value: `${avgYoY}%`, sub: 'Mei 2026', color: 'text-red-600' },
          { label: 'Provinsi Risiko Tinggi',   value: high,         sub: '≥80 risk score',  color: 'text-red-600' },
          { label: 'Risiko Sedang',            value: medium,       sub: '50–79 risk score', color: 'text-amber-600' },
          { label: 'Risiko Rendah',            value: low,          sub: '<50 risk score',  color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-gray-400">{s.label}</p>
            <p className={`mt-1 font-mono text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Map + sidebar */}
      <div className="flex gap-4 flex-1 min-h-0" style={{ height: 480 }}>
        {/* Map */}
        <div className="flex-1 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden" style={{ minHeight: 420 }}>
          <IndonesiaMap
            data={provinsiNasional}
            onSelect={setSelected}
            selected={selected?.code ?? null}
          />
        </div>

        {/* Right panel */}
        <div className="w-72 flex flex-col gap-3 overflow-y-auto">
          {/* Selected province detail */}
          {selected ? (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-red-500 shrink-0" />
                <h3 className="text-sm font-bold text-gray-900">{selected.name}</h3>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Inflasi YoY', value: `${selected.yoy.toFixed(2)}%`, color: selected.yoy >= 3.5 ? 'text-red-600' : 'text-gray-800' },
                  { label: 'Inflasi MtM', value: `+${selected.mtm.toFixed(2)}%`, color: 'text-gray-800' },
                  { label: 'Risk Score',  value: `${selected.risk}/100`, color: selected.risk >= 80 ? 'text-red-600' : selected.risk >= 60 ? 'text-amber-600' : 'text-emerald-600' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-500">{r.label}</span>
                    <span className={`font-mono text-sm font-bold ${r.color}`}>{r.value}</span>
                  </div>
                ))}
                <div className="mt-1">{riskBadge(selected.risk)}</div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
              <MapPin className="h-5 w-5 text-gray-300 mx-auto mb-1.5" />
              <p className="text-xs text-gray-400">Klik marker di peta untuk melihat detail provinsi</p>
            </div>
          )}

          {/* Top 5 risiko */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-3 py-2.5 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-800">Top 5 Risiko Tertinggi</h3>
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            </div>
            {top5.map((p, i) => (
              <button key={p.code} onClick={() => setSelected(p)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors text-left">
                <span className="text-[10px] font-mono text-gray-400 w-3">{i + 1}</span>
                <span className={`h-2 w-2 rounded-full shrink-0 ${riskDot(p.risk)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-400 font-mono">YoY {p.yoy.toFixed(2)}% · Risk {p.risk}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Province table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Seluruh Provinsi</h2>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400">Urut:</span>
            {(['risk', 'yoy', 'mtm'] as const).map(k => (
              <button key={k} onClick={() => setSortBy(k)}
                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors ${sortBy === k ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {k.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-500">#</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-500">Provinsi</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-500 font-mono">YoY %</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-500 font-mono">MtM %</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-500">Risk</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-500">Level</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr key={p.code} onClick={() => setSelected(p)}
                  className={`border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${selected?.code === p.code ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-2 font-mono text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-gray-800">{p.name}</td>
                  <td className={`px-4 py-2 text-right font-mono font-bold ${p.yoy >= 3.5 ? 'text-red-600' : p.yoy >= 3.0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {p.yoy.toFixed(2)}%
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-gray-700">+{p.mtm.toFixed(2)}%</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full ${riskDot(p.risk)}`} style={{ width: `${p.risk}%` }} />
                      </div>
                      <span className="font-mono font-bold text-gray-700 w-6">{p.risk}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">{riskBadge(p.risk)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
