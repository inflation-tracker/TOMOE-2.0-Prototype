import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  sub?: string
  trend?: number
  trendLabel?: string
  icon?: React.ReactNode
  accent?: 'red' | 'amber' | 'green' | 'blue' | 'purple' | 'default'
  className?: string
  onClick?: () => void
}

const ACCENTS = {
  red:     { card: 'border-red-100 bg-gradient-to-br from-red-50 to-white',         val: 'text-red-600',     icon: 'text-red-300' },
  amber:   { card: 'border-amber-100 bg-gradient-to-br from-amber-50 to-white',     val: 'text-amber-600',   icon: 'text-amber-300' },
  green:   { card: 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-white', val: 'text-emerald-600', icon: 'text-emerald-300' },
  blue:    { card: 'border-blue-100 bg-gradient-to-br from-blue-50 to-white',       val: 'text-blue-600',    icon: 'text-blue-300' },
  purple:  { card: 'border-purple-100 bg-gradient-to-br from-purple-50 to-white',   val: 'text-purple-600',  icon: 'text-purple-300' },
  default: { card: 'border-gray-200 bg-white',                                      val: 'text-gray-900',    icon: 'text-gray-300' },
}

export function KPICard({ title, value, sub, trend, trendLabel, icon, accent = 'default', className, onClick }: KPICardProps) {
  const a = ACCENTS[accent]
  const isPositiveTrend = (trend ?? 0) > 0

  return (
    <div onClick={onClick}
      className={cn(
        'rounded-xl border p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] transition-all',
        a.card,
        onClick && 'cursor-pointer hover:shadow-[0_4px_16px_0_rgb(0,0,0,0.08)] hover:-translate-y-px',
        className
      )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{title}</p>
          <p className={cn('mt-1.5 font-mono text-[26px] font-bold leading-none tracking-tight', a.val)}>
            {value}
          </p>
          {sub && <p className="mt-1 text-[11px] text-gray-400 leading-snug">{sub}</p>}
          {trend !== undefined && (
            <div className={cn(
              'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
              isPositiveTrend ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
            )}>
              {isPositiveTrend
                ? <TrendingUp className="h-2.5 w-2.5" />
                : trend === 0
                ? <Minus className="h-2.5 w-2.5" />
                : <TrendingDown className="h-2.5 w-2.5" />
              }
              <span>{isPositiveTrend ? '+' : ''}{trend?.toFixed(2)}% {trendLabel ?? 'vs bln lalu'}</span>
            </div>
          )}
        </div>
        {icon && <div className={cn('shrink-0 mt-0.5', a.icon)}>{icon}</div>}
      </div>
    </div>
  )
}
