import { NextResponse } from 'next/server'
import { signSession, verifyPassword, SESSION_COOKIE } from '@/lib/auth'
import { findUserByEmail } from '@/lib/users'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}))
  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 })
  }

  const user = findUserByEmail(email)
  // Always run the verify to keep timing roughly constant even for unknown users.
  const ok = user ? await verifyPassword(password, user.password_hash) : false
  if (!user || !ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await signSession({ sub: user.id, email: user.email, role: user.role })
  await recordAudit({
    userId: user.id,
    action: 'login',
    entity: 'user',
    entityId: user.id,
    ip: req.headers.get('x-forwarded-for'),
  })

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, region: user.region },
  })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60,
  })
  return res
}
