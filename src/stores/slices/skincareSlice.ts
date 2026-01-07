/**
 * Skincare Zustand Slice - UI STATE ONLY
 *
 * ⚠️ DEPRECATED: Server state removed - use React Query hooks instead
 * 
 * This slice now contains ONLY UI state (view modes, filters, etc.)
 * All server data (skincare products, condition logs, stats, CRUD operations) should use React Query.
 *
 * ✅ Use React Query hooks from @/hooks/useSkincareQuery.ts:
 * - useSkincareProductsQuery() - Get all skincare products
 * - useSkincareProductQuery(id) - Get single product
 * - useCreateSkincareProductMutation() - Create product
 * - useUpdateSkincareProductMutation() - Update product
 * - useDeleteSkincareProductMutation() - Delete product
 * - useSkinConditionLogsQuery() - Get skin condition logs
 * - useCreateSkinConditionLogMutation() - Create log
 * - useSkincareStatsQuery() - Get skincare statistics
 *
 * Additional React Query Features:
 * - Product recommendations
 * - Routine tracking
 * - Ingredient analysis
 * - Progress tracking
 *
 * Benefits of React Query:
 * - Better skincare data caching and synchronization
 * - Optimistic updates for routine tracking
 * - Automatic invalidation when products/logs change
 * - Proper separation: Server state (React Query) vs UI state (Zustand)
 */

import { type StateCreator } from 'zustand';

export interface SkincareSlice {
  // UI State only - no server data!
  skincareViewMode: 'grid' | 'list' | 'routine';
  skincareFilterCategory: string | null;
  skincareFilterBrand: string | null;
  skincareFilterSkinType: string | null;
  skincareSortBy: 'name' | 'brand' | 'purchase_date' | 'expiry_date';
  skincareSortOrder: 'asc' | 'desc';
  skincareShowExpired: boolean;
  skincareSelectedProduct: string | null;
  skincareSelectedTab: 'products' | 'routine' | 'logs' | 'stats';

  // UI Actions
  setSkincareViewMode: (mode: 'grid' | 'list' | 'routine') => void;
  setSkincareFilterCategory: (category: string | null) => void;
  setSkincareFilterBrand: (brand: string | null) => void;
  setSkincareFilterSkinType: (skinType: string | null) => void;
  setSkincareSortBy: (sortBy: 'name' | 'brand' | 'purchase_date' | 'expiry_date') => void;
  setSkincareSortOrder: (order: 'asc' | 'desc') => void;
  setSkincareShowExpired: (show: boolean) => void;
  setSkincareSelectedProduct: (productId: string | null) => void;
  setSkincareSelectedTab: (tab: 'products' | 'routine' | 'logs' | 'stats') => void;
  resetSkincareFilters: () => void;
}

export const createSkincareSlice: StateCreator<SkincareSlice, [], [], SkincareSlice> = (set) => ({
  // Initial UI state
  skincareViewMode: 'grid',
  skincareFilterCategory: null,
  skincareFilterBrand: null,
  skincareFilterSkinType: null,
  skincareSortBy: 'name',
  skincareSortOrder: 'asc',
  skincareShowExpired: false,
  skincareSelectedProduct: null,
  skincareSelectedTab: 'products',

  // UI Actions
  setSkincareViewMode: (mode) => set({ skincareViewMode: mode }),
  setSkincareFilterCategory: (category) => set({ skincareFilterCategory: category }),
  setSkincareFilterBrand: (brand) => set({ skincareFilterBrand: brand }),
  setSkincareFilterSkinType: (skinType) => set({ skincareFilterSkinType: skinType }),
  setSkincareSortBy: (sortBy) => set({ skincareSortBy: sortBy }),
  setSkincareSortOrder: (order) => set({ skincareSortOrder: order }),
  setSkincareShowExpired: (show) => set({ skincareShowExpired: show }),
  setSkincareSelectedProduct: (productId) => set({ skincareSelectedProduct: productId }),
  setSkincareSelectedTab: (tab) => set({ skincareSelectedTab: tab }),
  resetSkincareFilters: () =>
    set({
      skincareFilterCategory: null,
      skincareFilterBrand: null,
      skincareFilterSkinType: null,
      skincareShowExpired: false,
      skincareSelectedProduct: null,
    }),
});
