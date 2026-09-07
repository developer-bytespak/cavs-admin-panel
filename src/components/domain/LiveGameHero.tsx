import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Clock } from 'lucide-react'
import { cn, fmtTime, relativeDay, timeUntil } from '../../lib/utils'
import type { GameEvent } from '../../data/types'
import { teamById, locationById } from '../../data/mock'
import { LiveDot } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'

/** The court geometry that makes the scoreboard feel like a venue, not a card. */
function ArenaBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 arena-vignette" />
      <div className="pointer-events-none absolute inset-0 arena-grid opacity-70" />
      <svg viewBox="0 0 600 300" preserveAspectRatio="xMidYMax slice" className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] w-full opacity-[0.12]" aria-hidden="true">
        <g fill="none" stroke="#ffffff" strokeWidth="1">
          <circle cx="300" cy="330" r="150" />
          <circle cx="300" cy="330" r="70" />
          <path d="M0 260h600" />
          <path d="M170 330h260" />
          <rect x="230" y="255" width="140" height="120" />
        </g>
      </svg>
    </>
  )
}

export function LiveGameHero({ game }: { game?: GameEvent }) {
  if (!game) {
    return (
      <section className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-2xl bg-midnight">
        <ArenaBackdrop />
        <div className="relative">
          <EmptyState
            dark
            title="No live games right now"
            description="When a game tips off, the scoreboard takes over this space and updates for everyone watching."
            action={<Link to="/schedule" className="text-[13px] font-medium text-orange hover:underline">View the schedule →</Link>}
          />
        </div>
      </section>
    )
  }

  const team = teamById(game.teamId)!
  const location = locationById(game.locationId)!
  const isLive = game.status === 'live' || game.status === 'halftime'
  const until = timeUntil(game.date, game.start)

  return (
    <section className="arena relative overflow-hidden rounded-2xl bg-midnight text-white shadow-arena">
      <ArenaBackdrop />

      <div className="relative flex h-full flex-col p-5 sm:p-6">
        {/* Status row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {isLive ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-orange/14 px-2.5 py-1 ring-1 ring-inset ring-orange/28">
              <LiveDot />
              <span className="font-display text-[12px] font-semibold uppercase tracking-[0.16em] text-orange">
                {game.status === 'halftime' ? 'Halftime' : 'Live Now'}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-2.5 py-1 ring-1 ring-inset ring-white/12">
              <Clock className="h-3 w-3 text-white/60" />
              <span className="font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-white/75">
                {game.status === 'final' ? 'Final' : `${relativeDay(game.date)} · ${fmtTime(game.start)}`}
              </span>
            </span>
          )}
          <span className="text-[11.5px] font-medium uppercase tracking-[0.08em] text-white/40">
            {game.gameType} · {team.division} Division
          </span>
        </div>

        {/* Scoreboard */}
        <div className="mt-6 grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3 sm:mt-8 sm:gap-6">
          <div className="text-right">
            <div className="font-display text-[13px] font-semibold uppercase tracking-[0.15em] text-white/55 sm:text-[15px]">Cavs</div>
            <div className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-white/35">{team.name}</div>
            <div className={cn('stat mt-1 text-[64px] leading-[0.86] sm:text-[80px]',
              game.score.us >= game.score.them ? 'text-white' : 'text-white/55')}>
              {game.score.us}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 px-1">
            <span className="font-display text-[12px] font-semibold uppercase tracking-[0.18em] text-white/28">VS</span>
            <span className="h-10 w-px bg-gradient-to-b from-transparent via-white/18 to-transparent sm:h-16" />
          </div>

          <div>
            <div className="font-display text-[13px] font-semibold uppercase tracking-[0.15em] text-white/55 sm:text-[15px]">
              {game.opponent.split(' ')[0]}
            </div>
            <div className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-[0.08em] text-white/35">{game.opponent}</div>
            <div className={cn('stat mt-1 text-[64px] leading-[0.86] sm:text-[80px]',
              game.score.them > game.score.us ? 'text-white' : 'text-white/55')}>
              {game.score.them}
            </div>
          </div>
        </div>

        {/* Clock */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center">
          {isLive ? (
            <span className="inline-flex items-baseline gap-2 rounded-lg bg-white/[0.06] px-3 py-1.5 ring-1 ring-inset ring-white/8">
              <span className="font-display text-[15px] font-semibold uppercase tracking-[0.1em] text-white">Q{game.period}</span>
              <span className="text-white/25">·</span>
              <span className="stat text-[19px] leading-none text-orange" style={{ textShadow: '0 0 18px rgba(240,90,26,0.45)' }}>
                {game.clock}
              </span>
            </span>
          ) : (
            <span className="text-[13px] text-white/55">
              {game.status === 'final' ? 'Final score' : until ? `Tips off in ${until}` : `${relativeDay(game.date)} at ${fmtTime(game.start)}`}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-white/55">
            <MapPin className="h-3.5 w-3.5 text-white/35" />
            {location.name}
          </span>
          <Link
            to={`/live/${game.id}`}
            className={cn(
              'group inline-flex items-center gap-2 rounded-[10px] px-3.5 py-2 text-[13px] font-semibold transition-all duration-150 active:scale-[0.985]',
              isLive ? 'bg-orange text-white shadow-glow hover:bg-[#E24F12]' : 'bg-white/[0.08] text-white ring-1 ring-inset ring-white/12 hover:bg-white/[0.14]'
            )}
          >
            {isLive ? 'Open Game Control' : 'Open Game'}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
