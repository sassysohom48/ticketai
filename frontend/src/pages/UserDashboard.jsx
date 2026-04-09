import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  User, Ticket, TrendingUp, CheckCircle2, Clock,
  Inbox, RefreshCw, BarChart3, Send, Phone, Mail,
  CheckCheck, Loader, Circle,
} from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { getDept, DEPARTMENTS } from '../constants/departments'
import { ToastContainer, useToast } from '../components/Toast'

// ── Support constants ──────────────────────────────────────────────────────
const SUPPORT_PHONE = '+91 99671 64411'
const SUPPORT_EMAIL = 'sohom.m@somaiya.edu'

// ── Ticket progress steps ──────────────────────────────────────────────────
// Steps: Submitted → Routed → Under Review → Resolved
function getTicketStep(ticket) {
  if (ticket.status === 'Resolved' || ticket.status === 'Closed') return 3
  if (ticket.overridden) return 2   // admin corrected → actively reviewed
  return 1                           // auto-routed, under review
}

const STEPS = ['Submitted', 'AI Routed', 'Under Review', 'Resolved']

function ProgressStepper({ ticket }) {
  const current = getTicketStep(ticket)

  return (
    <div className="mt-3">
      <div className="flex items-center gap-0">
        {STEPS.map((label, idx) => {
          const done    = idx <= current
          const active  = idx === current
          const isLast  = idx === STEPS.length - 1

          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center
                                 border-2 transition-all duration-300 shrink-0
                                 ${done
                                   ? 'bg-indigo-500 border-indigo-500'
                                   : 'bg-transparent border-gray-300 dark:border-gray-600'}`}>
                  {done ? (
                    idx === current && current < 3
                      ? <Loader className="w-3 h-3 text-white animate-spin" />
                      : <CheckCheck className="w-3 h-3 text-white" />
                  ) : (
                    <Circle className="w-2 h-2 text-gray-300 dark:text-gray-600 fill-current" />
                  )}
                </div>
                <span className={`text-[9px] mt-0.5 text-center leading-tight w-14
                                  ${done ? 'text-indigo-500 dark:text-indigo-400 font-semibold'
                                         : 'text-gray-400 dark:text-gray-500'}`}>
                  {label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className={`flex-1 h-0.5 mb-3 mx-0.5 rounded-full transition-all duration-500
                                 ${idx < current
                                   ? 'bg-indigo-500'
                                   : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Confidence bar ─────────────────────────────────────────────────────────
function ConfBar({ value }) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 85 ? 'from-emerald-500 to-emerald-400' :
    pct >= 65 ? 'from-amber-500 to-amber-400'     :
                'from-red-500 to-red-400'
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${color} bar-animate`}
             style={{ '--tw': `${pct}%`, width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-400 w-8 text-right">{pct}%</span>
    </div>
  )
}

// ── Ticket card with progress ──────────────────────────────────────────────
function TicketCard({ ticket }) {
  const cfg  = getDept(ticket.department)
  const date = new Date(ticket.timestamp).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  return (
    <div className="glass rounded-xl p-4 animate-fade-in">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-gray-400">#{ticket.id}</span>
            <span className={`dept-badge text-[10px] ${cfg.badge}`}>
              {cfg.icon} {ticket.department}
            </span>
            {ticket.overridden && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30
                               text-amber-600 dark:text-amber-400 font-semibold">
                CORRECTED
              </span>
            )}
          </div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {ticket.subject}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
            {ticket.message}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-[10px] text-gray-400">{date}</span>
          <div className={`mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full
            ${ticket.status === 'Open'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
            {ticket.status}
          </div>
        </div>
      </div>

      {/* Confidence */}
      <ConfBar value={ticket.confidence} />

      {/* Progress stepper */}
      <ProgressStepper ticket={ticket} />

      {/* Support nudge */}
      <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          Need more help? Connect with us at{' '}
          <a href={`tel:${SUPPORT_PHONE}`}
             className="text-indigo-500 dark:text-indigo-400 font-semibold hover:underline">
            {SUPPORT_PHONE}
          </a>
          {' '}or{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}
             className="text-indigo-500 dark:text-indigo-400 font-semibold hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </div>
  )
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo:  'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    amber:   'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    purple:  'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  }
  return (
    <div className="glass rounded-2xl p-5 animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

// ── Distribution mini bar ─────────────────────────────────────────────────
function MiniBar({ dept, count, total }) {
  const cfg = getDept(dept)
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  if (count === 0) return null
  return (
    <div className="flex items-center gap-3">
      <span className="w-5 text-sm text-center">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs font-medium mb-1">
          <span className="text-gray-700 dark:text-gray-300 truncate">{dept}</span>
          <span className="text-gray-500 dark:text-gray-400 ml-2 shrink-0">{count}</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${cfg.bar} transition-all duration-700`}
               style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="text-xs text-gray-400 w-8 text-right shrink-0">{pct}%</span>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const { user }  = useAuth()
  const toast     = useToast()
  const [tickets,  setTickets]  = useState([])
  const [loading,  setLoading]  = useState(false)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getUserTickets()
      setTickets(data.tickets || [])
    } catch {
      toast.error('Failed to load your tickets.')
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line

  useEffect(() => { fetchTickets() }, []) // eslint-disable-line

  const total    = tickets.length
  const open     = tickets.filter(t => t.status === 'Open').length
  const avgConf  = total
    ? Math.round((tickets.reduce((s, t) => s + t.confidence, 0) / total) * 100)
    : 0
  const corrected = tickets.filter(t => t.overridden).length

  const deptMap = {}
  tickets.forEach(t => { deptMap[t.department] = (deptMap[t.department] || 0) + 1 })
  const topDept = Object.entries(deptMap).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="page-bg">
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600
                            flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">My Dashboard</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Welcome back,{' '}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{user?.username}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchTickets} disabled={loading} className="btn-secondary">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link to="/" className="btn-primary px-4 py-2 text-sm">
              <Send className="w-4 h-4" />
              New Ticket
            </Link>
          </div>
        </div>

        {/* ── Stat cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Ticket className="w-5 h-5" />}       label="Total Tickets"  value={total}                    sub="Submitted by you"        color="indigo"  />
          <StatCard icon={<TrendingUp className="w-5 h-5" />}   label="Avg Confidence" value={total ? `${avgConf}%` : '—'} sub="AI routing accuracy"  color="emerald" />
          <StatCard icon={<Clock className="w-5 h-5" />}        label="Open"           value={open}                     sub="Awaiting resolution"     color="amber"   />
          <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Top Category"   value={topDept ? getDept(topDept[0]).icon : '—'} sub={topDept ? topDept[0].split(' ')[0] : 'No tickets yet'} color="purple" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left: dept breakdown + support card ─────────────── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Department breakdown */}
            <div className="glass rounded-2xl p-5">
              <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4 text-sm">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                Your Departments
              </h2>
              {total === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No tickets yet</p>
              ) : (
                <div className="space-y-3">
                  {DEPARTMENTS.map(dept => (
                    <MiniBar key={dept} dept={dept} count={deptMap[dept] || 0} total={total} />
                  ))}
                </div>
              )}
              {total > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {corrected > 0
                      ? `${corrected} ticket${corrected > 1 ? 's were' : ' was'} manually corrected by admin.`
                      : 'All tickets were auto-routed correctly.'}
                  </p>
                </div>
              )}
            </div>

            {/* ── Customer Support Card ──────────────────────────── */}
            <div className="glass rounded-2xl p-5">
              <h2 className="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                <span className="text-base">💬</span>
                Need More Help?
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                Our support team is available to assist you directly. Reach out anytime.
              </p>

              <div className="space-y-3">
                {/* Phone */}
                <a
                  href={`tel:${SUPPORT_PHONE}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                             bg-indigo-50 dark:bg-indigo-900/30
                             border border-indigo-100 dark:border-indigo-800/50
                             hover:bg-indigo-100 dark:hover:bg-indigo-900/50
                             transition-colors duration-200 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 dark:bg-indigo-500/30
                                  flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
                      Call us
                    </p>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono group-hover:underline">
                      {SUPPORT_PHONE}
                    </p>
                  </div>
                </a>

                {/* Email */}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                             bg-purple-50 dark:bg-purple-900/30
                             border border-purple-100 dark:border-purple-800/50
                             hover:bg-purple-100 dark:hover:bg-purple-900/50
                             transition-colors duration-200 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 dark:bg-purple-500/30
                                  flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
                      Email us
                    </p>
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400 truncate group-hover:underline">
                      {SUPPORT_EMAIL}
                    </p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* ── Right: ticket list with progress ─────────────────── */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <Inbox className="w-4 h-4 text-indigo-500" />
                My Tickets
                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {total}
                </span>
              </h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="glass rounded-xl p-4 animate-pulse">
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Inbox className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-600 dark:text-gray-400 mb-1">No tickets yet</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                  Submit your first ticket and the AI will route it instantly.
                </p>
                <Link to="/" className="btn-primary inline-flex px-5 py-2.5 text-sm">
                  <Send className="w-4 h-4" />
                  Submit a Ticket
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map(ticket => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
