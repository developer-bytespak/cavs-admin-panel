import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, CalendarDays, List, Trophy, Dumbbell, Plus, MapPin, Clock, CalendarX2,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { teams, locations, staff, teamById, locationById, staffById, otherEvents, d } from '../data/mock'
import type { CalEvent } from '../data/types'
import { cn, fmtDate, fmtTime, minutesOf, relativeDay } from '../lib/utils'
import { stagger } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Segmented } from '../components/ui/Tabs'
import { FilterBar, FilterSelect } from '../components/ui/FilterBar'
import { StatusBadge, Badge, LiveDot } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { DataTable, type Column } from '../components/ui/DataTable'
import { TeamCrest } from '../components/ui/Avatar'
import { CalendarGrid } from '../components/domain/CalendarGrid'
import { EventDrawer } from '../components/domain/EventDrawer'
import { GameForm, PracticeForm } from '../components/overlays/CreateModals'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const VIEWS = [
  { key: 'calendar', label: 'Calendar', icon: CalendarDays },
  { key: 'agenda', label: 'Agenda', icon: List },
  { key: 'games', label: 'Games', icon: Trophy },
  { key: 'practices', label: 'Practices', icon: Dumbbell },
]

export default function Schedule() {
  const { games, practices, role, visibleTeamIds, can } = useApp()
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState('calendar')
  const [month, setMonth] = useState(() => new Date())
  const [drawerEvent, setDrawerEvent] = useState<CalEvent | null>(null)
  const [creating, setCreating] = useState<null | 'game' | 'practice'>(null)

  const [team, setTeam] = useState('all')
  const [coach, setCoach] = useState('all')
  const [age, setAge] = useState('all')
  const [location, setLocation] = useState('all')
  const [type, setType] = useState('all')

  const scopedTeams = useMemo(
    () => (role === 'admin' ? teams : teams.filter((t) => visibleTeamIds.includes(t.id))),
    [role, visibleTeamIds]
  )

  const allEvents = useMemo<CalEvent[]>(() => {
    const scope = (id: string | null) => role === 'admin' || (id && visibleTeamIds.includes(id))
    return [
      ...games.filter((g) => scope(g.teamId)),
      ...practices.filter((p) => scope(p.teamId)),
      ...(role === 'admin' ? otherEvents : []),
    ]
  }, [games, practices, role, visibleTeamIds])

  const filtered = useMemo(() => allEvents.filter((e) => {
    if (type !== 'all' && e.type !== type) return false
    if (team !== 'all' && ('teamId' in e ? e.teamId !== team : true)) return false
    if (age !== 'all') {
      const t = 'teamId' in e && e.teamId ? teamById(e.teamId) : null
      if (!t || t.ageGroup !== age) return false
    }
    if (location !== 'all' && e.locationId !== location) return false
    if (coach !== 'all') {
      if (e.type === 'practice') { if (e.coachId !== coach) return false }
      else if ('teamId' in e && e.teamId) { if (teamById(e.teamId)?.coachId !== coach) return false }
      else return false
    }
    return true
  }), [allEvents, type, team, age, location, coach])

  /* Deep link from the command palette: ?event=g-002 */
  useEffect(() => {
    const id = params.get('event')
    if (!id) return
    const found = allEvents.find((e) => e.id === id)
    if (found) { setDrawerEvent(found); setMonth(new Date(`${found.date}T12:00`)) }
    params.delete('event')
    setParams(params, { replace: true })
  }, [params, allEvents, setParams])

  const activeFilters = [team, coach, age, location, type].filter((v) => v !== 'all').length
  const clearFilters = () => { setTeam('all'); setCoach('all'); setAge('all'); setLocation('all'); setType('all') }

  const today = d(0)
  const upcoming = useMemo(
    () => [...filtered].filter((e) => e.date >= today).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)),
    [filtered, today]
  )

  const gameRows = useMemo(
    () => filtered.filter((e): e is Extract<CalEvent, { type: 'game' }> => e.type === 'game')
      .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start)),
    [filtered]
  )
  const practiceRows = useMemo(
    () => filtered.filter((e): e is Extract<CalEvent, { type: 'practice' }> => e.type === 'practice')
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)),
    [filtered]
  )

  const gameCols: Column<Extract<CalEvent, { type: 'game' }>>[] = [
    {
      key: 'matchup', header: 'Matchup', sortValue: (r) => teamById(r.teamId)?.name ?? '',
      render: (r) => {
        const t = teamById(r.teamId)!
        return (
          <div className="flex items-center gap-2.5">
            <TeamCrest short={t.short} color={t.color} size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-medium text-ink">{t.name}</span>
                {r.status === 'live' && <LiveDot />}
              </div>
              <div className="truncate text-[12px] text-ink-3">vs {r.opponent}</div>
            </div>
          </div>
        )
      },
    },
    { key: 'when', header: 'Date', sortValue: (r) => r.date + r.start, render: (r) => (
      <div><div className="text-ink">{fmtDate(r.date, 'day')}</div><div className="text-[12px] text-ink-3">{fmtTime(r.start)}</div></div>
    ) },
    { key: 'venue', header: 'Venue', hideBelow: 'md', sortValue: (r) => locationById(r.locationId)?.name ?? '',
      render: (r) => <span className="text-ink-2">{locationById(r.locationId)?.name}</span> },
    { key: 'type', header: 'Type', hideBelow: 'lg', render: (r) => <Badge tone="neutral" dot={false}>{r.gameType}</Badge> },
    { key: 'score', header: 'Score', align: 'right', render: (r) => (
      r.status === 'scheduled' || r.status === 'canceled'
        ? <span className="text-ink-4">—</span>
        : <span className="stat text-[15px] text-ink">{r.score.us}–{r.score.them}</span>
    ) },
    { key: 'status', header: 'Status', align: 'right', render: (r) => <StatusBadge status={r.status} /> },
  ]

  const practiceCols: Column<Extract<CalEvent, { type: 'practice' }>>[] = [
    { key: 'team', header: 'Team', sortValue: (r) => teamById(r.teamId)?.name ?? '', render: (r) => {
      const t = teamById(r.teamId)!
      return (
        <div className="flex items-center gap-2.5">
          <TeamCrest short={t.short} color={t.color} size="sm" />
          <div className="min-w-0">
            <div className="truncate font-medium text-ink">{t.name}</div>
            <div className="truncate text-[12px] text-ink-3">{r.focus}</div>
          </div>
        </div>
      )
    } },
    { key: 'when', header: 'Date', sortValue: (r) => r.date + r.start, render: (r) => (
      <div><div className="text-ink">{fmtDate(r.date, 'day')}</div><div className="text-[12px] text-ink-3">{fmtTime(r.start)} – {fmtTime(r.end)}</div></div>
    ) },
    { key: 'venue', header: 'Venue', hideBelow: 'md', render: (r) => <span className="text-ink-2">{locationById(r.locationId)?.name}</span> },
    { key: 'coach', header: 'Coach', hideBelow: 'lg', render: (r) => {
      const s = staffById(r.coachId)
      return <span className="text-ink-2">{s ? `${s.first} ${s.last}` : '—'}</span>
    } },
    { key: 'repeat', header: 'Repeat', hideBelow: 'lg', render: (r) => (
      r.repeat && r.repeat !== 'none'
        ? <Badge tone="blue" dot={false} size="xs">{r.repeat}</Badge>
        : <span className="text-ink-4">Once</span>
    ) },
    { key: 'status', header: 'Status', align: 'right', render: (r) => <StatusBadge status={r.status} /> },
  ]

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={stagger.item}>
        <PageHeader
          eyebrow="Operations"
          title="Schedule"
          description="Every game, practice and evaluation across the academy — one calendar, updated for everyone the moment it changes."
          actions={can('edit.schedule') && (
            <>
              <Button variant="secondary" icon={Dumbbell} onClick={() => setCreating('practice')}>New practice</Button>
              <Button variant="accent" icon={Plus} onClick={() => setCreating('game')}>Create game</Button>
            </>
          )}
        />
      </motion.div>

      <motion.div variants={stagger.item} className="flex flex-wrap items-center gap-3">
        <Segmented value={view} onChange={setView} items={VIEWS} />
        {view === 'calendar' && (
          <div className="flex items-center gap-1">
            <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              aria-label="Previous month"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink-3 transition-colors hover:text-ink">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[148px] px-2 text-center text-[13.5px] font-semibold text-ink">
              {MONTHS[month.getMonth()]} {month.getFullYear()}
            </span>
            <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              aria-label="Next month"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink-3 transition-colors hover:text-ink">
              <ChevronRight className="h-4 w-4" />
            </button>
            <Button size="sm" variant="ghost" onClick={() => setMonth(new Date())}>Today</Button>
          </div>
        )}
        <div className="ml-auto flex items-center gap-3 text-[12px] text-ink-3">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[3px] bg-orange" /> Game</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[3px] bg-royal" /> Practice</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[3px] bg-ink-4" /> Evaluation</span>
        </div>
      </motion.div>

      <motion.div variants={stagger.item}>
        <FilterBar active={activeFilters} onClear={clearFilters}>
          <FilterSelect label="Team" value={team} onChange={setTeam} options={scopedTeams.map((t) => ({ value: t.id, label: t.name }))} />
          <FilterSelect label="Coach" value={coach} onChange={setCoach} options={staff.filter((s) => s.role.includes('Coach')).map((s) => ({ value: s.id, label: `${s.first} ${s.last}` }))} />
          <FilterSelect label="Age" value={age} onChange={setAge} options={[...new Set(scopedTeams.map((t) => t.ageGroup))].map((a) => ({ value: a, label: a }))} />
          <FilterSelect label="Venue" value={location} onChange={setLocation} options={locations.map((l) => ({ value: l.id, label: l.name }))} />
          <FilterSelect label="Type" value={type} onChange={setType} options={[
            { value: 'game', label: 'Games' }, { value: 'practice', label: 'Practices' }, { value: 'evaluation', label: 'Evaluations' }, { value: 'meeting', label: 'Meetings' },
          ]} />
        </FilterBar>
      </motion.div>

      <motion.div variants={stagger.item}>
        {view === 'calendar' && (
          filtered.length === 0 ? (
            <Card><EmptyState icon={CalendarX2} title="No events match these filters"
              description="Adjust or clear the filters above to see the rest of the schedule."
              action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>} /></Card>
          ) : (
            <CalendarGrid month={month} events={filtered} onSelect={setDrawerEvent} todayIso={today} />
          )
        )}

        {view === 'agenda' && <AgendaView events={upcoming} onSelect={setDrawerEvent} onClear={clearFilters} />}

        {view === 'games' && (
          <DataTable
            rows={gameRows}
            columns={gameCols}
            onRowClick={setDrawerEvent}
            initialSort={{ key: 'when', dir: 'desc' }}
            empty={{ title: 'No games match these filters', description: 'Try a different team, venue or date range.', action: <Button variant="secondary" onClick={clearFilters}>Clear filters</Button> }}
            footer={`${gameRows.length} games`}
          />
        )}

        {view === 'practices' && (
          <DataTable
            rows={practiceRows}
            columns={practiceCols}
            onRowClick={setDrawerEvent}
            initialSort={{ key: 'when', dir: 'asc' }}
            empty={{ title: 'No practices match these filters', description: 'Try a different team, coach or venue.', action: <Button variant="secondary" onClick={clearFilters}>Clear filters</Button> }}
            footer={`${practiceRows.length} practices`}
          />
        )}
      </motion.div>

      <EventDrawer event={drawerEvent} onClose={() => setDrawerEvent(null)} />
      <GameForm open={creating === 'game'} onClose={() => setCreating(null)} />
      <PracticeForm open={creating === 'practice'} onClose={() => setCreating(null)} />
    </motion.div>
  )
}

