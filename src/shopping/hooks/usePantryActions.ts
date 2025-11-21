import type { PantryItem, ShoppingItem } from '../types';
import { createShoppingItemFromPantry } from '../utils/pantryUtils';

/**
 * Custom hook for pantry bulk actions
 */
export function usePantryActions(
  pantryItems: PantryItem[],
  addShoppingItem: (item: Partial<ShoppingItem>) => Promise<void>
) {
  /**
   * Add all low-stock pantry items to the shopping list
   */
  const addLowStockToShopping = async () => {
    const lows = pantryItems.filter(p => p.isLowStock && (p.lowStockThreshold ?? 0) > 0);

    for (const p of lows) {
      const target = p.lowStockThreshold ?? 0;
      const need = Math.max(0, target - (p.quantity || 0)) || 1;
      const item = createShoppingItemFromPantry(p, need);
      await addShoppingItem({ ...item, tags: ['from:pantry'] });
    }

    return lows.length;
  };

  /**
   * Move all expired pantry items to the shopping list
   */
  const addExpiredToShopping = async () => {
    const now = new Date();
    const expired = pantryItems.filter(p => p.expirationDate && p.expirationDate.getTime() < now.getTime());

    for (const p of expired) {
      const qty = p.quantity && p.quantity > 0 ? p.quantity : 1;
      const item = createShoppingItemFromPantry(p, qty);
      await addShoppingItem({ ...item, tags: ['from:pantry', 'reason:expired'] });
    }

    return expired.length;
  };

  return {
    addLowStockToShopping,
    addExpiredToShopping,
  };
}
