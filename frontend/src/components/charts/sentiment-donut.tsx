'use client'
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { ChartFrame } from './chart-frame'

interface SentimentDonutProps {
  neg: number
  neu: number
  pos: number
  size?: number
}

const COLORS = ['#e0584f', '#f3c24b', '#2bb37a']

export function SentimentDonut({ neg, neu, pos, size = 140 }: SentimentDonutProps) {
  const data = [
    { name: 'Negatif', value: neg },
    { name: 'Netral', value: neu },
    { name: 'Positif', value: pos },
  ]

  return (
    <ChartFrame height={size}>
      {({ width, height }) => (
      <PieChart width={width} height={height}>
        <Pie data={data} cx="50%" cy="50%" innerRadius="58%" outerRadius="80%" paddingAngle={2} dataKey="value">
          {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
        </Pie>
        <Tooltip
          formatter={(v) => [`${v}%`]}
          contentStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono', border: '1px solid #e5e9ef', borderRadius: 8 }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 10, fontFamily: 'Plus Jakarta Sans', paddingTop: 4 }}
        />
      </PieChart>
      )}
    </ChartFrame>
  )
}
