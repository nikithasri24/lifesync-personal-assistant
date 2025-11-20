/**
 * Shopping Store Slice
 *
 * Manages shopping list items state and actions.
 * Extracted from useRealAppStore to improve maintainability.
 */

import { StateCreator } from 'zustand';
import { apiClient } from '../../services/apiClient';
import { isSupabaseConfigured } from '../../lib/supabase';

const createId = () => Math.random().toString(36).substring(2, 15);

// Helper types
type ShoppingItemData = Awaited<ReturnType<typeof apiClient.getShoppingListItems>>[number];

// Shopping category and priority types
type ShoppingCategory =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'bakery'
  | 'pantry'
  | 'frozen'
  | 'beverages'
  | 'snacks'
  | 'household'
  | 'personal_care'
  | 'health'
  | 'baby'
  | 'pet'
  | 'electronics'
  | 'other';

interface ShoppingItem {
  id: string;
  shoppingListId: string;
  name: string;
  quantity?: number;
  unit?: string;
  category: ShoppingCategory;
  subcategory?: string;
  priority: 'low' | 'medium' | 'high';
  purchased: boolean;
  estimatedPrice?: number;
  actualPrice?: number;
  notes?: string;
  recipeId?: string;
  aisle?: string;
  brand?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to sanitize objects
const sanitize = (obj: any) => {
  const clean: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) clean[k] = v;
  }
  return clean;
};

// Helper: Map ShoppingItemData to ShoppingItem
const mapShoppingItemDataToShoppingItem = (item: ShoppingItemData): ShoppingItem => ({
  id: item.id ?? createId(),
  shoppingListId: item.shopping_list_id ?? 'unknown',
  name: item.name,
  quantity: item.quantity ?? undefined,
  unit: item.unit ?? undefined,
  category: (item.category ?? 'other') as ShoppingCategory,
  subcategory: item.subcategory ?? undefined,
  priority: (item.priority as ShoppingItem['priority']) ?? 'medium',
  purchased: item.is_purchased ?? false,
  estimatedPrice: item.estimated_price !== undefined ? Number(item.estimated_price) : undefined,
  actualPrice: item.actual_price !== undefined ? Number(item.actual_price) : undefined,
  notes: item.notes ?? undefined,
  recipeId: item.recipe_id ?? undefined,
  aisle: item.aisle ?? undefined,
  brand: item.brand ?? undefined,
  createdAt: item.created_at ? new Date(item.created_at) : new Date(),
  updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
});

// Helper: Build shopping item insert payload
const buildShoppingItemInsertPayload = (
  listId: string,
  item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt' | 'shoppingListId'>
): Omit<ShoppingItemData, 'id' | 'created_at' | 'updated_at'> =>
  sanitize({
    shopping_list_id: listId,
    name: item.name,
    quantity: item.quantity ?? null,
    unit: item.unit ?? null,
    category: item.category ?? 'other',
    subcategory: item.subcategory ?? null,
    priority: item.priority ?? 'medium',
    estimated_price: item.estimatedPrice ?? null,
    actual_price: item.actualPrice ?? null,
    notes: item.notes ?? null,
    recipe_id: item.recipeId ?? null,
    aisle: item.aisle ?? null,
    brand: item.brand ?? null,
    is_purchased: item.purchased ?? false,
  });

// Helper: Build shopping item update payload
const buildShoppingItemUpdatePayload = (
  updates: Partial<ShoppingItem>
): Partial<ShoppingItemData> =>
  sanitize({
    name: updates.name,
    quantity: updates.quantity,
    unit: updates.unit,
    category: updates.category,
    subcategory: updates.subcategory,
    priority: updates.priority,
    estimated_price: updates.estimatedPrice,
    actual_price: updates.actualPrice,
    notes: updates.notes,
    recipe_id: updates.recipeId,
    aisle: updates.aisle,
    brand: updates.brand,
    is_purchased: updates.purchased,
  });

// State interface
export interface ShoppingSlice {
  // State
  shoppingItems: ShoppingItem[];
  activeShoppingListId: string | null;
  shoppingLoading: boolean;

  // Actions
  addShoppingItem: (
    item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt' | 'shoppingListId'>
  ) => Promise<ShoppingItem>;
  updateShoppingItem: (id: string, updates: Partial<ShoppingItem>) => Promise<void>;
  deleteShoppingItem: (id: string) => Promise<void>;
  toggleShoppingItem: (id: string) => Promise<void>;

  // Internal setters
  _setShoppingItems: (shoppingItems: ShoppingItem[]) => void;
  _setActiveShoppingListId: (id: string | null) => void;
}

// Create the slice
export const createShoppingSlice: StateCreator<ShoppingSlice> = (set, get) => ({
  // Initial state
  shoppingItems: [],
  activeShoppingListId: null,
  shoppingLoading: false,

  // Internal setters (used by initializeData)
  _setShoppingItems: (shoppingItems) => set({ shoppingItems }),
  _setActiveShoppingListId: (id) => set({ activeShoppingListId: id }),

  // ==================== Shopping ====================

  addShoppingItem: async (itemInput) => {
    if (!isSupabaseConfigured) {
      const shoppingListId = get().activeShoppingListId ?? createId();
      const item: ShoppingItem = {
        ...itemInput,
        id: createId(),
        shoppingListId,
        purchased: itemInput.purchased ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      set((state) => ({ shoppingItems: [...state.shoppingItems, item] }));
      return item;
    }

    try {
      let shoppingListId = get().activeShoppingListId;
      if (!shoppingListId) {
        const newList = await apiClient.createShoppingList({
          name: 'Personal List',
          status: 'active',
        });
        shoppingListId = newList.id ?? null;
        set({ activeShoppingListId: shoppingListId });
      }

      if (!shoppingListId) {
        throw new Error('Failed to determine active shopping list for Supabase insert.');
      }

      const payload = buildShoppingItemInsertPayload(shoppingListId, itemInput);
      const created = await apiClient.addShoppingItem(shoppingListId, payload);
      const item = mapShoppingItemDataToShoppingItem(created);
      set((state) => ({ shoppingItems: [...state.shoppingItems, item] }));
      return item;
    } catch (error) {
      console.error('Error adding shopping item:', error);
      throw error;
    }
  },

  updateShoppingItem: async (id, updates) => {
    if (!isSupabaseConfigured) {
      set((state) => ({
        shoppingItems: state.shoppingItems.map((item) =>
          item.id === id
            ? {
                ...item,
                ...updates,
                updatedAt: new Date(),
              }
            : item
        ),
      }));
      return;
    }

    try {
      const payload = buildShoppingItemUpdatePayload(updates);
      const updated = await apiClient.updateShoppingItem(id, payload);
      const item = mapShoppingItemDataToShoppingItem(updated);
      set((state) => ({
        shoppingItems: state.shoppingItems.map((existing) =>
          existing.id === id ? item : existing
        ),
      }));
    } catch (error) {
      console.error('Error updating shopping item:', error);
      throw error;
    }
  },

  deleteShoppingItem: async (id) => {
    if (isSupabaseConfigured) {
      await apiClient.deleteShoppingItem(id);
    }
    set((state) => ({
      shoppingItems: state.shoppingItems.filter((item) => item.id !== id),
    }));
  },

  toggleShoppingItem: async (id) => {
    const current = get().shoppingItems.find((item) => item.id === id);
    if (!current) return;

    const updates: Partial<ShoppingItem> = {
      purchased: !current.purchased,
      updatedAt: new Date(),
    };

    await get().updateShoppingItem(id, updates);
  },
});
