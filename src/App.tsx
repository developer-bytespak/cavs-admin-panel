import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { RequirePermission } from './components/layout/RequirePermission'
import { RequireAuth, RedirectIfAuthed } from './components/layout/RequireAuth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import LiveGames from './pages/LiveGames'
import GameControl from './pages/GameControl'
import Teams from './pages/Teams'
import TeamDetail from './pages/TeamDetail'
import Players from './pages/Players'
import PlayerDetail from './pages/PlayerDetail'
import Registrations from './pages/Registrations'
import RegistrationDetail from './pages/RegistrationDetail'
import Evaluations from './pages/Evaluations'
import Payments from './pages/Payments'
import InvoiceDetail from './pages/InvoiceDetail'
import Communications from './pages/Communications'
import Reports from './pages/Reports'
import Staff from './pages/Staff'
import StaffDetail from './pages/StaffDetail'
import Locations, { LocationDetail } from './pages/Locations'
import Settings from './pages/Settings'
import Attendance from './pages/Attendance'
import Volunteers from './pages/Volunteers'
import Development from './pages/Development'
import TeamChannels from './pages/TeamChannels'
import Help from './pages/Help'

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />

      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index element={<Dashboard />} />

        <Route path="schedule" element={<Schedule />} />

        <Route path="live" element={<LiveGames />} />
        <Route path="live/:gameId" element={<GameControl />} />

        <Route path="teams" element={<Teams />} />
        <Route path="teams/:teamId" element={<TeamDetail />} />

        <Route path="players" element={<Players />} />
        <Route path="players/:playerId" element={<PlayerDetail />} />

        <Route path="registrations" element={<RequirePermission permission="view.registrations" area="Registrations"><Registrations /></RequirePermission>} />
        <Route path="registrations/evaluations" element={<RequirePermission permission="view.registrations" area="Evaluations"><Evaluations /></RequirePermission>} />
        <Route path="registrations/:regId" element={<RequirePermission permission="view.registrations" area="Registrations"><RegistrationDetail /></RequirePermission>} />

        <Route path="payments" element={<RequirePermission permission="view.payments" area="Payments"><Payments /></RequirePermission>} />
        <Route path="payments/:invoiceId" element={<RequirePermission permission="view.payments" area="Payments"><InvoiceDetail /></RequirePermission>} />

        <Route path="communications" element={<Communications />} />

        <Route path="reports" element={<Navigate to="/reports/attendance" replace />} />
        <Route path="reports/:category" element={<RequirePermission permission="view.reports" area="Reports"><Reports /></RequirePermission>} />

        <Route path="staff" element={<RequirePermission permission="manage.staff" area="Staff & Roles"><Staff /></RequirePermission>} />
        <Route path="staff/:staffId" element={<RequirePermission permission="manage.staff" area="Staff & Roles"><StaffDetail /></RequirePermission>} />

        <Route path="locations" element={<RequirePermission permission="manage.locations" area="Locations"><Locations /></RequirePermission>} />
        <Route path="locations/:locationId" element={<RequirePermission permission="manage.locations" area="Locations"><LocationDetail /></RequirePermission>} />

        <Route path="attendance" element={<Attendance />} />
        <Route path="volunteers" element={<Volunteers />} />
        <Route path="development" element={<Development />} />
        <Route path="channels" element={<TeamChannels />} />

        <Route path="settings" element={<Navigate to="/settings/general" replace />} />
        {/* Every role can reach their own profile; the rest of Settings is administrative. */}
        <Route path="settings/profile" element={<Settings />} />
        <Route path="settings/:section" element={<RequirePermission permission="manage.settings" area="Settings"><Settings /></RequirePermission>} />

        <Route path="help" element={<Help />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
