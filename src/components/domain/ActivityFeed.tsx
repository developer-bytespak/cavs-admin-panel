import { ClipboardList, CalendarClock, Radio, CreditCard, UserPlus } from 'lucide-react'
import { cn } from '../../lib/utils'
import { activity } from '../../data/mock'
import { Avatar } from '../ui/Avatar'

const KIND = {
  registration: { icon: ClipboardList, cls: 'bg-[#F1ECFD] text-[#5B3FC4]' },
  schedule: { icon: CalendarClock, cls: 'bg-royal-tint text-royal' },
  game: { icon: Radio, cls: 'bg-orange-tint text-[#C24A12]' },
  payment: { icon: CreditCard, cls: 'bg-good-tint text-good' },
  roster: { icon: UserPlus, cls: 'bg-[#F1F3F7] text-ink-2' },
}

export function ActivityFeed({ limit = 6 }: { limit?: number }) {
  return (
    <ol className="space-y-0">
      {activity.slice(0, limit).map((a, i) => {
        const k = KIND[a.kind]
        const [first, last] = a.actor.split(' ')
        return (
          <li key={a.id} className={cn('flex gap-3 py-3', i > 0 && 'border-t border-line-soft')}>
            <span className="relative shrink-0">
              {a.actor === 'System' ? (
                <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', k.cls)}>
                  <k.icon className="h-4 w-4" />
                </span>
              ) : (
                <>
                  <Avatar first={first} last={last ?? ''} size="sm" />
                  <span className={cn('absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-md ring-2 ring-white', k.cls)}>
                    <k.icon className="h-2.5 w-2.5" />
                  </span>
                </>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] leading-snug text-ink-2">
                <span className="font-medium text-ink">{a.actor}</span> {a.action}{' '}
                <span className="font-medium text-ink">{a.target}</span>
              </span>
              <span className="mt-0.5 block text-[11.5px] text-ink-4">{a.time}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
