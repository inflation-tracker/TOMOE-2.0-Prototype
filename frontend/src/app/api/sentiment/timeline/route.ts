import { NextResponse } from 'next/server'
import { mockSentimentTimeline } from '@/lib/mock-data'

export async function GET() {
  return NextResponse.json(mockSentimentTimeline)
}
