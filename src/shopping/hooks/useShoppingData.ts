/**
 * Custom hook for managing shopping data with owner information
 * Handles data fetching and transformation for shopping items and pantry items
 */

import { useMemo } from 'react';
import { mapShoppingItemDataToModel } from '../services/shoppingMappers';
import { useActiveShoppingList, useShoppingItems } from '@/hooks/useShoppingQuery';
import { usePantryItemsQuery, type PantryItem as PantryItemType } from '@/hooks/useMealPlanningQuery';
import { useCurrentUserId, usePartnerName, useHasMergedPermission } from '@/hooks/useOwnerInfo';
import type { ShoppingItem } from '../types';

export interface ShoppingItemWithOwner extends ShoppingItem {
  ownerId?: string;
  ownerName?: string;
  isOwnedByCurrentUser?: boolean;
}

export interface PantryItemWithOwner extends PantryItemType {
  ownerId?: string;
  ownerName?: string;
  isOwnedByCurrentUser?: boolean;
}

export interface UseShoppingDataReturn {
  // Shopping items
  shoppingItems: ShoppingItemWithOwner[];
  isLoadingItems: boolean;

  // Pantry items
  pantryItems: PantryItemWithOwner[];
  isLoadingPantry: boolean;

  // List management
  activeListId: string | null;
  isLoadingList: boolean;
  ensureActiveList: ReturnType<typeof useActiveShoppingList>['ensureActiveList'];
}

/**
 * Hook that provides shopping and pantry data with owner information
 * for merged mode support
 */
export function useShoppingData(): UseShoppingDataReturn {
  // Shopping list and items
  const { activeListId, isLoading: isLoadingList, ensureActiveList } = useActiveShoppingList();
  const { data: shoppingItemsData, isLoading: isLoadingItems } = useShoppingItems(activeListId);

  // Pantry items
  const { data: pantryItemsRaw = [], isLoading: isLoadingPantry } = usePantryItemsQuery();

  // Owner info for merged mode
  const { data: currentUserId } = useCurrentUserId();
  const { data: partnerName } = usePartnerName();
  const { data: isMerged } = useHasMergedPermission();

  // Transform shopping items with owner information
  const shoppingItems = useMemo(() => {
    if (!shoppingItemsData) return [];
    const mappedItems = mapShoppingItemDataToModel(shoppingItemsData);

    // Add owner information if in merged mode
    if (!currentUserId || !isMerged) {
      return mappedItems;
    }

    return mappedItems.map(item => ({
      ...item,
      ownerName: item.ownerId === currentUserId ? 'Me' : (partnerName || 'Partner'),
      isOwnedByCurrentUser: item.ownerId === currentUserId,
    }));
  }, [shoppingItemsData, currentUserId, partnerName, isMerged]);

  // Transform pantry items with owner information
  const pantryItems = useMemo(() => {
    if (!currentUserId || !isMerged) {
      return pantryItemsRaw;
    }

    return pantryItemsRaw.map(item => ({
      ...item,
      ownerId: item.user_id,
      ownerName: item.user_id === currentUserId ? 'Me' : (partnerName || 'Partner'),
      isOwnedByCurrentUser: item.user_id === currentUserId,
    }));
  }, [pantryItemsRaw, currentUserId, partnerName, isMerged]);

  return {
    shoppingItems,
    isLoadingItems,
    pantryItems,
    isLoadingPantry,
    activeListId,
    isLoadingList,
    ensureActiveList,
  };
}
