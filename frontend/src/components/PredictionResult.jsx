import { useEffect, useState } from 'react'
import { CheckCircle2, Hash, Clock, ArrowRight } from 'lucide-react'
import { getDept } from '../constants/departments'

function ConfidenceBar({ value }) {
  const [width, setWidth] = useState(0)
  const pct = Math.round(value * 100)
  const cfg = getDept('Technical Support') // just for shape reference

  // Colour based on confidence level
  const barColor =
    pct >= 85 ? 'from-emerald-400 to-emerald-600' :
    pct >= 65 ? 'from-yellow-400 to-amber-500'    :
                'from-red-400 to-rose-500'

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80)
    return () => clearTimeout(t)
  }, [pct])

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-gray-500 dark:text-gray-400">Confidence</span>
        <span className={`font-bold ${pct >= 85 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 65 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
          {pct}%
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-[1200ms] ease-out relative overflow-hidden`}
          style={{ width: `${width}%` }}
        >
          <div className="absolute inset-0 shimmer-bg" />
        </div>
      </div>
    </div>
  )
}

export default function PredictionResult({ result }) {
  const dept = getDept(result.department)
  const time = result.timestamp
    ? new Date(result.timestamp).toLocaleTimeString()
    : null

  return (
    <div className="mt-6 animate-slide-up">
      {/* Success banner */}
      <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl
                      bg-emerald-50 dark:bg-emerald-900/20
                      border border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div>
          <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">
            Ticket routed successfully
          </p>
          {time && (
            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
              Processed at {time}
            </p>
          )}
        </div>
      </div>

      {/* Main result card */}
      <div className={`glass rounded-2xl p-6 ring-2 ${dept.ring} animate-scale-in`}>
        <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
          {/* Department */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-widest mb-2">
              Routed To
            </p>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{dept.icon}</span>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {result.department}
                </h3>
                <span className={`dept-badge mt-1 text-xs ${dept.badge}`}>
                  AI Prediction
                </span>
              </div>
            </div>
          </div>

          {/* Ticket ID */}
          <div className={`px-4 py-3 rounded-xl border ${dept.border} bg-white/60 dark:bg-gray-800/40`}>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1 mb-0.5">
              <Hash className="w-3 h-3" /> Ticket ID
            </p>
            <p className="font-mono font-bold text-gray-800 dark:text-gray-200 text-sm">
              {result.ticket_id}
            </p>
          </div>
        </div>

        {/* Confidence bar */}
        <ConfidenceBar value={result.confidence} />

        {/* Footer hint */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800
                        flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <ArrowRight className="w-3.5 h-3.5" />
          <span>
            Your ticket has been queued for{' '}
            <strong className="text-gray-600 dark:text-gray-300">{result.department}</strong>.
            An agent will respond shortly.
          </span>
        </div>
      </div>
    </div>
  )
}
