'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * Measures its own box and hands concrete pixel dimensions to a render-prop
 * child. Charts then render with explicit width/height numbers instead of a
 * Recharts <ResponsiveContainer> — which in v3 always does one initial render
 * at width(-1)/height(-1) and logs a console warning regardless of parent size.
 * Measuring ourselves and only rendering the chart once size > 0 removes that
 * warning entirely, and (being client-mounted) also avoids the SSR hydration
 * mismatch on chart pages.
 *
 * Usage:
 *   <ChartFrame height={220}>
 *     {({ width, height }) => <BarChart width={width} height={height} .../>}
 *   </ChartFrame>
 */
export function ChartFrame({
  height = '100%',
  className,
  children,
}: {
  height?: number | string
  className?: string
  children: (size: { width: number; height: number }) => React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((prev) =>
        Math.round(width) !== Math.round(prev.width) || Math.round(height) !== Math.round(prev.height)
          ? { width, height }
          : prev,
      )
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%' }}
    >
      {size.width > 0 && size.height > 0 && children(size)}
    </div>
  )
}
