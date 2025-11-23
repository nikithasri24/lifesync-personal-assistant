import { useState, useMemo } from 'react';
import { differenceInCalendarDays } from 'date-fns';

export type PantryFilter = 'all' | 'expired' | 'soon' | 'low';
export type PantrySort = 'expiry' | 'name';

interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  expirationDate?: Date;
  isLowStock?: boolean;
  lowStockThreshold?: number;
  [key: string]: any;
}

export function usePantryManagement(pantryItems: PantryItem[]) {
  const [pantryFilter, setPantryFilter] = useState<PantryFilter>('all');
  const [pantrySort, setPantrySort] = useState<PantrySort>('expiry');
  const [editingPantryId, setEditingPantryId] = useState<string | null>(null);
  const [editPantry, setEditPantry] = useState<{
    qty: string;
    unit: string;
    exp: string;
    low: boolean;
    threshold: string;
  }>({ qty: '0', unit: '', exp: '', low: false, threshold: '' });
  const [replenishId, setReplenishId] = useState<string | null>(null);

  /**
   * Get filtered and sorted pantry items based on current filter and sort settings
   */
  const pantrySortedFiltered = useMemo(() => {
    let items = [...pantryItems];
    const now = new Date();

    // Apply filter
    if (pantryFilter === 'expired') {
      items = items.filter(p => p.expirationDate && p.expirationDate.getTime() < now.getTime());
    }
    if (pantryFilter === 'soon') {
      items = items.filter(p => {
        if (!p.expirationDate) return false;
        const days = differenceInCalendarDays(p.expirationDate, now);
        return days <= 7 && days >= 0;
      });
    }
    if (pantryFilter === 'low') {
      items = items.filter(p => p.isLowStock);
    }

    // Apply sort
    if (pantrySort === 'expiry') {
      items.sort((a, b) => {
        const ax = a.expirationDate ? a.expirationDate.getTime() : Infinity;
        const bx = b.expirationDate ? b.expirationDate.getTime() : Infinity;
        return ax - bx;
      });
    }
    if (pantrySort === 'name') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return items;
  }, [pantryItems, pantryFilter, pantrySort]);

  /**
   * Start editing a pantry item
   */
  const startEditingPantry = (item: PantryItem) => {
    setEditingPantryId(item.id);
    setEditPantry({
      qty: String(item.quantity),
      unit: item.unit || '',
      exp: item.expirationDate ? item.expirationDate.toISOString().split('T')[0] : '',
      low: !!item.isLowStock,
      threshold: item.lowStockThreshold ? String(item.lowStockThreshold) : ''
    });
  };

  /**
   * Cancel editing
   */
  const cancelEditing = () => {
    setEditingPantryId(null);
  };

  /**
   * Start replenishing a pantry item
   */
  const startReplenish = (itemId: string) => {
    setReplenishId(itemId);
  };

  /**
   * Cancel replenish
   */
  const cancelReplenish = () => {
    setReplenishId(null);
  };

  return {
    // Filter and sort state
    pantryFilter,
    setPantryFilter,
    pantrySort,
    setPantrySort,

    // Editing state
    editingPantryId,
    editPantry,
    setEditPantry,
    startEditingPantry,
    cancelEditing,

    // Replenish state
    replenishId,
    startReplenish,
    cancelReplenish,

    // Computed values
    pantrySortedFiltered,
  };
}
