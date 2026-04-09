import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps a route to enforce authentication (and optionally admin-only access).
 *
 * <ProtectedRoute>           — any authenticated user
 * <ProtectedRoute adminOnly> — authenticated + admin role
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (adminOnly && !isAdmin) {
    // Regular users who somehow land on /admin get redirected to their dashboard
    return <Navigate to="/dashboard" replace />
  }

  return children
}
