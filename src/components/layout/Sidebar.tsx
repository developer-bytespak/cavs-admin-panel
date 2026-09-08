import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LifeBuoy, ChevronLeft, X, Lock, LogOut } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useApp } from '../../store/AppStore'
import { PRIMARY_NAV, TEAM_TOOLS_NAV, MANAGE_NAV, FUTURE_NAV, forRole, type NavItem } from './nav'
import { LiveDot } from '../ui/Badge'
import { Avatar } from '../ui/Avatar'
import { CavsLogo } from '../ui/CavsLogo'

function NavRow({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const { games, registrations } = useApp()
  const location = useLocation()
  const liveCount = games.filter((g) => g.status === 'live').length
  const pendingRegs = registrations.filter((r) => r.stage === 'new' || r.stage === 'review').length
  const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={cn(
        'group relative flex items-center gap-3 rounded-[10px] px-2.5 py-2 text-[13.5px] transition-colors duration-150',
        active ? 'text-white' : 'text-white/55 hover:text-white/90'
      )}
      title={collapsed ? item.label : undefined}
    >
      {active && (
        <motion.span
          layoutId="nav-pill"
          className="absolute inset-0 rounded-[10px] bg-gradient-to-r from-royal/28 to-white/[0.06] ring-1 ring-inset ring-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          transition={{ type: 'spring', stiffness: 460, damping: 38 }}
        />
      )}
      {active && (
        <motion.span
          layoutId="nav-accent"
          className="absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-full bg-orange"
          transition={{ type: 'spring', stiffness: 460, damping: 38 }}
        />
      )}
      <item.icon className={cn('relative h-[17px] w-[17px] shrink-0 transition-colors', active ? 'text-white' : 'text-white/45 group-hover:text-white/75')} />
      {!collapsed && <span className="relative truncate font-medium">{item.label}</span>}
      {!collapsed && item.badge === 'live' && liveCount > 0 && (
        <span className="relative ml-auto flex items-center gap-1.5">
          <LiveDot />
          <span className="font-display text-[11px] font-semibold uppercase tracking-wider text-orange">Live</span>
        </span>
      )}
      {!collapsed && item.badge === 'count' && pendingRegs > 0 && (
        <span className="relative ml-auto rounded-full bg-white/10 px-1.5 py-px text-[10.5px] font-semibold tabular-nums text-white/70">
          {pendingRegs}
        </span>
      )}
      {collapsed && item.badge === 'live' && liveCount > 0 && (
        <span className="absolute right-1.5 top-1.5"><LiveDot /></span>
      )}
    </NavLink>
  )
}

function Group({ label, items, collapsed, onNavigate, first }: { label?: string; items: NavItem[]; collapsed: boolean; onNavigate?: () => void; first?: boolean }) {
  if (!items.length) return null
  return (
    <div>
      {label && !collapsed && (
        <div className={cn('px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/28',
          first ? 'pt-1' : 'pt-4')}>{label}</div>
      )}
      {label && collapsed && <div className="mx-2.5 my-3 h-px bg-white/8" />}
      <div className="space-y-0.5">
        {items.map((i) => <NavRow key={`${i.to}-${i.label}`} item={i} collapsed={collapsed} onNavigate={onNavigate} />)}
      </div>
    </div>
  )
}

