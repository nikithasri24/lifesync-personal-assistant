import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { ensureSupabase, isSupabaseConfigured } from '../lib/supabase'
import { apiClient } from '../services/apiClient'
import { logger } from '../services/logger';

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  isConfigured: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  const ensureUserRecord = useCallback(async (authUser: User) => {
    if (!isSupabaseConfigured) return

    try {
      const client = ensureSupabase()
      const email = authUser.email?.toLowerCase() ?? `${authUser.id}@local`
      const usernameFromMetadata = typeof authUser.user_metadata?.username === 'string'
        ? authUser.user_metadata.username
        : undefined
      const username = usernameFromMetadata
        ?? (authUser.email ? authUser.email.split('@')[0] : authUser.id.slice(0, 12))

      await client
        .from('users')
        .upsert({
          id: authUser.id,
          email,
          username,
          password_hash: 'managed-by-supabase',
          first_name: typeof authUser.user_metadata?.first_name === 'string' ? authUser.user_metadata.first_name : null,
          last_name: typeof authUser.user_metadata?.last_name === 'string' ? authUser.user_metadata.last_name : null,
          email_verified: Boolean(authUser.email_confirmed_at),
          is_active: true,
        }, {
          onConflict: 'id',
        })
    } catch (err) {
      logger.warn('Failed to ensure application user record:', { err });
    }
  }, [])

  useEffect(() => {
    apiClient.setAuthContext(null)

    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    const client = ensureSupabase()

    const syncState = (nextSession: Session | null): void => {
      setSession(nextSession)
      const nextUser = nextSession?.user ?? null
      setUser(nextUser)
      apiClient.setAuthContext(nextUser?.id ?? null)
      if (nextUser) {
        void ensureUserRecord(nextUser)
      }
    }

    void client.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          logger.error('Supabase session fetch failed:', { error });
          setError(error.message)
        }
        syncState(data.session ?? null)
      })
      .finally(() => setLoading(false))

    const { data: subscription } = client.auth.onAuthStateChange((_event, nextSession) => {
      syncState(nextSession)
    })

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [ensureUserRecord])

  const signIn = async (email: string, password: string): Promise<void> => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Provide credentials in your environment.')
    }

    const client = ensureSupabase()
    setError(null)
    setLoading(true)

    try {
      const { error } = await client.auth.signInWithPassword({ email, password })
      if (error) {
        throw error
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign in'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string): Promise<void> => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Provide credentials in your environment.')
    }

    const client = ensureSupabase()
    setError(null)
    setLoading(true)

    try {
      const { error } = await client.auth.signUp({ email, password })
      if (error) {
        throw error
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign up'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<void> => {
    if (!isSupabaseConfigured) {
      setSession(null)
      setUser(null)
      apiClient.setAuthContext(null)
      return
    }

    const client = ensureSupabase()
    setError(null)

    const { error } = await client.auth.signOut()
    if (error) {
      const message = error.message || 'Unable to sign out'
      setError(message)
      throw error
    }

    setSession(null)
    setUser(null)
    apiClient.setAuthContext(null)
  }

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    loading,
    isConfigured: isSupabaseConfigured,
    error,
    signIn,
    signUp,
    signOut,
    clearError: () => setError(null),
  }), [error, loading, session, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
