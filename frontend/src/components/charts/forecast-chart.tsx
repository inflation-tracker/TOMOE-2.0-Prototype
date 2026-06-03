'use client'
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend,
} from 'recharts'
import { ChartFrame } from './chart-frame'

// Legend display labels (CI series are hidden). Typed const instead of an
// `as Record<...>` cast on an inline object literal.
const LEGEND_LABELS: Record<string, string> = {
  Aktual: 'Aktual',
  Forecast: 'Forecast',
  'CI Hi': '',
  'CI Lo': '',
}

interface ForecastChartProps {
  data: { date: string; actual: number | null; forecast: number | null; ci_high: number | null; ci_low: number | null }[]
  valueFormatter?: (v: number) => string
}

const CustomTooltip = ({ active, payload, label, formatter }: { active?: boolean; payload?: {name: string; color: string; value: number; datasetIndex: number}[]; label?: string; formatter?: (v: number) => string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="mb-1 font-semibold text-gray-600 font-mono">{label}</p>
      {payload.map((p: { name: string; color: string; value: number }) => p.value !== null && (
        <p key={p.name} style={{ color: p.color }} className="font-mono">
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

export function ForecastChart({ data, valueFormatter }: ForecastChartProps) {
  const fmt = valueFormatter ?? ((v: number) => v.toFixed(2) + '%')

  return (
    <ChartFrame height="100%">
      {({ width, height }) => (
      <ComposedChart width={width} height={height} data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#9aa5b4' }}
          tickLine={false}
          axisLine={{ stroke: '#e5e9ef' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#9aa5b4' }}
          tickLine={false}
          axisLine={{ stroke: '#e5e9ef' }}
          tickFormatter={fmt}
          width={72}
        />
        <Tooltip content={<CustomTooltip formatter={fmt} />} />
        <Legend
          wrapperStyle={{ fontSize: 10, fontFamily: 'Plus Jakarta Sans', paddingTop: 8 }}
          formatter={(v: string) => LEGEND_LABELS[v] ?? v}
        />
        <Area dataKey="ci_high" name="CI Hi" fill="rgba(224,88,79,0.08)" stroke="transparent" connectNulls={false} />
        <Area dataKey="ci_low" name="CI Lo" fill="rgba(224,88,79,0.08)" stroke="transparent" connectNulls={false} />
        <Line dataKey="actual" name="Aktual" stroke="#2bb37a" strokeWidth={2.5} dot={{ r: 2.5 }} connectNulls={false} />
        <Line dataKey="forecast" name="Forecast" stroke="#e0584f" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2.5 }} connectNulls={false} />
      </ComposedChart>
      )}
    </ChartFrame>
  )
}
