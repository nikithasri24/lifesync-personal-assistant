import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './providers/AuthProvider'
import { QueryProvider } from './providers/QueryProvider'
import { UndoRedoProvider } from './contexts/UndoRedoContext'
import { initializeCommandBus } from './lib/commandBus'

// Initialize the command bus with all handlers and middleware
initializeCommandBus();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <AuthProvider>
        <UndoRedoProvider>
          <App />
        </UndoRedoProvider>
      </AuthProvider>
    </QueryProvider>
  </StrictMode>,
)
