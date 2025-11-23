import React from 'react'
import { Mic, MicOff } from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'
import useVoice from '../hooks/useVoice'
import type { ViewKey } from '../stores/slices/uiSlice'

type Props = {
  className?: string
}

function normalize(text: string): string {
  return text.toLowerCase().trim()
}

function matchCommand(text: string): { view?: ViewKey } | null {
  const t = normalize(text)
  const map = {
    dashboard: 'dashboard',
    home: 'dashboard',
    calendar: 'calendar',
    tasks: 'todos',
    focus: 'focus',
    habits: 'habits',
    notes: 'notes',
    projects: 'projects',
    journal: 'journal',
    travel: 'travel',
    finances: 'finances',
    finance: 'finances',
    shopping: 'shopping',
    meals: 'meals',
    goals: 'goals',
    shared: 'shared',
  } as const satisfies Record<string, ViewKey>

  for (const [key, viewKey] of Object.entries(map)) {
    if (t.includes(`go to ${key}`) || t === key || t.includes(`open ${key}`) || t.includes(`show ${key}`)) {
      return { view: viewKey }
    }
  }
  return null
}

export const VoiceControl: React.FC<Props> = ({ className = '' }) => {
  const { activeView, setActiveView } = useAppStore()
  const { supported, listening, transcript, toggle, clear, speak } = useVoice('en-US')
  const [lastHandled, setLastHandled] = React.useState('')
  const [_unsupported] = React.useState(false)

  React.useEffect(() => {
    const t = transcript.trim()
    if (!t || t === lastHandled) return
    const cmd = matchCommand(t)
    if (cmd?.view) {
      setActiveView(cmd.view)
      void speak(`Opening ${cmd.view}`)
      setLastHandled(t)
    }
  }, [transcript, lastHandled, setActiveView, speak])

  if (!supported) {
    return (
      <button
        type="button"
        className={`inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 ${className}`}
        onClick={() => {}}
      >
        <MicOff size={16} /> Voice
      </button>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        aria-pressed={listening}
        onClick={toggle}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition border ${
          listening
            ? 'bg-rose-600 text-white border-rose-600'
            : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
        }`}
      >
        {listening ? <Mic size={16} /> : <MicOff size={16} />}
        {listening ? 'Listening…' : 'Voice'}
        {listening && <span className="ml-1 h-2 w-2 rounded-full bg-white animate-pulse" />}
      </button>
      {transcript && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="mb-2 text-xs font-semibold text-slate-500">Heard</div>
          <div className="rounded-lg bg-slate-50 p-2 text-sm text-slate-800 max-h-32 overflow-auto" aria-live="polite">
            {transcript}
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <button
              className="text-slate-600 hover:underline"
              onClick={() => {
                void speak(`You are on ${activeView}`)
              }}
            >
              Speak status
            </button>
            <button className="text-slate-600 hover:underline" onClick={clear}>
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceControl