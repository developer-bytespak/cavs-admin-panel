import { useMemo } from 'react'
import { cn, minutesOf } from '../../lib/utils'
import type { CalEvent } from '../../data/types'
import { teamById } from '../../data/mock'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const CHIP = {
  game: 'bg-orange-tint text-[#A93C0E] ring-[#F8D3BE] hover:bg-[#FFE4D5]',
  practice: 'bg-royal-tint text-[#123796] ring-[#D5E1FC] hover:bg-[#E2EAFE]',
  evaluation: 'bg-[#F1F3F7] text-ink-2 ring-[#E3E6EC] hover:bg-[#EAEDF2]',
  meeting: 'bg-[#F1F3F7] text-ink-2 ring-[#E3E6EC] hover:bg-[#EAEDF2]',
}

export function CalendarGrid({
  month, events, onSelect, todayIso,
}: { month: Date; events: CalEvent[]; onSelect: (e: CalEvent) => void; todayIso: string }) {
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const start = new Date(first)
    start.setDate(1 - first.getDay())
    return Array.from({ length: 42 }, (_, i) => {
      const dt = new Date(start)
      dt.setDate(start.getDate() + i)
      return dt
    })
  }, [month])

  const isoOf = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`

  const byDate = useMemo(() => {
    const map: Record<string, CalEvent[]> = {}
    for (const e of events) (map[e.date] ??= []).push(e)
    for (const k of Object.keys(map)) map[k].sort((a, b) => minutesOf(a.start) - minutesOf(b.start))
    return map
  }, [events])

  const label = (e: CalEvent) =>
    e.type === 'game' ? `${teamById(e.teamId)?.short} vs ${e.opponent.split(' ')[0]}`
      : e.type === 'practice' ? `${teamById(e.teamId)?.short} practice`
        : e.title

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
      <div className="grid grid-cols-7 border-b border-line bg-[#FBFCFD]">
        {DOW.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">
            <span className="hidden sm:inline">{d}</span><span className="sm:hidden">{d[0]}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((dt, i) => {
          const iso = isoOf(dt)
          const inMonth = dt.getMonth() === month.getMonth()
          const isToday = iso === todayIso
          const dayEvents = byDate[iso] ?? []
          return (
            <div
              key={i}
              className={cn(
                'relative min-h-[104px] border-b border-r border-line-soft p-1.5 transition-colors sm:min-h-[124px]',
                i % 7 === 6 && 'border-r-0',
                i >= 35 && 'border-b-0',
                !inMonth && 'bg-[#FCFCFD]'
              )}
            >
              <div className="mb-1 flex items-center justify-between px-0.5">
                <span className={cn(
                  'inline-flex h-[21px] min-w-[21px] items-center justify-center rounded-md px-1 text-[11.5px] font-semibold tabular-nums',
                  isToday ? 'bg-orange text-white' : inMonth ? 'text-ink-2' : 'text-ink-4'
                )}>
                  {dt.getDate()}
                </span>
                {dayEvents.length > 2 && (
                  <span className="text-[10px] font-medium tabular-nums text-ink-4">{dayEvents.length}</span>
                )}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((e) => (
                  <button
                    key={e.id}
                    onClick={() => onSelect(e)}
                    title={label(e)}
                    className={cn(
                      'flex w-full items-center gap-1 rounded-md px-1.5 py-[3px] text-left text-[11px] font-medium ring-1 ring-inset transition-colors',
                      CHIP[e.type],
                      !inMonth && 'opacity-55'
                    )}
                  >
                    {e.type === 'game' && e.status === 'live' && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange animate-live-pulse" />
                    )}
                    <span className="truncate">{label(e)}</span>
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <button
                    onClick={() => onSelect(dayEvents[3])}
                    className="w-full rounded-md px-1.5 py-[2px] text-left text-[10.5px] font-medium text-ink-3 hover:text-royal"
                  >
                    +{dayEvents.length - 3} more
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
