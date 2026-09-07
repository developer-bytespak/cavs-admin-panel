import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Plus, Target } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { teams, developmentLog, SKILLS, FEATURED_PLAYER_ID } from '../data/mock'
import { cn } from '../lib/utils'
import { SERIES } from '../lib/palette'
import { stagger } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Avatar, TeamCrest } from '../components/ui/Avatar'
import { Select } from '../components/ui/Field'
import { ChartCard } from '../components/charts/ChartCard'
import { TrendChart } from '../components/charts/TrendChart'
import { BarCompare } from '../components/charts/BarCompare'

/** Deterministic skill profile for any player without an authored log. */
function profileFor(seed: number) {
  return SKILLS.map((skill, i) => {
    const current = Math.round((6.4 + ((seed * (i + 3)) % 31) / 10) * 10) / 10
    const previous = Math.round((current - ((seed + i) % 9) / 10 + 0.2) * 10) / 10
    return { skill, current: Math.min(9.8, current), previous: Math.max(5.2, previous), note: '' }
  })
}

export default function Development() {
  const { players, role, visibleTeamIds, toast } = useApp()
  const scopedTeams = useMemo(
    () => (role === 'admin' ? teams : teams.filter((t) => visibleTeamIds.includes(t.id))),
    [role, visibleTeamIds]
  )
  const [teamId, setTeamId] = useState(scopedTeams[0]?.id ?? '')
  const roster = useMemo(() => players.filter((p) => p.teamId === teamId), [players, teamId])
  const [playerId, setPlayerId] = useState(() => (roster.some((p) => p.id === FEATURED_PLAYER_ID) ? FEATURED_PLAYER_ID : roster[0]?.id ?? ''))

  const player = players.find((p) => p.id === playerId) ?? roster[0]
  const team = scopedTeams.find((t) => t.id === teamId)

  const entries = useMemo(() => {
    if (!player) return []
    const authored = developmentLog.find((d) => d.playerId === player.id)?.entries
    return authored ?? profileFor(player.jersey + player.age)
  }, [player])

  const history = useMemo(
    () => Array.from({ length: 6 }, (_, i) => {
      const point: Record<string, string | number> = { label: `R${i + 1}` }
      for (const e of entries) {
        point[e.skill] = Math.round((e.previous + ((e.current - e.previous) * i) / 5) * 10) / 10
      }
      return point as { label: string }
    }),
    [entries]
  )

  if (!scopedTeams.length || !player) {
    return <Card><EmptyState icon={Target} title="No players to track yet"
      description="Player development ratings appear once a roster is assigned to you." /></Card>
  }

  const overall = entries.reduce((s, e) => s + e.current, 0) / entries.length
  const growth = entries.reduce((s, e) => s + (e.current - e.previous), 0) / entries.length

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={stagger.item}>
        <PageHeader
          eyebrow="Team tools"
          title="Player Development"
          description="Coach-recorded skill ratings over time — what each player is improving at and where the next block of work goes."
          actions={
            <Button variant="primary" icon={Plus}
              onClick={() => toast({ tone: 'success', title: 'Review logged', body: `A new development review was started for ${player.first} ${player.last}.` })}>
              Log a review
            </Button>
          }
        />
      </motion.div>

      <motion.div variants={stagger.item} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white p-2 shadow-card">
        <span className="pl-1.5 text-[12.5px] font-medium text-ink-2">Team</span>
        <Select value={teamId} onChange={(e) => {
          setTeamId(e.target.value)
          const first = players.find((p) => p.teamId === e.target.value)
          setPlayerId(first?.id ?? '')
        }} className="w-auto min-w-[170px]">
          {scopedTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
        <span className="ml-2 pl-1.5 text-[12.5px] font-medium text-ink-2">Player</span>
        <Select value={playerId} onChange={(e) => setPlayerId(e.target.value)} className="w-auto min-w-[200px]">
          {roster.map((p) => <option key={p.id} value={p.id}>#{p.jersey} {p.first} {p.last}</option>)}
        </Select>
        <span className="ml-auto pr-1 text-[12px] text-ink-4">{roster.length} players on this roster</span>
      </motion.div>

      <motion.div variants={stagger.item} className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-3.5">
              <Avatar first={player.first} last={player.last} jersey={player.jersey} size="xl" />
              <div className="min-w-0">
                <h3 className="truncate text-[17px] font-semibold tracking-[-0.012em] text-ink">{player.first} {player.last}</h3>
                <p className="text-[12.5px] text-ink-3">#{player.jersey} · {player.position} · Age {player.age}</p>
                {team && (
                  <span className="mt-1.5 inline-flex items-center gap-1.5">
                    <TeamCrest short={team.short} color={team.color} size="sm" />
                    <span className="text-[12px] text-ink-3">{team.name}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line-soft pt-4">
              <div>
                <div className="eyebrow">Overall</div>
                <div className="stat mt-1.5 text-[30px] leading-none text-ink">{overall.toFixed(1)}</div>
              </div>
              <div>
                <div className="eyebrow">Growth</div>
                <div className={cn('stat mt-1.5 text-[30px] leading-none', growth >= 0 ? 'text-good' : 'text-bad')}>
                  {growth >= 0 ? '+' : ''}{growth.toFixed(1)}
                </div>
              </div>
            </div>
          </Card>

          <Card padded={false}>
            <div className="px-5 pb-2 pt-5"><CardHeader eyebrow="Roster" title="Team overall ratings" /></div>
            <div className="px-5 pb-5">
              <BarCompare
                data={roster.slice(0, 10).map((p) => ({
                  id: p.id, label: `#${p.jersey} ${p.last}`, value: p.evaluation,
                  color: p.id === player.id ? SERIES[1] : SERIES[0],
                }))}
                format={(v) => v.toFixed(1)}
                max={10}
                highlight={player.id}
                onSelect={setPlayerId}
                dense
              />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card padded={false}>
            <div className="px-5 pb-2 pt-5">
              <CardHeader eyebrow="Skills" title="Current ratings vs previous review"
                subtitle="Every rating is recorded by a coach after a development block." />
            </div>
            <div className="space-y-3.5 px-5 pb-5">
              {entries.map((s) => {
                const delta = +(s.current - s.previous).toFixed(1)
                return (
                  <div key={s.skill} className="flex flex-wrap items-start gap-3">
                    <div className="w-[110px] shrink-0 pt-0.5 text-[13px] font-medium text-ink">{s.skill}</div>
                    <div className="min-w-[200px] flex-1">
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-line-soft">
                          <span className="absolute inset-y-0 left-0 rounded-full bg-[#C9D4EE]" style={{ width: `${s.previous * 10}%` }} />
                          <span className="absolute inset-y-0 left-0 rounded-full bg-royal transition-all duration-700" style={{ width: `${s.current * 10}%` }} />
                        </div>
                        <span className="stat w-9 shrink-0 text-right text-[14px] text-ink">{s.current.toFixed(1)}</span>
                        <span className={cn('flex w-14 shrink-0 items-center gap-0.5 text-[11.5px] font-medium',
                          delta > 0 ? 'text-good' : delta < 0 ? 'text-bad' : 'text-ink-4')}>
                          {delta > 0 ? <TrendingUp className="h-3 w-3" /> : delta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                          {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                        </span>
                      </div>
                      {s.note && <p className="mt-1 text-[12px] text-ink-3">{s.note}</p>}
                    </div>
                  </div>
                )
              })}
              <div className="flex items-center gap-4 border-t border-line-soft pt-3 text-[11.5px] text-ink-4">
                <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-[#C9D4EE]" /> Previous review</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-royal" /> Current</span>
              </div>
            </div>
          </Card>

          <ChartCard
            eyebrow="Progression"
            title="Skill ratings over six reviews"
            subtitle="All skills share the same 0–10 scale"
            legend={entries.map((e, i) => ({ key: e.skill, label: e.skill, color: SERIES[i % SERIES.length] }))}
            table={{ head: ['Review', ...entries.map((e) => e.skill)], rows: history.map((h) => [h.label, ...entries.map((e) => (h as Record<string, string | number>)[e.skill])]) }}
          >
            <TrendChart
              height={252} endLabel={false} yFormat={(v) => v.toFixed(1)}
              data={history}
              series={entries.map((e, i) => ({ key: e.skill, label: e.skill, color: SERIES[i % SERIES.length] }))}
            />
          </ChartCard>
        </div>
      </motion.div>
    </motion.div>
  )
}
