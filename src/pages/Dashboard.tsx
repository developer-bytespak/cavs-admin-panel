import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowUpRight, TrendingUp, ClipboardList, Target, Wallet, Users, CalendarDays, Trophy, Dumbbell, UserPlus,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { teams, teamById, rosterOf, d, otherEvents } from '../data/mock'
import {
  pulse30, buildPulse, RANGES, type RangeKey, funnel, heatmap, HEAT_DAYS,
  collected, pendingTotal, overdueTotal, outstanding, familiesNeedingAttention,
  activePlayers, newSignups, metricSparks, attendanceByTeam,
} from '../data/analytics'
import type { CalEvent } from '../data/types'
import { cn, money, relativeDay, timeUntil } from '../lib/utils'
import { SERIES } from '../lib/palette'
import { stagger } from '../components/layout/AppShell'
import { Card, CardHeader, SectionTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Segmented } from '../components/ui/Tabs'
import { EmptyState } from '../components/ui/EmptyState'
import { MetricCard, InsightCard } from '../components/domain/MetricCard'
import { LiveGameHero } from '../components/domain/LiveGameHero'
import { TodayTimeline } from '../components/domain/TodayTimeline'
import { EventDrawer } from '../components/domain/EventDrawer'
import { TeamCard } from '../components/domain/TeamCard'
import { ActivityFeed } from '../components/domain/ActivityFeed'
import { ChartCard } from '../components/charts/ChartCard'
import { TrendChart } from '../components/charts/TrendChart'
import { AttendanceOrbit } from '../components/charts/AttendanceOrbit'
import { ActivityOrbit } from '../components/charts/ActivityOrbit'
import { FunnelFlow } from '../components/charts/FunnelFlow'
import { Heatmap } from '../components/charts/Heatmap'
import { PaymentArc, PAY_SEGMENT_COLORS } from '../components/charts/PaymentArc'
import { CapacityBar } from '../components/charts/BarCompare'

const PULSE_METRICS = [
  { key: 'attendance', label: 'Attendance', unit: '%', color: SERIES[0], fmt: (v: number) => `${Math.round(v)}%` },
  { key: 'activePlayers', label: 'Active players', unit: '', color: SERIES[3], fmt: (v: number) => String(Math.round(v)) },
  { key: 'practices', label: 'Practices', unit: '', color: SERIES[2], fmt: (v: number) => String(Math.round(v)) },
  { key: 'games', label: 'Games', unit: '', color: SERIES[1], fmt: (v: number) => String(Math.round(v)) },
] as const

