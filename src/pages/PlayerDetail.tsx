import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, Phone, Mail, ArrowRightLeft, MessageSquare, CalendarDays, MapPin,
  StickyNote, Plus, TrendingUp, TrendingDown, Minus, CreditCard, ClipboardCheck,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { teams, teamById, staffById, locationById, rosterOf, developmentLog, d, PROGRAMS } from '../data/mock'
import type { CalEvent } from '../data/types'
import { cn, fmtDate, fmtTime, money, relativeDay } from '../lib/utils'
import { SERIES } from '../lib/palette'
import { stagger } from '../components/layout/AppShell'
import { PageHeader, MetaItem } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Tabs } from '../components/ui/Tabs'
import { StatusBadge, Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Avatar, TeamCrest } from '../components/ui/Avatar'
import { Modal } from '../components/ui/Modal'
import { Field, Select, Textarea } from '../components/ui/Field'
import { ChartCard } from '../components/charts/ChartCard'
import { TrendChart } from '../components/charts/TrendChart'
import { EventDrawer } from '../components/domain/EventDrawer'
import { ActivityFeed } from '../components/domain/ActivityFeed'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'activity', label: 'Activity' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'registration', label: 'Registration' },
  { key: 'evaluation', label: 'Evaluation' },
  { key: 'payments', label: 'Payments' },
  { key: 'notes', label: 'Notes' },
]

