import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Repeat } from 'lucide-react'
import { useApp } from '../../store/AppStore'
import { teams, locations, staff, OPPONENTS, PRACTICE_FOCUS, PROGRAMS, AUDIENCES, teamById, d } from '../../data/mock'
import type { GameEvent, PracticeEvent, Priority } from '../../data/types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Field, Input, Select, Textarea, Checkbox, Switch } from '../ui/Field'
import { Segmented } from '../ui/Tabs'
import { cn } from '../../lib/utils'

/* ---------------------------------------------------------------- */
/* Game — create & edit share one form                              */
/* ---------------------------------------------------------------- */
export function GameForm({
  open, onClose, existing,
}: { open: boolean; onClose: () => void; existing?: GameEvent }) {
  const { createGame, updateGame, toast, visibleTeamIds, role } = useApp()
  const allowed = useMemo(() => teams.filter((t) => role === 'admin' || visibleTeamIds.includes(t.id)), [role, visibleTeamIds])
  const [form, setForm] = useState({
    teamId: existing?.teamId ?? allowed[0].id,
    opponent: existing?.opponent ?? '',
    date: existing?.date ?? d(3),
    start: existing?.start ?? '18:30',
    arrival: existing?.arrival ?? '17:45',
    locationId: existing?.locationId ?? 'loc-chatsworth',
    gameType: existing?.gameType ?? 'League',
    status: existing?.status ?? 'scheduled',
    notes: existing?.notes ?? '',
  })
  const [notify, setNotify] = useState(true)
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))
  const team = teamById(form.teamId)

  const submit = () => {
    if (existing) {
      updateGame(existing.id, form as Partial<GameEvent>, notify)
      toast({ tone: 'success', title: 'Schedule updated', body: notify ? 'Affected users will receive the new schedule.' : 'Change saved without a notification.' })
    } else {
      createGame({ ...form, opponent: form.opponent || 'TBD' } as Partial<GameEvent>)
      toast({ tone: 'success', title: 'Game created', body: `${team?.name} vs ${form.opponent || 'TBD'} added to the schedule.` })
    }
    onClose()
  }

  return (
    <Modal
      open={open} onClose={onClose} width="lg"
      eyebrow={existing ? 'Edit game' : 'Schedule'}
      title={existing ? `${team?.name} vs ${existing.opponent}` : 'Create game'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="accent" onClick={submit}>{existing ? 'Save changes' : 'Create game'}</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Team" required>
          <Select value={form.teamId} onChange={(e) => set('teamId', e.target.value)}>
            {allowed.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </Field>
        <Field label="Opponent" required hint="Free text or a known club">
          <Input list="opponents" value={form.opponent} onChange={(e) => set('opponent', e.target.value)} placeholder="Valley Warriors" />
          <datalist id="opponents">{OPPONENTS.map((o) => <option key={o} value={o} />)}</datalist>
        </Field>
        <Field label="Date" required>
          <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start time" required>
            <Input type="time" value={form.start} onChange={(e) => set('start', e.target.value)} />
          </Field>
          <Field label="Arrival time" hint="Team">
            <Input type="time" value={form.arrival} onChange={(e) => set('arrival', e.target.value)} />
          </Field>
        </div>
        <Field label="Venue" required>
          <Select value={form.locationId} onChange={(e) => set('locationId', e.target.value)}>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
        </Field>
        <Field label="Location / address" hint="Auto-filled from venue">
          <Input readOnly value={locations.find((l) => l.id === form.locationId)?.address ?? ''} className="bg-[#FAFBFC] text-ink-3" />
        </Field>
        <Field label="Game type">
          <Select value={form.gameType} onChange={(e) => set('gameType', e.target.value as GameEvent['gameType'])}>
            {['League', 'Tournament', 'Scrimmage', 'Showcase'].map((g) => <option key={g}>{g}</option>)}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set('status', e.target.value as GameEvent['status'])}>
            {['scheduled', 'warmup', 'live', 'halftime', 'final', 'canceled'].map((s) => (
              <option key={s} value={s}>{s === 'warmup' ? 'Warm-up' : s[0].toUpperCase() + s.slice(1)}</option>
            ))}
          </Select>
        </Field>
        <Field label="Notes" className="sm:col-span-2" hint="Shared with coaches and families">
          <Textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Home whites. Arrive 45 minutes early for shootaround." />
        </Field>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-line bg-[#FBFCFD] p-3.5">
        <Bell className="mt-0.5 h-4 w-4 shrink-0 text-royal" />
        <div className="flex-1">
          <Checkbox checked={notify} onChange={setNotify} label={<span className="font-medium">Notify affected families and team</span>} />
          <p className="mt-1 pl-[27px] text-[12px] text-ink-3">
            {team?.roster.length ?? 0} players and their families receive the {existing ? 'updated' : 'new'} schedule instantly.
          </p>
        </div>
      </div>
    </Modal>
  )
}

/* ---------------------------------------------------------------- */
/* Practice                                                          */
/* ---------------------------------------------------------------- */
export function PracticeForm({
  open, onClose, existing,
}: { open: boolean; onClose: () => void; existing?: PracticeEvent }) {
  const { createPractice, updatePractice, toast, visibleTeamIds, role } = useApp()
  const allowed = useMemo(() => teams.filter((t) => role === 'admin' || visibleTeamIds.includes(t.id)), [role, visibleTeamIds])
  const [form, setForm] = useState({
    teamId: existing?.teamId ?? allowed[0].id,
    date: existing?.date ?? d(1),
    start: existing?.start ?? '16:00',
    end: existing?.end ?? '17:30',
    locationId: existing?.locationId ?? 'loc-training',
    coachId: existing?.coachId ?? allowed[0].coachId,
    focus: existing?.focus ?? PRACTICE_FOCUS[0],
    notes: existing?.notes ?? '',
    status: existing?.status ?? 'scheduled',
  })
  const [repeat, setRepeat] = useState<'none' | 'weekly' | 'biweekly'>(existing?.repeat ?? 'none')
  const [until, setUntil] = useState(existing?.repeatUntil ?? d(60))
  const [notify, setNotify] = useState(true)
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const submit = () => {
    const payload = { ...form, repeat, repeatUntil: repeat === 'none' ? undefined : until }
    if (existing) {
      updatePractice(existing.id, payload as Partial<PracticeEvent>, notify)
      toast({ tone: 'success', title: 'Schedule updated', body: notify ? 'Affected users will receive the new schedule.' : 'Change saved.' })
    } else {
      createPractice(payload as Partial<PracticeEvent>)
      toast({ tone: 'success', title: 'Practice created', body: `${teamById(form.teamId)?.name} · ${repeat === 'none' ? 'single session' : `repeats ${repeat}`}.` })
    }
    onClose()
  }

  return (
    <Modal
      open={open} onClose={onClose} width="lg"
      eyebrow={existing ? 'Edit practice' : 'Schedule'}
      title={existing ? `${teamById(form.teamId)?.name} practice` : 'Create practice'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>{existing ? 'Save changes' : 'Create practice'}</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Team" required>
          <Select value={form.teamId} onChange={(e) => set('teamId', e.target.value)}>
            {allowed.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </Field>
        <Field label="Coach" required>
          <Select value={form.coachId} onChange={(e) => set('coachId', e.target.value)}>
            {staff.filter((s) => s.role !== 'Supervisor').map((s) => <option key={s.id} value={s.id}>{s.first} {s.last} — {s.role}</option>)}
          </Select>
        </Field>
        <Field label="Date" required>
          <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start" required><Input type="time" value={form.start} onChange={(e) => set('start', e.target.value)} /></Field>
          <Field label="End" required><Input type="time" value={form.end} onChange={(e) => set('end', e.target.value)} /></Field>
        </div>
        <Field label="Venue" required>
          <Select value={form.locationId} onChange={(e) => set('locationId', e.target.value)}>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
        </Field>
        <Field label="Session focus">
          <Select value={form.focus} onChange={(e) => set('focus', e.target.value)}>
            {PRACTICE_FOCUS.map((f) => <option key={f}>{f}</option>)}
          </Select>
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Bring both jerseys. Shooting stations for the last 20 minutes." />
        </Field>
      </div>

      <div className="mt-4 rounded-xl border border-line bg-[#FBFCFD] p-3.5">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-royal" />
          <span className="text-[13px] font-medium text-ink">Repeat</span>
          <Segmented
            size="sm"
            className="ml-auto"
            value={repeat}
            onChange={(k) => setRepeat(k as typeof repeat)}
            items={[{ key: 'none', label: 'Once' }, { key: 'weekly', label: 'Weekly' }, { key: 'biweekly', label: 'Bi-weekly' }]}
          />
        </div>
        {repeat !== 'none' && (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line-soft pt-3">
            <span className="text-[12.5px] text-ink-3">Repeat until</span>
            <Input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className="h-8 w-auto text-[13px]" />
            <span className="text-[12px] text-ink-4">Creates the full recurring block on the calendar.</span>
          </div>
        )}
      </div>

      <div className="mt-3">
        <Switch checked={notify} onChange={setNotify} label="Notify affected families" description="Everyone on this roster sees the change the moment it is saved." />
      </div>
    </Modal>
  )
}

/* ---------------------------------------------------------------- */
/* Player                                                            */
/* ---------------------------------------------------------------- */
export function PlayerForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useApp()
  const [form, setForm] = useState({ first: '', last: '', age: '12', teamId: '', jersey: '', program: PROGRAMS[1].label, guardian: '', phone: '', email: '' })
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))
  return (
    <Modal
      open={open} onClose={onClose} width="lg" eyebrow="Roster" title="Add player"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            toast({ tone: 'success', title: 'Player added', body: `${form.first || 'New player'} ${form.last} was added to the academy roster.` })
            onClose()
          }}>Add player</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" required><Input value={form.first} onChange={(e) => set('first', e.target.value)} placeholder="Jordan" /></Field>
        <Field label="Last name" required><Input value={form.last} onChange={(e) => set('last', e.target.value)} placeholder="Miles" /></Field>
        <Field label="Age" required><Input type="number" min={7} max={18} value={form.age} onChange={(e) => set('age', e.target.value)} /></Field>
        <Field label="Jersey number" hint="Optional"><Input value={form.jersey} onChange={(e) => set('jersey', e.target.value)} placeholder="23" /></Field>
        <Field label="Team assignment">
          <Select value={form.teamId} onChange={(e) => set('teamId', e.target.value)}>
            <option value="">Academy Program — unassigned</option>
            {teams.map((t) => <option key={t.id} value={t.id} disabled={t.roster.length >= t.capacity}>
              {t.name}{t.roster.length >= t.capacity ? ' — roster full' : ''}
            </option>)}
          </Select>
        </Field>
        <Field label="Program">
          <Select value={form.program} onChange={(e) => set('program', e.target.value)}>
            {PROGRAMS.map((p) => <option key={p.id}>{p.label}</option>)}
          </Select>
        </Field>
        <div className="sm:col-span-2 border-t border-line-soft pt-4">
          <div className="eyebrow mb-3">Family contact</div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Guardian name"><Input value={form.guardian} onChange={(e) => set('guardian', e.target.value)} placeholder="Denise Miles" /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(818) 555-0244" /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="miles.family@example.com" /></Field>
          </div>
        </div>
      </div>
    </Modal>
  )
}

