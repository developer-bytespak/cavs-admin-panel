import { teams, games, practices, payments, registrations, players, d, dayOffset, iso } from './mock'

/* Deterministic wobble so the demo series look organic but never change */
function wave(i: number, seed: number, amp: number) {
  return (Math.sin((i + seed) * 0.7) + Math.sin((i + seed) * 0.23) * 0.6 + Math.cos((i + seed) * 1.31) * 0.35) * amp
}

export interface PulsePoint {
  date: string
  label: string
  attendance: number
  activePlayers: number
  practices: number
  games: number
}

export const RANGES = [
  { key: '7d', label: 'Last 7 Days', days: 7 },
  { key: '30d', label: 'Last 30 Days', days: 30 },
  { key: '90d', label: 'Last 90 Days', days: 90 },
] as const
export type RangeKey = (typeof RANGES)[number]['key']

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function buildPulse(days: number): PulsePoint[] {
  const out: PulsePoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = dayOffset(-i)
    const key = iso(date)
    const idx = days - i
    const dow = date.getDay()
    const weekendLift = dow === 0 || dow === 6 ? 3 : 0
    out.push({
      date: key,
      label: `${MONTHS[date.getMonth()]} ${date.getDate()}`,
      attendance: Math.round(Math.min(99, Math.max(68, 88 + wave(idx, 3, 4.2) + weekendLift + idx * (0.09 * (30 / days))))),
      activePlayers: Math.round(112 + wave(idx, 11, 5) + idx * (16 / days)),
      practices: practices.filter((p) => p.date === key).length,
      games: games.filter((g) => g.date === key).length,
    })
  }
  return out
}

export const pulse30 = buildPulse(30)

/* --- Attendance by team, last 8 weeks ------------------------------ */
export const attendanceWeeks = Array.from({ length: 8 }, (_, i) => `W${i + 1}`)
export const attendanceByTeam = teams.map((t, ti) => ({
  teamId: t.id,
  name: t.name,
  color: t.color,
  current: t.attendance,
  values: attendanceWeeks.map((_, i) =>
    Math.round(Math.min(99, Math.max(70, t.attendance - 6 + i * 0.85 + wave(i, ti * 5, 2.6))))
  ),
}))

/* --- Team × weekday activity heatmap -------------------------------- */
export const HEAT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export interface HeatCell { teamId: string; day: string; value: number; sessions: number; attendance: number }
export const heatmap: HeatCell[] = teams.flatMap((t, ti) =>
  HEAT_DAYS.map((day, di) => {
    const dow = di === 6 ? 0 : di + 1
    const scheduled = practices.some((p) => p.teamId === t.id && new Date(`${p.date}T12:00`).getDay() === dow)
    const gameDay = games.some((g) => g.teamId === t.id && new Date(`${g.date}T12:00`).getDay() === dow)
    const base = scheduled ? 62 : gameDay ? 44 : 8
    const value = Math.max(0, Math.min(100, Math.round(base + wave(di, ti * 3, 14) + (t.attendance - 88))))
    return {
      teamId: t.id, day, value,
      sessions: scheduled ? 4 : gameDay ? 2 : 0,
      attendance: value > 20 ? Math.min(99, Math.round(t.attendance + wave(di, ti, 3))) : 0,
    }
  })
)

/* --- Registration funnel (last 30 days) ---------------------------- */
export const funnel = [
  { key: 'leads', label: 'New Leads', value: 42, hint: 'Inquiries and website submissions' },
  { key: 'evaluations', label: 'Evaluations', value: 31, hint: 'Scheduled or completed evaluation' },
  { key: 'registered', label: 'Registered', value: 24, hint: 'Paperwork and dues complete' },
  { key: 'assigned', label: 'Assigned', value: 20, hint: 'Placed on a competitive roster' },
]

/* --- Registration trend, last 8 weeks ------------------------------ */
export const registrationTrend = Array.from({ length: 8 }, (_, i) => ({
  label: `W${i + 1}`,
  leads: Math.round(7 + wave(i, 2, 2.6) + i * 0.5),
  registered: Math.round(3 + wave(i, 7, 1.4) + i * 0.42),
}))

export const registrationsByProgram = [
  { label: 'Elite Travel', value: registrations.filter((r) => r.program === 'Elite Travel').length + 9 },
  { label: 'Select Travel', value: registrations.filter((r) => r.program === 'Select Travel').length + 7 },
  { label: 'Development', value: registrations.filter((r) => r.program === 'Development').length + 5 },
  { label: 'Academy Skills', value: registrations.filter((r) => r.program === 'Academy Skills').length + 4 },
]

/* --- Payments ------------------------------------------------------- */
export const collected = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
export const pendingTotal = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
export const overdueTotal = payments.filter((p) => p.status === 'overdue').reduce((s, p) => s + p.amount, 0)
export const outstanding = pendingTotal + overdueTotal
export const familiesNeedingAttention = payments.filter((p) => p.status !== 'paid').length

export const paymentTrend = Array.from({ length: 6 }, (_, i) => {
  const date = new Date()
  date.setMonth(date.getMonth() - (5 - i))
  return {
    label: MONTHS[date.getMonth()],
    collected: Math.round(11800 + i * 1180 + wave(i, 4, 900)),
    outstanding: Math.round(3200 - i * 130 + wave(i, 9, 420)),
  }
})

/* --- Participation --------------------------------------------------- */
export const participationByTeam = teams.map((t) => ({
  teamId: t.id,
  name: t.name,
  color: t.color,
  players: t.roster.length,
  capacity: t.capacity,
  practicesAttended: Math.round(t.roster.length * 7.4 * (t.attendance / 100)),
  gamesPlayed: games.filter((g) => g.teamId === t.id && g.status === 'final').length,
}))

/* --- Headline metrics ------------------------------------------------ */
export const activePlayers = players.filter((p) => p.status === 'active').length
export const gamesToday = games.filter((g) => g.date === d(0)).length
export const newSignups = registrations.filter((r) => {
  const days = (Date.now() - new Date(`${r.submitted}T12:00`).getTime()) / 86400000
  return days <= 7
}).length

export const metricSparks = {
  players: [104, 108, 109, 113, 116, 118, 121, 124, 126, 128],
  teams: [5, 5, 5, 6, 6, 6, 6, 6, 6, 6],
  games: [2, 4, 1, 3, 5, 2, 3, 4, 2, 3],
  signups: [3, 5, 4, 7, 6, 8, 6, 9, 7, 9],
}