export default function PlayerDetail() {
  const { playerId } = useParams()
  const { players, games, practices, payments, role, visibleTeamIds, assignPlayerTeam, toast, can } = useApp()
  const [tab, setTab] = useState('overview')
  const [moving, setMoving] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState('')
  const [drawerEvent, setDrawerEvent] = useState<CalEvent | null>(null)
  const [localNotes, setLocalNotes] = useState<{ id: string; author: string; date: string; body: string }[]>([])

  const player = players.find((p) => p.id === playerId)
  const today = d(0)

  const attendanceSeries = useMemo(
    () => Array.from({ length: 8 }, (_, i) => ({
      label: `W${i + 1}`,
      attendance: player
        ? Math.max(60, Math.min(100, Math.round(player.attendance - 6 + i * 0.9 + Math.sin(i * 1.4 + player.jersey) * 4)))
        : 0,
    })),
    [player]
  )

  if (!player) {
    return <Card><EmptyState icon={Users} title="Player not found" description="This player may have been removed from the academy."
      action={<Link to="/players"><Button variant="secondary">Back to players</Button></Link>} /></Card>
  }
  if (role === 'coach' && (!player.teamId || !visibleTeamIds.includes(player.teamId))) {
    return <Card><EmptyState icon={Users} title="This player is outside your access"
      description="Coaches can only view players on their assigned teams. Switch to the Administrator view for the full roster."
      action={<Link to="/players"><Button variant="secondary">Back to my players</Button></Link>} /></Card>
  }

  const team = teamById(player.teamId)
  const coach = team ? staffById(team.coachId) : undefined
  const payment = payments.find((p) => p.playerId === player.id)
  const program = team ? (team.division === 'Elite' ? PROGRAMS[0] : team.division === 'Select' ? PROGRAMS[1] : PROGRAMS[2]) : PROGRAMS[3]
  const dev = developmentLog.find((x) => x.playerId === player.id)?.entries

  const upcoming: CalEvent[] = team
    ? [...games.filter((g) => g.teamId === team.id && g.date >= today), ...practices.filter((p) => p.teamId === team.id && p.date >= today)]
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 8)
    : []

  const allNotes = [...localNotes, ...player.notes]

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-5">
      <motion.div variants={stagger.item}>
        <PageHeader
          breadcrumbs={[{ label: 'Players', to: '/players' }, { label: `${player.first} ${player.last}` }]}
          eyebrow={team ? `${team.name} · ${team.ageGroup}` : 'Academy Program'}
          title={
            <span className="flex items-center gap-3.5">
              <Avatar first={player.first} last={player.last} jersey={player.jersey} size="xl" />
              <span>
                <span className="block font-display uppercase tracking-[0.03em]">{player.first} {player.last}</span>
                <span className="mt-1 block text-[13px] font-normal text-ink-3">
                  #{player.jersey} · {player.position} · {player.height} · Age {player.age}
                </span>
              </span>
            </span>
          }
          meta={<><span><StatusBadge status={player.status} /></span>
            <MetaItem label="Joined" value={fmtDate(player.joined, 'medium')} />
            {coach && <MetaItem label="Coach" value={`${coach.first} ${coach.last}`} />}</>}
          actions={
            <>
              <Button variant="secondary" icon={MessageSquare}
                onClick={() => toast({ tone: 'info', title: 'Message drafted', body: `A message to ${player.guardian.name} is ready in Communications.` })}>
                Message family
              </Button>
              {can('view.allTeams') && <Button variant="primary" icon={ArrowRightLeft} onClick={() => setMoving(true)}>Move team</Button>}
            </>
          }
        />
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={stagger.item} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Attendance" value={`${player.attendance}%`}
          sub={player.attendance >= 90 ? 'Above team average' : player.attendance >= 80 ? 'On track' : 'Needs a check-in'}
          tone={player.attendance >= 90 ? 'good' : player.attendance >= 80 ? 'neutral' : 'warn'} />
        <SummaryCard label="Registration" value={player.registration === 'completed' ? 'Complete' : player.registration === 'review' ? 'In review' : player.registration[0].toUpperCase() + player.registration.slice(1)}
          sub={`${program.label} · ${money(program.fee)}`} tone={player.registration === 'completed' ? 'good' : 'warn'} />
        <SummaryCard label="Payments" value={player.payment === 'paid' ? 'Paid' : player.payment === 'pending' ? 'Pending' : 'Overdue'}
          sub={payment ? `${money(payment.amount)} · due ${fmtDate(payment.due, 'short')}` : 'No invoice on file'}
          tone={player.payment === 'paid' ? 'good' : player.payment === 'pending' ? 'warn' : 'bad'} />
        <SummaryCard label="Evaluation" value={player.evaluation.toFixed(1)}
          sub={player.evaluation >= 8.5 ? 'Elite track' : player.evaluation >= 7.5 ? 'Select track' : 'Development track'} tone="neutral" />
      </motion.div>

      <motion.div variants={stagger.item}>
        <Tabs value={tab} onChange={setTab} items={TABS.filter((t) => role === 'admin' || t.key !== 'payments')} />
      </motion.div>

      {/* -------------------- Overview -------------------- */}
      {tab === 'overview' && (
        <motion.div variants={stagger.item} className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <ChartCard
              eyebrow="Attendance"
              title={`${player.first}'s participation`}
              subtitle="Last 8 weeks across practices and games"
              table={{ head: ['Week', 'Attendance'], rows: attendanceSeries.map((a) => [a.label, `${a.attendance}%`]) }}
            >
              <TrendChart height={214} yFormat={(v) => `${Math.round(v)}%`} data={attendanceSeries}
                series={[{ key: 'attendance', label: 'Attendance', color: SERIES[0], area: true }]} />
            </ChartCard>

            {dev && (
              <Card padded={false}>
                <div className="px-5 pb-2 pt-5">
                  <CardHeader eyebrow="Player development" title="Skill progression"
                    subtitle="Coach-recorded ratings compared to the previous review" />
                </div>
                <div className="space-y-3 px-5 pb-5">
                  {dev.map((s) => {
                    const delta = +(s.current - s.previous).toFixed(1)
                    return (
                      <div key={s.skill} className="flex items-start gap-3">
                        <div className="w-[104px] shrink-0 pt-0.5 text-[12.5px] font-medium text-ink">{s.skill}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-soft">
                              <div className="h-full rounded-full bg-royal transition-all duration-700" style={{ width: `${s.current * 10}%` }} />
                            </div>
                            <span className="stat w-8 text-right text-[13px] text-ink">{s.current.toFixed(1)}</span>
                            <span className={cn('flex w-12 items-center gap-0.5 text-[11.5px] font-medium',
                              delta > 0 ? 'text-good' : delta < 0 ? 'text-bad' : 'text-ink-4')}>
                              {delta > 0 ? <TrendingUp className="h-3 w-3" /> : delta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                              {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                            </span>
                          </div>
                          <p className="mt-1 text-[12px] text-ink-3">{s.note}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader eyebrow="Player information" title="Details" />
              <dl className="mt-3 divide-y divide-line-soft">
                <InfoRow label="Current team" value={team ? (
                  <Link to={`/teams/${team.id}`} className="inline-flex items-center gap-2 font-medium hover:text-royal">
                    <TeamCrest short={team.short} color={team.color} size="sm" />{team.name}
                  </Link>
                ) : <Badge tone="neutral" dot={false} size="xs">Academy Program</Badge>} />
                <InfoRow label="Age group" value={team?.ageGroup ?? `${player.age}U eligible`} />
                <InfoRow label="Assigned coach" value={coach ? `${coach.first} ${coach.last}` : 'Not assigned'} />
                <InfoRow label="Position" value={player.position} />
                <InfoRow label="Height" value={player.height} />
                <InfoRow label="Joined academy" value={fmtDate(player.joined, 'medium')} />
              </dl>
            </Card>

            <Card>
              <CardHeader eyebrow="Family contact" title={player.guardian.name}
                subtitle={`${player.guardian.relation} · primary contact on file`} />
              <div className="mt-3 space-y-2">
                <a href={`tel:${player.guardian.phone}`} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-[13px] text-ink-2 transition-colors hover:border-[#D9DDE5] hover:text-ink">
                  <Phone className="h-3.5 w-3.5 text-ink-4" />{player.guardian.phone}
                </a>
                <a href={`mailto:${player.guardian.email}`} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-[13px] text-ink-2 transition-colors hover:border-[#D9DDE5] hover:text-ink">
                  <Mail className="h-3.5 w-3.5 text-ink-4" />{player.guardian.email}
                </a>
              </div>
              <p className="mt-3 text-[11.5px] leading-relaxed text-ink-4">
                Family-facing tools arrive with the Parent experience. Today this contact is reference only.
              </p>
            </Card>
          </div>
        </motion.div>
      )}

      {/* -------------------- Activity -------------------- */}
      {tab === 'activity' && (
        <motion.div variants={stagger.item} className="grid gap-4 lg:grid-cols-2">
          <Card padded={false}>
            <div className="px-5 pb-2 pt-5"><CardHeader eyebrow="Recent" title="Attendance log" /></div>
            <div className="px-5 pb-4">
              <ol>
                {practices.filter((p) => team && p.teamId === team.id && p.date < today).slice(0, 8).map((p, i) => {
                  const mark = (player.jersey + i) % 7 === 0 ? 'absent' : (player.jersey + i) % 5 === 0 ? 'late' : 'present'
                  return (
                    <li key={p.id} className={cn('flex items-center gap-3 py-2.5', i > 0 && 'border-t border-line-soft')}>
                      <span className="w-[86px] shrink-0 text-[12.5px] text-ink-3">{fmtDate(p.date, 'short')}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{p.focus}</span>
                      <StatusBadge status={mark} size="xs" />
                    </li>
                  )
                })}
                {!team && <li className="py-6 text-center text-[13px] text-ink-3">Attendance starts once this player joins a roster.</li>}
              </ol>
            </div>
          </Card>
          <Card padded={false}>
            <div className="px-5 pb-2 pt-5"><CardHeader eyebrow="Academy" title="Recent activity" /></div>
            <div className="px-5 pb-4"><ActivityFeed limit={6} /></div>
          </Card>
        </motion.div>
      )}

      {/* -------------------- Schedule -------------------- */}
      {tab === 'schedule' && (
        <motion.div variants={stagger.item}>
          {upcoming.length === 0 ? (
            <Card><EmptyState icon={CalendarDays} title="No upcoming events"
              description={team ? 'This team has nothing scheduled yet.' : 'Players in the academy program follow the open-gym schedule.'} /></Card>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
              {upcoming.map((e, i) => (
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
                  <StatusBadge status={e.status} />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* -------------------- Registration -------------------- */}
      {tab === 'registration' && (
        <motion.div variants={stagger.item} className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader eyebrow="Registration" title="Current registration" action={<StatusBadge status={player.registration} />} />
            <dl className="mt-3 divide-y divide-line-soft">
              <InfoRow label="Program" value={program.label} />
              <InfoRow label="Season fee" value={money(program.fee)} />
              <InfoRow label="Submitted" value={fmtDate(player.joined, 'medium')} />
              <InfoRow label="Age group" value={team?.ageGroup ?? '—'} />
              <InfoRow label="Assigned team" value={team?.name ?? 'Academy Program'} />
              <InfoRow label="Status" value={<StatusBadge status={player.status} size="xs" />} />
            </dl>
          </Card>
          <Card>
            <CardHeader eyebrow="History" title="Registration history" />
            <ol className="mt-3">
              {[
                { label: 'Registration completed', date: player.joined, icon: ClipboardCheck },
                { label: 'Evaluation reviewed', date: d(-420), icon: ClipboardCheck },
                { label: 'Application submitted', date: d(-430), icon: ClipboardCheck },
              ].map((h, i) => (
                <li key={i} className={cn('flex items-center gap-3 py-3', i > 0 && 'border-t border-line-soft')}>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-royal-tint text-royal"><h.icon className="h-3.5 w-3.5" /></span>
                  <span className="flex-1 text-[13px] text-ink">{h.label}</span>
                  <span className="text-[12px] text-ink-3">{fmtDate(h.date, 'medium')}</span>
                </li>
              ))}
            </ol>
          </Card>
        </motion.div>
      )}

      {/* -------------------- Evaluation -------------------- */}
      {tab === 'evaluation' && (
        <motion.div variants={stagger.item} className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <Card className="text-center">
            <div className="eyebrow">Overall evaluation</div>
            <div className="stat mt-3 text-[56px] leading-none text-ink">{player.evaluation.toFixed(1)}</div>
            <div className="mt-1 text-[12.5px] text-ink-3">out of 10</div>
            <div className="mt-4 border-t border-line-soft pt-4 text-left">
              <dl className="divide-y divide-line-soft">
                <InfoRow label="Evaluator" value={coach ? `${coach.first} ${coach.last}` : 'Marcus Reed'} />
                <InfoRow label="Last evaluated" value={fmtDate(d(-24), 'medium')} />
                <InfoRow label="Recommendation" value={team?.name ?? 'Academy Program'} />
                <InfoRow label="Status" value={<Badge tone="good" size="xs">Complete</Badge>} />
              </dl>
            </div>
          </Card>
          <Card>
            <CardHeader eyebrow="Coach notes" title="Evaluation summary" />
            <p className="mt-3 rounded-xl border border-line bg-[#FBFCFD] p-4 text-[13.5px] leading-relaxed text-ink-2">
              {player.evaluation >= 8.5
                ? `${player.first} is ready for elite minutes. Excellent motor, strong feel for the game, and the work ethic to match. Continue building strength and decision-making under pressure.`
                : player.evaluation >= 7.5
                  ? `${player.first} projects well for the Select track. Fundamentals are solid; the next step is consistency in game situations and conditioning through the fourth quarter.`
                  : `${player.first} is developing steadily. Focus the next block on ball handling and defensive positioning before moving up an age group.`}
            </p>
            {dev && (
              <div className="mt-4">
                <div className="eyebrow mb-2.5">Skill breakdown</div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {dev.map((s) => (
                    <div key={s.skill} className="rounded-lg border border-line px-3 py-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[12.5px] text-ink-2">{s.skill}</span>
                        <span className="stat text-[15px] text-ink">{s.current.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* -------------------- Payments -------------------- */}
      {tab === 'payments' && role === 'admin' && (
        <motion.div variants={stagger.item} className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <Card>
            <CardHeader eyebrow="Balance" title="Season dues" action={<StatusBadge status={player.payment} />} />
            <div className="stat mt-4 text-[38px] leading-none text-ink">{money(payment?.amount ?? program.fee)}</div>
            <div className="mt-1 text-[12.5px] text-ink-3">{program.label}</div>
            <dl className="mt-4 divide-y divide-line-soft border-t border-line-soft">
              <InfoRow label="Due date" value={payment ? fmtDate(payment.due, 'medium') : '—'} />
              <InfoRow label="Method" value={payment?.method ?? '—'} />
              <InfoRow label="Family" value={payment?.family ?? `${player.guardian.name.split(' ')[1]} Family`} />
            </dl>
            {payment && (
              <Link to={`/payments/${payment.id}`} className="mt-4 block">
                <Button variant="secondary" icon={CreditCard} className="w-full">Open payment record</Button>
              </Link>
            )}
          </Card>
          <Card padded={false}>
            <div className="px-5 pb-2 pt-5"><CardHeader eyebrow="Ledger" title="Payment history" /></div>
            <ol className="px-5 pb-5">
              {(payment?.history ?? []).map((h, i) => (
                <li key={h.id} className={cn('flex items-center gap-3 py-3', i > 0 && 'border-t border-line-soft')}>
                  <span className="w-[86px] shrink-0 text-[12.5px] text-ink-3">{fmtDate(h.date, 'short')}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{h.label}</span>
                  <span className="stat text-[14px] text-ink">{h.amount !== null ? money(h.amount) : '—'}</span>
                </li>
              ))}
              {!payment && <li className="py-6 text-center text-[13px] text-ink-3">No payment records on file for this player.</li>}
            </ol>
          </Card>
        </motion.div>
      )}

      {/* -------------------- Notes -------------------- */}
      {tab === 'notes' && (
        <motion.div variants={stagger.item} className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="primary" icon={Plus} onClick={() => setNoteOpen(true)}>Add note</Button>
          </div>
          {allNotes.length === 0 ? (
            <Card><EmptyState icon={StickyNote} title="No notes yet"
              description="Coaching notes and staff observations stay on the player record."
              action={<Button variant="primary" icon={Plus} onClick={() => setNoteOpen(true)}>Add the first note</Button>} /></Card>
          ) : (
            <div className="space-y-2.5">
              {allNotes.map((n) => (
                <Card key={n.id}>
                  <div className="flex items-start gap-3">
                    <Avatar first={n.author.split(' ')[0]} last={n.author.split(' ')[1] ?? ''} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-semibold text-ink">{n.author}</span>
                        <span className="text-[11.5px] text-ink-4">{fmtDate(n.date, 'medium')}</span>
                      </div>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{n.body}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <EventDrawer event={drawerEvent} onClose={() => setDrawerEvent(null)} />

      <Modal open={moving} onClose={() => setMoving(false)} width="sm" eyebrow="Roster" title={`Move ${player.first} ${player.last}`}
        footer={<Button variant="ghost" onClick={() => setMoving(false)}>Close</Button>}>
        <Field label="Assign to team" hint={team ? `Currently ${team.name}` : 'Currently unassigned'}>
          <Select defaultValue={player.teamId ?? 'none'} onChange={(e) => {
            const target = e.target.value
            assignPlayerTeam(player.id, target === 'none' ? null : target)
            toast({ tone: 'success', title: 'Player assigned', body: `${player.first} ${player.last} → ${target === 'none' ? 'Academy Program' : teamById(target)?.name}.` })
            setMoving(false)
          }}>
            <option value="none">Academy Program — unassigned</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id} disabled={t.id !== player.teamId && rosterOf(t.id).length >= t.capacity}>
                {t.name} ({rosterOf(t.id).length}/{t.capacity})
              </option>
            ))}
          </Select>
        </Field>
      </Modal>

      <Modal open={noteOpen} onClose={() => setNoteOpen(false)} width="md" eyebrow="Player record" title="Add a note"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button variant="primary" disabled={!note.trim()} onClick={() => {
              setLocalNotes((prev) => [{ id: `n-${Date.now()}`, author: 'Darryl Hayes', date: d(0), body: note }, ...prev])
              setNote(''); setNoteOpen(false)
              toast({ tone: 'success', title: 'Note added', body: `Saved to ${player.first} ${player.last}'s record.` })
            }}>Save note</Button>
          </>
        }>
        <Field label="Note" hint="Visible to staff only">
          <Textarea rows={5} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Great energy in the second half. Keep working the left hand in transition." />
        </Field>
      </Modal>
    </motion.div>
  )
}

function SummaryCard({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const tones = { good: 'text-good', warn: 'text-warn', bad: 'text-bad', neutral: 'text-ink' }
  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
      <div className="eyebrow">{label}</div>
      <div className={cn('stat mt-2.5 text-[30px] leading-none', tones[tone])}>{value}</div>
      <div className="mt-2 text-[12.5px] text-ink-3">{sub}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-[12.5px] text-ink-3">{label}</dt>
      <dd className="min-w-0 truncate text-right text-[13px] font-medium text-ink">{value}</dd>
    </div>
  )
}
