import { NextResponse } from 'next/server'
import { mockForecastData, mockCommodityHistory } from '@/lib/mock-data'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id, 10)
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid commodity id' }, { status: 400 })
  }
  return NextResponse.json({
    commodity_id: id,
    chart_data: mockForecastData(14),
    history: mockCommodityHistory(id, 30),
  })
}
