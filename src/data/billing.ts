import type {
  Invoice, Installment, LedgerEntry, PaymentPlan, StoredMethod, InvoiceStatus, FamilyAccount,
} from './types'
import { players, teams, teamById, d, TODAY_ISO, playerName, FEATURED_PLAYER_ID, registrations, PROGRAMS } from './mock'

/* ------------------------------------------------------------------ */
/* Deterministic generator — the ledger is identical on every load      */
/* ------------------------------------------------------------------ */
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(90872026)
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]
const between = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1))

/* ------------------------------------------------------------------ */
/* Programs, plans and payment methods                                 */
/* ------------------------------------------------------------------ */
const DIVISION_FOR: Record<string, string[]> = {
  elite: ['Elite'], select: ['Select'], dev: ['Development'], skills: [],
}
/** The one fee schedule, shared with registrations and player profiles. */
export const BILLING_PROGRAMS = PROGRAMS.map((p) => ({
  key: p.id, label: p.label, fee: p.fee, divisions: DIVISION_FOR[p.id] ?? [],
}))

export const PAYMENT_PLANS: PaymentPlan[] = [
  { id: 'plan-full', name: 'Pay in Full', kind: 'full', installmentCount: 1, requiresInitial: true, requiresAutopay: false, processingFeePct: 0, isPrivate: false, notes: 'Single payment at registration. No processing fee.' },
  { id: 'plan-3', name: '3 Installments', kind: 'installments', installmentCount: 3, requiresInitial: true, requiresAutopay: true, processingFeePct: 0, isPrivate: false, notes: 'One third at registration, then two monthly installments.' },
  { id: 'plan-6', name: 'Monthly Plan', kind: 'monthly', installmentCount: 6, requiresInitial: false, requiresAutopay: true, processingFeePct: 2.9, isPrivate: false, notes: 'Six monthly payments. AutoPay required.' },
  { id: 'plan-custom', name: 'Custom Plan', kind: 'custom', installmentCount: 4, requiresInitial: false, requiresAutopay: false, processingFeePct: 0, isPrivate: true, notes: 'Hardship arrangement agreed with the family directly.' },
]
export const planById = (id: string) => PAYMENT_PLANS.find((p) => p.id === id) ?? PAYMENT_PLANS[0]

export const DISCOUNTS = [
  { code: 'SIBLING10', label: 'Sibling Discount', kind: 'percent' as const, value: 10 },
  { code: 'SCHOLARSHIP', label: 'Scholarship', kind: 'amount' as const, value: 250 },
  { code: 'CAVS2026', label: 'Promo — CAVS2026', kind: 'percent' as const, value: 15 },
  { code: 'EARLYBIRD', label: 'Early Registration', kind: 'amount' as const, value: 75 },
]

export const PAYMENT_METHOD_KINDS = [
  { key: 'card', label: 'Credit / Debit' },
  { key: 'ach', label: 'ACH / Bank Transfer' },
  { key: 'cash', label: 'Cash' },
  { key: 'check', label: 'Check' },
  { key: 'offline', label: 'Offline Card' },
  { key: 'credit', label: 'Account Credit' },
]

export const FAILURE_REASONS = [
  'Card declined', 'Insufficient funds', 'Card expired', 'Bank account closed', 'Payment method removed',
]
export const REFUND_REASONS = [
  'Withdrew from the season', 'Duplicate payment', 'Billed in error', 'Moved to a different program', 'Family hardship',
]

const CARD_BRANDS: StoredMethod['brand'][] = ['Visa', 'Mastercard', 'Amex', 'Bank']
const makeMethod = (): StoredMethod => {
  const brand = pick(CARD_BRANDS)
  return { brand, last4: String(between(1000, 9999)), expiry: `${String(between(1, 12)).padStart(2, '0')}/${between(27, 30)}` }
}
export const methodLabel = (m: StoredMethod | null) =>
  m ? `${m.brand} •••• ${m.last4}` : 'No payment method'

/* ------------------------------------------------------------------ */
/* Targets — the headline figures the ledger is balanced to            */
/* ------------------------------------------------------------------ */
export const TARGETS = {
  collected: 42860,
  overdue: 2180,
  failed: 1860,
  dueSoon: 2200,   // billed, not yet late
  upcoming: 8450,  // future installments, not yet billed
}
/** Outstanding = everything already billed and still unpaid. */
export const TARGET_OUTSTANDING = TARGETS.overdue + TARGETS.failed + TARGETS.dueSoon // 6,240

