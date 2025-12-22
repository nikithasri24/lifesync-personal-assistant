/**
 * Composed Store
 *
 * Modern Zustand store composed of feature slices.
 * This is the future replacement for useRealAppStore.ts
 *
 * Benefits:
 * - Clear separation of concerns
 * - Each slice is ~100-200 lines (vs 3,142-line monolith)
 * - Easy to test in isolation
 * - Type-safe across slices
 * - Better tree-shaking
 * - Granular updates (only affected components re-render)
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Import slices
import { createUISlice, type UISlice } from './slices/uiSlice';
import { createNotesSlice, type NotesSlice } from './slices/notesSlice';
import { createJournalSlice, type JournalSlice } from './slices/journalSlice';
import { createGoalsSlice, type GoalsSlice } from './slices/goalsSlice';
import { createTasksSlice, type TasksSlice } from './slices/tasksSlice';
import { createHabitsSlice, type HabitsSlice } from './slices/habitsSlice';
import { createMealsSlice, type MealsSlice } from './slices/mealsSlice';
import { createShoppingSlice, type ShoppingSlice } from './slices/shoppingSlice';
import { createFinanceSlice, type FinanceSlice } from './slices/financeSlice';
import { createProjectsSlice, type ProjectsSlice } from './slices/projectsSlice';
import { createFocusSlice, type FocusSlice } from './slices/focusSlice';
import { createSchedulerSlice, type SchedulerSlice } from './slices/schedulerSlice';
import { createLifeGoalsSlice, type LifeGoalsSlice } from './slices/lifeGoalsSlice';
import { createCalendarSlice, type CalendarSlice } from './slices/calendarSlice';
import { createSkincareSlice, type SkincareSlice } from './slices/skincareSlice';
import { createTravelSlice, type TravelSlice } from './slices/travelSlice';
import { createNationalParksSlice, type NationalParksSlice } from './slices/nationalParksSlice';

// Compose all slices into one store type
export type ComposedStore = UISlice &
  NotesSlice &
  JournalSlice &
  GoalsSlice &
  TasksSlice &
  HabitsSlice &
  MealsSlice &
  ShoppingSlice &
  FinanceSlice &
  ProjectsSlice &
  FocusSlice &
  SchedulerSlice &
  LifeGoalsSlice &
  CalendarSlice &
  SkincareSlice &
  TravelSlice &
  NationalParksSlice;

/**
 * Modern, composed Zustand store
 *
 * Usage:
 * ```typescript
 * import { useComposedStore } from '@/stores';
 *
 * // In components
 * const { activeView, setActiveView } = useComposedStore();
 * const { notes, loadNotes } = useComposedStore();
 * ```
 */
export const useComposedStore = create<ComposedStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createUISlice(...a),
        ...createNotesSlice(...a),
        ...createJournalSlice(...a),
        ...createGoalsSlice(...a),
        ...createTasksSlice(...a),
        ...createHabitsSlice(...a),
        ...createMealsSlice(...a),
        ...createShoppingSlice(...a),
        ...createFinanceSlice(...a),
        ...createProjectsSlice(...a),
        ...createFocusSlice(...a),
        ...createSchedulerSlice(...a),
        ...createLifeGoalsSlice(...a),
        ...createCalendarSlice(...a),
        ...createSkincareSlice(...a),
        ...createTravelSlice(...a),
        ...createNationalParksSlice(...a),
      }),
      {
        name: 'lifesync-storage',
        // Only persist UI preferences, not data (data comes from Supabase)
        partialize: (state) => ({
          activeView: state.activeView,
          sidebarCollapsed: state.sidebarCollapsed,
          weekStartsOn: state.weekStartsOn,
          mealOptions: state.mealOptions,
        }),
      }
    ),
    { name: 'ComposedStore' }
  )
);

// Export individual slice selectors for better performance
export const selectUI = (state: ComposedStore): Pick<
  ComposedStore,
  | 'activeView'
  | 'sidebarCollapsed'
  | 'weekStartsOn'
  | 'setActiveView'
  | 'toggleSidebar'
  | 'setSidebarCollapsed'
  | 'setWeekStartsOn'
> => ({
  activeView: state.activeView,
  sidebarCollapsed: state.sidebarCollapsed,
  weekStartsOn: state.weekStartsOn,
  setActiveView: state.setActiveView,
  toggleSidebar: state.toggleSidebar,
  setSidebarCollapsed: state.setSidebarCollapsed,
  setWeekStartsOn: state.setWeekStartsOn,
});

