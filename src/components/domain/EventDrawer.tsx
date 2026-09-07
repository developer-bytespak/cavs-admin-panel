import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Clock, Users, Pencil, Bell, Play, Navigation, Repeat, FileText, Radio } from 'lucide-react'
import { fmtDate, fmtTime } from '../../lib/utils'
import type { CalEvent, GameEvent, PracticeEvent } from '../../data/types'
import { teamById, locationById, staffById, rosterOf } from '../../data/mock'
import { useApp } from '../../store/AppStore'
import { SideDrawer } from '../ui/SideDrawer'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/Badge'
import { AvatarStack, TeamCrest } from '../ui/Avatar'
import { GameForm, PracticeForm } from '../overlays/CreateModals'

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-4" />
      <div className="min-w-0 flex-1">
        <div className="text-[11.5px] uppercase tracking-[0.06em] text-ink-4">{label}</div>
        <div className="mt-0.5 text-[13.5px] text-ink">{value}</div>
      </div>
    </div>
  )
}

export function EventDrawer({ event, onClose }: { event: CalEvent | null; onClose: () => void }) {
  const { toast, can, setGameStatus } = useApp()
  const [editing, setEditing] = useState(false)
  const navigate = useNavigate()

  const open = !!event
  const team = event && 'teamId' in event && event.teamId ? teamById(event.teamId) : undefined
  const location = event ? locationById(event.locationId) : undefined
  const roster = team ? rosterOf(team.id) : []

  const title = !event ? '' :
    event.type === 'game' ? `${team?.name} vs ${event.opponent}` :
      event.type === 'practice' ? `${team?.name} Practice` : event.title

  const notify = () => {
    toast({
      tone: 'success',
      title: 'Team notified',
      body: `${roster.length || 'All'} families received the latest details for this event.`,
    })
  }

  return (
    <>
      <SideDrawer
        open={open}
        onClose={onClose}
        eyebrow={event ? (event.type === 'game' ? 'Game' : event.type === 'practice' ? 'Practice' : 'Academy event') : ''}
        title={<span className="font-display text-[19px] uppercase tracking-[0.04em]">{title}</span>}
        footer={event && (
          <div className="flex w-full flex-wrap items-center gap-2">
            {can('edit.schedule') && (
              <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>Edit</Button>
            )}
            <Button size="sm" variant="secondary" icon={Bell} onClick={notify}>Notify team</Button>
            {event.type === 'game' && can('control.liveGames') && (
              <Button
                size="sm"
                variant="accent"
                icon={event.status === 'live' ? Radio : Play}
                className="ml-auto"
                onClick={() => {
                  if (event.status !== 'live' && event.status !== 'final') setGameStatus(event.id, 'live')
                  navigate(`/live/${event.id}`)
                }}
              >
                {event.status === 'live' ? 'Game control' : event.status === 'final' ? 'View result' : 'Start game'}
              </Button>
            )}
          </div>
        )}
      >
        {event && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {team && <TeamCrest short={team.short} color={team.color} />}
                <div>
                  <div className="text-[13px] font-medium text-ink">{fmtDate(event.date, 'long')}</div>
                  <div className="text-[12.5px] text-ink-3">
                    {fmtTime(event.start)}
                    {'end' in event && event.end ? ` – ${fmtTime(event.end)}` : ''}
                  </div>
                </div>
              </div>
              <StatusBadge status={event.status} />
            </div>

            {event.type === 'game' && (event as GameEvent).status !== 'scheduled' && (
              <div className="rounded-xl border border-line bg-[#FBFCFD] p-4">
                <div className="eyebrow mb-2">Score</div>
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <div className="stat text-[34px] leading-none text-ink">{(event as GameEvent).score.us}</div>
                    <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Cavs</div>
                  </div>
                  <span className="font-display text-[12px] uppercase tracking-[0.14em] text-ink-4">vs</span>
                  <div className="text-center">
                    <div className="stat text-[34px] leading-none text-ink">{(event as GameEvent).score.them}</div>
                    <div className="mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                      {(event as GameEvent).opponent.split(' ')[0]}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="divide-y divide-line-soft">
              {location && (
                <Row icon={MapPin} label="Venue" value={
                  <span>
                    <Link to={`/locations/${location.id}`} className="font-medium hover:text-royal">{location.name}</Link>
                    <span className="block text-[12.5px] text-ink-3">{location.address}, {location.city}</span>
                  </span>
                } />
              )}
              {event.type === 'game' && (
                <Row icon={Clock} label="Arrival time" value={`${fmtTime((event as GameEvent).arrival)} · ${(event as GameEvent).gameType} game`} />
              )}
              {event.type === 'practice' && (
                <>
                  <Row icon={FileText} label="Session focus" value={(event as PracticeEvent).focus} />
                  <Row icon={Users} label="Coach" value={staffById((event as PracticeEvent).coachId)
                    ? `${staffById((event as PracticeEvent).coachId)!.first} ${staffById((event as PracticeEvent).coachId)!.last}`
                    : '—'} />
                  {(event as PracticeEvent).repeat && (event as PracticeEvent).repeat !== 'none' && (
                    <Row icon={Repeat} label="Recurrence" value={
                      <span className="capitalize">{(event as PracticeEvent).repeat} until {fmtDate((event as PracticeEvent).repeatUntil!, 'short')}</span>
                    } />
                  )}
                </>
              )}
              {team && (
                <Row icon={Users} label="Players" value={
                  <span className="flex items-center gap-2.5">
                    <span className="tabular-nums">{roster.length} on roster</span>
                    <AvatarStack people={roster} max={5} size="xs" />
                  </span>
                } />
              )}
              {'detail' in event && event.detail && <Row icon={FileText} label="Detail" value={event.detail} />}
              {'notes' in event && event.notes && <Row icon={FileText} label="Notes" value={event.notes} />}
            </div>

            <div className="flex flex-wrap gap-2">
              {team && <Link to={`/teams/${team.id}`}><Button size="sm" variant="ghost">View team →</Button></Link>}
              {location && (
                <a href={`https://maps.google.com/?q=${encodeURIComponent(`${location.address} ${location.city}`)}`} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="ghost" icon={Navigation}>Directions</Button>
                </a>
              )}
            </div>
          </div>
        )}
      </SideDrawer>

      {event?.type === 'game' && (
        <GameForm open={editing} onClose={() => setEditing(false)} existing={event as GameEvent} />
      )}
      {event?.type === 'practice' && (
        <PracticeForm open={editing} onClose={() => setEditing(false)} existing={event as PracticeEvent} />
      )}
    </>
  )
}