/* ------------------------------------------------------------------ */
/* Invoice construction                                                */
/* ------------------------------------------------------------------ */
let invoiceNo = 1100 // starts past the hand-authored INV-1048
const nextId = () => `INV-${++invoiceNo}`

function programFor(teamId: string | null) {
  if (!teamId) return BILLING_PROGRAMS[3]
  const div = teamById(teamId)?.division
  return BILLING_PROGRAMS.find((p) => p.divisions.includes(div ?? '')) ?? BILLING_PROGRAMS[3]
}

function buildInstallments(total: number, planId: string, anchorOffset: number): Installment[] {
  const plan = planById(planId)
  const n = plan.installmentCount
  const each = Math.round(total / n)
  return Array.from({ length: n }, (_, i) => ({
    id: `i${i + 1}`,
    number: i + 1,
    amount: i === n - 1 ? total - each * (n - 1) : each,
    dueDate: d(anchorOffset + i * 30),
    status: 'upcoming' as const,
    paidDate: null,
    method: null,
    failureReason: null,
  }))
}

function deriveStatus(inv: Invoice): InvoiceStatus {
  if (inv.ledger.some((l) => l.kind === 'refund')) return 'refunded'
  if (inv.balance <= 0) return 'paid'
  if (inv.installments.some((i) => i.status === 'failed')) return 'failed'
  if (inv.installments.some((i) => i.status === 'overdue')) return 'overdue'
  if (inv.paid > 0) return 'partial'
  return 'upcoming'
}

/** Recomputes totals, balance, next due and status from the installments. */
export function reconcile(inv: Invoice): Invoice {
  const total = Math.max(0, inv.subtotal - inv.discountAmount - inv.creditApplied + inv.processingFee)
  const paid = inv.installments.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const refunded = inv.ledger.filter((l) => l.kind === 'refund').reduce((s, l) => s + (l.amount ?? 0), 0)
  const next = inv.installments.find((i) => i.status !== 'paid' && i.status !== 'refunded')
  const draft: Invoice = {
    ...inv,
    total,
    paid: Math.max(0, paid - refunded),
    balance: Math.max(0, total - Math.max(0, paid - refunded)),
    nextDue: next?.dueDate ?? null,
  }
  return { ...draft, status: deriveStatus(draft) }
}

/** Marks each installment late/failed/paid relative to today. */
function ageInstallments(list: Installment[], paidCount: number, failedIdx: number | null): Installment[] {
  return list.map((inst, i) => {
    if (i < paidCount) {
      return { ...inst, status: 'paid' as const, paidDate: inst.dueDate, method: 'Visa •••• 4821', failureReason: null }
    }
    if (failedIdx === i) {
      return { ...inst, status: 'failed' as const, failureReason: pick(FAILURE_REASONS) }
    }
    if (inst.dueDate < TODAY_ISO) return { ...inst, status: 'overdue' as const }
    if (inst.dueDate <= d(14)) return { ...inst, status: 'due' as const }
    return { ...inst, status: 'upcoming' as const }
  })
}

/* ------------------------------------------------------------------ */
/* The ledger                                                          */
/* ------------------------------------------------------------------ */
export const invoices: Invoice[] = []

/* --- Jordan Miles: the invoice the whole demo walks through --------- */
const jordan = players.find((p) => p.id === FEATURED_PLAYER_ID)!
const jordanInstallments: Installment[] = [
  { id: 'i1', number: 1, amount: 400, dueDate: d(-90), status: 'paid', paidDate: d(-90), method: 'Visa •••• 4821', failureReason: null },
  { id: 'i2', number: 2, amount: 400, dueDate: d(-60), status: 'paid', paidDate: d(-60), method: 'Visa •••• 4821', failureReason: null },
  { id: 'i3', number: 3, amount: 400, dueDate: d(2), status: 'due', paidDate: null, method: null, failureReason: null },
]
const JORDAN_INVOICE_ID = 'INV-1048'
export const FEATURED_INVOICE_ID = JORDAN_INVOICE_ID

invoices.push(reconcile({
  id: JORDAN_INVOICE_ID,
  playerId: jordan.id,
  playerName: playerName(jordan),
  familyName: 'Miles Family',
  teamId: 't-14u',
  program: 'Elite Travel',
  description: '2025–26 Elite Travel season — 14U Elite',
  issued: d(-96),
  subtotal: 1200,
  discountLabel: null,
  discountAmount: 0,
  creditApplied: 0,
  processingFee: 0,
  total: 1200,
  paid: 800,
  balance: 400,
  status: 'partial',
  planId: 'plan-3',
  planName: '3 Installments',
  installments: jordanInstallments,
  ledger: [
    { id: 'l1', date: d(-60), label: 'Installment 2 of 3 received', amount: 400, kind: 'payment', method: 'Visa •••• 4821', reference: 'ch_8841QK' },
    { id: 'l2', date: d(-90), label: 'Installment 1 of 3 received', amount: 400, kind: 'payment', method: 'Visa •••• 4821', reference: 'ch_7215BD' },
    { id: 'l3', date: d(-96), label: 'Invoice issued — 3 Installments plan', amount: 1200, kind: 'invoice' },
  ],
  method: { brand: 'Visa', last4: '4821', expiry: '08/28' },
  autopay: true,
  nextDue: d(2),
  lastReminder: d(-2),
  registrationId: null,
  notes: 'Family opted into the 3-installment plan at registration. AutoPay on file.',
  allowPartial: true,
}))

/* --- The rest of the academy ---------------------------------------- */
type Shape = 'paid' | 'partial' | 'overdue' | 'failed' | 'upcoming' | 'refunded' | 'credit'

const SHAPE_PLAN: [Shape, number][] = [
  ['paid', 56], ['partial', 19], ['upcoming', 16], ['overdue', 8], ['failed', 3], ['refunded', 2], ['credit', 2],
]

const billable = players.filter((p) => p.id !== jordan.id && p.status === 'active')

/* Walk the roster with a stride coprime to its length so every invoice lands on a
   distinct player (and therefore a distinct household) until the pool is exhausted.
   A non-coprime stride silently reused the same families every few invoices. */
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const STRIDE = [17, 13, 11, 7, 23, 29, 1].find((n) => gcd(n, billable.length) === 1) ?? 1
let cursor = 0

