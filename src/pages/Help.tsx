import { motion } from 'framer-motion'
import { LifeBuoy, BookOpen, Mail, MessageSquare, Keyboard, Sparkles } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { stagger } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

const GUIDES = [
  { title: 'Running a game day', body: 'Open Live Games, start the game, and control the score and clock from Arena Mode. Every change is visible to staff instantly.', to: '/live' },
  { title: 'Scheduling a season', body: 'Create recurring practice blocks per team, then layer games on top. Rescheduling always offers to notify affected families.', to: '/schedule' },
  { title: 'Processing a registration', body: 'Move a family through New → In Review → Evaluation → Ready, then assign a team to complete the registration.', to: '/registrations' },
  { title: 'Reading the reports', body: 'Filter once at the top of Reports and every chart on the page re-renders against the same slice.', to: '/reports/attendance' },
]

const SHORTCUTS = [
  ['⌘ K', 'Open search and commands'],
  ['Esc', 'Close a modal, drawer or palette'],
  ['↑ ↓', 'Move through search results'],
  ['Enter', 'Open the highlighted result'],
]

export default function Help() {
  const { setPaletteOpen, toast } = useApp()
  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={stagger.item}>
        <PageHeader
          eyebrow="Support"
          title="Help & Support"
          description="How the Cavs command center works, and how to reach us when something is not behaving."
        />
      </motion.div>

      <motion.div variants={stagger.item} className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card padded={false}>
          <div className="px-5 pb-2 pt-5">
            <CardHeader eyebrow="Guides" title="Getting things done" subtitle="The four workflows this product is built around." />
          </div>
          <div className="divide-y divide-line-soft px-5 pb-5">
            {GUIDES.map((g) => (
              <div key={g.title} className="flex items-start gap-3.5 py-4 first:pt-2">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-royal-tint text-royal">
                  <BookOpen className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-semibold text-ink">{g.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{g.body}</p>
                </div>
                <a href={g.to}><Button size="xs" variant="ghost">Open →</Button></a>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader eyebrow="Shortcuts" title="Keyboard" />
            <dl className="mt-3 divide-y divide-line-soft">
              {SHORTCUTS.map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-[13px] text-ink-2">{label}</dt>
                  <dd><kbd className="rounded-md border border-line bg-[#F7F8FA] px-1.5 py-0.5 text-[11.5px] font-medium text-ink-3">{key}</kbd></dd>
                </div>
              ))}
            </dl>
            <Button variant="secondary" icon={Keyboard} className="mt-4 w-full" onClick={() => setPaletteOpen(true)}>
              Try the command palette
            </Button>
          </Card>

          <Card>
            <CardHeader eyebrow="Contact" title="Reach the team" />
            <div className="mt-3 space-y-2">
              <a href="mailto:support@cavsacademy.org" className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2.5 text-[13px] text-ink-2 transition-colors hover:border-[#D9DDE5] hover:text-ink">
                <Mail className="h-4 w-4 text-ink-4" />support@cavsacademy.org
              </a>
              <button onClick={() => toast({ tone: 'info', title: 'Support request started', body: 'A member of the team will follow up by email.' })}
                className="flex w-full items-center gap-2.5 rounded-lg border border-line px-3 py-2.5 text-left text-[13px] text-ink-2 transition-colors hover:border-[#D9DDE5] hover:text-ink">
                <MessageSquare className="h-4 w-4 text-ink-4" />Start a support conversation
              </button>
            </div>
          </Card>

          <Card className="bg-warm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-3">What's next</span>
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-ink-2">
              Parent and Player experiences are the next phase of the Cavs platform. They connect into the same schedule,
              roster and communication data this command center already runs on.
            </p>
            <a href="/settings/roles"><Button size="sm" variant="secondary" className="mt-3.5">See the roadmap →</Button></a>
          </Card>
        </div>
      </motion.div>

      <motion.div variants={stagger.item}>
        <Card className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-midnight text-white">
              <LifeBuoy className="h-4 w-4" />
            </span>
            <div>
              <div className="text-[14px] font-semibold text-ink">Cavs Academy Command Center</div>
              <div className="text-[12.5px] text-ink-3">Frontend prototype · demonstration data · v1.0</div>
            </div>
          </div>
          <p className="max-w-[46ch] text-[12px] leading-relaxed text-ink-4">
            All data in this build is realistic demonstration data held in the browser. No backend, payment processor or
            messaging service is connected yet.
          </p>
        </Card>
      </motion.div>
    </motion.div>
  )
}
