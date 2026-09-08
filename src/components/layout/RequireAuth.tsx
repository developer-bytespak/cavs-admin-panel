import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../../store/AppStore'

/** Everything behind the app shell requires a session. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp()
  const location = useLocation()
  if (!isAuthenticated) {
    /* Remember where they were headed so sign-in can return them there. */
    return <Navigate to="/signin" replace state={{ from: location.pathname + location.search }} />
  }
  return <>{children}</>
}

/**
 * The sign-in screen is pointless once you are already in. This guard also owns
 * *where* an authenticated visitor goes, so it can never race the login form's
 * own navigation — both would otherwise fire on the same state flip.
 */
export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp()
  const location = useLocation()
  if (isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from && from !== '/signin' ? from : '/'} replace />
  }
  return <>{children}</>
}
