/**
 * Shopping Data Mappers
 * Transform between API data and UI models
 */

import type { ShoppingItem } from '../types';
import type { ShoppingItemData } from '../../services/types';

/**
 * Map React Query shopping item data to UI ShoppingItem model
 */
export function mapShoppingItemDataToModel(items: ShoppingItemData[]): ShoppingItem[] {
  return items.map((item) => ({
    id: item.id ?? '',
    name: item.name,
    quantity: item.quantity ?? 1,
    unit: item.unit ?? undefined,
    category: (item.category as ShoppingItem['category']) ?? 'other',
    subcategory: item.subcategory ?? undefined,
    priority: (item.priority as ShoppingItem['priority']) ?? 'medium',
    purchased: item.is_purchased ?? false,
    estimatedPrice: item.estimated_price !== undefined ? Number(item.estimated_price) : undefined,
    price: item.actual_price !== undefined ? Number(item.actual_price) : undefined,
    tags: item.tags ?? [],
    assignedStore: item.assigned_store ?? undefined,
    bestStores: item.best_stores ?? [],
    notes: item.notes ?? undefined,
    createdAt: new Date(item.created_at ?? Date.now()),
    updatedAt: new Date(item.updated_at ?? Date.now()),
  }));
}

/**
 * Map UI ShoppingItem to API create input
 */
export function mapShoppingItemToCreateInput(item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    name: item.name,
    quantity: item.quantity,
    unit: item.unit ?? null,
    category: item.category ?? null,
    subcategory: item.subcategory ?? null,
    priority: item.priority ?? 'medium',
    estimated_price: item.estimatedPrice ?? null,
    actual_price: item.price ?? null,
    tags: item.tags ?? [],
    assigned_store: item.assignedStore ?? null,
    best_stores: item.bestStores ?? [],
    notes: item.notes ?? null,
    is_purchased: item.purchased ?? false,
  };
}

/**
 * Map UI ShoppingItem updates to API update input
 */
export function mapShoppingItemToUpdateInput(updates: Partial<ShoppingItem>) {
  return {
    name: updates.name,
    quantity: updates.quantity,
    unit: updates.unit,
    category: updates.category,
    subcategory: updates.subcategory,
    priority: updates.priority,
    estimated_price: updates.estimatedPrice,
    actual_price: updates.price,
    tags: updates.tags,
    assigned_store: updates.assignedStore,
    best_stores: updates.bestStores,
    notes: updates.notes,
    is_purchased: updates.purchased,
  };
}
