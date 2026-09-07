import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Sparkline } from '../charts/Sparkline'
import { useCountUp, useInViewOnce } from '../charts/chart-kit'

export function MetricCard({
  label, value, suffix, context, trend, spark, sparkColor = '#1746C7', to, accent, id, decimals = 0,
}: {
  label: string
  value: number
  suffix?: string
  context?: React.ReactNode
  trend?: { dir: 'up' | 'down'; text: string }
  spark?: number[]
  sparkColor?: string
  to?: string
  accent?: boolean
  id: string
  decimals?: number
}) {
  const [ref, seen] = useInViewOnce<HTMLDivElement>('0px')
  const n = useCountUp(value, seen, 1000)
  const Wrapper = (to ? Link : 'div') as React.ElementType

  return (
    <Wrapper
      ref={ref}
      {...(to ? { to } : {})}
      className={cn(
        'group relative block overflow-hidden rounded-2xl border bg-card p-5 shadow-card transition-all duration-200 ease-premium',
        to && 'hover:-translate-y-0.5 hover:shadow-lift hover:border-[#DDE1E9]',
        accent ? 'border-[#FBDCC9]' : 'border-line'
      )}
    >
      {accent && <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-orange via-[#F58A5A] to-transparent" />}
      <div className="flex items-start justify-between gap-3">
        <span className="eyebrow">{label}</span>
        {to && <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-ink-4 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-0.5" />}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-1">
          <span className={cn('stat text-[38px] leading-none', accent ? 'text-orange' : 'text-ink')}>
            {n.toFixed(decimals)}
          </span>
          {suffix && <span className="stat text-[20px] leading-none text-ink-3">{suffix}</span>}
        </div>
        {spark && <Sparkline id={id} values={spark} color={sparkColor} width={84} height={30} />}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        {trend && (
          <span className={cn('inline-flex items-center gap-1 text-[12.5px] font-medium', trend.dir === 'up' ? 'text-good' : 'text-bad')}>
            {trend.dir === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {trend.text}
          </span>
        )}
        {context && <span className="text-[12.5px] text-ink-3">{context}</span>}
      </div>
    </Wrapper>
  )
}

export function InsightCard({
  value, label, tone = 'neutral', icon: Icon, to, sub,
}: {
  value: string
  label: string
  tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'accent'
  icon?: React.ComponentType<{ className?: string }>
  to?: string
  sub?: string
}) {
  const tones = {
    neutral: 'text-ink border-line',
    good: 'text-good border-[#CDEBDF]',
    warn: 'text-warn border-[#F3E3C0]',
    bad: 'text-bad border-[#F5D5D7]',
    accent: 'text-orange border-[#FBDCC9]',
  }
  const Wrapper = (to ? Link : 'div') as React.ElementType
  return (
    <Wrapper
      {...(to ? { to } : {})}
      className={cn(
        'group flex items-start gap-3 rounded-xl border bg-card p-3.5 shadow-card transition-all duration-200',
        to && 'hover:-translate-y-0.5 hover:shadow-lift',
        tones[tone]
      )}
    >
      {Icon && (
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/[0.04]">
          <Icon className="h-[15px] w-[15px]" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="stat block text-[21px] leading-none">{value}</span>
        <span className="mt-1.5 block text-[12.5px] leading-snug text-ink-2">{label}</span>
        {sub && <span className="mt-1 block text-[11.5px] text-ink-4">{sub}</span>}
      </span>
      {to && <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-ink-4 opacity-0 transition-opacity group-hover:opacity-100" />}
    </Wrapper>
  )
}
