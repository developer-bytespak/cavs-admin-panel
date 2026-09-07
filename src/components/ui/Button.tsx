import React from 'react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'dark' | 'danger' | 'arena'
type Size = 'xs' | 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-royal text-white hover:bg-electric active:bg-[#1340B4] shadow-[0_1px_2px_rgba(23,70,199,0.28)]',
  accent: 'bg-orange text-white hover:bg-[#E24F12] active:bg-[#CC4610] shadow-[0_1px_2px_rgba(240,90,26,0.3)]',
  secondary: 'bg-white text-ink border border-line hover:bg-[#FAFBFC] hover:border-[#D9DDE5] active:bg-line-soft',
  ghost: 'bg-transparent text-ink-2 hover:bg-[#EFF1F5] hover:text-ink',
  dark: 'bg-midnight text-white hover:bg-[#141C2E] active:bg-[#0A1120]',
  danger: 'bg-bad text-white hover:bg-[#B7333D]',
  arena: 'bg-white/[0.07] text-white border border-white/12 hover:bg-white/[0.13] hover:border-white/20 backdrop-blur-sm',
}
const SIZES: Record<Size, string> = {
  xs: 'h-7 px-2.5 text-[12px] gap-1.5 rounded-lg',
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'px-3.5 text-[13.5px] gap-2 rounded-[10px]',
  lg: 'h-11 px-5 text-[14px] gap-2 rounded-xl',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: React.ComponentType<{ className?: string }>
  iconRight?: React.ComponentType<{ className?: string }>
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon: Icon, iconRight: IconRight, loading, className, children, disabled, ...rest }, ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium whitespace-nowrap select-none',
        'transition-all duration-150 ease-premium active:scale-[0.985]',
        'disabled:opacity-45 disabled:pointer-events-none',
        size === 'md' && 'h-[38px]',
        SIZES[size], VARIANTS[variant], className
      )}
      {...rest}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 rounded-full border-[1.5px] border-current border-r-transparent animate-spin" />
      ) : Icon ? <Icon className={cn(size === 'xs' ? 'h-3.5 w-3.5' : 'h-4 w-4', 'shrink-0')} /> : null}
      {children}
      {IconRight && <IconRight className={cn(size === 'xs' ? 'h-3.5 w-3.5' : 'h-4 w-4', 'shrink-0')} />}
    </button>
  )
})

export function IconButton({
  icon: Icon, label, className, tone = 'ghost', ...rest
}: { icon: React.ComponentType<{ className?: string }>; label: string; tone?: 'ghost' | 'arena' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-[10px] transition-all duration-150',
        tone === 'ghost' ? 'text-ink-3 hover:bg-[#EFF1F5] hover:text-ink' : 'text-white/70 hover:bg-white/10 hover:text-white',
        className
      )}
      {...rest}
    >
      <Icon className="h-[17px] w-[17px]" />
    </button>
  )
}
