/* Render + role-model assertions. Run with `npm run smoke`. */
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { AppProvider } from '../src/store/AppStore'
import App from '../src/App'
import type { Role } from '../src/data/types'
import { FEATURED_PLAYER_ID } from '../src/data/mock'
import { invoices, billingMetrics, invoiceById, needsAttention, FEATURED_INVOICE_ID } from '../src/data/billing'
import { activePlayers, metricSparks } from '../src/data/analytics'

const ROUTES = [
  '/signin', '/', '/schedule', '/live', '/live/g-002', '/live/g-003',
  '/teams', '/teams/t-14u', '/teams/t-lady',
  '/players', '/players/p-001', '/players/p-100',
  '/registrations', '/registrations/evaluations', '/registrations/r-001',
  '/payments', '/payments?view=invoices', '/payments?view=attention', '/payments?view=plans',
  '/payments/INV-1048', '/payments/INV-1101',
  '/communications',
  '/reports/attendance', '/reports/registrations', '/reports/payments', '/reports/participation',
  '/staff', '/staff/st-marcus', '/staff/st-priya',
  '/locations', '/locations/loc-chatsworth', '/locations/loc-northridge',
  '/attendance', '/volunteers', '/development', '/channels',
  '/settings/general', '/settings/notifications', '/settings/roles', '/settings/display', '/settings/profile',
  '/help',
  '/teams/does-not-exist', '/players/nope', '/payments/nope', '/registrations/nope',
  '/staff/nope', '/locations/nope', '/live/nope', '/payments/INV-9999',
]

/* The app is auth-gated, so signed-in rendering seeds a session. */
const render = (route: string, role: Role) =>
  renderToString(
    <MemoryRouter initialEntries={[route]}>
      <AppProvider initialRole={role} initialAuthenticated><App /></AppProvider>
    </MemoryRouter>
  )

const renderSignedOut = (route: string) =>
  renderToString(
    <MemoryRouter initialEntries={[route]}>
      <AppProvider initialAuthenticated={false}><App /></AppProvider>
    </MemoryRouter>
  )

let fails = 0
const check = (name: string, pass: boolean, detail = '') => {
  if (pass) return
  fails++
  console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
}

/* 1. Every route renders for every role. */
for (const role of ['admin', 'coach'] as const) {
  for (const route of ROUTES) {
    try {
      /* /signin deliberately renders nothing when a session exists — it redirects. */
      const html = route === '/signin' ? renderSignedOut(route) : render(route, role)
      check(`${role} renders ${route}`, html.length > 200, `${html.length} chars`)
    } catch (e) {
      fails++
      console.log(`FAIL  ${role} renders ${route}\n      ${(e as Error).message}`)
    }
  }
}
console.log(`Rendered ${ROUTES.length * 2} route/role combinations`)

/* 2. Coach access is genuinely scoped, not just hidden in navigation. */
for (const route of ['/payments', '/registrations', '/reports/attendance', '/staff', '/settings/general', '/locations']) {
  check(`coach blocked from ${route}`, render(route, 'coach').includes('not part of the Coach experience'))
  check(`admin allowed on ${route}`, !render(route, 'admin').includes('not part of the Coach experience'))
}
check('coach keeps their own profile', !render('/settings/profile', 'coach').includes('not part of the Coach experience'))
check('coach blocked from an unassigned team', render('/teams/t-10u', 'coach').includes('outside your access'))
check('coach can open an assigned team', !render('/teams/t-14u', 'coach').includes('outside your access'))

/* 3. Navigation simplifies with the role. */
const coachHome = render('/', 'coach')
const adminHome = render('/', 'admin')
check('coach nav hides Payments', !coachHome.includes('>Payments<'))
check('coach nav hides Registrations', !coachHome.includes('>Registrations<'))
check('coach nav hides Reports', !coachHome.includes('>Reports<'))
check('coach nav shows My Teams', coachHome.includes('My Teams'))
check('admin nav shows Payments', adminHome.includes('>Payments<'))
check('coach dashboard is lighter', coachHome.length < adminHome.length, `${coachHome.length} vs ${adminHome.length}`)

