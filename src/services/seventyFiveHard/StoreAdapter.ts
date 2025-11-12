/**
 * Store Adapter
 *
 * Bridges the new clean architecture service layer to the existing Zustand store.
 * Allows gradual migration by maintaining backward compatibility.
 *
 * Pattern:
 * 1. Call new service layer (validates, applies business logic, persists)
 * 2. Sync result back to old store (for components still using it)
 * 3. Return Result type to caller
 */

import type {
  SeventyFiveHardChallenge,
  ActiveChallenge,
  PausedChallenge,
  SeventyFiveHardEntry,
  CreateChallengeCommand,
  PauseChallengeCommand,
  ResumeChallengeCommand,
  CompleteDayCommand,
  Result,
  ChallengeId,
} from '../../types/seventyFiveHard';
import {
  ChallengeError,
  isActiveChallenge,
  isPausedChallenge,
} from '../../types/seventyFiveHard';
import type { ChallengeService } from './ChallengeService';

// Type for the existing store (avoid circular dependency)
interface LegacyStore {
  seventyFiveHardChallenges: any[]; // Old format
  updateSeventyFiveHardChallenge?: (id: string, updates: Partial<any>) => void;
  addSeventyFiveHardChallenge?: (challenge: any) => void;
  deleteSeventyFiveHardChallenge?: (id: string) => void;
  updateSeventyFiveHardEntry?: (id: string, updates: Partial<any>) => void;
  ensureSFHTasksForToday?: () => Promise<void>;
  cleanupChallengeTasks?: (challengeId: string) => Promise<void>;
}

export class StoreAdapter {
  private store: LegacyStore;

  constructor(
    private service: ChallengeService,
    initialStore: LegacyStore
  ) {
    this.store = initialStore;
  }

  /**
   * Update store reference (for when store functions change)
   */
  updateStore(store: LegacyStore): void {
    this.store = store;
  }

  /**
   * Create a new challenge
   * - Validates via service layer
   * - Persists to database
   * - Syncs to old store
   */
  async createChallenge(command: CreateChallengeCommand): Promise<Result<ActiveChallenge>> {
    console.log('[StoreAdapter] Creating challenge:', command.name);

    // Use new service layer for validation and business logic
    const result = await this.service.createChallenge(command);

    if (result.ok) {
      // Sync to old store for backward compatibility
      const oldFormat = this.mapNewToOldFormat(result.value);
      this.store.addSeventyFiveHardChallenge?.(oldFormat);

      console.log('[StoreAdapter] Challenge created and synced to store');
    } else {
      console.error('[StoreAdapter] Failed to create challenge:', result.error);
    }

    return result;
  }

  /**
   * Pause an active challenge
   */
  async pauseChallenge(command: PauseChallengeCommand): Promise<Result<PausedChallenge>> {
    console.log('[StoreAdapter] Pausing challenge:', command.challengeId);

    const result = await this.service.pauseChallenge(command);

    if (result.ok) {
      // Sync to old store
      const updates = {
        isActive: false,
        pausedAt: result.value.pausedAt,
        totalPauseDuration: result.value.totalPauseDuration,
        pauseCount: result.value.pauseCount,
        currentDay: result.value.currentDay, // Explicitly preserve
      };
      this.store.updateSeventyFiveHardChallenge?.(command.challengeId, updates);

      // Clean up tasks for paused challenge
      await this.store.cleanupChallengeTasks?.(command.challengeId);

      console.log('[StoreAdapter] Challenge paused and synced to store');
    } else {
      console.error('[StoreAdapter] Failed to pause challenge:', result.error);
    }

    return result;
  }

  /**
   * Resume a paused challenge
   */
  async resumeChallenge(command: ResumeChallengeCommand): Promise<Result<ActiveChallenge>> {
    console.log('[StoreAdapter] Resuming challenge:', command.challengeId);

    const result = await this.service.resumeChallenge(command);

    if (result.ok) {
      // Sync to old store
      const updates = {
        isActive: true,
        pausedAt: undefined,
        resumedAt: command.resumedAt,
        startDate: result.value.startDate,
        endDate: result.value.endDate,
        currentDay: result.value.currentDay, // Explicitly preserve
      };
      this.store.updateSeventyFiveHardChallenge?.(command.challengeId, updates);

      // Create tasks for resumed challenge
      await this.store.ensureSFHTasksForToday?.();

      console.log('[StoreAdapter] Challenge resumed and synced to store');
    } else {
      console.error('[StoreAdapter] Failed to resume challenge:', result.error);
    }

    return result;
  }

