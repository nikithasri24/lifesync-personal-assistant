import { create } from 'zustand'
import { differenceInDays } from 'date-fns'
import {
  ensureSupabase,
  isSupabaseConfigured,
} from '../lib/supabase'
import {
  apiClient,
  type ShoppingItemData,
  type ShoppingListData,
} from '../services/apiClient'
import type {
  UserStats,
} from '../types'

type ViewKey =
  | 'dashboard'
  | 'calendar'
  | 'focus'
  | 'habits'
  | 'todos'
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

type ShoppingCategory =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'pantry'
  | 'frozen'
  | 'bakery'
  | 'deli'
  | 'household'
  | 'personal'
  | 'electronics'
  | 'other'

interface ShoppingItem {
  id: string
  shoppingListId: string
  name: string
  quantity: number
  unit?: string
  category?: ShoppingCategory
  subcategory?: string
  priority: 'low' | 'medium' | 'high'
  purchased: boolean
  estimatedPrice?: number
  actualPrice?: number
  tags?: string[]
  assignedStore?: string
  bestStores?: string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface RealAppState {
  loading: boolean
  shoppingLoading: boolean
  // Lazy loading flags
  shoppingLoaded: boolean
  activeView: ViewKey
  sidebarCollapsed: boolean
  // Global settings (UI preferences, not data)
  weekStartsOn: 0 | 1
  mealOptions: { breakfast: string[]; lunch: string[]; dinner: string[]; snack: string[] }

  userStats: UserStats
  shoppingItems: ShoppingItem[]
  activeShoppingListId: string | null

  // ==================== 75 Hard (New Architecture) ====================
  // State
  sfhChallenge: import('../types/seventyFiveHard').SeventyFiveHardChallenge | null
  sfhCheckIns: import('../types/seventyFiveHard').DailyCheckIn[]
  sfhCheckInsLoadedRange: { from: Date | null; to: Date | null } | null  // Track loaded check-in date range for lazy loading
  sfhShowFailurePrompt: boolean
  sfhFailureDate: Date | null
  sfhShowDayCompleteMessage: boolean
  sfhShowCelebration: boolean

  // Note: 75 Hard actions are in src/stores/seventyFiveHardActions.ts (standalone functions)

  // ==================== 75 Hard ====================
  seventyFiveHardChallenges: import('../types').LegacySeventyFiveHardChallenge[]
  updateActiveChallengesDays: () => void
  resetSFHEnsuredDate: () => void

  initializeData: () => Promise<void>
  setActiveView: (view: ViewKey) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setWeekStartsOn: (ws: 0 | 1) => void
  addMealOption: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', name: string) => void
  removeMealOption: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', name: string) => void

  // Shopping - Lazy loading
  loadShoppingItems: () => Promise<void>
  addShoppingItem: (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt' | 'shoppingListId'>) => Promise<ShoppingItem>
  updateShoppingItem: (id: string, updates: Partial<ShoppingItem>) => Promise<void>
  deleteShoppingItem: (id: string) => Promise<void>
  toggleShoppingItem: (id: string) => Promise<void>

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

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch (error) {
      console.warn('crypto.randomUUID failed, falling back to Math.random()', error)
    }
  }
  return Math.random().toString(36).slice(2, 10)
}

const toDate = (value?: string | Date | null): Date | undefined => {
  if (!value) return undefined
  if (value instanceof Date) return value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

const sanitize = <T extends Record<string, unknown>>(payload: T): T => {
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined)
  return Object.fromEntries(entries) as T
}

const mapShoppingItemDataToShoppingItem = (item: ShoppingItemData): ShoppingItem => ({
  id: item.id ?? createId(),
  shoppingListId: item.shopping_list_id ?? 'unknown',
  name: item.name,
  quantity: item.quantity ?? 1,
  unit: item.unit ?? undefined,
  category: (item.category ?? 'other') as ShoppingCategory,
  subcategory: item.subcategory ?? undefined,
  priority: (item.priority as ShoppingItem['priority']) ?? 'medium',
  purchased: item.is_purchased ?? false,
  estimatedPrice: item.estimated_price !== undefined ? Number(item.estimated_price) : undefined,
  actualPrice: item.actual_price !== undefined ? Number(item.actual_price) : undefined,
  tags: item.tags ?? [],
  assignedStore: item.assigned_store ?? undefined,
  bestStores: item.best_stores ?? [],
  notes: item.notes ?? undefined,
  createdAt: toDate(item.created_at) ?? new Date(),
  updatedAt: toDate(item.updated_at) ?? new Date(),
})

const buildShoppingItemInsertPayload = (
  item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt' | 'shoppingListId'>,
): Omit<ShoppingItemData, 'id' | 'shopping_list_id' | 'created_at' | 'updated_at'> => ({
  name: item.name,
  quantity: item.quantity,
  unit: item.unit ?? undefined,
  category: item.category ?? undefined,
  subcategory: item.subcategory ?? undefined,
  priority: item.priority ?? 'medium',
  estimated_price: item.estimatedPrice ?? undefined,
  actual_price: item.actualPrice ?? undefined,
  tags: item.tags ?? undefined,
  assigned_store: item.assignedStore ?? undefined,
  best_stores: item.bestStores ?? undefined,
  notes: item.notes ?? undefined,
  is_purchased: item.purchased ?? false,
})

const buildShoppingItemUpdatePayload = (
  updates: Partial<ShoppingItem>,
): Partial<ShoppingItemData> =>
  sanitize({
    name: updates.name,
    quantity: updates.quantity,
    unit: updates.unit,
    category: updates.category,
    subcategory: updates.subcategory,
    priority: updates.priority,
    estimated_price: updates.estimatedPrice,
    actual_price: updates.actualPrice,
    tags: updates.tags,
    assigned_store: updates.assignedStore,
    best_stores: updates.bestStores,
    notes: updates.notes,
    is_purchased: updates.purchased,
  })

export const useRealAppStore = create<RealAppState>((set, get) => ({
  loading: false,
  shoppingLoading: false,
  // Lazy loading flags
  shoppingLoaded: false,
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
      const parsed = raw ? JSON.parse(raw) : null
      const empty = { breakfast: [], lunch: [], dinner: [], snack: [] as string[] }
      if (!parsed) return empty
      return { ...empty, ...parsed }
    } catch { return { breakfast: [], lunch: [], dinner: [], snack: [] } }
  })(),
  sidebarCollapsed: false,
  globalToast: null,
  sfhLastSynced: null,

