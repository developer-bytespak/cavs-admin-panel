import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Clock, X, Bell, CalendarDays, Users } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { teamById, locationById, rosterOf, d } from '../data/mock'
import type { AttendanceMark, CalEvent } from '../data/types'
import { cn, fmtDate, fmtTime, relativeDay } from '../lib/utils'
import { stagger } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusBadge, Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Avatar, TeamCrest } from '../components/ui/Avatar'
import { Select } from '../components/ui/Field'

const MARKS: { key: AttendanceMark; label: string; icon: React.ComponentType<{ className?: string }>; on: string }[] = [
  { key: 'present', label: 'Present', icon: Check, on: 'bg-good text-white border-good' },
  { key: 'late', label: 'Late', icon: Clock, on: 'bg-warn text-white border-warn' },
  { key: 'absent', label: 'Absent', icon: X, on: 'bg-bad text-white border-bad' },
]

export default function Attendance() {
  const { practices, games, attendance, markAttendance, role, visibleTeamIds, toast } = useApp()
  const today = d(0)

  const sessions = useMemo<CalEvent[]>(() => {
    const scope = (id: string) => role === 'admin' || visibleTeamIds.includes(id)
    return [
      ...practices.filter((p) => scope(p.teamId) && p.date >= d(-7) && p.date <= d(7)),
      ...games.filter((g) => scope(g.teamId) && g.date >= d(-7) && g.date <= d(7)),
    ].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
  }, [practices, games, role, visibleTeamIds])

  const [sessionId, setSessionId] = useState(() => {
    const todays = sessions.find((s) => s.date === today)
    return todays?.id ?? sessions[0]?.id ?? ''
  })

  const session = sessions.find((s) => s.id === sessionId)
  const team = session && 'teamId' in session && session.teamId ? teamById(session.teamId) : undefined
  const roster = team ? rosterOf(team.id) : []
  const marks = attendance[sessionId] ?? {}

  const counts = {
    present: roster.filter((p) => marks[p.id] === 'present').length,
    late: roster.filter((p) => marks[p.id] === 'late').length,
    absent: roster.filter((p) => marks[p.id] === 'absent').length,
    unmarked: roster.filter((p) => !marks[p.id]).length,
  }
  const marked = roster.length - counts.unmarked
  const rate = marked ? Math.round(((counts.present + counts.late * 0.5) / marked) * 100) : 0

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={stagger.item}>
        <PageHeader
          eyebrow="Team tools"
          title="Attendance & Check-in"
          description="Mark a roster present, late or absent as the session runs. Attendance rolls straight into team and academy reporting."
          actions={
            <Button variant="secondary" icon={Bell} disabled={!team}
              onClick={() => toast({ tone: 'success', title: 'Families notified', body: `${counts.absent} absence notifications queued for the ${team?.name} families.` })}>
              Notify absences
            </Button>
          }
        />
      </motion.div>

      {sessions.length === 0 ? (
        <Card><EmptyState icon={CalendarDays} title="No sessions in this window"
          description="Attendance opens for practices and games within a week of today." /></Card>
      ) : (
        <>
          <motion.div variants={stagger.item} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-2 shadow-card">
            <span className="pl-1.5 text-[12.5px] font-medium text-ink-2">Session</span>
            <Select value={sessionId} onChange={(e) => setSessionId(e.target.value)} className="w-auto min-w-[320px]">
              {sessions.map((s) => {
                const t = 'teamId' in s && s.teamId ? teamById(s.teamId) : null
                const label = s.type === 'game' ? `${t?.name} vs ${s.opponent}` : s.type === 'practice' ? `${t?.name} — ${s.focus}` : s.title
                return <option key={s.id} value={s.id}>{relativeDay(s.date)} · {fmtTime(s.start)} · {label}</option>
              })}
            </Select>
            {session && (
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-3">
                <Badge tone={session.type === 'game' ? 'orange' : 'blue'} dot={false} size="xs">
                  {session.type === 'game' ? 'Game' : 'Practice'}
                </Badge>
                <span>{fmtDate(session.date, 'long')}</span>
                <span>·</span>
                <span>{locationById(session.locationId)?.name}</span>
              </span>
            )}
          </motion.div>

          {!team ? (
            <Card><EmptyState icon={Users} title="This session has no roster"
              description="Evaluations and meetings are not roster-based." /></Card>
          ) : (
            <motion.div variants={stagger.item} className="grid gap-4 xl:grid-cols-[1fr_300px]">
              <Card padded={false}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
                  <div className="flex items-center gap-3">
                    <TeamCrest short={team.short} color={team.color} />
                    <div>
                      <h3 className="font-display text-[17px] font-semibold uppercase tracking-[0.035em] text-ink">{team.name}</h3>
                      <p className="text-[12.5px] text-ink-3">{roster.length} players on the roster</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => {
                      roster.forEach((p) => markAttendance(sessionId, p.id, 'present'))
                      toast({ tone: 'success', title: 'All marked present', body: `${roster.length} players checked in for this session.` })
                    }}>Mark all present</Button>
                    <Button size="sm" variant="ghost" onClick={() => roster.forEach((p) => markAttendance(sessionId, p.id, 'unmarked'))}>
                      Reset
                    </Button>
                  </div>
                </div>
                <div className="divide-y divide-line-soft">
                  {roster.map((p) => {
                    const mark = marks[p.id] ?? 'unmarked'
                    return (
                      <div key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                        <Avatar first={p.first} last={p.last} jersey={p.jersey} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13.5px] font-medium text-ink">{p.first} {p.last}</div>
                          <div className="text-[12px] text-ink-3">#{p.jersey} · season attendance {p.attendance}%</div>
                        </div>
                        {mark !== 'unmarked' && mark !== 'absent' && (
                          <span className="hidden text-[11.5px] text-ink-4 sm:inline">Parent notified</span>
                        )}
                        <div className="flex gap-1">
                          {MARKS.map((m) => (
                            <button
                              key={m.key}
                              onClick={() => markAttendance(sessionId, p.id, mark === m.key ? 'unmarked' : m.key)}
                              aria-pressed={mark === m.key}
                              className={cn(
                                'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-medium transition-all duration-150',
                                mark === m.key ? m.on : 'border-line bg-white text-ink-3 hover:border-[#D9DDE5] hover:text-ink'
                              )}
                            >
                              <m.icon className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">{m.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader eyebrow="This session" title="Check-in summary" />
                  <div className="stat mt-4 text-[42px] leading-none text-ink">{rate}%</div>
                  <div className="mt-1 text-[12.5px] text-ink-3">{marked} of {roster.length} players marked</div>
                  <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-line-soft">
                    {counts.present > 0 && <span className="bg-good" style={{ width: `${(counts.present / roster.length) * 100}%` }} />}
                    {counts.late > 0 && <span className="bg-warn" style={{ width: `${(counts.late / roster.length) * 100}%`, marginLeft: 2 }} />}
                    {counts.absent > 0 && <span className="bg-bad" style={{ width: `${(counts.absent / roster.length) * 100}%`, marginLeft: 2 }} />}
                  </div>
                  <dl className="mt-4 space-y-2 border-t border-line-soft pt-3.5">
                    {[['present', counts.present], ['late', counts.late], ['absent', counts.absent], ['unmarked', counts.unmarked]].map(([k, v]) => (
                      <div key={k as string} className="flex items-center justify-between">
                        <dt><StatusBadge status={k as string} size="xs" /></dt>
                        <dd className="stat text-[15px] text-ink">{v as number}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>

                <Card>
                  <CardHeader eyebrow="History" title="Team attendance" subtitle="Season to date" />
                  <div className="stat mt-3 text-[32px] leading-none text-ink">{team.attendance}%</div>
                  <div className="mt-3 space-y-2 border-t border-line-soft pt-3">
                    {roster.filter((p) => p.attendance < 85).slice(0, 4).map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2">
                        <span className="truncate text-[12.5px] text-ink-2">{p.first} {p.last}</span>
                        <span className="shrink-0 text-[12.5px] font-semibold tabular-nums text-warn">{p.attendance}%</span>
                      </div>
                    ))}
                    {roster.filter((p) => p.attendance < 85).length === 0 && (
                      <p className="text-[12.5px] text-ink-3">Every player on this roster is above 85% for the season.</p>
                    )}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  )
}
