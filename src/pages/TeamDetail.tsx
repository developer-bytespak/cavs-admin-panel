import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, CalendarDays, Dumbbell, Megaphone, Plus, UserPlus, ArrowRight,
  MapPin, ArrowRightLeft, Trash2, Eye,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { teams, teamById, staffById, locationById, rosterOf, d, announcements } from '../data/mock'
import { playerPaymentStatus } from '../data/billing'
import type { CalEvent, Player } from '../data/types'
import { cn, fmtDate, fmtTime, relativeDay } from '../lib/utils'
import { SERIES } from '../lib/palette'
import { stagger } from '../components/layout/AppShell'
import { PageHeader, MetaItem } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button, IconButton } from '../components/ui/Button'
import { Tabs } from '../components/ui/Tabs'
import { StatusBadge, Badge, LiveDot } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Avatar, TeamCrest } from '../components/ui/Avatar'
import { Modal } from '../components/ui/Modal'
import { Select, Field } from '../components/ui/Field'
import { ChartCard } from '../components/charts/ChartCard'
import { TrendChart } from '../components/charts/TrendChart'
import { CapacityBar } from '../components/charts/BarCompare'
import { EventDrawer } from '../components/domain/EventDrawer'
import { GameForm, PracticeForm } from '../components/overlays/CreateModals'
import { attendanceByTeam, attendanceWeeks } from '../data/analytics'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'roster', label: 'Roster' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'games', label: 'Games' },
  { key: 'practices', label: 'Practices' },
  { key: 'announcements', label: 'Announcements' },
]