for (const [shape, count] of SHAPE_PLAN) {
  for (let n = 0; n < count; n++) {
    const player = billable[(cursor * STRIDE + 3) % billable.length]
    cursor++
    const prog = programFor(player.teamId)
    const planId = shape === 'paid' && rnd() > 0.45 ? 'plan-full'
      : shape === 'partial' || shape === 'upcoming' ? pick(['plan-3', 'plan-6'])
        : pick(['plan-3', 'plan-6', 'plan-full'])
    const plan = planById(planId)

    const useDiscount = rnd() > 0.76
    const disc = useDiscount ? pick(DISCOUNTS) : null
    const discountAmount = disc ? (disc.kind === 'percent' ? Math.round((prog.fee * disc.value) / 100) : disc.value) : 0
    const creditApplied = shape === 'credit' ? Math.min(150, prog.fee - discountAmount) : 0
    const processingFee = plan.processingFeePct ? Math.round(((prog.fee - discountAmount) * plan.processingFeePct) / 100) : 0
    const total = prog.fee - discountAmount - creditApplied + processingFee

    /* Where the plan starts, so the shape lands where we want it today. */
    const anchor = shape === 'upcoming' ? between(3, 26)
      : shape === 'overdue' ? -between(70, 130)
        : shape === 'failed' ? -between(30, 50)
          : -between(60, 150)

    let installments = buildInstallments(total, planId, anchor)
    const nInst = installments.length

    let paidCount = 0
    let failedIdx: number | null = null
    if (shape === 'paid' || shape === 'refunded') paidCount = nInst
    else if (shape === 'partial') paidCount = Math.max(1, nInst - 1)
    else if (shape === 'credit') paidCount = Math.max(0, nInst - 1)
    else if (shape === 'overdue') paidCount = nInst > 2 ? 1 : 0
    else if (shape === 'failed') { paidCount = Math.max(0, nInst - 2); failedIdx = paidCount }

    installments = ageInstallments(installments, paidCount, failedIdx)
    if (shape === 'upcoming' || shape === 'partial' || shape === 'credit' || shape === 'refunded') {
      installments = installments.map((i) => (i.status === 'overdue' ? { ...i, status: 'due' as const } : i))
    }

    const noMethod = (shape === 'failed' && n === 1) || (shape === 'partial' && (n === 3 || n === 9))
    const method = noMethod ? null : makeMethod()
    const autopay = !!method && plan.requiresAutopay && rnd() > 0.18

    const ledger: LedgerEntry[] = []
    installments.filter((i) => i.status === 'paid').slice().reverse().forEach((i, k) => {
      ledger.push({
        id: `l-p${k}`, date: i.paidDate!, kind: 'payment',
        label: nInst > 1 ? `Installment ${i.number} of ${nInst} received` : 'Payment received',
        amount: i.amount, method: i.method ?? methodLabel(method), reference: `ch_${between(1000, 9999)}${String.fromCharCode(65 + between(0, 25))}${String.fromCharCode(65 + between(0, 25))}`,
      })
    })
    if (failedIdx !== null) {
      ledger.unshift({
        id: 'l-f', date: d(-between(1, 9)), kind: 'failure',
        label: `Installment ${failedIdx + 1} failed — ${installments[failedIdx].failureReason}`,
        amount: installments[failedIdx].amount, method: methodLabel(method),
      })
    }
    if (shape === 'refunded') {
      ledger.unshift({ id: 'l-r', date: d(-between(2, 20)), kind: 'refund', label: `Refund issued — ${pick(REFUND_REASONS)}`, amount: installments[0].amount })
    }
    if (creditApplied) ledger.push({ id: 'l-c', date: d(anchor - 1), kind: 'credit', label: 'Account credit applied', amount: -creditApplied })
    if (disc) ledger.push({ id: 'l-d', date: d(anchor - 1), kind: 'discount', label: `${disc.label} applied`, amount: -discountAmount })
    ledger.push({ id: 'l-i', date: d(anchor - 4), kind: 'invoice', label: `Invoice issued — ${plan.name}`, amount: prog.fee })

    invoices.push(reconcile({
      id: nextId(),
      playerId: player.id,
      playerName: playerName(player),
      familyName: `${player.guardian.name.split(' ')[1] ?? player.last} Family`,
      teamId: player.teamId,
      program: prog.label,
      description: `2025–26 ${prog.label} season${player.teamId ? ` — ${teamById(player.teamId)!.name}` : ''}`,
      issued: d(anchor - 4),
      subtotal: prog.fee,
      discountLabel: disc?.label ?? null,
      discountAmount,
      creditApplied,
      processingFee,
      total,
      paid: 0,
      balance: 0,
      status: 'upcoming',
      planId,
      planName: plan.name,
      installments,
      ledger,
      method,
      autopay,
      nextDue: null,
      lastReminder: shape === 'overdue' || shape === 'failed' ? d(-between(1, 12)) : null,
      registrationId: null,
      notes: shape === 'overdue' ? 'Second notice sent. Offer a payment plan before restricting participation.'
        : shape === 'failed' ? 'AutoPay attempt failed. Family needs to update the card on file.'
          : '',
      allowPartial: true,
    }))
  }
}

/* Link a few invoices back to open registrations so the flow reads end to end. */
registrations.slice(0, 6).forEach((r, i) => {
  const inv = invoices[i + 1]
  if (inv) { inv.registrationId = r.id }
})

/* ------------------------------------------------------------------ */
/* Balance the ledger to the reported headline figures                 */
/* ------------------------------------------------------------------ */
function scaleGroup(list: Installment[], target: number) {
  const sum = list.reduce((s, i) => s + i.amount, 0)
  if (!sum || !list.length) return
  const factor = target / sum
  let running = 0
  list.forEach((inst, idx) => {
    const next = idx === list.length - 1 ? target - running : Math.max(25, Math.round((inst.amount * factor) / 5) * 5)
    inst.amount = next
    running += next
  })
}

const others = invoices.filter((i) => i.id !== JORDAN_INVOICE_ID)
const flat = (pred: (i: Installment) => boolean) => others.flatMap((inv) => inv.installments.filter(pred))

/* Jordan's $800 already counts toward the collected figure. */
const refundedTotal = others.flatMap((i) => i.ledger).filter((l) => l.kind === 'refund').reduce((s, l) => s + (l.amount ?? 0), 0)
scaleGroup(flat((i) => i.status === 'paid'), TARGETS.collected - 800 + refundedTotal)
scaleGroup(flat((i) => i.status === 'overdue'), TARGETS.overdue)
scaleGroup(flat((i) => i.status === 'failed'), TARGETS.failed)
/* Jordan's $400 due in two days counts toward the due-soon figure. */
scaleGroup(flat((i) => i.status === 'due'), TARGETS.dueSoon - 400)
scaleGroup(flat((i) => i.status === 'upcoming'), TARGETS.upcoming)

