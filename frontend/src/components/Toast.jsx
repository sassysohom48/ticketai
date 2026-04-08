import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const ICONS = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  error:   <XCircle    className="w-5 h-5 text-red-500" />,
  info:    <Info       className="w-5 h-5 text-blue-500" />,
}

export function Toast({ id, type = 'info', message, onRemove }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // mount with slight delay to trigger CSS transition
    const show = setTimeout(() => setVisible(true), 20)
    const hide = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(id), 350)
    }, 3500)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [id, onRemove])

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg
                  bg-white dark:bg-gray-800
                  border border-gray-100 dark:border-gray-700
                  w-80 max-w-full
                  transition-all duration-300
                  ${visible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-2'
                  }`}
    >
      {ICONS[type]}
      <p className="flex-1 text-sm text-gray-700 dark:text-gray-200">{message}</p>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(id), 350) }}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end">
      {toasts.map(t => (
        <Toast key={t.id} {...t} onRemove={onRemove} />
      ))}
    </div>
  )
}

// Simple hook to manage toasts
let _counter = 0
export function useToast() {
  const [toasts, setToasts] = useState([])

  const push = (message, type = 'info') => {
    const id = ++_counter
    setToasts(ts => [...ts, { id, message, type }])
  }

  const remove = id => setToasts(ts => ts.filter(t => t.id !== id))

  return {
    toasts,
    remove,
    success: msg => push(msg, 'success'),
    error:   msg => push(msg, 'error'),
    info:    msg => push(msg, 'info'),
  }
}
