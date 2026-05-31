'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'
import { ChartFrame } from './chart-frame'

interface BarChartProps {
  data: Record<string, unknown>[]
  xKey: string
  yKey: string
  label?: string
  horizontal?: boolean
  colorFn?: (value: number) => string
  yFormatter?: (v: number) => string
  height?: number
}

export function TomoeBarChart({ data, xKey, yKey, label, horizontal, colorFn, yFormatter, height = 220 }: BarChartProps) {
  const fmt = yFormatter ?? ((v: number) => v.toFixed(2) + '%')
  const defaultColor = (v: number) => (v >= 0 ? 'rgba(239,68,68,0.75)' : 'rgba(34,160,90,0.75)')

  return (
    <ChartFrame height={height}>
      {({ width, height: h }) => (
      <BarChart
        width={width}
        height={h}
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 4, right: 8, left: horizontal ? 16 : 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={!horizontal} vertical={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#9aa5b4' }} tickLine={false} axisLine={{ stroke: '#e5e9ef' }} tickFormatter={fmt} />
            <YAxis dataKey={xKey} type="category" tick={{ fontSize: 10, fontFamily: 'Plus Jakarta Sans', fill: '#4a5568' }} tickLine={false} axisLine={false} width={120} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#9aa5b4' }} tickLine={false} axisLine={{ stroke: '#e5e9ef' }} />
            <YAxis tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: '#9aa5b4' }} tickLine={false} axisLine={{ stroke: '#e5e9ef' }} tickFormatter={fmt} width={52} />
          </>
        )}
        <Tooltip contentStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono', border: '1px solid #e5e9ef', borderRadius: 8 }} formatter={(v: unknown) => [fmt(v as number), label ?? yKey]} />
        <Bar dataKey={yKey} radius={4}>
          {data.map((row, i) => (
            <Cell key={i} fill={(colorFn ?? defaultColor)(row[yKey] as number)} />
          ))}
        </Bar>
      </BarChart>
      )}
    </ChartFrame>
  )
}
