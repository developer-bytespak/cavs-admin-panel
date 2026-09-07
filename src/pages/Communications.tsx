import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Megaphone, Send, Users, Copy, Archive, Eye, Search, Shield, Globe, Whistle, Sparkles,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { AUDIENCES, teams, teamById } from '../data/mock'
import type { Priority } from '../data/types'
import { cn, fmtDate } from '../lib/utils'
import { stagger } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button, IconButton } from '../components/ui/Button'
import { Field, Input, Textarea } from '../components/ui/Field'
import { Segmented } from '../components/ui/Tabs'
import { StatusBadge, Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Avatar, TeamCrest } from '../components/ui/Avatar'
import { SideDrawer } from '../components/ui/SideDrawer'

const TEMPLATES = [
  { label: 'Venue change', title: 'Venue change for this week', body: 'This week’s session has moved. Please check the updated location and arrival time in the schedule, and allow extra travel time.' },
  { label: 'Arrival reminder', title: 'Arrival time reminder', body: 'Arrival is 45 minutes before tip-off for warm-ups. Bring both jerseys and two water bottles.' },
  { label: 'Dues reminder', title: 'Season dues — final week', body: 'Season dues close Friday. Payment plans are available — reply to this message and we will set one up.' },
]

export default function Communications() {
  const { announcements, sendAnnouncement, archiveAnnouncement, toast, role, visibleTeamIds, user } = useApp()
  const [params] = useSearchParams()

  const options = useMemo(
    () => AUDIENCES.filter((a) => role === 'admin' || a.key === 'coaches' || visibleTeamIds.includes(a.key)),
    [role, visibleTeamIds]
  )

  const [audienceKey, setAudienceKey] = useState(params.get('audience') ?? options[0].key)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState<Priority>('normal')
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<(typeof announcements)[number] | null>(null)

  const audience = options.find((a) => a.key === audienceKey) ?? options[0]

  const history = useMemo(
    () => announcements.filter((a) => !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.audience.toLowerCase().includes(search.toLowerCase())),
    [announcements, search]
  )

  const send = () => {
    sendAnnouncement({ title, body, audienceKey: audience.key, audience: audience.label, recipients: audience.recipients, priority })
    toast({ tone: 'success', title: 'Announcement sent', body: `Delivered to ${audience.recipients} recipients — ${audience.label}.` })
    setTitle(''); setBody(''); setPriority('normal')
  }

  const audienceIcon = (key: string) =>
    key === 'academy' ? Globe : key === 'coaches' ? Whistle : key === 'elite' ? Shield : Users

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={stagger.item}>
        <PageHeader
          eyebrow="Communications"
          title="Communication Center"
          description="One place to reach a team, a group of coaches or the entire academy — with the audience size in front of you before you send."
          meta={
            <>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">{announcements.filter((a) => a.status === 'sent').length}</strong> broadcasts sent</span>
              <span className="text-[13px] text-ink-2"><strong className="font-semibold text-ink tabular-nums">128</strong> academy recipients</span>
              <span className="text-[13px] text-ink-2">
                <strong className="font-semibold text-ink tabular-nums">
                  {Math.round(announcements.filter((a) => a.openRate).reduce((s, a) => s + a.openRate, 0) / (announcements.filter((a) => a.openRate).length || 1))}%
                </strong> average open rate
              </span>
            </>
          }
        />
      </motion.div>

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_290px]">
        {/* ---------------- LEFT · history ---------------- */}
        <motion.div variants={stagger.item} className="order-2 xl:order-1">
          <Card padded={false} className="flex h-full flex-col">
            <div className="border-b border-line-soft px-4 pb-3 pt-4">
              <div className="eyebrow mb-2.5">Broadcast history</div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-ink-4" />
                <input
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search broadcasts…"
                  aria-label="Search broadcasts"
                  className="h-8 w-full rounded-lg border border-transparent bg-[#F4F6F9] pl-8 pr-2 text-[12.5px] text-ink placeholder:text-ink-4 focus:border-electric focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-electric/12"
                />
              </div>
            </div>
            <div className="max-h-[620px] flex-1 overflow-y-auto">
              {history.length === 0 && (
                <EmptyState compact icon={Megaphone} title="No broadcasts found" description="Sent announcements appear here." />
              )}
              {history.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => setViewing(a)}
                  className={cn('w-full px-4 py-3 text-left transition-colors hover:bg-[#FAFBFD]', i > 0 && 'border-t border-line-soft',
                    a.status === 'archived' && 'opacity-60')}
                >
                  <div className="flex items-start gap-2">
                    <span className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
                      a.priority === 'urgent' ? 'bg-orange' : a.priority === 'important' ? 'bg-royal' : 'bg-ink-4')} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">{a.title}</span>
                      <span className="mt-0.5 block truncate text-[11.5px] text-ink-3">{a.audience} · {a.recipients} recipients</span>
                      <span className="mt-1 block text-[11px] text-ink-4">
                        {a.sentBy} · {fmtDate(a.sentAt.slice(0, 10), 'short')} {a.sentAt.slice(11)}
                      </span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* ---------------- CENTER · composer ---------------- */}
        <motion.div variants={stagger.item} className="order-1 xl:order-2">
          <Card padded={false} className="overflow-hidden">
            <div className={cn('border-b px-5 py-4 transition-colors duration-300',
              priority === 'urgent' ? 'border-[#FBDCC9] bg-orange-tint' : 'border-line-soft bg-white')}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className={cn('eyebrow', priority === 'urgent' && 'text-[#C24A12]')}>Compose</div>
                  <h2 className="mt-1 text-[16px] font-semibold tracking-[-0.012em] text-ink">New announcement</h2>
                </div>
                <Avatar first={user.first} last={user.last} size="md" />
              </div>
            </div>

            <div className="space-y-4 p-5">
              <Field label="Title" required>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chatsworth Gym entrance change for Saturday" />
              </Field>

              <Field label="Message" required hint={`${body.length} characters`}>
                <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)}
                  placeholder="Saturday games will use the east entrance only — the main lot is closed for resurfacing. Please allow an extra 15 minutes for arrival and check-in." />
              </Field>

              <div>
                <div className="eyebrow mb-2">Priority</div>
                <Segmented
                  value={priority}
                  onChange={(k) => setPriority(k as Priority)}
                  items={[{ key: 'normal', label: 'Normal' }, { key: 'important', label: 'Important' }, { key: 'urgent', label: 'Urgent' }]}
                />
                <p className="mt-2 text-[12px] text-ink-3">
                  {priority === 'urgent'
                    ? 'Urgent broadcasts are highlighted in orange and pushed to the top of every recipient’s notifications.'
                    : priority === 'important'
                      ? 'Important broadcasts are pinned in the notification panel until read.'
                      : 'Normal broadcasts appear in the notification feed in order.'}
                </p>
              </div>

              <div className="border-t border-line-soft pt-4">
                <div className="eyebrow mb-2 flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> Quick templates</div>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATES.map((t) => (
                    <button key={t.label} onClick={() => { setTitle(t.title); setBody(t.body) }}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[12px] font-medium text-ink-2 transition-colors hover:border-[#D9DDE5] hover:bg-[#FAFBFC] hover:text-ink">
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft bg-[#FBFCFD] px-5 py-3.5">
              <span className="text-[12.5px] text-ink-3">
                Sending to <strong className="font-semibold text-ink tabular-nums">{audience.recipients} recipients</strong> · {audience.label}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => { setTitle(''); setBody(''); setPriority('normal') }} disabled={!title && !body}>Clear</Button>
                <Button variant={priority === 'urgent' ? 'accent' : 'primary'} icon={Send} disabled={!title.trim() || !body.trim()} onClick={send}>
                  Send announcement
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ---------------- RIGHT · audience ---------------- */}
        <motion.div variants={stagger.item} className="order-3">
          <Card padded={false} className="sticky top-[76px]">
            <div className="px-4 pb-3 pt-4">
              <CardHeader eyebrow="Audience" title="Who receives this" />
            </div>
            <div className="max-h-[420px] space-y-1 overflow-y-auto px-2 pb-2">
              {options.map((a) => {
                const Icon = audienceIcon(a.key)
                const team = teams.find((t) => t.id === a.key)
                const active = a.key === audienceKey
                return (
                  <button
                    key={a.key}
                    onClick={() => setAudienceKey(a.key)}
                    className={cn('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                      active ? 'bg-royal-tint ring-1 ring-inset ring-[#D5E1FC]' : 'hover:bg-[#F6F7F9]')}
                  >
                    {team ? <TeamCrest short={team.short} color={team.color} size="sm" /> : (
                      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        active ? 'bg-white text-royal' : 'bg-[#F1F3F7] text-ink-3')}>
                        <Icon className="h-4 w-4" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate text-[13px] font-medium', active ? 'text-royal' : 'text-ink')}>{a.label}</span>
                      <span className="block truncate text-[11.5px] text-ink-3">{a.hint}</span>
                    </span>
                    <span className={cn('shrink-0 text-[12px] font-semibold tabular-nums', active ? 'text-royal' : 'text-ink-3')}>
                      {a.recipients}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className={cn('m-2 rounded-xl border p-3.5 transition-colors',
              priority === 'urgent' ? 'border-[#FBDCC9] bg-orange-tint' : 'border-line bg-[#FBFCFD]')}>
              <div className="flex items-center gap-2">
                <Megaphone className={cn('h-4 w-4', priority === 'urgent' ? 'text-[#C24A12]' : 'text-royal')} />
                <span className="eyebrow">Delivery summary</span>
              </div>
              <div className="stat mt-2 text-[28px] leading-none text-ink">{audience.recipients}</div>
              <div className="mt-1 text-[12.5px] text-ink-3">recipients · {audience.label}</div>
              <div className="mt-3 space-y-1 border-t border-line-soft pt-3 text-[11.5px] text-ink-3">
                <div className="flex justify-between"><span>Priority</span><span className="font-medium capitalize text-ink">{priority}</span></div>
                <div className="flex justify-between"><span>Sent by</span><span className="font-medium text-ink">{user.first} {user.last}</span></div>
                <div className="flex justify-between"><span>Channel</span><span className="font-medium text-ink">In-app + email</span></div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Full history table */}
      <motion.div variants={stagger.item}>
        <CardHeader eyebrow="Archive" title="All broadcasts" className="mb-3" />
        <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="bg-[#FBFCFD]">
                  {['Announcement', 'Audience', 'Sent by', 'Date / time', 'Status', ''].map((h, i) => (
                    <th key={i} className="border-b border-line px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {announcements.map((a) => (
                  <tr key={a.id} className="group border-b border-line-soft last:border-0 transition-colors hover:bg-[#FAFBFD]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-medium text-ink">{a.title}</span>
                        {a.priority !== 'normal' && <StatusBadge status={a.priority} size="xs" dot={false} />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-ink-2">{a.audience}<span className="ml-1.5 text-[12px] text-ink-4 tabular-nums">{a.recipients}</span></td>
                    <td className="px-4 py-3 text-[13px] text-ink-2">{a.sentBy}</td>
                    <td className="px-4 py-3 text-[13px] text-ink-2 tabular-nums">{fmtDate(a.sentAt.slice(0, 10), 'short')} · {a.sentAt.slice(11)}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} size="xs" /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                        <IconButton icon={Eye} label="View announcement" onClick={() => setViewing(a)} />
                        <IconButton icon={Copy} label="Duplicate" onClick={() => {
                          setTitle(a.title); setBody(a.body); setAudienceKey(a.audienceKey); setPriority(a.priority)
                          toast({ tone: 'info', title: 'Copied to composer', body: 'Edit and send it as a new broadcast.' })
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }} />
                        <IconButton icon={Archive} label="Archive" onClick={() => {
                          archiveAnnouncement(a.id)
                          toast({ tone: 'info', title: 'Announcement archived' })
                        }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      <SideDrawer
        open={!!viewing} onClose={() => setViewing(null)} width="md"
        eyebrow={viewing ? `${viewing.audience} · ${viewing.recipients} recipients` : ''}
        title={viewing?.title ?? ''}
        footer={viewing && (
          <>
            <Button size="sm" variant="secondary" icon={Copy} onClick={() => {
              setTitle(viewing.title); setBody(viewing.body); setAudienceKey(viewing.audienceKey); setPriority(viewing.priority)
              setViewing(null)
              toast({ tone: 'info', title: 'Copied to composer' })
            }}>Duplicate</Button>
            <Button size="sm" variant="ghost" icon={Archive} className="ml-auto" onClick={() => {
              archiveAnnouncement(viewing.id); setViewing(null)
              toast({ tone: 'info', title: 'Announcement archived' })
            }}>Archive</Button>
          </>
        )}
      >
        {viewing && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={viewing.priority} />
              <StatusBadge status={viewing.status} />
              <span className="text-[12px] text-ink-3">
                {viewing.sentBy} · {fmtDate(viewing.sentAt.slice(0, 10), 'long')} at {viewing.sentAt.slice(11)}
              </span>
            </div>
            <p className="rounded-xl border border-line bg-[#FBFCFD] p-4 text-[14px] leading-relaxed text-ink-2">{viewing.body}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-line p-3.5">
                <div className="eyebrow">Recipients</div>
                <div className="stat mt-1.5 text-[24px] leading-none text-ink">{viewing.recipients}</div>
              </div>
              <div className="rounded-xl border border-line p-3.5">
                <div className="eyebrow">Open rate</div>
                <div className="stat mt-1.5 text-[24px] leading-none text-ink">{viewing.openRate}%</div>
              </div>
            </div>
            {teamById(viewing.audienceKey) && (
              <Badge tone="blue" dot={false}>Team broadcast · {teamById(viewing.audienceKey)!.name}</Badge>
            )}
          </div>
        )}
      </SideDrawer>
    </motion.div>
  )
}