/* Rebuild each invoice's subtotal from its (now scaled) installments. */
for (const inv of others) {
  const sum = inv.installments.reduce((s, i) => s + i.amount, 0)
  inv.subtotal = sum + inv.discountAmount + inv.creditApplied - inv.processingFee
  const idx = invoices.findIndex((x) => x.id === inv.id)
  invoices[idx] = reconcile(inv)
}

/* ------------------------------------------------------------------ */
/* Family accounts & credit                                            */
/* ------------------------------------------------------------------ */
export const familyAccounts: FamilyAccount[] = (() => {
  const map = new Map<string, FamilyAccount>()
  for (const inv of invoices) {
    const existing = map.get(inv.familyName)
    if (existing) { if (inv.playerId) existing.playerIds.push(inv.playerId) }
    else map.set(inv.familyName, { familyName: inv.familyName, credit: 0, playerIds: inv.playerId ? [inv.playerId] : [] })
  }
  const list = [...map.values()]
  /* A handful of families carry a credit balance from a withdrawal or overpayment. */
  list.filter((_, i) => i % 11 === 3).forEach((f, i) => { f.credit = [150, 75, 250, 120][i % 4] })
  const miles = list.find((f) => f.familyName === 'Miles Family')
  if (miles) miles.credit = 150
  return list
})()

export const familyByName = (name: string) => familyAccounts.find((f) => f.familyName === name)
export const invoiceById = (id: string) => invoices.find((i) => i.id === id)
export const invoicesForPlayer = (playerId: string) => invoices.filter((i) => i.playerId === playerId)

/* ------------------------------------------------------------------ */
/* Metrics derived from whatever the ledger currently holds            */
/* ------------------------------------------------------------------ */
export function billingMetrics(list: Invoice[]) {
  const sumWhere = (pred: (i: Installment) => boolean) =>
    list.flatMap((inv) => inv.installments).filter(pred).reduce((s, i) => s + i.amount, 0)

  const refunded = list.flatMap((i) => i.ledger).filter((l) => l.kind === 'refund').reduce((s, l) => s + (l.amount ?? 0), 0)
  const collected = sumWhere((i) => i.status === 'paid') - refunded
  const overdue = sumWhere((i) => i.status === 'overdue')
  const failed = sumWhere((i) => i.status === 'failed')
  const dueSoon = sumWhere((i) => i.status === 'due')
  const upcoming = sumWhere((i) => i.status === 'upcoming')
  const outstanding = overdue + failed + dueSoon
  /* Share of everything already due that has actually been collected. */
  const collectionRate = collected + overdue + failed > 0
    ? (collected / (collected + overdue + failed)) * 100
    : 100

  return {
    collected, refunded, overdue, failed, dueSoon, upcoming, outstanding, collectionRate,
    billed: collected + outstanding + upcoming,
    needsAttention: new Set(list.filter(needsAttention).map((i) => i.familyName)).size,
    attentionInvoices: list.filter(needsAttention).length,
    failedCount: list.filter((i) => i.status === 'failed').length,
    overdueCount: list.filter((i) => i.status === 'overdue').length,
  }
}

/** An invoice needing a human: late, failed, or unable to charge. */
export function needsAttention(inv: Invoice) {
  if (inv.status === 'overdue' || inv.status === 'failed') return true
  if (inv.balance > 0 && !inv.method) return true
  return false
}

export function attentionReason(inv: Invoice): string {
  if (inv.status === 'failed') {
    const f = inv.installments.find((i) => i.status === 'failed')
    return f?.failureReason ?? 'Payment failed'
  }
  if (inv.status === 'overdue') return 'Balance past due'
  if (!inv.method) return 'No payment method on file'
  return 'Needs review'
}

export function recommendedAction(inv: Invoice): string {
  if (inv.status === 'failed') return !inv.method ? 'Request a payment method' : 'Retry the payment'
  if (!inv.method) return 'Request a payment method'
  if (daysOverdue(inv) > 21) return 'Call the family'
  if (inv.planId === 'plan-full' && inv.balance > 400) return 'Offer a payment plan'
  return 'Send a reminder'
}

export function daysOverdue(inv: Invoice) {
  const late = inv.installments.filter((i) => i.status === 'overdue' || i.status === 'failed')
  if (!late.length) return 0
  const earliest = late.reduce((a, b) => (a.dueDate < b.dueDate ? a : b))
  return Math.max(0, Math.round((Date.now() - new Date(`${earliest.dueDate}T12:00`).getTime()) / 86400000))
}

