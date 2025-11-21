import { create } from 'zustand'
import { addDays, startOfWeek, differenceInDays, format as formatDate, startOfDay } from 'date-fns'
import {
  ensureSupabase,
  isSupabaseConfigured,
} from '../lib/supabase'
import {
  apiClient,
  type MealPlanData,
  type PlannedMealData,
  type PantryItemData,
  type ProjectData,
  type RecipeData,
  type ShoppingItemData,
  type ShoppingListData,
} from '../services/apiClient'
import type {
  MealColumn,
  MealPlanWeek,
  PantryItem,
  PlannedMeal,
  Recipe,
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

interface Project {
  id: string
  name: string
  description?: string
  color: string
  status: 'active' | 'completed' | 'on_hold'
  icon: string
  createdAt: Date
  updatedAt?: Date
}

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

interface RealAppState {
  loading: boolean
  projectsLoading: boolean
  mealPlansLoading: boolean
  recipesLoading: boolean
  shoppingLoading: boolean
  // Lazy loading flags
  recipesLoaded: boolean
  mealPlansLoaded: boolean
  shoppingLoaded: boolean
  activeView: ViewKey
  sidebarCollapsed: boolean
  // Global settings
  weekStartsOn: 0 | 1
  mealOptions: { breakfast: string[]; lunch: string[]; dinner: string[]; snack: string[] }

  projects: Project[]
  recipes: Recipe[]
  pantryItems: PantryItem[]
  mealPlans: MealPlanWeek[]
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

  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>

  // Recipes & Meal Plans - Lazy loading
  loadRecipes: () => Promise<void>
  loadMealPlans: () => Promise<void>
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => Promise<Recipe>
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>
  deleteRecipe: (id: string) => Promise<void>
  deleteAllRecipes: () => Promise<void>

  loadMealPlans: () => Promise<void>
  ensureMealPlanForWeek: (weekStartDate: Date) => Promise<MealPlanWeek>
  addPlannedMeal: (
    planId: string,
    meal: Omit<PlannedMeal, 'id' | 'mealPlanId' | 'createdAt'>,
  ) => Promise<PlannedMeal>
  updatePlannedMeal: (mealId: string, updates: Partial<PlannedMeal>) => Promise<void>
  deletePlannedMeal: (mealId: string) => Promise<void>

  // Shopping - Lazy loading
  loadShoppingItems: () => Promise<void>
  addShoppingItem: (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt' | 'shoppingListId'>) => Promise<ShoppingItem>
  updateShoppingItem: (id: string, updates: Partial<ShoppingItem>) => Promise<void>
  deleteShoppingItem: (id: string) => Promise<void>
  toggleShoppingItem: (id: string) => Promise<void>

  // Pantry
  addPantryItem: (item: Omit<PantryItem, 'id' | 'updatedAt'>) => Promise<PantryItem>
  updatePantryItem: (id: string, updates: Partial<PantryItem>) => Promise<void>
  deletePantryItem: (id: string) => Promise<void>

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

const DEFAULT_MEAL_COLUMNS: MealColumn[] = [
  {
    id: 'breakfast',
    name: 'Breakfast',
    defaultServings: 2,
    defaultPeopleCount: 2,
    color: '#f97316',
    icon: '☀️',
    order: 1,
  },
  {
    id: 'lunch',
    name: 'Lunch',
    defaultServings: 2,
    defaultPeopleCount: 2,
    color: '#10b981',
    icon: '🥗',
    order: 2,
  },
  {
    id: 'dinner',
    name: 'Dinner',
    defaultServings: 4,
    defaultPeopleCount: 4,
    color: '#8b5cf6',
    icon: '🍽️',
    order: 3,
  },
  {
    id: 'snack',
    name: 'Snacks',
    defaultServings: 1,
    defaultPeopleCount: 1,
    color: '#6b7280',
    icon: '🍿',
    order: 4,
  },
]

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

const mapProjectDataToProject = (project: ProjectData): Project => ({
  id: project.id ?? createId(),
  name: project.name,
  description: project.description ?? '',
  color: project.color ?? '#6366f1',
  status: (project.status as Project['status']) ?? 'active',
  icon: project.icon ?? '📁',
  createdAt: toDate(project.created_at) ?? new Date(),
  updatedAt: toDate(project.updated_at),
})

const buildProjectInsertPayload = (
  project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
): Omit<ProjectData, 'id' | 'created_at' | 'updated_at'> =>
  sanitize({
    name: project.name,
    description: project.description ?? '',
    color: project.color ?? '#6366f1',
    status: project.status ?? 'active',
    icon: project.icon ?? '📁',
  })

const buildProjectUpdatePayload = (
  updates: Partial<Project>,
): Partial<ProjectData> =>
  sanitize({
    name: updates.name,
    description: updates.description,
    color: updates.color,
    status: updates.status,
    icon: updates.icon,
  })

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
  listId: string,
  item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt' | 'shoppingListId'>,
): Omit<ShoppingItemData, 'id' | 'created_at' | 'updated_at'> =>
  sanitize({
    shopping_list_id: listId,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit ?? null,
    category: item.category ?? null,
    subcategory: item.subcategory ?? null,
    priority: item.priority ?? 'medium',
    estimated_price: item.estimatedPrice ?? null,
    actual_price: item.actualPrice ?? null,
    tags: item.tags ?? [],
    assigned_store: item.assignedStore ?? null,
    best_stores: item.bestStores ?? [],
    notes: item.notes ?? null,
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

const normalisePantryCategory = (category?: string | null): PantryItem['category'] => {
  switch ((category ?? '').toLowerCase()) {
    case 'produce':
    case 'fruits':
    case 'vegetables':
      return 'produce'
    case 'dairy':
      return 'dairy'
    case 'meat':
    case 'protein':
      return 'meat'
    case 'pantry':
    case 'dry-goods':
      return 'pantry'
    default:
      return 'other'
  }
}

const mapPantryItemDataToPantryItem = (item: PantryItemData): PantryItem => ({
  id: item.id ?? createId(),
  name: item.name,
  quantity: Number(item.quantity ?? 0),
  unit: item.unit ?? undefined,
  category: normalisePantryCategory(item.category),
  location: item.location ?? undefined,
  expirationDate: toDate(item.expiration_date) ?? undefined,
  notes: item.notes ?? undefined,
  isLowStock: item.is_low_stock ?? undefined,
  lowStockThreshold: item.low_stock_threshold ?? undefined,
  updatedAt: toDate(item.updated_at) ?? new Date(),
})

const normaliseMealColumns = (columns: MealPlanData['meal_columns']): MealColumn[] => {
  if (!columns) return DEFAULT_MEAL_COLUMNS
  if (Array.isArray(columns)) {
    return (columns as MealColumn[]).map((column, index) => ({
      ...column,
      order: column.order ?? index + 1,
    }))
  }
  if (typeof columns === 'object') {
    return Object.entries(columns).map(([id, value], index) => ({
      id,
      name: (value as { name?: string }).name ?? id,
      defaultServings: (value as { defaultServings?: number }).defaultServings ?? 2,
      defaultPeopleCount: (value as { defaultPeopleCount?: number }).defaultPeopleCount ?? 2,
      color: (value as { color?: string }).color ?? '#6366f1',
      icon: (value as { icon?: string }).icon ?? undefined,
      order: (value as { order?: number }).order ?? index + 1,
    }))
  }
  return DEFAULT_MEAL_COLUMNS
}

const serializeMealColumns = (columns: MealColumn[]): Record<string, unknown> =>
  Object.fromEntries(
    columns.map((column) => [column.id, { ...column }]),
  )

const mapPlannedMealDataToPlannedMeal = (meal: PlannedMealData): PlannedMeal => {
  // Handle date-only strings (yyyy-MM-dd) as local dates
  const d = meal.date && meal.date.length === 10
    ? new Date(Number(meal.date.slice(0, 4)), Number(meal.date.slice(5, 7)) - 1, Number(meal.date.slice(8, 10)))
    : toDate(meal.date)
  return {
    id: meal.id ?? createId(),
    mealPlanId: meal.meal_plan_id ?? 'unknown',
    date: d ?? new Date(),
    mealType: meal.meal_type,
    recipeId: meal.recipe_id ?? undefined,
    customMeal: meal.custom_meal ?? undefined,
    servings: meal.servings ?? 1,
    peopleCount: meal.people_count ?? 1,
    status: (meal.status as PlannedMeal['status']) ?? 'planned',
    notes: meal.notes ?? undefined,
    createdAt: toDate(meal.created_at) ?? new Date(),
  }
}

const mapMealPlanDataToMealPlanWeek = (plan: MealPlanData): MealPlanWeek => {
  const wsd = plan.week_start_date
  const weekStart = wsd && wsd.length === 10
    ? new Date(Number(wsd.slice(0, 4)), Number(wsd.slice(5, 7)) - 1, Number(wsd.slice(8, 10)))
    : toDate(wsd)
  return {
    id: plan.id ?? createId(),
    name: plan.name,
    weekStartDate: weekStart ?? new Date(),
    mealColumns: normaliseMealColumns(plan.meal_columns),
    meals: (plan.planned_meals ?? []).map(mapPlannedMealDataToPlannedMeal),
    notes: plan.notes ?? undefined,
    createdAt: toDate(plan.created_at) ?? new Date(),
    updatedAt: toDate(plan.updated_at) ?? new Date(),
  }
}

const buildMealPlanInsertPayload = (
  weekStartDate: Date,
  name: string,
): Omit<MealPlanData, 'id' | 'created_at' | 'updated_at'> =>
  sanitize({
    name,
    // Store date-only to avoid timezone/week boundary bugs
    week_start_date: formatDate(weekStartDate, 'yyyy-MM-dd'),
    meal_columns: serializeMealColumns(DEFAULT_MEAL_COLUMNS),
  })

const buildMealPlanUpdatePayload = (
  updates: Partial<MealPlanWeek>,
): Partial<MealPlanData> =>
  sanitize({
    name: updates.name,
    notes: updates.notes,
    meal_columns: updates.mealColumns ? serializeMealColumns(updates.mealColumns) : undefined,
  })

const buildPlannedMealInsertPayload = (
  planId: string,
  meal: Omit<PlannedMeal, 'id' | 'mealPlanId' | 'createdAt'>,
): Omit<PlannedMealData, 'id' | 'created_at' | 'updated_at'> =>
  sanitize({
    meal_plan_id: planId,
    meal_type: meal.mealType,
    date: formatDate(meal.date, 'yyyy-MM-dd'),
    recipe_id: meal.recipeId ?? null,
    custom_meal: meal.customMeal ?? null,
    servings: meal.servings,
    people_count: meal.peopleCount,
    status: meal.status ?? 'planned',
    notes: meal.notes ?? undefined,
  })

const mapRecipeDataToRecipe = (recipe: RecipeData): Recipe => ({
  id: recipe.id ?? createId(),
  name: recipe.name,
  description: recipe.description ?? '',
  ingredients: Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map((ing) => ({
        name: ing.name,
        amount: ing.amount ?? undefined,
        unit: ing.unit ?? undefined,
      }))
    : [],
  instructions: recipe.instructions
    ? recipe.instructions
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    : [],
  prepTime: recipe.prep_time ?? 0,
  cookTime: recipe.cook_time ?? 0,
  servings: recipe.servings ?? 1,
  difficulty: (recipe.difficulty as Recipe['difficulty']) ?? 'medium',
  tags: recipe.tags ?? [],
  rating: undefined,
  notes: undefined,
  image: recipe.video_thumbnail ?? undefined,
  calories: recipe.calories_per_serving ?? undefined,
  cuisine: recipe.cuisine ?? undefined,
  dietaryRestrictions: recipe.dietary_restrictions ?? undefined,
  nutritionInfo: recipe.nutrition_info ?? undefined,
  flowChart: [],
  sourceType: (recipe.source_type as Recipe['sourceType']) ?? undefined,
  sourceUrl: recipe.source_url ?? undefined,
  authorName: recipe.author_name ?? undefined,
  videoThumbnail: recipe.video_thumbnail ?? undefined,
  createdAt: toDate(recipe.created_at) ?? new Date(),
})

const buildRecipeInsertPayload = (
  recipe: Omit<Recipe, 'id' | 'createdAt'>,
): Omit<RecipeData, 'id' | 'created_at' | 'updated_at'> =>
  sanitize({
    name: recipe.name,
    description: recipe.description ?? '',
    cuisine: recipe.cuisine ?? null,
    difficulty: recipe.difficulty ?? 'medium',
    prep_time: recipe.prepTime ?? null,
    cook_time: recipe.cookTime ?? null,
    servings: recipe.servings ?? 1,
    calories_per_serving: recipe.calories ?? null,
    instructions: recipe.instructions.join('\n'),
    ingredients: Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0
      ? recipe.ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount ?? undefined,
          unit: ing.unit ?? undefined,
        }))
      : null,
    tags: recipe.tags ?? [],
    dietary_restrictions: recipe.dietaryRestrictions ?? [],
    nutrition_info: recipe.nutritionInfo ?? null,
    source_type: recipe.sourceType ?? null,
    source_url: recipe.sourceUrl ?? null,
    author_name: recipe.authorName ?? null,
    video_thumbnail: recipe.videoThumbnail ?? null,
  })

const buildRecipeUpdatePayload = (
  updates: Partial<Recipe>,
): Partial<RecipeData> =>
  sanitize({
    name: updates.name,
    description: updates.description ?? undefined,
    cuisine: updates.cuisine ?? undefined,
    difficulty: updates.difficulty ?? undefined,
    prep_time: updates.prepTime ?? undefined,
    cook_time: updates.cookTime ?? undefined,
    servings: updates.servings ?? undefined,
    calories_per_serving: updates.calories ?? undefined,
    instructions: updates.instructions ? updates.instructions.join('\n') : undefined,
    ingredients: updates.ingredients
      ? updates.ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount ?? undefined,
          unit: ing.unit ?? undefined,
        }))
      : undefined,
    tags: updates.tags ?? undefined,
    dietary_restrictions: updates.dietaryRestrictions ?? undefined,
    nutrition_info: updates.nutritionInfo ?? undefined,
    source_type: updates.sourceType ?? undefined,
    source_url: updates.sourceUrl ?? undefined,
    author_name: updates.authorName ?? undefined,
    video_thumbnail: updates.videoThumbnail ?? undefined,
  })

