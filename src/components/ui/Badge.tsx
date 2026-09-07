import React from 'react'
import { cn } from '../../lib/utils'

/* One status vocabulary for the whole product — colour never means two things. */
const TONES = {
  neutral: 'bg-[#F1F3F7] text-ink-2 ring-[#E3E6EC]',
  blue: 'bg-royal-tint text-royal ring-[#D5E1FC]',
  orange: 'bg-orange-tint text-[#C24A12] ring-[#FBDCC9]',
  good: 'bg-good-tint text-good ring-[#CDEBDF]',
  warn: 'bg-warn-tint text-warn ring-[#F3E3C0]',
  bad: 'bg-bad-tint text-bad ring-[#F5D5D7]',
  dark: 'bg-midnight text-white ring-transparent',
} as const

export type Tone = keyof typeof TONES

export const STATUS_TONE: Record<string, Tone> = {
  // Games
  scheduled: 'blue', warmup: 'warn', live: 'orange', halftime: 'warn', final: 'neutral', canceled: 'bad',
  // Players / staff
  active: 'good', pending: 'warn', inactive: 'neutral',
  // Registrations
  new: 'blue', review: 'warn', evaluation: 'orange', ready: 'good', completed: 'neutral',
  // Payments
  paid: 'good', overdue: 'bad',
  // Misc
  confirmed: 'good', open: 'warn', maintenance: 'warn', sent: 'good', draft: 'neutral', archived: 'neutral',
  present: 'good', late: 'warn', absent: 'bad', unmarked: 'neutral',
  normal: 'neutral', important: 'blue', urgent: 'orange',
}

const LABELS: Record<string, string> = {
  warmup: 'Warm-up', review: 'In Review', live: 'Live', final: 'Final', unmarked: 'Not marked',
}

export function Badge({
  children, tone = 'neutral', dot, className, size = 'sm',
}: { children: React.ReactNode; tone?: Tone; dot?: boolean; className?: string; size?: 'xs' | 'sm' }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset whitespace-nowrap',
      size === 'xs' ? 'px-1.5 py-0.5 text-[10.5px]' : 'px-2 py-[3px] text-[11.5px]',
      TONES[tone], className
    )}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full bg-current', tone === 'orange' && 'animate-live-pulse')} />}
      {children}
    </span>
  )
}

export function StatusBadge({ status, dot = true, size = 'sm' }: { status: string; dot?: boolean; size?: 'xs' | 'sm' }) {
  const tone = STATUS_TONE[status] ?? 'neutral'
  const label = LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1)
  return <Badge tone={tone} dot={dot} size={size}>{label}</Badge>
}

/* The one place orange is allowed to move. */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn('relative inline-flex h-2 w-2 shrink-0', className)}>
      <span className="absolute inset-0 rounded-full bg-orange animate-ring-pulse" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-orange" />
    </span>
  )
}