export const selectNotes = (state: ComposedStore): Pick<
  ComposedStore,
  | 'notesViewMode'
  | 'notesFilterCategory'
  | 'notesSortBy'
  | 'notesSortOrder'
  | 'notesSearchQuery'
  | 'notesShowArchived'
  | 'setNotesViewMode'
  | 'setNotesFilterCategory'
  | 'setNotesSortBy'
  | 'setNotesSortOrder'
  | 'setNotesSearchQuery'
  | 'setNotesShowArchived'
  | 'resetNotesFilters'
> => ({
  notesViewMode: state.notesViewMode,
  notesFilterCategory: state.notesFilterCategory,
  notesSortBy: state.notesSortBy,
  notesSortOrder: state.notesSortOrder,
  notesSearchQuery: state.notesSearchQuery,
  notesShowArchived: state.notesShowArchived,
  setNotesViewMode: state.setNotesViewMode,
  setNotesFilterCategory: state.setNotesFilterCategory,
  setNotesSortBy: state.setNotesSortBy,
  setNotesSortOrder: state.setNotesSortOrder,
  setNotesSearchQuery: state.setNotesSearchQuery,
  setNotesShowArchived: state.setNotesShowArchived,
  resetNotesFilters: state.resetNotesFilters,
});

export const selectJournal = (state: ComposedStore): Pick<
  ComposedStore,
  | 'journalViewMode'
  | 'journalFilterMood'
  | 'journalFilterDateRange'
  | 'journalSortBy'
  | 'journalSortOrder'
  | 'journalSearchQuery'
  | 'journalSelectedDate'
  | 'setJournalViewMode'
  | 'setJournalFilterMood'
  | 'setJournalFilterDateRange'
  | 'setJournalSortBy'
  | 'setJournalSortOrder'
  | 'setJournalSearchQuery'
  | 'setJournalSelectedDate'
  | 'resetJournalFilters'
> => ({
  journalViewMode: state.journalViewMode,
  journalFilterMood: state.journalFilterMood,
  journalFilterDateRange: state.journalFilterDateRange,
  journalSortBy: state.journalSortBy,
  journalSortOrder: state.journalSortOrder,
  journalSearchQuery: state.journalSearchQuery,
  journalSelectedDate: state.journalSelectedDate,
  setJournalViewMode: state.setJournalViewMode,
  setJournalFilterMood: state.setJournalFilterMood,
  setJournalFilterDateRange: state.setJournalFilterDateRange,
  setJournalSortBy: state.setJournalSortBy,
  setJournalSortOrder: state.setJournalSortOrder,
  setJournalSearchQuery: state.setJournalSearchQuery,
  setJournalSelectedDate: state.setJournalSelectedDate,
  resetJournalFilters: state.resetJournalFilters,
});

export const selectTasks = (state: ComposedStore): Pick<
  ComposedStore,
  | 'tasksViewMode'
  | 'tasksFilterStatus'
  | 'tasksFilterPriority'
  | 'tasksSortBy'
  | 'tasksSortOrder'
  | 'tasksShowArchived'
  | 'tasksShowStarred'
  | 'tasksSelectedCategory'
  | 'tasksSelectedProject'
  | 'setTasksViewMode'
  | 'setTasksFilterStatus'
  | 'setTasksFilterPriority'
  | 'setTasksSortBy'
  | 'setTasksSortOrder'
  | 'setTasksShowArchived'
  | 'setTasksShowStarred'
  | 'setTasksSelectedCategory'
  | 'setTasksSelectedProject'
  | 'resetTasksFilters'
> => ({
  tasksViewMode: state.tasksViewMode,
  tasksFilterStatus: state.tasksFilterStatus,
  tasksFilterPriority: state.tasksFilterPriority,
  tasksSortBy: state.tasksSortBy,
  tasksSortOrder: state.tasksSortOrder,
  tasksShowArchived: state.tasksShowArchived,
  tasksShowStarred: state.tasksShowStarred,
  tasksSelectedCategory: state.tasksSelectedCategory,
  tasksSelectedProject: state.tasksSelectedProject,
  setTasksViewMode: state.setTasksViewMode,
  setTasksFilterStatus: state.setTasksFilterStatus,
  setTasksFilterPriority: state.setTasksFilterPriority,
  setTasksSortBy: state.setTasksSortBy,
  setTasksSortOrder: state.setTasksSortOrder,
  setTasksShowArchived: state.setTasksShowArchived,
  setTasksShowStarred: state.setTasksShowStarred,
  setTasksSelectedCategory: state.setTasksSelectedCategory,
  setTasksSelectedProject: state.setTasksSelectedProject,
  resetTasksFilters: state.resetTasksFilters,
});