export default function TeamDetail() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const { games, practices, players, invoices, role, visibleTeamIds, can, assignPlayerTeam, toast } = useApp()
  const [tab, setTab] = useState('overview')
  const [drawerEvent, setDrawerEvent] = useState<CalEvent | null>(null)
  const [creating, setCreating] = useState<null | 'game' | 'practice'>(null)
  const [moving, setMoving] = useState<Player | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const team = teamById(teamId ?? '')
  const today = d(0)

  if (!team || (role === 'coach' && !visibleTeamIds.includes(team.id))) {
    return (
      <Card>
        <EmptyState
          icon={Users}
          title={team ? 'This team is outside your access' : 'Team not found'}
          description={team
            ? 'Coaches can only open the teams assigned to them. Switch to the Administrator view to see every team.'
            : 'The team you are looking for may have been renamed or removed.'}
          action={<Link to="/teams"><Button variant="secondary">Back to teams</Button></Link>}
        />
      </Card>
    )
  }

  const coach = staffById(team.coachId)
  const assistant = team.assistantId ? staffById(team.assistantId) : undefined
  const roster = players.filter((p) => p.teamId === team.id)
  const teamGames = games.filter((g) => g.teamId === team.id)
  const teamPractices = practices.filter((p) => p.teamId === team.id)
  const liveGame = teamGames.find((g) => g.status === 'live')
  const nextGame = teamGames.filter((g) => g.status === 'scheduled').sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0]
  const nextPractice = teamPractices.filter((p) => p.date >= today).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0]
  const teamAnnouncements = announcements.filter((a) => a.audienceKey === team.id || a.audienceKey === 'academy' || (a.audienceKey === 'elite' && team.division === 'Elite'))
  const attendance = attendanceByTeam.find((a) => a.teamId === team.id)

  const unassigned = players.filter((p) => !p.teamId && p.status === 'active')

  const rosterCols: Column<Player>[] = [
    { key: 'player', header: 'Player', sortValue: (p) => p.last, render: (p) => (
      <Link to={`/players/${p.id}`} className="group flex items-center gap-2.5">
        <Avatar first={p.first} last={p.last} jersey={p.jersey} size="sm" />
        <div className="min-w-0">
          <div className="truncate font-medium text-ink group-hover:text-royal transition-colors">{p.first} {p.last}</div>
          <div className="text-[12px] text-ink-3">#{p.jersey} · {p.position}</div>
        </div>
      </Link>
    ) },
    { key: 'age', header: 'Age', align: 'center', sortValue: (p) => p.age, render: (p) => <span className="tabular-nums text-ink-2">{p.age}</span> },
    { key: 'reg', header: 'Registration', hideBelow: 'md', render: (p) => <StatusBadge status={p.registration} size="xs" /> },
    { key: 'pay', header: 'Payment', hideBelow: 'md', render: (p) => <StatusBadge status={playerPaymentStatus(p.id, invoices)} size="xs" /> },
    { key: 'att', header: 'Attendance', align: 'right', sortValue: (p) => p.attendance, render: (p) => (
      <div className="flex items-center justify-end gap-2">
        <span className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-line-soft sm:block">
          <span className={cn('block h-full rounded-full', p.attendance >= 90 ? 'bg-good' : p.attendance >= 80 ? 'bg-royal' : 'bg-warn')}
            style={{ width: `${p.attendance}%` }} />
        </span>
        <span className="tabular-nums font-medium text-ink">{p.attendance}%</span>
      </div>
    ) },
    { key: 'status', header: 'Status', align: 'right', render: (p) => <StatusBadge status={p.status} size="xs" /> },
  ]

  const scheduleEvents: CalEvent[] = [...teamGames, ...teamPractices]
    .filter((e) => e.date >= today)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    .slice(0, 20)

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-5">
      <motion.div variants={stagger.item}>
        <PageHeader
          breadcrumbs={[{ label: 'Teams', to: '/teams' }, { label: team.name }]}
          eyebrow={`${team.ageGroup} · ${team.division} Division`}
          title={
            <span className="flex items-center gap-3">
              <TeamCrest short={team.short} color={team.color} size="lg" />
              <span className="font-display uppercase tracking-[0.03em]">{team.name}</span>
              {liveGame && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-tint px-2 py-0.5">
                  <LiveDot />
                  <span className="font-display text-[11px] font-semibold uppercase tracking-wider text-[#C24A12]">Live</span>
                </span>
              )}
            </span>
          }
          meta={
            <>
              <MetaItem label="Coach" value={coach ? `${coach.first} ${coach.last}` : '—'} />
              {assistant && <MetaItem label="Assistant" value={`${assistant.first} ${assistant.last}`} />}
              <MetaItem label="Players" value={`${roster.length}/${team.capacity}`} />
              <MetaItem label="Record" value={`${team.record.w}–${team.record.l}`} />
              <MetaItem label="Attendance" value={`${team.attendance}%`} />
              <span><StatusBadge status="active" /></span>
            </>
          }
          actions={
            <>
              {can('send.broadcasts') && (
                <Link to={`/communications?audience=${team.id}`}>
                  <Button variant="secondary" icon={Megaphone}>Message team</Button>
                </Link>
              )}
              {can('edit.schedule') && <Button variant="accent" icon={Plus} onClick={() => setCreating('game')}>Schedule game</Button>}
            </>
          }
        />
      </motion.div>

      <motion.div variants={stagger.item}>
        <Tabs value={tab} onChange={setTab} items={TABS.map((t) => ({
          ...t,
          count: t.key === 'roster' ? roster.length : t.key === 'games' ? teamGames.length : t.key === 'practices' ? teamPractices.length : undefined,
        }))} />
      </motion.div>

      {/* -------------------- Overview -------------------- */}
      {tab === 'overview' && (
        <motion.div variants={stagger.item} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <OverviewCard
              eyebrow="Next game" accent
              title={nextGame ? `vs ${nextGame.opponent}` : 'Nothing scheduled'}
              sub={nextGame ? `${relativeDay(nextGame.date)} · ${fmtTime(nextGame.start)}` : 'Add a game to the calendar'}
              detail={nextGame ? locationById(nextGame.locationId)?.name : undefined}
              onClick={nextGame ? () => setDrawerEvent(nextGame) : undefined}
            />
            <OverviewCard
              eyebrow="Next practice"
              title={nextPractice ? nextPractice.focus : 'Nothing scheduled'}
              sub={nextPractice ? `${relativeDay(nextPractice.date)} · ${fmtTime(nextPractice.start)}` : 'Add a session'}
              detail={nextPractice ? locationById(nextPractice.locationId)?.name : undefined}
              onClick={nextPractice ? () => setDrawerEvent(nextPractice) : undefined}
            />
            <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
              <div className="eyebrow">Attendance</div>
              <div className="stat mt-2 text-[34px] leading-none text-ink">{team.attendance}%</div>
              <p className="mt-2 text-[12.5px] text-ink-3">
                {roster.filter((p) => p.attendance >= 90).length} of {roster.length} players above 90%
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
              <div className="eyebrow">Roster</div>
              <div className="mt-3">
                <CapacityBar label={`${roster.length} of ${team.capacity} spots`} filled={roster.length} capacity={team.capacity} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            {attendance && (
              <ChartCard
                eyebrow="Trend"
                title={`${team.name} attendance`}
                subtitle="Last 8 weeks of practice and game attendance"
                table={{ head: ['Week', 'Attendance'], rows: attendance.values.map((v, i) => [attendanceWeeks[i], `${v}%`]) }}
              >
                <TrendChart
                  height={228}
                  yFormat={(v) => `${Math.round(v)}%`}
                  data={attendance.values.map((v, i) => ({ label: attendanceWeeks[i], attendance: v }))}
                  series={[{ key: 'attendance', label: 'Attendance', color: SERIES[teams.findIndex((t) => t.id === team.id) % SERIES.length], area: true }]}
                />
              </ChartCard>
            )}

            <Card padded={false}>
              <div className="px-5 pb-2 pt-5">
                <CardHeader eyebrow="Recent" title="Team activity" />
              </div>
              <div className="px-5 pb-4">
                <ol className="space-y-0">
                  {teamGames.filter((g) => g.status === 'final').slice(0, 5).map((g, i) => (
                    <li key={g.id} className={cn('flex items-center gap-3 py-3', i > 0 && 'border-t border-line-soft')}>
                      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-display text-[11px] font-semibold uppercase',
                        g.score.us > g.score.them ? 'bg-good-tint text-good' : 'bg-bad-tint text-bad')}>
                        {g.score.us > g.score.them ? 'W' : 'L'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-ink">vs {g.opponent}</div>
                        <div className="text-[11.5px] text-ink-3">{fmtDate(g.date, 'short')} · {locationById(g.locationId)?.name}</div>
                      </div>
                      <span className="stat text-[15px] text-ink">{g.score.us}–{g.score.them}</span>
                    </li>
                  ))}
                  {teamGames.filter((g) => g.status === 'final').length === 0 && (
                    <li className="py-6 text-center text-[13px] text-ink-3">No completed games yet this season.</li>
                  )}
                </ol>
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* -------------------- Roster -------------------- */}
      {tab === 'roster' && (
        <motion.div variants={stagger.item} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-ink-3">
              {roster.length} of {team.capacity} spots filled ·{' '}
              {roster.filter((p) => playerPaymentStatus(p.id, invoices) !== 'paid').length} players with open balances
            </p>
            {can('manage.assignedTeams') && (
              <div className="flex gap-2">
                <Link to="/staff"><Button size="sm" variant="secondary" icon={Users}>Assign coach</Button></Link>
                <Button size="sm" variant="primary" icon={UserPlus} onClick={() => setAddOpen(true)}>Add player</Button>
              </div>
            )}
          </div>
          <DataTable
            rows={roster}
            columns={rosterCols}
            initialSort={{ key: 'player', dir: 'asc' }}
            onRowClick={(p) => navigate(`/players/${p.id}`)}
            rowActions={(p) => (
              <>
                <IconButton icon={Eye} label="View player" onClick={() => navigate(`/players/${p.id}`)} />
                <IconButton icon={ArrowRightLeft} label="Move team" onClick={() => setMoving(p)} />
                <IconButton icon={Trash2} label="Remove from roster" onClick={() => {
                  assignPlayerTeam(p.id, null)
                  toast({ tone: 'info', title: 'Player removed from roster', body: `${p.first} ${p.last} moved to the Academy Program.` })
                }} />
              </>
            )}
            empty={{
              title: 'No players on this roster yet',
              description: 'Assign players from the academy program or approve a registration to fill this team.',
              action: <Button variant="primary" icon={UserPlus} onClick={() => setAddOpen(true)}>Add player</Button>,
            }}
            footer={`${roster.length} players · average attendance ${Math.round(roster.reduce((s, p) => s + p.attendance, 0) / (roster.length || 1))}%`}
          />
        </motion.div>
      )}

      {/* -------------------- Schedule -------------------- */}
      {tab === 'schedule' && (
        <motion.div variants={stagger.item}>
          {scheduleEvents.length === 0 ? (
            <Card><EmptyState icon={CalendarDays} title="No upcoming events for this team"
              description="Schedule a game or a practice and it will appear here."
              action={can('edit.schedule') ? <Button variant="accent" icon={Plus} onClick={() => setCreating('game')}>Create game</Button> : undefined} /></Card>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
              {scheduleEvents.map((e, i) => (
                <button key={e.id} onClick={() => setDrawerEvent(e)}
                  className={cn('flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-[#FAFBFD]', i > 0 && 'border-t border-line-soft')}>
                  <span className={cn('h-9 w-[3px] shrink-0 rounded-full', e.type === 'game' ? 'bg-orange' : 'bg-royal')} />
                  <div className="w-[104px] shrink-0">
                    <div className="text-[13px] font-medium text-ink">{relativeDay(e.date)}</div>
                    <div className="text-[11.5px] text-ink-3">{fmtTime(e.start)}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium text-ink">
                      {e.type === 'game' ? `vs ${e.opponent}` : e.type === 'practice' ? e.focus : e.title}
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-ink-3">
                      <MapPin className="h-3 w-3 text-ink-4" />{locationById(e.locationId)?.name}
                    </div>
                  </div>
                  <Badge tone={e.type === 'game' ? 'orange' : 'blue'} dot={false} size="xs">
                    {e.type === 'game' ? 'Game' : 'Practice'}
                  </Badge>
                  <StatusBadge status={e.status} />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* -------------------- Games -------------------- */}
      {tab === 'games' && (
        <motion.div variants={stagger.item} className="space-y-3">
          {can('edit.schedule') && (
            <div className="flex justify-end"><Button size="sm" variant="accent" icon={Plus} onClick={() => setCreating('game')}>Create game</Button></div>
          )}
          <DataTable
            rows={[...teamGames].sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start))}
            columns={[
              { key: 'opp', header: 'Opponent', sortValue: (g) => g.opponent, render: (g) => (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">{g.opponent}</span>
                  {g.status === 'live' && <LiveDot />}
                </div>
              ) },
              { key: 'date', header: 'Date', sortValue: (g) => g.date + g.start, render: (g) => (
                <div><div className="text-ink">{fmtDate(g.date, 'day')}</div><div className="text-[12px] text-ink-3">{fmtTime(g.start)}</div></div>
              ) },
              { key: 'venue', header: 'Venue', hideBelow: 'md', render: (g) => <span className="text-ink-2">{locationById(g.locationId)?.name}</span> },
              { key: 'type', header: 'Type', hideBelow: 'lg', render: (g) => <Badge tone="neutral" dot={false} size="xs">{g.gameType}</Badge> },
              { key: 'score', header: 'Result', align: 'right', render: (g) => (
                g.status === 'scheduled' ? <span className="text-ink-4">—</span> : (
                  <span className={cn('stat text-[15px]', g.score.us > g.score.them ? 'text-good' : 'text-ink')}>
                    {g.score.us}–{g.score.them}
                  </span>
                )
              ) },
              { key: 'status', header: 'Status', align: 'right', render: (g) => <StatusBadge status={g.status} /> },
            ]}
            onRowClick={setDrawerEvent}
            empty={{ title: 'No games scheduled', description: 'This team has no games on the calendar yet.' }}
            footer={`${teamGames.filter((g) => g.status === 'final').length} played · ${teamGames.filter((g) => g.status === 'scheduled').length} upcoming`}
          />
        </motion.div>
      )}

      {/* -------------------- Practices -------------------- */}
      {tab === 'practices' && (
        <motion.div variants={stagger.item} className="space-y-3">
          {can('edit.schedule') && (
            <div className="flex justify-end"><Button size="sm" variant="primary" icon={Dumbbell} onClick={() => setCreating('practice')}>Create practice</Button></div>
          )}
          <DataTable
            rows={[...teamPractices].filter((p) => p.date >= d(-14)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))}
            columns={[
              { key: 'focus', header: 'Session', sortValue: (p) => p.focus, render: (p) => <span className="font-medium text-ink">{p.focus}</span> },
              { key: 'date', header: 'Date', sortValue: (p) => p.date + p.start, render: (p) => (
                <div><div className="text-ink">{fmtDate(p.date, 'day')}</div><div className="text-[12px] text-ink-3">{fmtTime(p.start)} – {fmtTime(p.end)}</div></div>
              ) },
              { key: 'venue', header: 'Venue', hideBelow: 'md', render: (p) => <span className="text-ink-2">{locationById(p.locationId)?.name}</span> },
              { key: 'coach', header: 'Coach', hideBelow: 'lg', render: (p) => {
                const s = staffById(p.coachId); return <span className="text-ink-2">{s ? `${s.first} ${s.last}` : '—'}</span>
              } },
              { key: 'status', header: 'Status', align: 'right', render: (p) => <StatusBadge status={p.status} /> },
            ]}
            onRowClick={setDrawerEvent}
            empty={{ title: 'No practices scheduled', description: 'Add a recurring practice block to build this team’s week.' }}
          />
        </motion.div>
      )}

      {/* -------------------- Announcements -------------------- */}
      {tab === 'announcements' && (
        <motion.div variants={stagger.item} className="space-y-3">
          {can('send.broadcasts') && (
            <div className="flex justify-end">
              <Link to={`/communications?audience=${team.id}`}><Button size="sm" variant="primary" icon={Megaphone}>New announcement</Button></Link>
            </div>
          )}
          {teamAnnouncements.length === 0 ? (
            <Card><EmptyState icon={Megaphone} title="No announcements for this team yet"
              description="Broadcasts sent to this roster or the whole academy show up here." /></Card>
          ) : (
            <div className="space-y-2.5">
              {teamAnnouncements.map((a) => (
                <Card key={a.id} className="flex flex-wrap items-start gap-4">
                  <div className="min-w-[240px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[14px] font-semibold text-ink">{a.title}</h3>
                      <StatusBadge status={a.priority} size="xs" />
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">{a.body}</p>
                    <p className="mt-2 text-[11.5px] text-ink-4">
                      {a.sentBy} · {fmtDate(a.sentAt.slice(0, 10), 'medium')} · {a.audience} · {a.recipients} recipients
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="stat text-[20px] text-ink">{a.openRate}%</div>
                    <div className="text-[11px] text-ink-4">opened</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <EventDrawer event={drawerEvent} onClose={() => setDrawerEvent(null)} />
      <GameForm open={creating === 'game'} onClose={() => setCreating(null)} />
      <PracticeForm open={creating === 'practice'} onClose={() => setCreating(null)} />

      {/* Move player */}
      <Modal
        open={!!moving} onClose={() => setMoving(null)} width="sm"
        eyebrow="Roster" title={moving ? `Move ${moving.first} ${moving.last}` : ''}
        footer={<Button variant="ghost" onClick={() => setMoving(null)}>Close</Button>}
      >
        <Field label="Move to team">
          <Select
            defaultValue={team.id}
            onChange={(e) => {
              if (!moving) return
              const target = e.target.value
              assignPlayerTeam(moving.id, target === 'none' ? null : target)
              toast({ tone: 'success', title: 'Player moved', body: `${moving.first} ${moving.last} → ${target === 'none' ? 'Academy Program' : teamById(target)?.name}.` })
              setMoving(null)
            }}
          >
            <option value="none">Academy Program — unassigned</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id} disabled={t.id !== team.id && rosterOf(t.id).length >= t.capacity}>
                {t.name} ({rosterOf(t.id).length}/{t.capacity}){t.id !== team.id && rosterOf(t.id).length >= t.capacity ? ' — full' : ''}
              </option>
            ))}
          </Select>
        </Field>
      </Modal>

      {/* Add player from academy pool */}
      <Modal
        open={addOpen} onClose={() => setAddOpen(false)} width="md"
        eyebrow={team.name} title="Add player to roster"
        footer={<Button variant="ghost" onClick={() => setAddOpen(false)}>Done</Button>}
      >
        {roster.length >= team.capacity ? (
          <div className="rounded-xl border border-[#FBDCC9] bg-orange-tint p-4 text-[13px] text-[#A93C0E]">
            This roster is full at {team.capacity} players. Remove a player or increase capacity before adding another.
          </div>
        ) : unassigned.length === 0 ? (
          <EmptyState compact title="No unassigned players" description="Everyone in the academy program is already on a roster." />
        ) : (
          <div className="max-h-[380px] space-y-1 overflow-y-auto">
            {unassigned.slice(0, 40).map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[#F7F8FB]">
                <Avatar first={p.first} last={p.last} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-ink">{p.first} {p.last}</div>
                  <div className="text-[12px] text-ink-3">Age {p.age} · {p.position} · {p.attendance}% attendance</div>
                </div>
                <Button size="xs" variant="primary" onClick={() => {
                  assignPlayerTeam(p.id, team.id)
                  toast({ tone: 'success', title: 'Player assigned', body: `${p.first} ${p.last} added to ${team.name}.` })
                }}>Add</Button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </motion.div>
  )
}

function OverviewCard({
  eyebrow, title, sub, detail, accent, onClick,
}: { eyebrow: string; title: string; sub: string; detail?: string; accent?: boolean; onClick?: () => void }) {
  const Wrapper = (onClick ? 'button' : 'div') as React.ElementType
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'group rounded-2xl border bg-card p-5 text-left shadow-card transition-all duration-200',
        onClick && 'hover:-translate-y-0.5 hover:shadow-lift',
        accent ? 'border-[#FBDCC9]' : 'border-line'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="eyebrow">{eyebrow}</span>
        {onClick && <ArrowRight className="h-3.5 w-3.5 text-ink-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />}
      </div>
      <div className="mt-2 truncate text-[16px] font-semibold tracking-[-0.011em] text-ink">{title}</div>
      <div className="mt-1 text-[12.5px] text-ink-3">{sub}</div>
      {detail && <div className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-4"><MapPin className="h-3 w-3" />{detail}</div>}
    </Wrapper>
  )
}
