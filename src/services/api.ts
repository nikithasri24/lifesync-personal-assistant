// Legacy API client wrapper
// Maintained for compatibility with diagnostic scripts and older imports.
// The real implementation lives in `apiClient.ts` which supports Supabase + REST.

// Keep the environment reference so tooling can verify configuration.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
void API_BASE;

export { apiClient } from './apiClient';
export type {
  TaskData,
  ProjectData,
  HabitData,
  HabitEntryData,
  FinancialTransactionData,
  ShoppingListData,
  ShoppingItemData,
  FocusSessionData,
  RecipeData,
  AnalyticsData,
} from './types';
