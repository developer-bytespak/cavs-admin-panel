import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserCog, Plus, Eye, Pencil, Shield, LayoutGrid, Rows3, KeyRound } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { staff, teamById } from '../data/mock'
import type { Staff as StaffType } from '../data/types'
import { cn, fmtDate } from '../lib/utils'
import { stagger } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button, IconButton } from '../components/ui/Button'
import { Segmented } from '../components/ui/Tabs'
import { FilterBar, FilterSelect } from '../components/ui/FilterBar'
import { DataTable, type Column } from '../components/ui/DataTable'
import { StatusBadge, Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Avatar, TeamCrest } from '../components/ui/Avatar'

const ROLE_TONE: Record<string, 'blue' | 'orange' | 'neutral' | 'good'> = {
  Administrator: 'blue', 'Head Coach': 'orange', 'Assistant Coach': 'neutral', Supervisor: 'good',
}

export default function Staff() {
  const { toast } = useApp()
  const navigate = useNavigate()
  const [view, setView] = useState('cards')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')

  const filtered = useMemo(() => staff.filter((s) => {
    if (search && !`${s.first} ${s.last}`.toLowerCase().includes(search.toLowerCase())) return false
    if (role !== 'all' && s.role !== role) return false
    if (status !== 'all' && s.status !== status) return false
    return true
  }), [search, role, status])

  const activeFilters = [role, status].filter((v) => v !== 'all').length + (search ? 1 : 0)
  const clear = () => { setRole('all'); setStatus('all'); setSearch('') }

  const cols: Column<StaffType>[] = [
    { key: 'name', header: 'Name', sortValue: (s) => s.last, render: (s) => (
      <div className="flex items-center gap-2.5">
        <Avatar first={s.first} last={s.last} size="sm" />
        <div className="min-w-0">
          <div className="truncate font-medium text-ink">{s.first} {s.last}</div>
          <div className="truncate text-[12px] text-ink-3">{s.email}</div>
        </div>
      </div>
    ) },
    { key: 'role', header: 'Role', sortValue: (s) => s.role, render: (s) => (
      <Badge tone={ROLE_TONE[s.role]} dot={false} size="xs">{s.role}</Badge>
    ) },
    { key: 'teams', header: 'Assigned teams', render: (s) => (
      s.teams.length === 0 ? <span className="text-ink-4">Academy-wide</span> : (
        <div className="flex items-center gap-1.5">
          {s.teams.slice(0, 3).map((id) => {
            const t = teamById(id)
            return t ? <TeamCrest key={id} short={t.short} color={t.color} size="sm" /> : null
          })}
          {s.teams.length > 3 && <span className="text-[12px] text-ink-3">+{s.teams.length - 3}</span>}
        </div>
      )
    ) },
    { key: 'permission', header: 'Permission level', hideBelow: 'md', render: (s) => <span className="text-ink-2">{s.permissionLevel}</span> },
    { key: 'contact', header: 'Contact', hideBelow: 'lg', render: (s) => <span className="text-ink-2 tabular-nums">{s.phone}</span> },
    { key: 'status', header: 'Status', align: 'right', render: (s) => <StatusBadge status={s.status} size="xs" /> },
  ]

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={stagger.item}>
        <PageHeader
          eyebrow="Organization"
          title="Staff & Roles"
          description="Everyone who runs the academy — coaches, supervisors and administrators — with the teams and permissions attached to each."
          actions={
            <>
              <Link to="/settings/roles"><Button variant="secondary" icon={KeyRound}>Roles & permissions</Button></Link>
              <Button variant="primary" icon={Plus} onClick={() => toast({ tone: 'info', title: 'Invite staff', body: 'Staff invitations connect when the account system is wired up.' })}>
                Add staff
              </Button>
            </>
          }
          meta={
            <>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{staff.filter((s) => s.status === 'active').length}</strong> active staff</span>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{staff.filter((s) => s.role.includes('Coach')).length}</strong> coaches</span>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{staff.filter((s) => s.role === 'Supervisor').length}</strong> supervisors</span>
            </>
          }
        />
      </motion.div>

      <motion.div variants={stagger.item}>
        <FilterBar
          search={search} onSearch={setSearch} placeholder="Search staff…" active={activeFilters} onClear={clear}
          right={<Segmented size="sm" value={view} onChange={setView} items={[
            { key: 'cards', label: 'Cards', icon: LayoutGrid }, { key: 'table', label: 'Table', icon: Rows3 },
          ]} />}
        >
          <FilterSelect label="Role" value={role} onChange={setRole} options={[...new Set(staff.map((s) => s.role))].map((r) => ({ value: r, label: r }))} />
          <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
        </FilterBar>
      </motion.div>

      <motion.div variants={stagger.item}>
        {filtered.length === 0 ? (
          <Card><EmptyState icon={UserCog} title="No staff match these filters"
            description="Try a different role or status."
            action={<Button variant="secondary" onClick={clear}>Clear filters</Button>} /></Card>
        ) : view === 'cards' ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((s) => (
              <Link
                key={s.id} to={`/staff/${s.id}`}
                className={cn('group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift',
                  s.status === 'inactive' ? 'border-line opacity-70' : 'border-line')}
              >
                <div className="flex items-start gap-3">
                  <Avatar first={s.first} last={s.last} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15.5px] font-semibold tracking-[-0.011em] text-ink">{s.first} {s.last}</h3>
                    <div className="mt-1"><Badge tone={ROLE_TONE[s.role]} dot={false} size="xs">{s.role}</Badge></div>
                  </div>
                  <StatusBadge status={s.status} size="xs" />
                </div>
                <dl className="mt-4 space-y-2 border-t border-line-soft pt-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[12px] text-ink-3">Permission level</dt>
                    <dd className="text-[12.5px] font-medium text-ink">{s.permissionLevel}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[12px] text-ink-3">Assigned teams</dt>
                    <dd className="flex items-center gap-1.5">
                      {s.teams.length === 0 ? <span className="text-[12.5px] font-medium text-ink">Academy-wide</span> : s.teams.slice(0, 3).map((id) => {
                        const t = teamById(id)
                        return t ? <TeamCrest key={id} short={t.short} color={t.color} size="sm" /> : null
                      })}
                      {s.teams.length > 3 && <span className="text-[12px] text-ink-3">+{s.teams.length - 3}</span>}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[12px] text-ink-3">With the academy since</dt>
                    <dd className="text-[12.5px] font-medium text-ink">{fmtDate(s.since, 'medium')}</dd>
                  </div>
                </dl>
                <div className="mt-3.5 flex items-center gap-2 border-t border-line-soft pt-3">
                  <span className="truncate text-[12px] text-ink-3">{s.email}</span>
                  <span className="ml-auto text-[12px] font-medium text-royal opacity-0 transition-opacity group-hover:opacity-100">View →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <DataTable
            rows={filtered}
            columns={cols}
            onRowClick={(s) => navigate(`/staff/${s.id}`)}
            initialSort={{ key: 'name', dir: 'asc' }}
            rowActions={(s) => (
              <>
                <IconButton icon={Eye} label="View profile" onClick={() => navigate(`/staff/${s.id}`)} />
                <IconButton icon={Shield} label="Assign team" onClick={() => toast({ tone: 'info', title: 'Team assignment', body: `Manage ${s.first}'s teams from their profile.` })} />
                <IconButton icon={Pencil} label="Manage permissions" onClick={() => navigate('/settings/roles')} />
              </>
            )}
            footer={`${filtered.length} of ${staff.length} staff members`}
          />
        )}
      </motion.div>
    </motion.div>
  )
}
