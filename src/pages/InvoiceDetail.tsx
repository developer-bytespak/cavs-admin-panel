import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Receipt, Wallet, Send, MoreHorizontal, RotateCcw, Ban, Gift, CalendarClock, Sliders,
  CreditCard, AlertTriangle, RefreshCw, Phone, ArrowRight, Check, Mail, FileText,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { teamById, playerById } from '../data/mock'
import { methodLabel, attentionReason, daysOverdue, planById } from '../data/billing'
import { cn, fmtDate, money, relativeDay } from '../lib/utils'
import { stagger } from '../components/layout/AppShell'
import { PageHeader, MetaItem } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button, IconButton } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Avatar, TeamCrest } from '../components/ui/Avatar'
import { Switch } from '../components/ui/Field'
import { InvoiceStatusBadge } from '../components/billing/InvoiceStatusBadge'
import { InstallmentTimeline, BalanceBar } from '../components/billing/InstallmentTimeline'
import {
  RecordPaymentModal, PayNowModal, ReminderModal, RefundModal, ConvertPlanModal, ApplyCreditModal,
} from '../components/billing/BillingModals'

const LEDGER_ICON = {
  payment: { icon: Check, cls: 'bg-good-tint text-good' },
  refund: { icon: RotateCcw, cls: 'bg-bad-tint text-bad' },
  credit: { icon: Gift, cls: 'bg-royal-tint text-royal' },
  discount: { icon: Gift, cls: 'bg-royal-tint text-royal' },
  fee: { icon: Receipt, cls: 'bg-[#F1F3F7] text-ink-3' },
  invoice: { icon: FileText, cls: 'bg-[#F1F3F7] text-ink-3' },
  reminder: { icon: Mail, cls: 'bg-warn-tint text-warn' },
  adjustment: { icon: Sliders, cls: 'bg-[#F1F3F7] text-ink-3' },
  failure: { icon: AlertTriangle, cls: 'bg-bad-tint text-bad' },
}