/* ---------------------------------------------------------------- */
/* Team                                                              */
/* ---------------------------------------------------------------- */
export function TeamForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useApp()
  const [form, setForm] = useState({ name: '', ageGroup: '12U', division: 'Select', coachId: staff[1].id, capacity: '12', home: 'loc-chatsworth' })
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))
  return (
    <Modal
      open={open} onClose={onClose} eyebrow="Organization" title="Create team"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            toast({ tone: 'success', title: 'Team created', body: `${form.name || 'New team'} is ready for roster assignment.` })
            onClose()
          }}>Create team</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Team name" required className="sm:col-span-2"><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="15U Elite" /></Field>
        <Field label="Age group" required>
          <Select value={form.ageGroup} onChange={(e) => set('ageGroup', e.target.value)}>
            {['9U', '10U', '11U', '12U', '13U', '14U', '15U', '13U Girls', '14U Girls'].map((a) => <option key={a}>{a}</option>)}
          </Select>
        </Field>
        <Field label="Division" required>
          <Select value={form.division} onChange={(e) => set('division', e.target.value)}>
            {['Development', 'Select', 'Elite'].map((a) => <option key={a}>{a}</option>)}
          </Select>
        </Field>
        <Field label="Head coach" required>
          <Select value={form.coachId} onChange={(e) => set('coachId', e.target.value)}>
            {staff.filter((s) => s.role.includes('Coach')).map((s) => <option key={s.id} value={s.id}>{s.first} {s.last}</option>)}
          </Select>
        </Field>
        <Field label="Roster capacity"><Input type="number" min={6} max={18} value={form.capacity} onChange={(e) => set('capacity', e.target.value)} /></Field>
        <Field label="Home venue" className="sm:col-span-2">
          <Select value={form.home} onChange={(e) => set('home', e.target.value)}>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
        </Field>
      </div>
    </Modal>
  )
}

