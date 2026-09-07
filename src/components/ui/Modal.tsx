import React, { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { IconButton } from './Button'

export function Modal({
  open, onClose, title, eyebrow, children, footer, width = 'md',
}: {
  open: boolean; onClose: () => void; title?: React.ReactNode; eyebrow?: string
  children: React.ReactNode; footer?: React.ReactNode; width?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4 sm:p-6 md:p-10">
          <motion.div
            className="fixed inset-0 bg-[#0B1F45]/28 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.98, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.985, y: 4 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn('relative w-full rounded-2xl bg-white shadow-pop border border-line my-auto', widths[width])}
          >
            {(title || eyebrow) && (
              <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-line-soft">
                <div>
                  {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
                  <h2 className="text-[17px] font-semibold tracking-[-0.014em] text-ink">{title}</h2>
                </div>
                <IconButton icon={X} label="Close" onClick={onClose} className="-mr-1.5 -mt-1" />
              </div>
            )}
            <div className="px-6 py-5">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-line-soft bg-[#FAFBFC] px-6 py-3.5 rounded-b-2xl">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
