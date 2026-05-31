import { NextResponse } from 'next/server'
import { mockSentimentSummary } from '@/lib/mock-data'

export async function GET() {
  return NextResponse.json({
    summary: mockSentimentSummary,
    overall: { neg: 62, neu: 25, pos: 13 },
  })
}