const sameWeek = (a: Date, b: Date, weekStartsOn: number) => {
  const weekA = startOfWeek(a, { weekStartsOn }).getTime()
  const weekB = startOfWeek(b, { weekStartsOn }).getTime()
  return weekA === weekB
}

// Lock to prevent concurrent creation of meal plans for the same week
const creationLocks = new Map<string, Promise<MealPlanWeek>>()

export const useRealAppStore = create<RealAppState>((set, get) => ({
  loading: false,
  projectsLoading: false,
  mealPlansLoading: false,
  recipesLoading: false,
  shoppingLoading: false,
  // Lazy loading flags
  recipesLoaded: false,
  mealPlansLoaded: false,
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
  // Global settings
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

  projects: [],
  recipes: [],
  pantryItems: [],
  mealPlans: [],
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
        projects: [],
        shoppingItems: [],
        mealPlans: [],
        recipes: [],
        pantryItems: [],
      })
      return
    }

    set({
      loading: true,
      projectsLoading: true,
    })

    try {
      // Only load critical data for Dashboard
      // Everything else loads on-demand when user visits the page
      const [
        projectsRaw,
      ] = await Promise.all([
        apiClient.getProjects(),
      ])

      // Non-critical data moved to lazy loading:
      // - Shopping Lists → Load when visiting Shopping page
      // - Pantry Items → Load when visiting Meal Planning
      // - Meal Plans → Load when visiting Meal Planning (already has loadMealPlans())
      // - Recipes → Load when visiting Meal Planning (already has loadRecipes())

      // Migrated to React Query:
      // - Tasks/Todos → Now using useTasksQuery hook
      // - Habits → Now using useHabitsQuery hook
      // - Focus Sessions → Now using useFocusQuery hook
      // - Notes → Now using useNotesQuery hook
      // - Journal → Now using useJournalQuery hook
      // - Goals/Dreams → Now using useLifeGoalsQuery hook
      // - Financial Accounts/Transactions → Now using useFinanceQuery hook

      const projects = projectsRaw.map(mapProjectDataToProject)

      set({
        loading: false,
        projectsLoading: false,
        projects,
      })

      // Update current day for all active challenges after initialization
      get().updateActiveChallengesDays()
    } catch (error) {
      console.error('[LifeSync] Failed to initialise store from Supabase', error)
      set({
        loading: false,
        projectsLoading: false,
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

  addProject: async (projectInput) => {
    if (!isSupabaseConfigured) {
      const project: Project = {
        id: createId(),
        name: projectInput.name,
        description: projectInput.description ?? '',
        color: projectInput.color ?? '#6366f1',
        status: projectInput.status ?? 'active',
        icon: projectInput.icon ?? '📁',
        createdAt: new Date(),
      }
      const projects = [...get().projects, project]
      set({ projects })
      return project
    }

    const payload = buildProjectInsertPayload(projectInput)
    const created = await apiClient.createProject(payload)
    const project = mapProjectDataToProject(created)
    const projects = [...get().projects, project]
    set({ projects })
    return project
  },

  updateProject: async (id, updates) => {
    if (!isSupabaseConfigured) {
      const projects = get().projects.map((project) =>
        project.id === id
          ? { ...project, ...updates, updatedAt: new Date() }
          : project,
      )
      set({ projects })
      return
    }

    const payload = buildProjectUpdatePayload(updates)
    const updated = await apiClient.updateProject(id, payload)
    const project = mapProjectDataToProject(updated)
    const projects = get().projects.map((item) => (item.id === id ? project : item))
    set({ projects })
  },

  deleteProject: async (id) => {
    if (!isSupabaseConfigured) {
      const projects = get().projects.filter((project) => project.id !== id)
      set({ projects })
      return
    }

    await apiClient.deleteProject(id)
    const projects = get().projects.filter((project) => project.id !== id)
    set({ projects })
  },

  loadRecipes: async () => {
    // Don't reload if already loaded or loading
    if (get().recipesLoaded || get().recipesLoading) return

    if (!isSupabaseConfigured) return
    set({ recipesLoading: true })
    try {
      const recipesRaw = await apiClient.getRecipes()
      const recipes = recipesRaw.map(mapRecipeDataToRecipe)
      set({ recipes, recipesLoaded: true, recipesLoading: false })
    } catch (e) {
      console.warn('[Store] loadRecipes failed; showing empty list', e)
      set({ recipes: [], recipesLoading: false })
    }
  },

  addRecipe: async (recipeInput) => {
    if (!isSupabaseConfigured) {
      const recipe: Recipe = {
        ...recipeInput,
        id: createId(),
        createdAt: new Date(),
      }
      set((state) => ({ recipes: [...state.recipes, recipe] }))
      return recipe
    }

    const payload = buildRecipeInsertPayload(recipeInput)
    const created = await apiClient.createRecipe(payload)
    const recipe = mapRecipeDataToRecipe(created)
    set((state) => ({ recipes: [...state.recipes, recipe] }))
    return recipe
  },
  updateRecipe: async (id, updates) => {
    if (!isSupabaseConfigured) {
      set((state) => ({
        recipes: state.recipes.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      }))
      return
    }
    const payload = buildRecipeUpdatePayload(updates)
    const updated = await apiClient.updateRecipe(id, payload)
    const recipe = mapRecipeDataToRecipe(updated)
    set((state) => ({
      recipes: state.recipes.map((r) => (r.id === id ? recipe : r)),
    }))
  },
  deleteRecipe: async (id) => {
    if (!isSupabaseConfigured) {
      set((state) => ({ recipes: state.recipes.filter((r) => r.id !== id) }))
      return
    }
    try {
      await apiClient.deleteRecipe(id)
      set((state) => ({ recipes: state.recipes.filter((r) => r.id !== id) }))
    } catch (e) {
      console.error('Failed to delete recipe', id, e)
      throw e
    }
  },
  deleteAllRecipes: async () => {
    const state = get()
    if (!isSupabaseConfigured) {
      set({ recipes: [] })
      return
    }
    // Delete sequentially to avoid rate limits
    for (const r of state.recipes) {
      try { await apiClient.deleteRecipe(r.id!) } catch (e) { console.warn('Failed to delete recipe', r.id, e) }
    }
    set({ recipes: [] })
  },

  loadMealPlans: async () => {
    // Don't reload if already loaded or loading
    if (get().mealPlansLoaded || get().mealPlansLoading) return

    if (!isSupabaseConfigured) return
    set({ mealPlansLoading: true })
    try {
      const mealPlansRaw = await apiClient.getMealPlans()
      const mealPlans = mealPlansRaw.map(mapMealPlanDataToMealPlanWeek)
      set({ mealPlans, mealPlansLoaded: true, mealPlansLoading: false })
    } catch (e) {
      console.warn('[Store] loadMealPlans failed; starting with none', e)
      set({ mealPlans: [], mealPlansLoading: false })
    }
  },

  ensureMealPlanForWeek: async (weekStartDate) => {
    const ws = get().weekStartsOn
    const weekKey = startOfWeek(weekStartDate, { weekStartsOn: ws }).toISOString()

    // Check if there's already a creation in progress for this week
    const ongoing = creationLocks.get(weekKey)
    if (ongoing) {
      return await ongoing
    }

    // Create promise and store in lock map IMMEDIATELY
    const creationPromise = (async () => {
      try {
        // Check existing plans in store first
        const existing = get().mealPlans.find((plan) =>
          sameWeek(plan.weekStartDate, weekStartDate, ws),
        )
        if (existing) {
          return existing
        }

        if (!isSupabaseConfigured) {
          const plan: MealPlanWeek = {
            id: createId(),
            name: 'Meal plan',
            weekStartDate: startOfWeek(weekStartDate, { weekStartsOn: ws }),
            mealColumns: DEFAULT_MEAL_COLUMNS,
            meals: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          set((state) => ({ mealPlans: [...state.mealPlans, plan] }))
          return plan
        }

        // Database will handle duplicates with unique constraint
        // If plan exists, upsert will return the existing one
        const payload = buildMealPlanInsertPayload(
          startOfWeek(weekStartDate, { weekStartsOn: ws }),
          'Meal plan',
        )
        try {
          const created = await apiClient.createMealPlan(payload)
          const plan = mapMealPlanDataToMealPlanWeek(created)

          // Check if already in store (another thread might have added it)
          const alreadyInStore = get().mealPlans.find(p => p.id === plan.id)
          if (!alreadyInStore) {
            set((state) => ({ mealPlans: [...state.mealPlans, plan] }))
          }

          return plan
        } catch (e) {
          console.warn('[MealPlans] Cloud create failed; falling back to local-only plan', e)
          const localPlan: MealPlanWeek = {
            id: createId(),
            name: 'Meal plan',
            weekStartDate: startOfWeek(weekStartDate, { weekStartsOn: ws }),
            mealColumns: DEFAULT_MEAL_COLUMNS,
            meals: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          set((state) => ({ mealPlans: [...state.mealPlans, localPlan] }))
          // Surface a gentle notice once
          try { get().showGlobalToast?.('Working locally — sign in to sync meals', 'info') } catch {}
          return localPlan
        }
      } finally {
        // Remove lock after creation completes
        creationLocks.delete(weekKey)
      }
    })()

    creationLocks.set(weekKey, creationPromise)
    return await creationPromise
  },

  addPlannedMeal: async (planId, mealInput) => {
    if (!isSupabaseConfigured) {
      const meal: PlannedMeal = {
        ...mealInput,
        id: createId(),
        mealPlanId: planId,
        createdAt: new Date(),
      }
      set((state) => ({
        mealPlans: state.mealPlans.map((plan) =>
          plan.id === planId
            ? { ...plan, meals: [...plan.meals, meal], updatedAt: new Date() }
            : plan,
        ),
      }))
      return meal
    }
    // Optimistic local add; try cloud, fall back gracefully
    const optimistic: PlannedMeal = {
      ...mealInput,
      id: createId(),
      mealPlanId: planId,
      createdAt: new Date(),
    }
    set((state) => ({
      mealPlans: state.mealPlans.map((plan) =>
        plan.id === planId
          ? { ...plan, meals: [...plan.meals, optimistic], updatedAt: new Date() }
          : plan,
      ),
    }))
    try {
      const payload = buildPlannedMealInsertPayload(planId, mealInput)
      const created = await apiClient.createPlannedMeal(payload)
      const persisted = mapPlannedMealDataToPlannedMeal(created)
      // Replace optimistic with persisted (id may differ)
      set((state) => ({
        mealPlans: state.mealPlans.map((plan) =>
          plan.id === planId
            ? {
                ...plan,
                meals: plan.meals.map((m) => (m.id === optimistic.id ? persisted : m)),
                updatedAt: new Date(),
              }
            : plan,
        ),
      }))
      return persisted
    } catch (e) {
      console.warn('[PlannedMeals] Cloud create failed; keeping local-only meal', e)
      try { get().showGlobalToast?.('Added meal locally — sign in to sync', 'info') } catch {}
      return optimistic
    }
  },

  updatePlannedMeal: async (mealId, updates) => {
    const state = get()
    const plan = state.mealPlans.find((p) => p.meals.some((m) => m.id === mealId))
    if (!plan) return
    if (isSupabaseConfigured) {
      await apiClient.updatePlannedMeal(mealId, sanitize({
        // Keep date-only format to avoid timezone issues
        date: updates.date ? formatDate(updates.date, 'yyyy-MM-dd') : undefined,
        meal_type: updates.mealType,
        recipe_id: updates.recipeId,
        custom_meal: updates.customMeal,
        servings: updates.servings,
        people_count: updates.peopleCount,
        status: updates.status as any,
        notes: updates.notes,
        prepared_at: updates.preparedAt ? updates.preparedAt.toISOString() : undefined,
        consumed_at: updates.consumedAt ? updates.consumedAt.toISOString() : undefined,
      }))
    }
    set(({ mealPlans }) => ({
      mealPlans: mealPlans.map((p) =>
        p.id === plan.id
          ? {
              ...p,
              meals: p.meals.map((m) => (m.id === mealId ? { ...m, ...updates } : m)),
              updatedAt: new Date(),
            }
          : p,
      ),
    }))
  },

  deletePlannedMeal: async (mealId) => {
    if (isSupabaseConfigured) {
      await apiClient.deletePlannedMeal(mealId)
    }
    set((state) => ({
      mealPlans: state.mealPlans.map((plan) => ({
        ...plan,
        meals: plan.meals.filter((meal) => meal.id !== mealId),
      })),
    }))
  },

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

    const payload = buildShoppingItemInsertPayload(shoppingListId, itemInput)
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

  // ===== Pantry management =====
  addPantryItem: async (item) => {
    if (!isSupabaseConfigured) {
      const pantryItem: PantryItem = {
        ...item,
        id: createId(),
        updatedAt: new Date(),
      }
      set((state) => ({ pantryItems: [pantryItem, ...state.pantryItems] }))
      return pantryItem
    }
    const payload: Omit<PantryItemData, 'id' | 'created_at' | 'updated_at' | 'user_id'> = sanitize({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit ?? null,
      category: item.category,
      location: item.location ?? null,
      expiration_date: item.expirationDate ? item.expirationDate.toISOString() : null,
      notes: item.notes ?? null,
      is_low_stock: item.isLowStock ?? null,
      low_stock_threshold: item.lowStockThreshold ?? null,
    })
    const created = await apiClient.createPantryItem(payload)
    const pantryItem = mapPantryItemDataToPantryItem(created)
    set((state) => ({ pantryItems: [pantryItem, ...state.pantryItems] }))
    return pantryItem
  },
  updatePantryItem: async (id, updates) => {
    if (!isSupabaseConfigured) {
      set((state) => ({ pantryItems: state.pantryItems.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p)) }))
      return
    }
    const payload: Partial<PantryItemData> = sanitize({
      name: updates.name,
      quantity: updates.quantity,
      unit: updates.unit,
      category: updates.category,
      location: updates.location,
      expiration_date: updates.expirationDate ? updates.expirationDate.toISOString() : undefined,
      notes: updates.notes,
      is_low_stock: updates.isLowStock,
      low_stock_threshold: updates.lowStockThreshold,
    })
    const updated = await apiClient.updatePantryItem(id, payload)
    const mapped = mapPantryItemDataToPantryItem(updated)
    set((state) => ({ pantryItems: state.pantryItems.map((p) => (p.id === id ? mapped : p)) }))
  },
  deletePantryItem: async (id) => {
    if (isSupabaseConfigured) {
      await apiClient.deletePantryItem(id)
    }
    set((state) => ({ pantryItems: state.pantryItems.filter((p) => p.id !== id) }))
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
