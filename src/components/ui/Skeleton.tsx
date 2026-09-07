import React from 'react'
import { cn } from '../../lib/utils'

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn('skeleton', className)} style={style} />
}

export function MetricSkeleton() {
  return (
    <div className="card p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-9 w-20" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  )
}

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2.5 h-4 w-44" />
        </div>
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>
      <div className="mt-6 flex items-end gap-2" style={{ height }}>
        {[38, 62, 48, 74, 56, 88, 66, 92, 71, 84, 60, 96].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden" >
      <div className="border-b border-line-soft px-5 py-3.5 flex gap-6">
        {Array.from({ length: cols }).map((_, i) => <Skeleton key={i} className="h-3 flex-1" />)}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="border-b border-line-soft px-5 py-4 flex items-center gap-6 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn('h-3.5 flex-1', c === 0 && 'max-w-[180px]')} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <div className="flex-1">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-2.5 h-3 w-32" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    </div>
  )
}
