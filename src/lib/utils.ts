import { clsx, type ClassValue } from 'clsx'

export const cn = (...i: ClassValue[]) => clsx(i)

/* ---------- Dates ---------- */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const parseDate = (isoDate: string) => new Date(`${isoDate}T12:00:00`)

export function fmtDate(isoDate: string, style: 'short' | 'medium' | 'long' | 'day' = 'medium') {
  const dt = parseDate(isoDate)
  if (style === 'short') return `${MONTHS[dt.getMonth()]} ${dt.getDate()}`
  if (style === 'day') return `${DAYS[dt.getDay()].slice(0, 3)} · ${MONTHS[dt.getMonth()]} ${dt.getDate()}`
  if (style === 'long') return `${DAYS[dt.getDay()]}, ${MONTHS_LONG[dt.getMonth()]} ${dt.getDate()}`
  return `${MONTHS[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`
}

export function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export function relativeDay(isoDate: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = parseDate(isoDate); target.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1 && diff < 7) return DAYS[target.getDay()]
  return fmtDate(isoDate, 'short')
}

export function timeUntil(isoDate: string, hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const target = parseDate(isoDate)
  target.setHours(h, m, 0, 0)
  const mins = Math.round((target.getTime() - Date.now()) / 60000)
  if (mins < 0) return null
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

export const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/* ---------- Numbers ---------- */
export const money = (n: number, cents = false) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })}`
export const pct = (n: number, digits = 0) => `${n.toFixed(digits)}%`
export const initials = (first: string, last: string) => `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()

/* ---------- Misc ---------- */
export const uid = (prefix = 'id') => `${prefix}-${Math.random().toString(36).slice(2, 9)}`
export const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/* Deterministic avatar tint from a name — no two teammates collide visually */
const AVATAR_TINTS = [
  ['#EDF2FE', '#1746C7'], ['#FFF0E8', '#C24A12'], ['#E6F6F3', '#0B7A6E'],
  ['#F1ECFD', '#5B3FC4'], ['#FDF4E3', '#8A5C00'], ['#FCEBF2', '#A82F60'],
]
export function avatarTint(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_TINTS[h % AVATAR_TINTS.length]
}
