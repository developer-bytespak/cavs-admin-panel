import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Receipt, Wallet, Send, Download, AlertTriangle, TrendingUp, CreditCard,
  Phone, Eye, RefreshCw, CalendarClock, CheckCircle2, Plus, ArrowRight, Sparkles,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { teams, teamById, d } from '../data/mock'
import {
  billingMetrics, needsAttention, attentionReason, recommendedAction, daysOverdue,
  collectionsByMonth, upcomingInstallments, byTeam, byProgram,
  BILLING_PROGRAMS, PAYMENT_PLANS,
} from '../data/billing'
import type { Invoice } from '../data/types'
import { cn, fmtDate, money, relativeDay } from '../lib/utils'
import { SERIES, STATUS } from '../lib/palette'
import { stagger } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button, IconButton } from '../components/ui/Button'
import { Tabs } from '../components/ui/Tabs'
import { FilterBar, FilterSelect } from '../components/ui/FilterBar'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Avatar, TeamCrest } from '../components/ui/Avatar'
import { Checkbox } from '../components/ui/Field'
import { ChartCard } from '../components/charts/ChartCard'
import { TrendChart } from '../components/charts/TrendChart'
import { BarCompare } from '../components/charts/BarCompare'
import { useCountUp, useInViewOnce } from '../components/charts/chart-kit'
import { Sparkline } from '../components/charts/Sparkline'
import { PaymentHealth, HEALTH_COLORS } from '../components/billing/PaymentHealth'
import { InvoiceStatusBadge, INVOICE_STATUS_OPTIONS } from '../components/billing/InvoiceStatusBadge'
import { BalanceBar } from '../components/billing/InstallmentTimeline'
import {
  RecordPaymentModal, CreateInvoiceModal, ReminderModal, CreatePlanModal,
} from '../components/billing/BillingModals'

/** Precomputed so filtering stays a pure function of props and state. */
const RANGE_CUTOFF: Record<string, string> = { '7': d(7), '30': d(30), '90': d(90) }

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'invoices', label: 'All Invoices' },
  { key: 'attention', label: 'Needs Attention' },
  { key: 'plans', label: 'Payment Plans' },
]

