import type {
  Team, Player, Staff, GameEvent, PracticeEvent, OtherEvent, CalEvent,
  Registration, Announcement, Location, Notification, ActivityItem,
} from './types'
import { FIRST_M, FIRST_F, LAST, POSITIONS } from './names'

/* ------------------------------------------------------------------ */
/* Deterministic pseudo-randomness — same demo data on every load.      */
/* ------------------------------------------------------------------ */
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20250907)
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]
const between = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1))

/* ------------------------------------------------------------------ */
/* Dates — everything is relative to today so the demo never goes stale */
/* ------------------------------------------------------------------ */
export const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

export function dayOffset(n: number): Date {
  const d = new Date(TODAY)
  d.setDate(d.getDate() + n)
  return d
}
export function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export const d = (n: number) => iso(dayOffset(n))
export const TODAY_ISO = d(0)

/* ------------------------------------------------------------------ */
/* Locations                                                           */
/* ------------------------------------------------------------------ */
export const locations: Location[] = [
  {
    id: 'loc-chatsworth', name: 'Chatsworth Gym', address: '10230 Topanga Canyon Blvd', city: 'Chatsworth, CA 91311',
    courts: 2, capacity: 400, parking: 'Lot A — 120 spaces, free',
    notes: 'Primary competition venue. Scoreboard console at the south table.',
    status: 'active', coords: { x: 26, y: 34 },
  },
  {
    id: 'loc-training', name: 'Cavs Training Center', address: '8845 Reseda Blvd', city: 'Northridge, CA 91324',
    courts: 3, capacity: 220, parking: 'Street + rear lot — 60 spaces',
    notes: 'Home of skills development and evaluation sessions. Film room upstairs.',
    status: 'active', coords: { x: 58, y: 56 },
  },
  {
    id: 'loc-westvalley', name: 'West Valley Court', address: '19400 Victory Blvd', city: 'Reseda, CA 91335',
    courts: 1, capacity: 150, parking: 'Shared lot — arrive 20 min early',
    notes: 'Single court. Overflow practices and Lady Cavs mid-week sessions.',
    status: 'active', coords: { x: 74, y: 26 },
  },
  {
    id: 'loc-northridge', name: 'Northridge Rec Annex', address: '18300 Lassen St', city: 'Northridge, CA 91325',
    courts: 1, capacity: 90, parking: 'Lot C — 40 spaces',
    notes: 'Backup venue. Floor resurfacing scheduled this season.',
    status: 'maintenance', coords: { x: 42, y: 76 },
  },
]

/* ------------------------------------------------------------------ */
/* Staff                                                               */
/* ------------------------------------------------------------------ */
export const staff: Staff[] = [
  { id: 'st-darryl', first: 'Darryl', last: 'Hayes', role: 'Administrator', permissionLevel: 'Full Access', teams: [], email: 'darryl@cavsacademy.org', phone: '(818) 555-0134', status: 'active', since: '1995-09-01' },
  { id: 'st-marcus', first: 'Marcus', last: 'Reed', role: 'Head Coach', permissionLevel: 'Team Access', teams: ['t-14u', 't-13u'], email: 'marcus.reed@cavsacademy.org', phone: '(818) 555-0177', status: 'active', since: '2016-06-14' },
  { id: 'st-tanya', first: 'Tanya', last: 'Whitfield', role: 'Head Coach', permissionLevel: 'Team Access', teams: ['t-lady'], email: 'tanya.whitfield@cavsacademy.org', phone: '(818) 555-0192', status: 'active', since: '2018-01-08' },
  { id: 'st-andre', first: 'Andre', last: 'Coleman', role: 'Head Coach', permissionLevel: 'Team Access', teams: ['t-12u'], email: 'andre.coleman@cavsacademy.org', phone: '(818) 555-0148', status: 'active', since: '2019-08-22' },
  { id: 'st-priya', first: 'Priya', last: 'Nakamura', role: 'Supervisor', permissionLevel: 'Read Only', teams: ['t-10u', 't-11u', 't-12u'], email: 'priya.nakamura@cavsacademy.org', phone: '(818) 555-0121', status: 'active', since: '2021-03-02' },
  { id: 'st-luis', first: 'Luis', last: 'Salazar', role: 'Assistant Coach', permissionLevel: 'Team Access', teams: ['t-11u', 't-10u'], email: 'luis.salazar@cavsacademy.org', phone: '(818) 555-0165', status: 'active', since: '2022-09-12' },
  { id: 'st-devon', first: 'Devon', last: 'Bradley', role: 'Assistant Coach', permissionLevel: 'Team Access', teams: ['t-14u'], email: 'devon.bradley@cavsacademy.org', phone: '(818) 555-0159', status: 'active', since: '2023-01-19' },
  { id: 'st-erin', first: 'Erin', last: 'Lawson', role: 'Assistant Coach', permissionLevel: 'Team Access', teams: ['t-lady'], email: 'erin.lawson@cavsacademy.org', phone: '(818) 555-0183', status: 'inactive', since: '2024-05-06' },
]

