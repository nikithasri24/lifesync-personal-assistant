/**
 * Shopping Data Mappers
 * Transform between API data and UI models
 */

import type { ShoppingItem } from '../types';
import type { ShoppingItemData } from '../../services/types';

/**
 * Map React Query shopping item data to UI ShoppingItem model
 * Note: Owner information (ownerName, isOwnedByCurrentUser) should be added separately
 * using the addOwnerInfo utility function from shopping/utils/ownerUtils.ts
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
    brand: item.brand ?? undefined,
    aisle: item.aisle ?? undefined,
    barcode: item.barcode ?? undefined,
    imageUrl: item.image_url ?? undefined,
    nutritionInfo: item.nutrition_info as ShoppingItem['nutritionInfo'] | undefined,
    tags: item.tags ?? [],
    assignedStore: item.assigned_store ?? undefined,
    bestStores: item.best_stores ?? [],
    notes: item.notes ?? undefined,
    createdAt: new Date(item.created_at ?? Date.now()),
    updatedAt: new Date(item.updated_at ?? Date.now()),
    // Store raw user_id for owner identification
    ownerId: item.user_id,
  }));
}

/**
 * Map UI ShoppingItem to API create input
 */
export function mapShoppingItemToCreateInput(item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>): Omit<ShoppingItemData, 'id' | 'shopping_list_id' | 'created_at' | 'updated_at'> {
  return {
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    subcategory: item.subcategory,
    priority: item.priority ?? 'medium',
    estimated_price: item.estimatedPrice,
    actual_price: item.price,
    brand: item.brand,
    aisle: item.aisle,
    barcode: item.barcode,
    image_url: item.imageUrl,
    nutrition_info: item.nutritionInfo as Record<string, unknown> | undefined,
    tags: item.tags ?? [],
    assigned_store: item.assignedStore,
    best_stores: item.bestStores ?? [],
    notes: item.notes,
    is_purchased: item.purchased ?? false,
  };
}

/**
 * Map UI ShoppingItem updates to API update input
 */
export function mapShoppingItemToUpdateInput(updates: Partial<ShoppingItem>): Partial<ShoppingItemData> {
  const result: Partial<ShoppingItemData> = {};

  if (updates.name !== undefined) result.name = updates.name;
  if (updates.quantity !== undefined) result.quantity = updates.quantity;
  if (updates.unit !== undefined) result.unit = updates.unit;
  if (updates.category !== undefined) result.category = updates.category;
  if (updates.subcategory !== undefined) result.subcategory = updates.subcategory;
  if (updates.priority !== undefined) result.priority = updates.priority;
  if (updates.estimatedPrice !== undefined) result.estimated_price = updates.estimatedPrice;
  if (updates.price !== undefined) result.actual_price = updates.price;
  if (updates.brand !== undefined) result.brand = updates.brand;
  if (updates.aisle !== undefined) result.aisle = updates.aisle;
  if (updates.barcode !== undefined) result.barcode = updates.barcode;
  if (updates.imageUrl !== undefined) result.image_url = updates.imageUrl;
  if (updates.nutritionInfo !== undefined) result.nutrition_info = updates.nutritionInfo as Record<string, unknown>;
  if (updates.tags !== undefined) result.tags = updates.tags;
  if (updates.assignedStore !== undefined) result.assigned_store = updates.assignedStore;
  if (updates.bestStores !== undefined) result.best_stores = updates.bestStores;
  if (updates.notes !== undefined) result.notes = updates.notes;
  if (updates.purchased !== undefined) result.is_purchased = updates.purchased;

  return result;
}
