import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Menu, Search } from 'lucide-react'
import { cn, greeting } from '../../lib/utils'
import { useApp } from '../../store/AppStore'
import { RoleSwitcher } from '../overlays/RoleSwitcher'
import { QuickCreate } from '../overlays/QuickCreate'
import { NotificationPanel } from '../overlays/NotificationPanel'
import { Avatar } from '../ui/Avatar'
import { CavsLogo } from '../ui/CavsLogo'
import { LiveDot } from '../ui/Badge'

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const { user, setPaletteOpen, notifications, games, role } = useApp()
  const [notifOpen, setNotifOpen] = useState(false)
  const location = useLocation()
  const unread = notifications.filter((n) => !n.read).length
  const live = games.filter((g) => g.status === 'live').length
  const isDashboard = location.pathname === '/'

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="flex h-[60px] items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="-ml-1 rounded-lg p-2 text-ink-3 transition-colors hover:bg-[#EFF1F5] hover:text-ink lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          {isDashboard ? (
            <>
              <h1 className="truncate font-display text-[19px] font-semibold uppercase leading-none tracking-[0.045em] text-ink">
                {greeting()}, {user.first}
              </h1>
              <p className="mt-0.5 hidden truncate text-[12.5px] text-ink-3 sm:block">
                {role === 'admin' ? "Here's how the Cavs are moving today." : 'Your teams, your schedule, your game day.'}
              </p>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              {/* Carries the brand on mobile, where the sidebar is hidden. */}
              <CavsLogo className="h-[26px] shrink-0" />
              <span className="hidden font-display text-[15px] font-semibold uppercase tracking-[0.05em] text-ink sm:inline">Academy</span>
              {live > 0 && (
                <span className="hidden items-center gap-1.5 rounded-full bg-orange-tint px-2 py-0.5 sm:inline-flex">
                  <LiveDot />
                  <span className="font-display text-[11px] font-semibold uppercase tracking-wider text-[#C24A12]">
                    {live} game{live > 1 ? 's' : ''} live
                  </span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Search */}
        <button
          onClick={() => setPaletteOpen(true)}
          className={cn(
            'group hidden h-[38px] items-center gap-2 rounded-[10px] border border-line bg-white pl-3 pr-2 text-left transition-all duration-150',
            'hover:border-[#D9DDE5] hover:shadow-card md:flex md:w-[248px] lg:w-[300px]'
          )}
        >
          <Search className="h-[15px] w-[15px] shrink-0 text-ink-4" />
          <span className="flex-1 truncate text-[13px] text-ink-4">Search players, teams, games…</span>
          <kbd className="hidden shrink-0 items-center gap-0.5 rounded-md border border-line bg-[#F7F8FA] px-1.5 py-0.5 text-[11px] font-medium text-ink-3 lg:flex">⌘K</kbd>
        </button>
        <button
          onClick={() => setPaletteOpen(true)}
          aria-label="Search"
          className="rounded-lg p-2 text-ink-3 transition-colors hover:bg-[#EFF1F5] hover:text-ink md:hidden"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>

        <QuickCreate />

        <div className="relative">
          <button
            data-notif-trigger
            onClick={() => setNotifOpen((v) => !v)}
            aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
            className="relative flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-line bg-white text-ink-3 transition-all duration-150 hover:border-[#D9DDE5] hover:text-ink hover:shadow-card"
          >
            <Bell className="h-[17px] w-[17px]" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-orange px-1 text-[10px] font-semibold tabular-nums text-white ring-2 ring-canvas">
                {unread}
              </span>
            )}
          </button>
          <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        <div className="hidden sm:block"><RoleSwitcher /></div>
        <div className="sm:hidden"><RoleSwitcher compact /></div>

        <Avatar first={user.first} last={user.last} size="md" className="hidden md:inline-flex" />
      </div>
    </header>
  )
}
