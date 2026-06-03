import { Pool } from 'pg'

// Type the global slot via declaration merging instead of a `globalThis as ...`
// cast — this is type-safe (no assertion) and keeps the singleton pattern.
declare global {
  // eslint-disable-next-line no-var
  var _tomoePool: Pool | null | undefined
}

function shouldUseSsl(connectionString: string): boolean {
  if (process.env.PGSSLMODE === 'require' || process.env.PGSSL === 'true') {
    return true
  }

  return connectionString.includes('sslmode=require')
}

// Singleton PostgreSQL pool. Reused across hot-reloads in dev via globalThis so
// we don't exhaust connections. Returns null when DATABASE_URL is not set, which
// lets query helpers fall back to mock data gracefully.
export function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) return null
  if (!globalThis._tomoePool) {
    globalThis._tomoePool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 4_000,
      ssl: shouldUseSsl(connectionString)
        ? { rejectUnauthorized: false }
        : undefined,
    })
  }
  return globalThis._tomoePool ?? null
}
