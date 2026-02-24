import { useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { lightColors } from '../styles/colors'
import { isSupabaseConfigured } from '../lib/supabase'

interface AuthGateProps {
  children: ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, loading, error, signIn, signUp, clearError, isConfigured } = useAuth()
  // Always use light colors for auth page (common pattern for login/signup pages)
  const colors = lightColors
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [working, setWorking] = useState(false)
  const supabaseReady = isSupabaseConfigured && isConfigured

  if (!supabaseReady) {
    return <>{children}</>
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
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
    <div
      className="fixed inset-0 overflow-auto flex items-center justify-center px-4"
      style={{
        backgroundColor: colors.bg.primary,
        minHeight: '100vh',
        width: '100vw'
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl border shadow-xl p-8"
        style={{
          backgroundColor: colors.bg.white,
          borderColor: colors.border.light,
        }}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>
            LifeSync
          </h1>
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            {mode === 'signin'
              ? 'Sign in to access your personal assistant'
              : 'Create an account to start organizing your life'}
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={(e) => void handleSubmit(e)}>
          {/* Email Field */}
          <div className="space-y-2">
            <label
              className="text-sm font-medium"
              style={{ color: colors.text.primary }}
              htmlFor="email"
            >
              Email
            </label>
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
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              style={{
                borderColor: colors.border.medium,
                backgroundColor: colors.bg.primary,
                color: colors.text.primary,
              }}
              placeholder="you@example.com"
              disabled={working || loading}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label
              className="text-sm font-medium"
              style={{ color: colors.text.primary }}
              htmlFor="password"
            >
              Password
            </label>
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
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              style={{
                borderColor: colors.border.medium,
                backgroundColor: colors.bg.primary,
                color: colors.text.primary,
              }}
              placeholder="••••••••"
              disabled={working || loading}
            />
          </div>

          {/* Error Message */}
          {error ? (
            <div
              className="rounded-xl border px-4 py-3 text-sm"
              style={{
                borderColor: 'rgba(220, 38, 38, 0.4)',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                color: '#dc2626',
              }}
            >
              {error}
            </div>
          ) : null}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={working || loading}
            className="w-full px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            }}
          >
            {working || loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center text-sm">
          {mode === 'signin' ? (
            <button
              type="button"
              className="font-medium hover:underline transition-colors"
              style={{ color: colors.accent.start }}
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
              className="font-medium hover:underline transition-colors"
              style={{ color: colors.accent.start }}
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
