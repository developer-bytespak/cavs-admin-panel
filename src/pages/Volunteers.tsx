import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { HeartHandshake, Cookie, Car, ClipboardList, Users, Plus } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { volunteerSlots } from '../data/mock'
import { fmtDate, relativeDay } from '../lib/utils'
import { stagger } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Segmented } from '../components/ui/Tabs'
import { StatusBadge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { DataTable, type Column } from '../components/ui/DataTable'

const ROLE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Snacks: Cookie, Carpool: Car, Scorekeeping: ClipboardList, 'Volunteer — table crew': Users,
}
const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'Snacks', label: 'Snacks' },
  { key: 'Carpool', label: 'Carpool' },
  { key: 'Scorekeeping', label: 'Scorekeeping' },
]

type Slot = (typeof volunteerSlots)[number]

export default function Volunteers() {
  const { toast } = useApp()
  const [category, setCategory] = useState('all')
  const [slots, setSlots] = useState<Slot[]>(volunteerSlots)

  const filtered = useMemo(
    () => slots.filter((s) => category === 'all' || s.role === category || (category === 'Scorekeeping' && s.role.includes('table'))),
    [slots, category]
  )
  const open = slots.filter((s) => s.status === 'open').length

  const cols: Column<Slot>[] = [
    { key: 'event', header: 'Event', sortValue: (s) => s.date + s.event, render: (s) => (
      <div>
        <div className="font-medium text-ink">{s.event}</div>
        <div className="text-[12px] text-ink-3">{relativeDay(s.date)} · {fmtDate(s.date, 'short')}</div>
      </div>
    ) },
    { key: 'role', header: 'Role', sortValue: (s) => s.role, render: (s) => {
      const Icon = ROLE_ICON[s.role] ?? HeartHandshake
      return (
        <span className="inline-flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-royal-tint text-royal"><Icon className="h-3.5 w-3.5" /></span>
          <span className="text-ink-2">{s.role}</span>
        </span>
      )
    } },
    { key: 'family', header: 'Assigned family', render: (s) => (
      s.family === 'Unassigned'
        ? <span className="text-ink-4">Unassigned</span>
        : <span className="text-ink-2">{s.family}</span>
    ) },
    { key: 'status', header: 'Status', align: 'right', render: (s) => <StatusBadge status={s.status} size="xs" /> },
  ]

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={stagger.item}>
        <PageHeader
          eyebrow="Team tools"
          title="Volunteer & Snack Coordination"
          description="Game-day support slots — snacks, carpool and scorekeeping — tracked alongside the schedule."
          actions={
            <Button variant="primary" icon={Plus}
              onClick={() => toast({ tone: 'info', title: 'Slot builder', body: 'Volunteer slots generate from the schedule when the parent portal ships.' })}>
              Add slot
            </Button>
          }
          meta={
            <>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{slots.length}</strong> slots this week</span>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{slots.filter((s) => s.status === 'confirmed').length}</strong> confirmed</span>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-orange tabular-nums">{open}</strong> still open</span>
            </>
          }
        />
      </motion.div>

      <motion.div variants={stagger.item} className="flex flex-wrap items-center gap-3">
        <Segmented value={category} onChange={setCategory} items={CATEGORIES} />
        {open > 0 && (
          <span className="rounded-lg border border-[#FBDCC9] bg-orange-tint px-3 py-1.5 text-[12.5px] font-medium text-[#A93C0E]">
            {open} unfilled {open === 1 ? 'slot needs' : 'slots need'} a family
          </span>
        )}
      </motion.div>

      <motion.div variants={stagger.item}>
        <DataTable
          rows={filtered}
          columns={cols}
          initialSort={{ key: 'event', dir: 'asc' }}
          rowActions={(s) => (
            s.status === 'open' ? (
              <Button size="xs" variant="secondary" onClick={() => {
                setSlots((prev) => prev.map((x) => (x.id === s.id ? { ...x, family: 'Reed Family', status: 'confirmed' } : x)))
                toast({ tone: 'success', title: 'Slot filled', body: `${s.role} for ${s.event} assigned to the Reed family.` })
              }}>Assign family</Button>
            ) : (
              <Button size="xs" variant="ghost" onClick={() => {
                setSlots((prev) => prev.map((x) => (x.id === s.id ? { ...x, family: 'Unassigned', status: 'open' } : x)))
                toast({ tone: 'info', title: 'Slot reopened' })
              }}>Reopen</Button>
            )
          )}
          empty={{ title: 'No volunteer slots in this category', description: 'Slots are created from upcoming games and practices.' }}
          footer={`${filtered.length} slots`}
        />
      </motion.div>

      {slots.length === 0 && (
        <Card><EmptyState icon={HeartHandshake} title="No volunteer slots yet"
          description="Snack, carpool and scorekeeping slots appear here once games are scheduled." /></Card>
      )}

      <motion.p variants={stagger.item} className="text-center text-[11.5px] text-ink-4">
        Families claim slots themselves in the Parent experience — planned for the next phase. Staff assign them here today.
      </motion.p>
    </motion.div>
  )
}