export const CURRENT_ADMIN = staff[0]
export const CURRENT_COACH = staff[1]

/* ------------------------------------------------------------------ */
/* Teams                                                               */
/* ------------------------------------------------------------------ */
export const teams: Team[] = [
  { id: 't-10u', name: '10U Blue', short: '10U', ageGroup: '10U', division: 'Development', coachId: 'st-luis', capacity: 12, roster: [], attendance: 88, record: { w: 5, l: 4 }, color: '#0E9F8E', founded: 2019, homeLocationId: 'loc-training' },
  { id: 't-11u', name: '11U Select', short: '11U', ageGroup: '11U', division: 'Select', coachId: 'st-luis', assistantId: 'st-priya', capacity: 12, roster: [], attendance: 91, record: { w: 6, l: 3 }, color: '#7C5CE0', founded: 2018, homeLocationId: 'loc-westvalley' },
  { id: 't-12u', name: '12U Blue', short: '12U', ageGroup: '12U', division: 'Select', coachId: 'st-andre', capacity: 12, roster: [], attendance: 89, record: { w: 7, l: 3 }, color: '#B77900', founded: 2015, homeLocationId: 'loc-chatsworth' },
  { id: 't-13u', name: '13U Elite', short: '13U', ageGroup: '13U', division: 'Elite', coachId: 'st-marcus', capacity: 12, roster: [], attendance: 93, record: { w: 8, l: 1 }, color: '#F05A1A', founded: 2012, homeLocationId: 'loc-chatsworth' },
  { id: 't-14u', name: '14U Elite', short: '14U', ageGroup: '14U', division: 'Elite', coachId: 'st-marcus', assistantId: 'st-devon', capacity: 12, roster: [], attendance: 94, record: { w: 8, l: 2 }, color: '#1746C7', founded: 2009, homeLocationId: 'loc-chatsworth' },
  { id: 't-lady', name: 'Lady Cavs', short: 'LC', ageGroup: '13U Girls', division: 'Elite', coachId: 'st-tanya', assistantId: 'st-erin', capacity: 12, roster: [], attendance: 96, record: { w: 9, l: 1 }, color: '#D9457F', founded: 2014, homeLocationId: 'loc-westvalley' },
]

export const teamById = (id: string | null) => teams.find((t) => t.id === id)
export const staffById = (id: string | null) => staff.find((s) => s.id === id)
export const locationById = (id: string | null) => locations.find((l) => l.id === id)

/* ------------------------------------------------------------------ */
/* Players — 128 active academy members, 65 on competitive rosters     */
/* ------------------------------------------------------------------ */
const GUARDIAN_REL = ['Mother', 'Father', 'Guardian', 'Grandmother', 'Stepfather']
const JERSEYS = [0, 1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25, 30, 31, 32, 33, 34, 35, 40, 42, 44, 45, 50, 55]

const ROSTER_SIZE: Record<string, number> = {
  't-10u': 10, 't-11u': 12, 't-12u': 11, 't-13u': 11, 't-14u': 9, 't-lady': 12,
}
const AGE_FOR: Record<string, [number, number]> = {
  't-10u': [9, 10], 't-11u': [10, 11], 't-12u': [11, 12], 't-13u': [12, 13], 't-14u': [13, 14], 't-lady': [12, 13],
}

export const players: Player[] = []
let pid = 0

function makePlayer(teamId: string | null, female: boolean, age: number, jersey: number, forceStatus?: Player['status']): Player {
  pid += 1
  const first = female ? pick(FIRST_F) : pick(FIRST_M)
  const last = pick(LAST)
  const status = forceStatus ?? (rnd() > 0.94 ? 'pending' : 'active')
  const payRoll = rnd()
  const payment: Player['payment'] = payRoll > 0.86 ? 'overdue' : payRoll > 0.72 ? 'pending' : 'paid'
  const gLast = rnd() > 0.25 ? last : pick(LAST)
  return {
    id: `p-${String(pid).padStart(3, '0')}`,
    first, last, jersey, age, teamId, status,
    registration: status === 'pending' ? pick(['review', 'evaluation', 'ready'] as const) : 'completed',
    payment,
    attendance: between(72, 100),
    evaluation: Math.round((6.2 + rnd() * 3.4) * 10) / 10,
    position: pick(POSITIONS),
    joined: d(-between(30, 900)),
    height: `${between(4, 5)}'${between(0, 11)}"`,
    guardian: {
      name: `${pick(female ? FIRST_F : [...FIRST_F, ...FIRST_M])} ${gLast}`,
      relation: pick(GUARDIAN_REL),
      phone: `(818) 555-0${between(200, 899)}`,
      email: `${gLast.toLowerCase()}.family@example.com`,
    },
    notes: [],
  }
}

