import React, { useId, useState } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Auth-surface input. Taller and softer than the in-app `Input` on purpose —
 * the sign-in screen is a standalone moment, not a dense admin form — but it
 * uses the same tokens so it still reads as the same product.
 */
export const AuthInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: React.ReactNode }
>(function AuthInput({ label, error, hint, className, type = 'text', id, ...rest }, ref) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`
  const isPassword = type === 'password'
  const [reveal, setReveal] = useState(false)

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="text-[12px] font-semibold uppercase tracking-[0.07em] text-ink-3">
          {label}
        </label>
        {hint}
      </div>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={isPassword && reveal ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-[48px] w-full rounded-xl border bg-white px-3.5 text-[14px] text-ink placeholder:text-ink-4',
            'transition-all duration-150 focus:outline-none',
            isPassword && 'pr-11',
            error
              ? 'border-bad focus:border-bad focus:ring-[3px] focus:ring-bad/12'
              : 'border-[#DFE3EA] hover:border-[#CBD1DB] focus:border-electric focus:ring-[3px] focus:ring-electric/14',
            className
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? 'Hide password' : 'Show password'}
            aria-pressed={reveal}
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-4 transition-colors hover:bg-[#F1F3F7] hover:text-ink-2"
          >
            {reveal ? <EyeOff className="h-[17px] w-[17px]" /> : <Eye className="h-[17px] w-[17px]" />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-bad">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
})

/**
 * The Cavs mark. Uses the padding-trimmed copy of the supplied logo: the original
 * carries ~40px of transparent space top and bottom, so a third of any box it sits
 * in renders empty and the mark reads far smaller than its height suggests.
 * Height is driven by the caller's className with `w-auto`, so the aspect ratio is
 * never fought over. Intrinsic dimensions are declared to avoid layout shift.
 */
export function CavsLogo({ className }: { className?: string }) {
  return (
    <img
      src="/cavs-logo-mark.avif"
      alt="Cavs Youth Basketball"
      width={192}
      height={123}
      className={cn('block w-auto select-none', className)}
      draggable={false}
    />
  )
}

/**
 * Half-court geometry behind the branding panel. Decorative only, and kept at
 * the same 3–5% opacity the rest of the product uses for court detail.
 */
export function CourtBackdrop({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 760 620"
      preserveAspectRatio="xMidYMax slice"
      className={cn('pointer-events-none absolute inset-x-0 bottom-0 h-[86%] w-full', className)}
      aria-hidden="true"
    >
      {/* Curves only — long straight sidelines read as panel borders, not court. */}
      <g fill="none" stroke="currentColor" strokeWidth="1.4">
        {/* centre circle breaking the top edge */}
        <circle cx="380" cy="86" r="122" />
        <circle cx="380" cy="86" r="44" strokeOpacity="0.65" />
        {/* the key and free-throw circle */}
        <rect x="288" y="486" width="184" height="180" rx="1" strokeOpacity="0.55" />
        <circle cx="380" cy="486" r="74" />
        {/* three-point arc */}
        <path d="M150 666V524a230 230 0 0 1 460 0v142" strokeOpacity="0.85" />
      </g>
    </svg>
  )
}
