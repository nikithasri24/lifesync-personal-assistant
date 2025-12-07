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

// Compose all slices into one store type
export type ComposedStore = UISlice &
  NotesSlice &
  JournalSlice &
  GoalsSlice &
  TasksSlice &
  HabitsSlice &
  MealsSlice &
  ShoppingSlice &
  FinanceSlice;

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
      }),
      {
        name: 'lifesync-storage',
        // Only persist UI preferences, not data (data comes from Supabase)
        partialize: (state) => ({
          activeView: state.activeView,
          sidebarCollapsed: state.sidebarCollapsed,
          weekStartsOn: state.weekStartsOn,
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
  | 'notes'
  | 'notesLoaded'
  | 'notesLoading'
  | 'loadNotes'
  | 'addNote'
  | 'updateNote'
  | 'deleteNote'
  | 'getNoteById'
> => ({
  notes: state.notes,
  notesLoaded: state.notesLoaded,
  notesLoading: state.notesLoading,
  loadNotes: state.loadNotes,
  addNote: state.addNote,
  updateNote: state.updateNote,
  deleteNote: state.deleteNote,
  getNoteById: state.getNoteById,
});

export const selectJournal = (state: ComposedStore): Pick<
  ComposedStore,
  | 'journalEntries'
  | 'journalLoaded'
  | 'journalLoading'
  | 'loadJournal'
  | 'addJournalEntry'
  | 'updateJournalEntry'
  | 'deleteJournalEntry'
  | 'searchJournalEntries'
  | 'getJournalEntryById'
> => ({
  journalEntries: state.journalEntries,
  journalLoaded: state.journalLoaded,
  journalLoading: state.journalLoading,
  loadJournal: state.loadJournal,
  addJournalEntry: state.addJournalEntry,
  updateJournalEntry: state.updateJournalEntry,
  deleteJournalEntry: state.deleteJournalEntry,
  searchJournalEntries: state.searchJournalEntries,
  getJournalEntryById: state.getJournalEntryById,
});

export const selectTasks = (state: ComposedStore): Pick<
  ComposedStore,
  | 'tasks'
  | 'tasksLoaded'
  | 'tasksLoading'
  | 'tasksError'
  | 'loadTasks'
  | 'addTask'
  | 'updateTask'
  | 'softDeleteTask'
  | 'restoreTask'
  | 'hardDeleteTask'
  | 'getTaskById'
> => ({
  tasks: state.tasks,
  tasksLoaded: state.tasksLoaded,
  tasksLoading: state.tasksLoading,
  tasksError: state.tasksError,
  loadTasks: state.loadTasks,
  addTask: state.addTask,
  updateTask: state.updateTask,
  softDeleteTask: state.softDeleteTask,
  restoreTask: state.restoreTask,
  hardDeleteTask: state.hardDeleteTask,
  getTaskById: state.getTaskById,
});

export const selectHabits = (state: ComposedStore): Pick<
  ComposedStore,
  | 'habits'
  | 'habitsLoaded'
  | 'habitsLoading'
  | 'habitsError'
  | 'habitEntries'
  | 'habitEntriesLoading'
  | 'loadHabits'
  | 'loadHabitEntries'
  | 'loadHabitEntriesForHabit'
  | 'addHabit'
  | 'updateHabit'
  | 'deleteHabit'
  | 'addHabitEntry'
  | 'updateHabitEntry'
  | 'deleteHabitEntry'
  | 'deleteHabitEntryForDate'
  | 'getHabitById'
> => ({
  habits: state.habits,
  habitsLoaded: state.habitsLoaded,
  habitsLoading: state.habitsLoading,
  habitsError: state.habitsError,
  habitEntries: state.habitEntries,
  habitEntriesLoading: state.habitEntriesLoading,
  loadHabits: state.loadHabits,
  loadHabitEntries: state.loadHabitEntries,
  loadHabitEntriesForHabit: state.loadHabitEntriesForHabit,
  addHabit: state.addHabit,
  updateHabit: state.updateHabit,
  deleteHabit: state.deleteHabit,
  addHabitEntry: state.addHabitEntry,
  updateHabitEntry: state.updateHabitEntry,
  deleteHabitEntry: state.deleteHabitEntry,
  deleteHabitEntryForDate: state.deleteHabitEntryForDate,
  getHabitById: state.getHabitById,
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
  | 'goals'
  | 'goalsLoaded'
  | 'goalsLoading'
  | 'loadGoals'
  | 'addGoal'
  | 'updateGoal'
  | 'deleteGoal'
  | 'getGoalById'
> => ({
  goals: state.goals,
  goalsLoaded: state.goalsLoaded,
  goalsLoading: state.goalsLoading,
  loadGoals: state.loadGoals,
  addGoal: state.addGoal,
  updateGoal: state.updateGoal,
  deleteGoal: state.deleteGoal,
  getGoalById: state.getGoalById,
});

export const selectDreams = (state: ComposedStore): Pick<
  ComposedStore,
  | 'dreams'
  | 'dreamsLoaded'
  | 'dreamsLoading'
  | 'loadDreams'
  | 'addDream'
  | 'updateDream'
  | 'deleteDream'
  | 'getDreamById'
> => ({
  dreams: state.dreams,
  dreamsLoaded: state.dreamsLoaded,
  dreamsLoading: state.dreamsLoading,
  loadDreams: state.loadDreams,
  addDream: state.addDream,
  updateDream: state.updateDream,
  deleteDream: state.deleteDream,
  getDreamById: state.getDreamById,
});
