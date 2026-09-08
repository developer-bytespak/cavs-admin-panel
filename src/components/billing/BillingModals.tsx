import { useMemo, useState } from 'react'
import {
  Wallet, Receipt, CreditCard, AlertTriangle, RotateCcw, Send, CalendarClock, Gift, Check,
} from 'lucide-react'
import { useApp } from '../../store/AppStore'
import {
  PAYMENT_PLANS, PAYMENT_METHOD_KINDS, DISCOUNTS, REFUND_REASONS, REMINDER_TEMPLATES,
  BILLING_PROGRAMS, planById, methodLabel, familyByName,
} from '../../data/billing'
import { players, teamById, d, playerName } from '../../data/mock'
import type { Invoice } from '../../data/types'
import { cn, fmtDate, money } from '../../lib/utils'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Field, Input, Select, Textarea, Checkbox, Switch } from '../ui/Field'
import { Badge } from '../ui/Badge'
import { InstallmentTimeline } from './InstallmentTimeline'

const today = () => new Date().toISOString().slice(0, 10)

/* ================================================================== */
/* Record payment                                                      */
/* ================================================================== */
export function RecordPaymentModal({
  open, onClose, invoice,
}: { open: boolean; onClose: () => void; invoice?: Invoice }) {
  const { invoices, recordPayment, toast } = useApp()
  const [invoiceId, setInvoiceId] = useState(invoice?.id ?? '')
  const target = invoices.find((i) => i.id === (invoice?.id ?? invoiceId))
  const nextInstallment = target?.installments.find((i) => i.status !== 'paid' && i.status !== 'refunded')

  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('card')
  const [date, setDate] = useState(today())
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')

  const openInvoices = useMemo(() => invoices.filter((i) => i.balance > 0).slice(0, 80), [invoices])
  const value = Number(amount || nextInstallment?.amount || 0)
  const valid = !!target && value > 0

  const submit = () => {
    if (!target) return
    recordPayment({
      invoiceId: target.id, amount: value, date, reference,
      method: PAYMENT_METHOD_KINDS.find((m) => m.key === method)?.label ?? 'Card',
      note,
    })
    toast({ tone: 'success', title: 'Payment recorded successfully', body: `${money(value)} applied to ${target.id} — ${target.playerName}.` })
    setAmount(''); setReference(''); setNote('')
    onClose()
  }

  return (
    <Modal
      open={open} onClose={onClose} width="lg" eyebrow="Billing" title="Record payment"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon={Check} disabled={!valid} onClick={submit}>Record payment</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {!invoice && (
          <Field label="Family / player" required className="sm:col-span-2">
            <Select value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
              <option value="">Select an open invoice…</option>
              {openInvoices.map((i) => (
                <option key={i.id} value={i.id}>{i.playerName} — {i.id} · {money(i.balance)} due</option>
              ))}
            </Select>
          </Field>
        )}
        {target && (
          <div className="sm:col-span-2 rounded-xl border border-line bg-[#FBFCFD] p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[13px] font-semibold text-ink">{target.playerName}</div>
                <div className="text-[12px] text-ink-3">{target.id} · {target.program} · {target.planName}</div>
              </div>
              <div className="text-right">
                <div className="eyebrow">Balance</div>
                <div className="stat text-[22px] leading-none text-ink">{money(target.balance)}</div>
              </div>
            </div>
          </div>
        )}
        <Field label="Amount" required hint={nextInstallment ? `Next installment ${money(nextInstallment.amount)}` : undefined}>
          <Input type="number" min={1} value={amount} placeholder={String(nextInstallment?.amount ?? '')} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Payment method" required>
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            {PAYMENT_METHOD_KINDS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </Select>
        </Field>
        <Field label="Payment date" required><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Reference / check #" hint="Optional"><Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="1042" /></Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Paid by check at the Saturday game." />
        </Field>
      </div>
      {target && value > 0 && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-[#CDEBDF] bg-good-tint px-4 py-3">
          <span className="text-[12.5px] text-good">Remaining balance after this payment</span>
          <span className="stat text-[20px] leading-none text-good">{money(Math.max(0, target.balance - value))}</span>
        </div>
      )}
    </Modal>
  )
}

/* ================================================================== */
/* Pay now — admin-assisted                                            */
/* ================================================================== */
export function PayNowModal({ open, onClose, invoice }: { open: boolean; onClose: () => void; invoice: Invoice }) {
  const { recordPayment, toast } = useApp()
  const next = invoice.installments.find((i) => i.status !== 'paid' && i.status !== 'refunded')
  const [mode, setMode] = useState<'full' | 'installment' | 'custom'>(next ? 'installment' : 'full')
  const [custom, setCustom] = useState('')
  const [useStored, setUseStored] = useState(!!invoice.method)

  const amount = mode === 'full' ? invoice.balance : mode === 'installment' ? (next?.amount ?? invoice.balance) : Number(custom || 0)
  const fee = 0
  const valid = amount > 0 && amount <= invoice.balance

  const options = [
    { key: 'full' as const, label: 'Full balance', sub: money(invoice.balance) },
    ...(next ? [{ key: 'installment' as const, label: `Installment ${next.number}`, sub: `${money(next.amount)} · due ${fmtDate(next.dueDate, 'short')}` }] : []),
    { key: 'custom' as const, label: 'Custom amount', sub: 'Enter any amount up to the balance' },
  ]

  return (
    <Modal
      open={open} onClose={onClose} width="md" eyebrow={`${invoice.id} · ${invoice.playerName}`} title="Pay now"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="accent" icon={Wallet} disabled={!valid} onClick={() => {
          recordPayment({ invoiceId: invoice.id, amount, date: today(), method: useStored ? methodLabel(invoice.method) : 'Offline Card', reference: '' })
          toast({ tone: 'success', title: 'Payment recorded successfully', body: `${money(amount)} charged for ${invoice.playerName}.` })
          onClose()
        }}>Confirm {money(amount)}</Button></>}
    >
      <div className="space-y-4">
        <div>
          <div className="eyebrow mb-2">Amount</div>
          <div className="space-y-2">
            {options.map((o) => (
              <button key={o.key} onClick={() => setMode(o.key)}
                className={cn('flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-150',
                  mode === o.key ? 'border-orange/40 bg-orange-tint' : 'border-line hover:border-[#D9DDE5] hover:bg-[#FAFBFC]')}>
                <span className={cn('h-4 w-4 shrink-0 rounded-full border-2 transition-colors',
                  mode === o.key ? 'border-orange bg-orange' : 'border-[#CDD2DB]')} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium text-ink">{o.label}</span>
                  <span className="block text-[12px] text-ink-3">{o.sub}</span>
                </span>
              </button>
            ))}
          </div>
          {mode === 'custom' && (
            <div className="mt-2.5">
              <Input type="number" min={1} max={invoice.balance} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="250" autoFocus />
              {Number(custom) > invoice.balance && (
                <p className="mt-1.5 text-[12px] text-bad">Cannot exceed the {money(invoice.balance)} balance.</p>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="eyebrow mb-2">Payment method</div>
          <div className="space-y-2">
            <button onClick={() => setUseStored(true)} disabled={!invoice.method}
              className={cn('flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all',
                !invoice.method && 'cursor-not-allowed opacity-50',
                useStored && invoice.method ? 'border-royal/35 bg-royal-tint' : 'border-line hover:border-[#D9DDE5]')}>
              <CreditCard className="h-4 w-4 shrink-0 text-ink-3" />
              <span className="min-w-0 flex-1 text-[13.5px] font-medium text-ink">{methodLabel(invoice.method)}</span>
              {invoice.method && <Badge tone="neutral" dot={false} size="xs">Stored</Badge>}
            </button>
            <button onClick={() => setUseStored(false)}
              className={cn('flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all',
                !useStored ? 'border-royal/35 bg-royal-tint' : 'border-line hover:border-[#D9DDE5]')}>
              <Receipt className="h-4 w-4 shrink-0 text-ink-3" />
              <span className="min-w-0 flex-1 text-[13.5px] font-medium text-ink">Take payment another way</span>
              <span className="text-[11.5px] text-ink-4">Cash, check or card at the gym</span>
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-[#FBFCFD] p-4">
          <div className="eyebrow mb-2.5">Order summary</div>
          <dl className="space-y-1.5 text-[13px]">
            <Line label="Invoice balance" value={money(invoice.balance)} />
            <Line label="Paying now" value={money(amount)} />
            {fee > 0 && <Line label="Processing fee" value={money(fee)} />}
            <div className="mt-2 flex items-baseline justify-between border-t border-line pt-2">
              <dt className="text-[13px] font-semibold text-ink">Remaining after payment</dt>
              <dd className="stat text-[19px] text-ink">{money(Math.max(0, invoice.balance - amount))}</dd>
            </div>
          </dl>
          <p className="mt-3 text-[11.5px] text-ink-4">
            No payment provider is connected in this build — confirming records the payment against the invoice.
          </p>
        </div>
      </div>
    </Modal>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-3">{label}</dt>
      <dd className="font-medium tabular-nums text-ink">{value}</dd>
    </div>
  )
}

/* ================================================================== */
/* Create invoice                                                      */
/* ================================================================== */
export function CreateInvoiceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createInvoice, toast } = useApp()
  const [playerId, setPlayerId] = useState('')
  const [program, setProgram] = useState(BILLING_PROGRAMS[0].label)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState(String(BILLING_PROGRAMS[0].fee))
  const [dueDate, setDueDate] = useState(d(14))
  const [planId, setPlanId] = useState('plan-full')
  const [discountCode, setDiscountCode] = useState('')
  const [creditAmount, setCreditAmount] = useState('')
  const [allowPartial, setAllowPartial] = useState(true)
  const [requireAutopay, setRequireAutopay] = useState(false)
  const [addFee, setAddFee] = useState(false)
  const [notes, setNotes] = useState('')

  const player = players.find((p) => p.id === playerId)
  const plan = planById(planId)
  const subtotal = Number(amount || 0)
  const disc = DISCOUNTS.find((x) => x.code === discountCode)
  const discountAmount = disc ? (disc.kind === 'percent' ? Math.round((subtotal * disc.value) / 100) : disc.value) : 0
  const credit = Number(creditAmount || 0)
  const fee = addFee ? Math.round(((subtotal - discountAmount) * 2.9) / 100) : 0
  const total = Math.max(0, subtotal - discountAmount - credit + fee)
  const perInstallment = Math.round(total / plan.installmentCount)
  const valid = !!player && total > 0

  const submit = () => {
    if (!player) return
    const start = new Date(`${dueDate}T12:00`)
    const installments = Array.from({ length: plan.installmentCount }, (_, k) => {
      const due = new Date(start); due.setMonth(due.getMonth() + k)
      return {
        id: `i${k + 1}`, number: k + 1,
        amount: k === plan.installmentCount - 1 ? total - perInstallment * (plan.installmentCount - 1) : perInstallment,
        dueDate: due.toISOString().slice(0, 10),
        status: k === 0 ? ('due' as const) : ('upcoming' as const),
        paidDate: null, method: null, failureReason: null,
      }
    })
    const inv = createInvoice({
      playerId: player.id,
      playerName: playerName(player),
      familyName: `${player.guardian.name.split(' ')[1] ?? player.last} Family`,
      teamId: player.teamId,
      program,
      description: description || `${program} — ${player.teamId ? teamById(player.teamId)!.name : 'Academy Program'}`,
      subtotal, discountLabel: disc?.label ?? null, discountAmount, creditApplied: credit,
      processingFee: fee, planId, planName: plan.name, installments,
      autopay: requireAutopay, allowPartial, notes,
    })
    toast({ tone: 'success', title: 'Invoice created', body: `${inv.id} for ${inv.playerName} — ${money(total)}.` })
    onClose()
  }

  return (
    <Modal
      open={open} onClose={onClose} width="xl" eyebrow="Billing" title="Create invoice"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon={Receipt} disabled={!valid} onClick={submit}>Create invoice</Button></>}
    >
      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Player / family" required className="sm:col-span-2">
            <Select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
              <option value="">Select a player…</option>
              {players.filter((p) => p.status === 'active').slice(0, 130).map((p) => (
                <option key={p.id} value={p.id}>
                  {playerName(p)} — {p.teamId ? teamById(p.teamId)!.name : 'Academy Program'}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Program / charge type" required>
            <Select value={program} onChange={(e) => {
              setProgram(e.target.value)
              const found = BILLING_PROGRAMS.find((b) => b.label === e.target.value)
              if (found) setAmount(String(found.fee))
            }}>
              {BILLING_PROGRAMS.map((p) => <option key={p.key}>{p.label}</option>)}
              <option>Tournament Fee</option>
              <option>Uniform &amp; Gear</option>
              <option>Late Fee</option>
            </Select>
          </Field>
          <Field label="Amount" required><Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="Description" className="sm:col-span-2">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="2025–26 Elite Travel season — 14U Elite" />
          </Field>
          <Field label="First due date" required><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
          <Field label="Payment plan">
            <Select value={planId} onChange={(e) => setPlanId(e.target.value)}>
              {PAYMENT_PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Discount"><Select value={discountCode} onChange={(e) => setDiscountCode(e.target.value)}>
            <option value="">No discount</option>
            {DISCOUNTS.map((x) => <option key={x.code} value={x.code}>{x.label} ({x.kind === 'percent' ? `${x.value}%` : `-$${x.value}`})</option>)}
          </Select></Field>
          <Field label="Apply account credit" hint="Optional">
            <Input type="number" min={0} value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="0" />
          </Field>
          <div className="sm:col-span-2 space-y-3 rounded-xl border border-line bg-[#FBFCFD] p-3.5">
            <Checkbox checked={allowPartial} onChange={setAllowPartial} label="Allow partial payments" />
            <Checkbox checked={requireAutopay} onChange={setRequireAutopay} label="Require AutoPay for this plan" />
            <Checkbox checked={addFee} onChange={setAddFee} label="Add 2.9% processing fee" />
          </div>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Sibling already enrolled in the 12U program." />
          </Field>
        </div>

        {/* Live preview */}
        <div className="rounded-2xl border border-line bg-[#FBFCFD] p-4">
          <div className="eyebrow mb-3">Invoice preview</div>
          {!player ? (
            <p className="rounded-xl border border-dashed border-line p-5 text-center text-[12.5px] text-ink-3">
              Choose a player to preview the invoice.
            </p>
          ) : (
            <>
              <div className="text-[14px] font-semibold text-ink">{playerName(player)}</div>
              <div className="text-[12px] text-ink-3">{player.teamId ? teamById(player.teamId)!.name : 'Academy Program'} · {program}</div>
              <dl className="mt-3.5 space-y-1.5 border-t border-line pt-3 text-[13px]">
                <Line label="Subtotal" value={money(subtotal)} />
                {discountAmount > 0 && <Line label={disc!.label} value={`-${money(discountAmount)}`} />}
                {credit > 0 && <Line label="Account credit" value={`-${money(credit)}`} />}
                {fee > 0 && <Line label="Processing fee" value={money(fee)} />}
                <div className="flex items-baseline justify-between border-t border-line pt-2">
                  <dt className="text-[13px] font-semibold text-ink">Total</dt>
                  <dd className="stat text-[24px] text-ink">{money(total)}</dd>
                </div>
              </dl>
              <div className="mt-4 border-t border-line pt-3">
                <div className="eyebrow mb-2">{plan.name}</div>
                {plan.installmentCount === 1 ? (
                  <p className="text-[12.5px] text-ink-2">{money(total)} due {fmtDate(dueDate, 'medium')}</p>
                ) : (
                  <ul className="space-y-1.5 text-[12.5px]">
                    {Array.from({ length: Math.min(plan.installmentCount, 4) }, (_, k) => {
                      const due = new Date(`${dueDate}T12:00`); due.setMonth(due.getMonth() + k)
                      return (
                        <li key={k} className="flex items-baseline justify-between">
                          <span className="text-ink-3">{k === 0 ? 'Today' : `Installment ${k + 1}`}</span>
                          <span className="font-medium tabular-nums text-ink">
                            {money(k === plan.installmentCount - 1 ? total - perInstallment * (plan.installmentCount - 1) : perInstallment)}
                            <span className="ml-1.5 text-ink-4">{fmtDate(due.toISOString().slice(0, 10), 'short')}</span>
                          </span>
                        </li>
                      )
                    })}
                    {plan.installmentCount > 4 && <li className="text-[11.5px] text-ink-4">+{plan.installmentCount - 4} more installments</li>}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

/* ================================================================== */
/* Reminders                                                           */
/* ================================================================== */
export function ReminderModal({
  open, onClose, invoices: targets, presetTemplate,
}: { open: boolean; onClose: () => void; invoices: Invoice[]; presetTemplate?: string }) {
  const { sendReminder, toast } = useApp()
  const [templateKey, setTemplateKey] = useState(presetTemplate ?? 'overdue')
  const [schedule, setSchedule] = useState(false)
  const [when, setWhen] = useState(d(1))
  const template = REMINDER_TEMPLATES.find((t) => t.key === templateKey)!
  const sample = targets[0]

  const preview = template.body
    .replace('{amount}', money(sample?.balance ?? 400))
    .replace('{player}', sample?.playerName ?? 'your player')
    .replace('{date}', fmtDate(sample?.nextDue ?? d(2), 'medium'))
    .replace('{n}', String(sample?.installments.find((i) => i.status !== 'paid')?.number ?? 3))
    .replace('{remaining}', money(Math.max(0, (sample?.balance ?? 400) - (sample?.installments.find((i) => i.status !== 'paid')?.amount ?? 0))))

  return (
    <Modal
      open={open} onClose={onClose} width="lg" eyebrow="Collections" title="Send payment reminder"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="secondary" icon={CalendarClock} onClick={() => {
          sendReminder(targets.map((t) => t.id), template.label)
          toast({ tone: 'success', title: 'Reminder scheduled', body: `${targets.length} ${targets.length === 1 ? 'family' : 'families'} will be contacted on ${fmtDate(when, 'medium')}.` })
          onClose()
        }} disabled={!schedule || !targets.length}>Schedule</Button>
        <Button variant="accent" icon={Send} disabled={!targets.length} onClick={() => {
          sendReminder(targets.map((t) => t.id), template.label)
          toast({ tone: 'success', title: 'Reminders sent', body: `${targets.length} ${targets.length === 1 ? 'family' : 'families'} contacted — ${template.label}.` })
          onClose()
        }}>Send now</Button>
      </>}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-line bg-[#FBFCFD] p-3.5">
          <div className="eyebrow mb-2">Audience</div>
          {targets.length === 0 ? (
            <p className="text-[13px] text-ink-3">No recipients selected.</p>
          ) : targets.length === 1 ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[13px] font-semibold text-ink">{targets[0].playerName}</div>
                <div className="text-[12px] text-ink-3">{targets[0].familyName} · {targets[0].id}</div>
              </div>
              <div className="text-right">
                <div className="stat text-[18px] leading-none text-ink">{money(targets[0].balance)}</div>
                <div className="text-[11px] text-ink-4">balance</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-ink-2">
                <strong className="font-semibold text-ink tabular-nums">{targets.length} families</strong> selected
              </span>
              <span className="stat text-[18px] text-ink">{money(targets.reduce((s, t) => s + t.balance, 0))}</span>
            </div>
          )}
          {targets[0]?.lastReminder && (
            <p className="mt-2 border-t border-line pt-2 text-[11.5px] text-ink-4">
              Last reminder sent {fmtDate(targets[0].lastReminder, 'medium')}
            </p>
          )}
        </div>

        <Field label="Template" required>
          <Select value={templateKey} onChange={(e) => setTemplateKey(e.target.value)}>
            {REMINDER_TEMPLATES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </Select>
        </Field>

        <div>
          <div className="eyebrow mb-2">Message preview</div>
          <div className="rounded-xl border border-line bg-white p-4">
            <div className="text-[13.5px] font-semibold text-ink">{template.subject}</div>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{preview}</p>
            <p className="mt-3 border-t border-line-soft pt-2.5 text-[11.5px] text-ink-4">
              Sent from Cavs Youth Basketball Academy · in-app and email
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-[#FBFCFD] p-3.5">
          <Switch checked={schedule} onChange={setSchedule} label="Schedule for later"
            description="Otherwise the reminder goes out immediately." />
          {schedule && (
            <div className="mt-3 flex items-center gap-3 border-t border-line-soft pt-3">
              <span className="text-[12.5px] text-ink-3">Send on</span>
              <Input type="date" value={when} onChange={(e) => setWhen(e.target.value)} className="h-8 w-auto text-[13px]" />
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

/* ================================================================== */
/* Refund                                                              */
/* ================================================================== */
export function RefundModal({ open, onClose, invoice }: { open: boolean; onClose: () => void; invoice: Invoice }) {
  const { refundPayment, toast } = useApp()
  const [amount, setAmount] = useState(String(invoice.installments.find((i) => i.status === 'paid')?.amount ?? invoice.paid))
  const [reason, setReason] = useState(REFUND_REASONS[0])
  const [note, setNote] = useState('')
  const value = Number(amount || 0)
  const valid = value > 0 && value <= invoice.paid

  return (
    <Modal
      open={open} onClose={onClose} width="md" eyebrow={`${invoice.id} · ${invoice.playerName}`} title="Refund payment"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" icon={RotateCcw} disabled={!valid} onClick={() => {
          refundPayment(invoice.id, value, reason)
          toast({ tone: 'success', title: 'Refund issued', body: `${money(value)} refunded to the ${invoice.familyName.replace(' Family', '')} family.` })
          onClose()
        }}>Confirm refund</Button></>}
    >
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#F5D5D7] bg-bad-tint p-3.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bad" />
        <p className="text-[12.5px] leading-relaxed text-bad">
          Refunds cannot be reversed from this screen. The family will see the change on their account immediately.
        </p>
      </div>
      <div className="space-y-4">
        <div className="rounded-xl border border-line bg-[#FBFCFD] p-3.5">
          <dl className="space-y-1.5 text-[13px]">
            <Line label="Invoice total" value={money(invoice.total)} />
            <Line label="Paid to date" value={money(invoice.paid)} />
            <Line label="Current balance" value={money(invoice.balance)} />
          </dl>
        </div>
        <Field label="Refund amount" required hint={`Maximum ${money(invoice.paid)}`}>
          <Input type="number" min={1} max={invoice.paid} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Reason" required>
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            {REFUND_REASONS.map((r) => <option key={r}>{r}</option>)}
          </Select>
        </Field>
        <Field label="Internal note" hint="Optional">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Family relocated mid-season." />
        </Field>
      </div>
    </Modal>
  )
}

/* ================================================================== */
/* Payment plan — create & convert                                     */
/* ================================================================== */
export function ConvertPlanModal({ open, onClose, invoice }: { open: boolean; onClose: () => void; invoice: Invoice }) {
  const { convertToPlan, toast } = useApp()
  const [planId, setPlanId] = useState('plan-3')
  const [firstDue, setFirstDue] = useState(d(7))
  const plan = planById(planId)
  const each = Math.round(invoice.balance / plan.installmentCount)

  const preview = Array.from({ length: plan.installmentCount }, (_, k) => {
    const due = new Date(`${firstDue}T12:00`); due.setMonth(due.getMonth() + k)
    return {
      id: `p${k}`, number: k + 1,
      amount: k === plan.installmentCount - 1 ? invoice.balance - each * (plan.installmentCount - 1) : each,
      dueDate: due.toISOString().slice(0, 10),
      status: k === 0 ? ('due' as const) : ('upcoming' as const),
      paidDate: null, method: null, failureReason: null,
    }
  })

  return (
    <Modal
      open={open} onClose={onClose} width="lg" eyebrow={`${invoice.id} · ${invoice.playerName}`} title="Convert to payment plan"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon={CalendarClock} onClick={() => {
          convertToPlan(invoice.id, planId, firstDue)
          toast({ tone: 'success', title: 'Payment plan created', body: `${invoice.playerName}'s ${money(invoice.balance)} balance split across ${plan.installmentCount} installments.` })
          onClose()
        }}>Confirm plan</Button></>}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-[#FBFCFD] p-3.5">
          <span className="text-[12.5px] text-ink-3">Current balance to re-plan</span>
          <span className="stat text-[24px] leading-none text-ink">{money(invoice.balance)}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Available plans" required>
            <Select value={planId} onChange={(e) => setPlanId(e.target.value)}>
              {PAYMENT_PLANS.filter((p) => p.kind !== 'full').map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {p.installmentCount} payments</option>
              ))}
            </Select>
          </Field>
          <Field label="First installment due" required><Input type="date" value={firstDue} onChange={(e) => setFirstDue(e.target.value)} /></Field>
        </div>
        <p className="text-[12.5px] leading-relaxed text-ink-3">{plan.notes}</p>
        <div>
          <div className="eyebrow mb-3">New installment schedule</div>
          <div className="rounded-xl border border-line bg-white p-4">
            <InstallmentTimeline installments={preview} />
          </div>
        </div>
      </div>
    </Modal>
  )
}

/** Standalone plan builder for the Payment Plans tab. */
export function CreatePlanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useApp()
  const [name, setName] = useState('')
  const [total, setTotal] = useState('1200')
  const [initial, setInitial] = useState('400')
  const [count, setCount] = useState('3')
  const [firstDue, setFirstDue] = useState(d(0))
  const [requireInitial, setRequireInitial] = useState(true)
  const [requireAutopay, setRequireAutopay] = useState(true)
  const [feePct, setFeePct] = useState('0')
  const [isPrivate, setIsPrivate] = useState(false)
  const [notes, setNotes] = useState('')

  const totalNum = Number(total || 0)
  const initialNum = Number(initial || 0)
  const n = Math.max(1, Number(count || 1))
  const remaining = Math.max(0, totalNum - (requireInitial ? initialNum : 0))
  const each = n > 1 ? Math.round(remaining / (requireInitial ? n - 1 : n)) : remaining

  const schedule = Array.from({ length: n }, (_, k) => {
    const due = new Date(`${firstDue}T12:00`); due.setMonth(due.getMonth() + k)
    return {
      id: `s${k}`, number: k + 1,
      amount: requireInitial && k === 0 ? initialNum : each,
      dueDate: due.toISOString().slice(0, 10),
      status: k === 0 ? ('due' as const) : ('upcoming' as const),
      paidDate: null, method: null, failureReason: null,
    }
  })

  return (
    <Modal
      open={open} onClose={onClose} width="xl" eyebrow="Billing" title="Create payment plan"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon={CalendarClock} disabled={!name.trim() || totalNum <= 0} onClick={() => {
          toast({ tone: 'success', title: 'Payment plan created', body: `"${name}" — ${n} payments totalling ${money(totalNum)}.` })
          onClose()
        }}>Create plan</Button></>}
    >
      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Plan name" required className="sm:col-span-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Elite Travel — 3 Installments" />
          </Field>
          <Field label="Total amount" required><Input type="number" value={total} onChange={(e) => setTotal(e.target.value)} /></Field>
          <Field label="Initial payment" hint="Charged today"><Input type="number" value={initial} onChange={(e) => setInitial(e.target.value)} disabled={!requireInitial} /></Field>
          <Field label="Number of installments" required><Input type="number" min={1} max={12} value={count} onChange={(e) => setCount(e.target.value)} /></Field>
          <Field label="Installment amount" hint="Calculated"><Input readOnly value={money(each)} className="bg-[#FAFBFC] text-ink-3" /></Field>
          <Field label="First installment date" required className="sm:col-span-2"><Input type="date" value={firstDue} onChange={(e) => setFirstDue(e.target.value)} /></Field>
          <Field label="Processing fee %" ><Input type="number" min={0} max={10} step={0.1} value={feePct} onChange={(e) => setFeePct(e.target.value)} /></Field>
          <div className="sm:col-span-2 space-y-3 rounded-xl border border-line bg-[#FBFCFD] p-3.5">
            <Checkbox checked={requireInitial} onChange={setRequireInitial} label="Require an initial payment at registration" />
            <Checkbox checked={requireAutopay} onChange={setRequireAutopay} label="Require AutoPay for remaining installments" />
            <Checkbox checked={isPrivate} onChange={setIsPrivate} label="Private plan — offered to selected families only" />
          </div>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Offered to families who request a hardship arrangement." />
          </Field>
        </div>

        <div className="rounded-2xl border border-line bg-[#FBFCFD] p-4">
          <div className="eyebrow mb-3">Live preview</div>
          <div className="rounded-xl border border-line bg-white p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] uppercase tracking-[0.07em] text-ink-4">Registration fee</span>
              <span className="stat text-[24px] text-ink">{money(totalNum)}</span>
            </div>
            <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-[13px]">
              <Line label="Today" value={money(requireInitial ? initialNum : each)} />
              {n > 1 && <Line label="Next" value={`${money(each)} · ${fmtDate(schedule[1]?.dueDate ?? firstDue, 'short')}`} />}
              {n > 1 && <Line label="Final" value={`${money(each)} · ${fmtDate(schedule[n - 1].dueDate, 'short')}`} />}
              {Number(feePct) > 0 && <Line label="Processing fee" value={`${feePct}% per payment`} />}
            </dl>
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
              {requireInitial && <Badge tone="blue" dot={false} size="xs">Initial payment required</Badge>}
              {requireAutopay && <Badge tone="good" dot={false} size="xs">AutoPay required</Badge>}
              {isPrivate && <Badge tone="neutral" dot={false} size="xs">Private plan</Badge>}
            </div>
          </div>
          <div className="mt-4">
            <div className="eyebrow mb-2.5">Schedule</div>
            <InstallmentTimeline installments={schedule.slice(0, 4)} orientation="vertical" />
            {n > 4 && <p className="mt-1 text-[11.5px] text-ink-4">+{n - 4} more installments</p>}
          </div>
        </div>
      </div>
    </Modal>
  )
}

/* ================================================================== */
/* Apply credit                                                        */
/* ================================================================== */
export function ApplyCreditModal({ open, onClose, invoice }: { open: boolean; onClose: () => void; invoice: Invoice }) {
  const { applyCredit, toast, families } = useApp()
  const family = families.find((f) => f.familyName === invoice.familyName) ?? familyByName(invoice.familyName)
  const available = family?.credit ?? 0
  const [amount, setAmount] = useState(String(Math.min(available, invoice.balance)))
  const value = Number(amount || 0)
  const valid = value > 0 && value <= available && value <= invoice.balance

  return (
    <Modal
      open={open} onClose={onClose} width="sm" eyebrow={`${invoice.id} · ${invoice.familyName}`} title="Apply account credit"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon={Gift} disabled={!valid} onClick={() => {
          applyCredit(invoice.id, value)
          toast({ tone: 'success', title: 'Credit applied', body: `${money(value)} credit applied to ${invoice.id}.` })
          onClose()
        }}>Apply credit</Button></>}
    >
      {available === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-5 text-center text-[13px] text-ink-3">
          The {invoice.familyName.replace(' Family', '')} family has no account credit available.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-[#CDEBDF] bg-good-tint p-3.5">
            <span className="text-[12.5px] text-good">Account credit available</span>
            <span className="stat text-[22px] leading-none text-good">{money(available)}</span>
          </div>
          <Field label="Amount to apply" required hint={`Balance ${money(invoice.balance)}`}>
            <Input type="number" min={1} max={Math.min(available, invoice.balance)} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <dl className="space-y-1.5 rounded-xl border border-line bg-[#FBFCFD] p-3.5 text-[13px]">
            <Line label="Invoice balance" value={money(invoice.balance)} />
            <Line label="Credit applied" value={`-${money(value)}`} />
            <div className="flex items-baseline justify-between border-t border-line pt-2">
              <dt className="font-semibold text-ink">Remaining</dt>
              <dd className="stat text-[19px] text-ink">{money(Math.max(0, invoice.balance - value))}</dd>
            </div>
          </dl>
        </div>
      )}
    </Modal>
  )
}