export default function InvoiceDetail() {
  const { invoiceId } = useParams()
  const { invoices, families, registrations, setAutopay, requestPaymentMethod, retryPayment, voidInvoice, toast } = useApp()
  const [modal, setModal] = useState<null | 'record' | 'pay' | 'remind' | 'refund' | 'convert' | 'credit'>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const invoice = invoices.find((i) => i.id === invoiceId)

  if (!invoice) {
    return <Card><EmptyState icon={Receipt} title="Invoice not found"
      description="This invoice may have been voided or merged into another account."
      action={<Link to="/payments"><Button variant="secondary">Back to payments</Button></Link>} /></Card>
  }

  const team = invoice.teamId ? teamById(invoice.teamId) : null
  const player = invoice.playerId ? playerById(invoice.playerId) : null
  const family = families.find((f) => f.familyName === invoice.familyName)
  const registration = registrations.find((r) => r.id === invoice.registrationId)
  const plan = planById(invoice.planId)
  const failed = invoice.installments.find((i) => i.status === 'failed')
  const late = daysOverdue(invoice)
  const [first, last] = invoice.playerName.split(' ')

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-5">
      <motion.div variants={stagger.item}>
        <PageHeader
          breadcrumbs={[{ label: 'Payments', to: '/payments' }, { label: invoice.id }]}
          eyebrow={`${invoice.program} · ${invoice.planName}`}
          title={
            <span className="flex items-center gap-3.5">
              <Avatar first={first} last={last ?? ''} size="xl" />
              <span>
                <span className="block font-display uppercase tracking-[0.03em]">{invoice.id}</span>
                <span className="mt-1 block text-[14px] font-normal text-ink-2">
                  {invoice.playerName}
                  {team && <span className="text-ink-3"> · {team.name}</span>}
                </span>
              </span>
            </span>
          }
          meta={<>
            <span><InvoiceStatusBadge status={invoice.status} /></span>
            <MetaItem label="Issued" value={fmtDate(invoice.issued, 'medium')} />
            {invoice.nextDue && <MetaItem label="Next due" value={fmtDate(invoice.nextDue, 'medium')} tone={late > 0 ? 'accent' : 'default'} />}
          </>}
          actions={
            <>
              {invoice.balance > 0 && (
                <Button variant="secondary" icon={Send} onClick={() => setModal('remind')}>Send reminder</Button>
              )}
              {invoice.balance > 0 && (
                <Button variant="secondary" icon={Receipt} onClick={() => setModal('record')}>Record payment</Button>
              )}
              {invoice.balance > 0 && (
                <Button variant="accent" icon={Wallet} onClick={() => setModal('pay')}>Pay now</Button>
              )}
              <div className="relative">
                <IconButton icon={MoreHorizontal} label="More actions"
                  className="border border-line bg-white" onClick={() => setMenuOpen((v) => !v)} />
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 z-50 mt-2 w-[220px] rounded-xl border border-line bg-white p-1.5 shadow-pop">
                      <MenuItem icon={RotateCcw} label="Refund payment" disabled={invoice.paid <= 0}
                        onClick={() => { setMenuOpen(false); setModal('refund') }} />
                      <MenuItem icon={CalendarClock} label="Convert to payment plan" disabled={invoice.balance <= 0}
                        onClick={() => { setMenuOpen(false); setModal('convert') }} />
                      <MenuItem icon={Gift} label="Apply credit" disabled={invoice.balance <= 0}
                        onClick={() => { setMenuOpen(false); setModal('credit') }} />
                      <MenuItem icon={Sliders} label="Adjust balance"
                        onClick={() => { setMenuOpen(false); toast({ tone: 'info', title: 'Balance adjustment', body: 'Use Record payment or Apply credit to change this balance.' }) }} />
                      <div className="my-1 h-px bg-line-soft" />
                      <MenuItem icon={Ban} label="Void invoice" danger
                        onClick={() => {
                          setMenuOpen(false)
                          voidInvoice(invoice.id)
                          toast({ tone: 'warn', title: 'Invoice voided', body: `${invoice.id} no longer carries a balance.` })
                        }} />
                    </div>
                  </>
                )}
              </div>
            </>
          }
        />
      </motion.div>

      {/* Failure banner — the one place critical red earns its place */}
      {failed && (
        <motion.div variants={stagger.item}>
          <div className="flex flex-wrap items-start gap-4 rounded-2xl border border-[#F5D5D7] bg-bad-tint p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-bad">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-[16px] font-semibold uppercase tracking-[0.05em] text-bad">Payment failed</h3>
              <p className="mt-1 text-[13px] text-ink-2">
                <strong className="font-semibold">{money(failed.amount)}</strong> installment for {invoice.playerName} on {fmtDate(failed.dueDate, 'medium')}
                {' · '}Reason: <strong className="font-semibold">{failed.failureReason}</strong>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" icon={RefreshCw} disabled={!invoice.method}
                onClick={() => { retryPayment(invoice.id); toast({ tone: 'success', title: 'Payment retried', body: `${money(failed.amount)} collected from ${methodLabel(invoice.method)}.` }) }}>
                Retry
              </Button>
              <Button size="sm" variant="secondary" icon={CreditCard}
                onClick={() => { requestPaymentMethod(invoice.id); toast({ tone: 'success', title: 'Payment method request sent', body: `${invoice.familyName} was asked to update their card.` }) }}>
                Request method
              </Button>
              <Button size="sm" variant="secondary" icon={Phone}
                onClick={() => toast({ tone: 'info', title: 'Contact logged', body: `Follow-up call noted for ${invoice.familyName}.` })}>
                Contact family
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary strip */}
      <motion.div variants={stagger.item} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="Total" value={money(invoice.total)} sub={invoice.planName} />
        <SummaryTile label="Paid" value={money(invoice.paid)} tone="good"
          sub={`${invoice.installments.filter((i) => i.status === 'paid').length} of ${invoice.installments.length} installments`} />
        <SummaryTile label="Remaining" value={money(invoice.balance)} tone={invoice.balance > 0 ? (late > 0 ? 'bad' : 'warn') : 'good'}
          sub={invoice.balance > 0 ? (invoice.nextDue ? `Next due ${relativeDay(invoice.nextDue).toLowerCase()}` : 'Awaiting schedule') : 'Settled in full'} />
        <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
          <div className="eyebrow">Status</div>
          <div className="mt-2.5"><InvoiceStatusBadge status={invoice.status} /></div>
          <div className="mt-3"><BalanceBar paid={invoice.paid} total={invoice.total} /></div>
        </div>
      </motion.div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <motion.div variants={stagger.item} className="space-y-4">
          {/* Installment timeline */}
          <Card padded={false}>
            <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-4 pt-5">
              <CardHeader eyebrow="Payment plan" title={invoice.planName}
                subtitle={invoice.installments.length > 1 ? `${invoice.installments.length} scheduled installments · ${plan.notes}` : plan.notes} />
              {invoice.balance > 0 && invoice.installments.length === 1 && (
                <Button size="xs" variant="ghost" icon={CalendarClock} onClick={() => setModal('convert')}>Convert to plan</Button>
              )}
            </div>
            <div className="px-5 pb-5">
              <InstallmentTimeline installments={invoice.installments} />
            </div>
          </Card>

          {/* Invoice summary */}
          <Card>
            <CardHeader eyebrow="Invoice summary" title={invoice.description || invoice.program} />
            <dl className="mt-3.5 space-y-2 text-[13.5px]">
              <SumRow label="Subtotal" value={money(invoice.subtotal)} />
              {invoice.discountAmount > 0 && (
                <SumRow label={invoice.discountLabel ?? 'Discount'} value={`-${money(invoice.discountAmount)}`} tone="good" />
              )}
              {invoice.creditApplied > 0 && <SumRow label="Account credit" value={`-${money(invoice.creditApplied)}`} tone="good" />}
              {invoice.processingFee > 0 && <SumRow label="Processing fee" value={money(invoice.processingFee)} />}
              <div className="flex items-baseline justify-between border-t border-line pt-2.5">
                <dt className="text-[13.5px] font-semibold text-ink">Total</dt>
                <dd className="stat text-[24px] text-ink">{money(invoice.total)}</dd>
              </div>
              <SumRow label="Paid to date" value={money(invoice.paid)} tone="good" />
              <div className="flex items-baseline justify-between border-t border-line pt-2.5">
                <dt className="text-[13.5px] font-semibold text-ink">Balance</dt>
                <dd className={cn('stat text-[24px]', invoice.balance > 0 ? 'text-orange' : 'text-good')}>{money(invoice.balance)}</dd>
              </div>
            </dl>
            {invoice.balance > 0 && (
              <div className="mt-4"><BalanceBar paid={invoice.paid} total={invoice.total} /></div>
            )}
          </Card>

          {/* Payment history */}
          <Card padded={false}>
            <div className="px-5 pb-2 pt-5">
              <CardHeader eyebrow="Ledger" title="Payment history" subtitle="Everything recorded against this invoice" />
            </div>
            <ol className="px-5 pb-5">
              {invoice.ledger.map((l, i) => {
                const k = LEDGER_ICON[l.kind] ?? LEDGER_ICON.adjustment
                return (
                  <li key={l.id} className={cn('flex items-start gap-3 py-3', i > 0 && 'border-t border-line-soft')}>
                    <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', k.cls)}>
                      <k.icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-ink">{l.label}</div>
                      <div className="flex flex-wrap items-center gap-x-2 text-[11.5px] text-ink-4">
                        <span>{fmtDate(l.date, 'long')}</span>
                        {l.method && <><span>·</span><span>{l.method}</span></>}
                        {l.reference && <><span>·</span><span className="tabular-nums">{l.reference}</span></>}
                      </div>
                    </div>
                    {l.amount !== null && (
                      <span className={cn('stat shrink-0 text-[15px]',
                        l.kind === 'refund' ? 'text-bad' : l.amount < 0 ? 'text-good' : 'text-ink')}>
                        {l.amount < 0 ? '-' : ''}{money(Math.abs(l.amount))}
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          </Card>
        </motion.div>

        <motion.div variants={stagger.item} className="space-y-4">
          {/* AutoPay + stored method */}
          <Card>
            <CardHeader eyebrow="Billing method" title="AutoPay & stored method" />
            <div className="mt-3.5">
              <Switch checked={invoice.autopay} onChange={(v) => {
                setAutopay(invoice.id, v)
                toast({ tone: v ? 'success' : 'info', title: v ? 'AutoPay enabled' : 'AutoPay disabled',
                  body: v ? 'Installments will be charged automatically on their due date.' : 'Installments will need to be collected manually.' })
              }} disabled={!invoice.method}
                label="AutoPay" description={invoice.method ? 'Charge each installment automatically on its due date.' : 'A payment method is required before AutoPay can run.'} />
            </div>
            <div className={cn('mt-4 flex items-center gap-3 rounded-xl border p-3.5',
              invoice.method ? 'border-line bg-[#FBFCFD]' : 'border-dashed border-[#FBDCC9] bg-orange-tint')}>
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                invoice.method ? 'bg-white text-ink-2 ring-1 ring-inset ring-line' : 'bg-white text-[#C24A12]')}>
                <CreditCard className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className={cn('text-[13px] font-semibold', invoice.method ? 'text-ink' : 'text-[#A93C0E]')}>
                  {methodLabel(invoice.method)}
                </div>
                <div className="text-[11.5px] text-ink-3">
                  {invoice.method ? `Expires ${invoice.method.expiry}` : 'The family has not added a card or bank account'}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" icon={CreditCard}
                onClick={() => toast({ tone: 'info', title: 'Update payment method', body: 'Families update their own method from the Parent experience, planned for the next phase.' })}>
                Update method
              </Button>
              <Button size="sm" variant="secondary" icon={Send}
                onClick={() => { requestPaymentMethod(invoice.id); toast({ tone: 'success', title: 'Payment method request sent', body: `${invoice.familyName} received a secure request.` }) }}>
                Request method
              </Button>
            </div>
          </Card>

          {/* Related records */}
          <Card>
            <CardHeader eyebrow="Connected records" title="Where this invoice came from" />
            <div className="mt-3 space-y-2">
              {player && (
                <RelatedRow to={`/players/${player.id}`} title={invoice.playerName}
                  sub={`Player · ${team ? team.name : 'Academy Program'}`}
                  avatar={<Avatar first={player.first} last={player.last} jersey={player.jersey} size="sm" />} />
              )}
              {team && (
                <RelatedRow to={`/teams/${team.id}`} title={team.name} sub={`Team · ${team.ageGroup} ${team.division}`}
                  avatar={<TeamCrest short={team.short} color={team.color} size="sm" />} />
              )}
              {registration && (
                <RelatedRow to={`/registrations/${registration.id}`} title={`${registration.playerName} registration`}
                  sub={`Registration · ${registration.stage}`}
                  avatar={<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F1ECFD] text-[#5B3FC4]"><FileText className="h-4 w-4" /></span>} />
              )}
              {!player && !team && !registration && (
                <p className="rounded-xl border border-dashed border-line p-4 text-center text-[12.5px] text-ink-3">
                  No linked player or registration on this invoice.
                </p>
              )}
            </div>
          </Card>

          {/* Family account */}
          <Card>
            <CardHeader eyebrow="Family account" title={invoice.familyName}
              action={family && family.credit > 0
                ? <Badge tone="good" dot={false}>{money(family.credit)} credit</Badge>
                : undefined} />
            <dl className="mt-3 divide-y divide-line-soft">
              <InfoRow label="Account credit" value={family && family.credit > 0 ? money(family.credit) : '—'} />
              <InfoRow label="Last reminder" value={invoice.lastReminder ? `${relativeDay(invoice.lastReminder)} · ${fmtDate(invoice.lastReminder, 'short')}` : 'None sent'} />
              <InfoRow label="Days overdue" value={late > 0 ? `${late} days` : '—'} />
              <InfoRow label="Partial payments" value={invoice.allowPartial ? 'Allowed' : 'Not allowed'} />
            </dl>
            {family && family.credit > 0 && invoice.balance > 0 && (
              <Button size="sm" variant="secondary" icon={Gift} className="mt-3 w-full" onClick={() => setModal('credit')}>
                Apply {money(Math.min(family.credit, invoice.balance))} credit
              </Button>
            )}
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader eyebrow="Notes" title="Account notes" />
            <p className="mt-3 whitespace-pre-line rounded-xl border border-line bg-[#FBFCFD] p-3.5 text-[13px] leading-relaxed text-ink-2">
              {invoice.notes || (invoice.balance === 0
                ? `Settled in full. No further action needed for the ${invoice.familyName.replace(' Family', '')} household this season.`
                : `${attentionReason(invoice)}. Review before the next installment runs.`)}
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Modals */}
      <RecordPaymentModal open={modal === 'record'} onClose={() => setModal(null)} invoice={invoice} />
      {modal === 'pay' && <PayNowModal open onClose={() => setModal(null)} invoice={invoice} />}
      <ReminderModal open={modal === 'remind'} onClose={() => setModal(null)} invoices={[invoice]}
        presetTemplate={invoice.status === 'failed' ? 'failed' : invoice.status === 'overdue' ? 'overdue' : 'due-soon'} />
      {modal === 'refund' && <RefundModal open onClose={() => setModal(null)} invoice={invoice} />}
      {modal === 'convert' && <ConvertPlanModal open onClose={() => setModal(null)} invoice={invoice} />}
      {modal === 'credit' && <ApplyCreditModal open onClose={() => setModal(null)} invoice={invoice} />}
    </motion.div>
  )
}

function SummaryTile({ label, value, sub, tone = 'neutral' }: { label: string; value: string; sub: string; tone?: 'neutral' | 'good' | 'warn' | 'bad' }) {
  const tones = { neutral: 'text-ink', good: 'text-good', warn: 'text-warn', bad: 'text-bad' }
  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
      <div className="eyebrow">{label}</div>
      <div className={cn('stat mt-2.5 text-[30px] leading-none', tones[tone])}>{value}</div>
      <div className="mt-2 text-[12.5px] text-ink-3">{sub}</div>
    </div>
  )
}

function SumRow({ label, value, tone }: { label: string; value: string; tone?: 'good' }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-3">{label}</dt>
      <dd className={cn('font-medium tabular-nums', tone === 'good' ? 'text-good' : 'text-ink')}>{value}</dd>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-[12.5px] text-ink-3">{label}</dt>
      <dd className="min-w-0 truncate text-right text-[13px] font-medium text-ink">{value}</dd>
    </div>
  )
}

function RelatedRow({ to, title, sub, avatar }: { to: string; title: string; sub: string; avatar: React.ReactNode }) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 transition-all hover:border-[#D9DDE5] hover:shadow-card">
      {avatar}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-ink transition-colors group-hover:text-royal">{title}</div>
        <div className="truncate text-[11.5px] text-ink-3">{sub}</div>
      </div>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
    </Link>
  )
}

function MenuItem({ icon: Icon, label, onClick, disabled, danger }: {
  icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; disabled?: boolean; danger?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors',
        disabled ? 'cursor-not-allowed text-ink-4' : danger ? 'text-bad hover:bg-bad-tint' : 'text-ink-2 hover:bg-[#F5F6F9] hover:text-ink')}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </button>
  )
}