export default function Dashboard() {
  const { role, games, practices, registrations, players, visibleTeamIds } = useApp()
  const [drawerEvent, setDrawerEvent] = useState<CalEvent | null>(null)
  const [range, setRange] = useState<RangeKey>('30d')
  const [metric, setMetric] = useState<(typeof PULSE_METRICS)[number]['key']>('attendance')
  const [compare, setCompare] = useState(true)

  const isCoach = role === 'coach'
  const myTeams = useMemo(() => (isCoach ? teams.filter((t) => visibleTeamIds.includes(t.id)) : teams), [isCoach, visibleTeamIds])
  const scopedGames = useMemo(() => (isCoach ? games.filter((g) => visibleTeamIds.includes(g.teamId)) : games), [games, isCoach, visibleTeamIds])
  const scopedPractices = useMemo(() => (isCoach ? practices.filter((p) => visibleTeamIds.includes(p.teamId)) : practices), [practices, isCoach, visibleTeamIds])
  const scopedPlayers = useMemo(() => (isCoach ? players.filter((p) => p.teamId && visibleTeamIds.includes(p.teamId)) : players), [players, isCoach, visibleTeamIds])

  const today = d(0)
  const todaysEvents: CalEvent[] = useMemo(() => ([
    ...scopedGames.filter((g) => g.date === today),
    ...scopedPractices.filter((p) => p.date === today),
    ...(isCoach ? [] : otherEvents.filter((e) => e.date === today)),
  ]), [scopedGames, scopedPractices, today, isCoach])

  const liveGame = scopedGames.find((g) => g.status === 'live' || g.status === 'halftime')
  const heroGame = liveGame ?? scopedGames
    .filter((g) => g.status === 'scheduled' && g.date >= today)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0]

  const pulse = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)!.days
    return days === 30 ? pulse30 : buildPulse(days)
  }, [range])

  /* "Compare to previous period" — same unit, same axis. Never a second scale. */
  const pulseData = useMemo(() => {
    const prev = buildPulse(pulse.length * 2).slice(0, pulse.length)
    return pulse.map((p, i) => ({
      label: p.label,
      current: p[metric],
      previous: prev[i]?.[metric] ?? p[metric],
    }))
  }, [pulse, metric])

  const activeMetric = PULSE_METRICS.find((m) => m.key === metric)!

  const orbitRings = myTeams.map((t, i) => {
    const roster = rosterOf(t.id)
    return {
      id: t.id, label: t.name, value: t.attendance, color: SERIES[i % SERIES.length],
      present: Math.round((roster.length * t.attendance) / 100), expected: roster.length,
      trend: attendanceByTeam[i] ? attendanceByTeam[i].values[7] - attendanceByTeam[i].values[0] : 0,
    }
  })
  const academyAttendance = Math.round(myTeams.reduce((s, t) => s + t.attendance, 0) / myTeams.length)

  const paySegments = [
    { key: 'paid', label: 'Paid', value: (collected / (collected + outstanding)) * 100, amount: collected, color: PAY_SEGMENT_COLORS.paid },
    { key: 'pending', label: 'Pending', value: (pendingTotal / (collected + outstanding)) * 100, amount: pendingTotal, color: PAY_SEGMENT_COLORS.pending },
    { key: 'overdue', label: 'Overdue', value: (overdueTotal / (collected + outstanding)) * 100, amount: overdueTotal, color: PAY_SEGMENT_COLORS.overdue },
  ]

  const nextGame = scopedGames
    .filter((g) => g.status === 'scheduled')
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0]

  const orbitNodes = [
    { key: 'teams', label: 'Teams', value: myTeams.length, color: SERIES[0], angle: 0,
      description: `${myTeams.length} active teams across ${new Set(myTeams.map((t) => t.ageGroup)).size} age groups`,
      next: `All rosters staffed — ${myTeams.filter((t) => t.roster.length >= t.capacity).length} at capacity` },
    { key: 'games', label: 'Games', value: todaysEvents.filter((e) => e.type === 'game').length, color: SERIES[1], angle: 90,
      description: `${todaysEvents.filter((e) => e.type === 'game').length} games on today's slate`,
      next: nextGame ? `Next: ${teamById(nextGame.teamId)?.name} vs ${nextGame.opponent} · ${relativeDay(nextGame.date)}` : 'No upcoming games' },
    { key: 'practices', label: 'Practices', value: scopedPractices.filter((p) => p.date === today).length, color: SERIES[2], angle: 180,
      description: `${scopedPractices.filter((p) => p.date === today).length} practices scheduled today`,
      next: `${scopedPractices.filter((p) => p.date >= today && p.date <= d(7)).length} sessions in the next 7 days` },
    { key: 'signups', label: 'Signups', value: newSignups, color: SERIES[3], angle: 270,
      description: `${newSignups} new signups in the last 7 days`,
      next: `${registrations.filter((r) => r.stage === 'new' || r.stage === 'review').length} awaiting review` },
  ]

  const heatRows = myTeams.map((t) => ({ id: t.id, label: t.name }))
  const heatData = heatmap
    .filter((h) => myTeams.some((t) => t.id === h.teamId))
    .map((h) => ({ rowId: h.teamId, col: h.day, value: h.value, sessions: h.sessions, attendance: h.attendance }))

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-6">
      {/* ---------- ROW 1 · Academy metrics ---------- */}
      <motion.section variants={stagger.item} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          id="m-players" label={isCoach ? 'My players' : 'Active players'}
          value={isCoach ? scopedPlayers.length : activePlayers}
          to="/players" spark={metricSparks.players} sparkColor={SERIES[0]}
          trend={{ dir: 'up', text: isCoach ? '2 added this month' : '8 this month' }}
        />
        <MetricCard
          id="m-teams" label={isCoach ? 'My teams' : 'Active teams'}
          value={myTeams.length} to="/teams" spark={metricSparks.teams} sparkColor={SERIES[3]}
          context="100% staffed"
        />
        <MetricCard
          id="m-games" label="Games today" value={todaysEvents.filter((e) => e.type === 'game').length}
          to="/live" accent spark={metricSparks.games} sparkColor={SERIES[1]}
          context={liveGame ? '1 live right now' : nextGame ? `Next in ${timeUntil(nextGame.date, nextGame.start) ?? '—'}` : 'None scheduled'}
        />
        {isCoach ? (
          <MetricCard
            id="m-att" label="Team attendance" value={academyAttendance} suffix="%"
            to="/attendance" spark={[86, 88, 87, 90, 91, 92, 93, 93, 94, 94]} sparkColor={SERIES[2]}
            trend={{ dir: 'up', text: '2.1% this month' }}
          />
        ) : (
          <MetricCard
            id="m-signups" label="New signups" value={newSignups} to="/registrations"
            spark={metricSparks.signups} sparkColor={SERIES[2]}
            trend={{ dir: 'up', text: '3 since yesterday' }}
          />
        )}
      </motion.section>

      {/* ---------- ROW 2 · Live game + today ---------- */}
      <motion.section variants={stagger.item} className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <LiveGameHero game={heroGame} />
        <Card padded={false} className="flex flex-col">
          <div className="flex items-center justify-between px-5 pb-3 pt-5">
            <div>
              <div className="eyebrow">Today</div>
              <h3 className="mt-1 text-[15px] font-semibold tracking-[-0.011em] text-ink">
                {todaysEvents.length} {todaysEvents.length === 1 ? 'event' : 'events'} scheduled
              </h3>
            </div>
            <Link to="/schedule"><Button size="xs" variant="ghost" iconRight={ArrowUpRight}>Schedule</Button></Link>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            <TodayTimeline
              events={todaysEvents}
              onSelect={setDrawerEvent}
              liveIds={games.filter((g) => g.status === 'live').map((g) => g.id)}
            />
          </div>
        </Card>
      </motion.section>

      {/* ---------- ROW 3 · Academy pulse + attendance orbit ---------- */}
      <motion.section variants={stagger.item} className="grid gap-4 xl:grid-cols-[1.62fr_1fr]">
        <ChartCard
          eyebrow="Academy pulse"
          title="Academy participation"
          subtitle={`${activeMetric.label} across ${isCoach ? 'your teams' : 'the academy'} · ${RANGES.find((r) => r.key === range)!.label.toLowerCase()}`}
          controls={
            <div className="flex flex-wrap items-center gap-2">
              <Segmented size="sm" value={range} onChange={(k) => setRange(k as RangeKey)}
                items={RANGES.map((r) => ({ key: r.key, label: r.label.replace('Last ', '') }))} />
            </div>
          }
          legend={compare
            ? [{ key: 'current', label: 'This period', color: activeMetric.color }, { key: 'previous', label: 'Previous period', color: '#B9BFC9' }]
            : undefined}
          table={{
            head: ['Date', activeMetric.label, 'Previous'],
            rows: pulseData.map((p) => [p.label, activeMetric.fmt(p.current as number), activeMetric.fmt(p.previous as number)]),
          }}
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {PULSE_METRICS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMetric(m.key)}
                    className={cn('rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors',
                      metric === m.key ? 'bg-white text-ink shadow-card ring-1 ring-line' : 'text-ink-3 hover:text-ink')}
                  >
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: m.color }} />
                    {m.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCompare((v) => !v)}
                className={cn('rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors',
                  compare ? 'text-royal' : 'text-ink-4 hover:text-ink-3')}
              >
                {compare ? '✓ ' : ''}Compare to previous period
              </button>
            </div>
          }
        >
          <TrendChart
            height={272}
            data={pulseData}
            yFormat={activeMetric.fmt}
            series={[
              ...(compare ? [{ key: 'previous', label: 'Previous period', color: '#B9BFC9', dashed: true }] : []),
              { key: 'current', label: activeMetric.label, color: activeMetric.color, area: true },
            ]}
          />
        </ChartCard>

        <ChartCard
          eyebrow="Attendance orbit"
          title={isCoach ? 'Your team attendance' : 'Academy attendance by team'}
          subtitle="Each ring is one team. Hover a ring for its detail."
          table={{
            head: ['Team', 'Attendance', 'Present', 'Trend'],
            rows: orbitRings.map((r) => [r.label, `${r.value}%`, `${r.present}/${r.expected}`, `${r.trend >= 0 ? '+' : ''}${r.trend.toFixed(1)}%`]),
          }}
        >
          <AttendanceOrbit rings={orbitRings} center={academyAttendance} size={244} />
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-line-soft pt-3">
            {orbitRings.map((r) => (
              <Link key={r.id} to={`/teams/${r.id}`} className="flex items-center gap-1.5 text-[11.5px] transition-opacity hover:opacity-70">
                <span className="h-2 w-2 shrink-0 rounded-[3px]" style={{ background: r.color }} />
                <span className="truncate text-ink-2">{r.label}</span>
                <span className="ml-auto font-semibold tabular-nums text-ink">{r.value}%</span>
              </Link>
            ))}
          </div>
        </ChartCard>
      </motion.section>

      {/* ---------- ROW 4 · Pipeline + heatmap (admin) ---------- */}
      {!isCoach && (
        <motion.section variants={stagger.item} className="grid gap-4 xl:grid-cols-[1fr_1.62fr]">
          <ChartCard
            eyebrow="Registrations"
            title="Onboarding flow"
            subtitle="Last 30 days, lead through roster assignment"
            controls={<Link to="/registrations"><Button size="xs" variant="ghost" iconRight={ArrowUpRight}>Pipeline</Button></Link>}
            table={{ head: ['Stage', 'Count'], rows: funnel.map((f) => [f.label, f.value]) }}
          >
            <FunnelFlow stages={funnel} />
          </ChartCard>

          <ChartCard
            eyebrow="Team activity"
            title="Weekly activity heatmap"
            subtitle="Practice and game load by team and day of week"
            table={{
              head: ['Team', ...HEAT_DAYS],
              rows: heatRows.map((r) => [r.label, ...HEAT_DAYS.map((day) => heatData.find((h) => h.rowId === r.id && h.col === day)?.value ?? 0)]),
            }}
          >
            <Heatmap rows={heatRows} cols={HEAT_DAYS} data={heatData} />
          </ChartCard>
        </motion.section>
      )}

      {/* ---------- ROW 5 · Signature orbit + payments + capacity ---------- */}
      <motion.section variants={stagger.item} className={cn('grid gap-4', isCoach ? 'lg:grid-cols-2' : 'xl:grid-cols-[1.2fr_1fr_1fr]')}>
        <Card padded={false} className="overflow-hidden">
          <div className="px-5 pb-1 pt-5">
            <div className="eyebrow">Academy at a glance</div>
            <h3 className="mt-1 text-[15px] font-semibold tracking-[-0.011em] text-ink">
              One system, {isCoach ? 'your corner of it' : 'every moving part'}
            </h3>
          </div>
          <div className="px-4 pb-14 pt-2">
            <ActivityOrbit
              nodes={orbitNodes}
              centerValue={isCoach ? scopedPlayers.length : activePlayers}
              centerLabel="Players"
              size={330}
            />
          </div>
        </Card>

        {!isCoach && (
          <ChartCard
            eyebrow="Payment health"
            title="Season collections"
            subtitle={`${money(outstanding)} outstanding across ${familiesNeedingAttention} families`}
            controls={<Link to="/payments"><Button size="xs" variant="ghost" iconRight={ArrowUpRight}>Ledger</Button></Link>}
            table={{
              head: ['Status', 'Amount', 'Share'],
              rows: paySegments.map((s) => [s.label, money(s.amount), `${s.value.toFixed(0)}%`]),
            }}
            footer={
              <Link to="/payments?status=overdue" className="group flex items-center gap-2 text-[12.5px]">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-tint text-[#C24A12]">
                  <Wallet className="h-3.5 w-3.5" />
                </span>
                <span className="font-medium text-ink">{familiesNeedingAttention} families need attention</span>
                <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-ink-4 transition-transform group-hover:-translate-y-0.5" />
              </Link>
            }
          >
            <PaymentArc segments={paySegments} total={collected} size={230} caption="this season" />
          </ChartCard>
        )}

        <Card padded={false}>
          <div className="px-5 pb-3 pt-5">
            <CardHeader
              eyebrow="Roster health"
              title="Team capacity"
              action={<Link to="/teams"><Button size="xs" variant="ghost" iconRight={ArrowUpRight}>Teams</Button></Link>}
            />
          </div>
          <div className="space-y-3.5 px-5 pb-5">
            {myTeams.map((t) => (
              <CapacityBar
                key={t.id}
                label={t.name}
                filled={rosterOf(t.id).length}
                capacity={t.capacity}
                sub={`${t.ageGroup} · ${t.division}`}
              />
            ))}
          </div>
        </Card>
      </motion.section>

      {/* ---------- ROW 6 · Teams in motion ---------- */}
      <motion.section variants={stagger.item}>
        <SectionTitle action={<Link to="/teams"><Button size="xs" variant="ghost" iconRight={ArrowUpRight}>All teams</Button></Link>}>
          Teams in motion
        </SectionTitle>
        {myTeams.length === 0 ? (
          <Card><EmptyState title="No teams assigned" description="Teams assigned to you will appear here." compact /></Card>
        ) : (
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 xl:mx-0 xl:grid xl:grid-cols-3 xl:px-0 2xl:grid-cols-4">
            {myTeams.map((t) => {
              const ng = games.filter((g) => g.teamId === t.id && g.status === 'scheduled')
                .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0]
              const np = practices.filter((p) => p.teamId === t.id && p.date >= today)
                .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0]
              return (
                <div key={t.id} className="w-[290px] shrink-0 snap-start xl:w-auto">
                  <TeamCard team={t} nextGame={ng} nextPractice={np} live={liveGame?.teamId === t.id} />
                </div>
              )
            })}
          </div>
        )}
      </motion.section>

      {/* ---------- ROW 7 · Insights + activity ---------- */}
      <motion.section variants={stagger.item} className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <SectionTitle>What needs your attention</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <InsightCard tone="good" icon={TrendingUp} value="↑ 8.4%" label="Attendance improved this month" sub="Driven by 14U Elite and Lady Cavs" />
            {!isCoach && (
              <InsightCard tone="warn" icon={ClipboardList} to="/registrations"
                value={String(registrations.filter((r) => r.stage === 'new' || r.stage === 'review').length)}
                label="Registrations awaiting review" sub="Oldest submitted 3 days ago" />
            )}
            <InsightCard tone="neutral" icon={Target} value={String(myTeams.filter((t) => t.attendance >= 90).length)}
              label="Teams above 90% attendance" sub={myTeams.filter((t) => t.attendance >= 90).map((t) => t.name).join(', ')} />
            {!isCoach ? (
              <InsightCard tone="bad" icon={Wallet} to="/payments" value={money(outstanding)} label="Outstanding dues" sub={`${familiesNeedingAttention} families · ${money(overdueTotal)} overdue`} />
            ) : (
              <InsightCard tone="accent" icon={Users} to="/attendance" value="3" label="Players below 80% attendance" sub="Worth a check-in this week" />
            )}
          </div>

          <div className="mt-6"><SectionTitle>Quick actions</SectionTitle></div>
          <div className="grid gap-3 sm:grid-cols-3">
            <QuickAction to="/schedule" icon={CalendarDays} label="Open calendar" hint={`${scopedGames.filter((g) => g.date >= today).length} upcoming events`} />
            <QuickAction to="/live" icon={Trophy} label="Live games" hint={liveGame ? 'One game in progress' : 'Nothing live right now'} accent={!!liveGame} />
            <QuickAction to={isCoach ? '/attendance' : '/communications'} icon={isCoach ? Dumbbell : UserPlus}
              label={isCoach ? 'Mark attendance' : 'Send a broadcast'}
              hint={isCoach ? 'Today’s practice roster' : 'Team, group or whole academy'} />
          </div>
        </div>

        <Card padded={false}>
          <div className="px-5 pb-1 pt-5">
            <CardHeader eyebrow="Live feed" title="Recent activity" subtitle="Everything the academy changed today" />
          </div>
          <div className="px-5 pb-4">
            <ActivityFeed limit={7} />
          </div>
        </Card>
      </motion.section>

      {/* ---------- Platform roadmap (subtle, future scope) ---------- */}
      <motion.section variants={stagger.item}>
        <RoadmapStrip />
      </motion.section>

      <EventDrawer event={drawerEvent} onClose={() => setDrawerEvent(null)} />
    </motion.div>
  )
}

