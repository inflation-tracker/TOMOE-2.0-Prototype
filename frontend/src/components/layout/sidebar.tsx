'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, BarChart2, Zap, FileText, TrendingUp,
  ShoppingBasket, MessageSquare, Map, Settings, HelpCircle,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

const navMain = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/analytics',     label: 'Analytics',     icon: BarChart2,    badge: '20' },
  { href: '/early-warning', label: 'Early Warning', icon: Zap,          badge: '3', badgeRed: true },
  { href: '/laporan',       label: 'Laporan',       icon: FileText },
]
const navFeatures = [
  { href: '/forecast',    label: 'Forecasting', icon: TrendingUp, badge: '16' },
  { href: '/komoditas',   label: 'Komoditas',   icon: ShoppingBasket },
  { href: '/sentimen',    label: 'Sentimen',    icon: MessageSquare },
  { href: '/geospatial',  label: 'Geospatial',  icon: Map },
]
const navGeneral = [
  { href: '/pengaturan', label: 'Pengaturan', icon: Settings },
  { href: '/bantuan',    label: 'Bantuan',    icon: HelpCircle },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const col = sidebarCollapsed

  return (
    <aside className={cn(
      'flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out shrink-0',
      col ? 'w-[60px]' : 'w-[220px]'
    )}>
      {/* Brand */}
      <div className={cn('flex h-14 items-center border-b border-gray-100 px-3', col ? 'justify-center' : 'justify-between')}>
        {!col && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <polygon points="7,1 13,12 1,12" fill="white" />
              </svg>
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-bold tracking-tight text-gray-900">TOMOE 2.0</p>
              <p className="text-[9px] font-medium text-gray-400 tracking-wider uppercase">Inflation Detection</p>
            </div>
          </div>
        )}
        {col && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <polygon points="7,1 13,12 1,12" fill="white" />
            </svg>
          </div>
        )}
        {!col && (
          <button onClick={toggleSidebar} aria-label="Lipat sidebar" aria-expanded={!col}
            className="rounded-md p-1 text-gray-300 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-4">
        <NavSection label="Main" items={navMain} col={col} pathname={pathname} />
        <div className="mx-3 border-t border-gray-100" />
        <NavSection label="Features" items={navFeatures} col={col} pathname={pathname} />
        <div className="mx-3 border-t border-gray-100" />
        <NavSection label="General" items={navGeneral} col={col} pathname={pathname} />
      </nav>

      {/* Collapse trigger (collapsed state) */}
      {col && (
        <button onClick={toggleSidebar} aria-label="Buka sidebar" aria-expanded={!col}
          className="mx-auto mb-3 flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}

      {/* Footer badge */}
      {!col && (
        <div className="border-t border-gray-100 p-3">
          <div className="rounded-lg bg-gradient-to-br from-brand-50 to-emerald-50 border border-brand-100 p-2.5 text-center">
            <p className="text-[10px] font-bold text-brand-700">🏆 PIDI Digdaya X 2026</p>
            <p className="text-[9px] text-gray-400 mt-0.5">Bank Indonesia × OJK</p>
            <div className="mt-1.5 rounded-md bg-brand-500 py-1 px-2">
              <p className="text-[9px] font-bold text-white">PS2 — Inflasi &amp; Pangan</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

function NavSection({ label, items, col, pathname }: {
  label: string
  items: { href: string; label: string; icon: React.ElementType; badge?: string; badgeRed?: boolean }[]
  col: boolean
  pathname: string
}) {
  return (
    <div className="px-2">
      {!col && (
        <p className="mb-1 px-2 text-[9px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      )}
      <div className="space-y-0.5">
        {items.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}
              title={col ? item.label : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-medium transition-all',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800',
                col && 'justify-center'
              )}
              aria-current={active ? 'page' : undefined}>
              <Icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-brand-600' : 'text-gray-400')} />
              {!col && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      'rounded-full px-1.5 py-px text-[10px] font-bold leading-none',
                      item.badgeRed ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
