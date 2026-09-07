import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Columns3, Rows3, ClipboardList, ArrowRight, Clock, GripVertical, ClipboardCheck } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { PROGRAMS, teamById } from '../data/mock'
import type { Registration, RegStage } from '../data/types'
import { cn, fmtDate, relativeDay } from '../lib/utils'
import { RAMP_BLUE } from '../lib/palette'
import { funnel } from '../data/analytics'
import { stagger } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Segmented } from '../components/ui/Tabs'
import { FilterBar, FilterSelect } from '../components/ui/FilterBar'
import { DataTable, type Column } from '../components/ui/DataTable'
import { StatusBadge, Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Avatar } from '../components/ui/Avatar'
import { ChartCard } from '../components/charts/ChartCard'
import { FunnelFlow } from '../components/charts/FunnelFlow'

const STAGES: { key: RegStage; label: string; hint: string }[] = [
  { key: 'new', label: 'New', hint: 'Just submitted' },
  { key: 'review', label: 'In Review', hint: 'Staff checking details' },
  { key: 'evaluation', label: 'Evaluation', hint: 'Scheduled or in progress' },
  { key: 'ready', label: 'Ready', hint: 'Approved, awaiting placement' },
  { key: 'completed', label: 'Completed', hint: 'Registered and assigned' },
]

