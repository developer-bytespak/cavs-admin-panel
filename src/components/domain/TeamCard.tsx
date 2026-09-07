import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, Users } from 'lucide-react'
import { cn, fmtTime, relativeDay } from '../../lib/utils'
import type { Team, GameEvent, PracticeEvent } from '../../data/types'
import { staffById, locationById } from '../../data/mock'
import { TeamCrest } from '../ui/Avatar'
import { LiveDot } from '../ui/Badge'

export function TeamCard({
  team, nextGame, nextPractice, live, featured,
}: { team: Team; nextGame?: GameEvent; nextPractice?: PracticeEvent; live?: boolean; featured?: boolean }) {
  const coach = staffById(team.coachId)
  const full = team.roster.length >= team.capacity

  return (
    <Link
      to={`/teams/${team.id}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-card transition-all duration-200 ease-premium',
        'hover:-translate-y-0.5 hover:border-[#DDE1E9] hover:shadow-lift'
      )}
    >
      {/* court geometry — team colour, kept faint */}
      <svg viewBox="0 0 320 120" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-0 h-[120px] w-full opacity-[0.055]" aria-hidden="true">
        <g fill="none" stroke={team.color} strokeWidth="1.2">
          <circle cx="270" cy="14" r="62" />
          <circle cx="270" cy="14" r="30" />
          <path d="M0 46h320" />
        </g>
      </svg>

      <div className="relative flex items-start gap-3 p-4 pb-3">
        <TeamCrest short={team.short} color={team.color} size={featured ? 'lg' : 'md'} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-[17px] font-semibold uppercase tracking-[0.035em] text-ink">{team.name}</h3>
            {live && <LiveDot />}
          </div>
          <p className="mt-0.5 truncate text-[12.5px] text-ink-3">
            {team.roster.length} players · Coach {coach?.last}
          </p>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-4 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-0.5" />
      </div>

      <div className="relative grid grid-cols-2 gap-px border-y border-line-soft bg-line-soft">
        <div className="bg-card px-4 py-3">
          <div className="eyebrow">Attendance</div>
          <div className="stat mt-1 text-[22px] leading-none text-ink">{team.attendance}%</div>
        </div>
        <div className="bg-card px-4 py-3">
          <div className="eyebrow">Record</div>
          <div className="stat mt-1 text-[22px] leading-none text-ink">{team.record.w}–{team.record.l}</div>
        </div>
      </div>

      <div className="relative flex-1 space-y-2 p-4">
        <div className="flex items-start gap-2.5">
          <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-orange" />
          <div className="min-w-0 flex-1">
            <div className="eyebrow">Next game</div>
            <div className="mt-0.5 truncate text-[13px] font-medium text-ink">
              {nextGame ? `vs ${nextGame.opponent}` : 'No game scheduled'}
            </div>
            {nextGame && (
              <div className="text-[12px] text-ink-3">
                {relativeDay(nextGame.date)} · {fmtTime(nextGame.start)} · {locationById(nextGame.locationId)?.name}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-royal" />
          <div className="min-w-0 flex-1">
            <div className="eyebrow">Next practice</div>
            <div className="mt-0.5 truncate text-[13px] font-medium text-ink">
              {nextPractice ? nextPractice.focus : 'No practice scheduled'}
            </div>
            {nextPractice && (
              <div className="text-[12px] text-ink-3">
                {relativeDay(nextPractice.date)} · {fmtTime(nextPractice.start)} · {locationById(nextPractice.locationId)?.name}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-between gap-3 border-t border-line-soft px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-3">
          <Users className="h-3.5 w-3.5 text-ink-4" />
          <span className="tabular-nums">{team.roster.length}/{team.capacity}</span>
          {full && <span className="font-medium text-orange">Full</span>}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-3">
          <CalendarDays className="h-3.5 w-3.5 text-ink-4" />
          {team.ageGroup} · {team.division}
        </span>
      </div>
    </Link>
  )
}
