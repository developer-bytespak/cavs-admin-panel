import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Navigation, Plus, Users, CalendarDays, Car, ArrowRight, Building2 } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { locations, locationById, teamById, teams, d } from '../data/mock'
import type { CalEvent } from '../data/types'
import { cn, fmtTime, relativeDay } from '../lib/utils'
import { stagger } from '../components/layout/AppShell'
import { PageHeader, MetaItem } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusBadge, Badge, LiveDot } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { TeamCrest } from '../components/ui/Avatar'
import { EventDrawer } from '../components/domain/EventDrawer'

/** Stylised court-map preview — a venue plan, not a fake satellite image. */
function VenueMap({ x, y, courts, tall }: { x: number; y: number; courts: number; tall?: boolean }) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-warm', tall ? 'h-[220px]' : 'h-[132px]')}>
      <div className="absolute inset-0 court-dots opacity-70" />
      <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <g stroke="rgba(11,31,69,0.14)" fill="none" strokeWidth="0.7">
          <path d="M0 34h200M0 78h200M52 0v120M138 0v120" />
        </g>
        <g stroke="rgba(11,31,69,0.10)" fill="none" strokeWidth="0.9">
          {Array.from({ length: courts }).map((_, i) => (
            <g key={i} transform={`translate(${16 + i * 58}, 44)`}>
              <rect width="46" height="30" rx="2" fill="rgba(240,90,26,0.05)" />
              <path d="M23 0v30" />
              <circle cx="23" cy="15" r="6" />
            </g>
          ))}
        </g>
        <g transform={`translate(${x * 2}, ${y * 1.2})`}>
          <circle r="11" fill="rgba(23,70,199,0.12)" />
          <circle r="4.5" fill="#1746C7" />
          <circle r="4.5" fill="none" stroke="#fff" strokeWidth="1.4" />
        </g>
      </svg>
      <span className="absolute bottom-2 right-2 rounded-md bg-white/85 px-1.5 py-0.5 text-[10px] font-medium text-ink-3 backdrop-blur-sm">
        {courts} court{courts > 1 ? 's' : ''}
      </span>
    </div>
  )
}

export default function Locations() {
  const { games, practices } = useApp()
  const navigate = useNavigate()
  const today = d(0)

  const stats = (locId: string) => ({
    activeGames: games.filter((g) => g.locationId === locId && g.status === 'live').length,
    todayGames: games.filter((g) => g.locationId === locId && g.date === today).length,
    upcomingPractices: practices.filter((p) => p.locationId === locId && p.date >= today && p.date <= d(7)).length,
    teams: teams.filter((t) => t.homeLocationId === locId || practices.some((p) => p.teamId === t.id && p.locationId === locId)),
  })

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={stagger.item}>
        <PageHeader
          eyebrow="Operations"
          title="Locations"
          description="Every gym and court the academy uses, with what is happening there this week and which teams call it home."
          actions={<Button variant="primary" icon={Plus} onClick={() => navigate('/settings')}>Add location</Button>}
          meta={
            <>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{locations.filter((l) => l.status === 'active').length}</strong> active venues</span>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{locations.reduce((s, l) => s + l.courts, 0)}</strong> courts</span>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{games.filter((g) => g.date === today).length}</strong> games today</span>
            </>
          }
        />
      </motion.div>

      <motion.div variants={stagger.item} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {locations.map((l) => {
          const s = stats(l.id)
          return (
            <Link key={l.id} to={`/locations/${l.id}`}
              className="group overflow-hidden rounded-2xl border border-line bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-[#DDE1E9] hover:shadow-lift">
              <div className="p-3 pb-0"><VenueMap x={l.coords.x} y={l.coords.y} courts={l.courts} /></div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-[17px] font-semibold uppercase tracking-[0.035em] text-ink">{l.name}</h3>
                    <p className="mt-0.5 truncate text-[12.5px] text-ink-3">{l.address}</p>
                    <p className="truncate text-[12.5px] text-ink-4">{l.city}</p>
                  </div>
                  {s.activeGames > 0 ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-orange-tint px-2 py-0.5">
                      <LiveDot />
                      <span className="font-display text-[10.5px] font-semibold uppercase tracking-wider text-[#C24A12]">Live</span>
                    </span>
                  ) : <StatusBadge status={l.status} size="xs" />}
                </div>

                <div className="mt-3.5 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line-soft bg-line-soft">
                  <div className="bg-white px-2.5 py-2 text-center">
                    <div className="stat text-[18px] leading-none text-ink">{s.todayGames}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.06em] text-ink-4">Today</div>
                  </div>
                  <div className="bg-white px-2.5 py-2 text-center">
                    <div className="stat text-[18px] leading-none text-ink">{s.upcomingPractices}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.06em] text-ink-4">Practices</div>
                  </div>
                  <div className="bg-white px-2.5 py-2 text-center">
                    <div className="stat text-[18px] leading-none text-ink">{s.teams.length}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.06em] text-ink-4">Teams</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                  {s.teams.slice(0, 4).map((t) => <TeamCrest key={t.id} short={t.short} color={t.color} size="sm" />)}
                  {s.teams.length > 4 && <span className="text-[12px] text-ink-3">+{s.teams.length - 4}</span>}
                  <span className="ml-auto text-[12px] font-medium text-royal opacity-0 transition-opacity group-hover:opacity-100">View →</span>
                </div>
              </div>
            </Link>
          )
        })}
      </motion.div>
    </motion.div>
  )
}

