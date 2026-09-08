import type { InvoiceStatus } from '../../data/types'
import { Badge, type Tone } from '../ui/Badge'

/** One vocabulary for invoice state across tables, drawers and cards. */
const MAP: Record<InvoiceStatus, { tone: Tone; label: string; dot: boolean }> = {
  paid: { tone: 'good', label: 'Paid', dot: true },
  partial: { tone: 'blue', label: 'Partial', dot: true },
  upcoming: { tone: 'neutral', label: 'Upcoming', dot: true },
  overdue: { tone: 'orange', label: 'Overdue', dot: true },
  failed: { tone: 'bad', label: 'Failed', dot: true },
  refunded: { tone: 'neutral', label: 'Refunded', dot: false },
  credit: { tone: 'good', label: 'Credit', dot: false },
}

export function InvoiceStatusBadge({ status, size = 'sm' }: { status: InvoiceStatus; size?: 'xs' | 'sm' }) {
  const m = MAP[status] ?? MAP.upcoming
  return <Badge tone={m.tone} dot={m.dot} size={size}>{m.label}</Badge>
}

export const INVOICE_STATUS_OPTIONS = (Object.keys(MAP) as InvoiceStatus[]).map((k) => ({ value: k, label: MAP[k].label }))