  userStats: { level: 1, xp: 0, xpToNextLevel: 100, totalGoalsCompleted: 0 },
  shoppingItems: [],
  activeShoppingListId: null,
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

  initializeData: async () => {
    if (!isSupabaseConfigured) {
      console.warn('[LifeSync] Supabase not configured; store will operate in local-only mode.')
      set({
        loading: false,
        shoppingItems: [],
      })
      return
    }

    set({
      loading: true,
    })

    try {
      // Only load critical data for Dashboard
      // Everything else loads on-demand when user visits the page

      // Non-critical data moved to lazy loading:
      // - Shopping Lists → Load when visiting Shopping page

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

      set({
        loading: false,
      })

      // Update current day for all active challenges after initialization
      get().updateActiveChallengesDays()
    } catch (error) {
      console.error('[LifeSync] Failed to initialise store from Supabase', error)
      set({
        loading: false,
      })
    }
  },

  setActiveView: (view) => {
    set({ activeView: view })
    try { localStorage.setItem('lifesync:activeView', view) } catch {}
  },
  setWeekStartsOn: (ws: 0 | 1) => {
    set({ weekStartsOn: ws })
    try { localStorage.setItem('lifesync:settings:weekStartsOn', String(ws)) } catch {}
  },
  addMealOption: (mealType, name) => {
    set((state) => {
      const cleaned = name.trim()
      if (!cleaned) return {}
      const next = { ...state.mealOptions }
      const list = new Set(next[mealType])
      list.add(cleaned)
      next[mealType] = Array.from(list)
      try { localStorage.setItem('lifesync:mealOptions', JSON.stringify(next)) } catch {}
      return { mealOptions: next }
    })
  },
  removeMealOption: (mealType, name) => {
    set((state) => {
      const next = { ...state.mealOptions }
      next[mealType] = (next[mealType] || []).filter((n) => n !== name)
      try { localStorage.setItem('lifesync:mealOptions', JSON.stringify(next)) } catch {}
      return { mealOptions: next }
    })
  },
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // ==================== Shopping - Lazy Loading ====================

