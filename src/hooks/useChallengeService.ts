/**
 * React Hook for 75 Hard Challenge Service
 *
 * Provides a clean interface to the new service layer architecture.
 * Sets up all dependencies and event handlers.
 *
 * Usage:
 * ```tsx
 * const { createChallenge, pauseChallenge, completeDay } = useChallengeService();
 *
 * const handleCreate = async () => {
 *   const result = await createChallenge({
 *     name: "Summer 2025",
 *     startDate: new Date(),
 *     rules: DEFAULT_RULES
 *   });
 *
 *   if (result.ok) {
 *     toast.success('Challenge created!');
 *   } else {
 *     toast.error(getErrorMessage(result));
 *   }
 * };
 * ```
 */

import { useMemo, useCallback, useEffect, useState } from 'react';
import { useRealAppStore } from '../stores/useRealAppStore';
import { ensureSupabase } from '../lib/supabase';
import { ChallengeService } from '../services/seventyFiveHard/ChallengeService';
import { SupabaseRepository } from '../services/seventyFiveHard/SupabaseRepository';
import { SupabasePhotoStorage } from '../services/seventyFiveHard/PhotoStorage';
import { EventBus, setupEventHandlers } from '../services/seventyFiveHard/EventBus';
import { StoreAdapter, getErrorMessage } from '../services/seventyFiveHard/StoreAdapter';
import type {
  CreateChallengeCommand,
  PauseChallengeCommand,
  ResumeChallengeCommand,
  CompleteDayCommand,
  Result,
  ActiveChallenge,
  PausedChallenge,
  SeventyFiveHardEntry,
  ChallengeId,
} from '../types/seventyFiveHard';
import type { User } from '@supabase/supabase-js';

/**
 * Hook return type
 */
interface UseChallengeServiceReturn {
  // Service adapter methods
  createChallenge: (command: CreateChallengeCommand) => Promise<Result<ActiveChallenge>>;
  pauseChallenge: (command: PauseChallengeCommand) => Promise<Result<PausedChallenge>>;
  resumeChallenge: (command: ResumeChallengeCommand) => Promise<Result<ActiveChallenge>>;
  completeDay: (command: CompleteDayCommand) => Promise<Result<SeventyFiveHardEntry>>;
  deleteChallenge: (challengeId: ChallengeId) => Promise<Result<void>>;

  // Helper
  getErrorMessage: (result: Result<any>) => string;

  // Loading state (could be added)
  isInitialized: boolean;
}

/**
 * Custom hook for 75 Hard Challenge service layer
 * Fetches user ID from Supabase auth and initializes service
 */
