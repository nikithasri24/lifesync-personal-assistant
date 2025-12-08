// Stores Barrel Exports
// Centralized exports for all Zustand stores

// Legacy stores (to be deprecated)
export * from './useAppStore';
export * from './useRealAppStore';

// New composed store (modern approach)
export * from './useComposedStore';
export {
  selectUI,
  selectNotes,
  selectJournal,
  selectGoals,
  selectTasks,
  selectHabits,
  selectMeals,
  selectShopping,
  selectFinance,
} from './useComposedStore';

export type { TasksSlice } from './slices/tasksSlice';
export type { HabitsSlice } from './slices/habitsSlice';
export type { MealsSlice } from './slices/mealsSlice';
export type { ShoppingSlice } from './slices/shoppingSlice';
export type { FinanceSlice } from './slices/financeSlice';
