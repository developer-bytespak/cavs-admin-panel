import { Check, Clock, AlertTriangle, XCircle, RotateCcw } from 'lucide-react'
import type { Installment, InstallmentStatus } from '../../data/types'
import { cn, fmtDate, money, relativeDay } from '../../lib/utils'

const STYLE: Record<InstallmentStatus, { dot: string; ring: string; text: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  paid: { dot: 'bg-good', ring: 'ring-good/20', text: 'text-good', label: 'Paid', icon: Check },
  upcoming: { dot: 'bg-royal', ring: 'ring-royal/18', text: 'text-royal', label: 'Upcoming', icon: Clock },
  due: { dot: 'bg-royal', ring: 'ring-royal/18', text: 'text-royal', label: 'Due', icon: Clock },
  overdue: { dot: 'bg-orange', ring: 'ring-orange/22', text: 'text-orange', label: 'Overdue', icon: AlertTriangle },
  failed: { dot: 'bg-bad', ring: 'ring-bad/20', text: 'text-bad', label: 'Failed', icon: XCircle },
  refunded: { dot: 'bg-ink-4', ring: 'ring-ink-4/20', text: 'text-ink-3', label: 'Refunded', icon: RotateCcw },
}

/**
 * The family's payment position at a glance: what has cleared, what is next,
 * and what has gone wrong. Horizontal on wide layouts, vertical when cramped.
 */
export function InstallmentTimeline({
  installments, orientation = 'horizontal', compact,
}: { installments: Installment[]; orientation?: 'horizontal' | 'vertical'; compact?: boolean }) {
  if (!installments.length) return null

  if (orientation === 'vertical') {
    return (
      <ol className="relative">
        <span className="absolute bottom-4 left-[7px] top-4 w-px bg-line" aria-hidden="true" />
        {installments.map((i) => {
          const s = STYLE[i.status]
          return (
            <li key={i.id} className="relative flex items-start gap-3 py-2.5">
              <span className={cn('mt-1 h-[15px] w-[15px] shrink-0 rounded-full ring-4 ring-white', s.dot)} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[12.5px] font-medium text-ink">Installment {i.number}</span>
                  <span className="stat text-[15px] text-ink">{money(i.amount)}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px]">
                  <span className={cn('font-semibold uppercase tracking-[0.06em]', s.text)}>{s.label}</span>
                  <span className="text-ink-4">·</span>
                  <span className="text-ink-3">
                    {i.status === 'paid' && i.paidDate ? fmtDate(i.paidDate, 'short') : fmtDate(i.dueDate, 'short')}
                  </span>
                </div>
                {i.failureReason && <p className="mt-0.5 text-[11.5px] text-bad">{i.failureReason}</p>}
              </div>
            </li>
          )
        })}
      </ol>
    )
  }

  return (
    <div className="overflow-x-auto pb-1">
      <ol className={cn('flex min-w-min gap-0', compact ? 'text-[11px]' : '')}>
        {installments.map((i, idx) => {
          const s = STYLE[i.status]
          const Icon = s.icon
          return (
            <li key={i.id} className="relative flex min-w-[128px] flex-1 flex-col">
              {/* connector */}
              {idx < installments.length - 1 && (
                <span
                  className={cn('absolute top-[13px] h-px w-full',
                    i.status === 'paid' ? 'bg-good/35' : 'bg-line')}
                  style={{ left: '50%' }}
                  aria-hidden="true"
                />
              )}
              <span className={cn(
                'relative z-10 flex h-[27px] w-[27px] items-center justify-center rounded-full ring-4 ring-white',
                s.dot
              )}>
                <Icon className="h-3.5 w-3.5 text-white" />
              </span>
              <div className="mt-2.5 pr-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-4">
                  Installment {i.number}
                </div>
                <div className="stat mt-1 text-[19px] leading-none text-ink">{money(i.amount)}</div>
                <div className={cn('mt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.07em]', s.text)}>
                  {s.label}
                </div>
                <div className="mt-0.5 text-[11.5px] text-ink-3">
                  {i.status === 'paid' && i.paidDate
                    ? fmtDate(i.paidDate, 'short')
                    : `${fmtDate(i.dueDate, 'short')}${i.status === 'due' ? ` · ${relativeDay(i.dueDate)}` : ''}`}
                </div>
                {i.failureReason && (
                  <div className="mt-1 rounded-md bg-bad-tint px-1.5 py-0.5 text-[10.5px] font-medium text-bad">
                    {i.failureReason}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** Compact paid/total bar used in tables and summary cards. */
export function BalanceBar({ paid, total, className }: { paid: number; total: number; className?: string }) {
  const pctPaid = total > 0 ? Math.min(100, (paid / total) * 100) : 0
  const complete = pctPaid >= 99.5
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11.5px] tabular-nums text-ink-3">
          <span className="font-semibold text-ink">{money(paid)}</span> of {money(total)}
        </span>
        <span className="text-[11.5px] font-semibold tabular-nums text-ink-3">{Math.round(pctPaid)}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line-soft">
        <div
          className={cn('h-full rounded-full transition-[width] duration-700 ease-premium', complete ? 'bg-good' : 'bg-royal')}
          style={{ width: `${Math.max(2, pctPaid)}%` }}
        />
      </div>
    </div>
  )
}
