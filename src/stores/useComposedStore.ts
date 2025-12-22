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
  | 'mealsViewMode'
  | 'mealsFilterDateRange'
  | 'mealsFilterMealType'
  | 'mealsFilterDietaryPreference'
  | 'mealsShowRecipes'
  | 'mealsSelectedMealPlan'
  | 'mealsSelectedDate'
  | 'setMealsViewMode'
  | 'setMealsFilterDateRange'
  | 'setMealsFilterMealType'
  | 'setMealsFilterDietaryPreference'
  | 'setMealsShowRecipes'
  | 'setMealsSelectedMealPlan'
  | 'setMealsSelectedDate'
  | 'resetMealsFilters'
> => ({
  mealsViewMode: state.mealsViewMode,
  mealsFilterDateRange: state.mealsFilterDateRange,
  mealsFilterMealType: state.mealsFilterMealType,
  mealsFilterDietaryPreference: state.mealsFilterDietaryPreference,
  mealsShowRecipes: state.mealsShowRecipes,
  mealsSelectedMealPlan: state.mealsSelectedMealPlan,
  mealsSelectedDate: state.mealsSelectedDate,
  setMealsViewMode: state.setMealsViewMode,
  setMealsFilterDateRange: state.setMealsFilterDateRange,
  setMealsFilterMealType: state.setMealsFilterMealType,
  setMealsFilterDietaryPreference: state.setMealsFilterDietaryPreference,
  setMealsShowRecipes: state.setMealsShowRecipes,
  setMealsSelectedMealPlan: state.setMealsSelectedMealPlan,
  setMealsSelectedDate: state.setMealsSelectedDate,
  resetMealsFilters: state.resetMealsFilters,
});

export const selectShopping = (state: ComposedStore): Pick<
  ComposedStore,
  | 'shoppingViewMode'
  | 'shoppingFilterStore'
  | 'shoppingFilterCategory'
  | 'shoppingShowCompleted'
  | 'shoppingGroupByCategory'
  | 'shoppingSortBy'
  | 'shoppingSortOrder'
  | 'shoppingSelectedList'
  | 'setShoppingViewMode'
  | 'setShoppingFilterStore'
  | 'setShoppingFilterCategory'
  | 'setShoppingShowCompleted'
  | 'setShoppingGroupByCategory'
  | 'setShoppingSortBy'
  | 'setShoppingSortOrder'
  | 'setShoppingSelectedList'
  | 'resetShoppingFilters'
> => ({
  shoppingViewMode: state.shoppingViewMode,
  shoppingFilterStore: state.shoppingFilterStore,
  shoppingFilterCategory: state.shoppingFilterCategory,
  shoppingShowCompleted: state.shoppingShowCompleted,
  shoppingGroupByCategory: state.shoppingGroupByCategory,
  shoppingSortBy: state.shoppingSortBy,
  shoppingSortOrder: state.shoppingSortOrder,
  shoppingSelectedList: state.shoppingSelectedList,
  setShoppingViewMode: state.setShoppingViewMode,
  setShoppingFilterStore: state.setShoppingFilterStore,
  setShoppingFilterCategory: state.setShoppingFilterCategory,
  setShoppingShowCompleted: state.setShoppingShowCompleted,
  setShoppingGroupByCategory: state.setShoppingGroupByCategory,
  setShoppingSortBy: state.setShoppingSortBy,
  setShoppingSortOrder: state.setShoppingSortOrder,
  setShoppingSelectedList: state.setShoppingSelectedList,
  resetShoppingFilters: state.resetShoppingFilters,
});

export const selectFinance = (state: ComposedStore): Pick<
  ComposedStore,
  | 'financeViewMode'
  | 'financeFilterDateRange'
  | 'financeFilterCategory'
  | 'financeFilterAccount'
  | 'financeFilterType'
  | 'financeSortBy'
  | 'financeSortOrder'
  | 'financeShowRecurring'
  | 'financeSelectedTransaction'
  | 'financeSelectedAccount'
  | 'setFinanceViewMode'
  | 'setFinanceFilterDateRange'
  | 'setFinanceFilterCategory'
  | 'setFinanceFilterAccount'
  | 'setFinanceFilterType'
  | 'setFinanceSortBy'
  | 'setFinanceSortOrder'
  | 'setFinanceShowRecurring'
  | 'setFinanceSelectedTransaction'
  | 'setFinanceSelectedAccount'
  | 'resetFinanceFilters'
