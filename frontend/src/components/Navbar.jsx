import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Brain, LayoutDashboard, Ticket, Sun, Moon,
  Wifi, WifiOff, User, LogOut, ChevronDown,
} from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Navbar({ darkMode, setDarkMode }) {
  const { pathname }                    = useLocation()
  const navigate                        = useNavigate()
  const { isAuthenticated, isAdmin, user, logout } = useAuth()
  const [online, setOnline]             = useState(null)
  const [menuOpen, setMenuOpen]         = useState(false)
  const menuRef                         = useRef(null)

  // Poll backend health every 8 seconds
  useEffect(() => {
    const check = () =>
      api.health()
        .then(() => setOnline(true))
        .catch(() => setOnline(false))
    check()
    const id = setInterval(check, 8000)
    return () => clearInterval(id)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const navLink = (to, icon, label) => {
    const active = pathname === to
    return (
      <Link
        to={to}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                    transition-all duration-200
                    ${active
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
                    }`}
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </Link>
    )
  }

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/60 dark:border-gray-700/50
                        bg-white/70 dark:bg-gray-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Brand */}
        <Link to={isAuthenticated ? (isAdmin ? '/admin' : '/') : '/login'}
              className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600
                          flex items-center justify-center shadow-lg shadow-indigo-500/25
                          group-hover:scale-105 transition-transform duration-200">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight">
              TicketAI
            </span>
            <span className="hidden sm:block text-[10px] text-gray-400 dark:text-gray-500 leading-none -mt-0.5">
              BERT-Powered Routing
            </span>
          </div>
        </Link>

        {/* Nav links — only when authenticated */}
        {isAuthenticated && (
          <nav className="flex items-center gap-1">
            {!isAdmin && navLink('/', <Ticket className="w-4 h-4" />, 'Submit Ticket')}
            {isAdmin
              ? navLink('/admin',     <LayoutDashboard className="w-4 h-4" />, 'Admin Dashboard')
              : navLink('/dashboard', <User            className="w-4 h-4" />, 'My Dashboard')
            }
          </nav>
        )}

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Backend status */}
          <div
            title={online === null ? 'Checking backend…' : online ? 'Backend online' : 'Backend offline'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        transition-all duration-300
                        ${online === null
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                          : online
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                            : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                        }`}
          >
            {online === null ? (
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
            ) : online ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {online === null ? 'Checking' : online ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setDarkMode(d => !d)}
            aria-label="Toggle theme"
            className="w-9 h-9 flex items-center justify-center rounded-xl
                       text-gray-500 dark:text-gray-400
                       hover:bg-gray-100 dark:hover:bg-gray-800
                       hover:text-gray-900 dark:hover:text-white
                       transition-all duration-200"
          >
            {darkMode
              ? <Sun  className="w-[18px] h-[18px]" />
              : <Moon className="w-[18px] h-[18px]" />
            }
          </button>

          {/* User menu or login link */}
          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl
                           hover:bg-gray-100 dark:hover:bg-gray-800
                           transition-all duration-200"
              >
                {/* Avatar */}
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600
                                flex items-center justify-center text-white text-xs font-bold">
                  {user?.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[80px] truncate">
                  {user?.username}
                </span>
                {isAdmin && (
                  <span className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded-full
                                   bg-indigo-100 dark:bg-indigo-900/50
                                   text-indigo-600 dark:text-indigo-400 font-bold tracking-wide">
                    ADMIN
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 glass rounded-xl shadow-xl
                                border border-gray-200/60 dark:border-gray-700/50 overflow-hidden z-50
                                animate-fade-in">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-gray-200/60 dark:border-gray-700/50">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {user?.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email}
                    </p>
                    {user?.phone && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                        {user.phone}
                      </p>
                    )}
                  </div>

                  {/* Role badge */}
                  <div className="px-4 py-2 border-b border-gray-200/60 dark:border-gray-700/50">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                      ${isAdmin
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                        : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                      }`}>
                      {isAdmin ? 'Administrator' : 'User'}
                    </span>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-3
                               text-sm text-red-600 dark:text-red-400
                               hover:bg-red-50 dark:hover:bg-red-900/20
                               transition-colors duration-150"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="btn-primary px-4 py-2 text-sm"
            >
              Sign in
            </Link>
          )}
        </div>

      </div>
    </header>
  )
}