export default function Payments() {
  const { invoices, families, toast } = useApp()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()

  const [tab, setTab] = useState(params.get('view') ?? 'overview')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(params.get('status') ?? 'all')
  const [team, setTeam] = useState('all')
  const [program, setProgram] = useState('all')
  const [plan, setPlan] = useState('all')
  const [autopay, setAutopay] = useState('all')
  const [range, setRange] = useState('all')
  const [amount, setAmount] = useState('all')
  const [selected, setSelected] = useState<string[]>([])
  const [modal, setModal] = useState<null | 'record' | 'invoice' | 'remind' | 'plan'>(null)
  const [remindTargets, setRemindTargets] = useState<Invoice[]>([])
  const [recordTarget, setRecordTarget] = useState<Invoice | undefined>()

  const m = useMemo(() => billingMetrics(invoices), [invoices])
  const trend = useMemo(() => collectionsByMonth(invoices, 6), [invoices])
  const upcoming = useMemo(() => upcomingInstallments(invoices, 30), [invoices])
  const teamRows = useMemo(() => byTeam(invoices), [invoices])
  const programRows = useMemo(() => byProgram(invoices), [invoices])
  const attentionRows = useMemo(() => invoices.filter(needsAttention)
    .sort((a, b) => daysOverdue(b) - daysOverdue(a)), [invoices])

  const goToAttention = () => { setTab('attention'); setParams({ view: 'attention' }, { replace: true }) }

  const filtered = useMemo(() => invoices.filter((i) => {
    if (search) {
      const s = search.toLowerCase()
      if (!i.playerName.toLowerCase().includes(s) && !i.familyName.toLowerCase().includes(s) && !i.id.toLowerCase().includes(s)) return false
    }
    if (status !== 'all' && i.status !== status) return false
    if (team !== 'all' && i.teamId !== team) return false
    if (program !== 'all' && i.program !== program) return false
    if (plan !== 'all' && i.planId !== plan) return false
    if (autopay !== 'all' && String(i.autopay) !== autopay) return false
    /* Compare ISO date strings against a precomputed cutoff — no clock read during render. */
    if (range !== 'all' && i.nextDue && i.nextDue > (RANGE_CUTOFF[range] ?? '9999-12-31')) return false
    if (amount !== 'all') {
      const [lo, hi] = { low: [0, 500], mid: [500, 1000], high: [1000, Infinity] }[amount] ?? [0, Infinity]
      if (i.total < lo || i.total >= hi) return false
    }
    return true
  }), [invoices, search, status, team, program, plan, autopay, range, amount])

  const activeFilters = [status, team, program, plan, autopay, range, amount].filter((v) => v !== 'all').length + (search ? 1 : 0)
  const clear = () => {
    setStatus('all'); setTeam('all'); setProgram('all'); setPlan('all')
    setAutopay('all'); setRange('all'); setAmount('all'); setSearch('')
    setParams({}, { replace: true })
  }

  const openRemind = (list: Invoice[]) => { setRemindTargets(list); setModal('remind') }

  /* ---------------- Columns ---------------- */
  const invoiceCols: Column<Invoice>[] = [
    { key: 'family', header: 'Family / Player', width: '22%', sortValue: (i) => i.playerName, render: (i) => (
      <div className="flex items-center gap-2.5">
        <Avatar first={i.playerName.split(' ')[0]} last={i.playerName.split(' ')[1] ?? ''} size="sm" />
        <div className="min-w-0">
          <div className="truncate font-medium text-ink">{i.playerName}</div>
          <div className="truncate text-[12px] text-ink-3">{i.familyName}</div>
        </div>
      </div>
    ) },
    { key: 'program', header: 'Program / Team', hideBelow: 'lg', sortValue: (i) => i.program, render: (i) => {
      const t = i.teamId ? teamById(i.teamId) : null
      return (
        <div className="flex items-center gap-2">
          {t && <TeamCrest short={t.short} color={t.color} size="sm" />}
          <div className="min-w-0">
            <div className="truncate text-[12.5px] text-ink-2">{i.program}</div>
            <div className="truncate text-[11.5px] text-ink-4">{t ? t.name : 'Academy Program'}</div>
          </div>
        </div>
      )
    } },
    { key: 'invoice', header: 'Invoice', sortValue: (i) => i.id, render: (i) => (
      <span className="font-medium tabular-nums text-ink-2">{i.id}</span>
    ) },
    { key: 'total', header: 'Total', align: 'right', sortValue: (i) => i.total, render: (i) => (
      <span className="tabular-nums text-ink-2">{money(i.total)}</span>
    ) },
    { key: 'paid', header: 'Paid', align: 'right', hideBelow: 'md', sortValue: (i) => i.paid, render: (i) => (
      <div className="min-w-[92px]"><BalanceBar paid={i.paid} total={i.total} /></div>
    ) },
    { key: 'balance', header: 'Balance', align: 'right', sortValue: (i) => i.balance, render: (i) => (
      <span className={cn('stat text-[15px]', i.balance > 0 ? 'text-ink' : 'text-good')}>{money(i.balance)}</span>
    ) },
    { key: 'due', header: 'Next Due', hideBelow: 'lg', sortValue: (i) => i.nextDue ?? 'zzz', render: (i) => (
      i.nextDue
        ? <span className={cn('text-ink-2', (i.status === 'overdue' || i.status === 'failed') && 'font-medium text-orange')}>
            {fmtDate(i.nextDue, 'short')}
            <span className="block text-[11.5px] text-ink-4">{relativeDay(i.nextDue)}</span>
          </span>
        : <span className="text-ink-4">—</span>
    ) },
    { key: 'plan', header: 'Payment Plan', hideBelow: 'lg', sortValue: (i) => i.planName, render: (i) => (
      <Badge tone={i.installments.length > 1 ? 'blue' : 'neutral'} dot={false} size="xs">{i.planName}</Badge>
    ) },
    { key: 'autopay', header: 'AutoPay', align: 'center', hideBelow: 'lg', render: (i) => (
      i.autopay
        ? <span className="inline-flex items-center gap-1 text-[12px] font-medium text-good"><CheckCircle2 className="h-3.5 w-3.5" />On</span>
        : <span className="text-[12px] text-ink-4">{i.method ? 'Off' : 'No method'}</span>
    ) },
    { key: 'status', header: 'Status', align: 'right', render: (i) => <InvoiceStatusBadge status={i.status} size="xs" /> },
  ]

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={stagger.item}>
        <PageHeader
          eyebrow="Finance"
          title="Payments"
          description="Track collections, payment plans, outstanding balances and family accounts."
          actions={
            <>
              <Button variant="secondary" icon={Receipt} onClick={() => setModal('invoice')}>Create invoice</Button>
              <Button variant="secondary" icon={Wallet} onClick={() => { setRecordTarget(undefined); setModal('record') }}>Record payment</Button>
              <Button variant="accent" icon={Send} onClick={() => openRemind(attentionRows)}>Send reminders</Button>
            </>
          }
        />
      </motion.div>

      {/* ---------------- Metric strip — asymmetric ---------------- */}
      <motion.section variants={stagger.item} className="grid gap-4 lg:grid-cols-[1.45fr_1fr_1fr]">
        <MetricPrimary
          label="Total collected" value={m.collected}
          trend="↑ 8.4% vs last month"
          spark={trend.map((t) => t.collected)}
          sub={`${money(m.billed)} billed across ${invoices.length} invoices this season`}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <MetricSmall label="Outstanding" value={m.outstanding} tone="warn"
            sub={`${invoices.filter((i) => i.balance > 0).length} invoices with a balance`} />
          <MetricSmall label="Overdue" value={m.overdue} tone="bad" accent
            sub={`${m.overdueCount} past due · ${money(m.failed)} failed`} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <MetricSmall label="Upcoming" value={m.upcoming} tone="neutral"
            sub={`${upcoming.length} installments in the next 30 days`} />
          <MetricSmall label="Collection rate" value={m.collectionRate} suffix="%" decimals={1} tone="good"
            sub="Of everything already due" />
        </div>
      </motion.section>

      <motion.div variants={stagger.item}>
        <Tabs value={tab} onChange={(k) => { setTab(k); setParams(k === 'overview' ? {} : { view: k }, { replace: true }) }}
          items={TABS.map((t) => ({ ...t, count: t.key === 'attention' ? attentionRows.length : t.key === 'invoices' ? invoices.length : undefined }))} />
      </motion.div>

      {/* ================= OVERVIEW ================= */}
      {tab === 'overview' && (
        <motion.div variants={stagger.item} className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1fr_1.5fr]">
            <ChartCard
              eyebrow="Payment health"
              title="Where the season stands"
              subtitle="Collected against everything still owed"
              table={{
                head: ['Bucket', 'Amount', 'Share'],
                rows: [
                  ['Collected', money(m.collected), `${((m.collected / (m.billed || 1)) * 100).toFixed(0)}%`],
                  ['Upcoming', money(m.upcoming + m.dueSoon), `${(((m.upcoming + m.dueSoon) / (m.billed || 1)) * 100).toFixed(0)}%`],
                  ['Overdue', money(m.overdue), `${((m.overdue / (m.billed || 1)) * 100).toFixed(0)}%`],
                  ['Failed', money(m.failed), `${((m.failed / (m.billed || 1)) * 100).toFixed(0)}%`],
                ],
              }}
            >
              <PaymentHealth
                collected={m.collected}
                rate={m.collectionRate}
                needsAttention={m.needsAttention}
                onAttentionClick={goToAttention}
                trend="↑ 8.4% vs last month"
                segments={[
                  { key: 'paid', label: 'Paid', amount: m.collected, color: HEALTH_COLORS.paid },
                  { key: 'upcoming', label: 'Upcoming', amount: m.upcoming + m.dueSoon, color: HEALTH_COLORS.upcoming },
                  { key: 'overdue', label: 'Overdue', amount: m.overdue, color: HEALTH_COLORS.overdue },
                  { key: 'failed', label: 'Failed', amount: m.failed, color: HEALTH_COLORS.failed },
                ]}
              />
            </ChartCard>

            <ChartCard
              eyebrow="Trend"
              title="Collections over time"
              subtitle="Monthly collected dues against what fell overdue"
              legend={[
                { key: 'collected', label: 'Collected', color: SERIES[0] },
                { key: 'outstanding', label: 'Fell overdue', color: STATUS.warn },
              ]}
              table={{ head: ['Month', 'Collected', 'Overdue'], rows: trend.map((t) => [t.label, money(t.collected), money(t.outstanding)]) }}
            >
              <TrendChart
                height={286} minZero
                data={trend.map((t) => ({ label: t.label, collected: t.collected, outstanding: t.outstanding }))}
                yFormat={(v) => `$${Math.round(v / 1000)}k`}
                series={[
                  { key: 'collected', label: 'Collected', color: SERIES[0], area: true },
                  { key: 'outstanding', label: 'Fell overdue', color: STATUS.warn },
                ]}
              />
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
            <Card padded={false}>
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-5">
                <CardHeader eyebrow="Next 30 days" title="Upcoming installments"
                  subtitle={`${money(upcoming.reduce((s, u) => s + u.installment.amount, 0))} scheduled to collect`} />
                <Button size="xs" variant="ghost" iconRight={ArrowRight} onClick={() => { setTab('invoices'); setRange('30') }}>
                  All invoices
                </Button>
              </div>
              <div className="px-2 pb-3">
                {upcoming.length === 0 ? (
                  <EmptyState compact icon={CalendarClock} title="Nothing scheduled in the next 30 days"
                    description="Installments appear here as their due dates approach." />
                ) : upcoming.slice(0, 7).map(({ invoice, installment }) => (
                  <button key={`${invoice.id}-${installment.id}`} onClick={() => navigate(`/payments/${invoice.id}`)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#F7F8FB]">
                    <Avatar first={invoice.playerName.split(' ')[0]} last={invoice.playerName.split(' ')[1] ?? ''} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-ink">{invoice.playerName}</div>
                      <div className="truncate text-[11.5px] text-ink-3">
                        {invoice.id} · Installment {installment.number} of {invoice.installments.length}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="stat text-[15px] leading-none text-ink">{money(installment.amount)}</div>
                      <div className="mt-1 text-[11.5px] text-ink-4">{relativeDay(installment.dueDate)}</div>
                    </div>
                    {invoice.autopay
                      ? <Badge tone="good" dot={false} size="xs">AutoPay</Badge>
                      : <Badge tone="neutral" dot={false} size="xs">Manual</Badge>}
                  </button>
                ))}
              </div>
            </Card>

            <div className="grid gap-4">
              <ChartCard eyebrow="By team" title="Collected by team" subtitle="Season to date"
                table={{ head: ['Team', 'Collected', 'Outstanding'], rows: teamRows.map((t) => [t.name, money(t.collected), money(t.outstanding)]) }}>
                <div className="pt-1">
                  <BarCompare
                    data={teamRows.map((t) => ({
                      id: t.teamId, label: t.name, value: t.collected,
                      color: SERIES[teams.findIndex((x) => x.id === t.teamId) % SERIES.length],
                      sub: t.outstanding > 0 ? `${money(t.outstanding)} outstanding` : 'Fully collected',
                    }))}
                    format={(v) => money(v)}
                    onSelect={(id) => { setTab('invoices'); setTeam(id) }}
                  />
                </div>
              </ChartCard>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InsightTile tone="good" icon={TrendingUp} value={`${m.collectionRate.toFixed(1)}%`}
              label="Collection rate" sub="Of everything already due" />
            <InsightTile tone="good" icon={Sparkles} value="↑ 8.4%" label="Collection improved this month" sub="vs the previous 30 days" />
            <InsightTile tone="bad" icon={AlertTriangle} value={money(m.overdue)} label="Currently overdue"
              sub={`${m.overdueCount} accounts past due`} onClick={goToAttention} />
            <InsightTile tone="warn" icon={Phone} value={String(m.needsAttention)} label="Families need attention"
              sub="Overdue, failed or no method on file" onClick={goToAttention} />
          </div>
        </motion.div>
      )}

      {/* ================= ALL INVOICES ================= */}
      {tab === 'invoices' && (
        <motion.div variants={stagger.item} className="space-y-3">
          <FilterBar
            search={search} onSearch={setSearch} placeholder="Search family, player or invoice…"
            active={activeFilters} onClear={clear}
            right={
              <>
                <Button size="sm" variant="ghost" icon={Download}
                  onClick={() => toast({ tone: 'info', title: 'Export queued', body: `${filtered.length} invoices will be prepared as a CSV.` })}>
                  Export
                </Button>
                {selected.length > 0 && (
                  <Button size="sm" variant="accent" icon={Send}
                    onClick={() => openRemind(invoices.filter((i) => selected.includes(i.id)))}>
                    Remind {selected.length}
                  </Button>
                )}
              </>
            }
          >
            <FilterSelect label="Status" value={status} onChange={setStatus} options={INVOICE_STATUS_OPTIONS} />
            <FilterSelect label="Team" value={team} onChange={setTeam} options={teams.map((t) => ({ value: t.id, label: t.name }))} />
            <FilterSelect label="Program" value={program} onChange={setProgram} options={BILLING_PROGRAMS.map((p) => ({ value: p.label, label: p.label }))} />
            <FilterSelect label="Plan" value={plan} onChange={setPlan} options={PAYMENT_PLANS.map((p) => ({ value: p.id, label: p.name }))} />
            <FilterSelect label="AutoPay" value={autopay} onChange={setAutopay} options={[{ value: 'true', label: 'On' }, { value: 'false', label: 'Off' }]} />
            <FilterSelect label="Due" value={range} onChange={setRange} options={[
              { value: '7', label: 'Next 7 days' }, { value: '30', label: 'Next 30 days' }, { value: '90', label: 'Next 90 days' },
            ]} />
            <FilterSelect label="Amount" value={amount} onChange={setAmount} options={[
              { value: 'low', label: 'Under $500' }, { value: 'mid', label: '$500 – $1,000' }, { value: 'high', label: 'Over $1,000' },
            ]} />
          </FilterBar>

          <DataTable
            rows={filtered}
            columns={[
              { key: 'select', header: (
                <Checkbox
                  checked={filtered.length > 0 && selected.length === filtered.length}
                  onChange={(v) => setSelected(v ? filtered.map((i) => i.id) : [])}
                />
              ), width: '38px', render: (i) => (
                <span onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selected.includes(i.id)}
                    onChange={(v) => setSelected((prev) => (v ? [...prev, i.id] : prev.filter((x) => x !== i.id)))} />
                </span>
              ) },
              ...invoiceCols,
            ]}
            onRowClick={(i) => navigate(`/payments/${i.id}`)}
            initialSort={{ key: 'due', dir: 'asc' }}
            rowActions={(i) => (
              <>
                <IconButton icon={Eye} label="View invoice" onClick={() => navigate(`/payments/${i.id}`)} />
                {i.balance > 0 && <IconButton icon={Wallet} label="Record payment" onClick={() => { setRecordTarget(i); setModal('record') }} />}
                {i.balance > 0 && <IconButton icon={Send} label="Send reminder" onClick={() => openRemind([i])} />}
                <IconButton icon={ArrowRight} label="Open" onClick={() => navigate(`/payments/${i.id}`)} />
              </>
            )}
            empty={{
              title: 'No invoices match these filters',
              description: 'Try a different status, team or date range.',
              action: <Button variant="secondary" onClick={clear}>Clear filters</Button>,
            }}
            footer={`${filtered.length} of ${invoices.length} invoices · ${money(filtered.reduce((s, i) => s + i.balance, 0))} outstanding`}
          />
        </motion.div>
      )}

      {/* ================= NEEDS ATTENTION ================= */}
      {tab === 'attention' && (
        <motion.div variants={stagger.item} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <InsightTile tone="bad" icon={AlertTriangle} value={String(m.overdueCount)} label="Overdue accounts" sub={money(m.overdue)} />
            <InsightTile tone="bad" icon={RefreshCw} value={String(m.failedCount)} label="Failed payments" sub={money(m.failed)} />
            <InsightTile tone="warn" icon={CreditCard}
              value={String(invoices.filter((i) => i.balance > 0 && !i.method).length)}
              label="Missing a payment method" sub="Cannot be charged automatically" />
          </div>

          {attentionRows.length === 0 ? (
            <Card>
              <EmptyState icon={CheckCircle2} title="No overdue payments. Great work."
                description="Every family is current on their plan. New issues will surface here the moment a payment fails or a due date passes." />
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#FBDCC9] bg-orange-tint px-4 py-3">
                <span className="text-[13px] font-medium text-[#A93C0E]">
                  {attentionRows.length} families need attention · {money(attentionRows.reduce((s, i) => s + i.balance, 0))} at risk
                </span>
                <Button size="sm" variant="accent" icon={Send} onClick={() => openRemind(attentionRows)}>
                  Send reminders to all
                </Button>
              </div>

              <div className="space-y-2.5">
                {attentionRows.map((inv) => {
                  const late = daysOverdue(inv)
                  return (
                    <div key={inv.id}
                      className={cn('group flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift',
                        inv.status === 'failed' ? 'border-[#F5D5D7]' : 'border-[#FBDCC9]')}>
                      <Avatar first={inv.playerName.split(' ')[0]} last={inv.playerName.split(' ')[1] ?? ''} size="md" />
                      <div className="min-w-[180px] flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={`/payments/${inv.id}`} className="text-[14px] font-semibold text-ink hover:text-royal">{inv.playerName}</Link>
                          <InvoiceStatusBadge status={inv.status} size="xs" />
                        </div>
                        <div className="mt-0.5 text-[12px] text-ink-3">
                          {inv.familyName} · {inv.id} · {inv.teamId ? teamById(inv.teamId)!.name : 'Academy Program'}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="stat text-[20px] leading-none text-ink">{money(inv.balance)}</div>
                        <div className="mt-1 text-[11.5px] text-ink-4">balance</div>
                      </div>

                      <div className="hidden text-right sm:block">
                        <div className={cn('text-[13px] font-semibold', late > 21 ? 'text-bad' : 'text-orange')}>
                          {late > 0 ? `${late} days` : '—'}
                        </div>
                        <div className="mt-0.5 text-[11.5px] text-ink-4">overdue</div>
                      </div>

                      <div className="hidden min-w-[128px] lg:block">
                        <div className="text-[12px] text-ink-3">Last reminder</div>
                        <div className="text-[12.5px] font-medium text-ink">
                          {inv.lastReminder ? relativeDay(inv.lastReminder) : 'None sent'}
                        </div>
                      </div>

                      <div className="min-w-[164px]">
                        <div className="text-[11.5px] text-ink-4">{attentionReason(inv)}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] font-medium text-royal">
                          <Sparkles className="h-3 w-3" />{recommendedAction(inv)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <Button size="xs" variant="secondary" icon={Send} onClick={() => openRemind([inv])}>Remind</Button>
                        <Button size="xs" variant="secondary" icon={Phone}
                          onClick={() => toast({ tone: 'info', title: 'Contact logged', body: `Follow-up noted for ${inv.familyName}.` })}>
                          Contact
                        </Button>
                        <Button size="xs" variant="ghost" onClick={() => navigate(`/payments/${inv.id}`)}>View</Button>
                        <Button size="xs" variant="ghost"
                          onClick={() => toast({ tone: 'success', title: 'Marked resolved', body: `${inv.playerName}'s account was flagged as handled.` })}>
                          Resolve
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* ================= PAYMENT PLANS ================= */}
      {tab === 'plans' && (
        <motion.div variants={stagger.item} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-ink-3">
              Plans families can be placed on at registration, or moved onto later when a balance needs breaking up.
            </p>
            <Button variant="primary" icon={Plus} onClick={() => setModal('plan')}>Create payment plan</Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PAYMENT_PLANS.map((p) => {
              const using = invoices.filter((i) => i.planId === p.id)
              const collected = using.reduce((s, i) => s + i.paid, 0)
              return (
                <button key={p.id} onClick={() => { setTab('invoices'); setPlan(p.id) }}
                  className="group rounded-2xl border border-line bg-card p-5 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-royal-tint text-royal">
                      <CalendarClock className="h-[18px] w-[18px]" />
                    </span>
                    {p.isPrivate && <Badge tone="neutral" dot={false} size="xs">Private</Badge>}
                  </div>
                  <h3 className="mt-3.5 text-[15.5px] font-semibold tracking-[-0.011em] text-ink">{p.name}</h3>
                  <div className="stat mt-2 text-[24px] leading-none text-ink">
                    {p.installmentCount === 1 ? 'Pay in full' : `${p.installmentCount} payments`}
                  </div>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-ink-3">{p.notes}</p>
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {p.requiresInitial && <Badge tone="blue" dot={false} size="xs">Initial payment</Badge>}
                    {p.requiresAutopay && <Badge tone="good" dot={false} size="xs">AutoPay</Badge>}
                    {p.processingFeePct > 0 && <Badge tone="warn" dot={false} size="xs">{p.processingFeePct}% fee</Badge>}
                  </div>
                  <dl className="mt-3.5 flex items-center justify-between border-t border-line-soft pt-3 text-[12px]">
                    <div>
                      <dt className="text-ink-4">Families</dt>
                      <dd className="stat text-[16px] text-ink">{using.length}</dd>
                    </div>
                    <div className="text-right">
                      <dt className="text-ink-4">Collected</dt>
                      <dd className="stat text-[16px] text-ink">{money(collected)}</dd>
                    </div>
                  </dl>
                </button>
              )
            })}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard eyebrow="Adoption" title="Families on each plan" subtitle="How the academy is paying this season"
              table={{ head: ['Plan', 'Families', 'Collected'], rows: PAYMENT_PLANS.map((p) => [p.name, invoices.filter((i) => i.planId === p.id).length, money(invoices.filter((i) => i.planId === p.id).reduce((s, i) => s + i.paid, 0))]) }}>
              <div className="pt-1">
                <BarCompare
                  data={PAYMENT_PLANS.map((p) => ({
                    id: p.id, label: p.name, value: invoices.filter((i) => i.planId === p.id).length,
                    sub: `${money(invoices.filter((i) => i.planId === p.id).reduce((s, i) => s + i.paid, 0))} collected`,
                  }))}
                  onSelect={(id) => { setTab('invoices'); setPlan(id) }}
                />
              </div>
            </ChartCard>

            <ChartCard eyebrow="By program" title="Revenue by program" subtitle="Collected against outstanding"
              table={{ head: ['Program', 'Collected', 'Outstanding'], rows: programRows.map((p) => [p.label, money(p.collected), money(p.outstanding)]) }}>
              <div className="pt-1">
                <BarCompare data={programRows.map((p) => ({
                  id: p.label, label: p.label, value: p.collected,
                  sub: `${p.invoices} invoices · ${money(p.outstanding)} outstanding`,
                }))} format={(v) => money(v)} />
              </div>
            </ChartCard>
          </div>

          <Card>
            <CardHeader eyebrow="Family accounts" title="Account credits"
              subtitle="Credit balances carried from withdrawals, overpayments and adjustments" />
            <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {families.filter((f) => f.credit > 0).map((f) => (
                <div key={f.familyName} className="flex items-center gap-3 rounded-xl border border-[#CDEBDF] bg-good-tint/50 px-3.5 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-good">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ink">{f.familyName}</div>
                    <div className="text-[11.5px] text-ink-3">Available to apply</div>
                  </div>
                  <span className="stat text-[17px] text-good">{money(f.credit)}</span>
                </div>
              ))}
              {families.filter((f) => f.credit > 0).length === 0 && (
                <p className="sm:col-span-2 xl:col-span-3 rounded-xl border border-dashed border-line p-5 text-center text-[13px] text-ink-3">
                  No family currently carries an account credit.
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      <motion.p variants={stagger.item} className="text-center text-[11.5px] text-ink-4">
        Payment processing connects in a later phase. This ledger reflects academy records only.{' '}
        <Link to="/reports/payments" className="text-royal hover:underline">See the payment report →</Link>
      </motion.p>

      {/* Modals */}
      <RecordPaymentModal open={modal === 'record'} onClose={() => setModal(null)} invoice={recordTarget} />
      <CreateInvoiceModal open={modal === 'invoice'} onClose={() => setModal(null)} />
      <ReminderModal open={modal === 'remind'} onClose={() => setModal(null)} invoices={remindTargets} />
      <CreatePlanModal open={modal === 'plan'} onClose={() => setModal(null)} />
    </motion.div>
  )
}

/* ---------------- Metric tiles ---------------- */
function MetricPrimary({ label, value, trend, spark, sub }: {
  label: string; value: number; trend: string; spark: number[]; sub: string
}) {
  const [ref, seen] = useInViewOnce<HTMLDivElement>('0px')
  const n = useCountUp(value, seen, 1100)
  return (
    <div ref={ref} className="relative overflow-hidden rounded-2xl border border-line bg-card p-5 shadow-card">
      <svg viewBox="0 0 320 120" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-0 h-full w-full opacity-[0.05]" aria-hidden="true">
        <g fill="none" stroke="#0B1F45" strokeWidth="1.2">
          <circle cx="290" cy="8" r="58" /><circle cx="290" cy="8" r="28" />
        </g>
      </svg>
      <div className="relative">
        <div className="eyebrow">{label}</div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <span className="stat text-[46px] leading-none text-ink">{money(Math.round(n))}</span>
          <Sparkline id="pay-collected" values={spark} color={SERIES[0]} width={132} height={40} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-good">
            <TrendingUp className="h-3.5 w-3.5" />{trend}
          </span>
          <span className="text-[12.5px] text-ink-3">{sub}</span>
        </div>
      </div>
    </div>
  )
}

function MetricSmall({ label, value, sub, tone, suffix, decimals = 0, accent }: {
  label: string; value: number; sub: string; tone: 'good' | 'warn' | 'bad' | 'neutral'; suffix?: string; decimals?: number; accent?: boolean
}) {
  const [ref, seen] = useInViewOnce<HTMLDivElement>('0px')
  const n = useCountUp(value, seen, 950)
  const tones = { good: 'text-good', warn: 'text-warn', bad: 'text-orange', neutral: 'text-ink' }
  return (
    <div ref={ref} className={cn('rounded-2xl border bg-card p-5 shadow-card', accent ? 'border-[#FBDCC9]' : 'border-line')}>
      <div className="eyebrow">{label}</div>
      <div className={cn('stat mt-2.5 text-[28px] leading-none', tones[tone])}>
        {suffix ? `${n.toFixed(decimals)}${suffix}` : money(Math.round(n))}
      </div>
      <div className="mt-2 text-[12px] leading-snug text-ink-3">{sub}</div>
    </div>
  )
}

function InsightTile({ value, label, sub, tone, icon: Icon, onClick }: {
  value: string; label: string; sub: string; tone: 'good' | 'warn' | 'bad' | 'neutral'
  icon: React.ComponentType<{ className?: string }>; onClick?: () => void
}) {
  const tones = { neutral: 'text-ink border-line', good: 'text-good border-[#CDEBDF]', warn: 'text-warn border-[#F3E3C0]', bad: 'text-orange border-[#FBDCC9]' }
  const Wrapper = (onClick ? 'button' : 'div') as React.ElementType
  return (
    <Wrapper onClick={onClick}
      className={cn('flex items-start gap-3 rounded-xl border bg-card p-3.5 text-left shadow-card transition-all duration-200',
        onClick && 'hover:-translate-y-0.5 hover:shadow-lift', tones[tone])}>
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/[0.04]">
        <Icon className="h-[15px] w-[15px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="stat block text-[21px] leading-none">{value}</span>
        <span className="mt-1.5 block text-[12.5px] leading-snug text-ink-2">{label}</span>
        <span className="mt-1 block text-[11.5px] text-ink-4">{sub}</span>
      </span>
    </Wrapper>
  )
}