export function Sidebar({
  collapsed, onToggle, mobileOpen, onCloseMobile,
}: { collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onCloseMobile: () => void }) {
  const { role, user, lastSync, syncing, signOut } = useApp()
  const navigate = useNavigate()

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[#0B1F45]/40 backdrop-blur-[2px] lg:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-midnight transition-[width,transform] duration-300 ease-premium',
          'lg:translate-x-0 lg:z-30',
          collapsed ? 'w-[68px]' : 'w-[236px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* court-line texture */}
        <div className="pointer-events-none absolute inset-0 arena-grid opacity-60" />
        <div className="pointer-events-none absolute -bottom-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full border border-white/[0.05]" />
        <div className="pointer-events-none absolute -bottom-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full border border-white/[0.04]" />

        {/* Brand */}
        <div className={cn('relative flex h-[60px] shrink-0 items-center gap-2.5 border-b border-white/[0.06]', collapsed ? 'justify-center px-2' : 'px-4')}>
          {/* The mark is a wordmark reading CAVS, so it carries the name itself
              and the label beneath stays subordinate rather than repeating it. */}
          <CavsLogo className={cn('shrink-0', collapsed ? 'h-[26px]' : 'h-[30px]')} />
          {!collapsed && (
            <div className="min-w-0 border-l border-white/[0.10] pl-2.5">
              <div className="font-display text-[12px] font-semibold uppercase leading-none tracking-[0.14em] text-white">Academy</div>
              <div className="mt-1 text-[9.5px] font-medium uppercase tracking-[0.13em] text-white/40">Command Center</div>
            </div>
          )}
          <button
            onClick={onCloseMobile}
            className="ml-auto rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className={cn('relative flex-1 overflow-y-auto py-3', collapsed ? 'px-2' : 'px-3')}>
          <Group first label="Core" items={forRole(PRIMARY_NAV, role)} collapsed={collapsed} onNavigate={onCloseMobile} />
          <Group label="Team Tools" items={forRole(TEAM_TOOLS_NAV, role)} collapsed={collapsed} onNavigate={onCloseMobile} />
          <Group label="Management" items={forRole(MANAGE_NAV, role)} collapsed={collapsed} onNavigate={onCloseMobile} />

          {/* Future scope — visible, deliberately inert */}
          {!collapsed && (
            <div>
              <div className="px-2.5 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/28">
                Coming Soon
              </div>
              <div className="space-y-0.5">
                {FUTURE_NAV.map((f) => (
                  <div
                    key={f.label}
                    title={f.hint}
                    aria-disabled="true"
                    className="flex cursor-not-allowed items-center gap-3 rounded-[10px] border border-dashed border-white/[0.08] px-2.5 py-2 opacity-45"
                  >
                    <Lock className="h-[15px] w-[15px] shrink-0 text-white/35" />
                    <span className="truncate text-[12.5px] font-medium text-white/55">{f.label}</span>
                    <span className="ml-auto shrink-0 rounded-full bg-white/[0.07] px-1.5 py-px text-[8.5px] font-semibold uppercase tracking-[0.07em] text-white/45">
                      Soon
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Sync status — the real-time design language, quietly */}
        {!collapsed && (
          <div className="relative mx-3 mb-2 rounded-[10px] border border-white/[0.07] bg-white/[0.03] px-2.5 py-2">
            <div className="flex items-center gap-2">
              <span className={cn('h-1.5 w-1.5 rounded-full', syncing ? 'bg-orange animate-live-pulse' : 'bg-[#3FC08A]')} />
              <span className="text-[11px] font-medium text-white/70">{syncing ? 'Syncing changes…' : 'All systems synced'}</span>
            </div>
            <div className="mt-0.5 pl-3.5 text-[10.5px] text-white/35 tabular-nums">
              Updated {lastSync.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={cn('relative shrink-0 border-t border-white/[0.06] py-2.5', collapsed ? 'px-2' : 'px-3')}>
          <NavLink
            to="/help"
            className={cn('flex items-center gap-3 rounded-[10px] px-2.5 py-2 text-[13px] text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/85',
              collapsed && 'justify-center')}
            title={collapsed ? 'Help & Support' : undefined}
          >
            <LifeBuoy className="h-[17px] w-[17px] shrink-0" />
            {!collapsed && <span className="font-medium">Help &amp; Support</span>}
          </NavLink>
          <NavLink
            to="/settings/profile"
            className={cn('mt-0.5 flex items-center gap-2.5 rounded-[10px] px-2 py-2 transition-colors hover:bg-white/[0.06]',
              collapsed && 'justify-center px-0')}
            title={collapsed ? `${user.first} ${user.last}` : undefined}
          >
            <Avatar first={user.first} last={user.last} size="sm" />
            {!collapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-medium text-white/90">{user.first} {user.last}</span>
                <span className="block truncate text-[11px] text-white/40">{user.role}</span>
              </span>
            )}
            {!collapsed && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Sign out"
                title="Sign out"
                onClick={(e) => { e.preventDefault(); signOut(); navigate('/signin', { replace: true }) }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); signOut(); navigate('/signin', { replace: true }) } }}
                className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/35 transition-colors hover:bg-white/10 hover:text-white/80"
              >
                <LogOut className="h-[15px] w-[15px]" />
              </span>
            )}
          </NavLink>
        </div>

        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          className="absolute -right-3 top-[70px] hidden h-6 w-6 items-center justify-center rounded-full border border-line bg-white text-ink-3 shadow-card transition-all hover:text-ink hover:shadow-lift lg:flex"
        >
          <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform duration-300', collapsed && 'rotate-180')} />
        </button>
      </aside>
    </>
  )
}
