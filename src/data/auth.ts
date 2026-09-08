import { staff } from './mock'
import type { Role } from './types'

/**
 * Demo sign-in accounts, derived from the same staff records the rest of the
 * product uses — so the person you sign in as is a real record in the system,
 * not a separate fiction. No backend, no password hashing: this is a prototype
 * gate, and the credentials below are intentionally public.
 */
export const DEMO_PASSWORD = 'cavs2026'

export interface DemoAccount {
  staffId: string
  email: string
  password: string
  name: string
  title: string
  role: Role
  scope: string
}

function accountFor(staffId: string, role: Role, scope: string): DemoAccount {
  const person = staff.find((s) => s.id === staffId)!
  return {
    staffId,
    email: person.email,
    password: DEMO_PASSWORD,
    name: `${person.first} ${person.last}`,
    title: person.role,
    role,
    scope,
  }
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  accountFor('st-darryl', 'admin', 'Full academy oversight'),
  accountFor('st-marcus', 'coach', '14U Elite · 13U Elite'),
]

/** Case-insensitive lookup; the password check is a plain compare by design. */
export function authenticate(email: string, password: string): DemoAccount | null {
  const found = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
  if (!found || found.password !== password) return null
  return found
}

export const AUTH_STORAGE_KEY = 'cavs.auth.v1'

export interface StoredSession { email: string; role: Role; name: string }

/** Storage can throw in private windows — never let that break the app shell. */
export function readSession(): StoredSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredSession
    return parsed?.email && parsed?.role ? parsed : null
  } catch {
    return null
  }
}

export function writeSession(session: StoredSession | null) {
  if (typeof window === 'undefined') return
  try {
    if (session) window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
    else window.localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    /* ignore — the session simply will not persist */
  }
}
