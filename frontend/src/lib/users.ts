import 'server-only'
import type { User } from '@/types'

// Demo user store. In production this is the `users` table (with a
// password_hash column — see db/schema.sql); here we keep a small in-memory
// set so login works without a DB during the demo. All demo accounts share the
// password "tomoe123" (PBKDF2-SHA256, 100k iters). CHANGE THIS before any real
// deployment and move verification to the DB.
interface StoredUser extends User {
  password_hash: string
}

const DEMO_HASH =
  'pbkdf2$sha256$100000$ChssPU5fYHGCk6S1xtfo+Q==$Qb6SCqOZ0ARhnFnttrPNrh05evkAHb9J6OUHdwePsBc='

const USERS: StoredUser[] = [
  { id: 1, email: 'admin@bi.go.id', name: 'Admin BI Sulteng', role: 'admin', region: 'Sulawesi Tengah', last_login: new Date().toISOString(), password_hash: DEMO_HASH },
  { id: 2, email: 'analyst@bi.go.id', name: 'Analis TPID', role: 'analyst', region: 'Kota Palu', last_login: new Date(Date.now() - 3600000).toISOString(), password_hash: DEMO_HASH },
  { id: 3, email: 'viewer@tpid.go.id', name: 'Staf TPID', role: 'tpid', region: 'Sulawesi Tengah', last_login: new Date(Date.now() - 86400000).toISOString(), password_hash: DEMO_HASH },
]

export function findUserByEmail(email: string): StoredUser | undefined {
  return USERS.find((u) => u.email.toLowerCase() === email.toLowerCase())
}

/** Public-safe user list (no password hashes). */
export function listUsers(): User[] {
  return USERS.map((u): User => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    region: u.region,
    last_login: u.last_login,
  }))
}
