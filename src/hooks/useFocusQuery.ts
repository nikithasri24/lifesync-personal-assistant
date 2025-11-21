import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export function useFocusSessions() {
  return useQuery({
    queryKey: focusKeys.sessions(),
    queryFn: getFocusSessions,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateFocusSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: Omit<FocusSessionData, 'id' | 'created_at' | 'updated_at'>) => {
      logger.debug('Creating focus session', { type: session.session_type, duration: session.planned_duration });
      const result = await createFocusSession(session);
      return result;
    },
    onSuccess: (newSession) => {
      logger.info('Focus session created successfully', { id: newSession.id, type: newSession.session_type });
      queryClient.setQueryData<FocusSessionData[]>(focusKeys.sessions(), (old) => {
        if (!old) return [newSession];
        return [...old, newSession];
      });
    },
    onError: (error: Error, session) => {
      logger.error('Failed to create focus session', { error: error.message, type: session.session_type });
    },
  });
}

export function useUpdateFocusSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FocusSessionData> }) => {
      logger.debug('Updating focus session', { id, updates });
      const result = await updateFocusSession(id, updates);
      return result;
    },
    onMutate: async ({ id, updates }) => {
      logger.debug('Optimistic update: focus session', { id, updates });
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
      logger.error('Failed to update focus session', { error: err.message, id });
      // Rollback on error
      if (context?.previousSessions) {
        queryClient.setQueryData(focusKeys.sessions(), context.previousSessions);
      }
    },
    onSuccess: (updatedSession, { id }) => {
      logger.info('Focus session updated successfully', { id, status: updatedSession.status });
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
export function useActiveFocusSession() {
  const { data: sessions, isLoading } = useFocusSessions();

  const activeSession = sessions?.find(
    (session) => session.status === 'active' || session.status === 'paused'
  );

  return {
    activeSession,
    isLoading,
  };
}
