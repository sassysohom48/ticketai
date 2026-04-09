import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain, LogIn, Eye, EyeOff, Sparkles } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const navigate  = useNavigate()
  const { setSession } = useAuth()

  const [form, setForm]       = useState({ username: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (!form.username.trim() || !form.password) {
      setError('Please enter your username and password.')
      return
    }
    setLoading(true)
    try {
      const { token, user } = await api.login(form.username.trim(), form.password)
      setSession(token, user)
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-bg min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-3xl pointer-events-none" />

      {/* Card */}
      <div className="relative w-full max-w-md animate-slide-up">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-gradient-to-br from-indigo-500 to-purple-600
                          shadow-xl shadow-indigo-500/30 mb-4">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome back
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Sign in to your TicketAI account
          </p>
        </div>

        <div className="glass rounded-2xl p-8">
          {/* Demo credentials hint */}
          <div className="mb-6 px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30
                          border border-indigo-200 dark:border-indigo-700/50">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Admin demo credentials
            </p>
            <p className="text-xs text-indigo-500 dark:text-indigo-300">
              Username: <span className="font-mono font-bold">admin</span>
              &nbsp;&nbsp;|&nbsp;&nbsp;
              Password: <span className="font-mono font-bold">admin123</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={form.username}
                onChange={set('username')}
                placeholder="Enter your username"
                autoComplete="username"
                className="input-base"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="input-base pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                             transition-colors duration-200"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4.5 h-4.5 w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20
                              border border-red-200 dark:border-red-800
                              text-red-600 dark:text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base mt-1"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                            stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
