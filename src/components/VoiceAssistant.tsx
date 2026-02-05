import React from 'react'
import { X, Sparkles, Mic } from 'lucide-react'
import useVoice from '../hooks/useVoice'
import { ConversationEngine } from '../services/conversationEngine'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../hooks/useAuth'
import { logger } from '../services/logger'

type Props = { open: boolean; onClose: () => void }

export const VoiceAssistant: React.FC<Props> = ({ open, onClose }) => {
  const { user } = useAuth()
  const [messages, setMessages] = React.useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [state, setState] = React.useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle')
  const [rate, setRate] = React.useState(1)
  const [pitch, setPitch] = React.useState(1)
  const [isInitializing, setIsInitializing] = React.useState(false)
  const [permissionDenied, setPermissionDenied] = React.useState(false)
  const { showToast } = useToast()
  const lastAssistantRef = React.useRef<string>('')
  const squelchUntilRef = React.useRef<number>(0)
  const engineRef = React.useRef<ConversationEngine | null>(null)

  // Initialize conversation engine
  React.useEffect(() => {
    engineRef.current = new ConversationEngine(user?.id ?? 'demo-user')
  }, [user?.id])

  const { supported, listening, start, stop, speak, error: voiceError, clearError } = useVoice('en-US', {
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
          const successCalls = res.functionCalls.filter((fc: { result: { success: boolean } }) => fc.result.success)
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

  // Handle permission denied error
  React.useEffect(() => {
    logger.debug('UI', 'Voice error changed', { voiceError })

    if (voiceError === 'not-allowed') {
      logger.warn('UI', 'Permission denied error detected')
      setPermissionDenied(true)
      // Don't show toast, we have a better UI for this
    } else if (voiceError && voiceError !== 'not-allowed') {
      // Only show toast for other errors
      logger.error('UI', `Voice error: ${voiceError}`, {})
      // Clear the error after showing it
      if (voiceError !== 'not-allowed') {
        showToast(`Voice error: ${voiceError}`, 'error')
      }
    }
  }, [voiceError, showToast])

  // Handle start - just start directly, let the browser handle permission
  const handleStart = React.useCallback(() => {
    logger.debug('UI', 'handleStart called, clearing errors and permission denied state')
    // Clear the permission denied state and any errors when user tries again
    clearError()
    setPermissionDenied(false)

    // Small delay to ensure state is cleared before starting
    setTimeout(() => {
      try {
        // Start listening - browser will request permission if needed
        logger.debug('UI', 'Starting voice recognition')
        start()
      } catch (error) {
        logger.error('UI', error instanceof Error ? error : 'Failed to start voice recognition', {})
        setPermissionDenied(true)
      }
    }, 100)
  }, [start, clearError])

  React.useEffect(() => {
    if (!open) {
      setIsInitializing(false)
      setPermissionDenied(false)
      return
    }

    logger.debug('UI', 'Modal opened', { supported, voiceError })

    // Clear any previous errors and permission denied state when opening
    logger.debug('UI', 'Clearing previous errors')
    clearError()
    setPermissionDenied(false)

    if (!supported) {
      logger.error('UI', 'Voice not supported in this browser', {})
      showToast('Voice recognition not supported in this browser', 'error')
    }

    // Don't auto-start - let user click the button to start
    setIsInitializing(false)

    return () => {
      logger.debug('UI', 'Modal closed, cleaning up')
      setIsInitializing(false)
      setPermissionDenied(false)
      try { window.speechSynthesis?.cancel?.() } catch { /* Ignore cancel errors */ }
      stop()
    }
  }, [open, stop, supported, showToast, voiceError, clearError])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.code === 'Space' && !(e.target as HTMLElement)?.closest('input,textarea,button')) {
        e.preventDefault()
        if (listening) {
          stop()
        } else {
          handleStart()
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, listening, stop, handleStart, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="voice-assistant-title">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div id="voice-assistant-title" className="inline-flex items-center gap-2 text-sm font-semibold">
            <Sparkles size={16} /> Voice Assistant
            {isInitializing && <span className="text-xs text-slate-500">(Initializing...)</span>}
          </div>
          <button className="rounded-md p-1 hover:bg-slate-100" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-auto p-4 space-y-3 text-sm">
          {isInitializing && (
            <div className="text-center text-slate-500 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-2"></div>
              <p>Starting voice recognition...</p>
            </div>
          )}
          {permissionDenied && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-5 text-sm">
              <p className="font-bold text-amber-900 mb-3 text-base">🎤 Microphone Access Needed</p>
              <p className="text-amber-800 mb-4 font-medium">
                To use voice commands, you need to allow microphone access in your browser.
              </p>

              <div className="bg-white rounded-lg p-4 mb-4 border border-amber-200">
                <p className="font-semibold text-amber-900 mb-2">How to enable:</p>
                <div className="text-sm text-amber-800 space-y-2">
                  <p>1. Look for the <strong>🔒 lock icon</strong> or <strong>camera/microphone icon</strong> in your browser's address bar (top left)</p>
                  <p>2. Click it and select <strong>"Allow"</strong> for microphone</p>
                  <p>3. Refresh this page if needed</p>
                  <p>4. Click "Try Again" below</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleStart}
                  className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-semibold shadow-sm"
                >
                  ✓ Try Again
                </button>
                <button
                  onClick={() => window.open('https://support.google.com/chrome/answer/2693767', '_blank')}
                  className="px-4 py-2.5 bg-white border-2 border-amber-300 text-amber-800 rounded-lg hover:bg-amber-50 text-sm font-semibold"
                >
                  📖 Help
                </button>
              </div>
            </div>
          )}
          {!isInitializing && !permissionDenied && messages.length === 0 && (
            <div className="text-slate-600">
              <p className="mb-2 font-semibold">Click "Speak" or press Space to start!</p>
              <p>Try saying things like "Mark my reading habit as done", "What's my spending this month?", or "Add a task to review code".</p>
            </div>
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
            {!supported ? '❌ Voice not supported' :
             permissionDenied ? '🚫 Microphone permission denied' :
             listening ? '🎤 Listening… (press Space to pause)' :
             state === 'thinking' ? '🧠 Thinking…' :
             state === 'speaking' ? '🔊 Speaking…' :
             '💬 Ready! Click "Speak" or press Space'}
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
            {supported && !permissionDenied && (
              <button
                onClick={() => (listening ? stop() : handleStart())}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${listening ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
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