export function useChallengeService(): UseChallengeServiceReturn {
  // Get only the functions we need (not the entire store to avoid re-renders)
  const ensureSFHTasksForToday = useRealAppStore(state => state.ensureSFHTasksForToday);
  const cleanupChallengeTasks = useRealAppStore(state => state.cleanupChallengeTasks);
  const updateSeventyFiveHardChallenge = useRealAppStore(state => state.updateSeventyFiveHardChallenge);
  const addSeventyFiveHardChallenge = useRealAppStore(state => state.addSeventyFiveHardChallenge);
  const deleteSeventyFiveHardChallenge = useRealAppStore(state => state.deleteSeventyFiveHardChallenge);
  const updateSeventyFiveHardEntry = useRealAppStore(state => state.updateSeventyFiveHardEntry);

  // State for user ID (fetched from Supabase auth)
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user ID from Supabase auth on mount
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const supabase = ensureSupabase();
        if (!supabase) {
          console.error('[useChallengeService] Supabase client not available');
          return;
        }

        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.error('[useChallengeService] Failed to get user:', error);
          return;
        }

        if (data?.user?.id) {
          console.log('[useChallengeService] User ID fetched:', data.user.id);
          setUserId(data.user.id);
        } else {
          console.warn('[useChallengeService] No user ID available');
        }
      } catch (error) {
        console.error('[useChallengeService] Error fetching user ID:', error);
      }
    };

    fetchUserId();
  }, []);

  // Initialize service and adapter (memoized) - Only when userId is available
  const adapter = useMemo(() => {
    // Wait for user ID to be fetched
    if (!userId) {
      console.log('[useChallengeService] Waiting for user ID...');
      return null;
    }

    try {
      // Get Supabase client
      const supabase = ensureSupabase();
      if (!supabase) {
        console.error('[useChallengeService] Supabase client not available');
        return null;
      }

      console.log('[useChallengeService] Initializing service with user ID:', userId);

      // Create repository
      const repository = new SupabaseRepository(supabase, userId);

      // Create photo storage (won't check bucket until first upload)
      const photoStorage = new SupabasePhotoStorage(supabase);

      // Create event bus
      const eventBus = new EventBus();

      // Create service
      const service = new ChallengeService(
        repository,
        photoStorage,
        eventBus,
        userId
      );

      // Create adapter with current store functions
      const adapter = new StoreAdapter(service, {
        seventyFiveHardChallenges: [],
        updateSeventyFiveHardChallenge,
        addSeventyFiveHardChallenge,
        deleteSeventyFiveHardChallenge,
        updateSeventyFiveHardEntry,
        ensureSFHTasksForToday,
        cleanupChallengeTasks,
      });

      console.log('[useChallengeService] Service initialized successfully');

      return adapter;
    } catch (error) {
      console.error('[useChallengeService] Failed to initialize service:', error);
      return null;
    }
    // Only recreate if userId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Update store functions when they change (without recreating the entire service)
  useEffect(() => {
    if (adapter) {
      adapter.updateStore({
        seventyFiveHardChallenges: [],
        updateSeventyFiveHardChallenge,
        addSeventyFiveHardChallenge,
        deleteSeventyFiveHardChallenge,
        updateSeventyFiveHardEntry,
        ensureSFHTasksForToday,
        cleanupChallengeTasks,
      });
    }
  }, [
    adapter,
    updateSeventyFiveHardChallenge,
    addSeventyFiveHardChallenge,
    deleteSeventyFiveHardChallenge,
    updateSeventyFiveHardEntry,
    ensureSFHTasksForToday,
    cleanupChallengeTasks,
  ]);

  // Wrapped methods with useCallback for stability
  const createChallenge = useCallback(
    async (command: CreateChallengeCommand) => {
      if (!adapter) {
        return {
          ok: false,
          error: new Error('Service not initialized'),
        } as Result<ActiveChallenge>;
      }
      return adapter.createChallenge(command);
    },
    [adapter]
  );

  const pauseChallenge = useCallback(
    async (command: PauseChallengeCommand) => {
      if (!adapter) {
        return {
          ok: false,
          error: new Error('Service not initialized'),
        } as Result<PausedChallenge>;
      }
      return adapter.pauseChallenge(command);
    },
    [adapter]
  );

  const resumeChallenge = useCallback(
    async (command: ResumeChallengeCommand) => {
      if (!adapter) {
        return {
          ok: false,
          error: new Error('Service not initialized'),
        } as Result<ActiveChallenge>;
      }
      return adapter.resumeChallenge(command);
    },
    [adapter]
  );

  const completeDay = useCallback(
    async (command: CompleteDayCommand) => {
      if (!adapter) {
        return {
          ok: false,
          error: new Error('Service not initialized'),
        } as Result<SeventyFiveHardEntry>;
      }
      return adapter.completeDay(command);
    },
    [adapter]
  );

  const deleteChallenge = useCallback(
    async (challengeId: ChallengeId) => {
      if (!adapter) {
        return {
          ok: false,
          error: new Error('Service not initialized'),
        } as Result<void>;
      }
      return adapter.deleteChallenge(challengeId);
    },
    [adapter]
  );

  return {
    createChallenge,
    pauseChallenge,
    resumeChallenge,
    completeDay,
    deleteChallenge,
    getErrorMessage,
    isInitialized: adapter !== null,
  };
}

/**
 * Standalone helper to get user-friendly error messages
 */
export { getErrorMessage };
