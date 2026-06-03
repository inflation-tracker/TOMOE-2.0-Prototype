import 'server-only'
import { NextResponse } from 'next/server'

// Server-side base URL for the ML service. In Docker the frontend reaches the
// ML container over the internal network; locally it's localhost. This is NOT
// a NEXT_PUBLIC_* var, so it never ships to the browser.
const ML_INTERNAL_URL = process.env.ML_INTERNAL_URL ?? 'http://localhost:8000'
const ML_API_KEY = process.env.ML_API_KEY ?? ''

/**
 * Forward a JSON POST to the ML service, injecting the API key server-side.
 * The browser calls our /api/ml/* routes and never sees the secret — closing
 * the gap where a NEXT_PUBLIC_* key would have been public.
 */
export async function proxyToMl(path: string, body: unknown): Promise<NextResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (ML_API_KEY) headers['X-API-Key'] = ML_API_KEY

  try {
    const res = await fetch(`${ML_INTERNAL_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    const text = await res.text()
    // Pass the ML status through; parse JSON when possible.
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
    })
  } catch (err) {
    console.error('[ml-proxy] upstream error:', err)
    return NextResponse.json({ detail: 'ML service unavailable' }, { status: 502 })
  }
}
