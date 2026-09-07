import { useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import { RAMP_BLUE } from '../../lib/palette'
import { useInViewOnce } from './chart-kit'

export interface FunnelStage { key: string; label: string; value: number; hint?: string }

/**
 * Ordered stages, so the ordinal ramp (one hue, light → dark) is the correct
 * encoding rather than six categorical hues.
 */
export function FunnelFlow({
  stages, orientation = 'vertical', onStageClick,
}: { stages: FunnelStage[]; orientation?: 'vertical' | 'horizontal'; onStageClick?: (key: string) => void }) {
  const [ref, seen] = useInViewOnce<HTMLDivElement>()
  const [hover, setHover] = useState<string | null>(null)
  const top = stages[0]?.value || 1
  const rampAt = (i: number) => RAMP_BLUE[Math.min(RAMP_BLUE.length - 1, 2 + i)]

  if (orientation === 'horizontal') {
    return (
      <div ref={ref} className="flex items-stretch gap-2">
        {stages.map((s, i) => {
          const prev = i > 0 ? stages[i - 1].value : s.value
          const conv = Math.round((s.value / prev) * 100)
          return (
            <div key={s.key} className="flex flex-1 items-center gap-2">
              <button
                onClick={() => onStageClick?.(s.key)}
                onMouseEnter={() => setHover(s.key)} onMouseLeave={() => setHover(null)}
                className={cn('group flex-1 rounded-xl border border-line bg-white p-3.5 text-left transition-all duration-200',
                  onStageClick && 'hover:-translate-y-0.5 hover:shadow-lift')}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-[3px]" style={{ background: rampAt(i) }} />
                  <span className="eyebrow">{s.label}</span>
                </div>
                <div className="stat mt-2 text-[26px] leading-none text-ink">{s.value}</div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-line-soft">
                  <div className="h-full rounded-full origin-left transition-transform duration-[900ms] ease-premium"
                    style={{ background: rampAt(i), transform: `scaleX(${seen ? s.value / top : 0})`, transitionDelay: `${i * 110}ms` }} />
                </div>
                {i > 0 && <div className="mt-2 text-[11.5px] text-ink-3 tabular-nums">{conv}% from previous</div>}
                {i === 0 && s.hint && <div className="mt-2 text-[11.5px] text-ink-3">{s.hint}</div>}
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div ref={ref} className="space-y-0">
      {stages.map((s, i) => {
        const width = (s.value / top) * 100
        const on = hover === null || hover === s.key
        return (
          <div key={s.key}>
            <button
              onClick={() => onStageClick?.(s.key)}
              onMouseEnter={() => setHover(s.key)} onMouseLeave={() => setHover(null)}
              className="group w-full text-left"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className={cn('text-[12.5px] font-medium transition-colors', on ? 'text-ink' : 'text-ink-4')}>{s.label}</span>
                <span className="stat text-[19px] leading-none text-ink">{s.value}</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-line-soft">
                <div
                  className="h-full rounded-full origin-left transition-all duration-[900ms] ease-premium"
                  style={{
                    background: rampAt(i),
                    width: `${width}%`,
                    transform: `scaleX(${seen ? 1 : 0})`,
                    transitionDelay: `${i * 110}ms`,
                    opacity: on ? 1 : 0.4,
                  }}
                />
              </div>
              {s.hint && (
                <div className={cn('mt-1 text-[11.5px] transition-opacity', on ? 'text-ink-3 opacity-100' : 'opacity-0')}>{s.hint}</div>
              )}
            </button>
            {i < stages.length - 1 && (
              <div className="flex items-center gap-2 py-2 pl-0.5">
                <ArrowDown className="h-3.5 w-3.5 text-ink-4" />
                <span className="text-[11.5px] text-ink-3 tabular-nums">
                  {Math.round((stages[i + 1].value / s.value) * 100)}% continue
                </span>
                <span className="ml-auto text-[11.5px] text-ink-4 tabular-nums">
                  −{s.value - stages[i + 1].value} drop-off
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
