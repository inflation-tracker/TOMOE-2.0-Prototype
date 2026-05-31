import { NextResponse } from 'next/server'

const mockUsers = [
  { id: 1, email: 'admin@bi.go.id', name: 'Admin BI Sulteng', role: 'admin', region: 'Sulawesi Tengah', last_login: new Date().toISOString() },
  { id: 2, email: 'analyst@bi.go.id', name: 'Analis TPID', role: 'analyst', region: 'Kota Palu', last_login: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, email: 'viewer@tpid.go.id', name: 'Staf TPID', role: 'tpid', region: 'Sulawesi Tengah', last_login: new Date(Date.now() - 86400000).toISOString() },
]

export async function GET() {
  return NextResponse.json(mockUsers)
}
