export function Loading({ label = 'Memuat data…' }: { label?: string }) {
  return (
    <div className="flex h-64 items-center justify-center gap-2 text-sm text-gray-400">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-500" />
      {label}
    </div>
  )
}
