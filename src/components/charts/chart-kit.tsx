import React, { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

/** Draws/animates a chart only once it has actually been scrolled into view. */
export function useInViewOnce<T extends Element>(rootMargin = '-40px') {
  const ref = useRef<T | null>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } },
      { rootMargin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [seen, rootMargin])
  return [ref, seen] as const
}

/** Measures the container so every chart is fluid without a resize library. */
export function useSize<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T | null>(null)
  const [w, setW] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setW(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

/** Counts a metric up from zero. Respects prefers-reduced-motion. */
export function useCountUp(target: number, active = true, duration = 900) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!active) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(target); return }
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setV(target * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active, duration])
  return v
}

/** Floating glass tooltip — one of the few places glass is allowed. */
export function ChartTooltip({
  x, y, children, dark, align = 'center',
}: { x: number; y: number; children: React.ReactNode; dark?: boolean; align?: 'center' | 'left' | 'right' }) {
  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{
        left: x, top: y,
        transform: `translate(${align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0'}, calc(-100% - 12px))`,
      }}
    >
      <div className={cn(
        'min-w-[148px] rounded-xl border px-3 py-2.5 shadow-pop',
        dark ? 'glass-dark border-white/12 text-white' : 'glass border-line text-ink'
      )}>
        {children}
      </div>
    </div>
  )
}

export function TooltipRow({ color, label, value, dark }: { color?: string; label: string; value: React.ReactNode; dark?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-5 py-[3px]">
      <span className="flex items-center gap-1.5 min-w-0">
        {color && <span className="h-2 w-2 shrink-0 rounded-[3px]" style={{ background: color }} />}
        <span className={cn('truncate text-[12px]', dark ? 'text-white/60' : 'text-ink-3')}>{label}</span>
      </span>
      <span className={cn('text-[12.5px] font-semibold tabular-nums', dark ? 'text-white' : 'text-ink')}>{value}</span>
    </div>
  )
}

/** Legend — always present for ≥2 series, so identity is never colour-alone. */
export function Legend({
  items, active, onToggle, dark, className,
}: {
  items: { key: string; label: string; color: string }[]
  active?: Record<string, boolean>
  onToggle?: (key: string) => void
  dark?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {items.map((i) => {
        const on = active ? active[i.key] !== false : true
        const Tag = onToggle ? 'button' : 'span'
        return (
          <Tag
            key={i.key}
            {...(onToggle ? { onClick: () => onToggle(i.key), 'aria-pressed': on, type: 'button' as const } : {})}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md text-[12px] transition-opacity duration-150',
              onToggle && 'cursor-pointer hover:opacity-100',
              on ? 'opacity-100' : 'opacity-40'
            )}
          >
            <span className="h-2 w-2 rounded-[3px]" style={{ background: i.color }} />
            <span className={dark ? 'text-white/70' : 'text-ink-2'}>{i.label}</span>
          </Tag>
        )
      })}
    </div>
  )
}

/** Every chart ships a WCAG-clean table twin. */
export function TableView({
  head, rows, dark,
}: { head: string[]; rows: (string | number)[][]; dark?: boolean }) {
  return (
    <div className={cn('max-h-[260px] overflow-auto rounded-xl border', dark ? 'border-white/10' : 'border-line')}>
      <table className="w-full text-left text-[12.5px]">
        <thead className="sticky top-0">
          <tr className={dark ? 'bg-[#0F1626]' : 'bg-[#FBFCFD]'}>
            {head.map((h) => (
              <th key={h} className={cn('border-b px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.05em]',
                dark ? 'border-white/10 text-white/50' : 'border-line text-ink-3')}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={cn('border-b last:border-0', dark ? 'border-white/6' : 'border-line-soft')}>
              {r.map((c, j) => (
                <td key={j} className={cn('px-3 py-1.5 tabular-nums', dark ? 'text-white/80' : 'text-ink-2', j === 0 && 'font-medium')}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Smooth monotone-ish cubic path — no overshoot artefacts. */
export function smoothPath(pts: { x: number; y: number }[], tension = 0.32) {
  if (pts.length < 2) return ''
  let dPath = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension * 3
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension * 3
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension * 3
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension * 3
    dPath += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return dPath
}

export function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const rad = (deg: number) => ((deg - 90) * Math.PI) / 180
  const sx = cx + r * Math.cos(rad(startDeg)), sy = cy + r * Math.sin(rad(startDeg))
  const ex = cx + r * Math.cos(rad(endDeg)), ey = cy + r * Math.sin(rad(endDeg))
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`
}
