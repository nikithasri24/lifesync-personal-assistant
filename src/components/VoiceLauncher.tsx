import React from 'react'
import { Headphones, Bug } from 'lucide-react'
import VoiceAssistant from './VoiceAssistant'
import { VoiceDebugger } from './VoiceDebugger'

const VoiceLauncher: React.FC = () => {
  const [open, setOpen] = React.useState(false)
  const [debugOpen, setDebugOpen] = React.useState(false)

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-slate-900 text-white hover:bg-slate-800"
        >
          <Headphones size={16} /> Voice
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

      <VoiceAssistant open={open} onClose={() => setOpen(false)} />
      {debugOpen && (
        <div onClick={() => setDebugOpen(false)}>
          <VoiceDebugger />
        </div>
      )}
    </>
  )
}

export default VoiceLauncher
