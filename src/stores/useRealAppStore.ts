import { create } from 'zustand'
import { addDays, startOfWeek, isSameDay, differenceInDays, format as formatDate, startOfDay } from 'date-fns'
import {
  ensureSupabase,
  isSupabaseConfigured,
} from '../lib/supabase'
import {
  apiClient,
  type HabitData,
  type HabitEntryData,
  type MealPlanData,
  type PlannedMealData,
  type PantryItemData,
  type ProjectData,
  type RecipeData,
  type ShoppingItemData,
  type ShoppingListData,
  type TaskData,
  type FocusSessionData,
  type FinancialAccountData,
  type FinancialTransactionData,
} from '../services/apiClient'
import type {
  Dream,
  Goal,
  Habit,
  HabitCategory,
  HabitCompletion,
  JournalEntry,
  MealColumn,
  MealPlanWeek,
  MoodEntry,
  Note,
  PantryItem,
  PlannedMeal,
  Recipe,
  TodoItem,
  UserStats,
} from '../types'
import type { SFHChallengeData, SFHEntryData } from '../services/types'
import type {
  SeventyFiveHardChallenge as NewChallenge,
  DailyCheckIn as NewCheckIn,
  Task,
  TaskCompletion
} from '../types/seventyFiveHard'

type ViewKey =
  | 'dashboard'
  | 'calendar'
  | 'focus'
  | 'habits'
  | 'period'
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

type TaskStatusBackend = TaskData['status']

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

interface FocusSession {
  id: string
  preset: string
  duration: number
  actualDuration?: number
  startTime: Date
  endTime?: Date
  status: 'active' | 'completed' | 'cancelled' | 'paused'
  taskId?: string
  todoId?: string
  notes?: string
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

interface FinancialTransactionInput {
  accountId: string
  amount: number
  type: 'income' | 'expense'
  description?: string
  categoryId?: string
  date?: Date
}

interface RealAppState {
  loading: boolean
  tasksLoading: boolean
  projectsLoading: boolean
  mealPlansLoading: boolean
  recipesLoading: boolean
  shoppingLoading: boolean
  financesLoading: boolean
  activeView: ViewKey
  sidebarCollapsed: boolean
  // Global settings
  weekStartsOn: 0 | 1
  mealOptions: { breakfast: string[]; lunch: string[]; dinner: string[]; snack: string[] }

  tasks: TodoItem[]
  todos: TodoItem[]
  projects: Project[]
  focusSessions: FocusSession[]
  habits: Habit[]
  habitCategories: HabitCategory[]
  notes: Note[]
  journalEntries: JournalEntry[]
  goals: Goal[]
  dreams: Dream[]
  recipes: Recipe[]
  pantryItems: PantryItem[]
  mealPlans: MealPlanWeek[]
  moodEntries: MoodEntry[]
  userStats: UserStats
  shoppingItems: ShoppingItem[]
  activeShoppingListId: string | null
  financialAccounts: FinancialAccountData[]
  financialTransactions: FinancialTransactionData[]

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

  // ==================== 75 Hard (Legacy - DEPRECATED) ====================
  seventyFiveHardChallenges: import('../types').LegacySeventyFiveHardChallenge[]
  addSeventyFiveHardChallenge?: (c: import('../types').LegacySeventyFiveHardChallenge) => void
  updateSeventyFiveHardChallenge?: (id: string, updates: Partial<import('../types').LegacySeventyFiveHardChallenge>) => void
  deleteSeventyFiveHardChallenge?: (id: string) => void
  addSeventyFiveHardEntry?: (e: import('../types').SeventyFiveHardEntry) => void
  updateSeventyFiveHardEntry?: (id: string, updates: Partial<import('../types').SeventyFiveHardEntry>) => void
  updateActiveChallengesDays: () => void
  cleanupChallengeTasks: (challengeId: string) => Promise<void>
  resetSFHEnsuredDate: () => void

