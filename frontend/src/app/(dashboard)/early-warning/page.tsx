import { getEWSAlerts } from '@/lib/queries'
import type { EWSAlert } from '@/types'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Early Warning — TOMOE 2.0' }

const severityMap = { high: 'red', medium: 'amber', low: 'green' } as const
const alertTypeLabel: Record<string, string> = {
  '2sigma': '2-Sigma',
  'forecast_breach': 'Forecast Breach',
  'sentiment_spike': 'Sentiment Spike',
}

export default async function EarlyWarningPage() {
  const alerts = await getEWSAlerts()
  const openAlerts = alerts.filter((a) => a.status === 'open')
  const ackAlerts = alerts.filter((a) => a.status === 'acknowledged')
  const resolvedAlerts = alerts.filter((a) => a.status === 'resolved')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Early Warning System</h1>
        <p className="text-sm text-gray-500">Peringatan dini tekanan harga per wilayah dan komoditas.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-xs font-semibold text-red-700">Alert Aktif</span>
          </div>
          <p className="font-mono text-2xl font-bold text-red-600">{openAlerts.length}</p>
          <p className="text-[10px] text-red-400">{openAlerts.filter((a) => a.severity === 'high').length} kritis</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-semibold text-amber-700">Acknowledged</span>
          </div>
          <p className="font-mono text-2xl font-bold text-amber-600">{ackAlerts.length}</p>
          <p className="text-[10px] text-amber-400">Sedang ditindaklanjuti</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700">Resolved</span>
          </div>
          <p className="font-mono text-2xl font-bold text-emerald-600">{resolvedAlerts.length}</p>
          <p className="text-[10px] text-emerald-400">30 hari terakhir</p>
        </div>
      </div>

      {/* Alert types explanation */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { type: '2-Sigma', desc: 'Harga melampaui threshold 2 standar deviasi dari rata-rata historis', color: 'bg-red-50 border-red-200' },
          { type: 'Forecast Breach', desc: 'Harga aktual melebihi batas atas confidence interval model prediksi', color: 'bg-orange-50 border-orange-200' },
          { type: 'Sentiment Spike', desc: 'Lonjakan sentimen negatif dari media sosial dan berita melebihi threshold', color: 'bg-amber-50 border-amber-200' },
        ].map((t) => (
          <div key={t.type} className={`rounded-lg border p-3 ${t.color}`}>
            <p className="text-xs font-semibold text-gray-700">{t.type}</p>
            <p className="mt-0.5 text-[10px] text-gray-500">{t.desc}</p>
          </div>
        ))}
      </div>

      {/* Active Alerts */}
      <AlertTable title="Alert Aktif" alerts={openAlerts} />
      {ackAlerts.length > 0 && <AlertTable title="Acknowledged" alerts={ackAlerts} />}
      {resolvedAlerts.length > 0 && <AlertTable title="Resolved (30 hari)" alerts={resolvedAlerts} muted />}
    </div>
  )
}

function AlertTable({ title, alerts, muted }: { title: string; alerts: EWSAlert[]; muted?: boolean }) {
  return (
    <div className={`rounded-xl border bg-white shadow-sm overflow-hidden ${muted ? 'opacity-70' : 'border-gray-200'}`}>
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="divide-y divide-gray-50">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex items-start gap-4 px-4 py-3 hover:bg-gray-50">
            <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${
              alert.severity === 'high' ? 'text-red-500' : alert.severity === 'medium' ? 'text-amber-500' : 'text-gray-300'
            }`} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-gray-800">{alert.commodity_name}</span>
                <Badge variant={severityMap[alert.severity]}>{alert.severity.toUpperCase()}</Badge>
                <Badge variant="gray">{alertTypeLabel[alert.alert_type]}</Badge>
                <span className="text-xs text-gray-400">{alert.region_name}</span>
              </div>
              <p className="text-xs text-gray-600 mb-1">{alert.message}</p>
              <div className="flex items-center gap-4 text-[10px] text-gray-400 font-mono">
                <span>Aktual: <strong className="text-gray-600">{alert.actual_value.toLocaleString('id-ID')}</strong></span>
                <span>Threshold: <strong className="text-gray-600">{alert.threshold.toLocaleString('id-ID')}</strong></span>
                <span>{formatDate(alert.triggered_at)}</span>
              </div>
            </div>
            <div className="shrink-0">
              <Badge variant={alert.status === 'open' ? 'red' : alert.status === 'acknowledged' ? 'amber' : 'green'}>
                {alert.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
