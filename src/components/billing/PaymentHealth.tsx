import { useState } from 'react'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import { cn, money } from '../../lib/utils'
import { STATUS } from '../../lib/palette'
import { describeArc, useCountUp, useInViewOnce } from '../charts/chart-kit'

export interface HealthSegment { key: string; label: string; amount: number; color: string }

/**
 * Collection health as a segmented arc — collected fills the track, and the
 * unpaid remainder is broken out by how much trouble it is in. Not a donut:
 * the arc reads as progress toward a goal, which is what collections are.
 */
export function PaymentHealth({
  collected, rate, segments, needsAttention, onAttentionClick, size = 260, trend,
}: {
  collected: number
  rate: number
  segments: HealthSegment[]
  needsAttention: number
  onAttentionClick?: () => void
  size?: number
  trend?: string
}) {
  const [ref, seen] = useInViewOnce<HTMLDivElement>()
  const [hover, setHover] = useState<string | null>(null)
  const animatedTotal = useCountUp(collected, seen, 1100)
  const animatedRate = useCountUp(rate, seen, 1100)

  const cx = size / 2, cy = size / 2, r = size / 2 - 18
  const START = -128, SWEEP = 256
  const GAP = 2.4
  const sum = segments.reduce((s, x) => s + x.amount, 0) || 1

  const arcs = segments.reduce<(HealthSegment & { from: number; to: number; pct: number })[]>((acc, s) => {
    const span = (s.amount / sum) * SWEEP
    const start = acc.length ? acc[acc.length - 1].to + GAP / 2 : START
    acc.push({ ...s, from: start + GAP / 2, to: start + span - GAP / 2, pct: (s.amount / sum) * 100 })
    return acc
  }, [])

  const active = arcs.find((a) => a.key === hover)

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="relative" style={{ height: size * 0.74 }}>
        <svg width={size} height={size * 0.8} viewBox={`0 0 ${size} ${size * 0.82}`} className="overflow-visible" role="img"
          aria-label={`Collected ${money(collected)}, collection rate ${rate.toFixed(1)} percent`}>
          <path d={describeArc(cx, cy, r, START, START + SWEEP)} fill="none" stroke="#F1F3F7" strokeWidth="16" strokeLinecap="round" />
          {arcs.map((a, i) => (
            <g key={a.key} onMouseEnter={() => setHover(a.key)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
              <path
                d={describeArc(cx, cy, r, a.from, Math.max(a.from + 0.4, a.to))}
                fill="none" stroke={a.color} strokeWidth={hover === a.key ? 19 : 16} strokeLinecap="round"
                className={seen ? 'draw-line' : undefined}
                style={{
                  ['--len' as string]: `${2 * Math.PI * r}`,
                  animationDelay: `${i * 140}ms`,
                  opacity: hover === null || hover === a.key ? 1 : 0.26,
                  transition: 'opacity 180ms ease, stroke-width 180ms ease',
                }}
              />
              <path d={describeArc(cx, cy, r, a.from, Math.max(a.from + 0.4, a.to))} fill="none" stroke="transparent" strokeWidth="30" />
            </g>
          ))}
          {/* free-throw circle motif */}
          <circle cx={cx} cy={cy} r={r - 40} fill="none" stroke="rgba(11,31,69,0.05)" strokeWidth="1" />
        </svg>

        <div className="pointer-events-none absolute inset-x-0 top-[26%] flex flex-col items-center text-center">
          {active ? (
            <>
              <span className="stat text-[34px] leading-none" style={{ color: active.color }}>{money(active.amount)}</span>
              <span className="mt-1.5 text-[12.5px] font-semibold text-ink">{active.label}</span>
              <span className="text-[11.5px] tabular-nums text-ink-3">{active.pct.toFixed(0)}% of the ledger</span>
            </>
          ) : (
            <>
              <span className="stat text-[38px] leading-none text-ink">{money(Math.round(animatedTotal))}</span>
              <span className="eyebrow mt-1">Collected</span>
              <span className="mt-2.5 flex items-baseline gap-1.5">
                <span className="stat text-[21px] leading-none text-good">{animatedRate.toFixed(1)}%</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3">collection rate</span>
              </span>
              {trend && <span className="mt-1 text-[11.5px] text-good">{trend}</span>}
            </>
          )}
        </div>
      </div>

      <div className="mt-1 flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
        {arcs.map((s) => (
          <button
            key={s.key}
            onMouseEnter={() => setHover(s.key)}
            onMouseLeave={() => setHover(null)}
            className={cn('flex items-center gap-1.5 rounded-md px-1 py-0.5 text-[12px] transition-opacity',
              hover === null || hover === s.key ? 'opacity-100' : 'opacity-45')}
          >
            <span className="h-2 w-2 rounded-[3px]" style={{ background: s.color }} />
            <span className="text-ink-2">{s.label}</span>
            <span className="font-semibold tabular-nums text-ink">{s.pct.toFixed(0)}%</span>
          </button>
        ))}
      </div>

      {needsAttention > 0 && (
        <button
          onClick={onAttentionClick}
          className="group mt-4 flex w-full items-center gap-2.5 rounded-xl border border-[#FBDCC9] bg-orange-tint px-3.5 py-2.5 text-left transition-all duration-150 hover:border-orange/40 hover:shadow-card"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#C24A12]">
            <AlertTriangle className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 flex-1 text-[13px] font-semibold text-[#A93C0E]">
            {needsAttention} families need attention
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-[#C24A12] transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  )
}

export const HEALTH_COLORS = {
  paid: STATUS.good,
  upcoming: '#1746C7',
  dueSoon: '#1746C7',
  overdue: '#F05A1A',
  failed: STATUS.bad,
}
