import { useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseConfigured } from '../lib/supabase'

interface AuthGateProps {
  children: ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, loading, error, signIn, signUp, clearError, isConfigured } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [working, setWorking] = useState(false)
  const supabaseReady = isSupabaseConfigured && isConfigured

  if (!supabaseReady) {
    return <>{children}</>
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setWorking(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
    } finally {
      setWorking(false)
    }
  }

  if (user) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 backdrop-blur shadow-xl p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-foreground">LifeSync</h1>
          <p className="text-muted mt-2">
            {mode === 'signin'
              ? 'Sign in to access your shared LifeSync workspace.'
              : 'Create an account to start collaborating in LifeSync.'}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => {
                if (error) clearError()
                setEmail(event.target.value)
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="you@example.com"
              disabled={working || loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={(event) => {
                if (error) clearError()
                setPassword(event.target.value)
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
              disabled={working || loading}
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={working || loading}
            className="w-full rounded-lg bg-primary px-3 py-2 text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {working || loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          {mode === 'signin' ? (
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => {
                clearError()
                setMode('signup')
              }}
            >
              Need an account? Sign up
            </button>
          ) : (
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => {
                clearError()
                setMode('signin')
              }}
            >
              Already registered? Sign in
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthGate
