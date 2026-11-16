import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth'

export function RequireEditor() {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role !== 'EDITOR') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}