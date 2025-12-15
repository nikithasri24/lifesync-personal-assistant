import type { PantryItem } from './usePantryManagement';
import type { ShoppingItem } from '../types';
import { createShoppingItemFromPantry } from '../utils/pantryUtils';

/**
 * Custom hook for pantry bulk actions
 */
export function usePantryActions(
  pantryItems: PantryItem[],
  addShoppingItem: (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
): {
  addLowStockToShopping: () => Promise<number>;
  addExpiredToShopping: () => Promise<number>;
} {
  /**
   * Add all low-stock pantry items to the shopping list
   */
  const addLowStockToShopping = async (): Promise<number> => {
    const lows: PantryItem[] = pantryItems.filter(
      (p): p is PantryItem & { isLowStock: true; lowStockThreshold: number } =>
        p.isLowStock === true &&
        p.lowStockThreshold !== undefined &&
        p.lowStockThreshold > 0 &&
        p.quantity !== null
    );

    const addItemPromises = lows.map(async (p) => {
      const target = p.lowStockThreshold!;
      const need = Math.max(0, target - p.quantity) || 1;
      const item = createShoppingItemFromPantry(p, need);
      await addShoppingItem({ ...item, tags: ['from:pantry'] });
    });

    await Promise.all(addItemPromises);

    return lows.length;
  };

  /**
   * Move all expired pantry items to the shopping list
   */
  const addExpiredToShopping = async (): Promise<number> => {
    const expired: PantryItem[] = pantryItems.filter(
      (p): p is PantryItem & { expirationDate: Date } =>
        p.expirationDate instanceof Date &&
        p.expirationDate.getTime() < Date.now() &&
        p.quantity !== null
    );

    const addItemPromises = expired.map(async (p) => {
      const qty = p.quantity > 0 ? p.quantity : 1;
      const item = createShoppingItemFromPantry(p, qty);
      await addShoppingItem({ ...item, tags: ['from:pantry', 'reason:expired'] });
    });

    await Promise.all(addItemPromises);

    return expired.length;
  };

  return {
    addLowStockToShopping,
    addExpiredToShopping,
  };
}
