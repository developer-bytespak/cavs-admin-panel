import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardCheck, ArrowRight } from 'lucide-react'
import { useApp } from '../store/AppStore'
import type { Registration } from '../data/types'
import { fmtDate, relativeDay } from '../lib/utils'
import { stagger } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { FilterBar, FilterSelect } from '../components/ui/FilterBar'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Avatar } from '../components/ui/Avatar'
import { SideDrawer } from '../components/ui/SideDrawer'

export default function Evaluations() {
  const { registrations } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<Registration | null>(null)

  const rows = useMemo(
    () => registrations.filter((r) => {
      if (r.evaluation.status === 'not scheduled' && status !== 'not scheduled' && status !== 'all') return false
      if (search && !r.playerName.toLowerCase().includes(search.toLowerCase())) return false
      if (status !== 'all' && r.evaluation.status !== status) return false
      return true
    }),
    [registrations, search, status]
  )

  const cols: Column<Registration>[] = [
    { key: 'player', header: 'Player', sortValue: (r) => r.playerName, render: (r) => (
      <div className="flex items-center gap-2.5">
        <Avatar first={r.playerName.split(' ')[0]} last={r.playerName.split(' ')[1] ?? ''} size="sm" />
        <div>
          <div className="font-medium text-ink">{r.playerName}</div>
          <div className="text-[12px] text-ink-3">Age {r.age} · {r.program}</div>
        </div>
      </div>
    ) },
    { key: 'date', header: 'Date', sortValue: (r) => r.evaluation.date ?? 'zzz', render: (r) => (
      r.evaluation.date
        ? <span className="text-ink-2">{relativeDay(r.evaluation.date)}<span className="ml-1.5 text-[12px] text-ink-4">{fmtDate(r.evaluation.date, 'short')}</span></span>
        : <span className="text-ink-4">Not scheduled</span>
    ) },
    { key: 'evaluator', header: 'Evaluator', hideBelow: 'md', render: (r) => <span className="text-ink-2">{r.evaluation.evaluator ?? '—'}</span> },
    { key: 'status', header: 'Status', render: (r) => (
      <Badge tone={r.evaluation.status === 'complete' ? 'good' : r.evaluation.status === 'scheduled' ? 'blue' : 'neutral'} dot={false} size="xs">
        {r.evaluation.status === 'complete' ? 'Complete' : r.evaluation.status === 'scheduled' ? 'Scheduled' : 'Not scheduled'}
      </Badge>
    ) },
    { key: 'score', header: 'Result', align: 'right', sortValue: (r) => r.evaluation.score ?? 0, render: (r) => (
      r.evaluation.score !== null ? <span className="stat text-[16px] text-ink">{r.evaluation.score.toFixed(1)}</span> : <span className="text-ink-4">—</span>
    ) },
    { key: 'rec', header: 'Recommendation', align: 'right', hideBelow: 'lg', render: (r) => (
      r.evaluation.recommendation ? <span className="text-ink-2">{r.evaluation.recommendation}</span> : <span className="text-ink-4">—</span>
    ) },
  ]

  const complete = registrations.filter((r) => r.evaluation.status === 'complete')
  const avg = complete.length ? complete.reduce((s, r) => s + (r.evaluation.score ?? 0), 0) / complete.length : 0

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={stagger.item}>
        <PageHeader
          breadcrumbs={[{ label: 'Registrations', to: '/registrations' }, { label: 'Evaluations' }]}
          eyebrow="Intake"
          title="Evaluations"
          description="Evaluation results feeding roster placement — score, evaluator notes and the recommended team."
          meta={
            <>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{complete.length}</strong> completed</span>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{registrations.filter((r) => r.evaluation.status === 'scheduled').length}</strong> scheduled</span>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{avg.toFixed(1)}</strong> average score</span>
            </>
          }
        />
      </motion.div>

      <motion.div variants={stagger.item}>
        <FilterBar search={search} onSearch={setSearch} placeholder="Search evaluations…"
          active={status !== 'all' ? 1 : 0} onClear={() => { setStatus('all'); setSearch('') }}>
          <FilterSelect label="Status" value={status} onChange={setStatus} options={[
            { value: 'complete', label: 'Complete' }, { value: 'scheduled', label: 'Scheduled' }, { value: 'not scheduled', label: 'Not scheduled' },
          ]} />
        </FilterBar>
      </motion.div>

      <motion.div variants={stagger.item}>
        <DataTable
          rows={rows}
          columns={cols}
          onRowClick={setSelected}
          initialSort={{ key: 'date', dir: 'asc' }}
          empty={{ title: 'No evaluations match these filters', description: 'Every registration sent to evaluation appears here.' }}
          footer={`${rows.length} evaluations`}
        />
      </motion.div>

      {rows.length === 0 && registrations.length === 0 && (
        <Card><EmptyState icon={ClipboardCheck} title="No evaluations yet" description="Send a registration to evaluation to start the list." /></Card>
      )}

      <SideDrawer
        open={!!selected} onClose={() => setSelected(null)} width="md"
        eyebrow="Evaluation" title={selected?.playerName ?? ''}
        footer={selected && (
          <Button variant="primary" className="ml-auto" iconRight={ArrowRight}
            onClick={() => { navigate(`/registrations/${selected.id}`); setSelected(null) }}>
            Open registration
          </Button>
        )}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-line bg-[#FBFCFD] p-4">
              <div>
                <div className="eyebrow">Result</div>
                <div className="stat mt-1 text-[34px] leading-none text-ink">
                  {selected.evaluation.score !== null ? selected.evaluation.score.toFixed(1) : '—'}
                </div>
              </div>
              <Badge tone={selected.evaluation.status === 'complete' ? 'good' : 'blue'} dot={false}>
                {selected.evaluation.status === 'complete' ? 'Complete' : selected.evaluation.status === 'scheduled' ? 'Scheduled' : 'Not scheduled'}
              </Badge>
            </div>
            <Card>
              <CardHeader eyebrow="Related registration" title={`${selected.program} · Age ${selected.age}`}
                subtitle={`Submitted ${fmtDate(selected.submitted, 'medium')} · ${selected.source}`} />
            </Card>
            <div className="divide-y divide-line-soft">
              <Row label="Evaluator" value={selected.evaluation.evaluator ?? '—'} />
              <Row label="Date" value={selected.evaluation.date ? fmtDate(selected.evaluation.date, 'long') : '—'} />
              <Row label="Team recommendation" value={selected.evaluation.recommendation ?? '—'} />
              <Row label="Registration stage" value={selected.stage} />
            </div>
            {selected.evaluation.notes && (
              <div>
                <div className="eyebrow mb-2">Coach notes</div>
                <p className="rounded-xl border border-line bg-[#FBFCFD] p-3.5 text-[13.5px] leading-relaxed text-ink-2">
                  {selected.evaluation.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </SideDrawer>
    </motion.div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="shrink-0 text-[12.5px] text-ink-3">{label}</span>
      <span className="min-w-0 truncate text-right text-[13px] font-medium capitalize text-ink">{value}</span>
    </div>
  )
}
