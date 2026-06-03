import { proxyToMl } from '@/lib/ml-proxy'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  return proxyToMl('/sentiment/analyze', body)
}