/* Monthly collected vs outstanding, derived from the real ledger dates. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function collectionsByMonth(list: Invoice[], monthsBack = 6) {
  const out: { label: string; collected: number; outstanding: number }[] = []
  for (let m = monthsBack - 1; m >= 0; m--) {
    const dt = new Date(); dt.setDate(1); dt.setMonth(dt.getMonth() - m)
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
    const inMonth = (dateStr: string) => dateStr.startsWith(key)
    const collected = list.flatMap((i) => i.installments)
      .filter((i) => i.status === 'paid' && i.paidDate && inMonth(i.paidDate))
      .reduce((s, i) => s + i.amount, 0)
    const outstanding = list.flatMap((i) => i.installments)
      .filter((i) => (i.status === 'overdue' || i.status === 'failed') && inMonth(i.dueDate))
      .reduce((s, i) => s + i.amount, 0)
    out.push({ label: MONTHS[dt.getMonth()], collected, outstanding })
  }
  return out
}

export function upcomingInstallments(list: Invoice[], days = 30) {
  const limit = d(days)
  return list.flatMap((inv) =>
    inv.installments
      .filter((i) => (i.status === 'due' || i.status === 'upcoming') && i.dueDate <= limit)
      .map((i) => ({ invoice: inv, installment: i }))
  ).sort((a, b) => a.installment.dueDate.localeCompare(b.installment.dueDate))
}

export function byTeam(list: Invoice[]) {
  return teams.map((t) => {
    const rows = list.filter((i) => i.teamId === t.id)
    const m = billingMetrics(rows)
    return { teamId: t.id, name: t.name, color: t.color, collected: m.collected, outstanding: m.outstanding, rate: m.collectionRate, invoices: rows.length }
  })
}

export function byProgram(list: Invoice[]) {
  return BILLING_PROGRAMS.map((p) => {
    const rows = list.filter((i) => i.program === p.label)
    const m = billingMetrics(rows)
    return { label: p.label, collected: m.collected, outstanding: m.outstanding, invoices: rows.length }
  })
}

/* ------------------------------------------------------------------ */
/* Reminder templates                                                  */
/* ------------------------------------------------------------------ */
export const REMINDER_TEMPLATES = [
  { key: 'due-soon', label: 'Payment Due Soon', subject: 'Your next Cavs installment is coming up', body: 'A friendly reminder that your next installment of {amount} for {player} is due on {date}. AutoPay will run automatically if a method is on file — no action needed.' },
  { key: 'overdue', label: 'Payment Overdue', subject: 'Outstanding balance on your Cavs account', body: 'Our records show a balance of {amount} for {player} that was due on {date}. Please settle it at your earliest convenience, or reply and we will set up a payment plan.' },
  { key: 'failed', label: 'Payment Failed', subject: 'We could not process your payment', body: 'The scheduled payment of {amount} for {player} did not go through. Please update the payment method on your account so we can retry the charge.' },
  { key: 'installment', label: 'Installment Reminder', subject: 'Installment {n} of your Cavs payment plan', body: 'Installment {n} of {amount} for {player} is scheduled for {date}. Your plan has {remaining} remaining after this payment.' },
]

/** A player's payment state, resolved from their invoice so nothing contradicts. */
export function playerPaymentStatus(playerId: string | null, list: Invoice[] = invoices): 'paid' | 'pending' | 'overdue' {
  if (!playerId) return 'paid'
  const mine = list.filter((i) => i.playerId === playerId)
  if (!mine.length) return 'paid'
  if (mine.some((i) => i.status === 'overdue' || i.status === 'failed')) return 'overdue'
  if (mine.some((i) => i.balance > 0)) return 'pending'
  return 'paid'
}

/** Everything a family owes across all of their players. */
export function familySummary(familyName: string, list: Invoice[] = invoices) {
  const mine = list.filter((i) => i.familyName === familyName)
  return {
    invoices: mine,
    billed: mine.reduce((s, i) => s + i.total, 0),
    paid: mine.reduce((s, i) => s + i.paid, 0),
    outstanding: mine.reduce((s, i) => s + i.balance, 0),
    credit: familyByName(familyName)?.credit ?? 0,
    nextDue: mine.map((i) => i.nextDue).filter(Boolean).sort()[0] ?? null,
    autopay: mine.some((i) => i.autopay),
  }
}
