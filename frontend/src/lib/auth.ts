// Dependency-free auth primitives built on the Web Crypto API, so the SAME
// code runs in Edge middleware and in Node route handlers:
//   * HS256 JWT session tokens (sign/verify)
//   * PBKDF2 password verification
// No `server-only` import here — middleware (Edge) needs verifySession.

import { z } from 'zod'

const enc = new TextEncoder()

export const SESSION_COOKIE = 'tomoe_session'
const SESSION_TTL_SECONDS = 8 * 60 * 60

// A decoded JWT payload is untrusted input even after the signature verifies
// (it could be malformed or from an older token schema), so we validate its
// shape with zod instead of asserting it with `as`.
const sessionPayloadSchema = z.object({
  sub: z.number(),
  email: z.string(),
  role: z.enum(['admin', 'analyst', 'tpid', 'viewer']),
  iat: z.number().optional(),
  exp: z.number().optional(),
})
export type SessionPayload = z.infer<typeof sessionPayloadSchema>

function getSecret(): string {
  return process.env.AUTH_SECRET ?? 'dev-insecure-secret-change-me'
}

// ─── base64 / base64url helpers ──────────────────────────────────────────────

function bytesToB64url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlToBytes(str: string): Uint8Array<ArrayBuffer> {
  let s = str.replace(/-/g, '+').replace(/_/g, '/')
  s += '='.repeat((4 - (s.length % 4)) % 4)
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function b64ToBytes(str: string): Uint8Array<ArrayBuffer> {
  const bin = atob(str)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

// ─── JWT (HS256) ─────────────────────────────────────────────────────────────

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(getSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function signSession(payload: Omit<SessionPayload, 'iat' | 'exp'>): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const body: SessionPayload = { ...payload, iat: now, exp: now + SESSION_TTL_SECONDS }
  const header = bytesToB64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const claims = bytesToB64url(enc.encode(JSON.stringify(body)))
  const data = `${header}.${claims}`
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(), enc.encode(data))
  return `${data}.${bytesToB64url(new Uint8Array(sig))}`
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const [header, claims, sig] = token.split('.')
    if (!header || !claims || !sig) return null
    const data = `${header}.${claims}`
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(), b64urlToBytes(sig), enc.encode(data))
    if (!ok) return null
    const raw: unknown = JSON.parse(new TextDecoder().decode(b64urlToBytes(claims)))
    const parsed = sessionPayloadSchema.safeParse(raw)
    if (!parsed.success) return null
    const payload = parsed.data
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

// ─── Password verification (PBKDF2) ──────────────────────────────────────────
// Stored format: pbkdf2$sha256$<iterations>$<salt_b64>$<key_b64>

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, , iterStr, saltB64, keyB64] = stored.split('$')
    if (scheme !== 'pbkdf2') return false
    const iterations = parseInt(iterStr, 10)
    const salt = b64ToBytes(saltB64)
    const expected = b64ToBytes(keyB64)
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      keyMaterial,
      expected.length * 8,
    )
    return timingSafeEqual(new Uint8Array(bits), expected)
  } catch {
    return false
  }
}

export function hasRole(session: SessionPayload | null, roles: SessionPayload['role'][]): boolean {
  return !!session && roles.includes(session.role)
}
