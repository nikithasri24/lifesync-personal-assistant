import React from 'react'
import { X, Sparkles, Mic } from 'lucide-react'
import useVoice from '../hooks/useVoice'
import { handleUtterance, type IntentContext } from '../voice/intents'
import { useAppStore } from '../stores/useAppStore'

type Props = { open: boolean; onClose: () => void }

export const VoiceAssistant: React.FC<Props> = ({ open, onClose }) => {
  const [messages, setMessages] = React.useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [state, setState] = React.useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle')
  const [context, setContext] = React.useState<IntentContext>({})
  const [rate, setRate] = React.useState(1)
  const [pitch, setPitch] = React.useState(1)
  const { setActiveView, showGlobalToast } = useAppStore() as any
  const lastAssistantRef = React.useRef<string>('')
  const squelchUntilRef = React.useRef<number>(0)

  const { supported, listening, start, stop, speak } = useVoice('en-US', {
    onFinal: async (text) => {
      // Echo suppression: ignore if within squelch window or matches last assistant text
      const now = Date.now()
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
      const nt = norm(text)
      if (now < squelchUntilRef.current) return
      if (lastAssistantRef.current && (nt === norm(lastAssistantRef.current) || nt.includes(norm(lastAssistantRef.current)))) return
      if (nt.includes('how can i help you today')) return

      setMessages((m) => [...m, { role: 'user', text }])
      setState('thinking')
      try {
        const res = await handleUtterance(text, context)
        if (res.navigateView) setActiveView(res.navigateView as any)
        setMessages((m) => [...m, { role: 'assistant', text: res.reply }])
        setContext((c) => ({ ...c, ...res.context }))
        setState('speaking')
        if (listening) stop()
        // Squelch recognition during TTS and a short grace period after
        squelchUntilRef.current = Date.now() + 2000
        lastAssistantRef.current = res.reply
        await speak(res.reply, { rate, pitch })
        if (res.toast) {
          showGlobalToast?.(res.toast.message, res.toast.type)
        }
        setState('idle')
        setTimeout(() => {
          squelchUntilRef.current = Date.now() + 800
          start()
        }, 600)
      } catch (e) {
        setMessages((m) => [...m, { role: 'assistant', text: 'Sorry, something went wrong.' }])
        setState('idle')
        setTimeout(() => start(), 600)
      }
    },
  })

  React.useEffect(() => {
    if (!open) return
    if (supported) start()
    return () => {
      try { window.speechSynthesis?.cancel?.() } catch {}
      stop()
    }
  }, [open, start, stop, supported])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target as HTMLElement)?.closest('input,textarea')) {
        e.preventDefault()
        if (listening) stop(); else start()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, listening, start, stop])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="voice-assistant-title">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div id="voice-assistant-title" className="inline-flex items-center gap-2 text-sm font-semibold">
            <Sparkles size={16} /> Voice Assistant
          </div>
          <button className="rounded-md p-1 hover:bg-slate-100" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-auto p-4 space-y-3 text-sm">
          {messages.length === 0 && (
            <div className="text-slate-600">Ask things like “What’s my spending this month?” or “Add transaction 12 dollars for coffee”.</div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'assistant' ? '' : 'justify-end'}`}>
              <div className={`rounded-xl px-3 py-2 ${m.role === 'assistant' ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-white'}`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
          <div className="text-xs text-slate-600 flex-1">
            {supported ? (listening ? 'Listening… (press Space to pause)' : state === 'thinking' ? 'Thinking…' : 'Idle (press Space to speak)') : 'Voice not supported'}
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-600">
            <label className="flex items-center gap-1">Rate
              <input type="range" min={0.5} max={1.5} step={0.1} value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} />
            </label>
            <label className="flex items-center gap-1">Pitch
              <input type="range" min={0.5} max={1.5} step={0.1} value={pitch} onChange={(e) => setPitch(parseFloat(e.target.value))} />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm border border-slate-300 text-slate-800 hover:bg-slate-50"
            >
              Close
            </button>
            {supported && (
              <button
                onClick={() => (listening ? stop() : start())}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${listening ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}
              >
                <Mic size={16} /> {listening ? 'Stop' : 'Speak'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoiceAssistant
