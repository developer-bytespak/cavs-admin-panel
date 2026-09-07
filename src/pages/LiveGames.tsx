import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Radio, ArrowRight, MapPin, Clock, Trophy, Plus } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { teamById, locationById, d } from '../data/mock'
import type { GameEvent } from '../data/types'
import { cn, fmtDate, fmtTime, relativeDay, timeUntil } from '../lib/utils'
import { stagger } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Tabs } from '../components/ui/Tabs'
import { StatusBadge, LiveDot, Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { TeamCrest } from '../components/ui/Avatar'
import { GameForm } from '../components/overlays/CreateModals'

export default function LiveGames() {
  const { games, role, visibleTeamIds, can, setGameStatus } = useApp()
  const [tab, setTab] = useState('live')
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()
  const today = d(0)

  const scoped = useMemo(
    () => (role === 'admin' ? games : games.filter((g) => visibleTeamIds.includes(g.teamId))),
    [games, role, visibleTeamIds]
  )

  const live = scoped.filter((g) => ['live', 'halftime', 'warmup'].includes(g.status))
  const upcoming = scoped.filter((g) => g.status === 'scheduled' && g.date >= today)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
  const completed = scoped.filter((g) => g.status === 'final')
    .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start))

  const rows = tab === 'live' ? live : tab === 'upcoming' ? upcoming : completed

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={stagger.item}>
        <PageHeader
          eyebrow="Game day"
          title="Live Games"
          description="Scores, status and game control. Every change here reaches coaches, staff and — in the next phase — families instantly."
          actions={can('edit.schedule') && <Button variant="accent" icon={Plus} onClick={() => setCreating(true)}>Create game</Button>}
          meta={
            <>
              <span className="flex items-center gap-2">
                {live.length > 0 ? <LiveDot /> : <span className="h-2 w-2 rounded-full bg-ink-4/40" />}
                <span className="text-[13px] text-ink-2">
                  <strong className="font-semibold text-ink tabular-nums">{live.length}</strong> live now
                </span>
              </span>
              <span className="text-[13px] text-ink-2">
                <strong className="font-semibold text-ink tabular-nums">{upcoming.filter((g) => g.date === today).length}</strong> more today
              </span>
              <span className="text-[13px] text-ink-2">
                <strong className="font-semibold text-ink tabular-nums">{completed.length}</strong> completed this season
              </span>
            </>
          }
        />
      </motion.div>

      {/* Live rail — the page's memorable moment */}
      {live.length > 0 && (
        <motion.section variants={stagger.item} className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {live.map((g) => <LiveScoreboard key={g.id} game={g} />)}
        </motion.section>
      )}

      <motion.div variants={stagger.item}>
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { key: 'live', label: 'Live', count: live.length },
            { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
            { key: 'completed', label: 'Completed', count: completed.length },
          ]}
        />
      </motion.div>

      <motion.div variants={stagger.item} className="space-y-2.5">
        {rows.length === 0 && (
          <Card>
            <EmptyState
              icon={tab === 'live' ? Radio : tab === 'upcoming' ? Clock : Trophy}
              title={tab === 'live' ? 'No live games right now' : tab === 'upcoming' ? 'No upcoming games scheduled' : 'No completed games yet'}
              description={
                tab === 'live'
                  ? 'When a game tips off, its scoreboard and controls appear here for every coach and administrator.'
                  : tab === 'upcoming'
                    ? 'Schedule a game and it will show up here with arrival times and venue details.'
                    : 'Final scores land here the moment a game is finalized.'
              }
              action={tab !== 'completed' && can('edit.schedule') ? <Button variant="accent" icon={Plus} onClick={() => setCreating(true)}>Create game</Button> : undefined}
            />
          </Card>
        )}

        {rows.map((g) => {
          const t = teamById(g.teamId)!
          const loc = locationById(g.locationId)!
          const until = timeUntil(g.date, g.start)
          return (
            <div
              key={g.id}
              className={cn(
                'group flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift',
                g.status === 'live' ? 'border-[#FBDCC9]' : 'border-line'
              )}
            >
              <TeamCrest short={t.short} color={t.color} />
              <div className="min-w-[190px] flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[16px] font-semibold uppercase tracking-[0.035em] text-ink">{t.name}</span>
                  <span className="text-[12px] text-ink-4">vs</span>
                  <span className="truncate text-[14px] font-medium text-ink-2">{g.opponent}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-ink-3">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-ink-4" />{relativeDay(g.date)} · {fmtTime(g.start)}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-ink-4" />{loc.name}</span>
                  <Badge tone="neutral" dot={false} size="xs">{g.gameType}</Badge>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {g.status !== 'scheduled' && g.status !== 'canceled' ? (
                  <div className="text-center">
                    <div className="stat text-[26px] leading-none text-ink">{g.score.us}<span className="mx-1.5 text-ink-4">–</span>{g.score.them}</div>
                    {['live', 'halftime'].includes(g.status) && (
                      <div className="mt-1 font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-orange">
                        Q{g.period} · {g.clock}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-right">
                    <div className="text-[12px] text-ink-3">{until ? 'Tips off in' : 'Scheduled'}</div>
                    <div className="stat text-[17px] leading-none text-ink">{until ?? fmtDate(g.date, 'short')}</div>
                  </div>
                )}
                <StatusBadge status={g.status} />
                {can('control.liveGames') ? (
                  <Button
                    size="sm"
                    variant={g.status === 'live' ? 'accent' : 'secondary'}
                    iconRight={ArrowRight}
                    onClick={() => {
                      if (g.status === 'scheduled') setGameStatus(g.id, 'warmup')
                      navigate(`/live/${g.id}`)
                    }}
                  >
                    {g.status === 'live' ? 'Control' : g.status === 'final' ? 'Recap' : 'Open'}
                  </Button>
                ) : (
                  <Link to={`/live/${g.id}`}><Button size="sm" variant="secondary" iconRight={ArrowRight}>View</Button></Link>
                )}
              </div>
            </div>
          )
        })}
      </motion.div>

      <GameForm open={creating} onClose={() => setCreating(false)} />
    </motion.div>
  )
}

