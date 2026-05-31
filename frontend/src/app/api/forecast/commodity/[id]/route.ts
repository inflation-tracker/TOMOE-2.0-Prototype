import { NextResponse } from 'next/server'
import { mockForecastData, mockCommodityHistory } from '@/lib/mock-data'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id)
  return NextResponse.json({
    commodity_id: id,
    chart_data: mockForecastData(14),
    history: mockCommodityHistory(id, 30),
  })
}
