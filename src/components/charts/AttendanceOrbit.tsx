import { useState } from 'react'
import { cn } from '../../lib/utils'
import { describeArc, useCountUp, useInViewOnce, ChartTooltip, TooltipRow } from './chart-kit'

export interface OrbitRing {
  id: string
  label: string
  value: number      // attendance %
  color: string
  present: number
  expected: number
  trend: number
}

/**
 * Layered concentric arcs — one ring per team, outermost = oldest age group.
 * Not a donut: rings are independent gauges sharing a centre, so a team's
 * value is readable on its own rather than as a share of a whole.
 */
export function AttendanceOrbit({
  rings, center, size = 260, label = 'Academy attendance',
}: { rings: OrbitRing[]; center: number; size?: number; label?: string }) {
  const [ref, seen] = useInViewOnce<HTMLDivElement>()
  const [hover, setHover] = useState<string | null>(null)
  const animated = useCountUp(center, seen, 1100)

  const cx = size / 2, cy = size / 2
  const outer = size / 2 - 8
  const gap = 15
  const stroke = 9

  const active = rings.find((r) => r.id === hover)

  return (
    <div ref={ref} className="relative flex items-center justify-center" style={{ minHeight: size }}>
      <svg width={size} height={size} className="overflow-visible" role="img" aria-label={`${label}: ${center}%`}>
        {/* court arc watermark */}
        <g opacity="0.05">
          <circle cx={cx} cy={cy} r={outer - rings.length * gap - 6} fill="none" stroke="#0B1F45" strokeWidth="1" />
          <line x1={cx - 34} y1={cy} x2={cx + 34} y2={cy} stroke="#0B1F45" strokeWidth="1" />
        </g>
        {rings.map((r, i) => {
          const radius = outer - i * gap
          const on = hover === null || hover === r.id
          const sweep = (r.value / 100) * 320
          return (
            <g key={r.id}
              onMouseEnter={() => setHover(r.id)}
              onMouseLeave={() => setHover(null)}
              className="cursor-pointer"
            >
              <path d={describeArc(cx, cy, radius, -160, 160)} fill="none"
                stroke="#EEF0F4" strokeWidth={stroke} strokeLinecap="round" />
              <path
                d={describeArc(cx, cy, radius, -160, -160 + sweep)}
                fill="none" stroke={r.color} strokeWidth={stroke} strokeLinecap="round"
                className={seen ? 'draw-line' : undefined}
                style={{
                  ['--len' as string]: `${2 * Math.PI * radius}`,
                  animationDelay: `${140 + i * 110}ms`,
                  opacity: on ? 1 : 0.24,
                  transition: 'opacity 180ms ease',
                }}
              />
              {/* fat invisible hit ring so hover is forgiving */}
              <path d={describeArc(cx, cy, radius, -160, 160)} fill="none" stroke="transparent" strokeWidth={gap} />
            </g>
          )
        })}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        {active ? (
          <>
            <span className="stat text-[38px] leading-none" style={{ color: active.color }}>{Math.round(active.value)}%</span>
            <span className="mt-1.5 text-[11.5px] font-semibold text-ink">{active.label}</span>
            <span className="text-[11px] text-ink-3 tabular-nums">{active.present}/{active.expected} present</span>
          </>
        ) : (
          <>
            <span className="stat text-[42px] leading-none text-ink">{Math.round(animated)}%</span>
            <span className="eyebrow mt-1.5">{label}</span>
          </>
        )}
      </div>

      {active && (
        <ChartTooltip x={size / 2} y={size / 2 - 6} align="center">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-4">{active.label}</div>
          <TooltipRow color={active.color} label="Attendance" value={`${active.value}%`} />
          <TooltipRow label="Present / expected" value={`${active.present}/${active.expected}`} />
          <TooltipRow label="Trend (30d)" value={
            <span className={cn(active.trend >= 0 ? 'text-good' : 'text-bad')}>
              {active.trend >= 0 ? '↑' : '↓'} {Math.abs(active.trend).toFixed(1)}%
            </span>
          } />
        </ChartTooltip>
      )}
    </div>
  )
}
