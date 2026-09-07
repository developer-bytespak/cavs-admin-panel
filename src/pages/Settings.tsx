import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Whistle, Lock, Check, X, Building2, Save, Globe } from 'lucide-react'
import { useApp, PERMISSION_MATRIX, type Permission } from '../store/AppStore'
import { locations, staff } from '../data/mock'
import { cn } from '../lib/utils'
import { stagger } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Tabs } from '../components/ui/Tabs'
import { Field, Input, Select, Switch } from '../components/ui/Field'
import { Badge, StatusBadge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'

const TABS = [
  { key: 'general', label: 'General' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'roles', label: 'Roles & Access' },
  { key: 'display', label: 'Display' },
  { key: 'profile', label: 'Profile' },
]

const PERMISSION_GROUPS: { group: string; items: { key: Permission; label: string; hint: string }[] }[] = [
  {
    group: 'Teams & players',
    items: [
      { key: 'view.allTeams', label: 'View all teams', hint: 'See every roster in the academy' },
      { key: 'manage.assignedTeams', label: 'Manage assigned teams', hint: 'Edit rosters and team information' },
    ],
  },
  {
    group: 'Schedule & games',
    items: [
      { key: 'edit.schedule', label: 'Edit schedules', hint: 'Create and reschedule games and practices' },
      { key: 'control.liveGames', label: 'Control live games', hint: 'Update score, clock and game status' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { key: 'view.registrations', label: 'View registrations', hint: 'Review intake and evaluations' },
      { key: 'view.payments', label: 'View payments', hint: 'See dues, balances and the ledger' },
      { key: 'send.broadcasts', label: 'Send broadcasts', hint: 'Message teams, groups or the academy' },
      { key: 'view.reports', label: 'View reports', hint: 'Access academy-wide analytics' },
    ],
  },
  {
    group: 'Administration',
    items: [
      { key: 'manage.staff', label: 'Manage staff', hint: 'Invite, edit and deactivate staff accounts' },
      { key: 'manage.locations', label: 'Manage locations', hint: 'Add and edit venues' },
      { key: 'manage.settings', label: 'Manage settings', hint: 'Change academy-wide configuration' },
    ],
  },
]

const ROLE_CARDS = [
  { key: 'Administrator', label: 'Administrator', state: 'active' as const, icon: ShieldCheck, blurb: 'Full academy oversight — schedule, rosters, registrations, payments, reports and staff.', count: staff.filter((s) => s.role === 'Administrator').length },
  { key: 'Coach', label: 'Coach', state: 'active' as const, icon: Whistle, blurb: 'Assigned teams only — roster, schedule, live game control and team broadcasts.', count: staff.filter((s) => s.role.includes('Coach')).length },
  { key: 'Player', label: 'Player', state: 'soon' as const, icon: Lock, blurb: 'Player experience will include schedules, team information, stats, goals and coach updates.', count: 0 },
  { key: 'Parent', label: 'Parent', state: 'soon' as const, icon: Lock, blurb: 'Parent experience will include live game tracking, locations, payments, registrations and communication.', count: 0 },
]

export default function Settings() {
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { toast, user, role, can } = useApp()
  const section = params.section ?? (location.pathname.endsWith('/profile') ? 'profile' : 'general')
  const tabs = can('manage.settings') ? TABS : TABS.filter((t) => t.key === 'profile')

  const [academyName, setAcademyName] = useState('Cavs Youth Basketball Academy')
  const [timezone, setTimezone] = useState('America/Los_Angeles')
  const [season, setSeason] = useState('2025–26 Season')
  const [homeVenue, setHomeVenue] = useState('loc-chatsworth')

  const [notif, setNotif] = useState({
    scheduleChanges: true, gameScores: true, newRegistrations: true,
    paymentAlerts: true, weeklyDigest: false, urgentSms: true,
  })
  const [display, setDisplay] = useState({ compactTables: false, animations: true, arenaAuto: true, weekStart: 'sunday' })
  const [selectedRole, setSelectedRole] = useState<'Administrator' | 'Coach' | 'Supervisor'>('Coach')
  const [overrides, setOverrides] = useState<Record<string, Record<string, boolean>>>({})

  const permsFor = (r: string) => ({ ...PERMISSION_MATRIX[r], ...overrides[r] })
  const togglePerm = (r: string, p: Permission) => {
    setOverrides((prev) => ({ ...prev, [r]: { ...prev[r], [p]: !permsFor(r)[p] } }))
  }

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={stagger.item}>
        <PageHeader
          eyebrow="Configuration"
          title="Settings"
          description="Academy configuration, notification preferences and the role architecture behind the Cavs platform."
        />
      </motion.div>

      <motion.div variants={stagger.item}>
        <Tabs value={section} onChange={(k) => navigate(`/settings/${k}`)} items={tabs} />
      </motion.div>

      {/* ---------------- General ---------------- */}
      {section === 'general' && (
        <motion.div variants={stagger.item} className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader eyebrow="Academy" title="Organization details" subtitle="Shown across the product and on outgoing communication." />
            <div className="mt-4 space-y-4">
              <Field label="Academy name"><Input value={academyName} onChange={(e) => setAcademyName(e.target.value)} /></Field>
              <Field label="Current season"><Input value={season} onChange={(e) => setSeason(e.target.value)} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Time zone">
                  <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                    {['America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York'].map((t) => <option key={t}>{t}</option>)}
                  </Select>
                </Field>
                <Field label="Primary venue">
                  <Select value={homeVenue} onChange={(e) => setHomeVenue(e.target.value)}>
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </Select>
                </Field>
              </div>
              <Button variant="primary" icon={Save} onClick={() => toast({ tone: 'success', title: 'Settings saved', body: 'Academy details updated.' })}>
                Save changes
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader eyebrow="Venues" title="Locations" subtitle={`${locations.length} venues configured`}
                action={<Button size="xs" variant="ghost" onClick={() => navigate('/locations')}>Manage →</Button>} />
              <div className="mt-3 space-y-2">
                {locations.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-royal-tint text-royal">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-ink">{l.name}</div>
                      <div className="truncate text-[11.5px] text-ink-3">{l.city} · {l.courts} court{l.courts > 1 ? 's' : ''}</div>
                    </div>
                    <StatusBadge status={l.status} size="xs" />
                  </div>
                ))}
              </div>
            </Card>
            <RoadmapCard />
          </div>
        </motion.div>
      )}

      {/* ---------------- Notifications ---------------- */}
      {section === 'notifications' && (
        <motion.div variants={stagger.item} className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader eyebrow="Preferences" title="What you get notified about"
              subtitle="Applies to your account across every device." />
            <div className="mt-4 space-y-4">
              <Switch checked={notif.scheduleChanges} onChange={(v) => setNotif((n) => ({ ...n, scheduleChanges: v }))}
                label="Schedule changes" description="Any game or practice that moves venue, date or time." />
              <Switch checked={notif.gameScores} onChange={(v) => setNotif((n) => ({ ...n, gameScores: v }))}
                label="Live game updates" description="Score changes and status updates while a game is in progress." />
              <Switch checked={notif.newRegistrations} onChange={(v) => setNotif((n) => ({ ...n, newRegistrations: v }))}
                label="New registrations" description="A family submits a new signup or completes an evaluation." />
              <Switch checked={notif.paymentAlerts} onChange={(v) => setNotif((n) => ({ ...n, paymentAlerts: v }))}
                label="Payment alerts" description="Payments received and balances that go past due." />
              <Switch checked={notif.weeklyDigest} onChange={(v) => setNotif((n) => ({ ...n, weeklyDigest: v }))}
                label="Weekly digest" description="A Monday summary of attendance, intake and finance." />
              <Switch checked={notif.urgentSms} onChange={(v) => setNotif((n) => ({ ...n, urgentSms: v }))}
                label="Urgent broadcasts by SMS" description="Only announcements marked urgent are sent as a text." />
            </div>
            <Button variant="primary" icon={Save} className="mt-5"
              onClick={() => toast({ tone: 'success', title: 'Preferences saved', body: 'Your notification settings were updated.' })}>
              Save preferences
            </Button>
          </Card>

          <Card>
            <CardHeader eyebrow="Delivery" title="Channels" subtitle="How each notification type reaches you." />
            <div className="mt-4 overflow-hidden rounded-xl border border-line">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="bg-[#FBFCFD]">
                    <th className="border-b border-line px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Type</th>
                    <th className="border-b border-line px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">In-app</th>
                    <th className="border-b border-line px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Email</th>
                    <th className="border-b border-line px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">SMS</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Schedule changes', true, true, false],
                    ['Live game updates', true, false, false],
                    ['New registrations', true, true, false],
                    ['Payment alerts', true, true, false],
                    ['Urgent broadcasts', true, true, true],
                  ].map(([label, a, b, c], i) => (
                    <tr key={i} className="border-b border-line-soft last:border-0">
                      <td className="px-3 py-2.5 text-ink-2">{label as string}</td>
                      {[a, b, c].map((on, j) => (
                        <td key={j} className="px-3 py-2.5 text-center">
                          {on ? <Check className="mx-auto h-4 w-4 text-good" /> : <X className="mx-auto h-4 w-4 text-ink-4/50" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-ink-4">
              Email and SMS delivery connect when the messaging backend is wired up. In-app notifications work today.
            </p>
          </Card>
        </motion.div>
      )}

      {/* ---------------- Roles & Access ---------------- */}
      {section === 'roles' && (
        <motion.div variants={stagger.item} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {ROLE_CARDS.map((r) => (
              <div
                key={r.key}
                title={r.state === 'soon' ? r.blurb : undefined}
                className={cn(
                  'group relative rounded-2xl border p-5 transition-all duration-200',
                  r.state === 'active'
                    ? 'border-line bg-card shadow-card hover:-translate-y-0.5 hover:shadow-lift'
                    : 'border-dashed border-line bg-[#FBFCFD] opacity-70'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl',
                    r.key === 'Administrator' ? 'bg-royal-tint text-royal'
                      : r.key === 'Coach' ? 'bg-orange-tint text-[#C24A12]' : 'bg-[#F1F3F7] text-ink-4')}>
                    <r.icon className="h-[18px] w-[18px]" />
                  </span>
                  {r.state === 'active' ? (
                    <Badge tone="good" size="xs">Active</Badge>
                  ) : (
                    <span className="rounded-full bg-[#EDEEF1] px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-4">
                      Coming Soon
                    </span>
                  )}
                </div>
                <h3 className="mt-3.5 text-[15.5px] font-semibold tracking-[-0.011em] text-ink">{r.label}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-3">{r.blurb}</p>
                {r.state === 'active' ? (
                  <p className="mt-3 border-t border-line-soft pt-3 text-[12px] text-ink-4">
                    <strong className="font-semibold text-ink-2 tabular-nums">{r.count}</strong> {r.count === 1 ? 'account' : 'accounts'} with this role
                  </p>
                ) : (
                  <p className="mt-3 border-t border-dashed border-line pt-3 text-[12px] font-medium text-ink-4">Planned experience</p>
                )}
              </div>
            ))}
          </div>

          <Card padded={false}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
              <div>
                <div className="eyebrow">Permission matrix</div>
                <h3 className="mt-1 text-[15px] font-semibold tracking-[-0.011em] text-ink">What each role can do</h3>
              </div>
              <div className="flex items-center gap-1.5">
                {(['Administrator', 'Coach', 'Supervisor'] as const).map((r) => (
                  <button key={r} onClick={() => setSelectedRole(r)}
                    className={cn('rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors',
                      selectedRole === r ? 'bg-royal text-white' : 'bg-[#F1F3F7] text-ink-3 hover:text-ink')}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5">
              <div className="grid gap-4 lg:grid-cols-2">
                {PERMISSION_GROUPS.map((g) => (
                  <div key={g.group} className="rounded-xl border border-line p-4">
                    <div className="eyebrow mb-3">{g.group}</div>
                    <div className="space-y-3">
                      {g.items.map((item) => (
                        <Switch
                          key={item.key}
                          checked={permsFor(selectedRole)[item.key]}
                          onChange={() => {
                            togglePerm(selectedRole, item.key)
                            toast({
                              tone: 'info',
                              title: `${item.label} ${permsFor(selectedRole)[item.key] ? 'disabled' : 'enabled'}`,
                              body: `${selectedRole} role updated.`,
                            })
                          }}
                          disabled={selectedRole === 'Administrator'}
                          label={item.label}
                          description={item.hint}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {selectedRole === 'Administrator' && (
                <p className="mt-4 rounded-xl border border-line bg-[#FBFCFD] p-3.5 text-[12.5px] text-ink-3">
                  The Administrator role always holds full access and cannot be restricted. Create a Supervisor account for read-only oversight.
                </p>
              )}
              {role === 'coach' && (
                <p className="mt-4 rounded-xl border border-[#FBDCC9] bg-orange-tint p-3.5 text-[12.5px] text-[#A93C0E]">
                  You are viewing as a Coach. Permission changes are demonstration only — administrators control this matrix.
                </p>
              )}
            </div>
          </Card>

          <RoadmapCard wide />
        </motion.div>
      )}

      {/* ---------------- Display ---------------- */}
      {section === 'display' && (
        <motion.div variants={stagger.item} className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader eyebrow="Interface" title="Display preferences" subtitle="How the command center looks on your account." />
            <div className="mt-4 space-y-4">
              <Switch checked={display.compactTables} onChange={(v) => setDisplay((d) => ({ ...d, compactTables: v }))}
                label="Compact tables" description="Tighter row spacing so more players fit on screen." />
              <Switch checked={display.animations} onChange={(v) => setDisplay((d) => ({ ...d, animations: v }))}
                label="Motion and transitions" description="Chart draw-ins, page transitions and the sliding navigation pill." />
              <Switch checked={display.arenaAuto} onChange={(v) => setDisplay((d) => ({ ...d, arenaAuto: v }))}
                label="Open Arena Mode automatically" description="Jump straight into the dark game control view when a game goes live." />
              <Field label="Week starts on">
                <Select value={display.weekStart} onChange={(e) => setDisplay((d) => ({ ...d, weekStart: e.target.value }))}>
                  <option value="sunday">Sunday</option>
                  <option value="monday">Monday</option>
                </Select>
              </Field>
            </div>
            <Button variant="primary" icon={Save} className="mt-5"
              onClick={() => toast({ tone: 'success', title: 'Display updated', body: 'Your interface preferences were saved.' })}>
              Save preferences
            </Button>
          </Card>

          <Card>
            <CardHeader eyebrow="Identity" title="Cavs visual system" subtitle="The palette this product is built on." />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Midnight', '#080D18'], ['Cavs Navy', '#0B1F45'], ['Royal Blue', '#1746C7'], ['Electric', '#2864FF'],
                ['Cavs Orange', '#F05A1A'], ['Orange Tint', '#FFF0E8'], ['Workspace', '#F6F7F9'], ['Ivory', '#F7F4EE'],
              ].map(([name, hex]) => (
                <div key={hex}>
                  <div className="h-14 rounded-xl border border-line" style={{ background: hex }} />
                  <div className="mt-1.5 text-[12px] font-medium text-ink">{name}</div>
                  <div className="text-[11px] tabular-nums text-ink-4">{hex}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-ink-4">
              Blue carries navigation and interaction. Orange is reserved for live moments, game states and urgent action —
              which is why it reads as significant everywhere it appears.
            </p>
          </Card>
        </motion.div>
      )}

      {/* ---------------- Profile ---------------- */}
      {section === 'profile' && (
        <motion.div variants={stagger.item} className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader eyebrow="Account" title="Your profile" />
            <div className="mt-4 flex items-center gap-4">
              <Avatar first={user.first} last={user.last} size="xl" />
              <div>
                <div className="text-[17px] font-semibold tracking-[-0.012em] text-ink">{user.first} {user.last}</div>
                <div className="text-[13px] text-ink-3">{user.role} · {user.permissionLevel}</div>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="First name"><Input defaultValue={user.first} /></Field>
              <Field label="Last name"><Input defaultValue={user.last} /></Field>
              <Field label="Email" className="sm:col-span-2"><Input defaultValue={user.email} type="email" /></Field>
              <Field label="Phone" className="sm:col-span-2"><Input defaultValue={user.phone} /></Field>
            </div>
            <Button variant="primary" icon={Save} className="mt-5"
              onClick={() => toast({ tone: 'success', title: 'Profile updated', body: 'Your account details were saved.' })}>
              Save profile
            </Button>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader eyebrow="Access" title="Your role" subtitle="Switch roles from the header to preview the Coach experience." />
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-[#FBFCFD] p-4">
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl',
                  role === 'admin' ? 'bg-royal-tint text-royal' : 'bg-orange-tint text-[#C24A12]')}>
                  {role === 'admin' ? <ShieldCheck className="h-5 w-5" /> : <Whistle className="h-5 w-5" />}
                </span>
                <div>
                  <div className="text-[14px] font-semibold text-ink">{role === 'admin' ? 'Administrator' : 'Coach'}</div>
                  <div className="text-[12.5px] text-ink-3">
                    {role === 'admin' ? 'Full academy oversight' : 'Scoped to your assigned teams'}
                  </div>
                </div>
                <Button size="sm" variant="secondary" className="ml-auto" onClick={() => navigate('/settings/roles')}>View permissions</Button>
              </div>
            </Card>
            <RoadmapCard />
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function RoadmapCard({ wide }: { wide?: boolean }) {
  const items = [
    { label: 'Admin experience', state: 'Live', hint: 'Shipping now' },
    { label: 'Coach experience', state: 'Live', hint: 'Shipping now' },
    { label: 'Parent experience', state: 'Next', hint: 'Live game tracking, locations, payments, communication' },
    { label: 'Player experience', state: 'Next', hint: 'Schedules, team information, stats, goals, coach updates' },
  ]
  return (
    <Card className={cn('bg-warm', wide && 'lg:col-span-2')}>
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-ink-3" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-3">Cavs Platform</span>
      </div>
      <div className={cn('mt-3.5 grid gap-2.5', wide ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-2')}>
        {items.map((i) => (
          <div key={i.label} className={cn('rounded-xl border bg-white/70 px-3.5 py-3',
            i.state === 'Live' ? 'border-[#CDEBDF]' : 'border-dashed border-line')}>
            <div className="flex items-center justify-between gap-2">
              <span className={cn('text-[13px] font-medium', i.state === 'Live' ? 'text-ink' : 'text-ink-3')}>{i.label}</span>
              <span className={cn('rounded-full px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-[0.07em]',
                i.state === 'Live' ? 'bg-good-tint text-good' : 'bg-[#EDEEF1] text-ink-4')}>{i.state}</span>
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-4">{i.hint}</p>
          </div>
        ))}
      </div>
      <p className="mt-3.5 text-[11.5px] leading-relaxed text-ink-4">
        The foundation is already designed for the full Cavs ecosystem — parent and player experiences connect into the same
        data, permissions and real-time layer this command center runs on.
      </p>
    </Card>
  )
}
