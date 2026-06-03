import { NextResponse } from 'next/server'
import { mockForecastResults, mockForecastData, mockMonthlyForecast } from '@/lib/mock-data'
import type { ForecastResponse } from '@/types'

export async function GET() {
  const body: ForecastResponse = {
    results: mockForecastResults,
    monthly: mockMonthlyForecast,
    chart_data: mockForecastData(14),
  }
  return NextResponse.json(body)
}
