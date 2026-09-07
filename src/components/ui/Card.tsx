import React from 'react'
import { cn } from '../../lib/utils'

export function Card({
  className, children, hover, padded = true, ...rest
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean; padded?: boolean }) {
  return (
    <div className={cn('card', hover && 'card-hover', padded && 'p-5', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({
  title, eyebrow, action, subtitle, className,
}: { title: React.ReactNode; eyebrow?: string; subtitle?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h3 className="text-[15px] font-semibold tracking-[-0.011em] text-ink leading-snug">{title}</h3>
        {subtitle && <p className="mt-1 text-[12.5px] text-ink-3 leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  )
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-3">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.07em] text-ink-3">{children}</h2>
      {action}
    </div>
  )
}
