'use client'
import dynamic from 'next/dynamic'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Loading } from '@/components/ui/loading'

const InflationLineChart = dynamic(() => import('@/components/charts/line-chart').then(m => m.InflationLineChart), { ssr: false })
const TomoeBarChart      = dynamic(() => import('@/components/charts/bar-chart').then(m => m.TomoeBarChart), { ssr: false })

export default function AnalyticsPage() {
  const { data: history } = useQuery({ queryKey: ['inflation', 'history'], queryFn: () => api.inflation.history() })
  const { data: groups }  = useQuery({ queryKey: ['inflation', 'groups'],  queryFn: () => api.inflation.groups() })
  if (!history || !groups) return <Loading />

  const umuHistory      = history.filter(d => d.component === 'umum').slice(-12)
  const volatileHistory = history.filter(d => d.component === 'volatile').slice(-12)

  const lineData = umuHistory.map((d, i) => ({
    time: d.time.slice(5, 7) + '/' + d.time.slice(2, 4),
    umum: d.yoy,
    volatile: volatileHistory[i]?.yoy ?? null,
  }))

  const andilData = [...groups]
    .sort((a, b) => Math.abs(b.andil) - Math.abs(a.andil))
    .slice(0, 7)
    .map(g => ({ group: g.group.split(',')[0].trim(), andil: g.andil }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Analisis mendalam pergerakan inflasi dan komoditas — Nasional.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Inflasi MtM', value: '+0.32%', sub: 'Mei 2026', color: 'text-red-600' },
          { label: 'Inflasi YoY', value: '3.12%',  sub: 'Mei 2026', color: 'text-red-600' },
          { label: 'Inflasi YtD', value: '1.24%',  sub: 'Jan–Mei 2026', color: 'text-amber-600' },
          { label: 'Andil Makanan', value: '1.42%', sub: 'Terbesar dari 11 kel.', color: 'text-orange-600' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-gray-400">{s.label}</p>
            <p className={`mt-1 font-mono text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-gray-800">Tren Inflasi YoY — 12 Bulan</h2>
          <p className="mb-3 text-xs text-gray-400">Umum vs Volatile Food, Nasional</p>
          <div className="h-52 w-full">
            <InflationLineChart
              data={lineData}
              lines={[
                { key: 'umum',     label: 'Inflasi Umum', color: '#3266f0' },
                { key: 'volatile', label: 'Volatile Food', color: '#e0584f' },
              ]}
              xKey="time"
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-gray-800">Andil Inflasi per Kelompok (MtM)</h2>
          <p className="mb-3 text-xs text-gray-400">7 kelompok pengeluaran utama, Mei 2026</p>
          <div className="h-52 w-full">
            <TomoeBarChart
              data={andilData}
              xKey="group"
              yKey="andil"
              label="Andil"
              yFormatter={v => v.toFixed(2) + '%'}
              colorFn={v => v >= 0 ? 'rgba(224,88,79,0.75)' : 'rgba(43,179,122,0.75)'}
            />
          </div>
        </div>
      </div>

      {/* Inflation by Group Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-800">Inflasi Berdasarkan Kelompok Pengeluaran</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-2.5 font-semibold text-gray-500">Kelompok</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-right font-mono">MtM %</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-right font-mono">YoY %</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-right font-mono">Andil %</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-700 font-medium">{g.group}</td>
                  <td className={`px-4 py-2.5 text-right font-mono font-semibold ${g.mtm >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {g.mtm >= 0 ? '+' : ''}{g.mtm.toFixed(2)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-semibold ${g.yoy >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {g.yoy >= 0 ? '+' : ''}{g.yoy.toFixed(2)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-semibold ${g.andil >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {g.andil >= 0 ? '+' : ''}{g.andil.toFixed(2)}
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
