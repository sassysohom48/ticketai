import { useState } from 'react'
import { X, Save, AlertTriangle } from 'lucide-react'
import { DEPARTMENTS, getDept } from '../constants/departments'

export default function OverrideModal({ ticket, onConfirm, onClose, loading }) {
  const [selected, setSelected] = useState(ticket.department)

  if (!ticket) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass rounded-2xl w-full max-w-md p-6 animate-scale-in z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40
                            flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                Override Department
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ticket #{ticket.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg
                       text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subject preview */}
        <div className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60
                        border border-gray-200 dark:border-gray-700 mb-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Subject</p>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
            {ticket.subject}
          </p>
        </div>

        {/* Current → New */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
            Current Department
          </p>
          <span className={`dept-badge text-sm ${getDept(ticket.department).badge}`}>
            {getDept(ticket.department).icon} {ticket.department}
          </span>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
            Correct Department
          </label>
          <div className="grid grid-cols-1 gap-2">
            {DEPARTMENTS.map(dept => {
              const cfg = getDept(dept)
              const isSelected = selected === dept
              return (
                <button
                  key={dept}
                  onClick={() => setSelected(dept)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium
                               transition-all duration-150 text-left
                               ${isSelected
                                 ? `${cfg.badge} ${cfg.border} ring-2 ${cfg.ring}`
                                 : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                               }`}
                >
                  <span className="text-lg">{cfg.icon}</span>
                  {dept}
                  {isSelected && (
                    <span className="ml-auto w-4 h-4 rounded-full bg-current opacity-70
                                     flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(ticket.id, selected)}
            disabled={loading || selected === ticket.department}
            className="btn-primary flex-1 disabled:opacity-40"
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Override
          </button>
        </div>
      </div>
    </div>
  )
}
