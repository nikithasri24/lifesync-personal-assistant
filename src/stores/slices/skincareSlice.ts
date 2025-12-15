/**
 * Skincare Slice
 * Manages skincare products and condition logs
 */

import type { StateCreator } from 'zustand';
import type { SkincareProduct } from '@/skincare/types';
import type { SkinConditionLog } from '@/services/types';
import {
  getSkincareProducts,
  createSkincareProduct as apiCreateSkincareProduct,
  updateSkincareProduct as apiUpdateSkincareProduct,
  deleteSkincareProduct as apiDeleteSkincareProduct,
  getSkinConditionLogs,
  createSkinConditionLog as apiCreateSkinConditionLog,
  getSkincareStats,
} from '@/api/skincareAPI';
import { logger } from '@/services/logger';

export interface SkincareSlice {
  // State
  skincareProducts: SkincareProduct[];
  skinConditionLogs: SkinConditionLog[];
  skincareLoaded: boolean;
  skincareLoading: boolean;
  skincareError: string | null;

  // Actions
  loadSkincareProducts: (filters?: Parameters<typeof getSkincareProducts>[0]) => Promise<void>;
  addSkincareProduct: (product: Omit<SkincareProduct, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<SkincareProduct>;
  updateSkincareProduct: (id: string, updates: Partial<SkincareProduct>) => Promise<SkincareProduct>;
  deleteSkincareProduct: (id: string) => Promise<void>;

  loadSkinConditionLogs: (filters?: Parameters<typeof getSkinConditionLogs>[0]) => Promise<void>;
  addSkinConditionLog: (log: Omit<SkinConditionLog, 'id' | 'user_id' | 'created_at'>) => Promise<SkinConditionLog>;

  getSkincareStats: () => ReturnType<typeof getSkincareStats>;
  getSkincareProductById: (id: string) => SkincareProduct | undefined;
}

export const createSkincareSlice: StateCreator<SkincareSlice, [], [], SkincareSlice> = (
  set,
  get
) => ({
  // Initial state
  skincareProducts: [],
  skinConditionLogs: [],
  skincareLoaded: false,
  skincareLoading: false,
  skincareError: null,

  // Load skincare products
  loadSkincareProducts: async (filters): Promise<void> => {
    if (get().skincareLoading) return;

    set({ skincareLoading: true, skincareError: null });
    try {
      const products = await getSkincareProducts(filters);
      set({ skincareProducts: products, skincareLoaded: true, skincareLoading: false });
      logger.info('SkincareSlice', 'Skincare products loaded', { count: products.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load skincare products';
      logger.error('SkincareSlice', 'Operation failed', { error, context: 'loadSkincareProducts' });
      set({
        skincareError: errorMessage,
        skincareLoading: false,
      });
      throw error;
    }
  },

  // Add a new skincare product
  addSkincareProduct: async (product): Promise<SkincareProduct> => {
    try {
      const created = await apiCreateSkincareProduct(product);
      set((state) => ({ skincareProducts: [created, ...state.skincareProducts] }));
      logger.info('SkincareSlice', 'Skincare product created', { id: created.id, name: created.name });
      return created;
    } catch (error) {
      logger.error('SkincareSlice', 'Operation failed', { error, context: 'addSkincareProduct' });
      throw error;
    }
  },

  // Update a skincare product
  updateSkincareProduct: async (id, updates): Promise<SkincareProduct> => {
    try {
      const updated = await apiUpdateSkincareProduct(id, updates);
      set((state) => ({
        skincareProducts: state.skincareProducts.map((p) => (p.id === id ? updated : p)),
      }));
      logger.info('SkincareSlice', 'Skincare product updated', { id });
      return updated;
    } catch (error) {
      logger.error('SkincareSlice', 'Operation failed', { error, context: 'updateSkincareProduct', id });
      throw error;
    }
  },

  // Delete a skincare product
  deleteSkincareProduct: async (id): Promise<void> => {
    try {
      await apiDeleteSkincareProduct(id);
      set((state) => ({
        skincareProducts: state.skincareProducts.filter((p) => p.id !== id),
      }));
      logger.info('SkincareSlice', 'Skincare product deleted', { id });
    } catch (error) {
      logger.error('SkincareSlice', 'Operation failed', { error, context: 'deleteSkincareProduct', id });
      throw error;
    }
  },

  // Load skin condition logs
  loadSkinConditionLogs: async (filters): Promise<void> => {
    try {
      const logs = await getSkinConditionLogs(filters);
      set({ skinConditionLogs: logs });
      logger.info('SkincareSlice', 'Skin condition logs loaded', { count: logs.length });
    } catch (error) {
      logger.error('SkincareSlice', 'Operation failed', { error, context: 'loadSkinConditionLogs' });
      throw error;
    }
  },

  // Add a skin condition log
  addSkinConditionLog: async (log): Promise<SkinConditionLog> => {
    try {
      const created = await apiCreateSkinConditionLog(log);
      set((state) => ({ skinConditionLogs: [created, ...state.skinConditionLogs] }));
      logger.info('SkincareSlice', 'Skin condition log created', { id: created.id, date: created.date });
      return created;
    } catch (error) {
      logger.error('SkincareSlice', 'Operation failed', { error, context: 'addSkinConditionLog' });
      throw error;
    }
  },

  // Get skincare stats
  getSkincareStats: async () => {
    try {
      const stats = await getSkincareStats();
      logger.info('SkincareSlice', 'Skincare stats retrieved', stats);
      return stats;
    } catch (error) {
      logger.error('SkincareSlice', 'Operation failed', { error, context: 'getSkincareStats' });
      throw error;
    }
  },

  // Get skincare product by ID
  getSkincareProductById: (id) => get().skincareProducts.find((p) => p.id === id),
});
