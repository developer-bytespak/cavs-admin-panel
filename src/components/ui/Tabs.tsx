import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

export interface TabItem { key: string; label: string; count?: number }

/** Underline tabs with an animated indicator — used for page-level sections. */
export function Tabs({
  items, value, onChange, className, size = 'md',
}: { items: TabItem[]; value: string; onChange: (k: string) => void; className?: string; size?: 'sm' | 'md' }) {
  const id = React.useId()
  return (
    <div className={cn('flex items-center gap-1 border-b border-line overflow-x-auto no-scrollbar', className)} role="tablist">
      {items.map((t) => {
        const active = t.key === value
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={cn(
              'relative shrink-0 px-3 pb-2.5 pt-1 font-medium transition-colors duration-150',
              size === 'sm' ? 'text-[12.5px]' : 'text-[13.5px]',
              active ? 'text-ink' : 'text-ink-3 hover:text-ink-2'
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              {t.label}
              {t.count !== undefined && (
                <span className={cn(
                  'rounded-full px-1.5 py-px text-[10.5px] font-semibold tabular-nums',
                  active ? 'bg-royal-tint text-royal' : 'bg-[#F1F3F7] text-ink-3'
                )}>{t.count}</span>
              )}
            </span>
            {active && (
              <motion.span
                layoutId={`tab-underline-${id}`}
                className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-royal"
                transition={{ type: 'spring', stiffness: 480, damping: 38 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Compact pill switcher — used for chart ranges, view modes, filters. */
export function Segmented({
  items, value, onChange, className, size = 'md',
}: { items: { key: string; label: string; icon?: React.ComponentType<{ className?: string }> }[]; value: string; onChange: (k: string) => void; className?: string; size?: 'sm' | 'md' }) {
  const id = React.useId()
  return (
    <div className={cn('inline-flex items-center gap-0.5 rounded-[10px] bg-[#F1F3F7] p-[3px]', className)}>
      {items.map((t) => {
        const active = t.key === value
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            aria-pressed={active}
            className={cn(
              'relative rounded-lg font-medium transition-colors duration-150 inline-flex items-center gap-1.5',
              size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3 py-1.5 text-[12.5px]',
              active ? 'text-ink' : 'text-ink-3 hover:text-ink-2'
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-lg bg-white shadow-[0_1px_2px_rgba(17,19,24,0.07)]"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            {t.icon && <t.icon className="relative h-3.5 w-3.5" />}
            <span className="relative">{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}
