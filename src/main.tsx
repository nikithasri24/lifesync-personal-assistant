import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import './index.css'
import './styles/design-tokens.css'
import App from './App.tsx'
import { AuthProvider } from './providers/AuthProvider'
import { QueryProvider } from './providers/QueryProvider'
import { UndoRedoProvider } from './contexts/UndoRedoContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initializeCommandBus } from './lib/commandBus'

// Initialize Sentry for production error monitoring
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production to a lower value (e.g., 0.1 = 10%)
    tracesSampleRate: 0.1,
    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Filter out sensitive data
    beforeSend(event) {
      // Don't send events that contain passwords or tokens
      if (event.request?.data) {
        const data = JSON.stringify(event.request.data);
        if (data.includes('password') || data.includes('token')) {
          return null;
        }
      }
      return event;
    },
  });
}

// Initialize the command bus with all handlers and middleware
initializeCommandBus();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
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
    </StrictMode>
  </ErrorBoundary>,
)
