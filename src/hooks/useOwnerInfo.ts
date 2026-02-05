/**
 * Owner Information Hook
 * Provides owner information for merged mode data
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getPartnerName, hasMergedPermission } from '@/shopping/utils/ownerUtils';

export interface OwnerInfo {
  ownerId: string;
  ownerName: string;
  isOwnedByCurrentUser: boolean;
}

/**
 * Hook to get current user ID
 */
export function useCurrentUserId() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id ?? null;
    },
    staleTime: Infinity, // User ID doesn't change during session
  });
}

/**
 * Hook to get partner name for merged mode
 */
export function usePartnerName() {
  return useQuery({
    queryKey: ['partnerName'],
    queryFn: getPartnerName,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to check if user has merged permission for shopping
 */
export function useHasMergedPermission() {
  return useQuery({
    queryKey: ['shoppingMergedPermission'],
    queryFn: hasMergedPermission,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to add owner information to items
 */
export function useAddOwnerInfo<T extends { user_id: string }>(items: T[] | undefined) {
  const { data: currentUserId } = useCurrentUserId();
  const { data: partnerName } = usePartnerName();
  const { data: isMerged } = useHasMergedPermission();

  if (!items || !currentUserId || !isMerged) {
    return items;
  }

  return items.map(item => ({
    ...item,
    ownerId: item.user_id,
    ownerName: item.user_id === currentUserId ? 'Me' : (partnerName || 'Partner'),
    isOwnedByCurrentUser: item.user_id === currentUserId,
  }));
}

/**
 * Get owner info for a single item
 */
export function getOwnerInfoForItem(
  item: { user_id: string },
  currentUserId: string | null | undefined,
  partnerName: string | undefined
): OwnerInfo {
  if (!currentUserId) {
    return {
      ownerId: item.user_id,
      ownerName: 'Unknown',
      isOwnedByCurrentUser: false,
    };
  }

  return {
    ownerId: item.user_id,
    ownerName: item.user_id === currentUserId ? 'Me' : (partnerName || 'Partner'),
    isOwnedByCurrentUser: item.user_id === currentUserId,
  };
}

