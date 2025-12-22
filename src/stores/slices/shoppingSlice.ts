/**
 * Shopping Zustand Slice - UI STATE ONLY
 *
 * ⚠️ DEPRECATED: Server state removed - use React Query hooks instead
 * 
 * This slice now contains ONLY UI state (view modes, filters, etc.)
 * All server data (shopping lists, items, loading states, CRUD operations) should use React Query.
 *
 * ✅ Use React Query hooks from @/hooks/useShoppingQuery.ts:
 * - useShoppingListsQuery() - Get all shopping lists
 * - useShoppingListQuery(id) - Get single shopping list
 * - useShoppingItemsQuery(listId) - Get items for a list
 * - useCreateShoppingListMutation() - Create shopping list
 * - useUpdateShoppingListMutation() - Update shopping list
 * - useDeleteShoppingListMutation() - Delete shopping list
 * - useCreateShoppingItemMutation() - Add shopping item
 * - useUpdateShoppingItemMutation() - Update shopping item
 * - useDeleteShoppingItemMutation() - Delete shopping item
 * - useToggleShoppingItemMutation() - Toggle item checked status
 *
 * Additional React Query Features:
 * - Smart categorization hooks
 * - Price tracking hooks
 * - Store location hooks
 * - Recipe-to-shopping-list conversion
 *
 * Benefits of React Query:
 * - Better shopping list caching and synchronization
 * - Optimistic updates for item checking
 * - Automatic invalidation when lists change
 * - Proper separation: Server state (React Query) vs UI state (Zustand)
 */

import { type StateCreator } from 'zustand';

export interface ShoppingSlice {
  // UI State only - no server data!
  shoppingViewMode: 'list' | 'grid' | 'category';
  shoppingFilterStore: string | null;
  shoppingFilterCategory: string | null;
  shoppingShowCompleted: boolean;
  shoppingGroupByCategory: boolean;
  shoppingSortBy: 'name' | 'category' | 'priority' | 'created_at';
  shoppingSortOrder: 'asc' | 'desc';
  shoppingSelectedList: string | null;

  // UI Actions
  setShoppingViewMode: (mode: 'list' | 'grid' | 'category') => void;
  setShoppingFilterStore: (store: string | null) => void;
  setShoppingFilterCategory: (category: string | null) => void;
  setShoppingShowCompleted: (show: boolean) => void;
  setShoppingGroupByCategory: (group: boolean) => void;
  setShoppingSortBy: (sortBy: 'name' | 'category' | 'priority' | 'created_at') => void;
  setShoppingSortOrder: (order: 'asc' | 'desc') => void;
  setShoppingSelectedList: (listId: string | null) => void;
  resetShoppingFilters: () => void;
}

export const createShoppingSlice: StateCreator<ShoppingSlice, [], [], ShoppingSlice> = (set) => ({
  // Initial UI state
  shoppingViewMode: 'list',
  shoppingFilterStore: null,
  shoppingFilterCategory: null,
  shoppingShowCompleted: false,
  shoppingGroupByCategory: true,
  shoppingSortBy: 'category',
  shoppingSortOrder: 'asc',
  shoppingSelectedList: null,

  // UI Actions
  setShoppingViewMode: (mode) => set({ shoppingViewMode: mode }),
  setShoppingFilterStore: (store) => set({ shoppingFilterStore: store }),
  setShoppingFilterCategory: (category) => set({ shoppingFilterCategory: category }),
  setShoppingShowCompleted: (show) => set({ shoppingShowCompleted: show }),
  setShoppingGroupByCategory: (group) => set({ shoppingGroupByCategory: group }),
  setShoppingSortBy: (sortBy) => set({ shoppingSortBy: sortBy }),
  setShoppingSortOrder: (order) => set({ shoppingSortOrder: order }),
  setShoppingSelectedList: (listId) => set({ shoppingSelectedList: listId }),
  resetShoppingFilters: () =>
    set({
      shoppingFilterStore: null,
      shoppingFilterCategory: null,
      shoppingShowCompleted: false,
      shoppingGroupByCategory: true,
      shoppingSortBy: 'category',
      shoppingSortOrder: 'asc',
      shoppingSelectedList: null,
    }),
});
