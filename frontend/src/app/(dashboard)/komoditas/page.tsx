import { getCommodityPrices } from '@/lib/queries'
import { Badge } from '@/components/ui/badge'
import { formatIDR, formatDate } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

export const metadata = { title: 'Komoditas — TOMOE 2.0' }

export default async function KomoditasPage() {
  const prices = await getCommodityPrices()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Komoditas</h1>
        <p className="text-sm text-gray-500">Data harga harian komoditas dari PIHPS BI — 34 provinsi Indonesia.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Naik Hari Ini', value: prices.filter((p) => p.price_change > 0).length, color: 'text-red-600' },
          { label: 'Turun Hari Ini', value: prices.filter((p) => p.price_change < 0).length, color: 'text-emerald-600' },
          { label: 'Tidak Berubah', value: prices.filter((p) => p.price_change === 0).length, color: 'text-gray-600' },
          { label: 'Total Dipantau', value: prices.length, color: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-gray-400">{s.label}</p>
            <p className={`mt-1 font-mono text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Prices Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Harga Komoditas Harian</h2>
          <span className="text-[10px] text-gray-400">Sumber: PIHPS BI | Pasar Inpres Manonda, Palu | {formatDate(new Date().toISOString())}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-2.5 text-left font-semibold text-gray-500">Komoditas</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-500">Kategori</th>
                <th className="px-4 py-2.5 text-right font-semibold text-gray-500 font-mono">Harga</th>
                <th className="px-4 py-2.5 text-right font-semibold text-gray-500 font-mono">Perubahan</th>
                <th className="px-4 py-2.5 text-right font-semibold text-gray-500 font-mono">% Perubahan</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-500">Trend</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((p) => (
                <tr key={p.commodity_id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-800">{p.commodity_name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="gray">{p.category}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">
                    {formatIDR(p.price)}/{p.unit}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${p.price_change > 0 ? 'text-red-500' : p.price_change < 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                    {p.price_change > 0 ? '+' : ''}{formatIDR(p.price_change)}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${p.price_change_pct > 0 ? 'text-red-500' : p.price_change_pct < 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                    {p.price_change_pct > 0 ? '+' : ''}{p.price_change_pct.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3">
                    {p.price_change > 0
                      ? <TrendingUp className="h-4 w-4 text-red-400" />
                      : p.price_change < 0
                      ? <TrendingDown className="h-4 w-4 text-emerald-400" />
                      : <span className="text-gray-300">—</span>
                    }
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
