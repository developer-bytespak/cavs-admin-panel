import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, MailCheck, ShieldCheck, Whistle } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/Button'
import { Checkbox } from '../components/ui/Field'
import { LiveDot } from '../components/ui/Badge'
import { AuthInput, CavsLogo, CourtBackdrop } from '../components/auth/AuthField'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../data/auth'
import { gamesToday } from '../data/analytics'
import { players, teams } from '../data/mock'

/* Quoted from the same academy data the dashboard reports. */
const BRAND_STATS = [
  { label: 'Players', value: String(players.length) },
  { label: 'Teams', value: String(teams.length) },
  { label: 'Years', value: '30' },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* The same 8px / 50ms entrance the app pages use. */
const rise = {
  hidden: { opacity: 0, y: 8 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.42, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export default function Login() {
  const [view, setView] = useState<'signin' | 'forgot' | 'sent'>('signin')

  return (
    <div className="relative flex min-h-screen flex-col bg-canvas lg:flex-row">
      <BrandPanel />

      <section className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:w-[42%] lg:flex-none lg:px-12">
        <div className="w-full max-w-[404px]">
          <AnimatePresence mode="wait">
            {view === 'signin' && <SignInForm key="signin" onForgot={() => setView('forgot')} />}
            {view === 'forgot' && <ForgotForm key="forgot" onBack={() => setView('signin')} onSent={() => setView('sent')} />}
            {view === 'sent' && <SentPanel key="sent" onBack={() => setView('signin')} />}
          </AnimatePresence>

          <motion.p
            custom={8} variants={rise} initial="hidden" animate="show"
            className="mt-8 border-t border-line pt-5 text-center text-[11.5px] leading-relaxed text-ink-4"
          >
            Admin &amp; Coach access.
            <span className="mx-1.5 text-line">|</span>
            Player &amp; Parent experiences coming soon.
          </motion.p>
        </div>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Left — brand panel, on the same ivory the app uses for warm surfaces */
/* ------------------------------------------------------------------ */
function BrandPanel() {
  return (
    <section className="relative isolate overflow-hidden border-b border-line bg-warm lg:w-[58%] lg:flex-none lg:border-b-0 lg:border-r">
      {/* A clean ivory ground. Coloured light is barely there — on a light
          surface even 6% tints the whole panel and reads as a muddy wash. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,#FFFFFF_0%,#F9F7F2_52%,#F5F1E8_100%)]" />
      <div className="pointer-events-none absolute -bottom-[26%] right-[-10%] h-[52%] w-[52%] rounded-full bg-[#F05A1A] opacity-[0.028] blur-[130px] motion-safe:animate-[drift_30s_ease-in-out_infinite]" />
      <CourtBackdrop className="text-navy opacity-[0.075]" />

      <div className="relative flex h-full min-h-full flex-col justify-between px-6 py-9 sm:px-10 sm:py-10 lg:px-14 lg:py-14">
        {/* Logo lock-up — the mark is a wordmark, so it leads and the type
            sits under it rather than repeating "CAVS" beside it. */}
        <motion.div custom={0} variants={rise} initial="hidden" animate="show">
          <CavsLogo className="h-[62px] sm:h-[76px] lg:h-[92px]" />
          <div className="mt-4 flex items-center gap-3">
            <span className="h-px w-8 bg-[#D9DDE5]" />
            <span className="font-display text-[12px] font-semibold uppercase leading-none tracking-[0.2em] text-ink-2 sm:text-[13px]">
              Youth Basketball
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-4">
              Command Center
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <div className="my-8 lg:my-0 lg:-mt-4">
          <motion.span custom={1} variants={rise} initial="hidden" animate="show"
            className="inline-flex items-center gap-2 rounded-full bg-orange-tint px-2.5 py-1 ring-1 ring-inset ring-[#FBDCC9]">
            <LiveDot />
            <span className="font-display text-[11px] font-semibold uppercase tracking-[0.17em] text-[#C24A12]">
              Cavs Operations
            </span>
          </motion.span>

          <motion.h1 custom={2} variants={rise} initial="hidden" animate="show"
            className="mt-6 font-display text-[36px] font-semibold uppercase leading-[0.98] tracking-[0.005em] text-ink sm:text-[50px] lg:text-[60px]">
            Run the Cavs.<br />
            <span className="text-ink-4">From one place.</span>
          </motion.h1>

          <motion.p custom={3} variants={rise} initial="hidden" animate="show"
            className="mt-4 max-w-[46ch] text-[13.5px] leading-relaxed text-ink-3 sm:mt-5 sm:text-[14.5px]">
            Teams, schedules, players, registrations and game-day operations — all connected.
          </motion.p>

          {/* Atmospheric scoreboard detail */}
          <motion.div custom={4} variants={rise} initial="hidden" animate="show"
            className="mt-8 hidden items-stretch overflow-hidden rounded-xl border border-line bg-card shadow-card sm:inline-flex">
            <div className="px-4 py-2.5">
              <div className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">Next game</div>
              <div className="mt-1 font-display text-[15px] font-semibold uppercase tracking-[0.05em] text-ink">
                14U Elite <span className="text-ink-4">vs</span> Warriors
              </div>
            </div>
            <div className="w-px bg-line" />
            <div className="px-4 py-2.5">
              <div className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">Tip-off</div>
              <div className="stat mt-1 text-[15px] leading-none text-orange">SAT · 6:30 PM</div>
            </div>
            <div className="w-px bg-line" />
            <div className="px-4 py-2.5">
              <div className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">Games today</div>
              <div className="stat mt-1 text-[15px] leading-none text-ink">{gamesToday}</div>
            </div>
          </motion.div>
        </div>

        {/* Micro data strip */}
        <motion.div custom={5} variants={rise} initial="hidden" animate="show"
          className="flex items-center gap-7 border-t border-line pt-5 sm:gap-12 sm:pt-6">
          {BRAND_STATS.map((s) => (
            <div key={s.label}>
              <div className="stat text-[23px] leading-none text-ink sm:text-[30px]">{s.value}</div>
              <div className="mt-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">{s.label}</div>
            </div>
          ))}
          <div className="ml-auto hidden text-right sm:block">
            <div className="font-display text-[13px] font-semibold uppercase leading-none tracking-[0.1em] text-ink-2">Admin + Coach</div>
            <div className="mt-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">Connected</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Right — sign in                                                     */
/* ------------------------------------------------------------------ */
function SignInForm({ onForgot }: { onForgot: () => void }) {
  const { signIn } = useApp()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)

  const useAccount = (accountEmail: string) => {
    setEmail(accountEmail)
    setPassword(DEMO_PASSWORD)
    setErrors({})
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!email.trim()) next.email = 'Enter your email address.'
    else if (!EMAIL_RE.test(email.trim())) next.email = 'That does not look like a valid email address.'
    if (!password) next.password = 'Enter your password.'
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    /* Mock credentials only — see src/data/auth.ts. */
    window.setTimeout(() => {
      const account = signIn(email, password)
      if (!account) {
        setBusy(false)
        setErrors({ form: 'We do not recognise that email and password. Try one of the demo accounts below.' })
        return
      }
      /* RedirectIfAuthed takes it from here, including any intended destination. */
    }, 650)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div custom={0} variants={rise} initial="hidden" animate="show" className="mb-7">
        <h2 className="text-[27px] font-semibold leading-tight tracking-[-0.02em] text-ink">Welcome back.</h2>
        <p className="mt-1.5 text-[14px] text-ink-3">Sign in to your Cavs management account.</p>
      </motion.div>

      <form onSubmit={submit} noValidate className="space-y-4">
        {errors.form && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-[#F5D5D7] bg-bad-tint px-3.5 py-2.5 text-[12.5px] leading-relaxed text-bad"
          >
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {errors.form}
          </motion.p>
        )}

        <motion.div custom={1} variants={rise} initial="hidden" animate="show">
          <AuthInput
            label="Email address" type="email" autoComplete="email" autoFocus
            placeholder="you@cavsacademy.org"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined, form: undefined })) }}
            error={errors.email}
          />
        </motion.div>

        <motion.div custom={2} variants={rise} initial="hidden" animate="show">
          <AuthInput
            label="Password" type="password" autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined, form: undefined })) }}
            error={errors.password}
            hint={
              <button type="button" onClick={onForgot}
                className="rounded text-[12.5px] font-medium text-royal transition-colors hover:text-electric hover:underline">
                Forgot password?
              </button>
            }
          />
        </motion.div>

        <motion.div custom={3} variants={rise} initial="hidden" animate="show" className="pt-0.5">
          <Checkbox checked={remember} onChange={setRemember} label="Keep me signed in" />
        </motion.div>

        <motion.div custom={4} variants={rise} initial="hidden" animate="show" className="pt-1.5">
          <Button
            type="submit" variant="primary" size="lg" loading={busy}
            iconRight={busy ? undefined : ArrowRight}
            className="h-[50px] w-full rounded-xl text-[14px] font-semibold shadow-[0_2px_10px_-2px_rgba(23,70,199,0.4)] transition-transform hover:-translate-y-px hover:shadow-[0_6px_18px_-4px_rgba(23,70,199,0.45)] active:translate-y-0"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </motion.div>
      </form>

      <motion.p custom={5} variants={rise} initial="hidden" animate="show"
        className="mt-4 flex items-center justify-center gap-1.5 text-[12.5px] text-ink-3">
        <Lock className="h-3.5 w-3.5 text-ink-4" />
        For Cavs administrators and coaches.
      </motion.p>

      {/* Demo accounts — this build has no auth backend. */}
      <motion.div custom={6} variants={rise} initial="hidden" animate="show" className="mt-6">
        <div className="mb-2.5 flex items-center gap-2.5">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-4">Demo accounts</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <div className="space-y-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email} type="button" onClick={() => useAccount(a.email)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-left transition-all duration-150',
                email.toLowerCase() === a.email.toLowerCase()
                  ? 'border-royal/35 ring-[3px] ring-electric/10'
                  : 'border-line hover:-translate-y-px hover:border-[#D9DDE5] hover:shadow-card'
              )}
            >
              <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                a.role === 'admin' ? 'bg-royal-tint text-royal' : 'bg-orange-tint text-[#C24A12]')}>
                {a.role === 'admin' ? <ShieldCheck className="h-4 w-4" /> : <Whistle className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-ink">{a.name} · {a.title}</span>
                <span className="block truncate text-[11.5px] text-ink-3">{a.email}</span>
              </span>
              <span className="shrink-0 text-[11.5px] font-medium text-royal opacity-0 transition-opacity group-hover:opacity-100">
                Use
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2.5 text-center text-[11.5px] text-ink-4">
          Password for both: <span className="font-medium text-ink-3">{DEMO_PASSWORD}</span>
        </p>
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Right — forgot password                                             */
/* ------------------------------------------------------------------ */
function ForgotForm({ onBack, onSent }: { onBack: () => void; onSent: () => void }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return setError('Enter your email address.')
    if (!EMAIL_RE.test(email.trim())) return setError('That does not look like a valid email address.')
    setError(undefined)
    setBusy(true)
    window.setTimeout(onSent, 650)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <button onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 rounded-lg text-[13px] font-medium text-ink-3 transition-colors hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </button>

      <h2 className="text-[27px] font-semibold leading-tight tracking-[-0.02em] text-ink">Reset password.</h2>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-3">
        Enter the email on your Cavs account and we will send reset instructions.
      </p>

      <form onSubmit={submit} noValidate className="mt-7 space-y-4">
        <AuthInput
          label="Email address" type="email" autoComplete="email" autoFocus
          placeholder="you@cavsacademy.org"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (error) setError(undefined) }}
          error={error}
        />
        <Button
          type="submit" variant="primary" size="lg" loading={busy}
          className="h-[50px] w-full rounded-xl text-[14px] font-semibold shadow-[0_2px_10px_-2px_rgba(23,70,199,0.4)] transition-transform hover:-translate-y-px hover:shadow-[0_6px_18px_-4px_rgba(23,70,199,0.45)] active:translate-y-0"
        >
          {busy ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </motion.div>
  )
}

function SentPanel({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-good-tint text-good ring-1 ring-inset ring-[#CDEBDF]">
        <MailCheck className="h-6 w-6" />
      </span>
      <h2 className="mt-5 text-[25px] font-semibold leading-tight tracking-[-0.02em] text-ink">Check your inbox.</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-3">
        We&rsquo;ve sent password reset instructions. The link expires in 30 minutes.
      </p>
      <div className="mt-6 flex items-center justify-center gap-1.5 rounded-xl border border-line bg-card px-3.5 py-2.5 text-[12.5px] text-ink-3">
        <CheckCircle2 className="h-3.5 w-3.5 text-good" />
        Demo build — no email is actually sent.
      </div>
      <Button variant="secondary" size="lg" className="mt-6 h-[48px] w-full rounded-xl" onClick={onBack}>
        Back to sign in
      </Button>
    </motion.div>
  )
}