export default function Registrations() {
  const { registrations, moveRegistration, toast } = useApp()
  const navigate = useNavigate()
  const [view, setView] = useState('pipeline')
  const [search, setSearch] = useState('')
  const [program, setProgram] = useState('all')
  const [stage, setStage] = useState('all')
  const [evaluation, setEvaluation] = useState('all')
  const [dragId, setDragId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<RegStage | null>(null)

  const filtered = useMemo(() => registrations.filter((r) => {
    if (search && !r.playerName.toLowerCase().includes(search.toLowerCase())) return false
    if (program !== 'all' && r.program !== program) return false
    if (stage !== 'all' && r.stage !== stage) return false
    if (evaluation !== 'all' && r.evaluation.status !== evaluation) return false
    return true
  }), [registrations, search, program, stage, evaluation])

  const activeFilters = [program, stage, evaluation].filter((v) => v !== 'all').length + (search ? 1 : 0)
  const clear = () => { setProgram('all'); setStage('all'); setEvaluation('all'); setSearch('') }

  const drop = (target: RegStage) => {
    if (!dragId) return
    const reg = registrations.find((r) => r.id === dragId)
    setDragId(null); setOverStage(null)
    if (!reg || reg.stage === target) return
    moveRegistration(reg.id, target)
    toast({ tone: 'success', title: 'Registration moved', body: `${reg.playerName} → ${STAGES.find((s) => s.key === target)!.label}.` })
  }

  const cols: Column<Registration>[] = [
    { key: 'player', header: 'Player', sortValue: (r) => r.playerName, render: (r) => (
      <div className="flex items-center gap-2.5">
        <Avatar first={r.playerName.split(' ')[0]} last={r.playerName.split(' ')[1] ?? ''} size="sm" />
        <div className="min-w-0">
          <div className="truncate font-medium text-ink">{r.playerName}</div>
          <div className="text-[12px] text-ink-3">{r.guardian.name} · {r.guardian.relation}</div>
        </div>
      </div>
    ) },
    { key: 'age', header: 'Age', align: 'center', hideBelow: 'sm', sortValue: (r) => r.age, render: (r) => <span className="tabular-nums text-ink-2">{r.age}</span> },
    { key: 'program', header: 'Program', sortValue: (r) => r.program, render: (r) => <span className="text-ink-2">{r.program}</span> },
    { key: 'submitted', header: 'Submitted', sortValue: (r) => r.submitted, render: (r) => (
      <span className="text-ink-2">{relativeDay(r.submitted)}<span className="ml-1.5 text-[12px] text-ink-4">{fmtDate(r.submitted, 'short')}</span></span>
    ) },
    { key: 'eval', header: 'Evaluation', hideBelow: 'md', render: (r) => (
      r.evaluation.status === 'complete'
        ? <span className="flex items-center gap-1.5"><Badge tone="good" size="xs" dot={false}>Complete</Badge><span className="stat text-[13px] text-ink">{r.evaluation.score?.toFixed(1)}</span></span>
        : r.evaluation.status === 'scheduled'
          ? <Badge tone="blue" size="xs" dot={false}>Scheduled</Badge>
          : <span className="text-ink-4">Not scheduled</span>
    ) },
    { key: 'payment', header: 'Payment', hideBelow: 'lg', render: (r) => <StatusBadge status={r.payment} size="xs" /> },
    { key: 'stage', header: 'Status', align: 'right', render: (r) => <StatusBadge status={r.stage} size="xs" /> },
  ]

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={stagger.item}>
        <PageHeader
          eyebrow="Intake"
          title="Registrations"
          description="Every signup from first inquiry through roster assignment. Drag a card between stages to move a family forward."
          actions={
            <Link to="/registrations/evaluations">
              <Button variant="secondary" icon={ClipboardCheck}>Evaluations</Button>
            </Link>
          }
          meta={
            <>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{registrations.length}</strong> open registrations</span>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{registrations.filter((r) => r.stage === 'new' || r.stage === 'review').length}</strong> awaiting review</span>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{registrations.filter((r) => r.evaluation.status === 'scheduled').length}</strong> evaluations scheduled</span>
            </>
          }
        />
      </motion.div>

      <motion.div variants={stagger.item} className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <ChartCard
          eyebrow="Last 30 days"
          title="Onboarding funnel"
          subtitle="How leads convert into rostered players"
          table={{ head: ['Stage', 'Count', 'Conversion'], rows: funnel.map((f, i) => [f.label, f.value, i === 0 ? '—' : `${Math.round((f.value / funnel[i - 1].value) * 100)}%`]) }}
        >
          <FunnelFlow stages={funnel} orientation="horizontal" />
        </ChartCard>
        <Card>
          <div className="eyebrow">Where families are waiting</div>
          <div className="mt-3 space-y-2.5">
            {STAGES.map((s, i) => {
              const count = registrations.filter((r) => r.stage === s.key).length
              const max = Math.max(...STAGES.map((x) => registrations.filter((r) => r.stage === x.key).length))
              return (
                <button key={s.key} onClick={() => { setStage(s.key); setView('table') }} className="group block w-full text-left">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12.5px] text-ink-2 group-hover:text-royal transition-colors">{s.label}</span>
                    <span className="stat text-[16px] text-ink">{count}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-line-soft">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(count / (max || 1)) * 100}%`, background: RAMP_BLUE[Math.min(6, 2 + i)] }} />
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={stagger.item}>
        <FilterBar
          search={search} onSearch={setSearch} placeholder="Search registrations…"
          active={activeFilters} onClear={clear}
          right={<Segmented size="sm" value={view} onChange={setView} items={[
            { key: 'pipeline', label: 'Pipeline', icon: Columns3 }, { key: 'table', label: 'Table', icon: Rows3 },
          ]} />}
        >
          <FilterSelect label="Program" value={program} onChange={setProgram} options={PROGRAMS.map((p) => ({ value: p.label, label: p.label }))} />
          <FilterSelect label="Stage" value={stage} onChange={setStage} options={STAGES.map((s) => ({ value: s.key, label: s.label }))} />
          <FilterSelect label="Evaluation" value={evaluation} onChange={setEvaluation} options={[
            { value: 'complete', label: 'Complete' }, { value: 'scheduled', label: 'Scheduled' }, { value: 'not scheduled', label: 'Not scheduled' },
          ]} />
        </FilterBar>
      </motion.div>

      {view === 'pipeline' ? (
        <motion.div variants={stagger.item} className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
          <div className="grid min-w-[1020px] grid-cols-5 gap-3">
            {STAGES.map((s, si) => {
              const cards = filtered.filter((r) => r.stage === s.key)
              return (
                <div
                  key={s.key}
                  onDragOver={(e) => { e.preventDefault(); setOverStage(s.key) }}
                  onDragLeave={() => setOverStage((cur) => (cur === s.key ? null : cur))}
                  onDrop={() => drop(s.key)}
                  className={cn(
                    'flex flex-col rounded-2xl border transition-colors duration-150',
                    overStage === s.key ? 'border-royal bg-royal-tint/60' : 'border-line bg-[#FBFCFD]'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-line-soft px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-[3px]" style={{ background: RAMP_BLUE[Math.min(6, 2 + si)] }} />
                      <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-2">{s.label}</span>
                    </div>
                    <span className="rounded-full bg-white px-1.5 py-px text-[11px] font-semibold tabular-nums text-ink-3 ring-1 ring-line">
                      {cards.length}
                    </span>
                  </div>
                  <div className="flex-1 space-y-2 p-2">
                    {cards.length === 0 && (
                      <div className="rounded-xl border border-dashed border-line px-3 py-8 text-center">
                        <p className="text-[11.5px] text-ink-4">{s.hint}</p>
                        <p className="mt-1 text-[11px] text-ink-4">Drop a card here</p>
                      </div>
                    )}
                    {cards.map((r) => (
                      <article
                        key={r.id}
                        draggable
                        onDragStart={() => setDragId(r.id)}
                        onDragEnd={() => { setDragId(null); setOverStage(null) }}
                        onClick={() => navigate(`/registrations/${r.id}`)}
                        className={cn(
                          'group cursor-pointer rounded-xl border border-line bg-white p-3 shadow-card transition-all duration-150',
                          'hover:-translate-y-0.5 hover:shadow-lift active:cursor-grabbing',
                          dragId === r.id && 'opacity-45'
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <Avatar first={r.playerName.split(' ')[0]} last={r.playerName.split(' ')[1] ?? ''} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-semibold text-ink">{r.playerName}</div>
                            <div className="text-[11.5px] text-ink-3">Age {r.age} · {r.program}</div>
                          </div>
                          <GripVertical className="h-3.5 w-3.5 shrink-0 text-ink-4 opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {r.evaluation.status === 'complete' ? (
                            <Badge tone="good" size="xs" dot={false}>Eval {r.evaluation.score?.toFixed(1)}</Badge>
                          ) : r.evaluation.status === 'scheduled' ? (
                            <Badge tone="blue" size="xs" dot={false}>Eval scheduled</Badge>
                          ) : (
                            <Badge tone="neutral" size="xs" dot={false}>No eval</Badge>
                          )}
                          <StatusBadge status={r.payment} size="xs" dot={false} />
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 border-t border-line-soft pt-2 text-[11px] text-ink-4">
                          <Clock className="h-3 w-3" />
                          {relativeDay(r.submitted)}
                          {r.assignedTeamId && (
                            <span className="ml-auto truncate font-medium text-ink-3">{teamById(r.assignedTeamId)?.name}</span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      ) : (
        <motion.div variants={stagger.item}>
          <DataTable
            rows={filtered}
            columns={cols}
            onRowClick={(r) => navigate(`/registrations/${r.id}`)}
            initialSort={{ key: 'submitted', dir: 'desc' }}
            rowActions={(r) => <Button size="xs" variant="ghost" iconRight={ArrowRight} onClick={() => navigate(`/registrations/${r.id}`)}>Review</Button>}
            empty={{
              title: 'No registrations match these filters',
              description: 'Try a different program, stage or evaluation status.',
              action: <Button variant="secondary" onClick={clear}>Clear filters</Button>,
            }}
            footer={`${filtered.length} of ${registrations.length} registrations`}
          />
        </motion.div>
      )}

      {filtered.length === 0 && view === 'pipeline' && (
        <Card><EmptyState icon={ClipboardList} title="No registrations match these filters"
          description="Clear the filters to see the full intake pipeline."
          action={<Button variant="secondary" onClick={clear}>Clear filters</Button>} /></Card>
      )}
    </motion.div>
  )
}