function QuickAction({
  to, icon: Icon, label, hint, accent,
}: { to: string; icon: React.ComponentType<{ className?: string }>; label: string; hint: string; accent?: boolean }) {
  return (
    <Link to={to} className={cn(
      'group flex items-center gap-3 rounded-xl border bg-card p-3.5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift',
      accent ? 'border-[#FBDCC9]' : 'border-line'
    )}>
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
        accent ? 'bg-orange-tint text-[#C24A12]' : 'bg-royal-tint text-royal')}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium text-ink">{label}</span>
        <span className="block truncate text-[11.5px] text-ink-3">{hint}</span>
      </span>
    </Link>
  )
}

export function RoadmapStrip() {
  const items = [
    { label: 'Admin experience', state: 'Live' },
    { label: 'Coach experience', state: 'Live' },
    { label: 'Parent experience', state: 'Next' },
    { label: 'Player experience', state: 'Next' },
  ]
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-line bg-warm px-4 py-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-3">Cavs Platform</span>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {items.map((i) => (
          <span key={i.label} className="flex items-center gap-1.5">
            <span className={cn('h-1.5 w-1.5 rounded-full', i.state === 'Live' ? 'bg-good' : 'bg-ink-4/50')} />
            <span className={cn('text-[12px]', i.state === 'Live' ? 'text-ink-2' : 'text-ink-4')}>{i.label}</span>
            <span className={cn('rounded-full px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-[0.07em]',
              i.state === 'Live' ? 'bg-good-tint text-good' : 'bg-[#EDEEF1] text-ink-4')}>{i.state}</span>
          </span>
        ))}
      </div>
      <Link to="/settings/roles" className="ml-auto text-[12px] font-medium text-royal hover:underline">Roles &amp; access →</Link>
    </div>
  )
}
