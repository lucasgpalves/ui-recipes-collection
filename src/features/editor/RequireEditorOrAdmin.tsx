import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth'

export function RequireEditorOrAdmin() {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role !== 'EDITOR' && role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}