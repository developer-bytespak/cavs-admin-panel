import React, { useMemo, useState } from 'react'
import { cn } from '../../lib/utils'
import { INK, INK_ARENA } from '../../lib/palette'
import { ChartTooltip, TooltipRow, smoothPath, useInViewOnce, useSize } from './chart-kit'

export interface TrendSeries { key: string; label: string; color: string; area?: boolean; dashed?: boolean }
export interface TrendPoint { label: string; [k: string]: string | number }

/**
 * One y-scale. Always. Series handed to this chart must share a unit —
 * different units get their own chart rather than a second axis.
 */
export function TrendChart({
  data, series, height = 240, dark, yFormat = (v: number) => String(Math.round(v)),
  yTicks = 4, endLabel = true, minZero, className, xEvery,
}: {
  data: TrendPoint[]
  series: TrendSeries[]
  height?: number
  dark?: boolean
  yFormat?: (v: number) => string
  yTicks?: number
  endLabel?: boolean
  minZero?: boolean
  className?: string
  xEvery?: number
}) {
  const [wrapRef, width] = useSize<HTMLDivElement>(720)
  const [viewRef, seen] = useInViewOnce<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const ink = dark ? INK_ARENA : INK

  const PAD = { t: 14, r: endLabel ? 52 : 14, b: 26, l: 42 }
  const w = Math.max(280, width)
  const innerW = w - PAD.l - PAD.r
  const innerH = height - PAD.t - PAD.b

  const { min, max } = useMemo(() => {
    const vals = data.flatMap((d) => series.map((s) => Number(d[s.key] ?? 0)))
    let lo = Math.min(...vals), hi = Math.max(...vals)
    if (minZero) lo = 0
    const pad = (hi - lo) * 0.18 || 1
    return { min: Math.max(minZero ? 0 : -Infinity, lo - pad), max: hi + pad }
  }, [data, series, minZero])

  const xAt = (i: number) => PAD.l + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW)
  const yAt = (v: number) => PAD.t + innerH - ((v - min) / (max - min || 1)) * innerH

  const ticks = useMemo(
    () => Array.from({ length: yTicks + 1 }, (_, i) => min + ((max - min) / yTicks) * i),
    [min, max, yTicks]
  )

  const step = xEvery ?? Math.max(1, Math.ceil(data.length / (innerW > 620 ? 8 : 5)))

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const rel = e.clientX - rect.left
    const idx = Math.round((rel / (innerW || 1)) * (data.length - 1))
    setHover(Math.max(0, Math.min(data.length - 1, idx)))
  }

  return (
    <div ref={wrapRef} className={cn('relative w-full', className)}>
      <div ref={viewRef}>
        <svg width={w} height={height} className="block overflow-visible" role="img"
          aria-label={`Trend chart: ${series.map((s) => s.label).join(', ')}`}>
          <defs>
            {series.filter((s) => s.area).map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={dark ? 0.32 : 0.18} />
                <stop offset="70%" stopColor={s.color} stopOpacity={dark ? 0.06 : 0.03} />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {/* Recessive hairline grid — solid, one shade off the surface */}
          <g className="chart-grid">
            {ticks.map((t, i) => (
              <line key={i} x1={PAD.l} x2={PAD.l + innerW} y1={yAt(t)} y2={yAt(t)} />
            ))}
          </g>
          {ticks.map((t, i) => (
            <text key={i} x={PAD.l - 9} y={yAt(t) + 3.5} textAnchor="end"
              className="text-[10.5px] tabular-nums" fill={ink.muted}>{yFormat(t)}</text>
          ))}
          {data.map((d, i) => (i % step === 0 || i === data.length - 1) && (
            <text key={i} x={xAt(i)} y={height - 7} textAnchor={i === data.length - 1 ? 'end' : 'middle'}
              className="text-[10.5px]" fill={ink.muted}>{d.label}</text>
          ))}

          {/* Crosshair */}
          {hover !== null && (
            <line x1={xAt(hover)} x2={xAt(hover)} y1={PAD.t} y2={PAD.t + innerH}
              stroke={dark ? 'rgba(255,255,255,0.24)' : 'rgba(17,19,24,0.16)'} strokeWidth="1" />
          )}

          {series.map((s, si) => {
            const pts = data.map((d, i) => ({ x: xAt(i), y: yAt(Number(d[s.key] ?? 0)) }))
            const line = smoothPath(pts)
            const area = `${line} L ${pts[pts.length - 1].x} ${PAD.t + innerH} L ${pts[0].x} ${PAD.t + innerH} Z`
            return (
              <g key={s.key}>
                {s.area && (
                  <path d={area} fill={`url(#grad-${s.key})`}
                    style={{ opacity: seen ? 1 : 0, transition: 'opacity 700ms 350ms cubic-bezier(0.22,1,0.36,1)' }} />
                )}
                <path
                  d={line} fill="none" stroke={s.color} strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray={s.dashed ? '5 5' : undefined}
                  className={seen && !s.dashed ? 'draw-line' : undefined}
                  style={{
                    ['--len' as string]: '2600',
                    animationDelay: `${si * 120}ms`,
                    opacity: seen ? 1 : s.dashed ? 0 : 1,
                    transition: s.dashed ? 'opacity 600ms 500ms' : undefined,
                  }}
                />
                {endLabel && (
                  <g style={{ opacity: seen ? 1 : 0, transition: 'opacity 400ms 900ms' }}>
                    <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3.5" fill={s.color}
                      stroke={dark ? '#080D18' : '#fff'} strokeWidth="2" />
                    {si === 0 && (
                      <text x={pts[pts.length - 1].x + 9} y={pts[pts.length - 1].y + 4}
                        className="text-[11.5px] font-semibold tabular-nums" fill={s.color}>
                        {yFormat(Number(data[data.length - 1][s.key] ?? 0))}
                      </text>
                    )}
                  </g>
                )}
                {hover !== null && (
                  <circle cx={xAt(hover)} cy={yAt(Number(data[hover][s.key] ?? 0))} r="4.5"
                    fill={s.color} stroke={dark ? '#080D18' : '#fff'} strokeWidth="2" />
                )}
              </g>
            )
          })}

          <rect x={PAD.l} y={PAD.t} width={innerW} height={innerH} fill="transparent"
            onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
        </svg>
      </div>

      {hover !== null && (
        <ChartTooltip
          x={xAt(hover)}
          y={Math.min(...series.map((s) => yAt(Number(data[hover][s.key] ?? 0))))}
          dark={dark}
          align={hover > data.length * 0.8 ? 'right' : hover < data.length * 0.2 ? 'left' : 'center'}
        >
          <div className={cn('mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em]', dark ? 'text-white/45' : 'text-ink-4')}>
            {data[hover].label}
          </div>
          {series.map((s) => (
            <TooltipRow key={s.key} color={s.color} label={s.label} dark={dark}
              value={yFormat(Number(data[hover][s.key] ?? 0))} />
          ))}
        </ChartTooltip>
      )}
    </div>
  )
}
