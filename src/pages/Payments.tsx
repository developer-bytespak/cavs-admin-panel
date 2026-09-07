import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CreditCard, Download, Bell, ArrowRight, Wallet, AlertTriangle, Clock } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { PROGRAMS } from '../data/mock'
import type { Payment } from '../data/types'
import { cn, fmtDate, money, relativeDay } from '../lib/utils'
import { SERIES, STATUS } from '../lib/palette'
import { paymentTrend } from '../data/analytics'
import { stagger } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button, IconButton } from '../components/ui/Button'
import { FilterBar, FilterSelect } from '../components/ui/FilterBar'
import { DataTable, type Column } from '../components/ui/DataTable'
import { StatusBadge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Avatar } from '../components/ui/Avatar'
import { ChartCard } from '../components/charts/ChartCard'
import { TrendChart } from '../components/charts/TrendChart'
import { PaymentArc, PAY_SEGMENT_COLORS } from '../components/charts/PaymentArc'
import { InsightCard } from '../components/domain/MetricCard'

export default function Payments() {
  const { payments, setPaymentStatus, toast } = useApp()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(params.get('status') ?? 'all')
  const [program, setProgram] = useState('all')

  const collected = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const pending = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
  const overdue = payments.filter((p) => p.status === 'overdue').reduce((s, p) => s + p.amount, 0)
  const total = collected + pending + overdue
  const attention = payments.filter((p) => p.status !== 'paid').length

  const segments = [
    { key: 'paid', label: 'Paid', value: (collected / total) * 100, amount: collected, color: PAY_SEGMENT_COLORS.paid },
    { key: 'pending', label: 'Pending', value: (pending / total) * 100, amount: pending, color: PAY_SEGMENT_COLORS.pending },
    { key: 'overdue', label: 'Overdue', value: (overdue / total) * 100, amount: overdue, color: PAY_SEGMENT_COLORS.overdue },
  ]

  const filtered = useMemo(() => payments.filter((p) => {
    if (search) {
      const s = search.toLowerCase()
      if (!p.family.toLowerCase().includes(s) && !p.playerName.toLowerCase().includes(s)) return false
    }
    if (status !== 'all' && p.status !== status) return false
    if (program !== 'all' && p.program !== program) return false
    return true
  }), [payments, search, status, program])

  const activeFilters = [status, program].filter((v) => v !== 'all').length + (search ? 1 : 0)
  const clear = () => { setStatus('all'); setProgram('all'); setSearch('') }

  const cols: Column<Payment>[] = [
    { key: 'family', header: 'Player / Family', sortValue: (p) => p.family, render: (p) => (
      <div className="flex items-center gap-2.5">
        <Avatar first={p.playerName.split(' ')[0]} last={p.playerName.split(' ')[1] ?? ''} size="sm" />
        <div className="min-w-0">
          <div className="truncate font-medium text-ink">{p.playerName}</div>
          <div className="truncate text-[12px] text-ink-3">{p.family}</div>
        </div>
      </div>
    ) },
    { key: 'program', header: 'Program', sortValue: (p) => p.program, render: (p) => <span className="text-ink-2">{p.program}</span> },
    { key: 'amount', header: 'Amount', align: 'right', sortValue: (p) => p.amount, render: (p) => (
      <span className="stat text-[15px] text-ink">{money(p.amount)}</span>
    ) },
    { key: 'due', header: 'Due date', sortValue: (p) => p.due, hideBelow: 'md', render: (p) => (
      <span className={cn('text-ink-2', p.status === 'overdue' && 'text-bad font-medium')}>
        {fmtDate(p.due, 'short')}
        {p.status === 'overdue' && <span className="ml-1.5 text-[11.5px]">overdue</span>}
      </span>
    ) },
    { key: 'activity', header: 'Last activity', hideBelow: 'lg', sortValue: (p) => p.lastActivity, render: (p) => (
      <span className="text-ink-3">{relativeDay(p.lastActivity)}</span>
    ) },
    { key: 'status', header: 'Status', align: 'right', render: (p) => <StatusBadge status={p.status} size="xs" /> },
  ]

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={stagger.item}>
        <PageHeader
          eyebrow="Finance"
          title="Payments"
          description="Season dues across the academy — what has been collected, what is pending, and which families need a nudge."
          actions={
            <>
              <Button variant="secondary" icon={Download} onClick={() => toast({ tone: 'info', title: 'Export queued', body: `${filtered.length} payment records will be prepared as a CSV.` })}>Export</Button>
              <Button variant="accent" icon={Bell} onClick={() => toast({ tone: 'success', title: 'Reminders sent', body: `${attention} families received a dues reminder.` })}>Send reminders</Button>
            </>
          }
        />
      </motion.div>

      <motion.section variants={stagger.item} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Collected" value={money(collected)} sub={`${Math.round((collected / total) * 100)}% of the season ledger`} tone="good" />
        <MetricTile label="Pending" value={money(pending)} sub={`${payments.filter((p) => p.status === 'pending').length} invoices not yet due`} tone="warn" />
        <MetricTile label="Overdue" value={money(overdue)} sub={`${payments.filter((p) => p.status === 'overdue').length} families past due`} tone="bad" />
        <MetricTile label="Transactions" value={String(payments.length)} sub={`${payments.filter((p) => p.status === 'paid').length} settled this season`} tone="neutral" />
      </motion.section>

      <motion.section variants={stagger.item} className="grid gap-4 xl:grid-cols-[1fr_1.5fr]">
        <ChartCard
          eyebrow="Payment health"
          title="Season collections"
          subtitle={`${money(pending + overdue)} outstanding across ${attention} families`}
          table={{ head: ['Status', 'Amount', 'Share'], rows: segments.map((s) => [s.label, money(s.amount), `${s.value.toFixed(0)}%`]) }}
        >
          <PaymentArc segments={segments} total={collected} size={244} caption="this season" />
        </ChartCard>

        <ChartCard
          eyebrow="Trend"
          title="Collections over time"
          subtitle="Monthly collected dues against the outstanding balance"
          legend={[
            { key: 'collected', label: 'Collected', color: SERIES[0] },
            { key: 'outstanding', label: 'Outstanding', color: STATUS.warn },
          ]}
          table={{ head: ['Month', 'Collected', 'Outstanding'], rows: paymentTrend.map((p) => [p.label, money(p.collected), money(p.outstanding)]) }}
        >
          <TrendChart
            height={258}
            minZero
            data={paymentTrend.map((p) => ({ label: p.label, collected: p.collected, outstanding: p.outstanding }))}
            yFormat={(v) => `$${Math.round(v / 1000)}k`}
            series={[
              { key: 'collected', label: 'Collected', color: SERIES[0], area: true },
              { key: 'outstanding', label: 'Outstanding', color: STATUS.warn },
            ]}
          />
        </ChartCard>
      </motion.section>

      <motion.section variants={stagger.item} className="grid gap-3 sm:grid-cols-3">
        <InsightCard tone="bad" icon={AlertTriangle} value={String(payments.filter((p) => p.status === 'overdue').length)}
          label="Families more than 7 days past due" sub={`${money(overdue)} outstanding`} />
        <InsightCard tone="warn" icon={Clock} value={String(payments.filter((p) => p.status === 'pending').length)}
          label="Invoices coming due in the next two weeks" sub={money(pending)} />
        <InsightCard tone="good" icon={Wallet} value={`${Math.round((collected / total) * 100)}%`}
          label="Of the season ledger already collected" sub={`${money(collected)} received`} />
      </motion.section>

      <motion.div variants={stagger.item}>
        <FilterBar search={search} onSearch={setSearch} placeholder="Search by family or player…" active={activeFilters} onClear={clear}>
          <FilterSelect label="Status" value={status} onChange={setStatus} options={[
            { value: 'paid', label: 'Paid' }, { value: 'pending', label: 'Pending' }, { value: 'overdue', label: 'Overdue' },
          ]} />
          <FilterSelect label="Program" value={program} onChange={setProgram} options={PROGRAMS.map((p) => ({ value: p.label, label: p.label }))} />
        </FilterBar>
      </motion.div>

      <motion.div variants={stagger.item}>
        <DataTable
          rows={filtered}
          columns={cols}
          onRowClick={(p) => navigate(`/payments/${p.id}`)}
          initialSort={{ key: 'due', dir: 'asc' }}
          rowActions={(p) => (
            <>
              {p.status !== 'paid' && (
                <Button size="xs" variant="secondary" onClick={() => {
                  setPaymentStatus(p.id, 'paid')
                  toast({ tone: 'success', title: 'Payment recorded', body: `${money(p.amount)} marked as paid for ${p.family}.` })
                }}>Mark paid</Button>
              )}
              <IconButton icon={ArrowRight} label="Open payment" onClick={() => navigate(`/payments/${p.id}`)} />
            </>
          )}
          empty={{
            title: 'No payments match these filters',
            description: 'Try a different status or program.',
            action: <Button variant="secondary" onClick={clear}>Clear filters</Button>,
          }}
          footer={`${filtered.length} of ${payments.length} records · ${money(filtered.reduce((s, p) => s + p.amount, 0))} total`}
        />
      </motion.div>

      {payments.length === 0 && (
        <Card><EmptyState icon={CreditCard} title="No payment records yet" description="Season invoices appear here once registrations are completed." /></Card>
      )}

      <motion.div variants={stagger.item}>
        <p className="text-center text-[11.5px] text-ink-4">
          Payment processing connects in a later phase. This ledger reflects academy records only.{' '}
          <Link to="/reports/payments" className="text-royal hover:underline">See the payment report →</Link>
        </p>
      </motion.div>
    </motion.div>
  )
}

function MetricTile({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const tones = { good: 'text-good', warn: 'text-warn', bad: 'text-bad', neutral: 'text-ink' }
  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
      <div className="eyebrow">{label}</div>
      <div className={cn('stat mt-2.5 text-[32px] leading-none', tones[tone])}>{value}</div>
      <div className="mt-2 text-[12.5px] text-ink-3">{sub}</div>
    </div>
  )
}
