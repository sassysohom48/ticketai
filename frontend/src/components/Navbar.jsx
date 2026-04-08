import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Brain, LayoutDashboard, Ticket, Sun, Moon, Wifi, WifiOff } from 'lucide-react'
import { api } from '../api'

export default function Navbar({ darkMode, setDarkMode }) {
  const { pathname } = useLocation()
  const [online, setOnline] = useState(null) // null = checking

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/60 dark:border-gray-700/50
                        bg-white/70 dark:bg-gray-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
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

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navLink('/',      <Ticket className="w-4 h-4" />,          'Submit Ticket')}
          {navLink('/admin', <LayoutDashboard className="w-4 h-4" />, 'Admin Dashboard')}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Backend status indicator */}
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
              ? <Sun  className="w-4.5 h-4.5 w-[18px] h-[18px]" />
              : <Moon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
            }
          </button>
        </div>

      </div>
    </header>
  )
}
