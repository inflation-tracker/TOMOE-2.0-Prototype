import { NextResponse } from 'next/server'
import { getCommodityPrices } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getCommodityPrices())
}
