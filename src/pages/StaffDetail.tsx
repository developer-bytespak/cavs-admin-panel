import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserCog, Mail, Phone, MapPin, KeyRound, Check, X, ArrowRight } from 'lucide-react'
import { useApp, PERMISSION_MATRIX, type Permission } from '../store/AppStore'
import { staff, teamById, rosterOf, d, locationById } from '../data/mock'
import { cn, fmtDate, fmtTime, relativeDay } from '../lib/utils'
import { stagger } from '../components/layout/AppShell'
import { PageHeader, MetaItem } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusBadge, Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Avatar, TeamCrest } from '../components/ui/Avatar'
import { ActivityFeed } from '../components/domain/ActivityFeed'

const PERMISSION_LABELS: Record<Permission, string> = {
  'view.allTeams': 'View all teams',
  'manage.assignedTeams': 'Manage assigned teams',
  'edit.schedule': 'Edit schedules',
  'control.liveGames': 'Control live games',
  'view.registrations': 'View registrations',
  'view.payments': 'View payments',
  'send.broadcasts': 'Send broadcasts',
  'view.reports': 'View reports',
  'manage.staff': 'Manage staff',
  'manage.locations': 'Manage locations',
  'manage.settings': 'Manage settings',
}

const ROLE_KEY: Record<string, keyof typeof PERMISSION_MATRIX> = {
  Administrator: 'Administrator', 'Head Coach': 'Coach', 'Assistant Coach': 'Coach', Supervisor: 'Supervisor',
}

export default function StaffDetail() {
  const { staffId } = useParams()
  const { games, practices } = useApp()
  const person = staff.find((s) => s.id === staffId)
  const today = d(0)

  if (!person) {
    return <Card><EmptyState icon={UserCog} title="Staff member not found"
      description="This account may have been deactivated."
      action={<Link to="/staff"><Button variant="secondary">Back to staff</Button></Link>} /></Card>
  }

  const perms = PERMISSION_MATRIX[ROLE_KEY[person.role]]
  const teams = person.teams.map((id) => teamById(id)).filter(Boolean)
  const upcoming = [
    ...games.filter((g) => person.teams.includes(g.teamId) && g.date >= today),
    ...practices.filter((p) => p.coachId === person.id && p.date >= today),
  ].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 6)

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-5">
      <motion.div variants={stagger.item}>
        <PageHeader
          breadcrumbs={[{ label: 'Staff & Roles', to: '/staff' }, { label: `${person.first} ${person.last}` }]}
          eyebrow={person.role}
          title={
            <span className="flex items-center gap-3.5">
              <Avatar first={person.first} last={person.last} size="xl" />
              <span>{person.first} {person.last}</span>
            </span>
          }
          meta={<>
            <span><StatusBadge status={person.status} /></span>
            <MetaItem label="Permission" value={person.permissionLevel} />
            <MetaItem label="Since" value={fmtDate(person.since, 'medium')} />
          </>}
          actions={
            <>
              <a href={`mailto:${person.email}`}><Button variant="secondary" icon={Mail}>Email</Button></a>
              <Link to="/settings/roles"><Button variant="primary" icon={KeyRound}>Manage permissions</Button></Link>
            </>
          }
        />
      </motion.div>

      <motion.div variants={stagger.item} className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader eyebrow="Contact" title="Reach out" />
            <div className="mt-3 space-y-2">
              <a href={`mailto:${person.email}`} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-[13px] text-ink-2 transition-colors hover:border-[#D9DDE5] hover:text-ink">
                <Mail className="h-3.5 w-3.5 text-ink-4" />{person.email}
              </a>
              <a href={`tel:${person.phone}`} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-[13px] text-ink-2 transition-colors hover:border-[#D9DDE5] hover:text-ink">
                <Phone className="h-3.5 w-3.5 text-ink-4" />{person.phone}
              </a>
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Assignments" title="Teams" subtitle={teams.length ? `${teams.length} assigned` : 'Academy-wide access'} />
            {teams.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-line p-4 text-center text-[13px] text-ink-3">
                This role operates across the whole academy rather than specific teams.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {teams.map((t) => t && (
                  <Link key={t.id} to={`/teams/${t.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 transition-all hover:border-[#D9DDE5] hover:shadow-card">
                    <TeamCrest short={t.short} color={t.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-ink group-hover:text-royal transition-colors">{t.name}</div>
                      <div className="text-[11.5px] text-ink-3">{rosterOf(t.id).length} players · {t.attendance}% attendance</div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-ink-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader eyebrow="Access" title="Permissions"
              subtitle={`Derived from the ${ROLE_KEY[person.role]} role. Change it in Roles & Permissions.`} />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {(Object.keys(PERMISSION_LABELS) as Permission[]).map((p) => (
                <div key={p} className={cn('flex items-center gap-2.5 rounded-lg border px-3 py-2',
                  perms[p] ? 'border-[#CDEBDF] bg-good-tint/40' : 'border-line bg-[#FBFCFD]')}>
                  <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-md',
                    perms[p] ? 'bg-good text-white' : 'bg-[#E7E9EE] text-ink-4')}>
                    {perms[p] ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </span>
                  <span className={cn('text-[12.5px]', perms[p] ? 'font-medium text-ink' : 'text-ink-3')}>{PERMISSION_LABELS[p]}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card padded={false}>
            <div className="px-5 pb-2 pt-5"><CardHeader eyebrow="Schedule" title="Upcoming commitments" /></div>
            <div className="px-5 pb-5">
              {upcoming.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-ink-3">Nothing scheduled for this staff member.</p>
              ) : (
                <ol>
                  {upcoming.map((e, i) => (
                    <li key={e.id} className={cn('flex items-center gap-3 py-2.5', i > 0 && 'border-t border-line-soft')}>
                      <span className={cn('h-8 w-[3px] shrink-0 rounded-full', e.type === 'game' ? 'bg-orange' : 'bg-royal')} />
                      <div className="w-[92px] shrink-0">
                        <div className="text-[12.5px] font-medium text-ink">{relativeDay(e.date)}</div>
                        <div className="text-[11.5px] text-ink-3">{fmtTime(e.start)}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] text-ink">
                          {e.type === 'game' ? `${teamById(e.teamId)?.name} vs ${e.opponent}` : `${teamById(e.teamId)?.name} — ${e.focus}`}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
                          <MapPin className="h-3 w-3 text-ink-4" />{locationById(e.locationId)?.name}
                        </div>
                      </div>
                      <Badge tone={e.type === 'game' ? 'orange' : 'blue'} dot={false} size="xs">{e.type === 'game' ? 'Game' : 'Practice'}</Badge>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </Card>

          <Card padded={false}>
            <div className="px-5 pb-2 pt-5"><CardHeader eyebrow="Log" title="Recent activity" /></div>
            <div className="px-5 pb-4"><ActivityFeed limit={5} /></div>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  )
}
