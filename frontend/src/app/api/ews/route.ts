import { NextResponse } from 'next/server'
import { getEWSAlerts } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getEWSAlerts())
}
