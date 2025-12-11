import React from 'react'
import { X, Sparkles, Mic } from 'lucide-react'
import useVoice from '../hooks/useVoice'
import { ConversationEngine } from '../services/conversationEngine'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../hooks/useAuth'

type Props = { open: boolean; onClose: () => void }

export const VoiceAssistant: React.FC<Props> = ({ open, onClose }) => {
  const { user } = useAuth()
  const [messages, setMessages] = React.useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [state, setState] = React.useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle')
  const [rate, setRate] = React.useState(1)
  const [pitch, setPitch] = React.useState(1)
  const { showToast } = useToast()
  const lastAssistantRef = React.useRef<string>('')
  const squelchUntilRef = React.useRef<number>(0)
  const engineRef = React.useRef<ConversationEngine | null>(null)

  // Initialize conversation engine
  React.useEffect(() => {
    engineRef.current = new ConversationEngine(user?.id ?? 'demo-user')
  }, [user?.id])

  const { supported, listening, start, stop, speak } = useVoice('en-US', {
    onFinal: (text) => {
      void (async () => {
      // Echo suppression: ignore if within squelch window or matches last assistant text
      const now = Date.now()
      const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
      const nt = norm(text)
      if (now < squelchUntilRef.current) return
      if (lastAssistantRef.current && (nt === norm(lastAssistantRef.current) || nt.includes(norm(lastAssistantRef.current)))) return
      if (nt.includes('how can i help you today')) return

      setMessages((m) => [...m, { role: 'user', text }])
      setState('thinking')

      // Stop listening immediately to prevent echo
      if (listening) stop()

      try {
        const res = await engineRef.current?.chat(text)
        if (!res) {
          throw new Error('No response from AI')
        }
        setMessages((m) => [...m, { role: 'assistant', text: res.response }])

        // Store response and set long squelch window BEFORE speaking
        lastAssistantRef.current = res.response
        const estimatedSpeechDuration = res.response.length * 50 // ~50ms per character
        squelchUntilRef.current = Date.now() + estimatedSpeechDuration + 3000 // speech duration + 3 second buffer

        setState('speaking')
        await speak(res.response, { rate, pitch })

        // Show success toast for function calls
        if (res.functionCalls && res.functionCalls.length > 0) {
          const successCalls = res.functionCalls.filter(fc => fc.result.success)
          if (successCalls.length > 0) {
            showToast(`Completed ${successCalls.length} action${successCalls.length > 1 ? 's' : ''}`, 'success')
          }
        }

        setState('idle')
        // Wait a bit before restarting listening
        setTimeout(() => {
          start()
        }, 1000)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        let userMessage = 'Sorry, something went wrong.'
        let retryDelay = 3000

        if (errorMessage.includes('rate_limit_exceeded') || errorMessage.includes('429')) {
          userMessage = 'Hit rate limit. Waiting 10 seconds before listening again...'
          retryDelay = 10000 // Wait 10 seconds for rate limit
        } else if (errorMessage.includes('model_decommissioned')) {
          userMessage = 'The AI model needs to be updated. Please refresh the page.'
        }

        setMessages((m) => [...m, { role: 'assistant', text: userMessage }])
        setState('idle')
        setTimeout(() => start(), retryDelay)
      }
      })()
    },
  })

  React.useEffect(() => {
    if (!open) return
    if (supported) start()
    return () => {
      try { window.speechSynthesis?.cancel?.() } catch { /* Ignore cancel errors */ }
      stop()
    }
  }, [open, start, stop, supported])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
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
  }, [open, listening, start, stop, onClose])

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
            <div className="text-slate-600">Try saying things like "Mark my reading habit as done", "What's my spending this month?", or "Add a task to review code".</div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'assistant' ? '' : 'justify-end'}`}>
              <div
                className={`rounded-xl px-4 py-2.5 max-w-[80%] ${
                  m.role === 'assistant'
                    ? 'bg-slate-100 text-slate-900'
                    : 'bg-gradient-to-br from-orange-600 to-pink-600 shadow-lg'
                }`}
                style={m.role === 'user' ? { color: '#ffffff', fontWeight: '500' } : undefined}
              >
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
