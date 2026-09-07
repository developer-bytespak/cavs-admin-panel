import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Trophy, Dumbbell, UserPlus, Shield, Megaphone } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useApp, type CreateKind } from '../../store/AppStore'

const ITEMS: { key: CreateKind; label: string; hint: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean; accent?: boolean }[] = [
  { key: 'game', label: 'Game', hint: 'Schedule a matchup', icon: Trophy, accent: true },
  { key: 'practice', label: 'Practice', hint: 'Add a training session', icon: Dumbbell },
  { key: 'player', label: 'Player', hint: 'Add to the academy roster', icon: UserPlus, adminOnly: true },
  { key: 'team', label: 'Team', hint: 'Create a new age group', icon: Shield, adminOnly: true },
  { key: 'announcement', label: 'Announcement', hint: 'Broadcast to families', icon: Megaphone },
]

export function QuickCreate() {
  const { openCreate, role } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [])

  const items = ITEMS.filter((i) => role === 'admin' || !i.adminOnly)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'inline-flex h-[38px] items-center gap-1.5 rounded-[10px] bg-orange px-3 text-[13.5px] font-semibold text-white',
          'shadow-[0_1px_2px_rgba(240,90,26,0.32)] transition-all duration-150 hover:bg-[#E24F12] active:scale-[0.985]'
        )}
      >
        <Plus className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-45')} />
        <span className="hidden sm:inline">Create</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.985 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 z-50 mt-2 w-[264px] rounded-xl border border-line bg-white p-1.5 shadow-pop"
          >
            <div className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-ink-4">Quick create</div>
            {items.map((i) => (
              <button
                key={i.key}
                role="menuitem"
                onClick={() => { openCreate(i.key); setOpen(false) }}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-[#F5F6F9]"
              >
                <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                  i.accent ? 'bg-orange-tint text-[#C24A12]' : 'bg-[#F1F3F7] text-ink-3')}>
                  <i.icon className="h-[15px] w-[15px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-medium text-ink">{i.label}</span>
                  <span className="block text-[11.5px] text-ink-3">{i.hint}</span>
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
