import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Search, Users, Shield, CalendarDays, ClipboardList, CreditCard, Radio,
  CornerDownLeft, ArrowUp, ArrowDown, Plus, Megaphone, MapPin, BarChart3,
} from 'lucide-react'
import { cn, fmtDate, fmtTime } from '../../lib/utils'
import { useApp } from '../../store/AppStore'
import { teams, locations, teamById, playerName } from '../../data/mock'

interface Result {
  id: string
  title: string
  subtitle: string
  group: 'Players' | 'Teams' | 'Games' | 'Registrations' | 'Payments' | 'Locations' | 'Actions' | 'Go to'
  icon: React.ComponentType<{ className?: string }>
  to: string
  accent?: boolean
}

const QUICK_LINKS: Result[] = [
  { id: 'go-dash', title: 'Dashboard', subtitle: 'Academy overview', group: 'Go to', icon: BarChart3, to: '/' },
  { id: 'go-sched', title: 'Schedule', subtitle: 'Calendar, games and practices', group: 'Go to', icon: CalendarDays, to: '/schedule' },
  { id: 'go-live', title: 'Live Games', subtitle: 'Score control and game status', group: 'Go to', icon: Radio, to: '/live' },
  { id: 'go-regs', title: 'Registrations', subtitle: 'Pipeline and intake review', group: 'Go to', icon: ClipboardList, to: '/registrations' },
  { id: 'go-pay', title: 'Payments', subtitle: 'Collections and dues', group: 'Go to', icon: CreditCard, to: '/payments' },
  { id: 'go-comm', title: 'Communications', subtitle: 'Broadcasts and announcements', group: 'Go to', icon: Megaphone, to: '/communications' },
]

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, players, games, registrations, payments, role, visibleTeamIds, openCreate } = useApp()
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (paletteOpen) { setQ(''); setIdx(0); setTimeout(() => inputRef.current?.focus(), 40) }
  }, [paletteOpen])

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase()
    const scoped = <T extends { teamId?: string | null }>(list: T[]) =>
      role === 'admin' ? list : list.filter((x) => !x.teamId || visibleTeamIds.includes(x.teamId))

    if (!term) {
      return [
        { id: 'act-game', title: 'Create a game', subtitle: 'Schedule a new matchup', group: 'Actions', icon: Plus, to: '#create:game', accent: true },
        { id: 'act-practice', title: 'Create a practice', subtitle: 'Add a session to the calendar', group: 'Actions', icon: Plus, to: '#create:practice' },
        { id: 'act-ann', title: 'Send an announcement', subtitle: 'Broadcast to a team or the academy', group: 'Actions', icon: Plus, to: '#create:announcement' },
        ...QUICK_LINKS.filter((l) => role === 'admin' || !['/registrations', '/payments'].includes(l.to)),
      ]
    }

    const out: Result[] = []
    for (const p of scoped(players)) {
      if (playerName(p).toLowerCase().includes(term)) {
        out.push({
          id: p.id, title: playerName(p),
          subtitle: `Player · ${p.teamId ? teamById(p.teamId)!.name : 'Academy Program'}`,
          group: 'Players', icon: Users, to: `/players/${p.id}`,
        })
      }
      if (out.length > 26) break
    }
    for (const t of teams) {
      if ((role === 'admin' || visibleTeamIds.includes(t.id)) && t.name.toLowerCase().includes(term)) {
        out.push({ id: t.id, title: t.name, subtitle: `Team · ${t.roster.length} players · ${t.division}`, group: 'Teams', icon: Shield, to: `/teams/${t.id}` })
      }
    }
    for (const g of scoped(games)) {
      const label = `${teamById(g.teamId)?.name} vs ${g.opponent}`
      if (label.toLowerCase().includes(term)) {
        out.push({
          id: g.id, title: label,
          subtitle: `Game · ${fmtDate(g.date, 'short')} · ${fmtTime(g.start)}${g.status === 'live' ? ' · LIVE' : ''}`,
          group: 'Games', icon: g.status === 'live' ? Radio : CalendarDays,
          to: g.status === 'live' ? `/live/${g.id}` : `/schedule?event=${g.id}`,
          accent: g.status === 'live',
        })
      }
    }
    if (role === 'admin') {
      for (const r of registrations) {
        if (r.playerName.toLowerCase().includes(term)) {
          out.push({ id: r.id, title: `${r.playerName} Evaluation`, subtitle: `Registration · ${r.program} · ${r.stage}`, group: 'Registrations', icon: ClipboardList, to: `/registrations/${r.id}` })
        }
      }
      for (const p of payments) {
        if (p.family.toLowerCase().includes(term) || p.playerName.toLowerCase().includes(term)) {
          out.push({ id: p.id, title: p.family, subtitle: `Payment · ${p.program} · ${p.status}`, group: 'Payments', icon: CreditCard, to: `/payments/${p.id}` })
        }
        if (out.length > 40) break
      }
    }
    for (const l of locations) {
      if (l.name.toLowerCase().includes(term)) {
        out.push({ id: l.id, title: l.name, subtitle: `Location · ${l.city}`, group: 'Locations', icon: MapPin, to: `/locations/${l.id}` })
      }
    }
    return out.slice(0, 24)
  }, [q, players, games, registrations, payments, role, visibleTeamIds])

  const go = (r: Result) => {
    setPaletteOpen(false)
    if (r.to.startsWith('#create:')) { openCreate(r.to.split(':')[1] as never); return }
    navigate(r.to)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(results.length - 1, i + 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)) }
    if (e.key === 'Enter' && results[idx]) { e.preventDefault(); go(results[idx]) }
    if (e.key === 'Escape') setPaletteOpen(false)
  }

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [idx])

  let lastGroup = ''

  return (
    <AnimatePresence>
      {paletteOpen && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[10vh]">
          <motion.div
            className="fixed inset-0 bg-[#0B1F45]/32 backdrop-blur-[3px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}
            onClick={() => setPaletteOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.985, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[588px] overflow-hidden rounded-2xl border border-line bg-white shadow-pop"
            onKeyDown={onKeyDown}
            role="dialog" aria-modal="true" aria-label="Search and commands"
          >
            <div className="flex items-center gap-3 border-b border-line-soft px-4">
              <Search className="h-[18px] w-[18px] shrink-0 text-ink-4" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setIdx(0) }}
                placeholder="Search players, teams, games…"
                className="h-[54px] w-full border-0 bg-transparent text-[15px] text-ink placeholder:text-ink-4 focus:outline-none focus:ring-0"
                aria-label="Search players, teams, games"
              />
              <kbd className="hidden shrink-0 rounded-md border border-line bg-[#F7F8FA] px-1.5 py-0.5 text-[11px] font-medium text-ink-3 sm:block">ESC</kbd>
            </div>

            <div ref={listRef} className="max-h-[400px] overflow-y-auto p-1.5">
              {results.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <p className="text-[13.5px] font-medium text-ink">No matches for “{q}”</p>
                  <p className="mt-1 text-[12.5px] text-ink-3">Try a player name, a team, a venue or a game.</p>
                </div>
              )}
              {results.map((r, i) => {
                const showGroup = r.group !== lastGroup
                lastGroup = r.group
                return (
                  <React.Fragment key={`${r.group}-${r.id}`}>
                    {showGroup && (
                      <div className="px-2.5 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-ink-4">{r.group}</div>
                    )}
                    <button
                      data-active={i === idx}
                      onMouseEnter={() => setIdx(i)}
                      onClick={() => go(r)}
                      className={cn('flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                        i === idx ? 'bg-royal-tint' : 'hover:bg-[#F6F7F9]')}
                    >
                      <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                        r.accent ? 'bg-orange-tint text-[#C24A12]' : i === idx ? 'bg-white text-royal ring-1 ring-inset ring-[#D5E1FC]' : 'bg-[#F1F3F7] text-ink-3')}>
                        <r.icon className="h-[15px] w-[15px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-ink">{r.title}</span>
                        <span className="block truncate text-[12px] text-ink-3">{r.subtitle}</span>
                      </span>
                      {i === idx && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-royal" />}
                    </button>
                  </React.Fragment>
                )
              })}
            </div>

            <div className="flex items-center gap-4 border-t border-line-soft bg-[#FBFCFD] px-4 py-2 text-[11.5px] text-ink-3">
              <span className="flex items-center gap-1"><ArrowUp className="h-3 w-3" /><ArrowDown className="h-3 w-3" /> Navigate</span>
              <span className="flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> Open</span>
              <span className="ml-auto flex items-center gap-1">
                <kbd className="rounded border border-line bg-white px-1 py-px font-medium">⌘</kbd>
                <kbd className="rounded border border-line bg-white px-1 py-px font-medium">K</kbd>
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
