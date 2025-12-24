import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './styles/design-tokens.css'
import App from './App.tsx'
import { AuthProvider } from './providers/AuthProvider'
import { QueryProvider } from './providers/QueryProvider'
import { UndoRedoProvider } from './contexts/UndoRedoContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { initializeCommandBus } from './lib/commandBus'

// Initialize the command bus with all handlers and middleware
initializeCommandBus();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <UndoRedoProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </UndoRedoProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  </StrictMode>,
)