  initializeData: () => Promise<void>
  setActiveView: (view: ViewKey) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setWeekStartsOn: (ws: 0 | 1) => void
  addMealOption: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', name: string) => void
  removeMealOption: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', name: string) => void

  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TodoItem>
  updateTodo: (id: string, updates: Partial<TodoItem>) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  toggleTodo: (id: string) => Promise<void>
  addSubtask: (parentId: string, subtask: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  restoreTodo: (id: string) => Promise<void>
  permanentlyDeleteTodo: (id: string) => Promise<void>

  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>

  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => Promise<Habit>
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  completeHabit: (id: string, options?: { value?: number; notes?: string }) => Promise<void>
  resetHabit: (id: string) => Promise<void>
  resetHabitToday: (id: string) => Promise<void>
  resetHabitHistory: (id: string) => Promise<void>

  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void

  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void
  deleteJournalEntry: (id: string) => void

  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  deleteGoal: (id: string) => void

  addDream: (dream: Omit<Dream, 'id' | 'createdAt' | 'lastUpdated'>) => void
  updateDream: (id: string, updates: Partial<Dream>) => void
  deleteDream: (id: string) => void

  loadRecipes: () => Promise<void>
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

  addMoodEntry: (entry: Omit<MoodEntry, 'id' | 'createdAt'>) => void
  deleteMoodEntry: (id: string) => void

  addShoppingItem: (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt' | 'shoppingListId'>) => Promise<ShoppingItem>
  updateShoppingItem: (id: string, updates: Partial<ShoppingItem>) => Promise<void>
  deleteShoppingItem: (id: string) => Promise<void>
  toggleShoppingItem: (id: string) => Promise<void>

  // Pantry
  addPantryItem: (item: Omit<PantryItem, 'id' | 'updatedAt'>) => Promise<PantryItem>
  updatePantryItem: (id: string, updates: Partial<PantryItem>) => Promise<void>
  deletePantryItem: (id: string) => Promise<void>

  loadFinancialData: () => Promise<void>
  addFinancialTransaction: (transaction: FinancialTransactionInput) => Promise<FinancialTransactionData | null>

  // 75 Hard × Tasks integration
  ensureSFHTasksForToday: () => Promise<void>
  showSFHTasksInTasks: boolean
  setShowSFHTasksInTasks: (show: boolean) => void
  resetSFHChallengeStart: (challengeId: string, startDate: Date) => Promise<void>
  sfhEnsureInProgress: boolean
  sfhEnsuredForDate: string | null

  // Global toast
  globalToast: { message: string; type?: 'info' | 'success' | 'error' } | null
  showGlobalToast: (message: string, type?: 'info' | 'success' | 'error') => void
  clearGlobalToast: () => void

  // 75 Hard sync status
  sfhLastSynced: Date | null
  setSFHLastSynced: (d: Date) => void

  // One-time cleanup for duplicate SFH tasks
  purgeSFHDuplicateTasks: () => Promise<void>
  purgeNonSFHDuplicateTasks: () => Promise<void>

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

const toStoreStatus = (status?: TaskStatusBackend): TodoItem['status'] => {
  switch (status) {
    case 'in_progress':
      return 'in-progress'
    case 'waiting':
      return 'waiting'
    case 'scheduled':
      return 'scheduled'
    case 'done':
      return 'done'
    case 'todo':
    default:
      return 'todo'
  }
}

const toBackendStatus = (status?: TodoItem['status']): TaskStatusBackend => {
  switch (status) {
    case 'in-progress':
      return 'in_progress'
    case 'waiting':
      return 'waiting'
    case 'scheduled':
      return 'scheduled'
    case 'done':
      return 'done'
    case 'todo':
    default:
      return 'todo'
  }
}

const mapTaskDataToTodo = (task: TaskData): TodoItem => ({
  id: task.id ?? createId(),
  title: task.title,
  description: task.description ?? '',
  status: toStoreStatus(task.status),
  priority: (task.priority as TodoItem['priority']) ?? 'medium',
  categoryId: task.category ?? undefined,
  projectId: task.project_id ?? undefined,
  parentId: task.parent_id ?? undefined,
  tags: task.tags ?? [],
  estimatedTime: task.estimated_time ?? undefined,
  actualTime: task.actual_time ?? undefined,
  dueDate: toDate(task.due_date),
  completed: Boolean(task.status === 'done' || task.completed_at),
  completedAt: toDate(task.completed_at),
  createdAt: toDate(task.created_at) ?? new Date(),
  updatedAt: toDate(task.updated_at),
  deleted: task.deleted ?? false,
  deletedAt: toDate(task.deleted_at),
})

const buildTaskInsertPayload = (
  todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt' | 'completed' | 'completedAt'> &
    Partial<Pick<TodoItem, 'completed' | 'completedAt'>>,
): Omit<TaskData, 'id' | 'created_at' | 'updated_at'> =>
  sanitize({
    title: todo.title,
    description: todo.description ?? '',
    status: toBackendStatus(todo.status ?? 'todo'),
    priority: todo.priority ?? 'medium',
    project_id: todo.projectId ?? undefined,
    parent_id: todo.parentId ?? undefined,
    estimated_time: todo.estimatedTime ?? undefined,
    actual_time: todo.actualTime ?? undefined,
    due_date: todo.dueDate ? todo.dueDate.toISOString() : undefined,
    tags: todo.tags ?? [],
    category: todo.categoryId ?? 'other',
    completed_at: todo.completed
      ? (todo.completedAt ?? new Date()).toISOString()
      : undefined,
    deleted: false,
    notes: (todo as unknown as { notes?: string }).notes ?? undefined,
  })

const buildTaskUpdatePayload = (
  updates: Partial<TodoItem>,
): Partial<TaskData> =>
  sanitize({
    title: updates.title,
    description: updates.description,
    status: updates.status ? toBackendStatus(updates.status) : undefined,
    priority: updates.priority,
    project_id: updates.projectId,
    parent_id: updates.parentId,
    estimated_time: updates.estimatedTime,
    actual_time: updates.actualTime,
    due_date: updates.dueDate ? updates.dueDate.toISOString() : undefined,
    tags: updates.tags,
    category: updates.categoryId,
    completed_at: updates.completed === undefined
      ? undefined
      : updates.completed
        ? (updates.completedAt ?? new Date()).toISOString()
        : null,
    notes: (updates as unknown as { notes?: string }).notes,
    deleted: updates.deleted,
    deleted_at: updates.deletedAt ? updates.deletedAt.toISOString() : undefined,
  })

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

const toHabitFrequency = (frequency?: HabitData['frequency']): Habit['frequency'] => {
  switch (frequency) {
    case 'weekly':
      return 'weekly'
    case 'monthly':
      return 'monthly'
    case 'daily':
    default:
      return 'daily'
  }
}

const toHabitGoalMode = (
  goalMode?: HabitData['goal_mode'],
): Habit['goalMode'] => {
  switch (goalMode) {
    case 'total-goal':
      return 'total-goal'
    case 'daily-target':
    default:
      return 'daily-target'
  }
}

const mapHabitEntryToCompletions = (entry: HabitEntryData): HabitCompletion[] => {
  const count = Math.max(1, entry.value ?? 1)
  // Normalize to a proper Date. If `date` is YYYY-MM-DD, prefer local midnight to match UI's local day logic.
  let completedAt: Date | undefined
  if (typeof entry.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
    completedAt = new Date(`${entry.date}T00:00:00`)
  } else {
    completedAt = toDate(entry.date) ?? toDate(entry.created_at) ?? new Date()
  }

  return Array.from({ length: count }, (_, index) => ({
    id: entry.id ? `${entry.id}-${index}` : createId(),
    completedAt,
    notes: entry.notes ?? undefined,
  }))
}

const mapHabitDataToHabit = (
  habit: HabitData,
  entries: HabitEntryData[],
): Habit => ({
  id: habit.id ?? createId(),
  name: habit.name,
  description: habit.description ?? '',
  frequency: toHabitFrequency(habit.frequency),
  targetCount: habit.target_value ?? 1,
  goalMode: toHabitGoalMode(habit.goal_mode),
  goalTarget: habit.goal_target ?? undefined,
  goalUnit: habit.goal_unit ?? undefined,
  currentProgress: habit.current_progress ?? 0,
  color: habit.color ?? '#22c55e',
  categoryId: habit.category ?? 'general',
  reminder: habit.reminder_enabled
    ? {
        enabled: true,
        time: habit.reminder_time ?? '08:00',
        days: [1, 2, 3, 4, 5, 6, 7],
        title: habit.name,
      }
    : undefined,
  completions: entries.flatMap(mapHabitEntryToCompletions),
  createdAt: toDate(habit.created_at) ?? new Date(),
  streak: habit.streak_count ?? 0,
})

const buildHabitInsertPayload = (
  habit: Omit<Habit, 'id' | 'createdAt' | 'completions'>,
): Omit<HabitData, 'id' | 'created_at' | 'updated_at'> =>
  sanitize({
    name: habit.name,
    description: habit.description ?? '',
    frequency: habit.frequency ?? 'daily',
    target_value: habit.targetCount ?? 1,
    goal_mode: habit.goalMode ?? 'daily-target',
    goal_target: habit.goalTarget ?? null,
    goal_unit: habit.goalUnit ?? null,
    current_progress: habit.currentProgress ?? 0,
    color: habit.color ?? '#22c55e',
    category: habit.categoryId ?? 'general',
    reminder_time: habit.reminder?.time ?? null,
    reminder_enabled: habit.reminder?.enabled ?? false,
    streak_count: habit.streak ?? 0,
    icon: (habit as unknown as { icon?: string }).icon ?? null,
  })

const buildHabitUpdatePayload = (
  updates: Partial<Habit>,
): Partial<HabitData> =>
  sanitize({
    name: updates.name,
    description: updates.description,
    frequency: updates.frequency,
    target_value: updates.targetCount,
    goal_mode: updates.goalMode,
    goal_target: updates.goalTarget,
    goal_unit: updates.goalUnit,
    current_progress: updates.currentProgress,
    color: updates.color,
    category: updates.categoryId,
    reminder_time: updates.reminder?.time,
    reminder_enabled: updates.reminder?.enabled,
    streak_count: updates.streak,
  })

const deriveHabitCategories = (habits: Habit[]): HabitCategory[] => {
  if (!habits.length) {
    return [
      { id: 'wellness', name: 'Wellness', description: 'Mind & body routines', color: '#22c55e' },
      { id: 'growth', name: 'Growth', description: 'Learning and development', color: '#f97316' },
    ]
  }

  const map = new Map<string, HabitCategory>()
  habits.forEach((habit) => {
    const key = habit.categoryId ?? 'general'
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        name: key.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        description: 'Habits tagged as ' + key,
        color: habit.color ?? '#6366f1',
      })
    }
  })
  return Array.from(map.values())
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

const mapFocusSessionDataToSession = (session: FocusSessionData): FocusSession => ({
  id: session.id ?? createId(),
  preset: session.preset ?? 'custom',
  duration: session.duration ?? 0,
  actualDuration: session.actual_duration ?? undefined,
  startTime: toDate(session.start_time) ?? new Date(),
  endTime: toDate(session.end_time),
  status: (session.status as FocusSession['status']) ?? 'active',
  taskId: session.task_id ?? undefined,
  todoId: session.task_id ?? undefined,
  notes: session.notes ?? undefined,
})

const computeUserStats = (tasks: TodoItem[], habits: Habit[]): UserStats => {
  const completedTasks = tasks.filter((task) => task.completed && !task.deleted).length
  const habitCount = habits.length
  const xp = completedTasks * 25 + habitCount * 10
  const level = Math.max(1, Math.floor(xp / 100) + 1)
  const xpToNextLevel = 100 - (xp % 100)
  return {
    level,
    xp,
    xpToNextLevel,
    totalGoalsCompleted: completedTasks,
  }
}

// 75 Hard mappers - updated for new simplified schema
const mapSFHChallengeDataToChallenge = (c: SFHChallengeData): NewChallenge => ({
  id: c.id ?? createId(),
  userId: c.user_id ?? '',
  startDate: new Date(c.start_date),
  currentDay: c.current_day,
  status: c.status as 'active' | 'completed',
  tasks: (c.tasks || []) as Task[],
  completedAt: c.completed_at ? new Date(c.completed_at) : undefined,
  createdAt: c.created_at ? new Date(c.created_at) : new Date(),
  updatedAt: c.updated_at ? new Date(c.updated_at) : new Date(),
})

const mapSFHEntryDataToEntry = (e: SFHEntryData): NewCheckIn => ({
  id: e.id ?? createId(),
  challengeId: e.challenge_id,
  date: new Date(e.date),
  dayNumber: e.day_number,
  taskCompletions: (e.task_completions || []).map((tc: any) => ({
    taskId: tc.taskId,
    completed: !!tc.completed,
    completedAt: tc.completedAt ? new Date(tc.completedAt) : undefined,
  })) as TaskCompletion[],
  photo: e.photo ?? undefined,
  weight: e.weight ?? undefined,
  notes: e.notes ?? undefined,
  createdAt: e.created_at ? new Date(e.created_at) : new Date(),
  updatedAt: e.updated_at ? new Date(e.updated_at) : new Date(),
})

const buildSFHChallengeInsert = (
  c: NewChallenge,
): Omit<SFHChallengeData, 'id' | 'created_at' | 'updated_at' | 'user_id'> => ({
  start_date: formatDate(c.startDate, 'yyyy-MM-dd'),
  current_day: c.currentDay,
  status: c.status,
  tasks: c.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description ?? '',
    order: t.order,
  })),
  completed_at: c.completedAt ? c.completedAt.toISOString() : null,
})

const buildSFHChallengeUpdate = (
  updates: Partial<NewChallenge>,
): Partial<SFHChallengeData> => ({
  start_date: updates.startDate ? formatDate(updates.startDate, 'yyyy-MM-dd') : undefined,
  current_day: updates.currentDay,
  status: updates.status,
  tasks: updates.tasks
    ? updates.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description ?? '',
        order: t.order,
      }))
    : undefined,
  completed_at: updates.completedAt !== undefined ? (updates.completedAt ? updates.completedAt.toISOString() : null) : undefined,
})

