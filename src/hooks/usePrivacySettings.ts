/**
 * React Query hooks for Privacy Settings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPrivacyPreferences, updatePrivacyPreferences, type PrivacyPreferences } from '@/api/privacySettingsAPI';
import { logger } from '@/services/logger';

/**
 * Query key for privacy settings
 */
export const privacySettingsKeys = {
  all: ['privacy-settings'] as const,
  preferences: () => [...privacySettingsKeys.all, 'preferences'] as const,
};

/**
 * Hook to get user's privacy preferences
 */
export function usePrivacyPreferences() {
  return useQuery({
    queryKey: privacySettingsKeys.preferences(),
    queryFn: getPrivacyPreferences,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to update privacy preferences
 */
export function useUpdatePrivacyPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: PrivacyPreferences) => updatePrivacyPreferences(preferences),
    onMutate: async (newPreferences) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: privacySettingsKeys.preferences() });

      // Snapshot previous value
      const previousPreferences = queryClient.getQueryData<PrivacyPreferences>(
        privacySettingsKeys.preferences()
      );

      // Optimistically update
      queryClient.setQueryData<PrivacyPreferences>(
        privacySettingsKeys.preferences(),
        newPreferences
      );

      return { previousPreferences };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousPreferences) {
        queryClient.setQueryData<PrivacyPreferences>(
          privacySettingsKeys.preferences(),
          context.previousPreferences
        );
      }
      logger.error('useUpdatePrivacyPreferences', error as Error, { context: 'mutation' });
    },
    onSuccess: () => {
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: privacySettingsKeys.preferences() });
    },
  });
}

