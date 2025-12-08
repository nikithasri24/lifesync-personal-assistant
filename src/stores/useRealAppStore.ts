import { logger } from '../services/logger';
import { create } from 'zustand'
import {
  isSupabaseConfigured,
} from '../lib/supabase'
import type {
  UserStats,
} from '../types'

type ViewKey =
  | 'dashboard'
  | 'calendar'
  | 'focus'
  | 'habits'
  | 'todos'
  | 'scheduler'
  | 'notes'
  | 'projects'
  | 'journal'
  | 'goals'
  | 'travel'
  | 'visa'
  | 'trip-planner'
  | 'finances'
  | 'shopping'
  | 'meals'
  | 'shared'
  | 'skincare'
  | 'assistant'

export interface RealAppState {
  loading: boolean
  activeView: ViewKey
  sidebarCollapsed: boolean
  // Global settings (UI preferences, not data)
  weekStartsOn: 0 | 1
  mealOptions: { breakfast: string[]; lunch: string[]; dinner: string[]; snack: string[] }

  userStats: UserStats

  initializeData: () => void
  setActiveView: (view: ViewKey) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setWeekStartsOn: (ws: 0 | 1) => void
  addMealOption: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', name: string) => void
  removeMealOption: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', name: string) => void

  // Global toast
  globalToast: { message: string; type?: 'info' | 'success' | 'error' } | null
  showGlobalToast: (message: string, type?: 'info' | 'success' | 'error') => void
  clearGlobalToast: () => void
}

const _createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch (error) {
      logger.warn('UseRealAppStore', 'crypto.randomUUID failed, falling back to Math.random()', error)
    }
  }
  return Math.random().toString(36).slice(2, 10)
}

const _toDate = (value?: string | Date | null): Date | undefined => {
  if (!value) return undefined
  if (value instanceof Date) return value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export const useRealAppStore = create<RealAppState>((set, get) => ({
  loading: false,
  activeView: (() => {
    try {
      const raw = localStorage.getItem('lifesync:activeView')
      return (raw as ViewKey) || 'dashboard'
    } catch { return 'dashboard' }
  })(),

  // Global settings (UI preferences, not data)
  weekStartsOn: (() => {
    try {
      const raw = localStorage.getItem('lifesync:settings:weekStartsOn')
      const n = raw == null ? 0 : Number(raw)
      return n === 1 ? 1 : 0
    } catch { return 0 }
  })(),
  mealOptions: (() => {
    try {
      const raw = localStorage.getItem('lifesync:mealOptions')
      const parsed = raw ? JSON.parse(raw) as { breakfast?: string[]; lunch?: string[]; dinner?: string[]; snack?: string[] } : null
      const empty = { breakfast: [], lunch: [], dinner: [], snack: [] as string[] }
      if (!parsed) return empty
      return {
        breakfast: parsed.breakfast ?? empty.breakfast,
        lunch: parsed.lunch ?? empty.lunch,
        dinner: parsed.dinner ?? empty.dinner,
        snack: parsed.snack ?? empty.snack,
      }
    } catch { return { breakfast: [], lunch: [], dinner: [], snack: [] } }
  })(),
  sidebarCollapsed: false,
  globalToast: null,

  userStats: { level: 1, xp: 0, xpToNextLevel: 100, totalGoalsCompleted: 0 },

  initializeData: () => {
    if (!isSupabaseConfigured) {
      logger.warn('UseRealAppStore', '[LifeSync] Supabase not configured; store will operate in local-only mode.')
      set({
        loading: false,
      })
      return
    }

    set({
      loading: true,
    })

    try {
      // Only load critical data for Dashboard
      // Everything else loads on-demand when user visits the page

      // Migrated to React Query:
      // - Tasks/Todos → Now using useTasksQuery hook
      // - Habits → Now using useHabitsQuery hook
      // - Focus Sessions → Now using useFocusQuery hook
      // - Notes → Now using useNotesQuery hook
      // - Journal → Now using useJournalQuery hook
      // - Goals/Dreams → Now using useLifeGoalsQuery hook
      // - Financial Accounts/Transactions → Now using useFinanceQuery hook
      // - Projects → Removed from Zustand store
      // - Meal Planning (Recipes, Meal Plans, Planned Meals, Pantry Items) → Now using React Query
      // - Shopping Lists/Items → Now using useShoppingQuery hook

      set({
        loading: false,
      })
    } catch (error) {
      logger.error('UseRealAppStore', '[LifeSync] Failed to initialise store from Supabase', error)
      set({
        loading: false,
      })
    }
  },

  setActiveView: (view) => {
    set({ activeView: view })
    try {
      localStorage.setItem('lifesync:activeView', view)
    } catch (error) {
      logger.warn('Failed to save activeView to localStorage', error)
    }
  },
  setWeekStartsOn: (ws: 0 | 1) => {
    set({ weekStartsOn: ws })
    try {
      localStorage.setItem('lifesync:settings:weekStartsOn', String(ws))
    } catch (error) {
      logger.warn('Failed to save weekStartsOn to localStorage', error)
    }
  },
  addMealOption: (mealType, name) => {
    set((state) => {
      const cleaned = name.trim()
      if (!cleaned) return {}
      const next = { ...state.mealOptions }
      const list = new Set(next[mealType])
      list.add(cleaned)
      next[mealType] = Array.from(list)
      try {
        localStorage.setItem('lifesync:mealOptions', JSON.stringify(next))
      } catch (error) {
        logger.warn('Failed to save mealOptions to localStorage', error)
      }
      return { mealOptions: next }
    })
  },
  removeMealOption: (mealType, name) => {
    set((state) => {
      const next = { ...state.mealOptions }
      next[mealType] = (next[mealType] || []).filter((n) => n !== name)
      try {
        localStorage.setItem('lifesync:mealOptions', JSON.stringify(next))
      } catch (error) {
        logger.warn('Failed to save mealOptions to localStorage', error)
      }
      return { mealOptions: next }
    })
  },
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  showGlobalToast: (message, type = 'info') => set({ globalToast: { message, type } }),
  clearGlobalToast: () => set({ globalToast: null }),
}))
