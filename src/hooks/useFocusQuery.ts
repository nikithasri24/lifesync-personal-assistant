import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import {
  getFocusSessions,
  createFocusSession,
  updateFocusSession,
} from '../api/focusAPI';
import type { FocusSessionData } from '../services/types';
import { logger } from '@/services/logger';

// ==================== Query Keys ====================

export const focusKeys = {
  all: ['focus'] as const,
  sessions: () => [...focusKeys.all, 'sessions'] as const,
  session: (id: string) => [...focusKeys.all, 'session', id] as const,
};

// ==================== Focus Sessions ====================

export function useFocusSessions(): UseQueryResult<FocusSessionData[], Error> {
  return useQuery({
    queryKey: focusKeys.sessions(),
    queryFn: getFocusSessions,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateFocusSession(): UseMutationResult<
  FocusSessionData,
  Error,
  Omit<FocusSessionData, 'id' | 'created_at' | 'updated_at'>
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: Omit<FocusSessionData, 'id' | 'created_at' | 'updated_at'>) => {
      logger.debug('Focus', 'Creating focus session', { type: session.type, duration: session.duration_minutes });
      const result = await createFocusSession(session);
      return result;
    },
    onSuccess: (newSession) => {
      logger.info('Focus', 'Focus session created successfully', { id: newSession.id ?? 'unknown', type: newSession.type });
      queryClient.setQueryData<FocusSessionData[]>(focusKeys.sessions(), (old) => {
        if (!old) return [newSession];
        return [...old, newSession];
      });
    },
    onError: (error: Error, session) => {
      logger.error('Focus', 'Failed to create focus session', { error: error.message, type: session.type });
    },
  });
}

export function useUpdateFocusSession(): UseMutationResult<
  FocusSessionData,
  Error,
  { id: string; updates: Partial<FocusSessionData> },
  { previousSessions: FocusSessionData[] | undefined }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FocusSessionData> }) => {
      logger.debug('Focus', 'Updating focus session', { id, updates });
      const result = await updateFocusSession(id, updates);
      return result;
    },
    onMutate: async ({ id, updates }) => {
      logger.debug('Focus', 'Optimistic update: focus session', { id, updates });
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: focusKeys.sessions() });

      // Snapshot the previous value
      const previousSessions = queryClient.getQueryData<FocusSessionData[]>(
        focusKeys.sessions()
      );

      // Optimistically update
      queryClient.setQueryData<FocusSessionData[]>(focusKeys.sessions(), (old) => {
        if (!old) return old;
        return old.map((session) =>
          session.id === id
            ? { ...session, ...updates, updated_at: new Date().toISOString() }
            : session
        );
      });

      return { previousSessions };
    },
    onError: (err: Error, { id }, context) => {
      logger.error('Focus', 'Failed to update focus session', { error: err.message, id });
      // Rollback on error
      if (context?.previousSessions) {
        queryClient.setQueryData(focusKeys.sessions(), context.previousSessions);
      }
    },
    onSuccess: (updatedSession, { id }) => {
      logger.info('Focus', 'Focus session updated successfully', { id, status: updatedSession.status ?? 'unknown' });
      // Update with server response
      queryClient.setQueryData<FocusSessionData[]>(focusKeys.sessions(), (old) => {
        if (!old) return old;
        return old.map((session) => (session.id === id ? updatedSession : session));
      });
    },
  });
}

// ==================== Active Session Helper ====================

/**
 * Hook to get the currently active focus session (if any)
 */
export function useActiveFocusSession(): {
  activeSession: FocusSessionData | undefined;
  isLoading: boolean;
} {
  const { data: sessions, isLoading } = useFocusSessions();

  const activeSession = sessions?.find(
    (session) => session.status === 'in-progress'
  );

  return {
    activeSession,
    isLoading,
  };
}
