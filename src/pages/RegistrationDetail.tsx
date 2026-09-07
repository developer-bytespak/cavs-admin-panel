import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ClipboardList, Phone, Mail, Check, ArrowRight, UserPlus, StickyNote, Plus, ClipboardCheck,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { teams, teamById, rosterOf, d } from '../data/mock'
import type { RegStage } from '../data/types'
import { cn, fmtDate, relativeDay } from '../lib/utils'
import { stagger } from '../components/layout/AppShell'
import { PageHeader, MetaItem } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusBadge, Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Avatar, TeamCrest } from '../components/ui/Avatar'
import { Modal } from '../components/ui/Modal'
import { Field, Select, Textarea } from '../components/ui/Field'

const FLOW: { key: RegStage; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'review', label: 'In Review' },
  { key: 'evaluation', label: 'Evaluation' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
]

export default function RegistrationDetail() {
  const { regId } = useParams()
  const { registrations, moveRegistration, updateRegistration, toast } = useApp()
  const [assignOpen, setAssignOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState('')

  const reg = registrations.find((r) => r.id === regId)
  if (!reg) {
    return <Card><EmptyState icon={ClipboardList} title="Registration not found"
      description="This registration may have been completed or withdrawn."
      action={<Link to="/registrations"><Button variant="secondary">Back to registrations</Button></Link>} /></Card>
  }

  const stageIndex = FLOW.findIndex((f) => f.key === reg.stage)
  const assigned = reg.assignedTeamId ? teamById(reg.assignedTeamId) : null
  const [first, last] = reg.playerName.split(' ')

  const move = (stage: RegStage, label: string) => {
    moveRegistration(reg.id, stage)
    toast({ tone: 'success', title: label, body: `${reg.playerName} moved to ${FLOW.find((f) => f.key === stage)!.label}.` })
  }

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-5">
      <motion.div variants={stagger.item}>
        <PageHeader
          breadcrumbs={[{ label: 'Registrations', to: '/registrations' }, { label: reg.playerName }]}
          eyebrow={`${reg.program} · submitted ${relativeDay(reg.submitted)}`}
          title={
            <span className="flex items-center gap-3.5">
              <Avatar first={first} last={last ?? ''} size="xl" />
              <span>{reg.playerName}</span>
            </span>
          }
          meta={<>
            <span><StatusBadge status={reg.stage} /></span>
            <MetaItem label="Age" value={reg.age} />
            <MetaItem label="Source" value={reg.source} />
            <MetaItem label="Payment" value={<StatusBadge status={reg.payment} size="xs" />} />
          </>}
          actions={
            <>
              {reg.stage === 'new' && <Button variant="secondary" icon={Check} onClick={() => move('review', 'Marked in review')}>Mark in review</Button>}
              {(reg.stage === 'new' || reg.stage === 'review') && (
                <Button variant="secondary" icon={ClipboardCheck} onClick={() => move('evaluation', 'Sent to evaluation')}>Send to evaluation</Button>
              )}
              {reg.stage === 'evaluation' && <Button variant="primary" icon={Check} onClick={() => move('ready', 'Registration approved')}>Approve</Button>}
              {(reg.stage === 'ready' || reg.stage === 'completed') && (
                <Button variant="accent" icon={UserPlus} onClick={() => setAssignOpen(true)}>
                  {assigned ? 'Reassign team' : 'Assign team'}
                </Button>
              )}
            </>
          }
        />
      </motion.div>

      {/* Stage flow */}
      <motion.div variants={stagger.item}>
        <Card padded={false} className="overflow-hidden">
          <div className="flex flex-wrap">
            {FLOW.map((f, i) => {
              const done = i < stageIndex
              const active = i === stageIndex
              return (
                <button
                  key={f.key}
                  onClick={() => move(f.key, 'Stage updated')}
                  className={cn(
                    'group relative flex flex-1 items-center gap-2.5 px-4 py-3.5 text-left transition-colors',
                    active ? 'bg-royal-tint' : 'hover:bg-[#FAFBFD]',
                    i > 0 && 'border-l border-line-soft'
                  )}
                >
                  <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums',
                    done ? 'bg-good text-white' : active ? 'bg-royal text-white' : 'bg-[#EDEFF3] text-ink-4')}>
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block truncate text-[13px] font-medium', active ? 'text-royal' : done ? 'text-ink-2' : 'text-ink-4')}>
                      {f.label}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={stagger.item} className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader eyebrow="Player information" title="Applicant details" />
            <dl className="mt-3 divide-y divide-line-soft">
              <Row label="Player name" value={reg.playerName} />
              <Row label="Age" value={`${reg.age} years old`} />
              <Row label="Requested program" value={reg.program} />
              <Row label="Submission date" value={fmtDate(reg.submitted, 'long')} />
              <Row label="Source" value={reg.source} />
              <Row label="Current stage" value={<StatusBadge status={reg.stage} size="xs" />} />
              <Row label="Assigned team" value={assigned ? (
                <Link to={`/teams/${assigned.id}`} className="inline-flex items-center gap-2 font-medium hover:text-royal">
                  <TeamCrest short={assigned.short} color={assigned.color} size="sm" />{assigned.name}
                </Link>
              ) : <span className="text-ink-4">Not assigned yet</span>} />
            </dl>
          </Card>

          <Card>
            <CardHeader
              eyebrow="Evaluation information"
              title="Evaluation"
              action={reg.evaluation.status === 'complete'
                ? <span className="stat text-[26px] text-ink">{reg.evaluation.score?.toFixed(1)}</span>
                : <Badge tone={reg.evaluation.status === 'scheduled' ? 'blue' : 'neutral'} dot={false}>
                    {reg.evaluation.status === 'scheduled' ? 'Scheduled' : 'Not scheduled'}
                  </Badge>}
            />
            {reg.evaluation.status === 'not scheduled' ? (
              <div className="mt-3 rounded-xl border border-dashed border-line p-5 text-center">
                <p className="text-[13px] text-ink-3">No evaluation has been scheduled for this player yet.</p>
                <Button size="sm" variant="secondary" className="mt-3" icon={ClipboardCheck}
                  onClick={() => {
                    updateRegistration(reg.id, { evaluation: { ...reg.evaluation, status: 'scheduled', date: d(3), evaluator: 'Marcus Reed' } })
                    move('evaluation', 'Evaluation scheduled')
                  }}>
                  Schedule evaluation
                </Button>
              </div>
            ) : (
              <>
                <dl className="mt-3 divide-y divide-line-soft">
                  <Row label="Evaluator" value={reg.evaluation.evaluator ?? '—'} />
                  <Row label="Date" value={reg.evaluation.date ? fmtDate(reg.evaluation.date, 'long') : '—'} />
                  <Row label="Status" value={<StatusBadge status={reg.evaluation.status === 'complete' ? 'completed' : 'scheduled'} size="xs" />} />
                  {reg.evaluation.recommendation && <Row label="Team recommendation" value={reg.evaluation.recommendation} />}
                </dl>
                {reg.evaluation.notes && (
                  <p className="mt-3 rounded-xl border border-line bg-[#FBFCFD] p-3.5 text-[13px] leading-relaxed text-ink-2">
                    {reg.evaluation.notes}
                  </p>
                )}
              </>
            )}
          </Card>

          <Card>
            <CardHeader eyebrow="Admin notes" title="Internal notes"
              action={<Button size="xs" variant="ghost" icon={Plus} onClick={() => setNoteOpen(true)}>Add note</Button>} />
            {reg.adminNotes.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-line p-5 text-center">
                <StickyNote className="mx-auto h-5 w-5 text-ink-4" />
                <p className="mt-2 text-[13px] text-ink-3">No internal notes on this registration yet.</p>
              </div>
            ) : (
              <ol className="mt-3 space-y-2.5">
                {reg.adminNotes.map((n) => (
                  <li key={n.id} className="rounded-xl border border-line bg-[#FBFCFD] p-3.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[12.5px] font-semibold text-ink">{n.author}</span>
                      <span className="text-[11.5px] text-ink-4">{fmtDate(n.date, 'medium')}</span>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{n.body}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader eyebrow="Family contact" title={reg.guardian.name} subtitle={`${reg.guardian.relation} · primary contact`} />
            <div className="mt-3 space-y-2">
              <a href={`tel:${reg.guardian.phone}`} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-[13px] text-ink-2 transition-colors hover:border-[#D9DDE5] hover:text-ink">
                <Phone className="h-3.5 w-3.5 text-ink-4" />{reg.guardian.phone}
              </a>
              <a href={`mailto:${reg.guardian.email}`} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-[13px] text-ink-2 transition-colors hover:border-[#D9DDE5] hover:text-ink">
                <Mail className="h-3.5 w-3.5 text-ink-4" />{reg.guardian.email}
              </a>
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Registration" title="Payment status" action={<StatusBadge status={reg.payment} />} />
            <p className="mt-3 text-[13px] leading-relaxed text-ink-3">
              {reg.payment === 'paid'
                ? 'Season dues are settled. This family is clear for placement.'
                : 'Dues are outstanding. Placement can proceed, but the balance should be collected before the first game.'}
            </p>
            <Link to="/payments" className="mt-3 block">
              <Button size="sm" variant="secondary" className="w-full" iconRight={ArrowRight}>Open payments</Button>
            </Link>
          </Card>

          <Card>
            <CardHeader eyebrow="Next step" title="Recommended action" />
            <p className="mt-2.5 text-[13px] leading-relaxed text-ink-2">
              {reg.stage === 'new' ? 'Review the submitted details and confirm age eligibility, then move this registration into review.'
                : reg.stage === 'review' ? 'Details look complete. Schedule an evaluation slot so a coach can place this player correctly.'
                  : reg.stage === 'evaluation' ? 'An evaluation is in progress. Approve once the coach submits a score and recommendation.'
                    : reg.stage === 'ready' ? `Approved and ready. ${reg.evaluation.recommendation ? `The evaluator recommends ${reg.evaluation.recommendation}.` : 'Assign a team to complete this registration.'}`
                      : 'This registration is complete. The player now appears on the academy roster.'}
            </p>
          </Card>
        </div>
      </motion.div>

      {/* Assign team */}
      <Modal
        open={assignOpen} onClose={() => setAssignOpen(false)} width="sm"
        eyebrow="Placement" title={`Assign ${reg.playerName}`}
        footer={<Button variant="ghost" onClick={() => setAssignOpen(false)}>Close</Button>}
      >
        {reg.evaluation.recommendation && (
          <div className="mb-4 rounded-xl border border-[#D5E1FC] bg-royal-tint p-3 text-[12.5px] text-[#123796]">
            Evaluator recommendation: <strong className="font-semibold">{reg.evaluation.recommendation}</strong>
          </div>
        )}
        <Field label="Team">
          <Select
            defaultValue={reg.assignedTeamId ?? ''}
            onChange={(e) => {
              const id = e.target.value
              if (!id) return
              updateRegistration(reg.id, { assignedTeamId: id, stage: 'completed' })
              toast({ tone: 'success', title: 'Player assigned', body: `${reg.playerName} assigned to ${teamById(id)?.name}. Registration marked complete.` })
              setAssignOpen(false)
            }}
          >
            <option value="">Select a team…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id} disabled={rosterOf(t.id).length >= t.capacity}>
                {t.name} ({rosterOf(t.id).length}/{t.capacity}){rosterOf(t.id).length >= t.capacity ? ' — full' : ''}
              </option>
            ))}
          </Select>
        </Field>
      </Modal>

      {/* Add note */}
      <Modal
        open={noteOpen} onClose={() => setNoteOpen(false)} width="md" eyebrow="Registration" title="Add an internal note"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button variant="primary" disabled={!note.trim()} onClick={() => {
              updateRegistration(reg.id, { adminNotes: [{ id: `an-${Date.now()}`, author: 'Darryl Hayes', date: d(0), body: note }, ...reg.adminNotes] })
              setNote(''); setNoteOpen(false)
              toast({ tone: 'success', title: 'Note added', body: 'Saved to this registration.' })
            }}>Save note</Button>
          </>
        }
      >
        <Field label="Note" hint="Staff only">
          <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Family asked about the Saturday practice block. Sibling already in the 12U program." />
        </Field>
      </Modal>
    </motion.div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-[12.5px] text-ink-3">{label}</dt>
      <dd className="min-w-0 truncate text-right text-[13px] font-medium text-ink">{value}</dd>
    </div>
  )
}