// Competitive rosters
for (const t of teams) {
  const size = ROSTER_SIZE[t.id]
  const [lo, hi] = AGE_FOR[t.id]
  const female = t.id === 't-lady'
  const pool = [...JERSEYS]
  for (let i = 0; i < size; i++) {
    const j = pool.splice(Math.floor(rnd() * pool.length), 1)[0]
    const p = makePlayer(t.id, female, between(lo, hi), j, 'active')
    players.push(p)
    t.roster.push(p.id)
  }
}

// Academy skills program — registered, active, not yet on a competitive roster
for (let i = 0; i < 55; i++) {
  players.push(makePlayer(null, rnd() > 0.7, between(9, 14), pick(JERSEYS), 'active'))
}
// Pending intake
for (let i = 0; i < 8; i++) {
  players.push(makePlayer(null, rnd() > 0.7, between(9, 14), pick(JERSEYS), 'pending'))
}

/* Signature players — hand-authored so the demo always has known faces */
const jordan = players.find((p) => p.teamId === 't-14u')!
jordan.first = 'Jordan'; jordan.last = 'Miles'; jordan.jersey = 23; jordan.age = 14
jordan.attendance = 94; jordan.evaluation = 8.7; jordan.payment = 'paid'; jordan.position = 'Guard'
jordan.height = `5'9"`; jordan.joined = d(-612)
jordan.guardian = { name: 'Denise Miles', relation: 'Mother', phone: '(818) 555-0244', email: 'miles.family@example.com' }
jordan.notes = [
  { id: 'n1', author: 'Marcus Reed', date: d(-6), body: 'Elite first step. Needs to keep his head up on the second dribble in transition.' },
  { id: 'n2', author: 'Devon Bradley', date: d(-19), body: 'Took over the Warriors game in the fourth. Leadership showing up on defense now.' },
]
export const FEATURED_PLAYER_ID = jordan.id

const amari = players.find((p) => p.teamId === 't-14u' && p.id !== jordan.id)!
amari.first = 'Amari'; amari.last = 'Okafor'; amari.jersey = 32; amari.evaluation = 8.4; amari.attendance = 91
const simone = players.find((p) => p.teamId === 't-lady')!
simone.first = 'Simone'; simone.last = 'Carter'; simone.jersey = 11; simone.evaluation = 9.1; simone.attendance = 98

export const playerById = (id: string | null) => players.find((p) => p.id === id)
export const playerName = (p: Player) => `${p.first} ${p.last}`
export const rosterOf = (teamId: string) => players.filter((p) => p.teamId === teamId)

/* ------------------------------------------------------------------ */
/* Schedule — games, practices, evaluations across a 8-week window     */
/* ------------------------------------------------------------------ */
export const OPPONENTS = [
  'Valley Warriors', 'Chatsworth Select', 'Simi Hoops', 'Granada Hills Prep', 'Burbank Ballers',
  'Pasadena Pride', 'Santa Clarita Storm', 'West LA Wolves', 'Canoga Park Kings', 'Antelope Valley Heat',
  'Jordan Academy',
]
export const PRACTICE_FOCUS = [
  'Transition offense', 'Half-court defense', 'Shooting mechanics', 'Ball handling circuit',
  'Pick & roll reads', 'Rebounding & closeouts', 'Conditioning + free throws', 'Set plays walkthrough',
]

let gid = 0
let prid = 0

