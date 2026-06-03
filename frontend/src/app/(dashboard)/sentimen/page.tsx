'use client'
import dynamic from 'next/dynamic'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

const SentimentDonut    = dynamic(() => import('@/components/charts/sentiment-donut').then(m => m.SentimentDonut), { ssr: false })
const InflationLineChart = dynamic(() => import('@/components/charts/line-chart').then(m => m.InflationLineChart), { ssr: false })

const sourceIcon: Record<string, string> = { news: '📰', twitter: '𝕏', instagram: '📸' }

export default function SentimenPage() {
  const { data: summaryRes } = useQuery({ queryKey: ['sentiment', 'summary'],  queryFn: () => api.sentiment.summary() })
  const { data: feed }       = useQuery({ queryKey: ['sentiment', 'feed'],     queryFn: () => api.sentiment.feed() })
  const { data: timelineRaw }= useQuery({ queryKey: ['sentiment', 'timeline'], queryFn: () => api.sentiment.timeline() })
  if (!summaryRes || !feed || !timelineRaw) return <Loading />

  const summary  = summaryRes.summary
  const timeline = timelineRaw.slice(-14)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Sentimen Publik</h1>
        <p className="text-sm text-gray-500">Analisis opini masyarakat dari media sosial dan berita — IndoBERT + BERTopic.</p>
      </div>

      {/* Per-commodity sentiment donuts */}
      <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
        {summary.map((s) => (
          <div key={s.commodity} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm text-center">
            <p className="mb-1 text-xs font-semibold text-gray-700">{s.commodity}</p>
            <SentimentDonut neg={s.neg} neu={s.neu} pos={s.pos} size={90} />
            <p className="mt-1 font-mono text-sm font-bold text-red-500">{s.neg}%</p>
            <p className="text-[10px] text-gray-400">{s.vol.toLocaleString('id-ID')} data</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-gray-800">Tren Sentimen 14 Hari</h2>
        <p className="mb-3 text-xs text-gray-400">Negatif vs Positif — semua komoditas gabungan</p>
        <div className="h-52">
          <InflationLineChart
            data={timeline.map((t) => ({ time: t.date.slice(5), neg: t.negatif, pos: t.positif }))}
            lines={[
              { key: 'neg', label: 'Negatif', color: '#e0584f' },
              { key: 'pos', label: 'Positif', color: '#2bb37a' },
            ]}
            xKey="time"
            yFormatter={(v) => v + '%'}
          />
        </div>
      </div>

      {/* Live feed */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Feed Terbaru</h2>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] text-gray-400">Live — diperbarui tiap 15 menit</span>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {feed.map((item) => (
            <div key={item.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50">
              <span className="text-base">{sourceIcon[item.source_type]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-gray-700">{item.commodity_name}</span>
                  <Badge variant={item.sentiment === 'negatif' ? 'red' : item.sentiment === 'positif' ? 'green' : 'amber'}>
                    {item.sentiment}
                  </Badge>
                  <span className="text-[10px] text-gray-400">{item.topic_label}</span>
                  <span className="ml-auto font-mono text-[10px] text-gray-400">{item.score.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-600">{item.text_snippet}</p>
                <p className="mt-0.5 text-[10px] text-gray-400">{item.region_name} · {formatDate(item.time)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
