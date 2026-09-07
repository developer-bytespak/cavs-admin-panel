import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarClock, ClipboardList, CreditCard, Radio, UserPlus, CheckCheck } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useApp } from '../../store/AppStore'
import { EmptyState } from '../ui/EmptyState'

const KIND = {
  schedule: { icon: CalendarClock, cls: 'bg-royal-tint text-royal' },
  registration: { icon: ClipboardList, cls: 'bg-[#F1ECFD] text-[#5B3FC4]' },
  payment: { icon: CreditCard, cls: 'bg-warn-tint text-warn' },
  game: { icon: Radio, cls: 'bg-orange-tint text-[#C24A12]' },
  roster: { icon: UserPlus, cls: 'bg-good-tint text-good' },
}

export function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notifications, markAllRead, markRead } = useApp()
  const ref = useRef<HTMLDivElement>(null)
  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (ref.current && !ref.current.contains(t) && !t.closest('[data-notif-trigger]')) onClose()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -6, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.985 }}
          transition={{ duration: 0.17, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[368px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-white shadow-pop"
        >
          <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[13.5px] font-semibold text-ink">Notifications</h3>
              {unread > 0 && (
                <span className="rounded-full bg-orange-tint px-1.5 py-px text-[10.5px] font-semibold tabular-nums text-[#C24A12]">{unread} new</span>
              )}
            </div>
            <button
              onClick={markAllRead}
              disabled={unread === 0}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] font-medium text-royal transition-colors hover:bg-royal-tint disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 && (
              <EmptyState compact title="You're all caught up" description="New academy activity will appear here." />
            )}
            {notifications.map((n) => {
              const k = KIND[n.kind]
              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={cn('flex w-full gap-3 border-b border-line-soft px-4 py-3 text-left transition-colors last:border-0 hover:bg-[#FAFBFD]',
                    !n.read && 'bg-[#FCFDFF]')}
                >
                  <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', k.cls)}>
                    <k.icon className="h-[15px] w-[15px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-2">
                      <span className={cn('flex-1 text-[13px] leading-snug', n.read ? 'font-medium text-ink-2' : 'font-semibold text-ink')}>{n.title}</span>
                      {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange" />}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-3">{n.body}</span>
                    <span className="mt-1 block text-[11px] text-ink-4">{n.time}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
