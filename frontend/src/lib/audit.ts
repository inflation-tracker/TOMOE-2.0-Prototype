import 'server-only'
import { getPool } from './db'

export interface AuditEntry {
  userId?: number | null
  action: string
  entity?: string | null
  entityId?: number | null
  detail?: unknown
  ip?: string | null
}

/**
 * Append an entry to audit_logs. Best-effort: a logging failure must never
 * break the request it's recording, so errors are swallowed (and logged).
 * No-op when no DB is configured.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  const pool = getPool()
  if (!pool) return
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, detail, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        entry.userId ?? null,
        entry.action,
        entry.entity ?? null,
        entry.entityId ?? null,
        entry.detail != null ? JSON.stringify(entry.detail) : null,
        entry.ip ?? null,
      ],
    )
  } catch (err) {
    console.error('[audit] write failed:', err)
  }
}
