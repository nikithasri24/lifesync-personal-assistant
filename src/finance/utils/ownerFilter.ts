/**
 * Owner Filter Utilities
 * Helper functions for filtering data by ownership in merged mode
 */

import type { OwnerFilterValue } from '../components/OwnerFilter';

interface ItemWithUserId {
  userId: string;
}

/**
 * Filter items by owner
 * @param items - Array of items with userId property
 * @param filterValue - 'all' | 'mine' | 'partner'
 * @param currentUserId - Current user's ID
 * @returns Filtered array
 */
export function filterByOwner<T extends ItemWithUserId>(
  items: T[],
  filterValue: OwnerFilterValue,
  currentUserId?: string
): T[] {
  if (!currentUserId || filterValue === 'all') {
    return items;
  }

  if (filterValue === 'mine') {
    return items.filter(item => item.userId === currentUserId);
  }

  if (filterValue === 'partner') {
    return items.filter(item => item.userId !== currentUserId);
  }

  return items;
}

/**
 * Get count of items by owner
 * @param items - Array of items with userId property
 * @param currentUserId - Current user's ID
 * @returns Object with counts for mine, partner, and all
 */
export function getOwnerCounts<T extends ItemWithUserId>(
  items: T[],
  currentUserId?: string
): { mine: number; partner: number; all: number } {
  if (!currentUserId) {
    return { mine: 0, partner: 0, all: items.length };
  }

  const mine = items.filter(item => item.userId === currentUserId).length;
  const partner = items.filter(item => item.userId !== currentUserId).length;

  return {
    mine,
    partner,
    all: items.length,
  };
}