export const selectHabits = (state: ComposedStore): Pick<
  ComposedStore,
  | 'habitsViewMode'
  | 'habitsFilterFrequency'
  | 'habitsShowArchived'
  | 'habitsSelectedDate'
  | 'habitsSelectedCategory'
  | 'habitsSortBy'
  | 'habitsSortOrder'
  | 'setHabitsViewMode'
  | 'setHabitsFilterFrequency'
  | 'setHabitsShowArchived'
  | 'setHabitsSelectedDate'
  | 'setHabitsSelectedCategory'
  | 'setHabitsSortBy'
  | 'setHabitsSortOrder'
  | 'resetHabitsFilters'
> => ({
  habitsViewMode: state.habitsViewMode,
  habitsFilterFrequency: state.habitsFilterFrequency,
  habitsShowArchived: state.habitsShowArchived,
  habitsSelectedDate: state.habitsSelectedDate,
  habitsSelectedCategory: state.habitsSelectedCategory,
  habitsSortBy: state.habitsSortBy,
  habitsSortOrder: state.habitsSortOrder,
  setHabitsViewMode: state.setHabitsViewMode,
  setHabitsFilterFrequency: state.setHabitsFilterFrequency,
  setHabitsShowArchived: state.setHabitsShowArchived,
  setHabitsSelectedDate: state.setHabitsSelectedDate,
  setHabitsSelectedCategory: state.setHabitsSelectedCategory,
  setHabitsSortBy: state.setHabitsSortBy,
  setHabitsSortOrder: state.setHabitsSortOrder,
  resetHabitsFilters: state.resetHabitsFilters,
});

export const selectMeals = (state: ComposedStore): Pick<
  ComposedStore,
  | 'mealPlans'
  | 'mealPlansLoaded'
  | 'mealPlansLoading'
  | 'mealPlansError'
  | 'loadMealPlans'
  | 'addMealPlan'
  | 'updateMealPlan'
  | 'deleteMealPlan'
  | 'addPlannedMeal'
  | 'updatePlannedMeal'
  | 'deletePlannedMeal'
  | 'getMealPlanById'
> => ({
  mealPlans: state.mealPlans,
  mealPlansLoaded: state.mealPlansLoaded,
  mealPlansLoading: state.mealPlansLoading,
  mealPlansError: state.mealPlansError,
  loadMealPlans: state.loadMealPlans,
  addMealPlan: state.addMealPlan,
  updateMealPlan: state.updateMealPlan,
  deleteMealPlan: state.deleteMealPlan,
  addPlannedMeal: state.addPlannedMeal,
  updatePlannedMeal: state.updatePlannedMeal,
  deletePlannedMeal: state.deletePlannedMeal,
  getMealPlanById: state.getMealPlanById,
});

export const selectShopping = (state: ComposedStore): Pick<
  ComposedStore,
  | 'shoppingLists'
  | 'shoppingListsLoaded'
  | 'shoppingListsLoading'
  | 'shoppingError'
  | 'itemsByList'
  | 'itemsLoading'
  | 'loadShoppingLists'
  | 'addShoppingList'
  | 'loadShoppingItems'
  | 'addShoppingItem'
  | 'updateShoppingItem'
  | 'deleteShoppingItem'
  | 'getShoppingListById'
> => ({
  shoppingLists: state.shoppingLists,
  shoppingListsLoaded: state.shoppingListsLoaded,
  shoppingListsLoading: state.shoppingListsLoading,
  shoppingError: state.shoppingError,
  itemsByList: state.itemsByList,
  itemsLoading: state.itemsLoading,
  loadShoppingLists: state.loadShoppingLists,
  addShoppingList: state.addShoppingList,
  loadShoppingItems: state.loadShoppingItems,
  addShoppingItem: state.addShoppingItem,
  updateShoppingItem: state.updateShoppingItem,
  deleteShoppingItem: state.deleteShoppingItem,
  getShoppingListById: state.getShoppingListById,
});

export const selectFinance = (state: ComposedStore): Pick<
  ComposedStore,
  | 'accounts'
  | 'accountsLoaded'
  | 'accountsLoading'
  | 'accountsError'
  | 'transactions'
  | 'transactionsLoaded'
  | 'transactionsLoading'
  | 'transactionsError'
  | 'loadAccounts'
  | 'loadTransactions'
  | 'addTransaction'
  | 'updateTransaction'
> => ({
  accounts: state.accounts,
  accountsLoaded: state.accountsLoaded,
  accountsLoading: state.accountsLoading,
  accountsError: state.accountsError,
  transactions: state.transactions,
  transactionsLoaded: state.transactionsLoaded,
  transactionsLoading: state.transactionsLoading,
  transactionsError: state.transactionsError,
  loadAccounts: state.loadAccounts,
  loadTransactions: state.loadTransactions,
  addTransaction: state.addTransaction,
  updateTransaction: state.updateTransaction,
});

