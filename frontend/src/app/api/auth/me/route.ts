import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const token = cookies().get(SESSION_COOKIE)?.value
  const session = await verifySession(token)
  if (!session) return NextResponse.json({ user: null }, { status: 401 })
  return NextResponse.json({
    user: { id: session.sub, email: session.email, role: session.role },
  })
}
