import React, { useMemo, useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'
import { EmptyState } from './EmptyState'
import { TableSkeleton } from './Skeleton'

export interface Column<T> {
  key: string
  header: React.ReactNode
  render: (row: T) => React.ReactNode
  sortValue?: (row: T) => string | number
  width?: string
  align?: 'left' | 'right' | 'center'
  hideBelow?: 'sm' | 'md' | 'lg'
}

export function DataTable<T extends { id: string }>({
  rows, columns, onRowClick, rowActions, empty, loading, stickyHeader = true, dense, initialSort,
  className, footer, pageSize = 25,
}: {
  rows: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
  rowActions?: (row: T) => React.ReactNode
  empty?: { title: string; description?: string; action?: React.ReactNode }
  loading?: boolean
  stickyHeader?: boolean
  dense?: boolean
  initialSort?: { key: string; dir: 'asc' | 'desc' }
  className?: string
  footer?: React.ReactNode
  /** Rows per page. Pass 0 to render every row. */
  pageSize?: number
}) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(initialSort ?? null)
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a), bv = col.sortValue!(b)
      const r = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sort.dir === 'asc' ? r : -r
    })
  }, [rows, sort, columns])

  const pageCount = pageSize > 0 ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1
  /* Filtering down to fewer pages must never strand the viewer on an empty one. */
  const safePage = Math.min(page, pageCount - 1)
  const visible = pageSize > 0 ? sorted.slice(safePage * pageSize, safePage * pageSize + pageSize) : sorted

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null))

  const hideCls = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' }

  if (loading) return <TableSkeleton cols={columns.length} />

  return (
    <div className={cn('card overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
            <tr className="bg-[#FBFCFD]">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  style={{ width: c.width }}
                  className={cn(
                    'border-b border-line px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 whitespace-nowrap',
                    c.align === 'right' && 'text-right', c.align === 'center' && 'text-center',
                    c.hideBelow && hideCls[c.hideBelow]
                  )}
                >
                  {c.sortValue ? (
                    <button
                      onClick={() => toggleSort(c.key)}
                      className={cn('group inline-flex items-center gap-1 hover:text-ink transition-colors', c.align === 'right' && 'flex-row-reverse')}
                    >
                      {c.header}
                      {sort?.key === c.key
                        ? (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3 text-royal" /> : <ArrowDown className="h-3 w-3 text-royal" />)
                        : <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />}
                    </button>
                  ) : c.header}
                </th>
              ))}
              {rowActions && <th scope="col" className="border-b border-line px-4 py-2.5 w-[1%]" />}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter') onRowClick(row) } : undefined}
                className={cn(
                  'group border-b border-line-soft last:border-0 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-[#FAFBFD] focus:bg-[#F5F8FE] focus:outline-none'
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      'px-4 align-middle text-[13px] text-ink-2', dense ? 'py-2.5' : 'py-3',
                      c.align === 'right' && 'text-right', c.align === 'center' && 'text-center',
                      c.hideBelow && hideCls[c.hideBelow]
                    )}
                  >
                    {c.render(row)}
                  </td>
                ))}
                {rowActions && (
                  <td className={cn('px-4 text-right whitespace-nowrap', dense ? 'py-2.5' : 'py-3')} onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                      {rowActions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length === 0 && (
        <EmptyState compact title={empty?.title ?? 'Nothing to show'} description={empty?.description} action={empty?.action} />
      )}
      {sorted.length > 0 && (footer || pageCount > 1) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft bg-[#FBFCFD] px-4 py-2.5">
          <span className="text-[12px] text-ink-3">{footer}</span>
          {pageCount > 1 && (
            <nav className="flex items-center gap-1" aria-label="Table pages">
              <button
                onClick={() => setPage(Math.max(0, safePage - 1))}
                disabled={safePage === 0}
                aria-label="Previous page"
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-white hover:text-ink disabled:opacity-35 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-1.5 text-[12px] tabular-nums text-ink-3">
                {safePage * pageSize + 1}–{Math.min(sorted.length, (safePage + 1) * pageSize)} of {sorted.length}
              </span>
              <button
                onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
                disabled={safePage >= pageCount - 1}
                aria-label="Next page"
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-white hover:text-ink disabled:opacity-35 disabled:hover:bg-transparent"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  )
}
