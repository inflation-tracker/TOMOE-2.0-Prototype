import { Pool } from 'pg'

// Singleton PostgreSQL pool. Reused across hot-reloads in dev via globalThis so
// we don't exhaust connections. Returns null when DATABASE_URL is not set, which
// lets query helpers fall back to mock data gracefully.
const globalForPg = globalThis as unknown as { _tomoePool?: Pool | null }

export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null
  if (!globalForPg._tomoePool) {
    globalForPg._tomoePool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 4_000,
    })
  }
  return globalForPg._tomoePool
}