function LiveScoreboard({ game }: { game: GameEvent }) {
  const t = teamById(game.teamId)!
  const loc = locationById(game.locationId)!
  return (
    <Link
      to={`/live/${game.id}`}
      className="arena group relative overflow-hidden rounded-2xl bg-midnight p-5 text-white shadow-arena transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div className="pointer-events-none absolute inset-0 arena-vignette" />
      <div className="pointer-events-none absolute inset-0 arena-grid opacity-60" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <LiveDot />
            <span className="font-display text-[11.5px] font-semibold uppercase tracking-[0.16em] text-orange">
              {game.status === 'halftime' ? 'Halftime' : game.status === 'warmup' ? 'Warm-up' : 'Live'}
            </span>
          </span>
          <span className="text-[11px] uppercase tracking-[0.08em] text-white/40">{loc.name}</span>
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="text-right">
            <div className="font-display text-[12px] uppercase tracking-[0.12em] text-white/55">{t.short}</div>
            <div className="stat mt-0.5 text-[44px] leading-none text-white">{game.score.us}</div>
          </div>
          <span className="font-display text-[11px] uppercase tracking-[0.16em] text-white/25">vs</span>
          <div>
            <div className="truncate font-display text-[12px] uppercase tracking-[0.12em] text-white/55">{game.opponent.split(' ')[0]}</div>
            <div className="stat mt-0.5 text-[44px] leading-none text-white/70">{game.score.them}</div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-3">
          <span className="font-display text-[13px] font-semibold uppercase tracking-[0.1em] text-white/70">
            Q{game.period} · <span className="text-orange">{game.clock}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/70 transition-colors group-hover:text-orange">
            Game control <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
