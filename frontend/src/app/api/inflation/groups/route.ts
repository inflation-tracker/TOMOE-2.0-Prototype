import { NextResponse } from 'next/server'
import { mockGroupInflation } from '@/lib/mock-data'

export async function GET() {
  return NextResponse.json(mockGroupInflation)
}
