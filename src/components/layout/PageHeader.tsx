import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

export function PageHeader({
  eyebrow, title, description, actions, breadcrumbs, meta, className,
}: {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  breadcrumbs?: { label: string; to?: string }[]
  meta?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-5', className)}>
      {breadcrumbs && (
        <nav aria-label="Breadcrumb" className="mb-2.5 flex items-center gap-1 text-[12px] text-ink-3">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="h-3 w-3 text-ink-4" />}
              {b.to ? (
                <Link to={b.to} className="rounded transition-colors hover:text-royal">{b.label}</Link>
              ) : (
                <span className="text-ink-2">{b.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
          <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[25px]">{title}</h1>
          {description && <p className="mt-1.5 max-w-[62ch] text-[13.5px] leading-relaxed text-ink-3">{description}</p>}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export function MetaItem({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'default' | 'accent' }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-[11.5px] uppercase tracking-[0.06em] text-ink-4">{label}</span>
      <span className={cn('text-[13px] font-semibold', tone === 'accent' ? 'text-orange' : 'text-ink')}>{value}</span>
    </span>
  )
}
