import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type VoiceState = {
  supported: boolean
  listening: boolean
  transcript: string
  lang: string
  error?: string
}

export type UseVoice = VoiceState & {
  start: () => void
  stop: () => void
  toggle: () => void
  clear: () => void
  setLang: (lang: string) => void
  speak: (text: string, opts?: { rate?: number; pitch?: number; lang?: string }) => Promise<void>
}

type Options = {
  onFinal?: (text: string) => void
}

export function useVoice(initialLang = 'en-US', options?: Options): UseVoice {
  const recRef = useRef<ISpeechRecognition | null>(null)
  const [supported] = useState<boolean>(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition))
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [lang, setLang] = useState(initialLang)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!supported) return
    const Ctor = (window.SpeechRecognition || window.webkitSpeechRecognition) as any
    const rec: ISpeechRecognition = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = lang
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      let interim = ''
      for (let i = ev.results.length - 1; i >= 0; i--) {
        const result = ev.results[i]
        const alt = result[0]
        if (!alt) continue
        if (result.isFinal) {
          setTranscript((t) => (t ? `${t} ${alt.transcript}` : alt.transcript))
          if (options?.onFinal) options.onFinal(alt.transcript)
        } else {
          interim = alt.transcript
        }
      }
      // Show interim in suffix (UI can choose how to display)
      if (interim) setTranscript((t) => `${t.replace(/\s+$/, '')} ${interim}`)
    }
    rec.onerror = (e: any) => setError(e?.error || 'speech_error')
    rec.onend = () => setListening(false)
    recRef.current = rec
    return () => {
      try { rec.stop() } catch {}
      recRef.current = null
    }
  }, [lang, supported])

  const start = useCallback(() => {
    if (!supported || !recRef.current) return
    setError(undefined)
    try {
      recRef.current.lang = lang
      recRef.current.start()
      setListening(true)
    } catch (e: any) {
      setError(e?.message || 'speech_start_failed')
    }
  }, [lang, supported])

  const stop = useCallback(() => {
    if (!recRef.current) return
    try { recRef.current.stop() } catch {}
    setListening(false)
  }, [])

  const toggle = useCallback(() => (listening ? stop() : start()), [listening, start, stop])
  const clear = useCallback(() => setTranscript(''), [])

  const speak = useCallback((text: string, opts?: { rate?: number; pitch?: number; lang?: string }) => {
    return new Promise<void>((resolve) => {
      if (!('speechSynthesis' in window)) return resolve()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = opts?.lang || lang
      u.rate = opts?.rate ?? 1
      u.pitch = opts?.pitch ?? 1
      u.onend = () => resolve()
      u.onerror = () => resolve()
      try { window.speechSynthesis.cancel() } catch {}
      window.speechSynthesis.speak(u)
    })
  }, [lang])

  return useMemo(
    () => ({ supported, listening, transcript, lang, error, start, stop, toggle, clear, setLang, speak }),
    [supported, listening, transcript, lang, error, start, stop, toggle, clear, setLang, speak]
  )
}

export default useVoice
