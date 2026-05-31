import { Badge } from '@/components/ui/badge'
import { FileText, Download, Calendar } from 'lucide-react'

export const metadata = { title: 'Laporan — TOMOE 2.0' }

const reports = [
  { id: 1, title: 'Laporan Inflasi Bulanan Mei 2026', type: 'Bulanan', date: '2026-05-31', status: 'ready', size: '2.4 MB' },
  { id: 2, title: 'Laporan Inflasi Bulanan Apr 2026', type: 'Bulanan', date: '2026-04-30', status: 'ready', size: '2.1 MB' },
  { id: 3, title: 'Laporan Early Warning Q1 2026', type: 'Triwulanan', date: '2026-04-01', status: 'ready', size: '4.8 MB' },
  { id: 4, title: 'Laporan Forecast Komoditas Mei 2026', type: 'Mingguan', date: '2026-05-28', status: 'ready', size: '1.2 MB' },
  { id: 5, title: 'Laporan Sentimen Publik Mei 2026', type: 'Bulanan', date: '2026-05-31', status: 'ready', size: '3.1 MB' },
  { id: 6, title: 'Laporan Tahunan 2025 (Draft)', type: 'Tahunan', date: '2026-01-15', status: 'draft', size: '12.5 MB' },
]

export default async function LaporanPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Laporan</h1>
          <p className="text-sm text-gray-500">Unduh dan bagikan laporan inflasi periodik.</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors">
          <FileText className="h-3.5 w-3.5" />
          Generate Laporan Baru
        </button>
      </div>

      {/* Quick Generate */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Laporan Bulanan', icon: '📋', desc: 'Inflasi MtM, YoY, kelompok pengeluaran, EWS' },
          { label: 'Laporan Forecast', icon: '📈', desc: 'Proyeksi 7/14/30 hari semua komoditas utama' },
          { label: 'Laporan Sentimen', icon: '💬', desc: 'Analisis IndoBERT dan topik BERTopic terkini' },
        ].map((r) => (
          <div key={r.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-red-200 hover:bg-red-50 cursor-pointer transition-colors group">
            <span className="text-2xl">{r.icon}</span>
            <p className="mt-2 text-sm font-semibold text-gray-800 group-hover:text-red-700">{r.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Reports list */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-800">Arsip Laporan</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {reports.map((r) => (
            <div key={r.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
              <FileText className="h-5 w-5 shrink-0 text-red-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{r.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="gray">{r.type}</Badge>
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Calendar className="h-2.5 w-2.5" />
                    {r.date}
                  </span>
                  <span className="text-[10px] text-gray-400">{r.size}</span>
                </div>
              </div>
              <Badge variant={r.status === 'ready' ? 'green' : 'amber'}>{r.status}</Badge>
              <button className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 transition-colors">
                <Download className="h-3 w-3" />
                Unduh
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
