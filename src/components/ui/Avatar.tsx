import { cn, initials, avatarTint } from '../../lib/utils'

export function Avatar({
  first, last, jersey, size = 'md', className, ring,
}: { first: string; last: string; jersey?: number; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; className?: string; ring?: boolean }) {
  const [bg, fg] = avatarTint(`${first}${last}`)
  const sizes = {
    xs: 'h-6 w-6 text-[10px] rounded-md',
    sm: 'h-8 w-8 text-[11.5px] rounded-lg',
    md: 'text-[12.5px] rounded-[10px]',
    lg: 'h-12 w-12 text-[15px] rounded-xl',
    xl: 'h-16 w-16 text-[20px] rounded-2xl',
  }
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center font-semibold tracking-tight select-none',
        size === 'md' && 'h-[38px] w-[38px]',
        sizes[size], ring && 'ring-2 ring-white', className
      )}
      style={{ background: bg, color: fg }}
      aria-hidden="true"
    >
      {initials(first, last)}
      {jersey !== undefined && size !== 'xs' && size !== 'sm' && (
        <span className="absolute -bottom-1 -right-1 rounded-md bg-midnight px-1 font-display text-[10px] font-semibold leading-[14px] text-white tabular-nums">
          {jersey}
        </span>
      )}
    </span>
  )
}

export function AvatarStack({ people, max = 4, size = 'sm' }: { people: { first: string; last: string }[]; max?: number; size?: 'xs' | 'sm' }) {
  const shown = people.slice(0, max)
  const rest = people.length - shown.length
  return (
    <div className="flex items-center">
      {shown.map((p, i) => (
        <span key={i} className={cn(i > 0 && '-ml-2')}>
          <Avatar first={p.first} last={p.last} size={size} ring />
        </span>
      ))}
      {rest > 0 && (
        <span className={cn(
          '-ml-2 inline-flex items-center justify-center rounded-lg bg-[#EDEFF3] font-semibold text-ink-3 ring-2 ring-white tabular-nums',
          size === 'xs' ? 'h-6 w-6 text-[10px] rounded-md' : 'h-8 w-8 text-[11px]'
        )}>+{rest}</span>
      )}
    </div>
  )
}

export function TeamCrest({ short, color, size = 'md' }: { short: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-8 w-8 text-[11px] rounded-lg', md: 'h-11 w-11 text-[13px] rounded-xl', lg: 'h-14 w-14 text-[16px] rounded-2xl' }
  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden font-display font-semibold text-white tracking-wide', sizes[size])}
      style={{ background: `linear-gradient(145deg, ${color} 0%, ${color}D9 55%, ${color}A6 100%)` }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 44 44" className="absolute inset-0 h-full w-full opacity-[0.22]">
        <circle cx="22" cy="46" r="19" fill="none" stroke="white" strokeWidth="1.2" />
        <circle cx="22" cy="46" r="9" fill="none" stroke="white" strokeWidth="1.2" />
        <path d="M0 30h44" stroke="white" strokeWidth="1" />
      </svg>
      <span className="relative">{short}</span>
    </span>
  )
}
