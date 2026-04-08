import { useState, useRef } from 'react'
import { Send, Ticket, Brain, Sparkles, RotateCcw, Lightbulb } from 'lucide-react'
import { api } from '../api'
import PredictionResult from '../components/PredictionResult'
import { ToastContainer, useToast } from '../components/Toast'

const EXAMPLES = [
  {
    subject: 'App crashes on photo upload',
    message: "The mobile app crashes every time I try to upload a photo. I've reinstalled it twice but the issue persists on both WiFi and cellular.",
  },
  {
    subject: 'Incorrect charge on my account',
    message: 'I was charged $29.99 this month instead of the $9.99 subscription plan I signed up for. Please review my billing history and process a refund.',
  },
  {
    subject: 'Order not delivered — tracking stuck',
    message: 'My order #ORD-88421 was supposed to arrive 3 days ago. The tracking page shows "In Transit" but nothing has moved. Where is my package?',
  },
  {
    subject: 'How do I reset two-factor authentication?',
    message: "I lost access to my authenticator app and I'm locked out of my account. I need help resetting my 2FA without losing any data.",
  },
  {
    subject: 'Product compatibility question',
    message: 'Is the Model X Pro compatible with Windows 11? I need to know the system requirements before purchasing. Does it support USB-C charging?',
  },
]

export default function CustomerPage() {
  const [subject, setSubject]   = useState('')
  const [message, setMessage]   = useState('')
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const resultRef               = useRef(null)
  const toast                   = useToast()

  const handleSubmit = async e => {
    e.preventDefault()
    if (!subject.trim() && !message.trim()) {
      setError('Please enter a subject or message before submitting.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await api.predict(subject.trim(), message.trim())
      setResult(data)
      toast.success(`Ticket routed to ${data.department}!`)
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not reach the backend. Is Flask running?'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const loadExample = ex => {
    setSubject(ex.subject)
    setMessage(ex.message)
    setResult(null)
    setError('')
  }

  const reset = () => {
    setSubject('')
    setMessage('')
    setResult(null)
    setError('')
  }

  return (
    <div className="page-bg">
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden hero-dots">
        {/* Gradient blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full
                        bg-indigo-400/20 dark:bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -top-16 -right-24 w-80 h-80 rounded-full
                        bg-purple-400/20 dark:bg-purple-600/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 pt-14 pb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                          bg-indigo-100 dark:bg-indigo-900/60
                          text-indigo-600 dark:text-indigo-300
                          text-xs font-semibold tracking-wide mb-5 animate-fade-in">
            <Brain className="w-3.5 h-3.5" />
            BERT-Powered AI Classification
            <Sparkles className="w-3.5 h-3.5" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white
                         leading-tight mb-4 animate-slide-up">
            Instant Support{' '}
            <span className="text-gradient">Ticket Routing</span>
          </h1>

          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto animate-slide-up">
            Describe your issue and our AI instantly detects the right department —
            no hold music, no wrong queues.
          </p>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 pb-20">

        {/* Example quick-fill */}
        <div className="mb-5">
          <p className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400
                        uppercase tracking-widest mb-3">
            <Lightbulb className="w-3.5 h-3.5" />
            Try an example
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => loadExample(ex)}
                className="px-3 py-1.5 text-xs rounded-full font-medium
                           border border-indigo-200 dark:border-indigo-700
                           text-indigo-600 dark:text-indigo-400
                           hover:bg-indigo-50 dark:hover:bg-indigo-900/30
                           transition-all duration-200"
              >
                {ex.subject}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket form */}
        <div className="glass rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600
                            flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">New Support Ticket</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Fill in the details — our AI does the rest
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Subject <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Brief summary of your issue…"
                maxLength={200}
                className="input-base"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe your issue in as much detail as possible…"
                rows={5}
                maxLength={2000}
                className="input-base resize-none"
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-400">
                  {message.length} / 2000
                </span>
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

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 py-3 text-base"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                              stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analysing with BERT…
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Ticket
                  </>
                )}
              </button>

              {(subject || message || result) && (
                <button
                  type="button"
                  onClick={reset}
                  className="btn-secondary"
                  title="Clear form"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Result */}
        <div ref={resultRef}>
          {result && <PredictionResult result={result} />}
        </div>

        {/* How it works */}
        <div className="mt-10 glass rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-500" />
            How It Works
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: '01', title: 'Text Input', desc: 'You enter a subject and message describing your issue.' },
              { step: '02', title: 'BERT Analysis', desc: 'Our NLP model tokenises and classifies your text across 7 departments.' },
              { step: '03', title: 'Instant Routing', desc: 'The ticket is routed to the best-matching team with a confidence score.' },
            ].map(item => (
              <div key={item.step} className="flex flex-col gap-2">
                <span className="text-xs font-mono font-bold text-indigo-500 dark:text-indigo-400">
                  {item.step}
                </span>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