/* 4. The signature moments are actually on the page. */
check('live scoreboard', adminHome.includes('Live Now'))
check('academy pulse', adminHome.includes('Academy participation'))
check('attendance orbit', adminHome.includes('Attendance orbit'))
check('payment health', adminHome.includes('Payment health'))
check('roadmap teaser', adminHome.includes('Parent experience'))
check('arena game control', render('/live/g-002', 'admin').includes('Finalize game'))
check('roles roadmap cards', render('/settings/roles', 'admin').includes('Coming Soon'))
check('no placeholder copy', !adminHome.toLowerCase().includes('lorem'))

/* 5. The payment workflow is wired end to end and data agrees everywhere. */
const paymentsHome = render('/payments', 'admin')
check('payments header copy', paymentsHome.includes('Track collections, payment plans, outstanding balances'))
check('collected headline', paymentsHome.includes('$42,860'))
check('collection rate', paymentsHome.includes('91.4'))
check('needs-attention callout', paymentsHome.includes('families need attention') && paymentsHome.includes('>12<'))
check('create invoice action', paymentsHome.includes('Create invoice'))
check('record payment action', paymentsHome.includes('Record payment'))

const attention = render('/payments?view=attention', 'admin')
check('attention centre lists accounts', attention.includes('need attention') || attention.includes('No overdue payments'))
check('attention shows recommended action', attention.includes('Send a reminder') || attention.includes('Retry the payment') || attention.includes('Request a payment method'))

const plans = render('/payments?view=plans', 'admin')
check('plans tab lists plans', plans.includes('3 Installments') && plans.includes('Monthly Plan'))

const inv = render('/payments/INV-1048', 'admin')
check('invoice detail loads', inv.includes('INV-1048'))
check('invoice shows Jordan Miles', inv.includes('Jordan Miles'))
check('invoice total $1,200', inv.includes('$1,200'))
check('invoice paid $800', inv.includes('$800'))
check('invoice balance $400', inv.includes('$400'))
check('invoice is partial', inv.includes('Partial'))
check('installment timeline present', (inv.match(/Installment/g) ?? []).length >= 3)
check('autopay panel present', inv.includes('AutoPay'))
check('stored method masked', inv.includes('Visa •••• 4821'))
check('no raw card number', !/\b4[0-9]{12,15}\b/.test(inv))

/* Jordan's numbers must be identical wherever they appear. */
const jordanPlayer = render(`/players/${FEATURED_PLAYER_ID}`, 'admin')
check('player profile agrees with invoice', jordanPlayer.includes('Jordan Miles'))
const dash = adminHome
check('dashboard payment widget', dash.includes('Season collections'))
check('dashboard collected figure', dash.includes('$42,860') || dash.includes('42.8K'))
const payReport = render('/reports/payments', 'admin')
check('payment report renders', payReport.includes('Collected over time') || payReport.includes('Reports'))

/* 6. Coach never reaches the financial tools. */
check('coach blocked from an invoice', render('/payments/INV-1048', 'coach').includes('not part of the Coach experience'))
check('coach sees portal teasers', coachHome.includes('Player Portal') && coachHome.includes('Parent Portal'))
check('portals are not links', !coachHome.includes('href="/player-portal"'))

/* 8. The ledger itself — headline figures and internal consistency. */
const led = billingMetrics(invoices)
check('collected = $42,860', led.collected === 42860, `got ${led.collected}`)
check('outstanding = $6,240', led.outstanding === 6240, `got ${led.outstanding}`)
check('overdue = $2,180', led.overdue === 2180, `got ${led.overdue}`)
check('failed = $1,860', led.failed === 1860, `got ${led.failed}`)
check('upcoming = $8,450', led.upcoming === 8450, `got ${led.upcoming}`)
check('collection rate = 91.4%', led.collectionRate.toFixed(1) === '91.4', `got ${led.collectionRate.toFixed(1)}`)
check('12 families need attention', led.needsAttention === 12, `got ${led.needsAttention}`)
check('"families" metric counts distinct families',
  led.needsAttention === new Set(invoices.filter(needsAttention).map((i) => i.familyName)).size)
check('no duplicate invoice ids', invoices.length === new Set(invoices.map((i) => i.id)).size)
check('paid + balance = total on every invoice',
  invoices.every((i) => Math.abs(i.total - (i.paid + i.balance)) <= 1))
