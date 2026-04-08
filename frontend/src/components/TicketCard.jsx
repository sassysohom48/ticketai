import { Hash, Clock, AlertCircle, Edit3 } from 'lucide-react'
import { getDept } from '../constants/departments'

function MiniBar({ value }) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 85 ? 'bg-emerald-500' :
    pct >= 65 ? 'bg-amber-400'   :
                'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-8 text-right">
        {pct}%
      </span>
    </div>
  )
}

export default function TicketCard({ ticket, onOverride }) {
  const dept = getDept(ticket.department)
  const date = new Date(ticket.timestamp)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`glass rounded-xl p-4 border ${dept.border}
                     hover:shadow-md transition-all duration-200 animate-fade-in`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Left: ID + subject */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Hash className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
              {ticket.id}
            </span>
            {ticket.overridden && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                               text-[10px] font-semibold
                               bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                <AlertCircle className="w-2.5 h-2.5" />
                Overridden
              </span>
            )}
          </div>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate pr-2">
            {ticket.subject}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {ticket.message || '—'}
          </p>
        </div>

        {/* Right: department badge */}
        <div className="shrink-0">
          <span className={`dept-badge text-xs ${dept.badge}`}>
            {dept.icon} {ticket.department}
          </span>
        </div>
      </div>

      {/* Confidence bar */}
      <MiniBar value={ticket.confidence} />

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3
                      border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{dateStr} · {timeStr}</span>
        </div>
        <button
          onClick={() => onOverride(ticket)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                     text-indigo-600 dark:text-indigo-400
                     bg-indigo-50 dark:bg-indigo-900/30
                     hover:bg-indigo-100 dark:hover:bg-indigo-900/50
                     transition-all duration-150"
        >
          <Edit3 className="w-3 h-3" />
          Override
        </button>
      </div>
    </div>
  )
}
