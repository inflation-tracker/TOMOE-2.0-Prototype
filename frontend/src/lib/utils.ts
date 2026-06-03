import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatIDR(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

export function formatPct(value: number, decimals = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function severityColor(severity: string): string {
  if (severity === 'high') return 'text-red-600 bg-red-50'
  if (severity === 'medium') return 'text-amber-600 bg-amber-50'
  return 'text-emerald-600 bg-emerald-50'
}

export function sentimentColor(sentiment: string): string {
  if (sentiment === 'negatif') return '#e0584f'
  if (sentiment === 'netral') return '#f3c24b'
  return '#2bb37a'
}
