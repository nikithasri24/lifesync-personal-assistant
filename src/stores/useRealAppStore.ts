import { logger } from '../services/logger';
import { create } from 'zustand'
import { differenceInDays } from 'date-fns'
import {
  ensureSupabase,
  isSupabaseConfigured,
} from '../lib/supabase'
import {
  apiClient,
} from '../services/apiClient'
import type {
  UserStats,
  DailyCheckIn,
} from '../types'
import type { SeventyFiveHardChallenge } from '../types/seventyFiveHard'

interface LegacySeventyFiveHardChallenge {
  id: string
  startDate: Date
  currentDay: number
  isActive: boolean
}

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
  | 'seventy-five-hard'
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

  // ==================== 75 Hard (New Architecture) ====================
  // State
  sfhChallenge: SeventyFiveHardChallenge | null
  sfhCheckIns: DailyCheckIn[]
  sfhCheckInsLoadedRange: { from: Date | null; to: Date | null } | null  // Track loaded check-in date range for lazy loading
  sfhShowFailurePrompt: boolean
  sfhFailureDate: Date | null
  sfhShowDayCompleteMessage: boolean
  sfhShowCelebration: boolean

  // Note: 75 Hard actions are in src/stores/seventyFiveHardActions.ts (standalone functions)

  // ==================== 75 Hard ====================
  seventyFiveHardChallenges: LegacySeventyFiveHardChallenge[]
  updateActiveChallengesDays: () => void
  resetSFHEnsuredDate: () => void

  initializeData: () => void
  setActiveView: (view: ViewKey) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setWeekStartsOn: (ws: 0 | 1) => void
  addMealOption: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', name: string) => void
  removeMealOption: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', name: string) => void

  // 75 Hard × Tasks integration
  showSFHTasksInTasks: boolean
  setShowSFHTasksInTasks: (show: boolean) => void
  sfhEnsureInProgress: boolean
  sfhEnsuredForDate: string | null

  // Global toast
  globalToast: { message: string; type?: 'info' | 'success' | 'error' } | null
  showGlobalToast: (message: string, type?: 'info' | 'success' | 'error') => void
  clearGlobalToast: () => void

  // 75 Hard sync status
  sfhLastSynced: Date | null
  setSFHLastSynced: (d: Date) => void

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

  // 75 Hard (New Architecture) - Initial State
  sfhChallenge: null,
  sfhCheckIns: [],
  sfhCheckInsLoadedRange: null,
  sfhShowFailurePrompt: false,
  sfhFailureDate: null,
  sfhShowDayCompleteMessage: false,
  sfhShowCelebration: false,
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
  sfhLastSynced: null,

  userStats: { level: 1, xp: 0, xpToNextLevel: 100, totalGoalsCompleted: 0 },
  showSFHTasksInTasks: (() => {
    try {
      const raw = localStorage.getItem('lifesync:settings:sfhShowInTasks')
      if (raw == null) return true
      return raw === 'true'
    } catch { return true }
  })(),
  sfhEnsureInProgress: false,
  sfhEnsuredForDate: null,
  seventyFiveHardChallenges: [],

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

      // Update current day for all active challenges after initialization
      get().updateActiveChallengesDays()
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

  setShowSFHTasksInTasks: (show: boolean) => {
    set({ showSFHTasksInTasks: show })
    try {
      localStorage.setItem('lifesync:settings:sfhShowInTasks', String(show))
    } catch (error) {
      logger.warn('Failed to save sfhShowInTasks to localStorage', error)
    }
  },

  showGlobalToast: (message, type = 'info') => set({ globalToast: { message, type } }),
  clearGlobalToast: () => set({ globalToast: null }),
  setSFHLastSynced: (d: Date) => {
    set({ sfhLastSynced: d })
    try {
      localStorage.setItem('lifesync:75hard:lastSynced', d.toISOString())
    } catch (error) {
      logger.warn('Failed to save 75hard lastSynced to localStorage', error)
    }
  },

  updateActiveChallengesDays: () => {
    const state = get()
    const today = new Date()
    let updated = false

    const updatedChallenges = state.seventyFiveHardChallenges.map((challenge: LegacySeventyFiveHardChallenge) => {
      if (!challenge.isActive) return challenge

      // Calculate the actual current day based on elapsed time
      const daysElapsed = differenceInDays(today, challenge.startDate)
      const actualCurrentDay = Math.max(1, Math.min(daysElapsed + 1, 75))

      // Only update if the value has changed
      if (actualCurrentDay !== challenge.currentDay) {
        updated = true
        return { ...challenge, currentDay: actualCurrentDay }
      }

      return challenge
    })

    if (updated) {
      set({ seventyFiveHardChallenges: updatedChallenges })
      // Persist to localStorage
      try {
        localStorage.setItem('lifesync:75hard', JSON.stringify(updatedChallenges))
      } catch (e) {
        logger.warn('UseRealAppStore', '[75Hard] Failed to save updated challenges to localStorage', e)
      }
    }
  },

  // Reset the sfhEnsuredForDate to force task recreation
  resetSFHEnsuredDate: () => {
    set({ sfhEnsuredForDate: null })
    try {
      localStorage.removeItem('lifesync:sfh:ensuredForDate')
    } catch (err) {
      logger.warn('UseRealAppStore', '[75Hard] Failed to remove ensuredForDate from localStorage:', err)
    }
    logger.info('UseRealAppStore', '[75Hard] Reset sfhEnsuredForDate - tasks will be recreated on next ensureSFHTasksForToday call')
  },

  // ==================== 75 Hard (New Architecture) Methods ====================

}))
