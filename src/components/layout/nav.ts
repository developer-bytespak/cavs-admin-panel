import {
  LayoutDashboard, CalendarDays, Radio, Shield, Users, ClipboardList, CreditCard,
  Megaphone, BarChart3, UserCog, MapPin, Settings, SquareCheckBig, HeartHandshake,
  TrendingUp, MessagesSquare,
} from 'lucide-react'
import type { Role } from '../../data/types'

export interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: Role[]
  badge?: 'live' | 'count'
}

export const PRIMARY_NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'coach'] },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays, roles: ['admin', 'coach'] },
  { to: '/live', label: 'Live Games', icon: Radio, roles: ['admin', 'coach'], badge: 'live' },
  { to: '/teams', label: 'Teams', icon: Shield, roles: ['admin'] },
  { to: '/teams', label: 'My Teams', icon: Shield, roles: ['coach'] },
  { to: '/players', label: 'Players', icon: Users, roles: ['admin', 'coach'] },
  { to: '/registrations', label: 'Registrations', icon: ClipboardList, roles: ['admin'], badge: 'count' },
  { to: '/payments', label: 'Payments', icon: CreditCard, roles: ['admin'] },
  { to: '/communications', label: 'Communications', icon: Megaphone, roles: ['admin', 'coach'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin'] },
]

export const TEAM_TOOLS_NAV: NavItem[] = [
  { to: '/attendance', label: 'Attendance', icon: SquareCheckBig, roles: ['admin', 'coach'] },
  { to: '/development', label: 'Development', icon: TrendingUp, roles: ['admin', 'coach'] },
  { to: '/volunteers', label: 'Volunteers', icon: HeartHandshake, roles: ['admin', 'coach'] },
  { to: '/channels', label: 'Team Channels', icon: MessagesSquare, roles: ['admin', 'coach'] },
]

export const MANAGE_NAV: NavItem[] = [
  { to: '/staff', label: 'Staff & Roles', icon: UserCog, roles: ['admin'] },
  { to: '/locations', label: 'Locations', icon: MapPin, roles: ['admin'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
]

export const forRole = (items: NavItem[], role: Role) => items.filter((i) => i.roles.includes(role))

/** Future scope, shown disabled so the client sees where the platform is going. */
export const FUTURE_NAV = [
  { label: 'Player Portal', hint: 'Schedules, team information, stats, goals and coach updates.' },
  { label: 'Parent Portal', hint: 'Live game tracking, locations, payments, registrations and communication.' },
]
