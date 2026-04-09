import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import CustomerPage    from './pages/CustomerPage'
import AdminDashboard  from './pages/AdminDashboard'
import UserDashboard   from './pages/UserDashboard'
import LoginPage       from './pages/LoginPage'
import SignupPage      from './pages/SignupPage'

// Redirects already-authenticated users away from /login and /signup
function PublicRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth()
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
  }
  return children
}

function AppRoutes({ darkMode, setDarkMode }) {
  return (
    <div className="page-bg transition-colors duration-300">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <Routes>
        {/* Public — redirect to dashboard if already logged in */}
        <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

        {/* Protected — any authenticated user */}
        <Route path="/" element={
          <ProtectedRoute>
            <CustomerPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        } />

        {/* Admin only */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  return (
    <Router>
      <AuthProvider>
        <AppRoutes darkMode={darkMode} setDarkMode={setDarkMode} />
      </AuthProvider>
    </Router>
  )
}
