import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type {
  Role, GameEvent, PracticeEvent, Registration, Player,
  Announcement, Notification, RegStage, GameStatus, AttendanceMark, Priority,
  Invoice, Installment, LedgerEntry, StoredMethod, FamilyAccount,
} from '../data/types'
import {
  invoices as seedInvoices, familyAccounts as seedFamilies, reconcile, planById, methodLabel,
} from '../data/billing'
import {
  games as seedGames, practices as seedPractices, registrations as seedRegs,
  players as seedPlayers, announcements as seedAnnouncements,
  notifications as seedNotifications, staff, teams, CURRENT_ADMIN, CURRENT_COACH,
  LIVE_GAME_ID, otherEvents,
} from '../data/mock'
import { uid } from '../lib/utils'

export interface Toast {
  id: string
  title: string
  body?: string
  tone: 'success' | 'info' | 'warn' | 'error'
}

interface AppState {
  /* Identity & access */
  role: Role
  setRole: (r: Role) => void
  user: typeof CURRENT_ADMIN
  visibleTeamIds: string[]
  can: (p: Permission) => boolean

  /* Data */
  games: GameEvent[]
  practices: PracticeEvent[]
  registrations: Registration[]
  players: Player[]
  invoices: Invoice[]
  families: FamilyAccount[]
  announcements: Announcement[]
  notifications: Notification[]
  attendance: Record<string, Record<string, AttendanceMark>>
  liveGameId: string

  /* Mutations */
  adjustScore: (gameId: string, side: 'us' | 'them', delta: number) => void
  setGameStatus: (gameId: string, status: GameStatus) => void
  setGameClock: (gameId: string, period: number, clock: string) => void
  createGame: (g: Partial<GameEvent>) => GameEvent
  updateGame: (id: string, patch: Partial<GameEvent>, notify?: boolean) => void
  createPractice: (p: Partial<PracticeEvent>) => PracticeEvent
  updatePractice: (id: string, patch: Partial<PracticeEvent>, notify?: boolean) => void
  moveRegistration: (id: string, stage: RegStage) => void
  updateRegistration: (id: string, patch: Partial<Registration>) => void
  assignPlayerTeam: (playerId: string, teamId: string | null) => void
  /* Billing */
  recordPayment: (args: { invoiceId: string; amount: number; method: string; date: string; reference?: string; note?: string }) => void
  createInvoice: (inv: Partial<Invoice>) => Invoice
  sendReminder: (invoiceIds: string[], template: string) => void
  retryPayment: (invoiceId: string) => void
  refundPayment: (invoiceId: string, amount: number, reason: string) => void
  voidInvoice: (invoiceId: string) => void
  applyCredit: (invoiceId: string, amount: number) => void
  addCredit: (familyName: string, amount: number) => void
  setAutopay: (invoiceId: string, on: boolean) => void
  requestPaymentMethod: (invoiceId: string) => void
  updateMethod: (invoiceId: string, method: StoredMethod) => void
  convertToPlan: (invoiceId: string, planId: string, firstDue: string) => void
  adjustBalance: (invoiceId: string, delta: number, note: string) => void
  sendAnnouncement: (a: { title: string; body: string; audienceKey: string; audience: string; recipients: number; priority: Priority }) => void
  archiveAnnouncement: (id: string) => void
  markAttendance: (eventId: string, playerId: string, mark: AttendanceMark) => void

  /* Notifications & feedback */
  markAllRead: () => void
  markRead: (id: string) => void
  toasts: Toast[]
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void

  /* Overlays */
  paletteOpen: boolean
  setPaletteOpen: (v: boolean) => void
  createOpen: boolean
  setCreateOpen: (v: boolean) => void
  createKind: CreateKind | null
  openCreate: (k: CreateKind) => void
  closeCreate: () => void

  /* Realtime feel */
  lastSync: Date
  syncing: boolean
}

export type CreateKind = 'game' | 'practice' | 'player' | 'team' | 'announcement'

export type Permission =
  | 'view.allTeams' | 'manage.assignedTeams' | 'edit.schedule' | 'control.liveGames'
  | 'view.registrations' | 'view.payments' | 'send.broadcasts' | 'view.reports'
  | 'manage.staff' | 'manage.locations' | 'manage.settings'

