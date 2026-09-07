import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ShieldCheck, Whistle, Lock } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'
import { LiveDot } from '../components/ui/Badge'

const ENTRY_ROLES = [
  { key: 'admin' as const, label: 'Administrator', name: 'Darryl Hayes', blurb: 'Full academy oversight', icon: ShieldCheck },
  { key: 'coach' as const, label: 'Coach', name: 'Marcus Reed', blurb: '14U Elite · 13U Elite', icon: Whistle },
]

export default function Login() {
  const { setRole } = useApp()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<'admin' | 'coach'>('admin')

  const enter = () => { setRole(selected); navigate('/') }

  return (
    <div className="arena relative flex min-h-screen items-center justify-center overflow-hidden bg-midnight px-4 py-10">
      <div className="pointer-events-none absolute inset-0 arena-vignette" />
      <div className="pointer-events-none absolute inset-0 arena-grid opacity-70" />
      <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice" className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] w-full opacity-[0.08]" aria-hidden="true">
        <g fill="none" stroke="#fff" strokeWidth="1.2">
          <circle cx="600" cy="640" r="290" />
          <circle cx="600" cy="640" r="135" />
          <path d="M0 500h1200" />
          <rect x="450" y="492" width="300" height="230" />
        </g>
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative grid w-full max-w-[940px] overflow-hidden rounded-2xl border border-white/10 bg-[#0C1424]/85 shadow-arena backdrop-blur-sm lg:grid-cols-[1.05fr_1fr]"
      >
        {/* Left — identity */}
        <div className="relative hidden flex-col justify-between border-r border-white/[0.07] p-8 lg:flex">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-royal to-[#0B1F45] ring-1 ring-inset ring-white/12">
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]">
                  <circle cx="12" cy="12" r="9" fill="none" stroke="#F05A1A" strokeWidth="1.4" />
                  <path d="M12 3v18M3 12h18" stroke="#F05A1A" strokeWidth="1" />
                  <path d="M7 4.3c2 1.9 3.2 4.5 3.2 7.7S9 17.8 7 19.7M17 4.3c-2 1.9-3.2 4.5-3.2 7.7s1.2 5.8 3.2 7.7" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.1" />
                </svg>
              </span>
              <div>
                <div className="font-display text-[17px] font-semibold uppercase leading-none tracking-[0.06em] text-white">Cavs Academy</div>
                <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">Command Center</div>
              </div>
            </div>

            <h1 className="mt-10 font-display text-[38px] font-semibold uppercase leading-[1.05] tracking-[0.01em] text-white">
              Run the whole<br />academy from<br /><span className="text-orange">one screen.</span>
            </h1>
            <p className="mt-4 max-w-[38ch] text-[13.5px] leading-relaxed text-white/50">
              Thirty years of Cavs basketball — schedules, rosters, registrations, payments and live games,
              in a single system built for the people who run it.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/[0.07] pt-6">
            {[['128', 'Players'], ['6', 'Teams'], ['30', 'Years']].map(([v, l]) => (
              <div key={l}>
                <div className="stat text-[26px] leading-none text-white">{v}</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.11em] text-white/35">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — entry */}
        <div className="p-7 sm:p-8">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="font-display text-[16px] font-semibold uppercase tracking-[0.06em] text-white">Cavs Academy</span>
            <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">Command Center</span>
          </div>

          <div className="mt-1 flex items-center gap-2">
            <LiveDot />
            <span className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-orange">Prototype access</span>
          </div>
          <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.018em] text-white">Sign in to continue</h2>
          <p className="mt-1.5 text-[13px] text-white/45">Choose the experience you want to preview.</p>

          <div className="mt-6 space-y-2">
            {ENTRY_ROLES.map((r) => (
              <button
                key={r.key}
                onClick={() => setSelected(r.key)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-150',
                  selected === r.key
                    ? 'border-orange/40 bg-orange/[0.08]'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                )}
              >
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  selected === r.key ? 'bg-orange text-white' : 'bg-white/[0.07] text-white/60')}>
                  <r.icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-white">{r.label}</span>
                  <span className="block text-[12px] text-white/45">{r.name} · {r.blurb}</span>
                </span>
                <span className={cn('h-4 w-4 shrink-0 rounded-full border-2 transition-colors',
                  selected === r.key ? 'border-orange bg-orange' : 'border-white/25')} />
              </button>
            ))}

            {['Player', 'Parent'].map((r) => (
              <div key={r} className="flex cursor-not-allowed items-center gap-3 rounded-xl border border-dashed border-white/10 px-3.5 py-3 opacity-45">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-white/40">
                  <Lock className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium text-white/70">{r}</span>
                  <span className="block text-[12px] text-white/35">Planned experience</span>
                </span>
                <span className="shrink-0 rounded-full bg-white/[0.08] px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.08em] text-white/50">
                  Coming Soon
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3.5">
            <Field label={<span className="text-white/60">Email</span>}>
              <Input
                defaultValue={selected === 'admin' ? 'darryl@cavsacademy.org' : 'marcus.reed@cavsacademy.org'}
                className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/30 hover:border-white/20 focus:border-orange focus:ring-orange/20"
              />
            </Field>
            <Field label={<span className="text-white/60">Password</span>}>
              <Input
                type="password" defaultValue="cavs2025"
                className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/30 hover:border-white/20 focus:border-orange focus:ring-orange/20"
              />
            </Field>
          </div>

          <Button variant="accent" size="lg" className="mt-5 w-full" iconRight={ArrowRight} onClick={enter}>
            Enter the command center
          </Button>
          <p className="mt-3 text-center text-[11.5px] text-white/30">
            Prototype build — no authentication backend is connected. Any credentials continue.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