export function LocationDetail() {
  const { locationId } = useParams()
  const { games, practices } = useApp()
  const [drawerEvent, setDrawerEvent] = useState<CalEvent | null>(null)
  const today = d(0)

  const loc = locationById(locationId ?? '')

  const events = useMemo<CalEvent[]>(() => {
    if (!loc) return []
    return [
      ...games.filter((g) => g.locationId === loc.id && g.date >= today),
      ...practices.filter((p) => p.locationId === loc.id && p.date >= today),
    ].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 14)
  }, [games, practices, loc, today])

  if (!loc) {
    return <Card><EmptyState icon={MapPin} title="Location not found"
      description="This venue may have been removed from the academy list."
      action={<Link to="/locations"><Button variant="secondary">Back to locations</Button></Link>} /></Card>
  }

  const assignedTeams = teams.filter((t) => t.homeLocationId === loc.id || practices.some((p) => p.teamId === t.id && p.locationId === loc.id))
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(`${loc.address} ${loc.city}`)}`

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-5">
      <motion.div variants={stagger.item}>
        <PageHeader
          breadcrumbs={[{ label: 'Locations', to: '/locations' }, { label: loc.name }]}
          eyebrow={`${loc.courts} court${loc.courts > 1 ? 's' : ''} · capacity ${loc.capacity}`}
          title={<span className="font-display uppercase tracking-[0.03em]">{loc.name}</span>}
          meta={<>
            <span><StatusBadge status={loc.status} /></span>
            <MetaItem label="Address" value={`${loc.address}, ${loc.city}`} />
          </>}
          actions={
            <a href={mapsUrl} target="_blank" rel="noreferrer">
              <Button variant="primary" icon={Navigation}>Directions</Button>
            </a>
          }
        />
      </motion.div>

      <motion.div variants={stagger.item} className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-4">
          <Card padded={false} className="overflow-hidden">
            <div className="p-3 pb-0"><VenueMap x={loc.coords.x} y={loc.coords.y} courts={loc.courts} tall /></div>
            <div className="p-5">
              <CardHeader eyebrow="Venue" title="Facility details" />
              <dl className="mt-3 divide-y divide-line-soft">
                <Row icon={Building2} label="Address" value={<span>{loc.address}<span className="block text-[12px] text-ink-3">{loc.city}</span></span>} />
                <Row icon={Users} label="Capacity" value={`${loc.capacity} spectators`} />
                <Row icon={Car} label="Parking" value={loc.parking} />
                <Row icon={MapPin} label="Courts" value={`${loc.courts} full court${loc.courts > 1 ? 's' : ''}`} />
              </dl>
              <p className="mt-4 rounded-xl border border-line bg-[#FBFCFD] p-3.5 text-[13px] leading-relaxed text-ink-2">{loc.notes}</p>
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Teams" title="Assigned teams" subtitle={`${assignedTeams.length} teams train or play here`} />
            {assignedTeams.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-line p-4 text-center text-[13px] text-ink-3">
                No teams are currently assigned to this venue.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {assignedTeams.map((t) => (
                  <Link key={t.id} to={`/teams/${t.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 transition-all hover:border-[#D9DDE5] hover:shadow-card">
                    <TeamCrest short={t.short} color={t.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-ink group-hover:text-royal transition-colors">{t.name}</div>
                      <div className="text-[11.5px] text-ink-3">
                        {t.homeLocationId === loc.id ? 'Home venue' : 'Practices here'} · {t.ageGroup}
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-ink-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card padded={false}>
          <div className="px-5 pb-2 pt-5">
            <CardHeader eyebrow="Schedule" title="Upcoming events at this venue"
              subtitle={`${events.length} games and practices in the next few weeks`} />
          </div>
          {events.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No upcoming events here"
              description="Games and practices scheduled at this venue will appear in order." compact />
          ) : (
            <div className="px-2 pb-3">
              {events.map((e) => {
                const t = 'teamId' in e && e.teamId ? teamById(e.teamId) : null
                return (
                  <button key={e.id} onClick={() => setDrawerEvent(e)}
                    className="flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#F7F8FB]">
                    <span className={cn('h-9 w-[3px] shrink-0 rounded-full', e.type === 'game' ? 'bg-orange' : 'bg-royal')} />
                    <div className="w-[96px] shrink-0">
                      <div className="text-[12.5px] font-medium text-ink">{relativeDay(e.date)}</div>
                      <div className="text-[11.5px] text-ink-3">{fmtTime(e.start)}</div>
                    </div>
                    {t && <TeamCrest short={t.short} color={t.color} size="sm" />}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-ink">
                        {e.type === 'game' ? `${t?.name} vs ${e.opponent}` : e.type === 'practice' ? `${t?.name} — ${e.focus}` : e.title}
                      </div>
                      <div className="text-[11.5px] text-ink-3">
                        {e.type === 'game' ? `${e.gameType} game · arrive ${fmtTime(e.arrival)}` : e.type === 'practice' ? `Practice · until ${fmtTime(e.end)}` : e.detail}
                      </div>
                    </div>
                    <Badge tone={e.type === 'game' ? 'orange' : 'blue'} dot={false} size="xs">{e.type === 'game' ? 'Game' : 'Practice'}</Badge>
                  </button>
                )
              })}
            </div>
          )}
        </Card>
      </motion.div>

      <EventDrawer event={drawerEvent} onClose={() => setDrawerEvent(null)} />
    </motion.div>
  )
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-4" />
      <div className="min-w-0 flex-1">
        <div className="text-[11.5px] uppercase tracking-[0.06em] text-ink-4">{label}</div>
        <div className="mt-0.5 text-[13px] text-ink">{value}</div>
      </div>
    </div>
  )
}
