import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Hook to get current user ID from Supabase auth
 */
export function useCurrentUserId() {
  return useQuery({
    queryKey: ['currentUserId'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id ?? null;
    },
    staleTime: Infinity, // User ID never changes during session
    gcTime: Infinity,
  });
}

/**
 * Hook to get partner's name from merged connection
 */
export function usePartnerName(mergedConnection: { partnerName?: string } | null | undefined) {
  return useMemo(() => {
    return mergedConnection?.partnerName ?? 'Partner';
  }, [mergedConnection]);
}

/**
 * Check if merged mode is enabled (has active connection)
 */
export function useHasMergedPermission(mergedConnection: any) {
  return useMemo(() => {
    return !!mergedConnection?.connectionId;
  }, [mergedConnection]);
}
