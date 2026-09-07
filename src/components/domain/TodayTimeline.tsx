import { useEffect, useMemo, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { cn, fmtTime, minutesOf } from '../../lib/utils'
import type { CalEvent } from '../../data/types'
import { teamById, locationById } from '../../data/mock'
import { EmptyState } from '../ui/EmptyState'
import { LiveDot } from '../ui/Badge'

const TYPE_STYLE = {
  game: { dot: 'bg-orange', ring: 'ring-orange/22', label: 'Game', text: 'text-orange' },
  practice: { dot: 'bg-royal', ring: 'ring-royal/20', label: 'Practice', text: 'text-royal' },
  evaluation: { dot: 'bg-ink-4', ring: 'ring-ink-4/22', label: 'Evaluation', text: 'text-ink-3' },
  meeting: { dot: 'bg-ink-4', ring: 'ring-ink-4/22', label: 'Meeting', text: 'text-ink-3' },
}

export function TodayTimeline({
  events, onSelect, liveIds = [],
}: { events: CalEvent[]; onSelect: (e: CalEvent) => void; liveIds?: string[] }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(t)
  }, [])

  const sorted = useMemo(() => [...events].sort((a, b) => minutesOf(a.start) - minutesOf(b.start)), [events])
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const title = (e: CalEvent) =>
    e.type === 'game' ? `${teamById(e.teamId)?.name} vs ${e.opponent}`
      : e.type === 'practice' ? `${teamById(e.teamId)?.name} Practice`
        : e.title

  const subtitle = (e: CalEvent) =>
    e.type === 'evaluation' || e.type === 'meeting' ? e.detail : locationById(e.locationId)?.name ?? ''

  if (!sorted.length) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Nothing on the calendar today"
        description="Practices, games and evaluations scheduled for today will appear here in order."
        compact
      />
    )
  }

  /* Where the "now" marker sits within the list */
  const nextIdx = sorted.findIndex((e) => minutesOf(e.start) > nowMin)

  return (
    <div className="relative">
      <div className="absolute bottom-2 left-[59px] top-2 w-px bg-line" aria-hidden="true" />
      <ol className="space-y-0">
        {sorted.map((e, i) => {
          const s = TYPE_STYLE[e.type]
          const past = minutesOf(e.start) < nowMin
          const live = liveIds.includes(e.id)
          return (
            <li key={e.id}>
              {nextIdx === i && (
                <div className="relative flex items-center gap-2 py-1.5 pl-[38px]" aria-label="Current time">
                  <span className="stat w-[42px] shrink-0 text-right text-[10.5px] text-orange">
                    {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                  <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-orange" />
                  <span className="h-px flex-1 bg-gradient-to-r from-orange/45 to-transparent" />
                </div>
              )}
              <button
                onClick={() => onSelect(e)}
                className={cn(
                  'group relative flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left transition-colors duration-150 hover:bg-[#F7F8FB]',
                  past && !live && 'opacity-55 hover:opacity-100'
                )}
              >
                <span className="stat w-[46px] shrink-0 pt-0.5 text-right text-[12.5px] text-ink-3">
                  {fmtTime(e.start).replace(' ', '')}
                </span>
                <span className={cn('relative mt-1.5 flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full ring-4 ring-white', s.dot)}>
                  {live && <span className="absolute inset-0 rounded-full bg-orange animate-ring-pulse" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[13.5px] font-medium text-ink group-hover:text-royal transition-colors">{title(e)}</span>
                    {live && (
                      <span className="inline-flex shrink-0 items-center gap-1">
                        <LiveDot />
                        <span className="font-display text-[10.5px] font-semibold uppercase tracking-wider text-orange">Live</span>
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-3">
                    <span className={cn('text-[10.5px] font-semibold uppercase tracking-[0.07em]', s.text)}>{s.label}</span>
                    <span className="text-ink-4">·</span>
                    <span className="truncate">{subtitle(e)}</span>
                  </span>
                </span>
              </button>
            </li>
          )
        })}
        {nextIdx === -1 && (
          <li className="relative flex items-center gap-2 py-1.5 pl-[38px]">
            <span className="stat w-[42px] shrink-0 text-right text-[10.5px] text-ink-4">
              {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
            <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-ink-4" />
            <span className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
          </li>
        )}
      </ol>
    </div>
  )
}
