import React, { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { IconButton } from './Button'

export function SideDrawer({
  open, onClose, title, eyebrow, children, footer, width = 'md', tone = 'light',
}: {
  open: boolean; onClose: () => void; title?: React.ReactNode; eyebrow?: React.ReactNode
  children: React.ReactNode; footer?: React.ReactNode; width?: 'sm' | 'md' | 'lg'; tone?: 'light' | 'dark'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-lg' }
  const dark = tone === 'dark'

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[65] flex justify-end">
          <motion.div
            className="absolute inset-0 bg-[#0B1F45]/22 backdrop-blur-[1px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }} onClick={onClose}
          />
          <motion.aside
            role="dialog" aria-modal="true"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 40, mass: 0.9 }}
            className={cn(
              'relative flex h-full w-full flex-col shadow-pop border-l',
              widths[width],
              dark ? 'bg-midnight border-white/10 arena' : 'bg-white border-line'
            )}
          >
            <div className={cn('flex items-start justify-between gap-4 px-5 py-4 border-b shrink-0', dark ? 'border-white/8' : 'border-line-soft')}>
              <div className="min-w-0">
                {eyebrow && <div className={cn('eyebrow mb-1', dark && 'text-white/45')}>{eyebrow}</div>}
                <h2 className={cn('text-[16.5px] font-semibold tracking-[-0.014em] leading-snug', dark ? 'text-white' : 'text-ink')}>{title}</h2>
              </div>
              <IconButton icon={X} label="Close" onClick={onClose} tone={dark ? 'arena' : 'ghost'} className="-mr-1.5 -mt-1" />
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && (
              <div className={cn('shrink-0 border-t px-5 py-3.5 flex items-center gap-2', dark ? 'border-white/8 bg-white/[0.02]' : 'border-line-soft bg-[#FAFBFC]')}>
                {footer}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
