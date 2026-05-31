import { NextResponse } from 'next/server'
import { mockInflationHistory } from '@/lib/mock-data'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const component = searchParams.get('component')

  const data = component
    ? mockInflationHistory.filter((d) => d.component === component)
    : mockInflationHistory

  return NextResponse.json(data)
}