export const selectGoals = (state: ComposedStore): Pick<
  ComposedStore,
  | 'goalsViewMode'
  | 'goalsFilterStatus'
  | 'goalsFilterCategory'
  | 'goalsFilterTimeframe'
  | 'goalsSortBy'
  | 'goalsSortOrder'
  | 'goalsShowArchived'
  | 'goalsSelectedGoal'
  | 'setGoalsViewMode'
  | 'setGoalsFilterStatus'
  | 'setGoalsFilterCategory'
  | 'setGoalsFilterTimeframe'
  | 'setGoalsSortBy'
  | 'setGoalsSortOrder'
  | 'setGoalsShowArchived'
  | 'setGoalsSelectedGoal'
  | 'resetGoalsFilters'
> => ({
  goalsViewMode: state.goalsViewMode,
  goalsFilterStatus: state.goalsFilterStatus,
  goalsFilterCategory: state.goalsFilterCategory,
  goalsFilterTimeframe: state.goalsFilterTimeframe,
  goalsSortBy: state.goalsSortBy,
  goalsSortOrder: state.goalsSortOrder,
  goalsShowArchived: state.goalsShowArchived,
  goalsSelectedGoal: state.goalsSelectedGoal,
  setGoalsViewMode: state.setGoalsViewMode,
  setGoalsFilterStatus: state.setGoalsFilterStatus,
  setGoalsFilterCategory: state.setGoalsFilterCategory,
  setGoalsFilterTimeframe: state.setGoalsFilterTimeframe,
  setGoalsSortBy: state.setGoalsSortBy,
  setGoalsSortOrder: state.setGoalsSortOrder,
  setGoalsShowArchived: state.setGoalsShowArchived,
  setGoalsSelectedGoal: state.setGoalsSelectedGoal,
  resetGoalsFilters: state.resetGoalsFilters,
});

export const selectDreams = (state: ComposedStore): Pick<
  ComposedStore,
  | 'dreamsViewMode'
  | 'dreamsFilterCategory'
  | 'dreamsSortBy'
  | 'dreamsSortOrder'
  | 'setDreamsViewMode'
  | 'setDreamsFilterCategory'
  | 'setDreamsSortBy'
  | 'setDreamsSortOrder'
  | 'resetDreamsFilters'
> => ({
  dreamsViewMode: state.dreamsViewMode,
  dreamsFilterCategory: state.dreamsFilterCategory,
  dreamsSortBy: state.dreamsSortBy,
  dreamsSortOrder: state.dreamsSortOrder,
  setDreamsViewMode: state.setDreamsViewMode,
  setDreamsFilterCategory: state.setDreamsFilterCategory,
  setDreamsSortBy: state.setDreamsSortBy,
  setDreamsSortOrder: state.setDreamsSortOrder,
  resetDreamsFilters: state.resetDreamsFilters,
});

export const selectProjects = (state: ComposedStore): Pick<
  ComposedStore,
  | 'projects'
  | 'projectsLoaded'
  | 'projectsLoading'
  | 'projectsError'
  | 'loadProjects'
  | 'refreshProject'
  | 'addProject'
  | 'updateProject'
  | 'deleteProject'
  | 'getProjectById'
  | 'addMilestone'
  | 'updateMilestone'
  | 'deleteMilestone'
  | 'linkTask'
  | 'unlinkTask'
> => ({
  projects: state.projects,
  projectsLoaded: state.projectsLoaded,
  projectsLoading: state.projectsLoading,
  projectsError: state.projectsError,
  loadProjects: state.loadProjects,
  refreshProject: state.refreshProject,
  addProject: state.addProject,
  updateProject: state.updateProject,
  deleteProject: state.deleteProject,
  getProjectById: state.getProjectById,
  addMilestone: state.addMilestone,
  updateMilestone: state.updateMilestone,
  deleteMilestone: state.deleteMilestone,
  linkTask: state.linkTask,
  unlinkTask: state.unlinkTask,
});

export const selectFocus = (state: ComposedStore): Pick<
  ComposedStore,
  | 'sessions'
  | 'sessionsLoaded'
  | 'sessionsLoading'
  | 'sessionsError'
  | 'loadSessions'
  | 'createSession'
  | 'completeSession'
  | 'abandonSession'
  | 'updateSessionDetails'
  | 'getStats'
  | 'getSessionById'
> => ({
  sessions: state.sessions,
  sessionsLoaded: state.sessionsLoaded,
  sessionsLoading: state.sessionsLoading,
  sessionsError: state.sessionsError,
  loadSessions: state.loadSessions,
  createSession: state.createSession,
  completeSession: state.completeSession,
  abandonSession: state.abandonSession,
  updateSessionDetails: state.updateSessionDetails,
  getStats: state.getStats,
  getSessionById: state.getSessionById,
});
