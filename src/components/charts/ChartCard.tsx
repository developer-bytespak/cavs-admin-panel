import React, { useState } from 'react'
import { Table2, LineChart } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Legend, TableView } from './chart-kit'

/**
 * Wraps every plot: eyebrow + title, optional controls, a legend for ≥2 series,
 * and the table-view twin that makes every value reachable without colour.
 */
export function ChartCard({
  eyebrow, title, subtitle, controls, legend, legendActive, onLegendToggle, table, children,
  className, dark, footer, minHeight,
}: {
  eyebrow?: string
  title: React.ReactNode
  subtitle?: React.ReactNode
  controls?: React.ReactNode
  legend?: { key: string; label: string; color: string }[]
  legendActive?: Record<string, boolean>
  onLegendToggle?: (k: string) => void
  table?: { head: string[]; rows: (string | number)[][] }
  children: React.ReactNode
  className?: string
  dark?: boolean
  footer?: React.ReactNode
  minHeight?: number
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  return (
    <section className={cn(
      'rounded-2xl border shadow-card',
      dark ? 'border-white/10 bg-[#0C1424]' : 'border-line bg-card',
      className
    )}>
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0">
          {eyebrow && <div className={cn('eyebrow mb-1.5', dark && 'text-white/40')}>{eyebrow}</div>}
          <h3 className={cn('text-[15px] font-semibold tracking-[-0.011em] leading-snug', dark ? 'text-white' : 'text-ink')}>{title}</h3>
          {subtitle && <p className={cn('mt-1 text-[12.5px] leading-relaxed', dark ? 'text-white/50' : 'text-ink-3')}>{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {controls}
          {table && (
            <div className={cn('inline-flex rounded-lg p-[3px]', dark ? 'bg-white/8' : 'bg-[#F1F3F7]')}>
              {([['chart', LineChart], ['table', Table2]] as const).map(([k, Icon]) => (
                <button
                  key={k}
                  onClick={() => setView(k)}
                  aria-label={k === 'chart' ? 'Chart view' : 'Table view'}
                  aria-pressed={view === k}
                  className={cn('rounded-md px-2 py-1 transition-colors',
                    view === k
                      ? (dark ? 'bg-white/12 text-white' : 'bg-white text-ink shadow-[0_1px_2px_rgba(17,19,24,0.07)]')
                      : (dark ? 'text-white/45 hover:text-white/70' : 'text-ink-4 hover:text-ink-2'))}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="px-5 pb-5" style={minHeight ? { minHeight } : undefined}>
        {view === 'chart' ? children : table ? <TableView head={table.head} rows={table.rows} dark={dark} /> : children}
        {legend && legend.length > 1 && view === 'chart' && (
          <Legend
            items={legend}
            dark={dark}
            active={legendActive}
            onToggle={onLegendToggle}
            className={cn('mt-4 border-t pt-3', dark ? 'border-white/8' : 'border-line-soft')}
          />
        )}
      </div>
      {footer && (
        <div className={cn('border-t px-5 py-3', dark ? 'border-white/8' : 'border-line-soft bg-[#FBFCFD] rounded-b-2xl')}>
          {footer}
        </div>
      )}
    </section>
  )
}