  loadShoppingItems: async () => {
    // Don't reload if already loaded or loading
    if (get().shoppingLoaded || get().shoppingLoading) return

    if (!isSupabaseConfigured) return
    set({ shoppingLoading: true })
    try {
      const shoppingListsRaw = await apiClient.getShoppingLists()
      let items: ShoppingItem[] = []
      let activeListId: string | null = null

      if (shoppingListsRaw.length > 0) {
        // Use first active list or just first list
        const activeList = shoppingListsRaw.find((list) => list.status === 'active') || shoppingListsRaw[0]
        activeListId = activeList.id ?? null

        if (activeListId) {
          const itemsRaw = await apiClient.getShoppingListItems(activeListId)
          items = itemsRaw.map(mapShoppingItemDataToShoppingItem)
        }
      }

      set({
        shoppingItems: items,
        activeShoppingListId: activeListId,
        shoppingLoaded: true,
        shoppingLoading: false,
      })
    } catch (e) {
      console.warn('[Store] loadShoppingItems failed; showing empty list', e)
      set({ shoppingItems: [], shoppingLoading: false })
    }
  },

  addShoppingItem: async (itemInput) => {
    if (!isSupabaseConfigured) {
      const shoppingListId = get().activeShoppingListId ?? createId()
      const item: ShoppingItem = {
        ...itemInput,
        id: createId(),
        shoppingListId,
        purchased: itemInput.purchased ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      set((state) => ({ shoppingItems: [...state.shoppingItems, item] }))
      return item
    }

    let shoppingListId = get().activeShoppingListId
    if (!shoppingListId) {
      const newList = await apiClient.createShoppingList({
        name: 'Personal List',
        status: 'active',
      })
      shoppingListId = newList.id ?? null
      set({ activeShoppingListId: shoppingListId })
    }

    if (!shoppingListId) {
      throw new Error('Failed to determine active shopping list for Supabase insert.')
    }

    const payload = buildShoppingItemInsertPayload(itemInput)
    const created = await apiClient.addShoppingItem(shoppingListId, payload)
    const item = mapShoppingItemDataToShoppingItem(created)
    set((state) => ({ shoppingItems: [...state.shoppingItems, item] }))
    return item
  },

  updateShoppingItem: async (id, updates) => {
    if (!isSupabaseConfigured) {
      set((state) => ({
        shoppingItems: state.shoppingItems.map((item) =>
          item.id === id
            ? {
                ...item,
                ...updates,
                updatedAt: new Date(),
              }
            : item,
        ),
      }))
      return
    }

    const payload = buildShoppingItemUpdatePayload(updates)
    const updated = await apiClient.updateShoppingItem(id, payload)
    const item = mapShoppingItemDataToShoppingItem(updated)
    set((state) => ({
      shoppingItems: state.shoppingItems.map((existing) =>
        existing.id === id ? item : existing,
      ),
    }))
  },

  deleteShoppingItem: async (id) => {
    if (isSupabaseConfigured) {
      await apiClient.deleteShoppingItem(id)
    }
    set((state) => ({
      shoppingItems: state.shoppingItems.filter((item) => item.id !== id),
    }))
  },

  toggleShoppingItem: async (id) => {
    const current = get().shoppingItems.find((item) => item.id === id)
    if (!current) return

    const updates: Partial<ShoppingItem> = {
      purchased: !current.purchased,
      updatedAt: new Date(),
    }

    await get().updateShoppingItem(id, updates)
  },

  setShowSFHTasksInTasks: (show: boolean) => {
    set({ showSFHTasksInTasks: show })
    try { localStorage.setItem('lifesync:settings:sfhShowInTasks', String(show)) } catch {}
  },

  showGlobalToast: (message, type = 'info') => set({ globalToast: { message, type } }),
  clearGlobalToast: () => set({ globalToast: null }),
  setSFHLastSynced: (d: Date) => {
    set({ sfhLastSynced: d })
    try { localStorage.setItem('lifesync:75hard:lastSynced', d.toISOString()) } catch {}
  },

  updateActiveChallengesDays: () => {
    const state = get()
    const today = new Date()
    let updated = false

    const updatedChallenges = state.seventyFiveHardChallenges.map(challenge => {
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
        console.warn('[75Hard] Failed to save updated challenges to localStorage', e)
      }
    }
  },

  // Reset the sfhEnsuredForDate to force task recreation
  resetSFHEnsuredDate: () => {
    set({ sfhEnsuredForDate: null })
    try {
      localStorage.removeItem('lifesync:sfh:ensuredForDate')
    } catch (err) {
      console.warn('[75Hard] Failed to remove ensuredForDate from localStorage:', err)
    }
    console.log('[75Hard] Reset sfhEnsuredForDate - tasks will be recreated on next ensureSFHTasksForToday call')
  },

  // ==================== 75 Hard (New Architecture) Methods ====================

}))
