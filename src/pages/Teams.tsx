import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutGrid, Rows3, Plus, Shield } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { teams, rosterOf, staffById, d } from '../data/mock'
import type { Team } from '../data/types'
import { fmtTime, relativeDay } from '../lib/utils'
import { stagger } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Segmented } from '../components/ui/Tabs'
import { FilterBar, FilterSelect } from '../components/ui/FilterBar'
import { DataTable, type Column } from '../components/ui/DataTable'
import { EmptyState } from '../components/ui/EmptyState'
import { TeamCrest, AvatarStack } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { TeamCard } from '../components/domain/TeamCard'
import { TeamForm } from '../components/overlays/CreateModals'

export default function Teams() {
  const { role, visibleTeamIds, games, practices } = useApp()
  const [view, setView] = useState('cards')
  const [search, setSearch] = useState('')
  const [age, setAge] = useState('all')
  const [division, setDivision] = useState('all')
  const [coach, setCoach] = useState('all')
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  const isCoach = role === 'coach'
  const today = d(0)

  const scoped = useMemo(
    () => (isCoach ? teams.filter((t) => visibleTeamIds.includes(t.id)) : teams),
    [isCoach, visibleTeamIds]
  )

  const filtered = useMemo(() => scoped.filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
    if (age !== 'all' && t.ageGroup !== age) return false
    if (division !== 'all' && t.division !== division) return false
    if (coach !== 'all' && t.coachId !== coach) return false
    return true
  }), [scoped, search, age, division, coach])

  const nextGameOf = (id: string) => games.filter((g) => g.teamId === id && g.status === 'scheduled')
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0]
  const nextPracticeOf = (id: string) => practices.filter((p) => p.teamId === id && p.date >= today)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0]

  const activeFilters = [age, division, coach].filter((v) => v !== 'all').length + (search ? 1 : 0)
  const clear = () => { setAge('all'); setDivision('all'); setCoach('all'); setSearch('') }

  const cols: Column<Team>[] = [
    { key: 'team', header: 'Team', sortValue: (t) => t.name, render: (t) => (
      <div className="flex items-center gap-2.5">
        <TeamCrest short={t.short} color={t.color} size="sm" />
        <div>
          <div className="font-medium text-ink">{t.name}</div>
          <div className="text-[12px] text-ink-3">{t.ageGroup} · {t.division}</div>
        </div>
      </div>
    ) },
    { key: 'coach', header: 'Coach', sortValue: (t) => staffById(t.coachId)?.last ?? '', render: (t) => {
      const c = staffById(t.coachId)
      return <span className="text-ink-2">{c ? `${c.first} ${c.last}` : '—'}</span>
    } },
    { key: 'roster', header: 'Roster', sortValue: (t) => t.roster.length, render: (t) => (
      <div className="flex items-center gap-2.5">
        <span className="tabular-nums text-ink">{rosterOf(t.id).length}/{t.capacity}</span>
        {rosterOf(t.id).length >= t.capacity && <Badge tone="orange" size="xs" dot={false}>Full</Badge>}
        <AvatarStack people={rosterOf(t.id)} max={3} size="xs" />
      </div>
    ) },
    { key: 'attendance', header: 'Attendance', align: 'right', sortValue: (t) => t.attendance, render: (t) => (
      <span className="stat text-[15px] text-ink">{t.attendance}%</span>
    ) },
    { key: 'record', header: 'Record', align: 'right', hideBelow: 'sm', sortValue: (t) => t.record.w, render: (t) => (
      <span className="stat text-[15px] text-ink">{t.record.w}–{t.record.l}</span>
    ) },
    { key: 'next', header: 'Next game', hideBelow: 'lg', render: (t) => {
      const g = nextGameOf(t.id)
      return g ? (
        <span className="text-ink-2">vs {g.opponent}<span className="ml-1.5 text-[12px] text-ink-3">{relativeDay(g.date)} · {fmtTime(g.start)}</span></span>
      ) : <span className="text-ink-4">—</span>
    } },
  ]

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={stagger.item}>
        <PageHeader
          eyebrow="Organization"
          title={isCoach ? 'My Teams' : 'Teams'}
          description={isCoach
            ? 'The teams assigned to you — rosters, schedules and attendance in one place.'
            : 'Every age group in the academy, with roster health, attendance and results at a glance.'}
          actions={!isCoach && <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>Create team</Button>}
          meta={
            <>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{scoped.length}</strong> teams</span>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{scoped.reduce((s, t) => s + rosterOf(t.id).length, 0)}</strong> rostered players</span>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{Math.round(scoped.reduce((s, t) => s + t.attendance, 0) / (scoped.length || 1))}%</strong> average attendance</span>
            </>
          }
        />
      </motion.div>

      <motion.div variants={stagger.item}>
        <FilterBar
          search={search} onSearch={setSearch} placeholder="Search teams…"
          active={activeFilters} onClear={clear}
          right={<Segmented size="sm" value={view} onChange={setView} items={[
            { key: 'cards', label: 'Cards', icon: LayoutGrid }, { key: 'table', label: 'Table', icon: Rows3 },
          ]} />}
        >
          <FilterSelect label="Age" value={age} onChange={setAge} options={[...new Set(scoped.map((t) => t.ageGroup))].map((a) => ({ value: a, label: a }))} />
          <FilterSelect label="Division" value={division} onChange={setDivision} options={[...new Set(scoped.map((t) => t.division))].map((a) => ({ value: a, label: a }))} />
          <FilterSelect label="Coach" value={coach} onChange={setCoach} options={[...new Set(scoped.map((t) => t.coachId))].map((id) => ({ value: id, label: `${staffById(id)?.first} ${staffById(id)?.last}` }))} />
        </FilterBar>
      </motion.div>

      <motion.div variants={stagger.item}>
        {filtered.length === 0 ? (
          <Card>
            <EmptyState icon={Shield} title="No teams match these filters"
              description="Adjust the age group, division or coach filter to see more teams."
              action={<Button variant="secondary" onClick={clear}>Clear filters</Button>} />
          </Card>
        ) : view === 'cards' ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((t) => (
              <TeamCard
                key={t.id} team={t}
                nextGame={nextGameOf(t.id)}
                nextPractice={nextPracticeOf(t.id)}
                live={games.some((g) => g.teamId === t.id && g.status === 'live')}
              />
            ))}
          </div>
        ) : (
          <DataTable
            rows={filtered}
            columns={cols}
            onRowClick={(t) => navigate(`/teams/${t.id}`)}
            initialSort={{ key: 'team', dir: 'asc' }}
            footer={`${filtered.length} of ${scoped.length} teams`}
          />
        )}
      </motion.div>

      {!isCoach && filtered.length > 0 && view === 'cards' && (
        <motion.div variants={stagger.item}>
          <Card className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="eyebrow">Roster capacity across the academy</div>
              <p className="mt-1 text-[13px] text-ink-3">
                {scoped.filter((t) => rosterOf(t.id).length >= t.capacity).length} teams at capacity ·{' '}
                {scoped.reduce((s, t) => s + (t.capacity - rosterOf(t.id).length), 0)} open spots
              </p>
            </div>
            <Link to="/registrations"><Button variant="secondary">Assign from registrations →</Button></Link>
          </Card>
        </motion.div>
      )}

      <TeamForm open={creating} onClose={() => setCreating(false)} />
    </motion.div>
  )
}
