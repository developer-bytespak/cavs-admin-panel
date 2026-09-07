import React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

const BASE =
  'w-full rounded-[10px] border border-line bg-white px-3 text-[13.5px] text-ink placeholder:text-ink-4 ' +
  'transition-all duration-150 hover:border-[#D9DDE5] focus:border-electric focus:ring-[3px] focus:ring-electric/12 focus:outline-none ' +
  'disabled:bg-line-soft disabled:text-ink-4'

export function Label({ children, hint, htmlFor, required }: { children: React.ReactNode; hint?: string; htmlFor?: string; required?: boolean }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-[12.5px] font-medium text-ink-2">
        {children}{required && <span className="text-orange ml-0.5">*</span>}
      </label>
      {hint && <span className="text-[11.5px] text-ink-4">{hint}</span>}
    </div>
  )
}

export function Field({ label, hint, required, children, className }: { label?: React.ReactNode; hint?: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      {label && <Label hint={hint} required={required}>{label}</Label>}
      {children}
    </div>
  )
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(BASE, 'h-[38px]', className)} {...rest} />
  }
)

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={cn(BASE, 'py-2.5 leading-relaxed resize-y min-h-[80px]', className)} {...rest} />
  }
)

export function Select({
  className, children, size = 'md', ...rest
}: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> & { size?: 'sm' | 'md' }) {
  return (
    <div className="relative">
      <select
        className={cn(BASE, 'appearance-none pr-8 cursor-pointer', size === 'sm' ? 'h-8 text-[13px]' : 'h-[38px]', className)}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-4" />
    </div>
  )
}

export function Switch({
  checked, onChange, label, description, disabled,
}: { checked: boolean; onChange: (v: boolean) => void; label?: React.ReactNode; description?: string; disabled?: boolean }) {
  return (
    <label className={cn('flex items-start gap-3', disabled ? 'opacity-50' : 'cursor-pointer group')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200 ease-premium',
          checked ? 'bg-royal' : 'bg-[#D5D9E1] group-hover:bg-[#C8CDD7]'
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-premium',
            checked ? 'translate-x-[19px]' : 'translate-x-[3px]'
          )}
        />
      </button>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-[13px] font-medium text-ink">{label}</span>}
          {description && <span className="block text-[12px] text-ink-3 leading-relaxed mt-0.5">{description}</span>}
        </span>
      )}
    </label>
  )
}

export function Checkbox({
  checked, onChange, label, className,
}: { checked: boolean; onChange: (v: boolean) => void; label?: React.ReactNode; className?: string }) {
  return (
    <label className={cn('flex items-center gap-2.5 cursor-pointer select-none group', className)}>
      <span
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(!checked) } }}
        className={cn(
          'flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[5px] border transition-all duration-150',
          checked ? 'border-royal bg-royal' : 'border-[#CDD2DB] bg-white group-hover:border-[#AEB5C1]'
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 6.2 4.8 8.5 9.5 3.5" />
          </svg>
        )}
      </span>
      {label && <span className="text-[13px] text-ink-2">{label}</span>}
    </label>
  )
}
