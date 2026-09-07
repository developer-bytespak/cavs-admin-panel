/* Render + role-model assertions. Run with `npm run smoke`. */
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { AppProvider } from '../src/store/AppStore'
import App from '../src/App'
import type { Role } from '../src/data/types'

const ROUTES = [
  '/signin', '/', '/schedule', '/live', '/live/g-002', '/live/g-003',
  '/teams', '/teams/t-14u', '/teams/t-lady',
  '/players', '/players/p-001', '/players/p-100',
  '/registrations', '/registrations/evaluations', '/registrations/r-001',
  '/payments', '/payments/pay-001',
  '/communications',
  '/reports/attendance', '/reports/registrations', '/reports/payments', '/reports/participation',
  '/staff', '/staff/st-marcus', '/staff/st-priya',
  '/locations', '/locations/loc-chatsworth', '/locations/loc-northridge',
  '/attendance', '/volunteers', '/development', '/channels',
  '/settings/general', '/settings/notifications', '/settings/roles', '/settings/display', '/settings/profile',
  '/help',
  '/teams/does-not-exist', '/players/nope', '/payments/nope', '/registrations/nope',
  '/staff/nope', '/locations/nope', '/live/nope',
]

const render = (route: string, role: Role) =>
  renderToString(
    <MemoryRouter initialEntries={[route]}>
      <AppProvider initialRole={role}><App /></AppProvider>
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
      const html = render(route, role)
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

console.log(fails ? `\n${fails} assertion(s) failed` : '\nAll assertions passed')
process.exit(fails ? 1 : 0)
