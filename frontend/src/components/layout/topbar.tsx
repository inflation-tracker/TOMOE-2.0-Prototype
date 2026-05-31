'use client'
import { useState, useEffect } from 'react'
import { Bell, Mail, Search } from 'lucide-react'

export function Topbar() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        }) + ' WIB'
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 gap-4">
      {/* Search */}
      <label className="flex w-64 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-gray-400 transition-colors focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-100 hover:border-gray-300">
        <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <input
          type="search"
          aria-label="Cari provinsi atau komoditas"
          placeholder="Cari provinsi, komoditas…"
          className="flex-1 min-w-0 bg-transparent text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none"
        />
        <kbd className="rounded border border-gray-200 bg-white px-1 py-px text-[10px] font-mono text-gray-400 leading-none">⌘K</kbd>
      </label>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Live clock */}
        <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="font-mono tabular-nums">{time || '—:—:— WIB'}</span>
        </div>

        {/* Icons */}
        <button type="button" aria-label="Pesan" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <Mail className="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" aria-label="Notifikasi (ada yang belum dibaca)" className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <Bell className="h-4 w-4" aria-hidden="true" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-1 ring-white" aria-hidden="true" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 mx-1" />

        {/* Avatar */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[11px] font-bold text-white shadow-sm">
            BI
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-[12px] font-semibold text-gray-800">Admin BI</p>
            <p className="text-[10px] text-gray-400">Nasional · admin</p>
          </div>
        </div>
      </div>
    </header>
  )
}