/* ---------------------------------------------------------------- */
/* Announcement (quick version — the full composer lives in Comms)   */
/* ---------------------------------------------------------------- */
export function AnnouncementForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { sendAnnouncement, toast, role, visibleTeamIds } = useApp()
  const options = useMemo(
    () => AUDIENCES.filter((a) => role === 'admin' || a.key === 'coaches' || visibleTeamIds.includes(a.key)),
    [role, visibleTeamIds]
  )
  const [audienceKey, setAudienceKey] = useState(options[0].key)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState<Priority>('normal')
  const navigate = useNavigate()
  const audience = options.find((a) => a.key === audienceKey)!

  return (
    <Modal
      open={open} onClose={onClose} eyebrow="Communications" title="Send announcement" width="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => { onClose(); navigate('/communications') }}>Open full composer</Button>
          <Button
            variant={priority === 'urgent' ? 'accent' : 'primary'}
            disabled={!title.trim()}
            onClick={() => {
              sendAnnouncement({ title, body, audienceKey, audience: audience.label, recipients: audience.recipients, priority })
              toast({ tone: 'success', title: 'Announcement sent', body: `Delivered to ${audience.recipients} recipients — ${audience.label}.` })
              onClose()
            }}
          >Send announcement</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chatsworth Gym entrance change for Saturday" />
        </Field>
        <Field label="Message" required>
          <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Saturday games will use the east entrance only…" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Audience" required>
            <Select value={audienceKey} onChange={(e) => setAudienceKey(e.target.value)}>
              {options.map((a) => <option key={a.key} value={a.key}>{a.label} — {a.recipients}</option>)}
            </Select>
          </Field>
          <Field label="Priority">
            <Segmented
              value={priority}
              onChange={(k) => setPriority(k as Priority)}
              items={[{ key: 'normal', label: 'Normal' }, { key: 'important', label: 'Important' }, { key: 'urgent', label: 'Urgent' }]}
              className="mt-0.5 w-full"
            />
          </Field>
        </div>
        <div className={cn('flex items-center gap-2.5 rounded-xl border p-3.5',
          priority === 'urgent' ? 'border-[#FBDCC9] bg-orange-tint' : 'border-line bg-[#FBFCFD]')}>
          <Bell className={cn('h-4 w-4', priority === 'urgent' ? 'text-[#C24A12]' : 'text-royal')} />
          <span className="text-[13px] text-ink-2">
            <strong className="font-semibold text-ink tabular-nums">{audience.recipients} recipients</strong> · {audience.hint}
          </span>
        </div>
      </div>
    </Modal>
  )
}

/* Host — renders whichever quick-create form is active */
export function CreateModalHost() {
  const { createKind, closeCreate } = useApp()
  return (
    <>
      <GameForm open={createKind === 'game'} onClose={closeCreate} />
      <PracticeForm open={createKind === 'practice'} onClose={closeCreate} />
      <PlayerForm open={createKind === 'player'} onClose={closeCreate} />
      <TeamForm open={createKind === 'team'} onClose={closeCreate} />
      <AnnouncementForm open={createKind === 'announcement'} onClose={closeCreate} />
    </>
  )
}
