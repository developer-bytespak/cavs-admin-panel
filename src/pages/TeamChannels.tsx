import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MessagesSquare, Pin, Send, ShieldCheck, Users } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { chatChannels, teamById, rosterOf } from '../data/mock'
import { cn } from '../lib/utils'
import { stagger } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Avatar, TeamCrest } from '../components/ui/Avatar'
import { Textarea } from '../components/ui/Field'

interface Msg { id: string; author: string; role: string; time: string; body: string; staff: boolean }

export default function TeamChannels() {
  const { role, visibleTeamIds, user, toast } = useApp()
  const channels = useMemo(
    () => chatChannels.filter((c) => role === 'admin' || visibleTeamIds.includes(c.teamId)),
    [role, visibleTeamIds]
  )
  const [activeId, setActiveId] = useState(channels[0]?.id ?? '')
  const [draft, setDraft] = useState('')
  const [extra, setExtra] = useState<Record<string, Msg[]>>({})

  const channel = channels.find((c) => c.id === activeId)
  const team = channel ? teamById(channel.teamId) : undefined
  const messages: Msg[] = channel ? [...channel.messages, ...(extra[channel.id] ?? [])] : []

  const send = () => {
    if (!channel || !draft.trim()) return
    setExtra((prev) => ({
      ...prev,
      [channel.id]: [...(prev[channel.id] ?? []), {
        id: `m-${Date.now()}`, author: `${user.first} ${user.last}`, role: user.role,
        time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        body: draft, staff: true,
      }],
    }))
    setDraft('')
    toast({ tone: 'success', title: 'Message posted', body: `Sent to the ${team?.name} channel.` })
  }

  if (channels.length === 0) {
    return <Card><EmptyState icon={MessagesSquare} title="No team channels yet"
      description="Channels open automatically for each team you coach." /></Card>
  }

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={stagger.item}>
        <PageHeader
          eyebrow="Team tools"
          title="Team Channels"
          description="Staff-moderated conversation for each roster. Coaches and administrators post here; family replies arrive with the Parent experience."
          meta={
            <>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{channels.length}</strong> channels</span>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-orange tabular-nums">{channels.reduce((s, c) => s + c.unread, 0)}</strong> unread</span>
              <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-3">
                <ShieldCheck className="h-3.5 w-3.5 text-good" /> Moderated by staff
              </span>
            </>
          }
        />
      </motion.div>

      <motion.div variants={stagger.item} className="grid gap-4 lg:grid-cols-[268px_minmax(0,1fr)]">
        <Card padded={false}>
          <div className="border-b border-line-soft px-4 py-3"><div className="eyebrow">Channels</div></div>
          <div className="p-1.5">
            {channels.map((c) => {
              const t = teamById(c.teamId)!
              const active = c.id === activeId
              return (
                <button key={c.id} onClick={() => setActiveId(c.id)}
                  className={cn('flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors',
                    active ? 'bg-royal-tint ring-1 ring-inset ring-[#D5E1FC]' : 'hover:bg-[#F6F7F9]')}>
                  <TeamCrest short={t.short} color={t.color} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-[13px] font-medium', active ? 'text-royal' : 'text-ink')}>{t.name}</span>
                    <span className="block truncate text-[11.5px] text-ink-3">{rosterOf(t.id).length} players · {c.messages.length} messages</span>
                  </span>
                  {c.unread > 0 && (
                    <span className="shrink-0 rounded-full bg-orange px-1.5 py-px text-[10.5px] font-semibold tabular-nums text-white">{c.unread}</span>
                  )}
                </button>
              )
            })}
          </div>
        </Card>

        {channel && team && (
          <Card padded={false} className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
              <div className="flex items-center gap-3">
                <TeamCrest short={team.short} color={team.color} />
                <div>
                  <h3 className="font-display text-[17px] font-semibold uppercase tracking-[0.035em] text-ink">{team.name}</h3>
                  <p className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
                    <Users className="h-3.5 w-3.5 text-ink-4" />
                    {rosterOf(team.id).length} players and their families
                  </p>
                </div>
              </div>
              <Badge tone="good" dot={false} size="xs">Moderated</Badge>
            </div>

            {channel.pinned && (
              <div className="flex items-start gap-2.5 border-b border-line-soft bg-warm px-5 py-3">
                <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-3" />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.11em] text-ink-3">Pinned update</div>
                  <p className="mt-0.5 text-[13px] text-ink-2">{channel.pinned}</p>
                </div>
              </div>
            )}

            <div className="max-h-[440px] flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {messages.map((m) => (
                <div key={m.id} className="flex gap-3">
                  <Avatar first={m.author.split(' ')[0]} last={m.author.split(' ')[1] ?? ''} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-[13px] font-semibold text-ink">{m.author}</span>
                      {m.staff && <Badge tone="blue" dot={false} size="xs">{m.role}</Badge>}
                      {!m.staff && <span className="text-[11.5px] text-ink-4">{m.role}</span>}
                      <span className="text-[11.5px] text-ink-4">{m.time}</span>
                    </div>
                    <p className={cn('mt-1 rounded-xl px-3.5 py-2.5 text-[13.5px] leading-relaxed',
                      m.staff ? 'bg-royal-tint text-[#123796]' : 'bg-[#F5F6F9] text-ink-2')}>
                      {m.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-line-soft bg-[#FBFCFD] p-4">
              <Textarea
                rows={2} value={draft} onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message the ${team.name} channel…`}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send() }}
              />
              <div className="mt-2.5 flex items-center justify-between gap-3">
                <span className="text-[11.5px] text-ink-4">
                  Posted as {user.first} {user.last} · visible to the roster and their families
                </span>
                <Button size="sm" variant="primary" icon={Send} disabled={!draft.trim()} onClick={send}>Post message</Button>
              </div>
            </div>
          </Card>
        )}
      </motion.div>
    </motion.div>
  )
}
