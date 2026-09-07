import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Check, Lock, ShieldCheck, Whistle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useApp } from '../../store/AppStore'
import type { Role } from '../../data/types'

export const FUTURE_ROLES = [
  { key: 'player', label: 'Player', blurb: 'Player experience will include schedules, team information, stats, goals and coach updates.' },
  { key: 'parent', label: 'Parent', blurb: 'Parent experience will include live game tracking, locations, payments, registrations and communication.' },
]

const ACTIVE_ROLES: { key: Role; label: string; blurb: string }[] = [
  { key: 'admin', label: 'Administrator', blurb: 'Full academy oversight — every team, schedule, registration and payment.' },
  { key: 'coach', label: 'Coach', blurb: 'Scoped to assigned teams, their rosters, schedule and live games.' },
]

export function RoleSwitcher({ compact }: { compact?: boolean }) {
  const { role, setRole } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [])

  const current = ACTIVE_ROLES.find((r) => r.key === role)!

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'group flex items-center gap-2 rounded-[10px] border border-line bg-white px-2.5 py-1.5 transition-all duration-150 hover:border-[#D9DDE5] hover:shadow-card',
          open && 'border-[#D9DDE5] shadow-card'
        )}
      >
        <span className={cn('flex h-6 w-6 items-center justify-center rounded-md', role === 'admin' ? 'bg-royal-tint text-royal' : 'bg-orange-tint text-[#C24A12]')}>
          {role === 'admin' ? <ShieldCheck className="h-3.5 w-3.5" /> : <Whistle className="h-3.5 w-3.5" />}
        </span>
        {!compact && (
          <span className="text-left leading-tight">
            <span className="block text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ink-4">Viewing as</span>
            <span className="block text-[12.5px] font-semibold text-ink">{current.label}</span>
          </span>
        )}
        <ChevronDown className={cn('h-3.5 w-3.5 text-ink-4 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.985 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 z-50 mt-2 w-[292px] rounded-xl border border-line bg-white p-1.5 shadow-pop"
          >
            <div className="px-2.5 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.11em] text-ink-4">Available now</div>
            {ACTIVE_ROLES.map((r) => (
              <button
                key={r.key}
                role="menuitem"
                onClick={() => { setRole(r.key); setOpen(false) }}
                className={cn('flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                  role === r.key ? 'bg-royal-tint' : 'hover:bg-[#F5F6F9]')}
              >
                <span className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
                  r.key === 'admin' ? 'bg-white text-royal ring-1 ring-inset ring-[#D5E1FC]' : 'bg-orange-tint text-[#C24A12]')}>
                  {r.key === 'admin' ? <ShieldCheck className="h-3.5 w-3.5" /> : <Whistle className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold text-ink">{r.label}</span>
                    {role === r.key && <Check className="h-3.5 w-3.5 text-royal" />}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] leading-relaxed text-ink-3">{r.blurb}</span>
                </span>
              </button>
            ))}

            <div className="mx-2.5 my-1.5 h-px bg-line-soft" />
            <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-ink-4">Cavs platform roadmap</div>
            {FUTURE_ROLES.map((r) => (
              <div
                key={r.key}
                className="group flex cursor-not-allowed items-start gap-2.5 rounded-lg border border-dashed border-line px-2.5 py-2 opacity-60 mb-1 last:mb-0"
                title={r.blurb}
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#F1F3F7] text-ink-4">
                  <Lock className="h-3 w-3" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-ink-2">{r.label}</span>
                    <span className="rounded-full bg-[#F1F3F7] px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-3">Coming Soon</span>
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-4">{r.blurb}</span>
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