const toIsoSafe = (v: any): string | null => {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

const buildSFHEntryInsert = (
  e: import('../types').SeventyFiveHardEntry,
): Omit<SFHEntryData, 'id' | 'created_at' | 'user_id'> => ({
  challenge_id: e.challengeId,
  date: formatDate(e.date, 'yyyy-MM-dd'),
  day: e.day,
  rule_completions: e.ruleCompletions.map((rc) => ({
    rule_id: rc.ruleId,
    completed: rc.completed,
    completed_at: toIsoSafe(rc.completedAt),
    segments: rc.segments,
  })),
  notes: e.notes ?? null,
  progress_photo_url: e.progressPhotoUrl ?? null,
  weight: e.weight ?? null,
  measurements: e.measurements ?? null,
})

const buildSFHEntryUpdate = (
  updates: Partial<import('../types').SeventyFiveHardEntry>,
): Partial<SFHEntryData> => ({
  date: updates.date ? formatDate(updates.date, 'yyyy-MM-dd') : undefined,
  day: updates.day,
  rule_completions: updates.ruleCompletions
    ? updates.ruleCompletions.map((rc) => ({
        rule_id: rc.ruleId,
        completed: rc.completed,
        completed_at: toIsoSafe(rc.completedAt),
        segments: rc.segments,
      }))
    : undefined,
  notes: updates.notes,
  progress_photo_url: updates.progressPhotoUrl,
  weight: updates.weight,
  measurements: updates.measurements,
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
  tasksLoading: false,
  projectsLoading: false,
  mealPlansLoading: false,
  recipesLoading: false,
  shoppingLoading: false,
  financesLoading: false,
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
  sfhLastSynced: (() => {
    try {
      const raw = localStorage.getItem('lifesync:75hard:lastSynced')
      return raw ? new Date(raw) : null
    } catch { return null }
  })(),

  tasks: [],
  todos: [],
  projects: [],
  focusSessions: [],
  habits: [],
  habitCategories: [],
  notes: [],
  journalEntries: [],
  goals: [],
  dreams: [],
  recipes: [],
  pantryItems: [],
  mealPlans: [],
  moodEntries: [],
  userStats: { level: 1, xp: 0, xpToNextLevel: 100, totalGoalsCompleted: 0 },
  shoppingItems: [],
  activeShoppingListId: null,
  financialAccounts: [],
  financialTransactions: [],
  showSFHTasksInTasks: (() => {
    try {
      const raw = localStorage.getItem('lifesync:settings:sfhShowInTasks')
      if (raw == null) return true
      return raw === 'true'
    } catch { return true }
  })(),
  sfhEnsureInProgress: false,
  sfhEnsuredForDate: (() => {
    try {
      return localStorage.getItem('lifesync:sfh:ensuredForDate')
    } catch { return null }
  })(),
  seventyFiveHardChallenges: (() => {
    try {
      const raw = localStorage.getItem('lifesync:75hard')
      if (!raw) return []
      const data = JSON.parse(raw)
      return (data as any[]).map((c) => ({
        ...c,
        startDate: new Date(c.startDate),
        endDate: new Date(c.endDate),
        createdAt: new Date(c.createdAt),
        dailyEntries: (c.dailyEntries || []).map((e: any) => ({
          ...e,
          date: new Date(e.date),
          ruleCompletions: (e.ruleCompletions || []).map((rc: any) => ({
            ...rc,
            completedAt: rc.completedAt ? new Date(rc.completedAt) : undefined,
          })),
        })),
      }))
    } catch { return [] }
  })(),

  initializeData: async () => {
    if (!isSupabaseConfigured) {
      console.warn('[LifeSync] Supabase not configured; store will operate in local-only mode.')
      set({
        loading: false,
        tasks: [],
        todos: [],
        projects: [],
        habits: [],
        habitCategories: deriveHabitCategories([]),
        shoppingItems: [],
        mealPlans: [],
        recipes: [],
        pantryItems: [],
        focusSessions: [],
        financialAccounts: [],
        financialTransactions: [],
      })
      return
    }

    set({
      loading: true,
      tasksLoading: true,
      projectsLoading: true,
      mealPlansLoading: true,
      recipesLoading: true,
      shoppingLoading: true,
    })

    try {
      const client = ensureSupabase()

      const [
        tasksRaw,
        projectsRaw,
        habitsRaw,
        focusSessionsRaw,
        shoppingListsRaw,
        pantryRaw,
        mealPlansRaw,
        recipesRaw,
        accountsRaw,
        transactionsRaw,
        sfhChallengesRaw,
      ] = await Promise.all([
        apiClient.getTasks(),
        apiClient.getProjects(),
        apiClient.getHabits(),
        apiClient.getFocusSessions().catch(() => []),
        apiClient.getShoppingLists().catch(() => []),
        apiClient.getPantryItems().catch(() => []),
        apiClient.getMealPlans().catch(() => []),
        apiClient.getRecipes().catch(() => []),
        apiClient.getFinancialAccounts().catch(() => []),
        apiClient.getFinancialTransactions().catch(() => []),
        apiClient.getSFHChallenges().catch(() => []),
      ])

      // Show UI immediately after main data loads
      set({ loading: false })

      // (Travel features removed)

      let habitEntries: HabitEntryData[] = []
      const habitIds = habitsRaw.map((habit) => habit.id).filter(Boolean) as string[]
      if (habitIds.length > 0) {
        // Scope entries to the authenticated user for RLS-friendly reads
        const authUser = (await ensureSupabase().auth.getUser()).data.user
        const userId = authUser?.id
        let query = client
          .from('habit_entries')
          .select('*')
          .in('habit_id', habitIds)
          .order('date', { ascending: true })
        if (userId) {
          query = query.eq('user_id', userId)
        }
        const { data, error } = await query
        if (error) {
          console.warn('[LifeSync] Failed to load habit entries:', error.message)
        } else {
          habitEntries = data ?? []
        }
      }

      const entriesByHabit = habitEntries.reduce<Map<string, HabitEntryData[]>>((map, entry) => {
        const key = entry.habit_id ?? ''
        if (!map.has(key)) {
          map.set(key, [])
        }
        map.get(key)!.push(entry)
        return map
      }, new Map())

      const tasks = tasksRaw.map(mapTaskDataToTodo)
      const projects = projectsRaw.map(mapProjectDataToProject)
      const habits = habitsRaw.map((habit) => {
        const entries = entriesByHabit.get(habit.id ?? '') ?? []
        return mapHabitDataToHabit(habit, entries)
      })
      const focusSessions = focusSessionsRaw.map(mapFocusSessionDataToSession)

      // 75 Hard: LEGACY SYNC DISABLED
      // The new architecture uses loadSFHChallenge() from seventyFiveHardActions.ts
      // which populates sfhChallenge and sfhCheckIns (not seventyFiveHardChallenges)
      // Set legacy field to empty array - it's deprecated
      const legacyChallenges: import('../types').LegacySeventyFiveHardChallenge[] = []

      // Skip loading legacy 75Hard data - it's handled by the new actions
      /*
      let sfhEntriesRaw: SFHEntryData[] = []
      const challengeIds = (sfhChallengesRaw as SFHChallengeData[]).map((c) => c.id!).filter(Boolean) as string[]
      if (challengeIds.length) {
        sfhEntriesRaw = await apiClient.getSFHEntries(challengeIds).catch(() => [])
      }
      let sfhChallenges = (sfhChallengesRaw as SFHChallengeData[]).map(mapSFHChallengeDataToChallenge)
      const entriesByChallenge = sfhEntriesRaw.reduce<Record<string, NewCheckIn[]>>((acc, e) => {
        const entry = mapSFHEntryDataToEntry(e)
        const key = entry.challengeId
        acc[key] = acc[key] || []
        acc[key].push(entry)
        return acc
      }, {})
      */

      // LEGACY: localStorage merge disabled - new architecture doesn't use this
      /*
      try {
        const localRaw = localStorage.getItem('lifesync:75hard')
        if (localRaw) {
          const localList = JSON.parse(localRaw) as any[]
          const keyOf = (x: any) => `${x.name}|${formatDate(new Date(x.startDate), 'yyyy-MM-dd')}`
          const cloudKeys = new Set(sfhChallenges.map((c) => keyOf(c)))
          for (const lc of localList) {
            const key = `${lc.name}|${formatDate(new Date(lc.startDate), 'yyyy-MM-dd')}`
            if (!cloudKeys.has(key)) {
              sfhChallenges.push({
                ...lc,
                startDate: new Date(lc.startDate),
                endDate: new Date(lc.endDate),
                createdAt: new Date(lc.createdAt),
              })
            }
          }

          // Auto-sync missing locals to cloud (background), then mark as synced
          if (isSupabaseConfigured) {
            const syncedRaw = localStorage.getItem('lifesync:75hard:synced')
            const synced = new Set<string>(syncedRaw ? JSON.parse(syncedRaw) : [])
            let didSync = false
            for (const lc of localList) {
              const key = `${lc.name}|${formatDate(new Date(lc.startDate), 'yyyy-MM-dd')}`
              if (!cloudKeys.has(key)) {
                try {
                  const created = await apiClient.createSFHChallenge({
                    name: lc.name,
                    start_date: formatDate(new Date(lc.startDate), 'yyyy-MM-dd'),
                    end_date: formatDate(new Date(lc.endDate), 'yyyy-MM-dd'),
                    is_active: !!lc.isActive,
                    current_day: lc.currentDay ?? 1,
                    rules: (lc.rules || []).map((r: any) => ({ id: r.id, title: r.title, description: r.description, is_required: !!r.isRequired, is_custom: !!r.isCustom, daily_target: r.dailyTarget, segment_labels: r.segmentLabels })),
                    notes: lc.notes ?? null,
                  })
                  const remoteId = created.id!
                  const remoteDates = new Set<string>()
                  const entries = (lc.dailyEntries || []) as any[]
                  for (const e of entries) {
                    const d = formatDate(new Date(e.date), 'yyyy-MM-dd')
                    if (!remoteDates.has(d)) {
                      await apiClient.createSFHEntry({
                        challenge_id: remoteId,
                        date: d,
                        day: e.day,
                        rule_completions: (e.ruleCompletions || []).map((rc: any) => ({
                          rule_id: rc.ruleId,
                          completed: !!rc.completed,
                          completed_at: rc.completedAt ? new Date(rc.completedAt).toISOString() : null,
                          segments: rc.segments,
                        })),
                        notes: e.notes ?? null,
                        progress_photo_url: e.progressPhotoUrl ?? null,
                        weight: e.weight ?? null,
                        measurements: e.measurements ?? null,
                      })
                      remoteDates.add(d)
                    }
                  }
                  synced.add(key)
                  didSync = true
                } catch (e) {
                  console.warn('[75Hard] Background sync failed for', key, e)
                }
              }
            }
            try { localStorage.setItem('lifesync:75hard:synced', JSON.stringify(Array.from(synced))) } catch {}
            if (didSync) {
              get().setSFHLastSynced?.(new Date())
            }
          }
        }
      } catch {}
      */

      let shoppingLists = shoppingListsRaw
      let activeShoppingListId = shoppingLists[0]?.id ?? null
      if (!activeShoppingListId) {
        const createdList = await apiClient.createShoppingList({
          name: 'Personal List',
          status: 'active',
        })
        activeShoppingListId = createdList.id ?? null
        shoppingLists = [createdList]
      }

      let shoppingItems: ShoppingItem[] = []
      if (activeShoppingListId) {
        const shoppingItemsRaw = await apiClient.getShoppingListItems(activeShoppingListId)
        shoppingItems = shoppingItemsRaw.map(mapShoppingItemDataToShoppingItem)
      }

      // LEGACY: De-duplication disabled - new architecture handles this
      /*
      {
        const seen = new Set<string>()
        const uniq: typeof sfhChallenges = []
        for (const c of sfhChallenges) {
          const k = `${c.id || ''}|${c.name}|${formatDate(c.startDate, 'yyyy-MM-dd')}`
          if (seen.has(k)) continue
          seen.add(k)
          uniq.push(c)
        }
        sfhChallenges = uniq
      }
      */

      const pantryItems = pantryRaw.map(mapPantryItemDataToPantryItem)
      const mealPlans = mealPlansRaw.map(mapMealPlanDataToMealPlanWeek)
      const recipes = recipesRaw.map(mapRecipeDataToRecipe)
      const habitCategories = deriveHabitCategories(habits)
      const userStats = computeUserStats(tasks, habits)

      set({
        tasks,
        todos: tasks,
        tasksLoading: false,
        projects,
        projectsLoading: false,
        habits,
        habitCategories,
        focusSessions,
        shoppingItems,
        activeShoppingListId,
        shoppingLoading: false,
        pantryItems,
        mealPlans,
        mealPlansLoading: false,
        recipes,
        recipesLoading: false,
        financialAccounts: accountsRaw ?? [],
        financialTransactions: transactionsRaw ?? [],
        financesLoading: false,
        userStats,
        seventyFiveHardChallenges: legacyChallenges,
      })

      // Update current day for all active challenges after initialization
      get().updateActiveChallengesDays()
    } catch (error) {
      console.error('[LifeSync] Failed to initialise store from Supabase', error)
      set({
        loading: false,
        tasksLoading: false,
        projectsLoading: false,
        mealPlansLoading: false,
        recipesLoading: false,
        shoppingLoading: false,
        financesLoading: false,
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

  addTodo: async (todoInput) => {
    if (!isSupabaseConfigured) {
      const fallback: TodoItem = {
        ...todoInput,
        id: createId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        completed: todoInput.completed ?? false,
        status: todoInput.status ?? 'todo',
        priority: todoInput.priority ?? 'medium',
        tags: todoInput.tags ?? [],
        deleted: false,
      }
      const tasks = [...get().tasks, fallback]
      const habits = get().habits
      set({ tasks, todos: tasks, userStats: computeUserStats(tasks, habits) })
      return fallback
    }

    const payload = buildTaskInsertPayload(todoInput)
    const created = await apiClient.createTask(payload)
    const todo = mapTaskDataToTodo(created)
    const tasks = [...get().tasks, todo]
    const habits = get().habits
    set({ tasks, todos: tasks, userStats: computeUserStats(tasks, habits) })
    return todo
  },

  updateTodo: async (id, updates) => {
    if (!isSupabaseConfigured) {
      const tasks = get().tasks.map((task) =>
        task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task,
      )
      const habits = get().habits
      set({ tasks, todos: tasks, userStats: computeUserStats(tasks, habits) })
      return
    }

    const payload = buildTaskUpdatePayload(updates)
    const updated = await apiClient.updateTask(id, payload)
    const current = get().tasks.find(t => t.id === id)
    const partial = mapTaskDataToTodo(updated)
    // Merge only defined fields from partial onto current to avoid losing data if API did not return full row
    const merged: typeof partial = current
      ? (Object.fromEntries(Object.entries({ ...current, ...partial }).map(([k, v]) => [k, (partial as any)[k] !== undefined ? (partial as any)[k] : (current as any)[k]])) as any)
      : partial
    const tasks = get().tasks.map((task) => (task.id === id ? (merged as any) : task))
    const habits = get().habits
    set({ tasks, todos: tasks, userStats: computeUserStats(tasks, habits) })
  },

  deleteTodo: async (id) => {
    if (!isSupabaseConfigured) {
      const tasks = get().tasks.filter((task) => task.id !== id)
      const habits = get().habits
      set({ tasks, todos: tasks, userStats: computeUserStats(tasks, habits) })
      return
    }

    await apiClient.deleteTask(id)
    const tasks = get().tasks.filter((task) => task.id !== id)
    const habits = get().habits
    set({ tasks, todos: tasks, userStats: computeUserStats(tasks, habits) })
  },

  restoreTodo: async (id) => {
    if (!isSupabaseConfigured) {
      const tasks = get().tasks.map((task) =>
        task.id === id ? { ...task, deleted: false, deletedAt: undefined } : task,
      )
      const habits = get().habits
      set({ tasks, todos: tasks, userStats: computeUserStats(tasks, habits) })
      return
    }

    const restored = await apiClient.restoreTask(id)
    const todo = mapTaskDataToTodo(restored)
    const tasks = get().tasks.map((task) => (task.id === id ? todo : task))
    const habits = get().habits
    set({ tasks, todos: tasks, userStats: computeUserStats(tasks, habits) })
  },

  permanentlyDeleteTodo: async (id) => {
    if (isSupabaseConfigured) {
      await apiClient.permanentlyDeleteTask(id)
    }
    const tasks = get().tasks.filter((task) => task.id !== id)
    const habits = get().habits
    set({ tasks, todos: tasks, userStats: computeUserStats(tasks, habits) })
  },

  toggleTodo: async (id) => {
    const current = get().tasks.find((task) => task.id === id)
    if (!current) return

    const nextCompleted = !current.completed
    const updates: Partial<TodoItem> = {
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date() : undefined,
      status: nextCompleted ? 'done' : 'todo',
      updatedAt: new Date(),
    }

    // If this is a 75 Hard task segment, reflect completion in challenge and then delete the task
    if ((current.tags || []).includes('sfh')) {
      try {
        const chTag = (current.tags || []).find(t => t.startsWith('sfh:'))
        const ruleTag = (current.tags || []).find(t => t.startsWith('sfhRule:'))
        const dayTag = (current.tags || []).find(t => t.startsWith('sfhDay:'))
        const segTag = (current.tags || []).find(t => t.startsWith('sfhSeg:'))
        const challengeId = chTag?.split(':')[1]
        const ruleId = ruleTag?.split(':')[1]
        const day = Number(dayTag?.split(':')[1] || 0)
        const seg = Number(segTag?.split(':')[1] || 0)
        if (challengeId && ruleId && day > 0) {
          // Toggle segment to completed
          const ch = get().seventyFiveHardChallenges.find(c => c.id === challengeId)
          if (ch) {
            const date = new Date(ch.startDate.getTime())
            date.setDate(ch.startDate.getDate() + (day - 1))
            // Use page logic via store: update entry
            // We can reuse updateSeventyFiveHardEntry by constructing updated ruleCompletions
            const entry = ch.dailyEntries.find(e => e.day === day)
            if (entry) {
              const rc = entry.ruleCompletions.find(r => r.ruleId === ruleId)
              if (rc) {
                const targetRule = ch.rules.find(r => r.id === ruleId)
                const target = (targetRule?.dailyTarget && targetRule.dailyTarget > 1) ? targetRule.dailyTarget : ((targetRule?.title || '').toLowerCase().includes('twice') ? 2 : 1)
                if (target > 1) {
                  const segs = Array.isArray(rc.segments) ? [...rc.segments] : Array.from({ length: target }, () => false)
                  if (seg >= 0 && seg < segs.length) segs[seg] = true
                  const done = segs.every(Boolean)
                  await get().updateSeventyFiveHardEntry!(entry.id, { ruleCompletions: entry.ruleCompletions.map(r => r.ruleId === ruleId ? { ...r, segments: segs, completed: done, completedAt: done ? new Date() : undefined } : r) })
                } else {
                  await get().updateSeventyFiveHardEntry!(entry.id, { ruleCompletions: entry.ruleCompletions.map(r => r.ruleId === ruleId ? { ...r, completed: true, completedAt: new Date() } : r) })
                }
              }
            } else {
              // create new entry
              const rc = ch.rules.map(r => ({ ruleId: r.id, completed: r.id === ruleId, completedAt: r.id === ruleId ? new Date() : undefined }))
              await get().addSeventyFiveHardEntry!({ id: createId(), challengeId, date, day, ruleCompletions: rc as any, notes: '', progressPhotoUrl: '', weight: undefined, measurements: {} } as any)
            }
          }
        }
      } catch (e) {
        console.warn('[75Hard] Failed to reflect SFH completion from task', e)
      }
      // Remove the task from list (soft delete)
      await get().deleteTodo(id)
      return
    }

    // ==================== NEW 75 Hard System (Clean Architecture) ====================
    // Bi-directional sync: Todo completion → 75 Hard task completion
    if ((current.tags || []).includes('75hard')) {
      try {
        // Import the sync function dynamically to avoid circular dependency
        const { syncTodoCompletionToSFH } = await import('./seventyFiveHardActions');

        // Sync to 75 Hard (this will toggle the 75 Hard task)
        await syncTodoCompletionToSFH(id);

        // Don't delete the todo - it stays in the list
        // The todo will be updated by ensureSFHTodosForToday() after 75 Hard task is toggled
        console.log('[Todo→75Hard] Synced todo completion to 75 Hard');
      } catch (error) {
        console.error('[Todo→75Hard] Failed to sync to 75 Hard:', error);
      }
    }

    if (!isSupabaseConfigured) {
      const tasks = get().tasks.map((task) =>
        task.id === id
          ? { ...task, ...updates }
          : task,
      )
      const habits = get().habits
      set({ tasks, todos: tasks, userStats: computeUserStats(tasks, habits) })
      return
    }

    const payload = buildTaskUpdatePayload(updates)
    const updated = await apiClient.updateTask(id, payload)
    const todo = mapTaskDataToTodo(updated)
    const tasks = get().tasks.map((task) => (task.id === id ? todo : task))
    const habits = get().habits
    set({ tasks, todos: tasks, userStats: computeUserStats(tasks, habits) })
  },

  addSubtask: async (parentId, subtask) => {
    const baseSubtask = {
      ...subtask,
      parentId,
      status: subtask.status ?? 'todo',
      completed: subtask.completed ?? false,
    }
    await get().addTodo(baseSubtask)
  },

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

  addHabit: async (habitInput) => {
    if (!isSupabaseConfigured) {
      const habit: Habit = {
        ...habitInput,
        id: createId(),
        createdAt: new Date(),
        completions: [],
        currentProgress: habitInput.currentProgress ?? 0,
        streak: habitInput.streak ?? 0,
      }
      const habits = [...get().habits, habit]
      const habitCategories = deriveHabitCategories(habits)
      const tasks = get().tasks
      set({ habits, habitCategories, userStats: computeUserStats(tasks, habits) })
      return habit
    }

    const payload = buildHabitInsertPayload(habitInput)
    const created = await apiClient.createHabit(payload)
    const habit = mapHabitDataToHabit(created, [])
    const habits = [...get().habits, habit]
    const habitCategories = deriveHabitCategories(habits)
    const tasks = get().tasks
    set({ habits, habitCategories, userStats: computeUserStats(tasks, habits) })
    return habit
  },

  updateHabit: async (id, updates) => {
    if (!isSupabaseConfigured) {
      const habits = get().habits.map((habit) =>
        habit.id === id
          ? {
              ...habit,
              ...updates,
            }
          : habit,
      )
      const habitCategories = deriveHabitCategories(habits)
      const tasks = get().tasks
      set({ habits, habitCategories, userStats: computeUserStats(tasks, habits) })
      return
    }

    const payload = buildHabitUpdatePayload(updates)
    const updated = await apiClient.updateHabit(id, payload)
    const completions = get().habits.find((habit) => habit.id === id)?.completions ?? []
    const habit = mapHabitDataToHabit(updated, completions.map((completion) => ({
      id: completion.id,
      habit_id: id,
      date: completion.completedAt.toISOString(),
      created_at: completion.completedAt.toISOString(),
      notes: completion.notes,
    } as HabitEntryData)))
    const habits = get().habits.map((item) => (item.id === id ? habit : item))
    const habitCategories = deriveHabitCategories(habits)
    const tasks = get().tasks
    set({ habits, habitCategories, userStats: computeUserStats(tasks, habits) })
  },

  deleteHabit: async (id) => {
    if (!isSupabaseConfigured) {
      const habits = get().habits.filter((habit) => habit.id !== id)
      const habitCategories = deriveHabitCategories(habits)
      const tasks = get().tasks
      set({ habits, habitCategories, userStats: computeUserStats(tasks, habits) })
      return
    }

    await apiClient.deleteHabit(id)
    const habits = get().habits.filter((habit) => habit.id !== id)
    const habitCategories = deriveHabitCategories(habits)
    const tasks = get().tasks
    set({ habits, habitCategories, userStats: computeUserStats(tasks, habits) })
  },

  resetHabit: async (id) => {
    const habit = get().habits.find((h) => h.id === id)
    if (!habit) return

    // Compute local date string yyyy-MM-dd for today
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const localDate = `${yyyy}-${mm}-${dd}`

    if (isSupabaseConfigured) {
      try {
        // Remove today's entry so daily completion is cleared
        await apiClient.deleteHabitEntryForDate(id, localDate)
      } catch (e) {
        console.warn('[Store] Failed to delete today\'s habit entry:', e)
      }
      try {
        await apiClient.updateHabit(id, { current_progress: 0 as any, streak_count: 0 as any } as Partial<HabitData>)
      } catch (e) {
        console.warn('[Store] Failed to reset habit counters:', e)
      }
    }

    // Update local state optimistically: clear today completions and reset counters
    const today = new Date()
    const habits = get().habits.map((h) => {
      if (h.id !== id) return h
      const pruned = h.completions.filter((c) => !isSameDay(c.completedAt, today))
      return {
        ...h,
        completions: pruned,
        currentProgress: 0,
        streak: 0,
      }
    })
    const habitCategories = deriveHabitCategories(habits)
    const tasks = get().tasks
    set({ habits, habitCategories, userStats: computeUserStats(tasks, habits) })
  },

  resetHabitToday: async (id) => {
    const habit = get().habits.find((h) => h.id === id)
    if (!habit) return
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const localDate = `${yyyy}-${mm}-${dd}`

    let decrement = 0
    if (isSupabaseConfigured) {
      try {
        const entry = await apiClient.getHabitEntryForDate(id, localDate)
        decrement = Number(entry?.value ?? 0)
      } catch {}
      try {
        await apiClient.deleteHabitEntryForDate(id, localDate)
      } catch (e) {
        console.warn('[Store] Failed to delete today\'s habit entry:', e)
      }
      try {
        if (decrement > 0) {
          await apiClient.updateHabit(id, { current_progress: Math.max(0, (habit.currentProgress ?? 0) - decrement) as any })
        }
      } catch (e) {
        console.warn('[Store] Failed to update habit progress after today reset:', e)
      }
    }

    // Update local state
    const today = new Date()
    const habits = get().habits.map((h) => {
      if (h.id !== id) return h
      const todayRemoved = h.completions.filter((c) => isSameDay(c.completedAt, today)).length
      const pruned = h.completions.filter((c) => !isSameDay(c.completedAt, today))
      return {
        ...h,
        completions: pruned,
        currentProgress: Math.max(0, (h.currentProgress ?? 0) - (decrement || todayRemoved)),
      }
    })
    const habitCategories = deriveHabitCategories(habits)
    const tasks = get().tasks
    set({ habits, habitCategories, userStats: computeUserStats(tasks, habits) })
  },

  resetHabitHistory: async (id) => {
    const habit = get().habits.find((h) => h.id === id)
    if (!habit) return
    if (isSupabaseConfigured) {
      try {
        await apiClient.deleteAllHabitEntries(id)
      } catch (e) {
        console.warn('[Store] Failed to delete habit entries:', e)
      }
      try {
        await apiClient.updateHabit(id, { current_progress: 0 as any, streak_count: 0 as any })
      } catch (e) {
        console.warn('[Store] Failed to reset habit counters:', e)
      }
    }
    const habits = get().habits.map((h) => (h.id === id ? { ...h, completions: [], currentProgress: 0, streak: 0 } : h))
    const habitCategories = deriveHabitCategories(habits)
    const tasks = get().tasks
    set({ habits, habitCategories, userStats: computeUserStats(tasks, habits) })
  },

  // Reset 75 Hard start date to a specific date; clears history and recalculates end/current day
  resetSFHChallengeStart: async (challengeId: string, startDate: Date) => {
    const ch = get().seventyFiveHardChallenges.find(c => c.id === challengeId)
    if (!ch) return
    const newStart = new Date(startDate)
    const newEnd = addDays(newStart, 74)
    const today = new Date()
    const newDay = Math.max(1, Math.min(75, differenceInDays(today, newStart) + 1))

    // Cloud sync
    if (isSupabaseConfigured) {
      try {
        await apiClient.updateSFHChallenge(challengeId, {
          start_date: formatDate(newStart, 'yyyy-MM-dd'),
          end_date: formatDate(newEnd, 'yyyy-MM-dd'),
          current_day: newDay,
        } as any)
        await apiClient.deleteSFHEntriesForChallenge(challengeId)
      } catch (e) {
        console.warn('[75Hard] Failed to reset start in cloud', e)
      }
    }

    // Local update
    const challenges = get().seventyFiveHardChallenges.map(c => c.id === challengeId ? {
      ...c,
      startDate: newStart,
      endDate: newEnd,
      currentDay: newDay,
      dailyEntries: [],
    } : c)
    set({ seventyFiveHardChallenges: challenges })
    try { localStorage.setItem('lifesync:75hard', JSON.stringify(challenges)) } catch {}

    // Remove related tasks for this challenge for today and beyond (simple: by challenge tag)
    try {
      const tasks = get().tasks
      for (const t of tasks) {
        if ((t.tags || []).includes(`sfh:${challengeId}`) && !t.deleted) {
          await get().deleteTodo(t.id)
        }
      }
    } catch (e) {
      console.warn('[75Hard] Failed to cleanup tasks after reset', e)
    }
  },

  completeHabit: async (id, options) => {
    const habit = get().habits.find((item) => item.id === id)
    if (!habit) return

    const completion: HabitCompletion = {
      id: createId(),
      completedAt: new Date(),
      notes: options?.notes,
    }

    if (isSupabaseConfigured) {
      // Use local calendar day string (yyyy-MM-dd) so UI's concept of "today" matches persistence
      const d = new Date()
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const localDate = `${yyyy}-${mm}-${dd}`

      await apiClient.addHabitEntry(id, {
        date: localDate,
        value: options?.value ?? 1,
        notes: options?.notes ?? undefined,
      })
      await apiClient.updateHabit(id, {
        current_progress: (habit.currentProgress ?? 0) + 1,
        streak_count: (habit.streak ?? 0) + 1,
      })
    }

    const habits = get().habits.map((item) =>
      item.id === id
        ? {
            ...item,
            completions: [...item.completions, completion],
            currentProgress: (item.currentProgress ?? 0) + 1,
            streak: (item.streak ?? 0) + 1,
          }
        : item,
    )
    const habitCategories = deriveHabitCategories(habits)
    const tasks = get().tasks
    set({ habits, habitCategories, userStats: computeUserStats(tasks, habits) })
  },

  addNote: (noteInput) => {
    const note: Note = {
      ...noteInput,
      id: createId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: noteInput.tags ?? [],
    }
    set((state) => ({ notes: [note, ...state.notes] }))
  },

  updateNote: (id, updates) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note,
      ),
    }))
  },

  deleteNote: (id) => {
    set((state) => ({ notes: state.notes.filter((note) => note.id !== id) }))
  },

  addJournalEntry: (entry) => {
    const journalEntry: JournalEntry = {
      ...entry,
      id: createId(),
      createdAt: new Date(),
      attachments: entry.attachments ?? [],
      tags: entry.tags ?? [],
    }
    set((state) => ({ journalEntries: [journalEntry, ...state.journalEntries] }))
  },

  deleteJournalEntry: (id) => {
    set((state) => ({
      journalEntries: state.journalEntries.filter((entry) => entry.id !== id),
    }))
  },

  addGoal: (goalInput) => {
    const goal: Goal = {
      ...goalInput,
      id: createId(),
      createdAt: new Date(),
    }
    set((state) => ({ goals: [...state.goals, goal] }))
  },

  updateGoal: (id, updates) => {
    set((state) => ({
      goals: state.goals.map((goal) =>
        goal.id === id ? { ...goal, ...updates, createdAt: goal.createdAt } : goal,
      ),
    }))
  },

  deleteGoal: (id) => {
    set((state) => ({ goals: state.goals.filter((goal) => goal.id !== id) }))
  },

  addDream: (dreamInput) => {
    const dream: Dream = {
      ...dreamInput,
      id: createId(),
      createdAt: new Date(),
      lastUpdated: new Date(),
      notes: dreamInput.notes ?? '',
    }
    set((state) => ({ dreams: [...state.dreams, dream] }))
  },

  updateDream: (id, updates) => {
    set((state) => ({
      dreams: state.dreams.map((dream) =>
        dream.id === id ? { ...dream, ...updates, lastUpdated: new Date() } : dream,
      ),
    }))
  },

  deleteDream: (id) => {
    set((state) => ({ dreams: state.dreams.filter((dream) => dream.id !== id) }))
  },

  loadRecipes: async () => {
    if (!isSupabaseConfigured) return
    set({ recipesLoading: true })
    try {
      const recipesRaw = await apiClient.getRecipes()
      const recipes = recipesRaw.map(mapRecipeDataToRecipe)
      set({ recipes, recipesLoading: false })
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
    if (!isSupabaseConfigured) return
    set({ mealPlansLoading: true })
    try {
      const mealPlansRaw = await apiClient.getMealPlans()
      const mealPlans = mealPlansRaw.map(mapMealPlanDataToMealPlanWeek)
      set({ mealPlans, mealPlansLoading: false })
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

  addMoodEntry: (entry) => {
    const moodEntry: MoodEntry = {
      ...entry,
      id: createId(),
      createdAt: new Date(),
    }
    set((state) => ({ moodEntries: [moodEntry, ...state.moodEntries] }))
  },

  deleteMoodEntry: (id) => {
    set((state) => ({
      moodEntries: state.moodEntries.filter((entry) => entry.id !== id),
    }))
  },

  // 75 Hard DEPRECATED - Use seventyFiveHardActions.ts instead
  addSeventyFiveHardChallenge: async (challenge) => {
    console.warn('[75Hard] DEPRECATED: addSeventyFiveHardChallenge is no longer supported. Use startSFHChallenge() from seventyFiveHardActions.ts instead.')
    // No-op - legacy method disabled
  },
  updateSeventyFiveHardChallenge: async (id, updates) => {
    console.warn('[75Hard] DEPRECATED: updateSeventyFiveHardChallenge is no longer supported. Use actions from seventyFiveHardActions.ts instead.')
    // No-op - legacy method disabled
  },
  deleteSeventyFiveHardChallenge: async (id) => {
    console.warn('[75Hard] DEPRECATED: deleteSeventyFiveHardChallenge is no longer supported. Use actions from seventyFiveHardActions.ts instead.')
    // No-op - legacy method disabled
  },
  addSeventyFiveHardEntry: async (entry) => {
    console.warn('[75Hard] DEPRECATED: addSeventyFiveHardEntry is no longer supported. Use actions from seventyFiveHardActions.ts instead.')
    // No-op - legacy method disabled
  },
  updateSeventyFiveHardEntry: async (id, updates) => {
    console.warn('[75Hard] DEPRECATED: updateSeventyFiveHardEntry is no longer supported. Use actions from seventyFiveHardActions.ts instead.')
    // No-op - legacy method disabled
  },
  /*
  // LEGACY METHODS DISABLED - Preserved as comments for reference
  addSeventyFiveHardEntry__OLD: async (entry) => {
    // Optimistic update: Add entry to local state immediately
    let challenges = get().seventyFiveHardChallenges.map((c) => (
      c.id === entry.challengeId ? { ...c, dailyEntries: [...c.dailyEntries, entry] } : c
    ))
    set({ seventyFiveHardChallenges: challenges })
    try { localStorage.setItem('lifesync:75hard', JSON.stringify(challenges)) } catch {}

    // Sync to cloud in background
    if (isSupabaseConfigured) {
      try {
        const created = await apiClient.createSFHEntry(buildSFHEntryInsert(entry))
        const mapped = mapSFHEntryDataToEntry(created)
        // Update with server-assigned ID if different
        if (mapped.id !== entry.id) {
          challenges = get().seventyFiveHardChallenges.map((c) => (
            c.id === entry.challengeId ? {
              ...c,
              dailyEntries: c.dailyEntries.map(e => e.id === entry.id ? { ...e, id: mapped.id } : e)
            } : c
          ))
          set({ seventyFiveHardChallenges: challenges })
          try { localStorage.setItem('lifesync:75hard', JSON.stringify(challenges)) } catch {}
        }
      } catch (e) {
        console.warn('[75Hard] Cloud entry create failed; local state already updated', e)
      }
    }
  },
  updateSeventyFiveHardEntry: async (id, updates) => {
    let createdMapped: import('../types').SeventyFiveHardEntry | null = null
    if (isSupabaseConfigured) {
      try {
        await apiClient.updateSFHEntry(id, buildSFHEntryUpdate(updates))
      } catch (e: any) {
        console.warn('[75Hard] Cloud entry update failed; applying locally', e)
        // If the id is not a UUID (local-only entry), try creating it in cloud
        try {
          const state = get()
          const owner = state.seventyFiveHardChallenges.find((c) => c.dailyEntries.some((en) => en.id === id))
          const curr = owner?.dailyEntries.find((en) => en.id === id)
          if (owner && curr) {
            let ownerId = owner.id
            const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(ownerId)
            // If not a UUID, create the challenge in cloud and remap local state
            if (!isUuid) {
              try {
                const createdCh = await apiClient.createSFHChallenge(buildSFHChallengeInsert(owner))
                const mappedCh = mapSFHChallengeDataToChallenge(createdCh)
                const oldId = owner.id
                const newId = mappedCh.id
                ownerId = newId
                // Update store: replace challenge id and update tasks tags
                const updatedChallenges = get().seventyFiveHardChallenges.map((c) =>
                  c.id === oldId ? { ...c, id: newId } : c,
                )
                // Update any task tags referencing old challenge id
                const updatedTasks = get().tasks.map((t) => {
                  const tags = t.tags || []
                  if (!tags.includes(`sfh:${oldId}`)) return t
                  return {
                    ...t,
                    tags: tags.map((tg) => (tg === `sfh:${oldId}` ? `sfh:${newId}` : tg)),
                  }
                })
                set({ seventyFiveHardChallenges: updatedChallenges, tasks: updatedTasks, todos: updatedTasks })
                try { localStorage.setItem('lifesync:75hard', JSON.stringify(updatedChallenges)) } catch {}

                // Migrate all existing local entries for this challenge to cloud
                try {
                  const entries = owner.dailyEntries || []
                  for (const en of entries) {
                    const payload = buildSFHEntryInsert({ ...en, challengeId: newId })
                    const createdEntry = await apiClient.createSFHEntry(payload)
                    if (en.id === id) {
                      createdMapped = mapSFHEntryDataToEntry(createdEntry)
                    }
                  }
                  // Notify globally
                  get().showGlobalToast?.(`Moved '${owner.name}' to cloud`, 'success')
                } catch (mErr) {
                  console.warn('[75Hard] Failed to migrate entries for challenge', mErr)
                }
              } catch (e2) {
                console.warn('[75Hard] Failed to create challenge in cloud for immediate write', e2)
              }
            }
            // Now create the entry in cloud under ownerId if it looks valid
            if (/^[0-9a-fA-F-]{36}$/.test(ownerId)) {
              const merged: import('../types').SeventyFiveHardEntry = { ...curr, ...updates, challengeId: ownerId }
              const created = await apiClient.createSFHEntry(buildSFHEntryInsert(merged))
              createdMapped = mapSFHEntryDataToEntry(created)
            }
          }
        } catch (err) {
          console.warn('[75Hard] Cloud entry create after update failed', err)
        }
      }
    }
    const challenges = get().seventyFiveHardChallenges.map((c) => ({
      ...c,
      dailyEntries: c.dailyEntries.map((e) => (e.id === id ? (createdMapped ? createdMapped : { ...e, ...updates }) : e)),
    }))
    set({ seventyFiveHardChallenges: challenges })
    try { localStorage.setItem('lifesync:75hard', JSON.stringify(challenges)) } catch {}
    // 2-way cleanup: remove any linked tasks for segments that are now completed
    try {
      const state = get()
      let ownerChallenge: import('../types').SeventyFiveHardChallenge | undefined
      let entry: import('../types').SeventyFiveHardEntry | undefined
      for (const ch of state.seventyFiveHardChallenges) {
        const found = ch.dailyEntries.find((en) => en.id === (createdMapped ? createdMapped.id : id))
        if (found) { ownerChallenge = ch; entry = found; break }
      }
      if (ownerChallenge && entry) {
        const day = entry.day
        for (const rc of entry.ruleCompletions) {
          const rule = ownerChallenge.rules.find(r => r.id === rc.ruleId)
          const title = (rule?.title || '').toLowerCase()
          const target = (rule?.dailyTarget && rule.dailyTarget > 1) ? rule.dailyTarget : (title.includes('twice') ? 2 : 1)
          if (target > 1) {
            const segs = Array.isArray(rc.segments) ? rc.segments : []
            for (let i = 0; i < segs.length; i++) {
              if (!segs[i]) continue
              const task = state.tasks.find(t => (t.tags || []).includes('sfh')
                && (t.tags || []).includes(`sfh:${ownerChallenge!.id}`)
                && (t.tags || []).includes(`sfhRule:${rc.ruleId}`)
                && (t.tags || []).includes(`sfhDay:${day}`)
                && (t.tags || []).includes(`sfhSeg:${i}`)
                && !t.deleted)
              if (task) { await state.deleteTodo(task.id) }
            }
          } else if (rc.completed) {
            const task = state.tasks.find(t => (t.tags || []).includes('sfh')
              && (t.tags || []).includes(`sfh:${ownerChallenge!.id}`)
              && (t.tags || []).includes(`sfhRule:${rc.ruleId}`)
              && (t.tags || []).includes(`sfhDay:${day}`)
              && (t.tags || []).includes(`sfhSeg:0`)
              && !t.deleted)
            if (task) { await state.deleteTodo(task.id) }
          }
        }
      }
    } catch (e) {
      console.warn('[75Hard] Failed to cleanup tasks after entry update', e)
    }
  },
  */

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

  loadFinancialData: async () => {
    if (!isSupabaseConfigured) {
      set({
        financialAccounts: [],
        financialTransactions: [],
        financesLoading: false,
      })
      return
    }

    set({ financesLoading: true })
    try {
      const [accounts, transactions] = await Promise.all([
        apiClient.getFinancialAccounts(),
        apiClient.getFinancialTransactions(),
      ])

      set({
        financialAccounts: accounts ?? [],
        financialTransactions: transactions ?? [],
        financesLoading: false,
      })
    } catch (error) {
      console.error('[LifeSync] Failed to load financial data', error)
      set({ financesLoading: false })
    }
  },

  addFinancialTransaction: async (input) => {
    const transactionDate = input.date ?? new Date()

    const normalizeAccounts = (accounts: FinancialAccountData[]): FinancialAccountData[] => {
      const delta = input.type === 'expense' ? -Math.abs(input.amount) : Math.abs(input.amount)
      return accounts.map((account) => {
        if ((account.id ?? '') !== input.accountId) {
          return account
        }
        const currentBalance = typeof account.balance === 'number' ? account.balance ?? 0 : Number(account.balance ?? 0)
        return {
          ...account,
          balance: Number((currentBalance ?? 0) + delta),
        }
      })
    }

    if (!isSupabaseConfigured) {
      const fallback: FinancialTransactionData = {
        id: createId(),
        account_id: input.accountId,
        amount: input.amount,
        type: input.type,
        description: input.description ?? '',
        category_id: input.categoryId,
        date: transactionDate.toISOString(),
        created_at: transactionDate.toISOString(),
        updated_at: transactionDate.toISOString(),
      }

      set((state) => ({
        financialTransactions: [fallback, ...state.financialTransactions],
        financialAccounts: normalizeAccounts(state.financialAccounts),
      }))

      return fallback
    }

    const payload = sanitize({
      account_id: input.accountId,
      amount: input.amount,
      type: input.type,
      description: input.description ?? '',
      category_id: input.categoryId ?? undefined,
      date: transactionDate.toISOString(),
    })

    const created = await apiClient.createFinancialTransaction(payload)

    set((state) => ({
      financialTransactions: [created, ...state.financialTransactions],
      financialAccounts: normalizeAccounts(state.financialAccounts),
    }))

    return created
  },

  // Create tasks for today's 75 Hard rules/segments not yet completed
  ensureSFHTasksForToday: async () => {
    const state = get()
    if (!state.showSFHTasksInTasks) {
      console.log('[75Hard] Task creation disabled (showSFHTasksInTasks is false)')
      return
    }

    // Double-check lock pattern with timestamp
    if (state.sfhEnsureInProgress) {
      console.log('[75Hard] Task creation already in progress, skipping')
      return
    }

    const today = new Date()
    const todayKey = formatDate(today, 'yyyy-MM-dd')
    if (state.sfhEnsuredForDate === todayKey) {
      console.log('[75Hard] Tasks already ensured for today:', todayKey)
      return
    }

    console.log('[75Hard] Starting task creation for:', todayKey)

    // Acquire lock IMMEDIATELY
    set({ sfhEnsureInProgress: true })

    // Double-check after acquiring lock (in case of race condition)
    const stateAfterLock = get()
    if (stateAfterLock.sfhEnsuredForDate === todayKey) {
      console.log('[75Hard] Another instance already completed task creation for today, aborting')
      set({ sfhEnsureInProgress: false })
      return
    }

    // Mark as ensured BEFORE we start (prevents retries on error)
    set({ sfhEnsuredForDate: todayKey })
    try {
      localStorage.setItem('lifesync:sfh:ensuredForDate', todayKey)
    } catch (err) {
      console.warn('[75Hard] Failed to save ensuredForDate to localStorage:', err)
    }
    console.log('[75Hard] Marked as ensured for:', todayKey)

    try {

    // Delete all SFH tasks from previous days (yesterday and before)
    try {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      for (const task of state.tasks) {
        const tags = task.tags || []
        if (!tags.includes('sfh')) continue
        if (task.deleted) continue

        // Delete if due date is before today
        if (task.dueDate && task.dueDate < today) {
          const taskDate = new Date(task.dueDate)
          taskDate.setHours(0, 0, 0, 0)
          const todayDate = new Date(today)
          todayDate.setHours(0, 0, 0, 0)

          if (taskDate < todayDate) {
            await state.deleteTodo(task.id)
          }
        }
      }
    } catch (err) {
      console.warn('[75Hard] Failed to cleanup old tasks:', err)
    }

    // Track tasks we're creating in this run to avoid duplicates
    const creatingTasksSet = new Set<string>()
    let tasksCreated = 0
    const MAX_TASKS_PER_RUN = 20 // Safety limit

    // Performance optimization: Pre-build Set of existing 75Hard task keys
    // This reduces O(n*m) complexity to O(n) + O(1) lookups
    const existingTaskKeys = new Set<string>()
    for (const task of state.tasks) {
      if (task.deleted || task.completed) continue
      const tags = task.tags || []
      if (!tags.includes('sfh')) continue

      // Extract key components from tags
      const sfhTag = tags.find(t => t.startsWith('sfh:') && t !== 'sfh')
      const ruleTag = tags.find(t => t.startsWith('sfhRule:'))
      const dayTag = tags.find(t => t.startsWith('sfhDay:'))
      const segTag = tags.find(t => t.startsWith('sfhSeg:'))

      if (sfhTag && ruleTag && dayTag && segTag) {
        const key = `${sfhTag}|${ruleTag}|${dayTag}|${segTag}`
        existingTaskKeys.add(key)
      }
    }
    console.log('[75Hard] Pre-built task index with', existingTaskKeys.size, 'existing tasks')

    // Deduplicate challenges by name+startDate (not just ID, as duplicates may have different IDs)
    const processedChallengeKeys = new Set<string>()
    const uniqueChallenges = state.seventyFiveHardChallenges.filter(ch => {
      const key = `${ch.name}|${formatDate(ch.startDate, 'yyyy-MM-dd')}`
      if (processedChallengeKeys.has(key)) {
        console.warn('[75Hard] Duplicate challenge detected, skipping:', ch.name, ch.id)
        return false
      }
      processedChallengeKeys.add(key)
      return true
    })

    console.log('[75Hard] Total challenges:', state.seventyFiveHardChallenges.length, 'Unique:', uniqueChallenges.length)

    if (state.seventyFiveHardChallenges.length > uniqueChallenges.length) {
      console.error('[75Hard] WARNING: Found', state.seventyFiveHardChallenges.length - uniqueChallenges.length, 'duplicate challenges! You should clean these up.')
    }

    for (const ch of uniqueChallenges) {
      if (!ch.isActive) {
        console.log('[75Hard] Skipping inactive challenge:', ch.name)
        continue
      }

      const dayNumber = differenceInDays(today, ch.startDate) + 1
      if (dayNumber < 1 || dayNumber > 75) {
        console.log('[75Hard] Challenge day out of range:', dayNumber, 'for', ch.name)
        continue
      }

      console.log('[75Hard] Processing challenge:', ch.name, 'Day:', dayNumber)
      const entry = ch.dailyEntries.find(e => e.day === dayNumber)

      for (const rule of ch.rules) {
        const title = rule.title || 'Rule'
        const target = (rule.dailyTarget && rule.dailyTarget > 1)
          ? rule.dailyTarget
          : (title.toLowerCase().includes('twice') ? 2 : 1)
        const segs = (entry?.ruleCompletions.find(rc => rc.ruleId === rule.id)?.segments) || Array.from({ length: target }, () => false)

        for (let i = 0; i < target; i++) {
          if (segs[i]) {
            console.log('[75Hard] Segment already completed:', title, `(${i + 1}/${target})`)
            continue
          }

          // Create unique key for this task
          const taskKey = `sfh:${ch.id}|sfhRule:${rule.id}|sfhDay:${dayNumber}|sfhSeg:${i}`

          // Skip if already exists in DB (O(1) lookup instead of O(n))
          if (existingTaskKeys.has(taskKey)) {
            console.log('[75Hard] Task already exists:', title, `(${i + 1}/${target})`)
            continue
          }

          if (creatingTasksSet.has(taskKey)) {
            console.log('[75Hard] Task already queued:', title, `(${i + 1}/${target})`)
            continue
          }

          // Safety check: prevent runaway task creation
          if (tasksCreated >= MAX_TASKS_PER_RUN) {
            console.error('[75Hard] SAFETY LIMIT REACHED: Stopped at', MAX_TASKS_PER_RUN, 'tasks')
            throw new Error('Safety limit reached - too many tasks being created')
          }

          // Mark that we're creating this task
          creatingTasksSet.add(taskKey)

          let segLabel = ''
          if (target > 1) {
            // Friendly labels for twice-daily workout
            const tl = title.toLowerCase()
            if (target === 2 && (tl.includes('workout') || tl.includes('exercise'))) {
              segLabel = i === 0 ? ' (Indoor)' : ' (Outdoor)'
            } else {
              const labels = rule.segmentLabels || []
              if (labels[i] && labels[i].trim()) segLabel = ` (${labels[i]})`
              else segLabel = ` (#${i + 1})`
            }
          }
          const todoTitle = `[75 Hard] ${title}${segLabel}`

          console.log('[75Hard] Creating task:', todoTitle)
          await state.addTodo({
            title: todoTitle,
            description: rule.description || undefined,
            status: 'todo',
            priority: 'medium',
            category: 'health',
            tags: ['sfh', `sfh:${ch.id}`, `sfhRule:${rule.id}`, `sfhDay:${dayNumber}`, `sfhSeg:${i}`],
            dueDate: today,
            completed: false,
            createdAt: new Date(),
          } as any)
          tasksCreated++
        }
      }
    }

    console.log('[75Hard] Total tasks created this run:', tasksCreated)
    // Dedupe any duplicates by tag signature
    try {
      const current = get().tasks
      const byKey: Record<string, string[]> = {}
      for (const t of current) {
        const tags = t.tags || []
        if (!tags.includes('sfh')) continue
        const chTag = tags.find(x => x.startsWith('sfh:'))
        const rTag = tags.find(x => x.startsWith('sfhRule:'))
        const dTag = tags.find(x => x.startsWith('sfhDay:'))
        const sTag = tags.find(x => x.startsWith('sfhSeg:'))
        if (!chTag || !rTag || !dTag || !sTag) continue
        const key = `${chTag}|${rTag}|${dTag}|${sTag}`
        byKey[key] = byKey[key] || []
        byKey[key].push(t.id)
      }
      for (const key of Object.keys(byKey)) {
        const ids = byKey[key]
        if (ids.length <= 1) continue
        for (let i = 1; i < ids.length; i++) {
          await get().deleteTodo(ids[i])
        }
      }
    } catch (dedupError) {
      console.warn('[75Hard] Dedupe failed:', dedupError)
    }

    console.log('[75Hard] Task creation completed successfully for:', todayKey)
  } catch (error) {
    console.error('[75Hard] Task creation failed:', error)
    // Note: sfhEnsuredForDate is already set earlier to prevent infinite retries on error
    // This means we won't retry until tomorrow, which prevents error loops
  } finally {
    // Always reset the in-progress flag
    set({ sfhEnsureInProgress: false })
    console.log('[75Hard] Task creation lock released')
  }
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

  // ===== Travel slice (local-only persistence) =====

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

  purgeSFHDuplicateTasks: async () => {
    try {
      const current = get().tasks
      const byKey: Record<string, { id: string; createdAt: Date }[]> = {}
      for (const t of current) {
        const tags = t.tags || []
        if (!tags.includes('sfh')) continue
        const chTag = tags.find(x => x.startsWith('sfh:'))
        const rTag = tags.find(x => x.startsWith('sfhRule:'))
        const dTag = tags.find(x => x.startsWith('sfhDay:'))
        const sTag = tags.find(x => x.startsWith('sfhSeg:'))
        if (!chTag || !rTag || !dTag || !sTag) continue
        const key = `${chTag}|${rTag}|${dTag}|${sTag}`
        byKey[key] = byKey[key] || []
        byKey[key].push({ id: t.id, createdAt: (t.createdAt instanceof Date) ? t.createdAt : new Date(t.createdAt as any) })
      }
      let removed = 0
      for (const key of Object.keys(byKey)) {
        const list = byKey[key]
        if (list.length <= 1) continue
        // Keep the earliest by createdAt
        list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        const toRemove = list.slice(1)
        for (const item of toRemove) {
          await get().deleteTodo(item.id)
          removed++
        }
      }
      if (removed > 0) {
        get().showGlobalToast?.(`Removed ${removed} duplicate 75 Hard tasks`, 'success')
      } else {
        get().showGlobalToast?.('No duplicate 75 Hard tasks found', 'info')
      }
    } catch (e) {
      console.warn('[75Hard] Purge duplicates failed', e)
      get().showGlobalToast?.('Failed to purge duplicates', 'error')
    }
  },

  purgeNonSFHDuplicateTasks: async () => {
    try {
      const current = get().tasks
      const byKey: Record<string, { id: string; createdAt: Date }[]> = {}
      for (const t of current) {
        if (t.deleted) continue
        if (t.status === 'done') continue
        const tags = t.tags || []
        if (tags.includes('sfh')) continue // skip SFH tasks handled elsewhere
        if (!t.title || !t.dueDate) continue // only dedupe with same due date
        const title = String(t.title).trim().toLowerCase()
        const dateKey = formatDate(t.dueDate as Date, 'yyyy-MM-dd')
        const key = `${title}|${dateKey}`
        byKey[key] = byKey[key] || []
        byKey[key].push({ id: t.id, createdAt: (t.createdAt instanceof Date) ? t.createdAt : new Date(t.createdAt as any) })
      }
      let removed = 0
      for (const key of Object.keys(byKey)) {
        const list = byKey[key]
        if (list.length <= 1) continue
        list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        const toRemove = list.slice(1)
        for (const item of toRemove) {
          await get().deleteTodo(item.id)
          removed++
        }
      }
      if (removed > 0) get().showGlobalToast?.(`Removed ${removed} duplicate tasks`, 'success')
      else get().showGlobalToast?.('No duplicate tasks found', 'info')
    } catch (e) {
      console.warn('[Tasks] Purge non-SFH duplicates failed', e)
      get().showGlobalToast?.('Failed to purge duplicates', 'error')
    }
  },

  // Centralized task cleanup for 75 Hard challenges
  cleanupChallengeTasks: async (challengeId: string) => {
    try {
      const tasks = get().tasks
      const tasksToDelete = tasks.filter(t =>
        (t.tags || []).includes(`sfh:${challengeId}`) && !t.deleted
      )

      console.log(`[75Hard] Cleaning up ${tasksToDelete.length} tasks for challenge ${challengeId}`)

      for (const task of tasksToDelete) {
        await get().deleteTodo(task.id)
      }

      return Promise.resolve()
    } catch (e) {
      console.warn('[75Hard] Failed to cleanup challenge tasks', e)
      return Promise.reject(e)
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
