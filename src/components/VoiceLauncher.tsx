import React from 'react'
import { Headphones } from 'lucide-react'
import VoiceAssistant from './VoiceAssistant'

const VoiceLauncher: React.FC = () => {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-slate-900 text-white hover:bg-slate-800"
      >
        <Headphones size={16} /> Voice
      </button>
      <VoiceAssistant open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default VoiceLauncher