function AgendaView({ events, onSelect, onClear }: { events: CalEvent[]; onSelect: (e: CalEvent) => void; onClear: () => void }) {
  const grouped = useMemo(() => {
    const map: Record<string, CalEvent[]> = {}
    for (const e of events) (map[e.date] ??= []).push(e)
    for (const k of Object.keys(map)) map[k].sort((a, b) => minutesOf(a.start) - minutesOf(b.start))
    return Object.entries(map).slice(0, 24)
  }, [events])

  if (!grouped.length) {
    return (
      <Card>
        <EmptyState icon={CalendarX2} title="No upcoming events" description="Nothing matches these filters from today forward."
          action={<Button variant="secondary" onClick={onClear}>Clear filters</Button>} />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {grouped.map(([date, list]) => (
        <div key={date}>
          <div className="mb-2 flex items-baseline gap-2.5">
            <h3 className="font-display text-[15px] font-semibold uppercase tracking-[0.05em] text-ink">{relativeDay(date)}</h3>
            <span className="text-[12.5px] text-ink-3">{fmtDate(date, 'long')}</span>
            <span className="ml-auto text-[12px] text-ink-4 tabular-nums">{list.length} event{list.length > 1 ? 's' : ''}</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
            {list.map((e, i) => {
              const t = 'teamId' in e && e.teamId ? teamById(e.teamId) : null
              const title = e.type === 'game' ? `${t?.name} vs ${e.opponent}` : e.type === 'practice' ? `${t?.name} Practice` : e.title
              const sub = e.type === 'practice' ? e.focus : e.type === 'game' ? `${e.gameType} game · arrive ${fmtTime(e.arrival)}` : e.detail
              return (
                <button
                  key={e.id}
                  onClick={() => onSelect(e)}
                  className={cn('flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-[#FAFBFD]',
                    i > 0 && 'border-t border-line-soft')}
                >
                  <div className="w-[72px] shrink-0 text-right">
                    <div className="stat text-[14px] leading-tight text-ink">{fmtTime(e.start)}</div>
                    {'end' in e && e.end && <div className="text-[11.5px] text-ink-4">to {fmtTime(e.end)}</div>}
                  </div>
                  <span className={cn('h-9 w-[3px] shrink-0 rounded-full',
                    e.type === 'game' ? 'bg-orange' : e.type === 'practice' ? 'bg-royal' : 'bg-ink-4')} />
                  {t ? <TeamCrest short={t.short} color={t.color} size="sm" /> : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F1F3F7] text-ink-3">
                      <Clock className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13.5px] font-medium text-ink">{title}</span>
                      {e.type === 'game' && e.status === 'live' && <LiveDot />}
                    </div>
                    <div className="truncate text-[12px] text-ink-3">{sub}</div>
                  </div>
                  <span className="hidden items-center gap-1.5 text-[12px] text-ink-3 sm:flex">
                    <MapPin className="h-3.5 w-3.5 text-ink-4" />
                    {locationById(e.locationId)?.name}
                  </span>
                  <StatusBadge status={e.status} />
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
