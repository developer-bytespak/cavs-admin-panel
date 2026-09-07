import React from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Select } from './Field'

/** One filter row above everything it scopes — never inside a chart card. */
export function FilterBar({
  search = '', onSearch, placeholder = 'Search…', children, right, className, active, onClear,
}: {
  search?: string; onSearch?: (v: string) => void; placeholder?: string
  children?: React.ReactNode; right?: React.ReactNode; className?: string
  active?: number; onClear?: () => void
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white p-2 shadow-card', className)}>
      {onSearch && (
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-ink-4" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            className="h-9 w-full rounded-[9px] border border-transparent bg-[#F4F6F9] pl-9 pr-8 text-[13.5px] text-ink placeholder:text-ink-4 transition-all focus:border-electric focus:bg-white focus:ring-[3px] focus:ring-electric/12 focus:outline-none"
          />
          {search && (
            <button onClick={() => onSearch('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-4 hover:text-ink-2">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <SlidersHorizontal className="mx-1 hidden h-[15px] w-[15px] text-ink-4 sm:block" />
        {children}
        {!!active && onClear && (
          <button onClick={onClear} className="ml-1 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12.5px] font-medium text-royal hover:bg-royal-tint transition-colors">
            <X className="h-3.5 w-3.5" /> Clear {active}
          </button>
        )}
      </div>
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  )
}

export function FilterSelect({
  value, onChange, options, label,
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label: string }) {
  return (
    <Select
      size="sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className={cn('w-auto min-w-[128px] bg-[#F4F6F9] border-transparent', value !== 'all' && 'border-royal/25 bg-royal-tint text-royal font-medium')}
    >
      <option value="all">{label}: All</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </Select>
  )
}
