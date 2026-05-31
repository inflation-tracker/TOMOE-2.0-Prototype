import { NextResponse } from 'next/server'
import { mockSentimentFeed } from '@/lib/mock-data'

export async function GET() {
  return NextResponse.json(mockSentimentFeed)
}
