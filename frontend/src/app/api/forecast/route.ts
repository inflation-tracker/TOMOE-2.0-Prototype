import { NextResponse } from 'next/server'
import { mockForecastResults, mockForecastData } from '@/lib/mock-data'

export async function GET() {
  return NextResponse.json({
    results: mockForecastResults,
    chart_data: mockForecastData(14),
  })
}
