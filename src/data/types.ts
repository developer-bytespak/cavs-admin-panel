export type Role = 'admin' | 'coach'

export type GameStatus = 'scheduled' | 'warmup' | 'live' | 'halftime' | 'final' | 'canceled'
export type PlayerStatus = 'active' | 'pending' | 'inactive'
export type RegStage = 'new' | 'review' | 'evaluation' | 'ready' | 'completed'
export type PayStatus = 'paid' | 'pending' | 'overdue'
export type StaffStatus = 'active' | 'inactive'
export type EventType = 'game' | 'practice' | 'evaluation' | 'meeting'
export type Priority = 'normal' | 'important' | 'urgent'
export type AttendanceMark = 'present' | 'late' | 'absent' | 'unmarked'

export interface Team {
  id: string
  name: string
  short: string
  ageGroup: string
  division: string
  coachId: string
  assistantId?: string
  capacity: number
  roster: string[]
  attendance: number
  record: { w: number; l: number }
  color: string
  founded: number
  homeLocationId: string
}

export interface Player {
  id: string
  first: string
  last: string
  jersey: number
  age: number
  teamId: string | null
  status: PlayerStatus
  registration: RegStage
  payment: PayStatus
  attendance: number
  evaluation: number
  position: string
  joined: string
  guardian: { name: string; relation: string; phone: string; email: string }
  notes: { id: string; author: string; date: string; body: string }[]
  height: string
}

export interface Staff {
  id: string
  first: string
  last: string
  role: 'Administrator' | 'Head Coach' | 'Assistant Coach' | 'Supervisor'
  permissionLevel: 'Full Access' | 'Team Access' | 'Read Only'
  teams: string[]
  email: string
  phone: string
  status: StaffStatus
  since: string
}

export interface GameEvent {
  id: string
  type: 'game'
  teamId: string
  opponent: string
  date: string // ISO date
  start: string // HH:MM
  arrival: string
  locationId: string
  status: GameStatus
  gameType: 'League' | 'Tournament' | 'Scrimmage' | 'Showcase'
  score: { us: number; them: number }
  period: number
  clock: string
  notes: string
  log: { id: string; clock: string; period: number; team: 'us' | 'them'; points: number; label: string }[]
}

export interface PracticeEvent {
  id: string
  type: 'practice'
  teamId: string
  date: string
  start: string
  end: string
  locationId: string
  coachId: string
  status: 'scheduled' | 'completed' | 'canceled'
  focus: string
  notes: string
  repeat?: 'none' | 'weekly' | 'biweekly'
  repeatUntil?: string
}

export interface OtherEvent {
  id: string
  type: 'evaluation' | 'meeting'
  title: string
  teamId: string | null
  date: string
  start: string
  end: string
  locationId: string
  status: 'scheduled' | 'completed' | 'canceled'
  detail: string
}

export type CalEvent = GameEvent | PracticeEvent | OtherEvent

export interface Registration {
  id: string
  playerName: string
  age: number
  program: string
  submitted: string
  stage: RegStage
  evaluation: { status: 'not scheduled' | 'scheduled' | 'complete'; score: number | null; date: string | null; evaluator: string | null; recommendation: string | null; notes: string }
  payment: PayStatus
  guardian: { name: string; relation: string; phone: string; email: string }
  assignedTeamId: string | null
  adminNotes: { id: string; author: string; date: string; body: string }[]
  source: string
}

export interface Payment {
  id: string
  playerId: string | null
  family: string
  playerName: string
  program: string
  amount: number
  status: PayStatus
  due: string
  lastActivity: string
  method: string
  history: { id: string; date: string; label: string; amount: number | null }[]
}

export interface Announcement {
  id: string
  title: string
  body: string
  audience: string
  audienceKey: string
  recipients: number
  priority: Priority
  sentBy: string
  sentAt: string
  status: 'sent' | 'scheduled' | 'draft' | 'archived'
  openRate: number
}

export interface Location {
  id: string
  name: string
  address: string
  city: string
  courts: number
  capacity: number
  parking: string
  notes: string
  status: 'active' | 'maintenance'
  coords: { x: number; y: number }
}

export interface Notification {
  id: string
  kind: 'schedule' | 'registration' | 'payment' | 'game' | 'roster'
  title: string
  body: string
  time: string
  read: boolean
}

export interface ActivityItem {
  id: string
  actor: string
  action: string
  target: string
  time: string
  kind: 'registration' | 'schedule' | 'game' | 'payment' | 'roster'
}
