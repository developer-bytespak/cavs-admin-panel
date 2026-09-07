import React from 'react'
import { cn } from '../../lib/utils'

/** Half-court illustration used behind every empty state. */
function CourtIllustration({ dark }: { dark?: boolean }) {
  const line = dark ? 'rgba(255,255,255,0.14)' : 'rgba(11,31,69,0.13)'
  const fill = dark ? 'rgba(255,255,255,0.03)' : 'rgba(11,31,69,0.022)'
  return (
    <svg viewBox="0 0 160 104" className="h-[104px] w-[160px]" aria-hidden="true">
      <rect x="1" y="1" width="158" height="102" rx="6" fill={fill} stroke={line} strokeWidth="1" />
      <path d="M80 1v102" stroke={line} strokeWidth="1" strokeDasharray="3 4" />
      <circle cx="80" cy="52" r="16" fill="none" stroke={line} strokeWidth="1" />
      <rect x="1" y="30" width="30" height="44" fill="none" stroke={line} strokeWidth="1" />
      <rect x="129" y="30" width="30" height="44" fill="none" stroke={line} strokeWidth="1" />
      <path d="M31 30a22 22 0 0 1 0 44" fill="none" stroke={line} strokeWidth="1" />
      <path d="M129 30a22 22 0 0 0 0 44" fill="none" stroke={line} strokeWidth="1" />
      <path d="M1 12a52 52 0 0 1 0 80" fill="none" stroke={line} strokeWidth="1" />
      <path d="M159 12a52 52 0 0 0 0 80" fill="none" stroke={line} strokeWidth="1" />
      <circle cx="80" cy="52" r="3.5" fill="#F05A1A" opacity="0.5" />
    </svg>
  )
}

export function EmptyState({
  title, description, action, icon: Icon, dark, compact, className,
}: {
  title: string; description?: string; action?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>; dark?: boolean; compact?: boolean; className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-10 px-6' : 'py-16 px-8', className)}>
      <div className="relative mb-5">
        <CourtIllustration dark={dark} />
        {Icon && (
          <span className={cn(
            'absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border shadow-card',
            dark ? 'bg-midnight border-white/12' : 'bg-white border-line'
          )}>
            <Icon className={cn('h-[19px] w-[19px]', dark ? 'text-white/60' : 'text-ink-3')} />
          </span>
        )}
      </div>
      <h3 className={cn('text-[14.5px] font-semibold tracking-[-0.008em]', dark ? 'text-white' : 'text-ink')}>{title}</h3>
      {description && (
        <p className={cn('mt-1.5 max-w-[360px] text-[13px] leading-relaxed', dark ? 'text-white/50' : 'text-ink-3')}>{description}</p>
      )}
      {action && <div className="mt-5 flex items-center gap-2">{action}</div>}
    </div>
  )
}
