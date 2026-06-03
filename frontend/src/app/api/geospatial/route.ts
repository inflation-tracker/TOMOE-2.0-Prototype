import { NextResponse } from 'next/server'
import { provinsiNasional } from '@/lib/mock-data'
import type { Provinsi } from '@/types'

export async function GET() {
  const body: Provinsi[] = provinsiNasional
  return NextResponse.json(body)
}
