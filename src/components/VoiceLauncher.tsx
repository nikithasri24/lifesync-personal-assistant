import React from 'react'
import { Headphones, Bug } from 'lucide-react'
import VoiceAssistant from './VoiceAssistant'
import { VoiceDebugger } from './VoiceDebugger'

const VoiceLauncher: React.FC = () => {
  const [open, setOpen] = React.useState(false)
  const [debugOpen, setDebugOpen] = React.useState(false)
  const [isOpening, setIsOpening] = React.useState(false)

  const handleOpen = React.useCallback(() => {
    if (isOpening || open) return

    setIsOpening(true)

    try {
      // Check if speech recognition is supported
      if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        alert('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
        setIsOpening(false)
        return
      }

      // Open the modal - permission will be requested when user clicks "Speak"
      setOpen(true)

      // Reset opening state after a delay
      setTimeout(() => setIsOpening(false), 300)
    } catch (error) {
      console.error('[VoiceLauncher] Error opening modal:', error)
      setIsOpening(false)
    }
  }, [isOpening, open])

  const handleClose = React.useCallback(() => {
    setOpen(false)
    setIsOpening(false)
  }, [])

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleOpen}
          disabled={isOpening}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Headphones size={16} /> {isOpening ? 'Opening...' : 'Voice'}
        </button>

        {/* Debug button - only show in development */}
        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={() => setDebugOpen(true)}
            className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-sm bg-orange-600 text-white hover:bg-orange-700"
            title="Debug Voice"
          >
            <Bug size={14} />
          </button>
        )}
      </div>

      <VoiceAssistant open={open} onClose={handleClose} />
      {debugOpen && (
        <div onClick={() => setDebugOpen(false)}>
          <VoiceDebugger />
        </div>
      )}
    </>
  )
}

export default VoiceLauncher
