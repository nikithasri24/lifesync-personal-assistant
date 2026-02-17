import React from 'react'
import { Headphones } from 'lucide-react'
import VoiceAssistant from './VoiceAssistant'
import { logger } from '@/services/logger'

const VoiceLauncher: React.FC = () => {
  const [open, setOpen] = React.useState(false)
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
      logger.error('Voice', 'Error opening modal:', error)
      setIsOpening(false)
    }
  }, [isOpening, open])

  const handleClose = React.useCallback(() => {
    setOpen(false)
    setIsOpening(false)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={isOpening}
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <Headphones size={16} /> {isOpening ? 'Opening...' : 'Voice'}
      </button>

      <VoiceAssistant open={open} onClose={handleClose} />
    </>
  )
}

export default VoiceLauncher
