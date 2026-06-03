import { NextResponse } from 'next/server'
import { getInflationHistory } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const component = searchParams.get('component')
  return NextResponse.json(await getInflationHistory(component))
}
