import { useState } from 'react'
import { cn } from '../../lib/utils'
import { rampStep } from '../../lib/palette'
import { ChartTooltip, TooltipRow, useInViewOnce } from './chart-kit'

export interface HeatRow { id: string; label: string }
export interface HeatDatum { rowId: string; col: string; value: number; sessions: number; attendance: number }

export function Heatmap({
  rows, cols, data, maxValue = 100,
}: { rows: HeatRow[]; cols: string[]; data: HeatDatum[]; maxValue?: number }) {
  const [ref, seen] = useInViewOnce<HTMLDivElement>()
  const [hover, setHover] = useState<{ d: HeatDatum; x: number; y: number } | null>(null)
  const get = (rowId: string, col: string) => data.find((d) => d.rowId === rowId && d.col === col)
  const level = (v: number) => (v < 15 ? 'Quiet' : v < 40 ? 'Light' : v < 65 ? 'Steady' : v < 85 ? 'Busy' : 'Peak')

  return (
    <div ref={ref} className="relative">
      <div className="overflow-x-auto">
        <div className="min-w-[460px]">
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `92px repeat(${cols.length}, minmax(0,1fr))` }}>
            <div />
            {cols.map((c) => (
              <div key={c} className="pb-1 text-center text-[11px] font-medium text-ink-4">{c}</div>
            ))}
            {rows.map((r, ri) => (
              <div key={r.id} className="contents">
                <div className="flex items-center pr-2 text-[12.5px] font-medium text-ink-2 truncate">{r.label}</div>
                {cols.map((c, ci) => {
                  const d = get(r.id, c)
                  const v = d?.value ?? 0
                  const t = Math.min(1, v / maxValue)
                  return (
                    <button
                      key={c}
                      onMouseEnter={(e) => {
                        const box = e.currentTarget.getBoundingClientRect()
                        const parent = e.currentTarget.closest('[data-heat-root]')!.getBoundingClientRect()
                        if (d) setHover({ d, x: box.left - parent.left + box.width / 2, y: box.top - parent.top })
                      }}
                      onMouseLeave={() => setHover(null)}
                      aria-label={`${r.label} ${c}: ${level(v)}, ${v}% activity`}
                      className="group relative h-9 rounded-[7px] transition-transform duration-150 hover:scale-[1.06] focus:scale-[1.06]"
                      style={{
                        background: v < 6 ? '#F5F6F9' : rampStep(t),
                        opacity: seen ? 1 : 0,
                        transition: `opacity 420ms cubic-bezier(0.22,1,0.36,1) ${(ri * cols.length + ci) * 12}ms, transform 150ms`,
                      }}
                    >
                      <span className={cn('absolute inset-0 flex items-center justify-center text-[10.5px] font-semibold tabular-nums opacity-0 transition-opacity group-hover:opacity-100',
                        t > 0.6 ? 'text-white' : 'text-ink-2')}>
                        {v > 5 ? v : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-[11px] text-ink-4">Quiet</span>
        <div className="flex gap-[3px]">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => (
            <span key={t} className="h-2.5 w-6 rounded-sm" style={{ background: t === 0 ? '#F5F6F9' : rampStep(t) }} />
          ))}
        </div>
        <span className="text-[11px] text-ink-4">Peak</span>
      </div>

      <div data-heat-root className="pointer-events-none absolute inset-0">
        {hover && (
          <ChartTooltip x={hover.x} y={hover.y}>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-4">
              {rows.find((r) => r.id === hover.d.rowId)?.label} · {hover.d.col}
            </div>
            <TooltipRow label="Activity" value={level(hover.d.value)} />
            <TooltipRow label="Attendance" value={hover.d.attendance ? `${hover.d.attendance}%` : '—'} />
            <TooltipRow label="Sessions" value={hover.d.sessions} />
          </ChartTooltip>
        )}
      </div>
    </div>
  )
}
