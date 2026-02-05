/**
 * Custom hook for handling shopping item form submissions
 * Extracts form handling logic from the main component
 */

import { useCallback } from 'react';
import type { ShoppingItem, Store } from '../types';
import type { ShoppingItemForm } from '../types/forms';
import { smartRecommendStores } from '../utils/storeUtils';

export interface UseShoppingFormHandlersParams {
  stores: Store[];
  addShoppingItem: (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateShoppingItem: (itemId: string, updates: Partial<ShoppingItem>) => Promise<ShoppingItem>;
}

export interface UseShoppingFormHandlersReturn {
  handleAddItem: (formData: ShoppingItemForm, barcodeResult: string | null) => void;
  handleUpdateItem: (editingItem: ShoppingItem, formData: ShoppingItemForm) => void;
}

/**
 * Hook that provides form submission handlers for adding and updating shopping items
 */
export function useShoppingFormHandlers(params: UseShoppingFormHandlersParams): UseShoppingFormHandlersReturn {
  const { stores, addShoppingItem, updateShoppingItem } = params;

  // Add item to master list
  const handleAddItem = useCallback((formData: ShoppingItemForm, barcodeResult: string | null): void => {
    if (!formData.name.trim()) return;

    // Use preferred store if specified, otherwise use AI recommendation
    let bestStores: string[];
    if (formData.preferredStore) {
      // Put preferred store first, then add AI recommendations
      const smartRecommendation = smartRecommendStores(stores, formData.name, formData.category);
      bestStores = [formData.preferredStore, ...smartRecommendation.filter(id => id !== formData.preferredStore)];
    } else {
      bestStores = smartRecommendStores(stores, formData.name, formData.category);
    }

    const item = {
      name: formData.name,
      quantity: formData.quantity,
      unit: formData.unit,
      category: formData.category,
      priority: formData.priority,
      purchased: false,
      estimatedPrice: formData.estimatedPrice ? parseFloat(formData.estimatedPrice) : undefined,
      brand: formData.brand !== '' ? formData.brand : undefined,
      notes: formData.notes !== '' ? formData.notes : undefined,
      barcode: barcodeResult ?? undefined,
      bestStores: bestStores,
      assignedStore: formData.preferredStore !== '' ? formData.preferredStore : undefined,
    };

    void addShoppingItem(item);
  }, [stores, addShoppingItem]);

  // Update existing item
  const handleUpdateItem = useCallback((editingItem: ShoppingItem, formData: ShoppingItemForm): void => {
    if (!formData.name.trim()) return;

    // Use preferred store if specified, otherwise use existing recommendations
    let bestStores: string[];
    if (formData.preferredStore) {
      const smartRecommendation = smartRecommendStores(stores, formData.name, formData.category);
      bestStores = [formData.preferredStore, ...smartRecommendation.filter(id => id !== formData.preferredStore)];
    } else {
      bestStores = editingItem.bestStores ?? smartRecommendStores(stores, formData.name, formData.category);
    }

    const updatedData = {
      name: formData.name,
      quantity: formData.quantity,
      unit: formData.unit,
      category: formData.category,
      priority: formData.priority,
      estimatedPrice: formData.estimatedPrice ? parseFloat(formData.estimatedPrice) : undefined,
      brand: formData.brand !== '' ? formData.brand : undefined,
      notes: formData.notes !== '' ? formData.notes : undefined,
      bestStores: bestStores,
      assignedStore: formData.preferredStore !== '' ? formData.preferredStore : undefined,
      updatedAt: new Date()
    };

    void updateShoppingItem(editingItem.id, updatedData);
  }, [stores, updateShoppingItem]);

  return {
    handleAddItem,
    handleUpdateItem,
  };
}
