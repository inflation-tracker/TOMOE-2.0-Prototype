import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

// Routes that always require a valid session, regardless of AUTH_REQUIRED.
const SENSITIVE_PREFIXES = ['/api/users', '/api/ml']
// Routes that additionally require the admin role.
const ADMIN_ONLY_PREFIXES = ['/api/users']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Auth endpoints must stay open so users can log in.
  if (pathname.startsWith('/api/auth')) return NextResponse.next()

  const authRequired = process.env.AUTH_REQUIRED === 'true'
  const isSensitive = SENSITIVE_PREFIXES.some((p) => pathname.startsWith(p))

  // In demo mode (AUTH_REQUIRED unset) only sensitive routes are gated; flip
  // AUTH_REQUIRED=true in production to lock the entire /api surface.
  if (!authRequired && !isSensitive) return NextResponse.next()

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p)) && session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