function game(partial: Partial<GameEvent> & { teamId: string; date: string; start: string }): GameEvent {
  gid += 1
  return {
    id: `g-${String(gid).padStart(3, '0')}`,
    type: 'game',
    opponent: pick(OPPONENTS),
    arrival: shift(partial.start, -45),
    locationId: 'loc-chatsworth',
    status: 'scheduled',
    gameType: 'League',
    score: { us: 0, them: 0 },
    period: 1,
    clock: '08:00',
    notes: '',
    log: [],
    ...partial,
  }
}
function shift(hhmm: string, minutes: number) {
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(((total % 1440) + 1440) % 1440 / 60)).padStart(2, '0')}:${String(((total % 60) + 60) % 60).padStart(2, '0')}`
}

export const games: GameEvent[] = []

/* --- Today: the three committed games ----------------------------- */
games.push(game({
  teamId: 't-11u', date: d(0), start: '13:00', opponent: 'Simi Hoops', locationId: 'loc-westvalley',
  status: 'final', score: { us: 38, them: 31 }, period: 4, clock: '00:00', gameType: 'League',
  notes: 'Season sweep. Bench played 14 minutes.',
  log: [
    { id: 'l1', clock: '06:12', period: 4, team: 'us', points: 2, label: '11U Select +2' },
    { id: 'l2', clock: '07:40', period: 4, team: 'them', points: 3, label: 'Simi Hoops +3' },
    { id: 'l3', clock: '02:05', period: 3, team: 'us', points: 3, label: '11U Select +3' },
  ],
}))

export const LIVE_GAME_ID = 'g-002'
games.push(game({
  teamId: 't-13u', date: d(0), start: '15:00', opponent: 'Chatsworth Select', locationId: 'loc-chatsworth',
  status: 'live', score: { us: 42, them: 38 }, period: 3, clock: '04:18', gameType: 'League',
  notes: 'Division matchup. Press break is the priority in the second half.',
  log: [
    { id: 'lg1', clock: '04:18', period: 3, team: 'us', points: 2, label: 'Cavs +2' },
    { id: 'lg2', clock: '05:02', period: 3, team: 'them', points: 3, label: 'Chatsworth +3' },
    { id: 'lg3', clock: '06:44', period: 3, team: 'us', points: 3, label: 'Cavs +3' },
    { id: 'lg4', clock: '00:52', period: 2, team: 'us', points: 2, label: 'Cavs +2' },
    { id: 'lg5', clock: '01:36', period: 2, team: 'them', points: 2, label: 'Chatsworth +2' },
  ],
}))

games.push(game({
  teamId: 't-14u', date: d(0), start: '18:30', opponent: 'Valley Warriors', locationId: 'loc-chatsworth',
  status: 'scheduled', gameType: 'League',
  notes: 'Arrival 5:45 PM for shootaround. Home whites.',
}))

/* --- Past results -------------------------------------------------- */
const pastPlan: [string, number, string, string][] = [
  ['t-14u', -3, '18:30', 'Granada Hills Prep'],
  ['t-lady', -4, '11:00', 'Pasadena Pride'],
  ['t-13u', -6, '16:00', 'Burbank Ballers'],
  ['t-12u', -7, '10:30', 'West LA Wolves'],
  ['t-14u', -10, '17:00', 'Santa Clarita Storm'],
  ['t-11u', -11, '09:30', 'Canoga Park Kings'],
  ['t-lady', -13, '12:00', 'Valley Warriors'],
  ['t-13u', -14, '15:30', 'Antelope Valley Heat'],
  ['t-10u', -17, '09:00', 'Simi Hoops'],
  ['t-14u', -20, '18:00', 'Chatsworth Select'],
  ['t-12u', -24, '11:00', 'Pasadena Pride'],
  ['t-lady', -27, '13:00', 'West LA Wolves'],
]
for (const [teamId, off, start, opponent] of pastPlan) {
  const us = between(34, 68)
  const them = us - between(-9, 14)
  games.push(game({
    teamId, date: d(off), start, opponent, status: 'final',
    score: { us, them: Math.max(18, them) }, period: 4, clock: '00:00',
    locationId: pick(locations.slice(0, 3)).id,
    gameType: off < -18 ? 'Tournament' : 'League',
    notes: '',
  }))
}

/* --- Upcoming ------------------------------------------------------ */
const futurePlan: [string, number, string, string][] = [
  ['t-lady', 1, '11:00', 'Simi Hoops'],
  ['t-12u', 1, '14:00', 'Burbank Ballers'],
  ['t-10u', 2, '09:00', 'Canoga Park Kings'],
  ['t-14u', 3, '18:30', 'Valley Warriors'],
  ['t-13u', 4, '17:00', 'Granada Hills Prep'],
  ['t-11u', 6, '10:00', 'Pasadena Pride'],
  ['t-lady', 8, '12:30', 'Antelope Valley Heat'],
  ['t-14u', 10, '18:00', 'West LA Wolves'],
  ['t-12u', 12, '10:30', 'Santa Clarita Storm'],
  ['t-14u', 14, '17:30', 'Jordan Academy'],
  ['t-13u', 15, '16:30', 'Chatsworth Select'],
  ['t-14u', 17, '19:00', 'Burbank Ballers'],
  ['t-lady', 20, '11:30', 'Granada Hills Prep'],
]
for (const [teamId, off, start, opponent] of futurePlan) {
  games.push(game({
    teamId, date: d(off), start, opponent, status: 'scheduled',
    locationId: pick(locations.slice(0, 3)).id,
    gameType: off > 14 ? 'Showcase' : 'League',
    notes: '',
  }))
}

/* --- Practices: weekly cadence per team ---------------------------- */
export const practices: PracticeEvent[] = []
const PRACTICE_PLAN: Record<string, { dow: number; start: string; end: string; loc: string }[]> = {
  't-10u': [{ dow: 2, start: '16:00', end: '17:15', loc: 'loc-training' }, { dow: 6, start: '09:00', end: '10:15', loc: 'loc-training' }],
  't-11u': [{ dow: 1, start: '16:30', end: '18:00', loc: 'loc-westvalley' }, { dow: 4, start: '16:30', end: '18:00', loc: 'loc-westvalley' }],
  't-12u': [{ dow: 3, start: '16:00', end: '17:30', loc: 'loc-chatsworth' }, { dow: 5, start: '17:00', end: '18:30', loc: 'loc-training' }],
  't-13u': [{ dow: 2, start: '18:00', end: '19:30', loc: 'loc-chatsworth' }, { dow: 4, start: '18:00', end: '19:30', loc: 'loc-chatsworth' }],
  't-14u': [{ dow: 1, start: '18:00', end: '19:45', loc: 'loc-chatsworth' }, { dow: 3, start: '18:00', end: '19:45', loc: 'loc-chatsworth' }, { dow: 5, start: '19:00', end: '20:30', loc: 'loc-training' }],
  't-lady': [{ dow: 2, start: '20:00', end: '21:15', loc: 'loc-westvalley' }, { dow: 4, start: '17:30', end: '19:00', loc: 'loc-westvalley' }],
}
for (let off = -28; off <= 28; off++) {
  const date = dayOffset(off)
  const dow = date.getDay()
  for (const t of teams) {
    for (const slot of PRACTICE_PLAN[t.id]) {
      if (slot.dow !== dow) continue
      prid += 1
      practices.push({
        id: `pr-${String(prid).padStart(3, '0')}`,
        type: 'practice', teamId: t.id, date: iso(date),
        start: slot.start, end: slot.end, locationId: slot.loc,
        coachId: t.coachId, status: off < 0 ? 'completed' : 'scheduled',
        focus: pick(PRACTICE_FOCUS), notes: '', repeat: 'weekly', repeatUntil: d(60),
      })
    }
  }
}
/* Today's committed timeline entries */
practices.push({
  id: 'pr-today-12u', type: 'practice', teamId: 't-12u', date: d(0), start: '16:00', end: '17:30',
  locationId: 'loc-chatsworth', coachId: 'st-andre', status: 'scheduled', focus: 'Half-court defense',
  notes: 'Full roster expected. Shooting stations for the last 20 minutes.', repeat: 'weekly', repeatUntil: d(60),
})
practices.push({
  id: 'pr-today-lady', type: 'practice', teamId: 't-lady', date: d(0), start: '20:00', end: '21:15',
  locationId: 'loc-westvalley', coachId: 'st-tanya', status: 'scheduled', focus: 'Transition offense',
  notes: 'Late slot — West Valley Court only has one court tonight.', repeat: 'weekly', repeatUntil: d(60),
})

/* --- Evaluations & meetings ---------------------------------------- */
export const otherEvents: OtherEvent[] = [
  { id: 'ev-today-eval', type: 'evaluation', title: 'Player Evaluation', teamId: null, date: d(0), start: '17:30', end: '18:15', locationId: 'loc-training', status: 'scheduled', detail: '3 players · Marcus Reed evaluating' },
  { id: 'ev-2', type: 'evaluation', title: 'Player Evaluation', teamId: null, date: d(2), start: '17:00', end: '18:00', locationId: 'loc-training', status: 'scheduled', detail: '5 players · Andre Coleman evaluating' },
  { id: 'ev-3', type: 'meeting', title: 'Coaches Staff Meeting', teamId: null, date: d(3), start: '20:00', end: '21:00', locationId: 'loc-training', status: 'scheduled', detail: 'Mid-season review · all head coaches' },
  { id: 'ev-4', type: 'evaluation', title: 'Player Evaluation', teamId: null, date: d(5), start: '16:30', end: '17:30', locationId: 'loc-training', status: 'scheduled', detail: '4 players · Tanya Whitfield evaluating' },
  { id: 'ev-5', type: 'meeting', title: 'Parent Orientation', teamId: null, date: d(9), start: '19:00', end: '20:00', locationId: 'loc-chatsworth', status: 'scheduled', detail: 'Spring session intake families' },
  { id: 'ev-6', type: 'evaluation', title: 'Player Evaluation', teamId: null, date: d(-4), start: '17:00', end: '18:00', locationId: 'loc-training', status: 'completed', detail: '6 players · Marcus Reed evaluating' },
]
export const allEvents: CalEvent[] = [...games, ...practices, ...otherEvents]

/* ------------------------------------------------------------------ */
/* Registrations                                                       */
/* ------------------------------------------------------------------ */
/** Season fee schedule. Billing derives every invoice amount from this. */
export const PROGRAMS = [
  { id: 'elite', label: 'Elite Travel', fee: 1200 },
  { id: 'select', label: 'Select Travel', fee: 850 },
  { id: 'dev', label: 'Development', fee: 600 },
  { id: 'skills', label: 'Academy Skills', fee: 350 },
]
const SOURCES = ['Website form', 'Open gym', 'Referral — current family', 'School outreach', 'Summer camp']
const EVALUATORS = ['Marcus Reed', 'Tanya Whitfield', 'Andre Coleman', 'Luis Salazar']
const RECOMMENDATIONS = ['14U Elite', '13U Elite', '12U Blue', '11U Select', '10U Blue', 'Lady Cavs', 'Academy Skills']

const STAGE_PLAN: [Registration['stage'], number][] = [
  ['new', 9], ['review', 7], ['evaluation', 6], ['ready', 5], ['completed', 7],
]

export const registrations: Registration[] = []
let rid = 0
for (const [stage, count] of STAGE_PLAN) {
  for (let i = 0; i < count; i++) {
    rid += 1
    const female = rnd() > 0.62
    const first = female ? pick(FIRST_F) : pick(FIRST_M)
    const last = pick(LAST)
    const age = between(9, 14)
    const prog = age >= 13 ? pick([PROGRAMS[0], PROGRAMS[1]]) : pick(PROGRAMS.slice(1))
    const evalDone = stage === 'ready' || stage === 'completed'
    const evalSched = stage === 'evaluation'
    registrations.push({
      id: `r-${String(rid).padStart(3, '0')}`,
      playerName: `${first} ${last}`,
      age,
      program: prog.label,
      submitted: d(-between(1, 26)),
      stage,
      evaluation: {
        status: evalDone ? 'complete' : evalSched ? 'scheduled' : 'not scheduled',
        score: evalDone ? Math.round((6.4 + rnd() * 3.2) * 10) / 10 : null,
        date: evalDone ? d(-between(1, 9)) : evalSched ? d(between(1, 6)) : null,
        evaluator: evalDone || evalSched ? pick(EVALUATORS) : null,
        recommendation: evalDone ? pick(RECOMMENDATIONS) : null,
        notes: evalDone ? pick([
          'Strong perimeter shooter. Needs strength work before elite minutes.',
          'High motor, excellent defensive instincts. Ready for Select.',
          'Good footwork in the post. Handles need development.',
          'Fast learner. Coachable. Recommend a development track first.',
        ]) : '',
      },
      payment: stage === 'completed' ? 'paid' : stage === 'ready' ? pick(['paid', 'pending'] as const) : 'pending',
      guardian: {
        name: `${pick([...FIRST_F, ...FIRST_M])} ${last}`,
        relation: pick(GUARDIAN_REL),
        phone: `(818) 555-0${between(200, 899)}`,
        email: `${last.toLowerCase()}.family@example.com`,
      },
      assignedTeamId: stage === 'completed' ? pick(teams).id : null,
      adminNotes: rnd() > 0.6 ? [{ id: 'an1', author: 'Darryl Hayes', date: d(-between(1, 5)), body: pick([
        'Family requested the Saturday practice block if possible.',
        'Sibling already in the 12U program — apply the family discount.',
        'Needs an evaluation slot before the next session starts.',
        'Transferring in from another club. Waiting on release paperwork.',
      ]) }] : [],
      source: pick(SOURCES),
    })
  }
}
/* A known registration for the global-search demo */
registrations[0].playerName = 'Jordan Ellison'
registrations[0].age = 13
registrations[0].program = 'Elite Travel'
registrations[0].submitted = d(-1)
registrations[0].source = 'Referral — current family'

export const regById = (id: string) => registrations.find((r) => r.id === id)



/* ------------------------------------------------------------------ */
/* Communications                                                      */
/* ------------------------------------------------------------------ */
export const AUDIENCES = [
  { key: 'academy', label: 'Entire Academy', recipients: 128, hint: 'All families, players and staff' },
  { key: 'coaches', label: 'All Coaches', recipients: 7, hint: 'Head and assistant coaches' },
  { key: 'elite', label: 'Elite Division', recipients: 32, hint: '13U Elite, 14U Elite, Lady Cavs' },
  { key: 't-14u', label: '14U Elite', recipients: 9, hint: 'Team roster + families' },
  { key: 't-13u', label: '13U Elite', recipients: 11, hint: 'Team roster + families' },
  { key: 't-12u', label: '12U Blue', recipients: 11, hint: 'Team roster + families' },
  { key: 't-11u', label: '11U Select', recipients: 12, hint: 'Team roster + families' },
  { key: 't-10u', label: '10U Blue', recipients: 10, hint: 'Team roster + families' },
  { key: 't-lady', label: 'Lady Cavs', recipients: 12, hint: 'Team roster + families' },
]

export const announcements: Announcement[] = [
  { id: 'a-01', title: 'Chatsworth Gym entrance change for Saturday', body: 'Saturday games will use the east entrance only — the main lot is closed for resurfacing. Please allow an extra 15 minutes for arrival and check-in. Doors open 45 minutes before the first tip.', audience: 'Entire Academy', audienceKey: 'academy', recipients: 128, priority: 'important', sentBy: 'Darryl Hayes', sentAt: `${d(0)}T09:12`, status: 'sent', openRate: 71 },
  { id: 'a-02', title: '14U Elite — arrival moved to 5:45 PM', body: 'Tonight against the Valley Warriors we are moving arrival to 5:45 PM for a full shootaround. Home whites. Bring both jerseys.', audience: '14U Elite', audienceKey: 't-14u', recipients: 9, priority: 'urgent', sentBy: 'Marcus Reed', sentAt: `${d(0)}T07:40`, status: 'sent', openRate: 100 },
  { id: 'a-03', title: 'Spring session dues — final week', body: 'Friendly reminder that spring session dues close Friday. Payment plans are available — reply to this message and we will set one up.', audience: 'Entire Academy', audienceKey: 'academy', recipients: 128, priority: 'normal', sentBy: 'Darryl Hayes', sentAt: `${d(-2)}T16:05`, status: 'sent', openRate: 64 },
  { id: 'a-04', title: 'Coaches: mid-season review agenda', body: 'Staff meeting Thursday at 8 PM in the film room. Bring roster notes, attendance concerns and your player development sheets.', audience: 'All Coaches', audienceKey: 'coaches', recipients: 7, priority: 'important', sentBy: 'Darryl Hayes', sentAt: `${d(-3)}T11:30`, status: 'sent', openRate: 100 },
  { id: 'a-05', title: 'Lady Cavs practice moved to West Valley', body: 'This week only, Thursday practice moves to West Valley Court at 5:30 PM. Chatsworth is hosting a league tournament.', audience: 'Lady Cavs', audienceKey: 't-lady', recipients: 12, priority: 'important', sentBy: 'Tanya Whitfield', sentAt: `${d(-5)}T14:22`, status: 'sent', openRate: 92 },
  { id: 'a-06', title: 'Team photo day — Saturday morning', body: 'Photos at 8:30 AM before the first game. Full uniform, warm-ups on. Order forms are in your family portal.', audience: 'Elite Division', audienceKey: 'elite', recipients: 32, priority: 'normal', sentBy: 'Priya Nakamura', sentAt: `${d(-8)}T10:00`, status: 'sent', openRate: 78 },
  { id: 'a-07', title: 'Volunteer sign-ups open for October', body: 'Snack, scorekeeping and carpool slots are open for October home games. Two slots per family for the season.', audience: 'Entire Academy', audienceKey: 'academy', recipients: 128, priority: 'normal', sentBy: 'Darryl Hayes', sentAt: `${d(-12)}T09:45`, status: 'archived', openRate: 58 },
]

/* Team chat channels — staff-moderated */
export const chatChannels = [
  { id: 'ch-14u', teamId: 't-14u', unread: 3, pinned: 'Arrival is 5:45 PM tonight — east entrance.', messages: [
    { id: 'm1', author: 'Marcus Reed', role: 'Head Coach', time: '7:42 AM', body: 'Arrival moved to 5:45 for shootaround. Home whites.', staff: true },
    { id: 'm2', author: 'Devon Bradley', role: 'Assistant Coach', time: '7:58 AM', body: 'I will have the scout sheet printed for the bench.', staff: true },
    { id: 'm3', author: 'Denise Miles', role: 'Family — Jordan Miles', time: '8:16 AM', body: 'Got it. Jordan will be there by 5:30.', staff: false },
    { id: 'm4', author: 'Marcus Reed', role: 'Head Coach', time: '9:03 AM', body: 'Reminder: two water bottles each. It is going to be warm in there.', staff: true },
  ] },
  { id: 'ch-lady', teamId: 't-lady', unread: 0, pinned: 'Thursday practice at West Valley Court, 5:30 PM.', messages: [
    { id: 'm1', author: 'Tanya Whitfield', role: 'Head Coach', time: 'Yesterday', body: 'Great energy in the Pasadena game. Film review clips are posted.', staff: true },
    { id: 'm2', author: 'Erin Lawson', role: 'Assistant Coach', time: 'Yesterday', body: 'Shooting stations start 15 minutes early Thursday.', staff: true },
  ] },
  { id: 'ch-12u', teamId: 't-12u', unread: 1, pinned: null, messages: [
    { id: 'm1', author: 'Andre Coleman', role: 'Head Coach', time: '2 days ago', body: 'Practice focus this week is half-court defense. Bring the right shoes.', staff: true },
  ] },
]

/* ------------------------------------------------------------------ */
/* Notifications & activity                                            */
/* ------------------------------------------------------------------ */
export const notifications: Notification[] = [
  { id: 'n-1', kind: 'game', title: 'Score updated — 13U Elite', body: 'Coach Marcus posted Cavs 42 · Chatsworth 38 (Q3 04:18).', time: '2 min ago', read: false },
  { id: 'n-2', kind: 'registration', title: 'New registration received', body: 'Jordan Ellison · 13U · Elite Travel — awaiting review.', time: '18 min ago', read: false },
  { id: 'n-3', kind: 'schedule', title: 'Game location changed', body: '12U Blue vs Burbank Ballers moved to Cavs Training Center.', time: '1 hr ago', read: false },
  { id: 'n-4', kind: 'payment', title: 'Payment overdue', body: '3 families are past due by more than 14 days.', time: '3 hrs ago', read: true },
  { id: 'n-5', kind: 'schedule', title: 'Practice rescheduled', body: 'Lady Cavs Thursday session moved to West Valley Court.', time: 'Yesterday', read: true },
  { id: 'n-6', kind: 'roster', title: 'Player assigned', body: 'Nia Brooks added to the Lady Cavs roster.', time: 'Yesterday', read: true },
  { id: 'n-7', kind: 'payment', title: 'Payment received', body: 'Whitaker Family — $395 Elite Travel dues.', time: '2 days ago', read: true },
]

export const activity: ActivityItem[] = [
  { id: 'ac-1', actor: 'Marcus Reed', action: 'updated the score for', target: '13U Elite vs Chatsworth Select', time: '2 min ago', kind: 'game' },
  { id: 'ac-2', actor: 'Darryl Hayes', action: 'reviewed the registration for', target: 'Jordan Ellison', time: '22 min ago', kind: 'registration' },
  { id: 'ac-3', actor: 'Andre Coleman', action: 'moved 12U practice to', target: 'Chatsworth Gym', time: '1 hr ago', kind: 'schedule' },
  { id: 'ac-4', actor: 'System', action: 'recorded a payment from', target: 'the Whitaker Family', time: '2 hrs ago', kind: 'payment' },
  { id: 'ac-5', actor: 'Tanya Whitfield', action: 'assigned a new player to', target: 'Lady Cavs', time: '4 hrs ago', kind: 'roster' },
  { id: 'ac-6', actor: 'Priya Nakamura', action: 'published an announcement to', target: 'the Elite Division', time: 'Yesterday', kind: 'schedule' },
  { id: 'ac-7', actor: 'Luis Salazar', action: 'marked attendance for', target: '10U Blue practice', time: 'Yesterday', kind: 'roster' },
  { id: 'ac-8', actor: 'Darryl Hayes', action: 'approved the evaluation for', target: 'Camille Ortiz', time: '2 days ago', kind: 'registration' },
]

/* ------------------------------------------------------------------ */
/* Optional modules: volunteers & player development                   */
/* ------------------------------------------------------------------ */
export const volunteerSlots = [
  { id: 'v-1', eventId: games[2].id, event: '14U Elite vs Valley Warriors', date: d(0), role: 'Scorekeeping', family: 'Miles Family', status: 'confirmed' },
  { id: 'v-2', eventId: games[2].id, event: '14U Elite vs Valley Warriors', date: d(0), role: 'Snacks', family: 'Okafor Family', status: 'confirmed' },
  { id: 'v-3', eventId: games[2].id, event: '14U Elite vs Valley Warriors', date: d(0), role: 'Carpool', family: 'Unassigned', status: 'open' },
  { id: 'v-4', eventId: 'g-016', event: 'Lady Cavs vs Simi Hoops', date: d(1), role: 'Snacks', family: 'Carter Family', status: 'confirmed' },
  { id: 'v-5', eventId: 'g-016', event: 'Lady Cavs vs Simi Hoops', date: d(1), role: 'Scorekeeping', family: 'Unassigned', status: 'open' },
  { id: 'v-6', eventId: 'g-017', event: '12U Blue vs Burbank Ballers', date: d(1), role: 'Carpool', family: 'Sanders Family', status: 'pending' },
  { id: 'v-7', eventId: 'g-018', event: '10U Blue vs Canoga Park Kings', date: d(2), role: 'Snacks', family: 'Unassigned', status: 'open' },
  { id: 'v-8', eventId: 'g-019', event: '14U Elite vs Valley Warriors', date: d(3), role: 'Volunteer — table crew', family: 'Bradley Family', status: 'confirmed' },
]

export const SKILLS = ['Ball Handling', 'Shooting', 'Finishing', 'Defense', 'Court Vision', 'Conditioning']
export const developmentLog = [
  { playerId: FEATURED_PLAYER_ID, entries: [
    { skill: 'Ball Handling', current: 8.6, previous: 7.9, note: 'Left-hand control under pressure is much improved.' },
    { skill: 'Shooting', current: 8.9, previous: 8.5, note: 'Catch-and-shoot from the wing is now a real weapon.' },
    { skill: 'Finishing', current: 8.2, previous: 8.2, note: 'Consistent at the rim. Work on the floater next.' },
    { skill: 'Defense', current: 7.8, previous: 7.1, note: 'Much better in help rotations since October.' },
    { skill: 'Court Vision', current: 8.4, previous: 8.0, note: 'Reading the second defender in transition.' },
    { skill: 'Conditioning', current: 9.0, previous: 8.7, note: 'Finished the fourth quarter strong in the last three games.' },
  ] },
]
