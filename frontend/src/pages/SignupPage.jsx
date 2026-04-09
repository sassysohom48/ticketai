import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain, UserPlus, Eye, EyeOff, Phone, Mail, User, Lock, Search, ChevronDown } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

const COUNTRY_CODES = [
  { abbr: 'US', flag: '🇺🇸', name: 'United States',       code: '+1'   },
  { abbr: 'CA', flag: '🇨🇦', name: 'Canada',              code: '+1'   },
  { abbr: 'GB', flag: '🇬🇧', name: 'United Kingdom',      code: '+44'  },
  { abbr: 'IN', flag: '🇮🇳', name: 'India',               code: '+91'  },
  { abbr: 'AU', flag: '🇦🇺', name: 'Australia',           code: '+61'  },
  { abbr: 'DE', flag: '🇩🇪', name: 'Germany',             code: '+49'  },
  { abbr: 'FR', flag: '🇫🇷', name: 'France',              code: '+33'  },
  { abbr: 'JP', flag: '🇯🇵', name: 'Japan',               code: '+81'  },
  { abbr: 'CN', flag: '🇨🇳', name: 'China',               code: '+86'  },
  { abbr: 'BR', flag: '🇧🇷', name: 'Brazil',              code: '+55'  },
  { abbr: 'MX', flag: '🇲🇽', name: 'Mexico',              code: '+52'  },
  { abbr: 'RU', flag: '🇷🇺', name: 'Russia',              code: '+7'   },
  { abbr: 'SG', flag: '🇸🇬', name: 'Singapore',           code: '+65'  },
  { abbr: 'AE', flag: '🇦🇪', name: 'UAE',                 code: '+971' },
  { abbr: 'SA', flag: '🇸🇦', name: 'Saudi Arabia',        code: '+966' },
  { abbr: 'ZA', flag: '🇿🇦', name: 'South Africa',        code: '+27'  },
  { abbr: 'NG', flag: '🇳🇬', name: 'Nigeria',             code: '+234' },
  { abbr: 'EG', flag: '🇪🇬', name: 'Egypt',               code: '+20'  },
  { abbr: 'KR', flag: '🇰🇷', name: 'South Korea',         code: '+82'  },
  { abbr: 'IT', flag: '🇮🇹', name: 'Italy',               code: '+39'  },
  { abbr: 'ES', flag: '🇪🇸', name: 'Spain',               code: '+34'  },
  { abbr: 'NL', flag: '🇳🇱', name: 'Netherlands',         code: '+31'  },
  { abbr: 'SE', flag: '🇸🇪', name: 'Sweden',              code: '+46'  },
  { abbr: 'NO', flag: '🇳🇴', name: 'Norway',              code: '+47'  },
  { abbr: 'DK', flag: '🇩🇰', name: 'Denmark',             code: '+45'  },
  { abbr: 'FI', flag: '🇫🇮', name: 'Finland',             code: '+358' },
  { abbr: 'PL', flag: '🇵🇱', name: 'Poland',              code: '+48'  },
  { abbr: 'CH', flag: '🇨🇭', name: 'Switzerland',         code: '+41'  },
  { abbr: 'AT', flag: '🇦🇹', name: 'Austria',             code: '+43'  },
  { abbr: 'BE', flag: '🇧🇪', name: 'Belgium',             code: '+32'  },
  { abbr: 'PT', flag: '🇵🇹', name: 'Portugal',            code: '+351' },
  { abbr: 'GR', flag: '🇬🇷', name: 'Greece',              code: '+30'  },
  { abbr: 'TR', flag: '🇹🇷', name: 'Turkey',              code: '+90'  },
  { abbr: 'ID', flag: '🇮🇩', name: 'Indonesia',           code: '+62'  },
  { abbr: 'PH', flag: '🇵🇭', name: 'Philippines',         code: '+63'  },
  { abbr: 'MY', flag: '🇲🇾', name: 'Malaysia',            code: '+60'  },
  { abbr: 'TH', flag: '🇹🇭', name: 'Thailand',            code: '+66'  },
  { abbr: 'VN', flag: '🇻🇳', name: 'Vietnam',             code: '+84'  },
  { abbr: 'BD', flag: '🇧🇩', name: 'Bangladesh',          code: '+880' },
  { abbr: 'PK', flag: '🇵🇰', name: 'Pakistan',            code: '+92'  },
  { abbr: 'LK', flag: '🇱🇰', name: 'Sri Lanka',           code: '+94'  },
  { abbr: 'NZ', flag: '🇳🇿', name: 'New Zealand',         code: '+64'  },
  { abbr: 'AR', flag: '🇦🇷', name: 'Argentina',           code: '+54'  },
  { abbr: 'CL', flag: '🇨🇱', name: 'Chile',               code: '+56'  },
  { abbr: 'CO', flag: '🇨🇴', name: 'Colombia',            code: '+57'  },
  { abbr: 'KE', flag: '🇰🇪', name: 'Kenya',               code: '+254' },
  { abbr: 'GH', flag: '🇬🇭', name: 'Ghana',               code: '+233' },
  { abbr: 'IL', flag: '🇮🇱', name: 'Israel',              code: '+972' },
  { abbr: 'HK', flag: '🇭🇰', name: 'Hong Kong',           code: '+852' },
  { abbr: 'TW', flag: '🇹🇼', name: 'Taiwan',              code: '+886' },
]

// ── Searchable Country Code Picker ─────────────────────────────────────────
function CountryPicker({ value, onChange }) {
  const [open, setOpen]       = useState(false)
  const [search, setSearch]   = useState('')
  const containerRef          = useRef(null)
  const searchRef             = useRef(null)

  const selected = COUNTRY_CODES.find(c => c.abbr === value) || COUNTRY_CODES[0]

  const filtered = COUNTRY_CODES.filter(c => {
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.abbr.toLowerCase().includes(q)  ||
      c.code.includes(q)
    )
  })

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search input when opened
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
    else setSearch('')
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="input-base flex items-center gap-2 w-40 cursor-pointer select-none"
      >
        <span className="text-lg leading-none">{selected.flag}</span>
        <span className="font-mono font-bold text-gray-900 dark:text-white text-sm">
          {selected.abbr}
        </span>
        <span className="text-gray-400 text-sm">{selected.code}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 ml-auto transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-72
                        glass rounded-xl shadow-2xl border border-gray-200/60 dark:border-gray-700/50
                        overflow-hidden animate-fade-in">
          {/* Search bar */}
          <div className="p-2 border-b border-gray-200/60 dark:border-gray-700/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search country…"
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg
                           bg-gray-50 dark:bg-gray-800
                           border border-gray-200 dark:border-gray-700
                           text-gray-900 dark:text-white
                           placeholder-gray-400 dark:placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
            </div>
          </div>

          {/* List */}
          <ul className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">No results</li>
            ) : filtered.map(c => (
              <li key={c.abbr + c.code}>
                <button
                  type="button"
                  onClick={() => { onChange(c.abbr); setOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm
                              transition-colors duration-100
                              ${c.abbr === value
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200'
                              }`}
                >
                  <span className="text-lg w-6 text-center leading-none">{c.flag}</span>
                  <span className="font-mono font-bold w-8 text-xs tracking-wide">{c.abbr}</span>
                  <span className="flex-1 truncate text-xs text-gray-500 dark:text-gray-400">{c.name}</span>
                  <span className="font-mono text-xs text-gray-400 shrink-0">{c.code}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Field error helper ──────────────────────────────────────────────────────
function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400 mt-1.5 animate-fade-in">
      <span className="inline-block w-3.5 h-3.5 rounded-full bg-red-500/20 text-red-500
                       flex items-center justify-center text-[9px] font-bold shrink-0">!</span>
      {msg}
    </p>
  )
}

function FieldIcon({ icon: Icon }) {
  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
      <Icon className="w-4 h-4" />
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function SignupPage() {
  const navigate = useNavigate()
  const { setSession } = useAuth()

  const [form, setForm] = useState({
    username:    '',
    email:       '',
    countryAbbr: 'US',
    phone:       '',
    password:    '',
    confirm:     '',
  })
  const [showPw, setShowPw]   = useState(false)
  const [showCon, setShowCon] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [fieldErrors, setFE]  = useState({})
  const [touched, setTouched] = useState({})

  const set = key => e => {
    const val = e.target.value
    setForm(f => ({ ...f, [key]: val }))
    // Live validation after first touch
    if (touched[key]) validateField(key, val)
  }

  const touch = key => () => {
    setTouched(t => ({ ...t, [key]: true }))
    validateField(key, form[key])
  }

  const validateField = (key, val) => {
    let msg = ''
    if (key === 'username' && val.trim().length < 3)
      msg = 'At least 3 characters required'
    if (key === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
      msg = 'Enter a valid email address (e.g. you@example.com)'
    if (key === 'phone' && val && !/^\d{4,15}$/.test(val.replace(/[\s\-()]/g, '')))
      msg = 'Phone must be 4–15 digits only'
    if (key === 'password' && val.length > 0 && val.length < 6)
      msg = 'Password must be at least 6 characters'
    if (key === 'confirm' && val && val !== form.password)
      msg = 'Passwords do not match'
    setFE(fe => ({ ...fe, [key]: msg }))
    return msg
  }

  const validate = () => {
    const keys = ['username', 'email', 'phone', 'password', 'confirm']
    const errs = {}
    keys.forEach(k => {
      const msg = validateField(k, form[k])
      if (msg) errs[k] = msg
    })
    if (!form.username.trim()) errs.username = 'Username is required'
    if (!form.email.trim())    errs.email    = 'Email is required'
    if (!form.password)        errs.password = 'Password is required'
    if (!form.confirm)         errs.confirm  = 'Please confirm your password'
    setFE(errs)
    return errs
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    const errs = validate()
    if (Object.keys(errs).length) return

    setLoading(true)
    const countryEntry = COUNTRY_CODES.find(c => c.abbr === form.countryAbbr) || COUNTRY_CODES[0]
    const phone = form.phone.trim()
      ? `${countryEntry.code} ${form.phone.trim()}`
      : ''
    try {
      const { token, user } = await api.register(
        form.username.trim(), form.password, form.email.trim(), phone
      )
      setSession(token, user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = key =>
    `input-base pl-10 ${fieldErrors[key] ? 'border-red-400 dark:border-red-500 focus:ring-red-400/70' : ''}`

  return (
    <div className="page-bg min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-gradient-to-br from-indigo-500 to-purple-600
                          shadow-xl shadow-indigo-500/30 mb-4">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Create account
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Join TicketAI — get instant AI-powered support
          </p>
        </div>

        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Username <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <FieldIcon icon={User} />
                <input
                  type="text"
                  value={form.username}
                  onChange={set('username')}
                  onBlur={touch('username')}
                  placeholder="Choose a username (min. 3 chars)"
                  autoComplete="username"
                  className={inputCls('username')}
                />
              </div>
              <FieldError msg={fieldErrors.username} />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <FieldIcon icon={Mail} />
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  onBlur={touch('email')}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={inputCls('email')}
                />
              </div>
              <FieldError msg={fieldErrors.email} />
            </div>

            {/* Phone with searchable country picker */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Phone number <span className="text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <div className="flex gap-2 items-start">
                <CountryPicker
                  value={form.countryAbbr}
                  onChange={abbr => setForm(f => ({ ...f, countryAbbr: abbr }))}
                />
                <div className="flex-1">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={set('phone')}
                    onBlur={touch('phone')}
                    placeholder="Phone number"
                    autoComplete="tel-national"
                    className={`input-base ${fieldErrors.phone ? 'border-red-400 dark:border-red-500 focus:ring-red-400/70' : ''}`}
                  />
                  <FieldError msg={fieldErrors.phone} />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <FieldIcon icon={Lock} />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  onBlur={touch('password')}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  className={`${inputCls('password')} pr-11`}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {showPw ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              <FieldError msg={fieldErrors.password} />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Confirm password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <FieldIcon icon={Lock} />
                <input
                  type={showCon ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={set('confirm')}
                  onBlur={touch('confirm')}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className={`${inputCls('confirm')} pr-11`}
                />
                <button type="button" onClick={() => setShowCon(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {showCon ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              <FieldError msg={fieldErrors.confirm} />
            </div>

            {/* Global error */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20
                              border border-red-200 dark:border-red-800
                              text-red-600 dark:text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-1">
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </>
              ) : (
                <><UserPlus className="w-5 h-5" />Create Account</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
