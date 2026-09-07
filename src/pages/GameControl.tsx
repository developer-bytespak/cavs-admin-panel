import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Minus, Plus, Play, Flag, MapPin, Users, Bell, Radio, ChevronRight, Timer,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { teamById, locationById, rosterOf, staffById } from '../data/mock'
import type { GameStatus } from '../data/types'
import { cn, fmtDate, fmtTime } from '../lib/utils'
import { Button } from '../components/ui/Button'
import { LiveDot } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'

const STATUS_FLOW: { key: GameStatus; label: string }[] = [
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'warmup', label: 'Warm-up' },
  { key: 'live', label: 'Live' },
  { key: 'halftime', label: 'Halftime' },
  { key: 'final', label: 'Final' },
]

export default function GameControl() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { games, adjustScore, setGameStatus, setGameClock, can, toast, user } = useApp()
  const [confirmFinal, setConfirmFinal] = useState(false)

  const game = games.find((g) => g.id === gameId)

  if (!game) {
    return (
      <div className="arena flex min-h-screen items-center justify-center bg-midnight">
        <EmptyState dark title="Game not found" description="This game may have been removed from the schedule."
          action={<Link to="/live"><Button variant="arena">Back to live games</Button></Link>} />
      </div>
    )
  }

  const team = teamById(game.teamId)!
  const loc = locationById(game.locationId)!
  const roster = rosterOf(team.id)
  const coach = staffById(team.coachId)
  const isLive = game.status === 'live'
  const editable = can('control.liveGames')
  const diff = game.score.us - game.score.them

  const periodLabel = game.period > 4 ? `OT${game.period - 4}` : `Q${game.period}`

  return (
    <div className="arena relative min-h-screen overflow-hidden bg-midnight text-white">
      {/* Arena environment */}
      <div className="pointer-events-none fixed inset-0 arena-vignette" />
      <div className="pointer-events-none fixed inset-0 arena-grid opacity-70" />
      <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice" className="pointer-events-none fixed inset-x-0 bottom-0 h-[62%] w-full opacity-[0.09]" aria-hidden="true">
        <g fill="none" stroke="#fff" strokeWidth="1.2">
          <circle cx="600" cy="660" r="300" />
          <circle cx="600" cy="660" r="140" />
          <path d="M0 520h1200" />
          <rect x="450" y="510" width="300" height="240" />
          <path d="M120 300v420M1080 300v420" />
        </g>
      </svg>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1360px] flex-col px-4 py-5 sm:px-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/live')}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-medium text-white/60 transition-colors hover:bg-white/8 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Live games
          </button>
          <div className="flex items-center gap-2.5">
            <span className="hidden text-[11.5px] uppercase tracking-[0.09em] text-white/35 sm:inline">
              {fmtDate(game.date, 'long')} · {fmtTime(game.start)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-2.5 py-1 ring-1 ring-inset ring-white/10">
              <Radio className="h-3 w-3 text-white/50" />
              <span className="text-[11.5px] font-medium text-white/70">Arena Mode</span>
            </span>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="mt-6 flex flex-1 flex-col justify-center">
          <div className="text-center">
            {isLive ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-orange/14 px-3 py-1.5 ring-1 ring-inset ring-orange/30">
                <LiveDot />
                <span className="font-display text-[13px] font-semibold uppercase tracking-[0.2em] text-orange">Live</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3 py-1.5 ring-1 ring-inset ring-white/12">
                <span className="font-display text-[13px] font-semibold uppercase tracking-[0.2em] text-white/70">
                  {STATUS_FLOW.find((s) => s.key === game.status)?.label ?? game.status}
                </span>
              </span>
            )}
          </div>

          <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-start gap-2 sm:gap-8">
            <ScoreSide
              name="Cavs" sub={team.name} score={game.score.us} leading={diff >= 0}
              editable={editable} onAdjust={(n) => adjustScore(game.id, 'us', n)} align="right" accent
            />
            <div className="flex flex-col items-center gap-3 pt-6">
              <span className="font-display text-[13px] font-semibold uppercase tracking-[0.2em] text-white/25">VS</span>
              <span className="h-16 w-px bg-gradient-to-b from-transparent via-white/16 to-transparent sm:h-28" />
              {diff !== 0 && (
                <span className="rounded-md bg-white/[0.06] px-2 py-0.5 font-display text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">
                  {diff > 0 ? '+' : ''}{diff}
                </span>
              )}
            </div>
            <ScoreSide
              name={game.opponent.split(' ')[0]} sub={game.opponent} score={game.score.them} leading={diff <= 0}
              editable={editable} onAdjust={(n) => adjustScore(game.id, 'them', n)} align="left"
            />
          </div>

          {/* Clock */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 backdrop-blur-sm">
              <button
                disabled={!editable || game.period <= 1}
                onClick={() => setGameClock(game.id, game.period - 1, game.clock)}
                aria-label="Previous period"
                className="rounded-md p-1 text-white/45 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-25 disabled:hover:bg-transparent"
              ><Minus className="h-3.5 w-3.5" /></button>
              <span className="font-display text-[20px] font-semibold uppercase tracking-[0.1em] text-white">{periodLabel}</span>
              <button
                disabled={!editable || game.period >= 6}
                onClick={() => setGameClock(game.id, game.period + 1, '08:00')}
                aria-label="Next period"
                className="rounded-md p-1 text-white/45 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-25 disabled:hover:bg-transparent"
              ><Plus className="h-3.5 w-3.5" /></button>
              <span className="mx-1 h-6 w-px bg-white/12" />
              <Timer className="h-4 w-4 text-white/35" />
              <span className="stat text-[26px] leading-none text-orange" style={{ textShadow: '0 0 22px rgba(240,90,26,0.5)' }}>
                {game.clock}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[13px] text-white/50">
              <MapPin className="h-3.5 w-3.5 text-white/30" /> {loc.name}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/40">Game status</span>
              {!editable && <span className="text-[11.5px] text-white/40">View only — your role cannot control games</span>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FLOW.map((s) => (
                <button
                  key={s.key}
                  disabled={!editable}
                  onClick={() => (s.key === 'final' ? setConfirmFinal(true) : setGameStatus(game.id, s.key))}
                  className={cn(
                    'rounded-lg px-3 py-2 text-[12.5px] font-medium transition-all duration-150 disabled:opacity-35',
                    game.status === s.key
                      ? 'bg-orange text-white shadow-glow'
                      : 'bg-white/[0.06] text-white/65 ring-1 ring-inset ring-white/10 hover:bg-white/[0.12] hover:text-white'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.07] pt-4">
              {game.status !== 'live' && game.status !== 'final' && (
                <Button variant="accent" icon={Play} disabled={!editable} onClick={() => setGameStatus(game.id, 'live')}>
                  Start game
                </Button>
              )}
              <Button
                variant="arena" icon={Bell} disabled={!editable}
                onClick={() => toast({ tone: 'success', title: 'Team notified', body: `${roster.length} families received the current score and status.` })}
              >
                Notify team
              </Button>
              {game.status !== 'final' && (
                <Button variant="arena" icon={Flag} disabled={!editable} onClick={() => setConfirmFinal(true)} className="ml-auto">
                  Finalize game
                </Button>
              )}
              <Link to={`/teams/${team.id}`} className="ml-auto">
                <Button variant="arena" icon={Users} iconRight={ChevronRight}>Roster</Button>
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-4 sm:grid-cols-4">
              <ArenaStat label="Division" value={team.division} />
              <ArenaStat label="Record" value={`${team.record.w}–${team.record.l}`} />
              <ArenaStat label="Roster" value={`${roster.length} players`} />
              <ArenaStat label="Head coach" value={coach ? `${coach.first} ${coach.last}` : '—'} />
            </div>
          </div>

          {/* Score log */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/40">Scoring timeline</span>
              <span className="text-[11px] text-white/35">Updated by {user.first}</span>
            </div>
            <div className="max-h-[196px] space-y-0 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {game.log.length === 0 && (
                  <p className="py-8 text-center text-[12.5px] text-white/35">
                    No scoring yet. Every point you add appears here with the clock.
                  </p>
                )}
                {game.log.map((l) => (
                  <motion.div
                    key={l.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 border-b border-white/[0.05] py-2 last:border-0"
                  >
                    <span className="stat w-[52px] shrink-0 text-[13px] text-white/45">{l.clock}</span>
                    <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', l.team === 'us' ? 'bg-orange' : 'bg-white/35')} />
                    <span className="flex-1 truncate text-[13px] text-white/85">{l.label}</span>
                    <span className="shrink-0 font-display text-[11px] uppercase tracking-[0.09em] text-white/35">Q{l.period}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11.5px] text-white/28">
          Score, status and clock changes sync to every coach and administrator viewing this game.
        </p>
      </div>

      {/* Finalize confirmation */}
      <AnimatePresence>
        {confirmFinal && (
          <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmFinal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-md rounded-2xl border border-white/12 bg-[#0C1424] p-6 shadow-arena"
            >
              <h2 className="font-display text-[20px] font-semibold uppercase tracking-[0.05em] text-white">Finalize game?</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">
                The final score will be locked at <strong className="stat text-white">{game.score.us}–{game.score.them}</strong> and
                published to everyone following {team.name}.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="arena" onClick={() => setConfirmFinal(false)}>Cancel</Button>
                <Button
                  variant="accent" icon={Flag}
                  onClick={() => {
                    setGameStatus(game.id, 'final')
                    setConfirmFinal(false)
                    toast({ tone: 'success', title: 'Game finalized', body: `${team.name} ${game.score.us}–${game.score.them} ${game.opponent}. Result published.` })
                  }}
                >Finalize</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ScoreSide({
  name, sub, score, leading, editable, onAdjust, align, accent,
}: {
  name: string; sub: string; score: number; leading: boolean; editable: boolean
  onAdjust: (n: number) => void; align: 'left' | 'right'; accent?: boolean
}) {
  return (
    <div className={cn(align === 'right' ? 'text-right' : 'text-left')}>
      <div className={cn('font-display text-[15px] font-semibold uppercase tracking-[0.15em] sm:text-[18px]', accent ? 'text-orange' : 'text-white/60')}>
        {name}
      </div>
      <div className="mt-0.5 truncate text-[11.5px] font-medium uppercase tracking-[0.08em] text-white/35">{sub}</div>
      <div
        className={cn('stat mt-1 text-[74px] leading-[0.84] tabular-nums transition-colors duration-300 sm:text-[104px]', leading ? 'text-white' : 'text-white/50')}
        style={leading ? { textShadow: '0 0 44px rgba(255,255,255,0.14)' } : undefined}
      >
        {score}
      </div>
      <div className={cn('mt-3 flex gap-1.5', align === 'right' ? 'justify-end' : 'justify-start')}>
        {[-1, 1, 2, 3].map((n) => (
          <button
            key={n}
            disabled={!editable}
            onClick={() => onAdjust(n)}
            aria-label={`${n > 0 ? 'Add' : 'Remove'} ${Math.abs(n)} point${Math.abs(n) > 1 ? 's' : ''} for ${name}`}
            className={cn(
              'flex h-9 min-w-[38px] items-center justify-center rounded-lg text-[13px] font-semibold transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:active:scale-100',
              n < 0
                ? 'bg-white/[0.05] text-white/45 ring-1 ring-inset ring-white/8 hover:bg-white/[0.1] hover:text-white'
                : n === 1
                  ? 'bg-white/[0.08] text-white ring-1 ring-inset ring-white/12 hover:bg-white/[0.16]'
                  : 'bg-orange/85 text-white hover:bg-orange'
            )}
          >
            {n > 0 ? `+${n}` : '−1'}
          </button>
        ))}
      </div>
    </div>
  )
}

function ArenaStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.11em] text-white/35">{label}</div>
      <div className="mt-1 truncate text-[13.5px] font-medium text-white/90">{value}</div>
    </div>
  )
}
