import { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, RefreshCw, Filter, Inbox,
  TrendingUp, CheckCircle2, AlertCircle, BarChart3,
} from 'lucide-react'
import { api } from '../api'
import TicketCard from '../components/TicketCard'
import OverrideModal from '../components/OverrideModal'
import { ToastContainer, useToast } from '../components/Toast'
import { DEPARTMENTS, getDept } from '../constants/departments'

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

// ── Dept distribution bar ──────────────────────────────────────────────────
function DistBar({ dept, count, total }) {
  const cfg = getDept(dept)
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-5 text-base text-center">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs font-medium mb-1">
          <span className="text-gray-700 dark:text-gray-300 truncate">{dept}</span>
          <span className="text-gray-500 dark:text-gray-400 ml-2 shrink-0">{count}</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${cfg.bar} transition-all duration-700`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-gray-400 w-8 text-right shrink-0">{pct}%</span>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [tickets, setTickets]       = useState([])
  const [stats, setStats]           = useState(null)
  const [departments, setDepts]     = useState(['All', ...DEPARTMENTS])
  const [filterDept, setFilterDept] = useState('All')
  const [loading, setLoading]       = useState(false)
  const [overrideTarget, setOverrideTarget] = useState(null)
  const [overrideLoading, setOverrideLoading] = useState(false)
  const toast = useToast()

  const fetchAll = useCallback(async (dept = filterDept) => {
    setLoading(true)
    try {
      const [tData, sData, dData] = await Promise.all([
        api.getTickets(dept),
        api.getStats(),
        api.getDepartments(),
      ])
      setTickets(tData.tickets || [])
      setStats(sData)
      setDepts(dData.departments || ['All', ...DEPARTMENTS])
    } catch {
      toast.error('Failed to load data. Is the Flask backend running?')
    } finally {
      setLoading(false)
    }
  }, [filterDept]) // eslint-disable-line

  useEffect(() => { fetchAll() }, []) // eslint-disable-line

  const handleFilterChange = dept => {
    setFilterDept(dept)
    fetchAll(dept)
  }

  const handleOverrideConfirm = async (ticketId, newDept) => {
    setOverrideLoading(true)
    try {
      await api.feedback(ticketId, newDept)
      toast.success(`Ticket #${ticketId} reassigned to ${newDept}`)
      setOverrideTarget(null)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Override failed')
    } finally {
      setOverrideLoading(false)
    }
  }

  const avgConf = stats ? Math.round(stats.average_confidence * 100) : 0

  return (
    <div className="page-bg">
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />
      {overrideTarget && (
        <OverrideModal
          ticket={overrideTarget}
          onConfirm={handleOverrideConfirm}
          onClose={() => setOverrideTarget(null)}
          loading={overrideLoading}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600
                            flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage and review AI-routed support tickets
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchAll()}
            disabled={loading}
            className="btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* ── Stat cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Inbox className="w-5 h-5" />}
            label="Total Tickets"
            value={stats?.total_tickets ?? '—'}
            sub="All time"
            color="indigo"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Avg Confidence"
            value={stats ? `${avgConf}%` : '—'}
            sub="Model accuracy signal"
            color="emerald"
          />
          <StatCard
            icon={<AlertCircle className="w-5 h-5" />}
            label="Overridden"
            value={stats?.overridden_count ?? '—'}
            sub="Human corrections"
            color="amber"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="Showing"
            value={tickets.length}
            sub={filterDept === 'All' ? 'All departments' : filterDept}
            color="purple"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left column: distribution + filter ─────────────── */}
          <div className="lg:col-span-1 space-y-4">
            {/* Distribution chart */}
            {stats && (
              <div className="glass rounded-2xl p-5">
                <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4 text-sm">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  Department Distribution
                </h2>
                <div className="space-y-3">
                  {DEPARTMENTS.map(dept => (
                    <DistBar
                      key={dept}
                      dept={dept}
                      count={stats.department_distribution?.[dept] ?? 0}
                      total={stats.total_tickets}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Department filter */}
            <div className="glass rounded-2xl p-5">
              <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4 text-sm">
                <Filter className="w-4 h-4 text-indigo-500" />
                Filter by Department
              </h2>
              <div className="flex flex-col gap-2">
                {departments.map(dept => {
                  const cfg = dept !== 'All' ? getDept(dept) : null
                  const active = filterDept === dept
                  return (
                    <button
                      key={dept}
                      onClick={() => handleFilterChange(dept)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium
                                  transition-all duration-150 text-left
                                  ${active
                                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/30'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                  }`}
                    >
                      <span>{cfg?.icon ?? '📂'}</span>
                      {dept}
                      {stats && dept !== 'All' && (
                        <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full
                                          ${active ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                          {stats.department_distribution?.[dept] ?? 0}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Right column: ticket list ────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <Inbox className="w-4 h-4 text-indigo-500" />
                Tickets
                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800
                                 text-gray-600 dark:text-gray-300">
                  {tickets.length}
                </span>
              </h2>
            </div>

            {loading ? (
              /* Loading skeleton */
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="glass rounded-xl p-4 animate-pulse">
                    <div className="flex gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                      </div>
                      <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tickets.length === 0 ? (
              /* Empty state */
              <div className="glass rounded-2xl p-12 text-center">
                <Inbox className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  No tickets yet
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Submit a ticket from the{' '}
                  <a href="/" className="text-indigo-500 hover:underline">
                    Customer page
                  </a>{' '}
                  to see it here.
                </p>
              </div>
            ) : (
              /* Ticket grid */
              <div className="grid sm:grid-cols-2 gap-3">
                {tickets.map(ticket => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onOverride={t => setOverrideTarget(t)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