> => ({
  financeViewMode: state.financeViewMode,
  financeFilterDateRange: state.financeFilterDateRange,
  financeFilterCategory: state.financeFilterCategory,
  financeFilterAccount: state.financeFilterAccount,
  financeFilterType: state.financeFilterType,
  financeSortBy: state.financeSortBy,
  financeSortOrder: state.financeSortOrder,
  financeShowRecurring: state.financeShowRecurring,
  financeSelectedTransaction: state.financeSelectedTransaction,
  financeSelectedAccount: state.financeSelectedAccount,
  setFinanceViewMode: state.setFinanceViewMode,
  setFinanceFilterDateRange: state.setFinanceFilterDateRange,
  setFinanceFilterCategory: state.setFinanceFilterCategory,
  setFinanceFilterAccount: state.setFinanceFilterAccount,
  setFinanceFilterType: state.setFinanceFilterType,
  setFinanceSortBy: state.setFinanceSortBy,
  setFinanceSortOrder: state.setFinanceSortOrder,
  setFinanceShowRecurring: state.setFinanceShowRecurring,
  setFinanceSelectedTransaction: state.setFinanceSelectedTransaction,
  setFinanceSelectedAccount: state.setFinanceSelectedAccount,
  resetFinanceFilters: state.resetFinanceFilters,
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
  | 'projectsViewMode'
  | 'projectsFilterStatus'
  | 'projectsFilterPriority'
  | 'projectsFilterCategory'
  | 'projectsSortBy'
  | 'projectsSortOrder'
  | 'projectsShowArchived'
  | 'projectsSelectedProject'
  | 'projectsShowMilestones'
  | 'projectsShowTasks'
  | 'setProjectsViewMode'
  | 'setProjectsFilterStatus'
  | 'setProjectsFilterPriority'
  | 'setProjectsFilterCategory'
  | 'setProjectsSortBy'
  | 'setProjectsSortOrder'
  | 'setProjectsShowArchived'
  | 'setProjectsSelectedProject'
  | 'setProjectsShowMilestones'
  | 'setProjectsShowTasks'
  | 'resetProjectsFilters'
> => ({
  projectsViewMode: state.projectsViewMode,
  projectsFilterStatus: state.projectsFilterStatus,
  projectsFilterPriority: state.projectsFilterPriority,
  projectsFilterCategory: state.projectsFilterCategory,
  projectsSortBy: state.projectsSortBy,
  projectsSortOrder: state.projectsSortOrder,
  projectsShowArchived: state.projectsShowArchived,
  projectsSelectedProject: state.projectsSelectedProject,
  projectsShowMilestones: state.projectsShowMilestones,
  projectsShowTasks: state.projectsShowTasks,
  setProjectsViewMode: state.setProjectsViewMode,
  setProjectsFilterStatus: state.setProjectsFilterStatus,
  setProjectsFilterPriority: state.setProjectsFilterPriority,
  setProjectsFilterCategory: state.setProjectsFilterCategory,
  setProjectsSortBy: state.setProjectsSortBy,
  setProjectsSortOrder: state.setProjectsSortOrder,
  setProjectsShowArchived: state.setProjectsShowArchived,
  setProjectsSelectedProject: state.setProjectsSelectedProject,
  setProjectsShowMilestones: state.setProjectsShowMilestones,
  setProjectsShowTasks: state.setProjectsShowTasks,
  resetProjectsFilters: state.resetProjectsFilters,
});

export const selectFocus = (state: ComposedStore): Pick<
  ComposedStore,
  | 'focusViewMode'
  | 'focusTimerState'
  | 'focusTimerDuration'
  | 'focusTimerElapsed'
  | 'focusBreakDuration'
  | 'focusFilterDateRange'
  | 'focusFilterStatus'
  | 'focusSortBy'
  | 'focusSortOrder'
  | 'focusSelectedSession'
  | 'focusShowBreaks'
  | 'setFocusViewMode'
  | 'setFocusTimerState'
  | 'setFocusTimerDuration'
  | 'setFocusTimerElapsed'
  | 'setFocusBreakDuration'
  | 'setFocusFilterDateRange'
  | 'setFocusFilterStatus'
  | 'setFocusSortBy'
  | 'setFocusSortOrder'
  | 'setFocusSelectedSession'
  | 'setFocusShowBreaks'
  | 'resetFocusFilters'
  | 'resetFocusTimer'
> => ({
  focusViewMode: state.focusViewMode,
  focusTimerState: state.focusTimerState,
  focusTimerDuration: state.focusTimerDuration,
  focusTimerElapsed: state.focusTimerElapsed,
  focusBreakDuration: state.focusBreakDuration,
  focusFilterDateRange: state.focusFilterDateRange,
  focusFilterStatus: state.focusFilterStatus,
  focusSortBy: state.focusSortBy,
  focusSortOrder: state.focusSortOrder,
  focusSelectedSession: state.focusSelectedSession,
  focusShowBreaks: state.focusShowBreaks,
  setFocusViewMode: state.setFocusViewMode,
  setFocusTimerState: state.setFocusTimerState,
  setFocusTimerDuration: state.setFocusTimerDuration,
  setFocusTimerElapsed: state.setFocusTimerElapsed,
  setFocusBreakDuration: state.setFocusBreakDuration,
  setFocusFilterDateRange: state.setFocusFilterDateRange,
  setFocusFilterStatus: state.setFocusFilterStatus,
  setFocusSortBy: state.setFocusSortBy,
  setFocusSortOrder: state.setFocusSortOrder,
  setFocusSelectedSession: state.setFocusSelectedSession,
  setFocusShowBreaks: state.setFocusShowBreaks,
  resetFocusFilters: state.resetFocusFilters,
  resetFocusTimer: state.resetFocusTimer,
});

export const selectCalendar = (state: ComposedStore): Pick<
  ComposedStore,
  | 'calendarViewMode'
  | 'calendarSelectedDate'
  | 'calendarFilterCategory'
  | 'calendarFilterEventType'
  | 'calendarShowWeekends'
  | 'calendarShowCompleted'
  | 'calendarTimeFormat'
  | 'calendarWeekStartsOn'
  | 'calendarSelectedEvent'
  | 'setCalendarViewMode'
  | 'setCalendarSelectedDate'
  | 'setCalendarFilterCategory'
  | 'setCalendarFilterEventType'
  | 'setCalendarShowWeekends'
  | 'setCalendarShowCompleted'
  | 'setCalendarTimeFormat'
  | 'setCalendarWeekStartsOn'
  | 'setCalendarSelectedEvent'
  | 'resetCalendarFilters'
  | 'navigateToToday'
  | 'navigateNext'
  | 'navigatePrevious'
> => ({
  calendarViewMode: state.calendarViewMode,
  calendarSelectedDate: state.calendarSelectedDate,
  calendarFilterCategory: state.calendarFilterCategory,
  calendarFilterEventType: state.calendarFilterEventType,
  calendarShowWeekends: state.calendarShowWeekends,
  calendarShowCompleted: state.calendarShowCompleted,
  calendarTimeFormat: state.calendarTimeFormat,
  calendarWeekStartsOn: state.calendarWeekStartsOn,
  calendarSelectedEvent: state.calendarSelectedEvent,
  setCalendarViewMode: state.setCalendarViewMode,
  setCalendarSelectedDate: state.setCalendarSelectedDate,
  setCalendarFilterCategory: state.setCalendarFilterCategory,
  setCalendarFilterEventType: state.setCalendarFilterEventType,
  setCalendarShowWeekends: state.setCalendarShowWeekends,
  setCalendarShowCompleted: state.setCalendarShowCompleted,
  setCalendarTimeFormat: state.setCalendarTimeFormat,
  setCalendarWeekStartsOn: state.setCalendarWeekStartsOn,
  setCalendarSelectedEvent: state.setCalendarSelectedEvent,
  resetCalendarFilters: state.resetCalendarFilters,
  navigateToToday: state.navigateToToday,
  navigateNext: state.navigateNext,
  navigatePrevious: state.navigatePrevious,
});
