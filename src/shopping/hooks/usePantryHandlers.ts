/**
 * Custom hook for handling pantry operations
 * Extracts pantry-related callbacks from the main component
 */

import { useCallback } from 'react';
import type { UseShoppingMutationsReturn } from './useShoppingMutations';

export interface PantryItemInput {
  name: string;
  quantity: number;
  category: string;
  threshold?: string;
}

export interface UsePantryHandlersParams {
  createPantryItem: UseShoppingMutationsReturn['createPantryItem'];
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export interface UsePantryHandlersReturn {
  handleAddPantryItem: (item: any) => Promise<void>;
  handleAddToPantry: (items: PantryItemInput[]) => Promise<void>;
  handleLogExpense: (_amount: number, _merchant: string) => Promise<void>;
}

/**
 * Hook that provides pantry operation handlers
 */
export function usePantryHandlers(params: UsePantryHandlersParams): UsePantryHandlersReturn {
  const { createPantryItem, showToast } = params;

  const handleAddPantryItem = useCallback(async (item: any): Promise<void> => {
    await createPantryItem.mutateAsync({
      ...item,
      createdAt: new Date()
    });
  }, [createPantryItem]);

  const handleAddToPantry = useCallback(async (items: PantryItemInput[]): Promise<void> => {
    for (const it of items) {
      const thresholdNum = it.threshold ? Number(it.threshold) : undefined;
      const validPantryCategories = ['produce', 'dairy', 'meat', 'pantry', 'other'] as const;
      const pantryCategory = validPantryCategories.includes(it.category as any)
        ? (it.category as 'produce' | 'dairy' | 'meat' | 'pantry' | 'other')
        : 'other';

      await createPantryItem.mutateAsync({
        name: it.name,
        quantity: it.quantity,
        category: pantryCategory,
        lowStockThreshold: thresholdNum,
        isLowStock: thresholdNum != null ? it.quantity <= thresholdNum : undefined,
        createdAt: new Date()
      });
    }
    showToast(`Added ${items.length} items to pantry`, 'success');
  }, [createPantryItem, showToast]);

  const handleLogExpense = useCallback(async (_amount: number, _merchant: string): Promise<void> => {
    showToast('Financial integration not available', 'info');
  }, [showToast]);

  return {
    handleAddPantryItem,
    handleAddToPantry,
    handleLogExpense,
  };
}
