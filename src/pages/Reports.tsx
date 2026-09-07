import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Download, TrendingUp, TrendingDown, Target, Users, ClipboardList, Wallet, Activity, AlertTriangle,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { teams, staff, rosterOf, teamById } from '../data/mock'
import {
  pulse30, buildPulse, RANGES, type RangeKey, attendanceByTeam, attendanceWeeks,
  heatmap, HEAT_DAYS, funnel, registrationTrend, registrationsByProgram,
  paymentTrend, participationByTeam, collected, pendingTotal, overdueTotal,
} from '../data/analytics'
import { money } from '../lib/utils'
import { SERIES, STATUS } from '../lib/palette'
import { stagger } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Tabs, Segmented } from '../components/ui/Tabs'
import { FilterSelect } from '../components/ui/FilterBar'
import { EmptyState } from '../components/ui/EmptyState'
import { ChartSkeleton, TableSkeleton } from '../components/ui/Skeleton'
import { TeamCrest } from '../components/ui/Avatar'
import { ChartCard } from '../components/charts/ChartCard'
import { TrendChart } from '../components/charts/TrendChart'
import { BarCompare } from '../components/charts/BarCompare'
import { Heatmap } from '../components/charts/Heatmap'
import { FunnelFlow } from '../components/charts/FunnelFlow'
import { PaymentArc, PAY_SEGMENT_COLORS } from '../components/charts/PaymentArc'
import { InsightCard } from '../components/domain/MetricCard'
import { DataTable, type Column } from '../components/ui/DataTable'

const CATEGORIES = [
  { key: 'attendance', label: 'Attendance' },
  { key: 'registrations', label: 'Registrations' },
  { key: 'payments', label: 'Payments' },
  { key: 'participation', label: 'Participation' },
]

export default function Reports() {
  const { category = 'attendance' } = useParams()
  const navigate = useNavigate()
  const { toast, registrations, payments } = useApp()
  const [range, setRange] = useState<RangeKey>('30d')
  const [team, setTeam] = useState('all')
  const [coach, setCoach] = useState('all')
  const [age, setAge] = useState('all')

  /* Reports are the one place that genuinely waits on an aggregate query.
     The skeleton shows on first paint of each category so the layout never jumps. */
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    const t = window.setTimeout(() => setLoading(false), 420)
    return () => window.clearTimeout(t)
  }, [category])

  const scopedTeams = useMemo(() => teams.filter((t) => {
    if (team !== 'all' && t.id !== team) return false
    if (coach !== 'all' && t.coachId !== coach) return false
    if (age !== 'all' && t.ageGroup !== age) return false
    return true
  }), [team, coach, age])

  const pulse = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)!.days
    return days === 30 ? pulse30 : buildPulse(days)
  }, [range])

  const activeFilters = [team, coach, age].filter((v) => v !== 'all').length
  const clear = () => { setTeam('all'); setCoach('all'); setAge('all') }

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={stagger.item}>
        <PageHeader
          eyebrow="Insights"
          title="Reports"
          description="Academy performance across attendance, intake, finance and participation — filtered once, applied everywhere on this page."
          actions={
            <Button variant="secondary" icon={Download}
              onClick={() => toast({ tone: 'info', title: 'Report queued', body: `The ${category} report will be prepared as a PDF.` })}>
              Export report
            </Button>
          }
        />
      </motion.div>

      {/* One filter row above everything it scopes */}
      <motion.div variants={stagger.item} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white p-2 shadow-card">
        <Segmented size="sm" value={range} onChange={(k) => setRange(k as RangeKey)}
          items={RANGES.map((r) => ({ key: r.key, label: r.label }))} />
        <span className="mx-1 hidden h-5 w-px bg-line sm:block" />
        <FilterSelect label="Team" value={team} onChange={setTeam} options={teams.map((t) => ({ value: t.id, label: t.name }))} />
        <FilterSelect label="Coach" value={coach} onChange={setCoach} options={staff.filter((s) => s.role.includes('Coach')).map((s) => ({ value: s.id, label: `${s.first} ${s.last}` }))} />
        <FilterSelect label="Age" value={age} onChange={setAge} options={[...new Set(teams.map((t) => t.ageGroup))].map((a) => ({ value: a, label: a }))} />
        {activeFilters > 0 && (
          <button onClick={clear} className="rounded-lg px-2 py-1.5 text-[12.5px] font-medium text-royal hover:bg-royal-tint">Clear {activeFilters}</button>
        )}
        <span className="ml-auto pr-1 text-[12px] text-ink-4">
          {scopedTeams.length} of {teams.length} teams · {RANGES.find((r) => r.key === range)!.label.toLowerCase()}
        </span>
      </motion.div>

      <motion.div variants={stagger.item}>
        <Tabs value={category} onChange={(k) => navigate(`/reports/${k}`)} items={CATEGORIES} />
      </motion.div>

      {loading ? (
        <motion.div variants={stagger.item} className="space-y-4">
          <ChartSkeleton height={300} />
          <div className="grid gap-4 xl:grid-cols-2"><ChartSkeleton height={220} /><ChartSkeleton height={220} /></div>
          <TableSkeleton rows={4} cols={5} />
        </motion.div>
      ) : scopedTeams.length === 0 ? (
        <Card>
          <EmptyState title="No teams match these filters" description="Clear a filter to bring data back into this report."
            action={<Button variant="secondary" onClick={clear}>Clear filters</Button>} />
        </Card>
      ) : (
        <>
          {category === 'attendance' && <AttendanceReport pulse={pulse} scopedTeams={scopedTeams} range={range} />}
          {category === 'registrations' && <RegistrationReport registrations={registrations} />}
          {category === 'payments' && <PaymentReport payments={payments} />}
          {category === 'participation' && <ParticipationReport scopedTeams={scopedTeams} />}
        </>
      )}
    </motion.div>
  )
}