  /**
   * Complete a day's tasks
   */
  async completeDay(command: CompleteDayCommand): Promise<Result<SeventyFiveHardEntry>> {
    console.log('[StoreAdapter] Completing day:', command.date);

    const result = await this.service.completeDay(command);

    if (result.ok) {
      // Sync entry to old store
      const oldFormatEntry = this.mapEntryToOldFormat(result.value);

      // Check if entry exists, update or add
      const challenge = this.store.seventyFiveHardChallenges.find(
        c => c.id === command.challengeId
      );

      if (challenge) {
        const existingEntry = challenge.dailyEntries?.find(
          (e: any) => e.day === result.value.day
        );

        if (existingEntry) {
          this.store.updateSeventyFiveHardEntry?.(existingEntry.id, oldFormatEntry);
        } else {
          // Add new entry (this would need a new method in store)
          // For now, we'll update the challenge to include the new entry
          const updatedEntries = [...(challenge.dailyEntries || []), oldFormatEntry];
          this.store.updateSeventyFiveHardChallenge?.(command.challengeId, {
            dailyEntries: updatedEntries,
          });
        }
      }

      console.log('[StoreAdapter] Day completed and synced to store');
    } else {
      console.error('[StoreAdapter] Failed to complete day:', result.error);
    }

    return result;
  }

  /**
   * Delete a challenge
   */
  async deleteChallenge(challengeId: ChallengeId): Promise<Result<void>> {
    console.log('[StoreAdapter] Deleting challenge:', challengeId);

    // Call repository directly (service doesn't have delete method yet)
    // This would need to be added to the service layer
    // For now, just sync to store
    this.store.deleteSeventyFiveHardChallenge?.(challengeId);

    console.log('[StoreAdapter] Challenge deleted from store');

    return { ok: true, value: undefined };
  }

  // ==================== Mapping Helpers ====================

  /**
   * Map new discriminated union format to old format
   */
  private mapNewToOldFormat(challenge: SeventyFiveHardChallenge): any {
    const base = {
      id: challenge.id,
      name: challenge.name,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      currentDay: challenge.currentDay,
      rules: challenge.rules,
      dailyEntries: challenge.dailyEntries || [],
      notes: challenge.notes,
      createdAt: challenge.createdAt,
      isActive: challenge.status === 'active',
    };

    // Add status-specific fields
    if (isPausedChallenge(challenge)) {
      return {
        ...base,
        pausedAt: challenge.pausedAt,
        totalPauseDuration: challenge.totalPauseDuration,
        pauseCount: challenge.pauseCount,
        resumedAt: challenge.resumedAt,
      };
    }

    if (challenge.status === 'completed') {
      return {
        ...base,
        completedAt: challenge.completedAt,
      };
    }

    if (challenge.status === 'failed') {
      return {
        ...base,
        failedAt: challenge.failedAt,
        failureReason: challenge.failureReason,
      };
    }

    return base;
  }

  /**
   * Map new entry format to old format
   */
  private mapEntryToOldFormat(entry: SeventyFiveHardEntry): any {
    return {
      id: entry.id,
      challengeId: entry.challengeId,
      date: entry.date,
      day: entry.day,
      ruleCompletions: entry.ruleCompletions,
      notes: entry.notes,
      progressPhotoUrl: entry.progressPhotoUrl,
      weight: entry.weight,
      measurements: entry.measurements,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  /**
   * Map old format to new format (for reading from store)
   */
  mapOldToNewFormat(oldChallenge: any): SeventyFiveHardChallenge {
    const base = {
      id: oldChallenge.id,
      name: oldChallenge.name,
      startDate: new Date(oldChallenge.startDate),
      endDate: new Date(oldChallenge.endDate),
      currentDay: oldChallenge.currentDay,
      rules: oldChallenge.rules || [],
      dailyEntries: oldChallenge.dailyEntries || [],
      notes: oldChallenge.notes,
      createdAt: new Date(oldChallenge.createdAt || Date.now()),
      updatedAt: new Date(oldChallenge.updatedAt || Date.now()),
    };

    // Determine status based on old format fields
    if (oldChallenge.completedAt) {
      return {
        ...base,
        status: 'completed',
        isActive: false,
        completedAt: new Date(oldChallenge.completedAt),
      };
    }

    if (oldChallenge.failedAt) {
      return {
        ...base,
        status: 'failed',
        isActive: false,
        failedAt: new Date(oldChallenge.failedAt),
        failureReason: oldChallenge.failureReason,
      };
    }

    if (oldChallenge.pausedAt && !oldChallenge.isActive) {
      return {
        ...base,
        status: 'paused',
        isActive: false,
        pausedAt: new Date(oldChallenge.pausedAt),
        totalPauseDuration: oldChallenge.totalPauseDuration || 0,
        pauseCount: oldChallenge.pauseCount || 1,
        resumedAt: oldChallenge.resumedAt ? new Date(oldChallenge.resumedAt) : undefined,
      };
    }

    // Default to active
    return {
      ...base,
      status: 'active',
      isActive: true,
    };
  }
}

/**
 * Helper to create error message from Result
 */
export function getErrorMessage(result: Result<any>): string {
  if (result.ok) return '';

  const error = result.error as ChallengeError;

  if (error.details && Array.isArray(error.details)) {
    // Validation errors
    return error.details
      .map((e: any) => `${e.field}: ${e.message}`)
      .join(', ');
  }

  return error.message;
}
