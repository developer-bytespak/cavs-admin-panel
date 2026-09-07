import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CreditCard, Bell, Check, ArrowRight, Receipt } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { PROGRAMS, teamById } from '../data/mock'
import { cn, fmtDate, money, relativeDay } from '../lib/utils'
import { stagger } from '../components/layout/AppShell'
import { PageHeader, MetaItem } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Avatar, TeamCrest } from '../components/ui/Avatar'

export default function PaymentDetail() {
  const { paymentId } = useParams()
  const { payments, players, setPaymentStatus, toast } = useApp()
  const payment = payments.find((p) => p.id === paymentId)

  if (!payment) {
    return <Card><EmptyState icon={CreditCard} title="Payment record not found"
      description="This invoice may have been voided or merged with another record."
      action={<Link to="/payments"><Button variant="secondary">Back to payments</Button></Link>} /></Card>
  }

  const player = players.find((p) => p.id === payment.playerId)
  const team = player?.teamId ? teamById(player.teamId) : null
  const program = PROGRAMS.find((p) => p.label === payment.program)

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-5">
      <motion.div variants={stagger.item}>
        <PageHeader
          breadcrumbs={[{ label: 'Payments', to: '/payments' }, { label: payment.family }]}
          eyebrow={`${payment.program} · season dues`}
          title={
            <span className="flex items-center gap-3.5">
              <Avatar first={payment.playerName.split(' ')[0]} last={payment.playerName.split(' ')[1] ?? ''} size="xl" />
              <span>
                <span className="block">{payment.family}</span>
                <span className="mt-1 block text-[13px] font-normal text-ink-3">{payment.playerName}</span>
              </span>
            </span>
          }
          meta={<>
            <span><StatusBadge status={payment.status} /></span>
            <MetaItem label="Amount" value={money(payment.amount)} />
            <MetaItem label="Due" value={fmtDate(payment.due, 'medium')} tone={payment.status === 'overdue' ? 'accent' : 'default'} />
          </>}
          actions={
            <>
              {payment.status !== 'paid' && (
                <>
                  <Button variant="secondary" icon={Bell}
                    onClick={() => toast({ tone: 'success', title: 'Reminder sent', body: `${payment.family} received a dues reminder.` })}>
                    Send reminder
                  </Button>
                  <Button variant="primary" icon={Check}
                    onClick={() => {
                      setPaymentStatus(payment.id, 'paid')
                      toast({ tone: 'success', title: 'Payment recorded', body: `${money(payment.amount)} marked as paid.` })
                    }}>
                    Mark as paid
                  </Button>
                </>
              )}
              {payment.status === 'paid' && (
                <Button variant="secondary" icon={Receipt}
                  onClick={() => toast({ tone: 'info', title: 'Receipt prepared', body: `A receipt for ${money(payment.amount)} is ready to send.` })}>
                  Send receipt
                </Button>
              )}
            </>
          }
        />
      </motion.div>

      <motion.div variants={stagger.item} className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          <Card>
            <div className="eyebrow">Balance</div>
            <div className={cn('stat mt-2.5 text-[44px] leading-none',
              payment.status === 'paid' ? 'text-good' : payment.status === 'pending' ? 'text-warn' : 'text-bad')}>
              {money(payment.amount)}
            </div>
            <div className="mt-1.5 text-[13px] text-ink-3">
              {payment.status === 'paid' ? `Settled ${relativeDay(payment.lastActivity).toLowerCase()}`
                : payment.status === 'pending' ? `Due ${relativeDay(payment.due).toLowerCase()}`
                  : `Past due since ${fmtDate(payment.due, 'medium')}`}
            </div>
            <dl className="mt-4 divide-y divide-line-soft border-t border-line-soft">
              <Row label="Program" value={payment.program} />
              <Row label="Season fee" value={money(program?.fee ?? payment.amount)} />
              <Row label="Payment method" value={payment.method} />
              <Row label="Status" value={<StatusBadge status={payment.status} size="xs" />} />
            </dl>
          </Card>

          <Card>
            <CardHeader eyebrow="Registration" title="Linked record" />
            <dl className="mt-3 divide-y divide-line-soft">
              <Row label="Player" value={player ? (
                <Link to={`/players/${player.id}`} className="font-medium hover:text-royal">{payment.playerName}</Link>
              ) : payment.playerName} />
              <Row label="Team" value={team ? (
                <Link to={`/teams/${team.id}`} className="inline-flex items-center gap-2 font-medium hover:text-royal">
                  <TeamCrest short={team.short} color={team.color} size="sm" />{team.name}
                </Link>
              ) : 'Academy Program'} />
              <Row label="Registration" value={player ? <StatusBadge status={player.registration} size="xs" /> : '—'} />
            </dl>
            {player && (
              <Link to={`/players/${player.id}`} className="mt-3 block">
                <Button size="sm" variant="secondary" className="w-full" iconRight={ArrowRight}>Open player profile</Button>
              </Link>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card padded={false}>
            <div className="px-5 pb-2 pt-5">
              <CardHeader eyebrow="Ledger" title="Payment history" subtitle="Everything recorded against this invoice" />
            </div>
            <ol className="px-5 pb-5">
              {payment.history.map((h, i) => (
                <li key={h.id} className={cn('flex items-start gap-3 py-3', i > 0 && 'border-t border-line-soft')}>
                  <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                    h.label.startsWith('Payment') ? 'bg-good-tint text-good' : 'bg-[#F1F3F7] text-ink-3')}>
                    {h.label.startsWith('Payment') ? <Check className="h-3.5 w-3.5" /> : <Receipt className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-ink">{h.label}</div>
                    <div className="text-[11.5px] text-ink-4">{fmtDate(h.date, 'long')}</div>
                  </div>
                  <span className="stat shrink-0 text-[15px] text-ink">{h.amount !== null ? money(h.amount) : '—'}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <CardHeader eyebrow="Notes" title="Account notes" />
            <p className="mt-3 rounded-xl border border-line bg-[#FBFCFD] p-3.5 text-[13.5px] leading-relaxed text-ink-2">
              {payment.status === 'paid'
                ? `Dues settled in full. No further action needed for the ${payment.family.replace(' Family', '')} household this season.`
                : payment.status === 'pending'
                  ? 'Invoice issued and not yet due. A reminder goes out automatically three days before the due date.'
                  : 'Past due. A second notice has been sent. Payment plans are available — offer one before restricting participation.'}
            </p>
          </Card>
        </div>
      </motion.div>
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
