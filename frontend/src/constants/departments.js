export const DEPARTMENTS = [
  'Technical Support',
  'Billing & Payments',
  'Account Management',
  'Returns & Refunds',
  'Shipping & Delivery',
  'Product Information',
  'General Inquiry',
]

export const DEPT_CONFIG = {
  'Technical Support': {
    icon: '🔧',
    color: 'blue',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    bar:    'from-blue-400 to-blue-600',
    glow:   'shadow-blue-500/20',
    ring:   'ring-blue-500/30',
  },
  'Billing & Payments': {
    icon: '💳',
    color: 'emerald',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    bar:    'from-emerald-400 to-emerald-600',
    glow:   'shadow-emerald-500/20',
    ring:   'ring-emerald-500/30',
  },
  'Account Management': {
    icon: '👤',
    color: 'purple',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    bar:    'from-purple-400 to-purple-600',
    glow:   'shadow-purple-500/20',
    ring:   'ring-purple-500/30',
  },
  'Returns & Refunds': {
    icon: '↩️',
    color: 'orange',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
    bar:    'from-orange-400 to-orange-600',
    glow:   'shadow-orange-500/20',
    ring:   'ring-orange-500/30',
  },
  'Shipping & Delivery': {
    icon: '📦',
    color: 'cyan',
    badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800',
    bar:    'from-cyan-400 to-cyan-600',
    glow:   'shadow-cyan-500/20',
    ring:   'ring-cyan-500/30',
  },
  'Product Information': {
    icon: '📋',
    color: 'indigo',
    badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    bar:    'from-indigo-400 to-indigo-600',
    glow:   'shadow-indigo-500/20',
    ring:   'ring-indigo-500/30',
  },
  'General Inquiry': {
    icon: '💬',
    color: 'slate',
    badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    bar:    'from-slate-400 to-slate-600',
    glow:   'shadow-slate-500/20',
    ring:   'ring-slate-500/30',
  },
}

export const getDept = dept =>
  DEPT_CONFIG[dept] ?? DEPT_CONFIG['General Inquiry']
