// Legacy API client wrapper
// Maintained for compatibility with diagnostic scripts and older imports.
// NOTE: apiClient has been deprecated. Use the API layer (src/api/*.ts) instead.

// Keep the environment reference so tooling can verify configuration.
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001/api';
void API_BASE;

// Re-export types for backward compatibility
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
