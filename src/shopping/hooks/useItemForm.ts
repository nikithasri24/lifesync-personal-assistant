import { useState } from 'react';
import type { ShoppingItemForm } from '../types/forms';

const createInitialFormState = (): ShoppingItemForm => ({
  name: '',
  quantity: 1,
  unit: 'pcs',
  category: 'other',
  priority: 'medium',
  estimatedPrice: '',
  brand: '',
  notes: '',
  preferredStore: ''
});

/**
 * Custom hook for managing shopping item form state
 * Consolidates newItem and editItem state management
 */
export function useItemForm() {
  const [formData, setFormData] = useState<ShoppingItemForm>(createInitialFormState());

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setFormData(createInitialFormState());
  };

  /**
   * Update form with partial data
   */
  const updateForm = (updates: Partial<ShoppingItemForm>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  /**
   * Load existing item data into form
   */
  const loadItem = (item: Partial<ShoppingItemForm>) => {
    setFormData({
      name: item.name || '',
      quantity: item.quantity || 1,
      unit: item.unit || 'pcs',
      category: item.category || 'other',
      priority: item.priority || 'medium',
      estimatedPrice: item.estimatedPrice?.toString() || '',
      brand: item.brand || '',
      notes: item.notes || '',
      preferredStore: item.preferredStore || ''
    });
  };

  return {
    formData,
    setFormData,
    updateForm,
    loadItem,
    resetForm,
  };
}