export const PERMISSION_MATRIX: Record<string, Record<Permission, boolean>> = {
  Administrator: {
    'view.allTeams': true, 'manage.assignedTeams': true, 'edit.schedule': true, 'control.liveGames': true,
    'view.registrations': true, 'view.payments': true, 'send.broadcasts': true, 'view.reports': true,
    'manage.staff': true, 'manage.locations': true, 'manage.settings': true,
  },
  Coach: {
    'view.allTeams': false, 'manage.assignedTeams': true, 'edit.schedule': true, 'control.liveGames': true,
    'view.registrations': false, 'view.payments': false, 'send.broadcasts': true, 'view.reports': false,
    'manage.staff': false, 'manage.locations': false, 'manage.settings': false,
  },
  Supervisor: {
    'view.allTeams': true, 'manage.assignedTeams': false, 'edit.schedule': false, 'control.liveGames': false,
    'view.registrations': true, 'view.payments': false, 'send.broadcasts': false, 'view.reports': true,
    'manage.staff': false, 'manage.locations': false, 'manage.settings': false,
  },
}

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children, initialRole = 'admin' }: { children: React.ReactNode; initialRole?: Role }) {
  const [role, setRoleRaw] = useState<Role>(initialRole)
  const [games, setGames] = useState<GameEvent[]>(() => seedGames.map((g) => ({ ...g })))
  const [practices, setPractices] = useState<PracticeEvent[]>(() => seedPractices.map((p) => ({ ...p })))
  const [registrations, setRegs] = useState<Registration[]>(() => seedRegs.map((r) => ({ ...r })))
  const [invoices, setInvoices] = useState<Invoice[]>(() => seedInvoices.map((i) => ({ ...i })))
  const [families, setFamilies] = useState<FamilyAccount[]>(() => seedFamilies.map((f) => ({ ...f })))
  const [players, setPlayers] = useState<Player[]>(() => seedPlayers.map((p) => ({ ...p })))
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => seedAnnouncements.map((a) => ({ ...a })))
  const [notifications, setNotifications] = useState<Notification[]>(() => seedNotifications.map((n) => ({ ...n })))
  const [attendance, setAttendance] = useState<Record<string, Record<string, AttendanceMark>>>({})
  const [toasts, setToasts] = useState<Toast[]>([])
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createKind, setCreateKind] = useState<CreateKind | null>(null)
  const [lastSync, setLastSync] = useState(new Date())
  const [syncing, setSyncing] = useState(false)

  const user = role === 'admin' ? CURRENT_ADMIN : CURRENT_COACH
  const visibleTeamIds = useMemo(
    () => (role === 'admin' ? teams.map((t) => t.id) : staff.find((s) => s.id === CURRENT_COACH.id)!.teams),
    [role]
  )

  const can = useCallback(
    (p: Permission) => PERMISSION_MATRIX[role === 'admin' ? 'Administrator' : 'Coach'][p],
    [role]
  )

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = uid('toast')
    setToasts((prev) => [...prev, { ...t, id }])
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4600)
  }, [])
  const dismissToast = useCallback((id: string) => setToasts((p) => p.filter((t) => t.id !== id)), [])

  /* A brief "syncing" flash after any mutation — the real-time design language */
  const pulseSync = useCallback(() => {
    setSyncing(true)
    window.setTimeout(() => { setSyncing(false); setLastSync(new Date()) }, 750)
  }, [])

  const setRole = useCallback((r: Role) => {
    setRoleRaw(r)
    toast({
      tone: 'info',
      title: r === 'admin' ? 'Viewing as Administrator' : 'Viewing as Coach',
      body: r === 'admin' ? 'Full academy oversight restored.' : 'Scoped to Marcus Reed — 14U Elite and 13U Elite.',
    })
  }, [toast])

  /* ---------------- Games ---------------- */
  const adjustScore = useCallback((gameId: string, side: 'us' | 'them', delta: number) => {
    setGames((prev) => prev.map((g) => {
      if (g.id !== gameId) return g
      const next = Math.max(0, g.score[side] + delta)
      if (next === g.score[side]) return g
      const label = side === 'us'
        ? `Cavs ${delta > 0 ? '+' : ''}${delta}`
        : `${g.opponent.split(' ')[0]} ${delta > 0 ? '+' : ''}${delta}`
      return {
        ...g,
        score: { ...g.score, [side]: next },
        log: [{ id: uid('l'), clock: g.clock, period: g.period, team: side, points: delta, label }, ...g.log].slice(0, 40),
      }
    }))
    pulseSync()
  }, [pulseSync])

  const setGameStatus = useCallback((gameId: string, status: GameStatus) => {
    setGames((prev) => prev.map((g) => (g.id === gameId ? { ...g, status } : g)))
    pulseSync()
    toast({ tone: status === 'final' ? 'success' : 'info', title: `Game status set to ${status === 'warmup' ? 'Warm-up' : status[0].toUpperCase() + status.slice(1)}`, body: 'Everyone watching this game sees the change instantly.' })
  }, [pulseSync, toast])

  const setGameClock = useCallback((gameId: string, period: number, clock: string) => {
    setGames((prev) => prev.map((g) => (g.id === gameId ? { ...g, period, clock } : g)))
  }, [])

  const createGame = useCallback((g: Partial<GameEvent>) => {
    const game: GameEvent = {
      id: uid('g'), type: 'game', teamId: teams[0].id, opponent: 'TBD',
      date: g.date ?? '', start: '18:00', arrival: '17:15', locationId: 'loc-chatsworth',
      status: 'scheduled', gameType: 'League', score: { us: 0, them: 0 }, period: 1,
      clock: '08:00', notes: '', log: [], ...g,
    }
    setGames((prev) => [game, ...prev])
    pulseSync()
    return game
  }, [pulseSync])

  const updateGame = useCallback((id: string, patch: Partial<GameEvent>, notify?: boolean) => {
    setGames((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)))
    pulseSync()
    if (notify) {
      setNotifications((prev) => [
        { id: uid('n'), kind: 'schedule', title: 'Schedule updated', body: 'Affected families were notified of the new details.', time: 'Just now', read: false },
        ...prev,
      ])
    }
  }, [pulseSync])

  /* ---------------- Practices ---------------- */
  const createPractice = useCallback((p: Partial<PracticeEvent>) => {
    const practice: PracticeEvent = {
      id: uid('pr'), type: 'practice', teamId: teams[0].id, date: p.date ?? '',
      start: '16:00', end: '17:30', locationId: 'loc-training', coachId: teams[0].coachId,
      status: 'scheduled', focus: 'Skills session', notes: '', repeat: 'none', ...p,
    }
    setPractices((prev) => [practice, ...prev])
    pulseSync()
    return practice
  }, [pulseSync])

  const updatePractice = useCallback((id: string, patch: Partial<PracticeEvent>, notify?: boolean) => {
    setPractices((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    pulseSync()
    if (notify) {
      setNotifications((prev) => [
        { id: uid('n'), kind: 'schedule', title: 'Practice rescheduled', body: 'Affected families were notified of the new details.', time: 'Just now', read: false },
        ...prev,
      ])
    }
  }, [pulseSync])

  /* ---------------- Registrations ---------------- */
  const moveRegistration = useCallback((id: string, stage: RegStage) => {
    setRegs((prev) => prev.map((r) => (r.id === id ? { ...r, stage } : r)))
    pulseSync()
  }, [pulseSync])

  const updateRegistration = useCallback((id: string, patch: Partial<Registration>) => {
    setRegs((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    pulseSync()
  }, [pulseSync])

  /* ---------------- Players ---------------- */
  const assignPlayerTeam = useCallback((playerId: string, teamId: string | null) => {
    setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, teamId, status: 'active' } : p)))
    pulseSync()
  }, [pulseSync])

  /* ---------------- Billing ---------------- */
  const patchInvoice = useCallback((id: string, fn: (inv: Invoice) => Invoice) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? reconcile(fn(inv)) : inv)))
    pulseSync()
  }, [pulseSync])

  const logEntry = (inv: Invoice, entry: Omit<LedgerEntry, 'id'>): Invoice =>
    ({ ...inv, ledger: [{ ...entry, id: uid('l') }, ...inv.ledger] })

  /** Settles installments oldest-first with whatever the family just paid. */
  const recordPayment = useCallback(({ invoiceId, amount, method, date, reference, note }: {
    invoiceId: string; amount: number; method: string; date: string; reference?: string; note?: string
  }) => {
    patchInvoice(invoiceId, (inv) => {
      let remaining = amount
      const installments: Installment[] = inv.installments.map((i) => {
        if (i.status === 'paid' || i.status === 'refunded' || remaining <= 0) return i
        if (remaining >= i.amount) {
          remaining -= i.amount
          return { ...i, status: 'paid' as const, paidDate: date, method, failureReason: null }
        }
        /* A short payment splits the installment so the balance stays exact. */
        const paidPart = remaining
        remaining = 0
        return { ...i, amount: i.amount - paidPart, status: i.status === 'failed' ? 'due' as const : i.status, failureReason: null }
      })
      const partial = amount > 0 && installments.some((i, idx) => i.amount !== inv.installments[idx]?.amount)
      return logEntry({ ...inv, installments, lastReminder: inv.lastReminder }, {
        date, kind: 'payment', amount, method, reference,
        label: partial ? 'Partial payment received' : 'Payment received',
      })
    })
    if (note) {
      setInvoices((prev) => prev.map((inv) => (inv.id === invoiceId
        ? { ...inv, notes: inv.notes ? `${inv.notes}\n${note}` : note } : inv)))
    }
  }, [patchInvoice])

  const createInvoice = useCallback((partial: Partial<Invoice>) => {
    const inv = reconcile({
      id: `INV-${1200 + Math.floor(Math.random() * 700)}`,
      playerId: null, playerName: '', familyName: '', teamId: null, program: '', description: '',
      issued: new Date().toISOString().slice(0, 10),
      subtotal: 0, discountLabel: null, discountAmount: 0, creditApplied: 0, processingFee: 0,
      total: 0, paid: 0, balance: 0, status: 'upcoming',
      planId: 'plan-full', planName: 'Pay in Full', installments: [], ledger: [],
      method: null, autopay: false, nextDue: null, lastReminder: null, registrationId: null,
      notes: '', allowPartial: true,
      ...partial,
    } as Invoice)
    const withLog = logEntry(inv, { date: inv.issued, kind: 'invoice', label: `Invoice issued — ${inv.planName}`, amount: inv.subtotal })
    setInvoices((prev) => [withLog, ...prev])
    pulseSync()
    return withLog
  }, [pulseSync])

  const sendReminder = useCallback((invoiceIds: string[], template: string) => {
    const today = new Date().toISOString().slice(0, 10)
    setInvoices((prev) => prev.map((inv) => (invoiceIds.includes(inv.id)
      ? { ...inv, lastReminder: today, ledger: [{ id: uid('l'), date: today, kind: 'reminder' as const, label: `Reminder sent — ${template}`, amount: null }, ...inv.ledger] }
      : inv)))
    pulseSync()
  }, [pulseSync])

  const retryPayment = useCallback((invoiceId: string) => {
    const today = new Date().toISOString().slice(0, 10)
    patchInvoice(invoiceId, (inv) => {
      const idx = inv.installments.findIndex((i) => i.status === 'failed')
      if (idx < 0) return inv
      const installments = inv.installments.map((i, k) => (k === idx
        ? { ...i, status: 'paid' as const, paidDate: today, method: methodLabel(inv.method), failureReason: null } : i))
      return logEntry({ ...inv, installments }, {
        date: today, kind: 'payment', amount: inv.installments[idx].amount,
        method: methodLabel(inv.method), label: `Retry succeeded — installment ${inv.installments[idx].number}`,
      })
    })
  }, [patchInvoice])

  const refundPayment = useCallback((invoiceId: string, amount: number, reason: string) => {
    const today = new Date().toISOString().slice(0, 10)
    patchInvoice(invoiceId, (inv) => logEntry(inv, {
      date: today, kind: 'refund', amount, label: `Refund issued — ${reason}`,
    }))
  }, [patchInvoice])

  const voidInvoice = useCallback((invoiceId: string) => {
    const today = new Date().toISOString().slice(0, 10)
    patchInvoice(invoiceId, (inv) => logEntry({
      ...inv,
      installments: inv.installments.map((i) => (i.status === 'paid' ? i : { ...i, amount: 0, status: 'refunded' as const })),
    }, { date: today, kind: 'adjustment', amount: null, label: 'Invoice voided' }))
  }, [patchInvoice])

  const applyCredit = useCallback((invoiceId: string, amount: number) => {
    const today = new Date().toISOString().slice(0, 10)
    let family = ''
    patchInvoice(invoiceId, (inv) => {
      family = inv.familyName
      return logEntry({ ...inv, creditApplied: inv.creditApplied + amount }, {
        date: today, kind: 'credit', amount: -amount, label: 'Account credit applied',
      })
    })
    setFamilies((prev) => prev.map((f) => (f.familyName === family ? { ...f, credit: Math.max(0, f.credit - amount) } : f)))
  }, [patchInvoice])

  const addCredit = useCallback((familyName: string, amount: number) => {
    setFamilies((prev) => prev.map((f) => (f.familyName === familyName ? { ...f, credit: f.credit + amount } : f)))
    pulseSync()
  }, [pulseSync])

  const setAutopay = useCallback((invoiceId: string, on: boolean) => {
    patchInvoice(invoiceId, (inv) => ({ ...inv, autopay: on }))
  }, [patchInvoice])

  const requestPaymentMethod = useCallback((invoiceId: string) => {
    const today = new Date().toISOString().slice(0, 10)
    patchInvoice(invoiceId, (inv) => logEntry(inv, {
      date: today, kind: 'reminder', amount: null, label: 'Payment method request sent to the family',
    }))
  }, [patchInvoice])

  const updateMethod = useCallback((invoiceId: string, method: StoredMethod) => {
    const today = new Date().toISOString().slice(0, 10)
    patchInvoice(invoiceId, (inv) => logEntry({ ...inv, method }, {
      date: today, kind: 'adjustment', amount: null, label: `Payment method updated — ${methodLabel(method)}`,
    }))
  }, [patchInvoice])

  /** Re-plans the remaining balance across a new installment schedule. */
  const convertToPlan = useCallback((invoiceId: string, planId: string, firstDue: string) => {
    const plan = planById(planId)
    patchInvoice(invoiceId, (inv) => {
      const kept = inv.installments.filter((i) => i.status === 'paid')
      const each = Math.round(inv.balance / plan.installmentCount)
      const start = new Date(`${firstDue}T12:00`)
      const fresh: Installment[] = Array.from({ length: plan.installmentCount }, (_, k) => {
        const due = new Date(start); due.setMonth(due.getMonth() + k)
        return {
          id: uid('i'), number: kept.length + k + 1,
          amount: k === plan.installmentCount - 1 ? inv.balance - each * (plan.installmentCount - 1) : each,
          dueDate: due.toISOString().slice(0, 10),
          status: (k === 0 ? 'due' : 'upcoming') as Installment['status'],
          paidDate: null, method: null, failureReason: null,
        }
      })
      return logEntry({ ...inv, planId, planName: plan.name, installments: [...kept, ...fresh] }, {
        date: new Date().toISOString().slice(0, 10), kind: 'adjustment', amount: null,
        label: `Converted to ${plan.name}`,
      })
    })
  }, [patchInvoice])

  const adjustBalance = useCallback((invoiceId: string, delta: number, note: string) => {
    patchInvoice(invoiceId, (inv) => logEntry({ ...inv, subtotal: Math.max(0, inv.subtotal + delta) }, {
      date: new Date().toISOString().slice(0, 10), kind: 'adjustment', amount: delta,
      label: note || `Balance adjusted by ${delta > 0 ? '+' : ''}${delta}`,
    }))
  }, [patchInvoice])

  /* ---------------- Communications ---------------- */
  const sendAnnouncement = useCallback((a: { title: string; body: string; audienceKey: string; audience: string; recipients: number; priority: Priority }) => {
    const now = new Date()
    setAnnouncements((prev) => [{
      id: uid('a'), ...a, sentBy: `${user.first} ${user.last}`,
      sentAt: `${now.toISOString().slice(0, 10)}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      status: 'sent', openRate: 0,
    }, ...prev])
    pulseSync()
  }, [pulseSync, user])

  const archiveAnnouncement = useCallback((id: string) => {
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'archived' } : a)))
  }, [])

  /* ---------------- Attendance ---------------- */
  const markAttendance = useCallback((eventId: string, playerId: string, mark: AttendanceMark) => {
    setAttendance((prev) => ({ ...prev, [eventId]: { ...prev[eventId], [playerId]: mark } }))
  }, [])

  /* ---------------- Notifications ---------------- */
  const markAllRead = useCallback(() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))), [])
  const markRead = useCallback((id: string) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))), [])

  /* ---------------- Overlays ---------------- */
  const openCreate = useCallback((k: CreateKind) => { setCreateKind(k); setCreateOpen(false) }, [])
  const closeCreate = useCallback(() => setCreateKind(null), [])

  /* ⌘K / Ctrl+K */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* Live game clock — the scoreboard ticks like a real one */
  useEffect(() => {
    const t = window.setInterval(() => {
      setGames((prev) => prev.map((g) => {
        if (g.status !== 'live') return g
        const [m, s] = g.clock.split(':').map(Number)
        let total = m * 60 + s - 1
        if (total < 0) total = 0
        return { ...g, clock: `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}` }
      }))
    }, 1000)
    return () => window.clearInterval(t)
  }, [])

  const value: AppState = {
    role, setRole, user, visibleTeamIds, can,
    games, practices, registrations, players, announcements, notifications, attendance,
    invoices, families,
    recordPayment, createInvoice, sendReminder, retryPayment, refundPayment, voidInvoice,
    applyCredit, addCredit, setAutopay, requestPaymentMethod, updateMethod, convertToPlan, adjustBalance,
    liveGameId: LIVE_GAME_ID,
    adjustScore, setGameStatus, setGameClock, createGame, updateGame,
    createPractice, updatePractice, moveRegistration, updateRegistration,
    assignPlayerTeam, sendAnnouncement, archiveAnnouncement, markAttendance,
    markAllRead, markRead, toasts, toast, dismissToast,
    paletteOpen, setPaletteOpen, createOpen, setCreateOpen, createKind, openCreate, closeCreate,
    lastSync, syncing,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

export { otherEvents }
