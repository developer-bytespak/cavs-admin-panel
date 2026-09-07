import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useApp, type Permission } from '../../store/AppStore'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'

/**
 * Role-aware route guard. Navigation already hides what a role cannot reach —
 * this catches a direct URL and explains why, rather than leaking the screen.
 */
export function RequirePermission({ permission, area, children }: { permission: Permission; area: string; children: React.ReactNode }) {
  const { can, role, setRole } = useApp()
  if (can(permission)) return <>{children}</>
  return (
    <Card>
      <EmptyState
        icon={Lock}
        title={`${area} is not part of the Coach experience`}
        description={`Coaches see their assigned teams, rosters, schedule and live games. ${area} stays with administrators and supervisors.`}
        action={
          <>
            <Button variant="secondary" onClick={() => setRole('admin')}>Switch to Administrator</Button>
            <Link to="/"><Button variant="ghost">Back to dashboard</Button></Link>
          </>
        }
      />
      <p className="sr-only">Current role: {role}</p>
    </Card>
  )
}