/* ================= Attendance ================= */
function AttendanceReport({ pulse, scopedTeams, range }: { pulse: ReturnType<typeof buildPulse>; scopedTeams: typeof teams; range: RangeKey }) {
  const [activeSeries, setActiveSeries] = useState<Record<string, boolean>>({})
  const overall = Math.round(scopedTeams.reduce((s, t) => s + t.attendance, 0) / scopedTeams.length)
  const rows = attendanceByTeam.filter((a) => scopedTeams.some((t) => t.id === a.teamId))
  const best = [...rows].sort((a, b) => b.current - a.current).slice(0, 3)
  const low = [...rows].sort((a, b) => a.current - b.current).slice(0, 3)
  const delta = pulse.length > 1 ? pulse[pulse.length - 1].attendance - pulse[0].attendance : 0

  const heatRows = scopedTeams.map((t) => ({ id: t.id, label: t.name }))
  const heatData = heatmap.filter((h) => scopedTeams.some((t) => t.id === h.teamId))
    .map((h) => ({ rowId: h.teamId, col: h.day, value: h.value, sessions: h.sessions, attendance: h.attendance }))

  const compareSeries = rows.map((r) => ({
    key: r.teamId, label: r.name, color: SERIES[teams.findIndex((t) => t.id === r.teamId) % SERIES.length],
  })).filter((s) => activeSeries[s.key] !== false)

  return (
    <motion.div variants={stagger.item} className="space-y-4">
      {/* One large primary graph */}
      <ChartCard
        eyebrow="Primary"
        title="Academy attendance"
        subtitle={`Daily attendance rate · ${RANGES.find((r) => r.key === range)!.label.toLowerCase()}`}
        table={{ head: ['Date', 'Attendance'], rows: pulse.map((p) => [p.label, `${p.attendance}%`]) }}
      >
        <TrendChart height={300} yFormat={(v) => `${Math.round(v)}%`}
          data={pulse.map((p) => ({ label: p.label, attendance: p.attendance }))}
          series={[{ key: 'attendance', label: 'Attendance', color: SERIES[0], area: true }]} />
      </ChartCard>

      {/* Two medium supporting visualizations */}
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          eyebrow="Comparison"
          title="Attendance by team"
          subtitle="Last 8 weeks — toggle a team in the legend"
          legend={rows.map((r) => ({ key: r.teamId, label: r.name, color: SERIES[teams.findIndex((t) => t.id === r.teamId) % SERIES.length] }))}
          legendActive={activeSeries}
          onLegendToggle={(k) => setActiveSeries((prev) => ({ ...prev, [k]: prev[k] === false }))}
          table={{ head: ['Team', ...attendanceWeeks], rows: rows.map((r) => [r.name, ...r.values.map((v) => `${v}%`)]) }}
        >
          {compareSeries.length === 0 ? (
            <EmptyState compact title="All teams hidden" description="Turn a team back on in the legend to see the comparison." />
          ) : (
            <TrendChart
              height={244} endLabel={false} yFormat={(v) => `${Math.round(v)}%`}
              data={attendanceWeeks.map((w, i) => {
                const point: Record<string, string | number> = { label: w }
                for (const r of rows) point[r.teamId] = r.values[i]
                return point as { label: string }
              })}
              series={compareSeries}
            />
          )}
        </ChartCard>

        <ChartCard
          eyebrow="Pattern"
          title="Activity heatmap"
          subtitle="Where the week is heaviest by team"
          table={{ head: ['Team', ...HEAT_DAYS], rows: heatRows.map((r) => [r.label, ...HEAT_DAYS.map((day) => heatData.find((h) => h.rowId === r.id && h.col === day)?.value ?? 0)]) }}
        >
          <Heatmap rows={heatRows} cols={HEAT_DAYS} data={heatData} />
        </ChartCard>
      </div>

      {/* Insight cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InsightCard tone="neutral" icon={Target} value={`${overall}%`} label="Overall academy attendance" sub={`Across ${scopedTeams.length} teams`} />
        <InsightCard tone={delta >= 0 ? 'good' : 'bad'} icon={delta >= 0 ? TrendingUp : TrendingDown}
          value={`${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta)}%`} label="Change over the selected period" sub="First day compared to last" />
        <InsightCard tone="good" icon={Users} value={String(rows.filter((r) => r.current >= 90).length)}
          label="Teams above 90% attendance" sub={best.map((b) => b.name).join(', ')} />
        <InsightCard tone="warn" icon={AlertTriangle} value={String(rows.filter((r) => r.current < 90).length)}
          label="Teams below 90% attendance" sub={low.filter((l) => l.current < 90).map((l) => l.name).join(', ') || 'None — every team is above 90%'} />
      </div>

      {/* Supporting table */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card padded={false}>
          <div className="px-5 pb-2 pt-5">
            <div className="eyebrow">Top attendance</div>
            <h3 className="mt-1 text-[15px] font-semibold text-ink">Best performing teams</h3>
          </div>
          <div className="px-5 pb-5 pt-2">
            <BarCompare data={best.map((b) => ({ id: b.teamId, label: b.name, value: b.current, sub: `${rosterOf(b.teamId).length} players` }))}
              format={(v) => `${v}%`} max={100} />
          </div>
        </Card>
        <Card padded={false}>
          <div className="px-5 pb-2 pt-5">
            <div className="eyebrow">Needs attention</div>
            <h3 className="mt-1 text-[15px] font-semibold text-ink">Lowest attendance teams</h3>
          </div>
          <div className="px-5 pb-5 pt-2">
            <BarCompare color={STATUS.warn} data={low.map((b) => ({ id: b.teamId, label: b.name, value: b.current, sub: `${rosterOf(b.teamId).length} players` }))}
              format={(v) => `${v}%`} max={100} />
          </div>
        </Card>
      </div>
    </motion.div>
  )
}

/* ================= Registrations ================= */
function RegistrationReport({ registrations }: { registrations: ReturnType<typeof useApp>['registrations'] }) {
  const conversion = Math.round((funnel[3].value / funnel[0].value) * 100)
  const cols: Column<{ id: string; label: string; leads: number; registered: number; rate: string }>[] = [
    { key: 'label', header: 'Week', render: (r) => <span className="font-medium text-ink">{r.label}</span> },
    { key: 'leads', header: 'New leads', align: 'right', sortValue: (r) => r.leads, render: (r) => <span className="tabular-nums text-ink-2">{r.leads}</span> },
    { key: 'registered', header: 'Registered', align: 'right', sortValue: (r) => r.registered, render: (r) => <span className="tabular-nums text-ink-2">{r.registered}</span> },
    { key: 'rate', header: 'Conversion', align: 'right', render: (r) => <span className="stat text-[14px] text-ink">{r.rate}</span> },
  ]
  const tableRows = registrationTrend.map((t) => ({
    id: t.label, label: t.label, leads: t.leads, registered: t.registered,
    rate: `${Math.round((t.registered / t.leads) * 100)}%`,
  }))

  return (
    <motion.div variants={stagger.item} className="space-y-4">
      <ChartCard
        eyebrow="Primary"
        title="Registration trend"
        subtitle="New leads and completed registrations, last 8 weeks"
        legend={[{ key: 'leads', label: 'New leads', color: SERIES[0] }, { key: 'registered', label: 'Registered', color: SERIES[2] }]}
        table={{ head: ['Week', 'Leads', 'Registered'], rows: registrationTrend.map((t) => [t.label, t.leads, t.registered]) }}
      >
        <TrendChart height={296} minZero
          data={registrationTrend.map((t) => ({ label: t.label, leads: t.leads, registered: t.registered }))}
          series={[
            { key: 'leads', label: 'New leads', color: SERIES[0], area: true },
            { key: 'registered', label: 'Registered', color: SERIES[2] },
          ]} />
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard eyebrow="Funnel" title="Lead to roster conversion" subtitle="Where families drop out of the intake process"
          table={{ head: ['Stage', 'Count'], rows: funnel.map((f) => [f.label, f.value]) }}>
          <FunnelFlow stages={funnel} />
        </ChartCard>
        <ChartCard eyebrow="Breakdown" title="Registrations by program" subtitle="Season to date across all age groups"
          table={{ head: ['Program', 'Registrations'], rows: registrationsByProgram.map((p) => [p.label, p.value]) }}>
          <div className="pt-2">
            <BarCompare data={registrationsByProgram.map((p) => ({ id: p.label, label: p.label, value: p.value }))} />
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InsightCard tone="neutral" icon={ClipboardList} value={String(funnel[0].value)} label="New leads in the last 30 days" sub="Website, open gym and referrals" />
        <InsightCard tone="good" icon={TrendingUp} value={`${conversion}%`} label="Lead to roster conversion" sub={`${funnel[3].value} placed of ${funnel[0].value} leads`} />
        <InsightCard tone="warn" icon={Activity} value={String(registrations.filter((r) => r.stage === 'new' || r.stage === 'review').length)}
          label="Registrations awaiting review" sub="Oldest submitted 3 days ago" />
        <InsightCard tone="neutral" icon={Users} value={String(registrations.filter((r) => r.evaluation.status === 'complete').length)}
          label="Evaluations completed" sub={`${registrations.filter((r) => r.evaluation.status === 'scheduled').length} still scheduled`} />
      </div>

      <DataTable rows={tableRows} columns={cols} footer="Weekly intake performance" />
    </motion.div>
  )
}

/* ================= Payments ================= */
function PaymentReport({ payments }: { payments: ReturnType<typeof useApp>['payments'] }) {
  const total = collected + pendingTotal + overdueTotal
  const segments = [
    { key: 'paid', label: 'Paid', value: (collected / total) * 100, amount: collected, color: PAY_SEGMENT_COLORS.paid },
    { key: 'pending', label: 'Pending', value: (pendingTotal / total) * 100, amount: pendingTotal, color: PAY_SEGMENT_COLORS.pending },
    { key: 'overdue', label: 'Overdue', value: (overdueTotal / total) * 100, amount: overdueTotal, color: PAY_SEGMENT_COLORS.overdue },
  ]
  const byProgram = [...new Set(payments.map((p) => p.program))].map((prog) => ({
    id: prog, label: prog,
    value: payments.filter((p) => p.program === prog).reduce((s, p) => s + p.amount, 0),
    sub: `${payments.filter((p) => p.program === prog).length} families`,
  }))

  return (
    <motion.div variants={stagger.item} className="space-y-4">
      <ChartCard
        eyebrow="Primary"
        title="Collections over time"
        subtitle="Monthly collected dues against the outstanding balance"
        legend={[{ key: 'collected', label: 'Collected', color: SERIES[0] }, { key: 'outstanding', label: 'Outstanding', color: STATUS.warn }]}
        table={{ head: ['Month', 'Collected', 'Outstanding'], rows: paymentTrend.map((p) => [p.label, money(p.collected), money(p.outstanding)]) }}
      >
        <TrendChart height={296} minZero yFormat={(v) => `$${Math.round(v / 1000)}k`}
          data={paymentTrend.map((p) => ({ label: p.label, collected: p.collected, outstanding: p.outstanding }))}
          series={[
            { key: 'collected', label: 'Collected', color: SERIES[0], area: true },
            { key: 'outstanding', label: 'Outstanding', color: STATUS.warn },
          ]} />
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard eyebrow="Distribution" title="Payment status" subtitle="Share of the season ledger by state"
          table={{ head: ['Status', 'Amount', 'Share'], rows: segments.map((s) => [s.label, money(s.amount), `${s.value.toFixed(0)}%`]) }}>
          <PaymentArc segments={segments} total={collected} size={250} caption="this season" />
        </ChartCard>
        <ChartCard eyebrow="Breakdown" title="Revenue by program" subtitle="Total invoiced across the season"
          table={{ head: ['Program', 'Invoiced'], rows: byProgram.map((p) => [p.label, money(p.value)]) }}>
          <div className="pt-2"><BarCompare data={byProgram} format={(v) => money(v)} /></div>
        </ChartCard>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InsightCard tone="good" icon={Wallet} value={money(collected)} label="Collected this season" sub={`${Math.round((collected / total) * 100)}% of the ledger`} />
        <InsightCard tone="warn" icon={Activity} value={money(pendingTotal)} label="Pending, not yet due" sub={`${payments.filter((p) => p.status === 'pending').length} invoices`} />
        <InsightCard tone="bad" icon={AlertTriangle} value={money(overdueTotal)} label="Overdue balance" sub={`${payments.filter((p) => p.status === 'overdue').length} families past due`} />
        <InsightCard tone="neutral" icon={TrendingUp} value={money(Math.round(collected / (payments.filter((p) => p.status === 'paid').length || 1)))}
          label="Average payment" sub={`${payments.length} total records`} />
      </div>
    </motion.div>
  )
}

/* ================= Participation ================= */
function ParticipationReport({ scopedTeams }: { scopedTeams: typeof teams }) {
  const rows = participationByTeam.filter((p) => scopedTeams.some((t) => t.id === p.teamId))
  const totalPlayers = rows.reduce((s, r) => s + r.players, 0)
  const totalPractices = rows.reduce((s, r) => s + r.practicesAttended, 0)
  const totalGames = rows.reduce((s, r) => s + r.gamesPlayed, 0)

  const cols: Column<(typeof rows)[number] & { id: string }>[] = [
    { key: 'team', header: 'Team', sortValue: (r) => r.name, render: (r) => {
      const t = teamById(r.teamId)!
      return (
        <div className="flex items-center gap-2.5">
          <TeamCrest short={t.short} color={t.color} size="sm" />
          <div><div className="font-medium text-ink">{r.name}</div><div className="text-[12px] text-ink-3">{t.ageGroup} · {t.division}</div></div>
        </div>
      )
    } },
    { key: 'players', header: 'Players', align: 'right', sortValue: (r) => r.players, render: (r) => (
      <span className="tabular-nums text-ink-2">{r.players}<span className="text-ink-4">/{r.capacity}</span></span>
    ) },
    { key: 'practices', header: 'Practice attendances', align: 'right', sortValue: (r) => r.practicesAttended, render: (r) => <span className="tabular-nums text-ink-2">{r.practicesAttended}</span> },
    { key: 'games', header: 'Games played', align: 'right', sortValue: (r) => r.gamesPlayed, render: (r) => <span className="tabular-nums text-ink-2">{r.gamesPlayed}</span> },
    { key: 'fill', header: 'Roster fill', align: 'right', sortValue: (r) => r.players / r.capacity, render: (r) => (
      <span className="stat text-[14px] text-ink">{Math.round((r.players / r.capacity) * 100)}%</span>
    ) },
  ]

  return (
    <motion.div variants={stagger.item} className="space-y-4">
      <ChartCard
        eyebrow="Primary"
        title="Active players by team"
        subtitle="Roster size against capacity across the academy"
        table={{ head: ['Team', 'Players', 'Capacity'], rows: rows.map((r) => [r.name, r.players, r.capacity]) }}
      >
        <div className="pt-2">
          <BarCompare
            data={rows.map((r) => ({
              id: r.teamId, label: r.name, value: r.players,
              color: SERIES[teams.findIndex((t) => t.id === r.teamId) % SERIES.length],
              sub: `${r.capacity - r.players} open spots · ${Math.round((r.players / r.capacity) * 100)}% full`,
            }))}
            max={Math.max(...rows.map((r) => r.capacity))}
          />
        </div>
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard eyebrow="Sessions" title="Practices attended" subtitle="Total player-sessions logged this season"
          table={{ head: ['Team', 'Practice attendances'], rows: rows.map((r) => [r.name, r.practicesAttended]) }}>
          <div className="pt-2"><BarCompare data={rows.map((r) => ({ id: r.teamId, label: r.name, value: r.practicesAttended }))} /></div>
        </ChartCard>
        <ChartCard eyebrow="Competition" title="Games played" subtitle="Completed games per team this season"
          table={{ head: ['Team', 'Games played'], rows: rows.map((r) => [r.name, r.gamesPlayed]) }}>
          <div className="pt-2"><BarCompare color={SERIES[1]} data={rows.map((r) => ({ id: r.teamId, label: r.name, value: r.gamesPlayed }))} /></div>
        </ChartCard>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InsightCard tone="neutral" icon={Users} value={String(totalPlayers)} label="Players on competitive rosters" sub={`Across ${rows.length} teams`} />
        <InsightCard tone="good" icon={Activity} value={String(totalPractices)} label="Practice attendances logged" sub="Season to date" />
        <InsightCard tone="neutral" icon={Target} value={String(totalGames)} label="Games played" sub="Completed and finalized" />
        <InsightCard tone="warn" icon={TrendingUp}
          value={`${Math.round((totalPlayers / rows.reduce((s, r) => s + r.capacity, 0)) * 100)}%`}
          label="Academy roster capacity used" sub={`${rows.reduce((s, r) => s + (r.capacity - r.players), 0)} spots open`} />
      </div>

      <DataTable rows={rows.map((r) => ({ ...r, id: r.teamId }))} columns={cols} initialSort={{ key: 'players', dir: 'desc' }}
        footer={`${rows.length} teams · ${totalPlayers} players`} />
    </motion.div>
  )
}
