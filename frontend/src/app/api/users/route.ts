import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { listUsers } from '@/lib/users'
import { verifySession, SESSION_COOKIE } from '@/lib/auth'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// Access control is enforced by middleware (admin-only on /api/users); we still
// read the session here to attribute the audit entry. Password hashes are never
// included — listUsers() strips them.
export async function GET(req: Request) {
  const session = await verifySession(cookies().get(SESSION_COOKIE)?.value)
  await recordAudit({
    userId: session?.sub ?? null,
    action: 'list_users',
    entity: 'user',
    ip: req.headers.get('x-forwarded-for'),
  })
  return NextResponse.json(listUsers())
}