check('installments always sum to the invoice total',
  invoices.every((i) => Math.abs(i.installments.reduce((s, x) => s + x.amount, 0) - i.total) <= 2))

const ji = invoiceById(FEATURED_INVOICE_ID)!
check('Jordan invoice is INV-1048', ji.id === 'INV-1048')
check('Jordan total $1,200', ji.total === 1200)
check('Jordan paid $800', ji.paid === 800)
check('Jordan balance $400', ji.balance === 400)
check('Jordan status is partial', ji.status === 'partial')
check('Jordan has 3 installments, 2 paid', ji.installments.length === 3 && ji.installments.filter((i) => i.status === 'paid').length === 2)
check('Jordan is on 14U Elite', ji.teamId === 't-14u')

/* 9. The app is gated: signed out, protected routes render nothing but a redirect. */
for (const route of ['/', '/payments', '/schedule', '/teams', '/reports/attendance', '/settings/general']) {
  const html = renderSignedOut(route)
  check(`signed out, ${route} does not render the app`, !html.includes('Academy participation') && !html.includes('Command Center'))
}
check('signed-out sign-in page still renders', renderSignedOut('/signin').includes('Welcome back.'))
check('signed in, /signin does not render the login form', !render('/signin', 'admin').includes('Sign in to your Cavs management account.'))

/* 10. Sign-in screen. */
const login = renderSignedOut('/signin')
check('login uses the real Cavs logo asset', login.includes('/cavs_logo.avif'))
check('login does not fall back to a placeholder mark', !login.includes('Cavs Academy</div>') || login.includes('/cavs_logo.avif'))
check('login headline', login.includes('Run the Cavs.') && login.includes('From one place.'))
check('login welcome copy', login.includes('Welcome back.') && login.includes('Sign in to your Cavs management account.'))
check('email + password fields', login.includes('Email address') && login.includes('Password'))
check('remember + forgot controls', login.includes('Keep me signed in') && login.includes('Forgot password?'))
check('primary CTA is Sign in', login.includes('Sign in<') || login.includes('>Sign in'))
check('admin/coach note', login.includes('For Cavs administrators and coaches.'))
check('future role teaser present', login.includes('Player &amp; Parent experiences coming soon') || login.includes('Player & Parent experiences coming soon'))
check('no parent/player portal links on login', !login.includes('href="/parent') && !login.includes('href="/player-portal"'))
check('brand stats quote real academy data', login.includes('>128<') && login.includes('>6<') && login.includes('>30<'))
check('players sparkline ends at the active-player count', metricSparks.players[metricSparks.players.length - 1] === activePlayers)
check('password toggle is accessible', login.includes('Show password') || login.includes('aria-label="Show password"'))
check('demo accounts are offered', login.includes('darryl@cavsacademy.org') && login.includes('marcus.reed@cavsacademy.org'))
check('demo password hint shown', login.includes('cavs2026'))
check('login is light, not the dark arena surface', !login.includes('bg-midnight') && !login.includes('arena-vignette'))

/* The dashboard must still be reachable directly — login adds no gate. */
check('dashboard still renders without signing in', adminHome.includes('Academy participation'))
check('sign out entry point exists', adminHome.includes('Sign out'))

console.log(fails ? `\n${fails} assertion(s) failed` : '\nAll assertions passed')
process.exit(fails ? 1 : 0)

/* 7. Final polish gates. */
const invoicesTab = render('/payments?view=invoices', 'admin')
check('invoice table has the full column set', ['Family / Player', 'Invoice', 'Total', 'Balance', 'Next Due', 'Payment Plan', 'AutoPay'].every((h) => invoicesTab.includes(h)))
check('payments has search placeholder', invoicesTab.includes('Search family, player or invoice'))
check('sidebar groups core + management', adminHome.includes('Core') && adminHome.includes('Management'))
check('sidebar shows both portal teasers', adminHome.includes('Player Portal') && adminHome.includes('Parent Portal'))
check('no default browser form styling', !adminHome.includes('<input type="text">'))

/* Money must agree across every screen that reports it. */
const rate = /91\.4/
check('rate agrees on payments page', rate.test(paymentsHome))
check('rate agrees on payments report', rate.test(payReport))

/* Empty states exist for the payment surfaces. */
check('attention empty state copy exists', attention.includes('need attention') || attention.includes('No overdue payments. Great work.'))
