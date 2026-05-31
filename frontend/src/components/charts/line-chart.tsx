'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend,
} from 'recharts'
import { ChartFrame } from './chart-frame'

interface LineChartProps {
  data: Record<string, unknown>[]
  lines: { key: string; label: string; color: string; dashed?: boolean }[]
  xKey?: string
  yFormatter?: (v: number) => string
  height?: number
}

export function InflationLineChart({ data, lines, xKey = 'time', yFormatter, height = 220 }: LineChartProps) {
  const fmt = yFormatter ?? ((v: number) => v.toFixed(2) + '%')
  return (
    <ChartFrame height={height}>
      {({ width, height: h }) => (
      <LineChart width={width} height={h} data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#9aa5b4' }} tickLine={false} axisLine={{ stroke: '#e5e9ef' }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#9aa5b4' }} tickLine={false} axisLine={{ stroke: '#e5e9ef' }} tickFormatter={fmt} width={52} />
        <Tooltip contentStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono', border: '1px solid #e5e9ef', borderRadius: 8 }} formatter={(v: unknown) => [fmt(v as number)]} />
        <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'Plus Jakarta Sans', paddingTop: 8 }} />
        {lines.map((l) => (
          <Line
            key={l.key}
            dataKey={l.key}
            name={l.label}
            stroke={l.color}
            strokeWidth={2}
            strokeDasharray={l.dashed ? '5 4' : undefined}
            dot={{ r: 2 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
      )}
    </ChartFrame>
  )
}
