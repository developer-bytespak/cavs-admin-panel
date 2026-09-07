import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react'
import { useApp } from '../../store/AppStore'
import { cn } from '../../lib/utils'

const TONE = {
  success: { icon: CheckCircle2, ring: 'text-good', bar: 'bg-good' },
  info: { icon: Info, ring: 'text-royal', bar: 'bg-royal' },
  warn: { icon: AlertTriangle, ring: 'text-warn', bar: 'bg-warn' },
  error: { icon: XCircle, ring: 'text-bad', bar: 'bg-bad' },
}

export function ToastHost() {
  const { toasts, dismissToast } = useApp()
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[90] flex w-[352px] max-w-[calc(100vw-2.5rem)] flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const { icon: Icon, ring, bar } = TONE[t.tone]
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              className="pointer-events-auto relative flex gap-3 overflow-hidden rounded-xl border border-line bg-white p-3.5 pl-4 shadow-pop"
            >
              <span className={cn('absolute inset-y-0 left-0 w-[3px]', bar)} />
              <Icon className={cn('mt-px h-[18px] w-[18px] shrink-0', ring)} />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold text-ink leading-snug">{t.title}</p>
                {t.body && <p className="mt-0.5 text-[12.5px] text-ink-3 leading-relaxed">{t.body}</p>}
              </div>
              <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="-mr-1 -mt-1 h-6 w-6 shrink-0 rounded-md text-ink-4 hover:bg-line-soft hover:text-ink-2 transition-colors">
                <X className="mx-auto h-3.5 w-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
