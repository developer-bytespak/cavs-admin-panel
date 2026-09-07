import { useState } from 'react'
import { cn, money } from '../../lib/utils'
import { STATUS } from '../../lib/palette'
import { describeArc, useCountUp, useInViewOnce } from './chart-kit'

export interface ArcSegment { key: string; label: string; value: number; amount: number; color: string }

/**
 * Financial health gauge. Segments sit on one 260° arc with a 2px surface gap
 * between them — no border strokes, no default pie.
 */
export function PaymentArc({
  segments, total, size = 244, caption,
}: { segments: ArcSegment[]; total: number; size?: number; caption?: string }) {
  const [ref, seen] = useInViewOnce<HTMLDivElement>()
  const [hover, setHover] = useState<string | null>(null)
  const animated = useCountUp(total, seen, 1000)

  const cx = size / 2, cy = size / 2, r = size / 2 - 16
  const START = -130, SWEEP = 260
  const sum = segments.reduce((s, x) => s + x.value, 0) || 1
  const GAP_DEG = 2.6

  const arcs = segments.reduce<(ArcSegment & { from: number; to: number })[]>((acc, s) => {
    const span = (s.value / sum) * SWEEP
    const start = acc.length ? acc[acc.length - 1].to + GAP_DEG / 2 : START
    acc.push({ ...s, from: start + GAP_DEG / 2, to: start + span - GAP_DEG / 2 })
    return acc
  }, [])

  const active = arcs.find((a) => a.key === hover)

  return (
    <div ref={ref} className="relative flex flex-col items-center" style={{ minHeight: size * 0.78 }}>
      <svg width={size} height={size * 0.78} viewBox={`0 0 ${size} ${size * 0.86}`} className="overflow-visible" role="img"
        aria-label={`Collected ${money(total)}`}>
        <path d={describeArc(cx, cy, r, START, START + SWEEP)} fill="none" stroke="#F1F3F7" strokeWidth="14" strokeLinecap="round" />
        {arcs.map((a, i) => (
          <g key={a.key} onMouseEnter={() => setHover(a.key)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
            <path
              d={describeArc(cx, cy, r, a.from, Math.max(a.from + 0.5, a.to))}
              fill="none" stroke={a.color} strokeWidth={hover === a.key ? 17 : 14} strokeLinecap="round"
              className={seen ? 'draw-line' : undefined}
              style={{
                ['--len' as string]: `${2 * Math.PI * r}`,
                animationDelay: `${i * 130}ms`,
                opacity: hover === null || hover === a.key ? 1 : 0.28,
                transition: 'opacity 180ms ease, stroke-width 180ms ease',
              }}
            />
            <path d={describeArc(cx, cy, r, a.from, Math.max(a.from + 0.5, a.to))} fill="none" stroke="transparent" strokeWidth="26" />
          </g>
        ))}
        {/* free-throw circle motif at the pivot */}
        <circle cx={cx} cy={cy} r={r - 34} fill="none" stroke="rgba(11,31,69,0.05)" strokeWidth="1" />
      </svg>

      <div className="pointer-events-none absolute inset-x-0 top-[30%] flex flex-col items-center">
        {active ? (
          <>
            <span className="stat text-[32px] leading-none" style={{ color: active.color }}>{money(active.amount)}</span>
            <span className="mt-1 text-[12px] font-semibold text-ink">{active.label}</span>
            <span className="text-[11.5px] text-ink-3 tabular-nums">{active.value.toFixed(0)}% of ledger</span>
          </>
        ) : (
          <>
            <span className="stat text-[36px] leading-none text-ink">{money(Math.round(animated))}</span>
            <span className="eyebrow mt-1">Collected</span>
            {caption && <span className="mt-0.5 text-[11.5px] text-ink-3">{caption}</span>}
          </>
        )}
      </div>

      <div className="mt-1 flex w-full items-center justify-center gap-x-5 gap-y-1 flex-wrap">
        {segments.map((s) => (
          <button
            key={s.key}
            onMouseEnter={() => setHover(s.key)}
            onMouseLeave={() => setHover(null)}
            className={cn('flex items-center gap-1.5 rounded-md px-1 py-0.5 text-[12px] transition-opacity',
              hover === null || hover === s.key ? 'opacity-100' : 'opacity-45')}
          >
            <span className="h-2 w-2 rounded-[3px]" style={{ background: s.color }} />
            <span className="text-ink-2">{s.label}</span>
            <span className="font-semibold text-ink tabular-nums">{s.value.toFixed(0)}%</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export const PAY_SEGMENT_COLORS = { paid: STATUS.good, pending: STATUS.warn, overdue: STATUS.bad }
