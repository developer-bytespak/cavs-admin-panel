import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, UserPlus, Eye, MessageSquare, ArrowRightLeft, MoreHorizontal, Download } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { teams, teamById, rosterOf } from '../data/mock'
import { playerPaymentStatus } from '../data/billing'
import type { Player } from '../data/types'
import { cn } from '../lib/utils'
import { stagger } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button, IconButton } from '../components/ui/Button'
import { FilterBar, FilterSelect } from '../components/ui/FilterBar'
import { DataTable, type Column } from '../components/ui/DataTable'
import { StatusBadge, Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Avatar, TeamCrest } from '../components/ui/Avatar'
import { Modal } from '../components/ui/Modal'
import { Field, Select } from '../components/ui/Field'
import { PlayerForm } from '../components/overlays/CreateModals'

export default function Players() {
  const { players, invoices, role, visibleTeamIds, assignPlayerTeam, toast, can } = useApp()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [team, setTeam] = useState(params.get('team') ?? 'all')
  const [age, setAge] = useState('all')
  const [status, setStatus] = useState('all')
  const [registration, setRegistration] = useState('all')
  const [payment, setPayment] = useState('all')
  const [moving, setMoving] = useState<Player | null>(null)
  const [adding, setAdding] = useState(false)

  const isCoach = role === 'coach'

  const scoped = useMemo(
    () => (isCoach ? players.filter((p) => p.teamId && visibleTeamIds.includes(p.teamId)) : players),
    [players, isCoach, visibleTeamIds]
  )

  const filtered = useMemo(() => scoped.filter((p) => {
    if (search) {
      const s = search.toLowerCase()
      if (!`${p.first} ${p.last}`.toLowerCase().includes(s) && !String(p.jersey).includes(s)) return false
    }
    if (team !== 'all' && (team === 'none' ? p.teamId !== null : p.teamId !== team)) return false
    if (age !== 'all' && String(p.age) !== age) return false
    if (status !== 'all' && p.status !== status) return false
    if (registration !== 'all' && p.registration !== registration) return false
    if (payment !== 'all' && playerPaymentStatus(p.id, invoices) !== payment) return false
    return true
  }), [scoped, search, team, age, status, registration, payment, invoices])

  const activeFilters = [team, age, status, registration, payment].filter((v) => v !== 'all').length + (search ? 1 : 0)
  const clear = () => { setTeam('all'); setAge('all'); setStatus('all'); setRegistration('all'); setPayment('all'); setSearch('') }

  const cols: Column<Player>[] = [
    { key: 'player', header: 'Player', sortValue: (p) => p.last, width: '26%', render: (p) => (
      <div className="flex items-center gap-2.5">
        <Avatar first={p.first} last={p.last} jersey={p.jersey} size="sm" />
        <div className="min-w-0">
          <div className="truncate font-medium text-ink">{p.first} {p.last}</div>
          <div className="text-[12px] text-ink-3">#{p.jersey} · {p.position}</div>
        </div>
      </div>
    ) },
    { key: 'team', header: 'Team', sortValue: (p) => teamById(p.teamId)?.name ?? 'zzz', render: (p) => {
      const t = teamById(p.teamId)
      return t ? (
        <span className="flex items-center gap-2">
          <TeamCrest short={t.short} color={t.color} size="sm" />
          <span className="text-ink-2">{t.name}</span>
        </span>
      ) : <Badge tone="neutral" dot={false} size="xs">Academy Program</Badge>
    } },
    { key: 'age', header: 'Age', align: 'center', hideBelow: 'sm', sortValue: (p) => p.age, render: (p) => <span className="tabular-nums text-ink-2">{p.age}</span> },
    { key: 'reg', header: 'Registration', hideBelow: 'md', render: (p) => <StatusBadge status={p.registration} size="xs" /> },
    ...(!isCoach ? [{
      key: 'pay', header: 'Payment', hideBelow: 'md' as const,
      sortValue: (p: Player) => playerPaymentStatus(p.id, invoices),
      render: (p: Player) => <StatusBadge status={playerPaymentStatus(p.id, invoices)} size="xs" />,
    }] : []),
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

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={stagger.item}>
        <PageHeader
          eyebrow="People"
          title="Players"
          description={isCoach
            ? 'Every player on the teams assigned to you, with registration status and attendance.'
            : 'The full academy roster — registration, payment and attendance for every player, in one place.'}
          actions={
            <>
              <Button variant="secondary" icon={Download} onClick={() => toast({ tone: 'info', title: 'Export queued', body: `${filtered.length} player records will be prepared as a CSV.` })}>
                Export
              </Button>
              {can('view.allTeams') && <Button variant="primary" icon={UserPlus} onClick={() => setAdding(true)}>Add player</Button>}
            </>
          }
          meta={
            <>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{scoped.filter((p) => p.status === 'active').length}</strong> active</span>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{scoped.filter((p) => p.teamId).length}</strong> on rosters</span>
              {!isCoach && <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{scoped.filter((p) => !p.teamId).length}</strong> in the academy program</span>}
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{Math.round(scoped.reduce((s, p) => s + p.attendance, 0) / (scoped.length || 1))}%</strong> average attendance</span>
            </>
          }
        />
      </motion.div>

      <motion.div variants={stagger.item}>
        <FilterBar
          search={search} onSearch={setSearch} placeholder="Search players by name or jersey…"
          active={activeFilters} onClear={clear}
        >
          <FilterSelect label="Team" value={team} onChange={setTeam} options={[
            ...(isCoach ? [] : [{ value: 'none', label: 'Academy Program' }]),
            ...teams.filter((t) => !isCoach || visibleTeamIds.includes(t.id)).map((t) => ({ value: t.id, label: t.name })),
          ]} />
          <FilterSelect label="Age" value={age} onChange={setAge} options={[...new Set(scoped.map((p) => p.age))].sort((a, b) => a - b).map((a) => ({ value: String(a), label: String(a) }))} />
          <FilterSelect label="Status" value={status} onChange={setStatus} options={[
            { value: 'active', label: 'Active' }, { value: 'pending', label: 'Pending' }, { value: 'inactive', label: 'Inactive' },
          ]} />
          <FilterSelect label="Registration" value={registration} onChange={setRegistration} options={[
            { value: 'completed', label: 'Completed' }, { value: 'ready', label: 'Ready' }, { value: 'evaluation', label: 'Evaluation' }, { value: 'review', label: 'In Review' }, { value: 'new', label: 'New' },
          ]} />
          {!isCoach && (
            <FilterSelect label="Payment" value={payment} onChange={setPayment} options={[
              { value: 'paid', label: 'Paid' }, { value: 'pending', label: 'Pending' }, { value: 'overdue', label: 'Overdue' },
            ]} />
          )}
        </FilterBar>
      </motion.div>

      <motion.div variants={stagger.item}>
        <DataTable
          rows={filtered}
          columns={cols}
          initialSort={{ key: 'player', dir: 'asc' }}
          onRowClick={(p) => navigate(`/players/${p.id}`)}
          rowActions={(p) => (
            <>
              <IconButton icon={Eye} label="View player" onClick={() => navigate(`/players/${p.id}`)} />
              <IconButton icon={MessageSquare} label="Message family" onClick={() => toast({ tone: 'info', title: 'Message drafted', body: `A message to the ${p.guardian.name.split(' ')[1]} family is ready in Communications.` })} />
              {can('view.allTeams') && <IconButton icon={ArrowRightLeft} label="Move team" onClick={() => setMoving(p)} />}
              <IconButton icon={MoreHorizontal} label="More actions" onClick={() => navigate(`/players/${p.id}`)} />
            </>
          )}
          empty={{
            title: 'No players match these filters',
            description: 'Try clearing a filter or searching for a different name.',
            action: <Button variant="secondary" onClick={clear}>Clear filters</Button>,
          }}
          footer={`${filtered.length} of ${scoped.length} players`}
        />
      </motion.div>

      {filtered.length === 0 && scoped.length === 0 && (
        <Card><EmptyState icon={Users} title="No players yet" description="Approved registrations land here as academy players." /></Card>
      )}

      <PlayerForm open={adding} onClose={() => setAdding(false)} />

      <Modal
        open={!!moving} onClose={() => setMoving(null)} width="sm"
        eyebrow="Roster" title={moving ? `Move ${moving.first} ${moving.last}` : ''}
        footer={<Button variant="ghost" onClick={() => setMoving(null)}>Close</Button>}
      >
        <Field label="Assign to team" hint={moving?.teamId ? `Currently ${teamById(moving.teamId)?.name}` : 'Currently unassigned'}>
          <Select
            defaultValue={moving?.teamId ?? 'none'}
            onChange={(e) => {
              if (!moving) return
              const target = e.target.value
              assignPlayerTeam(moving.id, target === 'none' ? null : target)
              toast({ tone: 'success', title: 'Player assigned', body: `${moving.first} ${moving.last} → ${target === 'none' ? 'Academy Program' : teamById(target)?.name}.` })
              setMoving(null)
            }}
          >
            <option value="none">Academy Program — unassigned</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id} disabled={t.id !== moving?.teamId && rosterOf(t.id).length >= t.capacity}>
                {t.name} ({rosterOf(t.id).length}/{t.capacity}){t.id !== moving?.teamId && rosterOf(t.id).length >= t.capacity ? ' — full' : ''}
              </option>
            ))}
          </Select>
        </Field>
        <p className="mt-3 text-[12.5px] text-ink-3">
          Roster changes sync to the team page, the schedule and the family contact list immediately.
        </p>
      </Modal>
    </motion.div>
  )
}
