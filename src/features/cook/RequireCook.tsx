import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth'

export function RequireCook() {
  const { isAuthenticated, isCook } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isCook) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
