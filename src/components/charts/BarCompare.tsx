import { useState } from 'react'
import { cn } from '../../lib/utils'
import { useInViewOnce } from './chart-kit'

export interface BarDatum { id: string; label: string; value: number; sub?: string; color?: string }

/** One series, one colour — bar length already encodes magnitude. */
export function BarCompare({
  data, format = (v: number) => String(v), color = '#1746C7', max, onSelect, highlight, dark, dense,
}: {
  data: BarDatum[]; format?: (v: number) => string; color?: string; max?: number
  onSelect?: (id: string) => void; highlight?: string; dark?: boolean; dense?: boolean
}) {
  const [ref, seen] = useInViewOnce<HTMLDivElement>()
  const [hover, setHover] = useState<string | null>(null)
  const top = max ?? Math.max(...data.map((d) => d.value)) * 1.06

  return (
    <div ref={ref} className={cn('space-y-2.5', dense && 'space-y-2')}>
      {data.map((d, i) => {
        const on = hover === null || hover === d.id
        const isHi = highlight === d.id
        return (
          <button
            key={d.id}
            onClick={() => onSelect?.(d.id)}
            onMouseEnter={() => setHover(d.id)}
            onMouseLeave={() => setHover(null)}
            className={cn('group block w-full text-left', onSelect && 'cursor-pointer')}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className={cn('truncate text-[12.5px] transition-colors',
                dark ? (on ? 'text-white/85' : 'text-white/40') : (on ? 'text-ink-2' : 'text-ink-4'),
                isHi && 'font-semibold')}>
                {d.label}
              </span>
              <span className={cn('shrink-0 text-[12.5px] font-semibold tabular-nums', dark ? 'text-white' : 'text-ink')}>
                {format(d.value)}
              </span>
            </div>
            <div className={cn('mt-1 h-2 w-full overflow-hidden rounded-full', dark ? 'bg-white/8' : 'bg-line-soft')}>
              <div
                className="h-full rounded-full origin-left transition-[transform,opacity] duration-[800ms] ease-premium"
                style={{
                  background: d.color ?? color,
                  width: `${Math.max(1.5, (d.value / top) * 100)}%`,
                  transform: `scaleX(${seen ? 1 : 0})`,
                  transitionDelay: `${i * 55}ms`,
                  opacity: on ? 1 : 0.4,
                }}
              />
            </div>
            {d.sub && (
              <div className={cn('mt-1 text-[11.5px]', dark ? 'text-white/45' : 'text-ink-3')}>{d.sub}</div>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Roster capacity — a full team gets the one orange indicator on the page. */
export function CapacityBar({ filled, capacity, label, sub, onClick }: { filled: number; capacity: number; label: string; sub?: string; onClick?: () => void }) {
  const full = filled >= capacity
  const pctFilled = Math.min(100, (filled / capacity) * 100)
  return (
    <button onClick={onClick} className="group block w-full text-left" disabled={!onClick}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-[13px] font-medium text-ink group-hover:text-royal transition-colors">{label}</span>
        <span className={cn('shrink-0 text-[12.5px] font-semibold tabular-nums', full ? 'text-orange' : 'text-ink-2')}>
          {filled} / {capacity}
        </span>
      </div>
      <div className="mt-1.5 flex gap-[3px]">
        {Array.from({ length: capacity }).map((_, i) => (
          <span
            key={i}
            className={cn('h-1.5 flex-1 rounded-full transition-colors duration-300',
              i < filled ? (full ? 'bg-orange' : 'bg-royal') : 'bg-line-soft')}
            style={{ transitionDelay: `${i * 24}ms` }}
          />
        ))}
      </div>
      {sub && <div className="mt-1.5 text-[11.5px] text-ink-3">{sub}</div>}
      {full && <div className="mt-1.5 text-[11.5px] font-medium text-orange">Roster full — waitlist next signup</div>}
      <span className="sr-only">{pctFilled.toFixed(0)}% full</span>
    </button>
  )
}
