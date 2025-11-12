/**
 * Supabase Repository Implementation
 *
 * Bridges the clean architecture service layer to the existing Supabase database.
 * Maps between domain types and database types.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type {
  SeventyFiveHardChallenge,
  ActiveChallenge,
  PausedChallenge,
  CompletedChallenge,
  FailedChallenge,
  SeventyFiveHardEntry,
  SeventyFiveHardRule,
  ChallengeId,
  EntryId,
  Result,
} from '../../types/seventyFiveHard';
import {
  ChallengeError,
  createChallengeId,
  createEntryId,
  createRuleId,
  isActiveChallenge,
  isPausedChallenge,
  isCompletedChallenge,
  isFailedChallenge,
} from '../../types/seventyFiveHard';
import type { SFHChallengeData, SFHEntryData } from '../types';
import type { IChallengeRepository } from './ChallengeService';

export class SupabaseRepository implements IChallengeRepository {
  constructor(
    private supabase: SupabaseClient,
    private userId: string
  ) {}

  // ==================== Challenge CRUD ====================

  async create(challenge: SeventyFiveHardChallenge): Promise<Result<SeventyFiveHardChallenge>> {
    try {
      const dbData = this.mapChallengeToDbData(challenge);

      const { data, error } = await this.supabase
        .from('sfh_challenges')
        .insert(dbData)
        .select()
        .single();

      if (error) {
        return {
          ok: false,
          error: new ChallengeError(
            `Failed to create challenge: ${error.message}`,
            'DATABASE_ERROR',
            error
          ),
        };
      }

      const mapped = this.mapDbDataToChallenge(data);
      return { ok: true, value: mapped };
    } catch (error) {
      return {
        ok: false,
        error: new ChallengeError(
          'Unexpected error creating challenge',
          'UNEXPECTED_ERROR',
          error
        ),
      };
    }
  }

  async update(
    id: ChallengeId,
    updates: Partial<SeventyFiveHardChallenge>
  ): Promise<Result<SeventyFiveHardChallenge>> {
    try {
      const dbUpdates = this.mapChallengeToDbData(updates as any);

      const { data, error } = await this.supabase
        .from('sfh_challenges')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', this.userId)
        .select()
        .single();

      if (error) {
        return {
          ok: false,
          error: new ChallengeError(
            `Failed to update challenge: ${error.message}`,
            'DATABASE_ERROR',
            error
          ),
        };
      }

      if (!data) {
        return {
          ok: false,
          error: new ChallengeError('Challenge not found', 'CHALLENGE_NOT_FOUND'),
        };
      }

      const mapped = this.mapDbDataToChallenge(data);
      return { ok: true, value: mapped };
    } catch (error) {
      return {
        ok: false,
        error: new ChallengeError(
          'Unexpected error updating challenge',
          'UNEXPECTED_ERROR',
          error
        ),
      };
    }
  }

  async delete(id: ChallengeId): Promise<Result<void>> {
    try {
      const { error } = await this.supabase
        .from('sfh_challenges')
        .delete()
        .eq('id', id)
        .eq('user_id', this.userId);

      if (error) {
        return {
          ok: false,
          error: new ChallengeError(
            `Failed to delete challenge: ${error.message}`,
            'DATABASE_ERROR',
            error
          ),
        };
      }

      return { ok: true, value: undefined };
    } catch (error) {
      return {
        ok: false,
        error: new ChallengeError(
          'Unexpected error deleting challenge',
          'UNEXPECTED_ERROR',
          error
        ),
      };
    }
  }

  async findById(id: ChallengeId): Promise<Result<SeventyFiveHardChallenge | null>> {
    try {
      const { data, error } = await this.supabase
        .from('sfh_challenges')
        .select('*')
        .eq('id', id)
        .eq('user_id', this.userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return { ok: true, value: null };
        }
        return {
          ok: false,
          error: new ChallengeError(
            `Failed to find challenge: ${error.message}`,
            'DATABASE_ERROR',
            error
          ),
        };
      }

      const mapped = this.mapDbDataToChallenge(data);
      return { ok: true, value: mapped };
    } catch (error) {
      return {
        ok: false,
        error: new ChallengeError(
          'Unexpected error finding challenge',
          'UNEXPECTED_ERROR',
          error
        ),
      };
    }
  }

  async findByUser(userId: string): Promise<Result<SeventyFiveHardChallenge[]>> {
    try {
      const { data, error } = await this.supabase
        .from('sfh_challenges')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return {
          ok: false,
          error: new ChallengeError(
            `Failed to find challenges: ${error.message}`,
            'DATABASE_ERROR',
            error
          ),
        };
      }

      const mapped = data.map(d => this.mapDbDataToChallenge(d));
      return { ok: true, value: mapped };
    } catch (error) {
      return {
        ok: false,
        error: new ChallengeError(
          'Unexpected error finding challenges',
          'UNEXPECTED_ERROR',
          error
        ),
      };
    }
  }

  async findActiveByUser(userId: string): Promise<Result<ActiveChallenge | null>> {
    try {
      const { data, error } = await this.supabase
        .from('sfh_challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return {
          ok: false,
          error: new ChallengeError(
            `Failed to find active challenge: ${error.message}`,
            'DATABASE_ERROR',
            error
          ),
        };
      }

      if (!data) {
        return { ok: true, value: null };
      }

      const mapped = this.mapDbDataToChallenge(data);

      if (!isActiveChallenge(mapped)) {
        return {
          ok: false,
          error: new ChallengeError(
            'Found challenge is not active',
            'INVALID_STATE'
          ),
        };
      }

      return { ok: true, value: mapped };
    } catch (error) {
      return {
        ok: false,
        error: new ChallengeError(
          'Unexpected error finding active challenge',
          'UNEXPECTED_ERROR',
          error
        ),
      };
    }
  }

  // ==================== Entry CRUD ====================

  async createEntry(entry: SeventyFiveHardEntry): Promise<Result<SeventyFiveHardEntry>> {
    try {
      const dbData = this.mapEntryToDbData(entry);

      const { data, error } = await this.supabase
        .from('sfh_entries')
        .insert(dbData)
        .select()
        .single();

      if (error) {
        return {
          ok: false,
          error: new ChallengeError(
            `Failed to create entry: ${error.message}`,
            'DATABASE_ERROR',
            error
          ),
        };
      }

      const mapped = this.mapDbDataToEntry(data);
      return { ok: true, value: mapped };
    } catch (error) {
      return {
        ok: false,
        error: new ChallengeError(
          'Unexpected error creating entry',
          'UNEXPECTED_ERROR',
          error
        ),
      };
    }
  }

  async updateEntry(
    id: EntryId,
    updates: Partial<SeventyFiveHardEntry>
  ): Promise<Result<SeventyFiveHardEntry>> {
    try {
      const dbUpdates = this.mapEntryToDbData(updates as any);

      const { data, error } = await this.supabase
        .from('sfh_entries')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', this.userId)
        .select()
        .single();

      if (error) {
        return {
          ok: false,
          error: new ChallengeError(
            `Failed to update entry: ${error.message}`,
            'DATABASE_ERROR',
            error
          ),
        };
      }

      if (!data) {
        return {
          ok: false,
          error: new ChallengeError('Entry not found', 'ENTRY_NOT_FOUND'),
        };
      }

      const mapped = this.mapDbDataToEntry(data);
      return { ok: true, value: mapped };
    } catch (error) {
      return {
        ok: false,
        error: new ChallengeError(
          'Unexpected error updating entry',
          'UNEXPECTED_ERROR',
          error
        ),
      };
    }
  }

  async findEntriesByChallenge(challengeId: ChallengeId): Promise<Result<SeventyFiveHardEntry[]>> {
    try {
      const { data, error } = await this.supabase
        .from('sfh_entries')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', this.userId)
        .order('day', { ascending: true });

      if (error) {
        return {
          ok: false,
          error: new ChallengeError(
            `Failed to find entries: ${error.message}`,
            'DATABASE_ERROR',
            error
          ),
        };
      }

      const mapped = data.map(d => this.mapDbDataToEntry(d));
      return { ok: true, value: mapped };
    } catch (error) {
      return {
        ok: false,
        error: new ChallengeError(
          'Unexpected error finding entries',
          'UNEXPECTED_ERROR',
          error
        ),
      };
    }
  }

  async findEntryByDay(
    challengeId: ChallengeId,
    day: number
  ): Promise<Result<SeventyFiveHardEntry | null>> {
    try {
      const { data, error } = await this.supabase
        .from('sfh_entries')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', this.userId)
        .eq('day', day)
        .maybeSingle();

      if (error) {
        return {
          ok: false,
          error: new ChallengeError(
            `Failed to find entry: ${error.message}`,
            'DATABASE_ERROR',
            error
          ),
        };
      }

      if (!data) {
        return { ok: true, value: null };
      }

      const mapped = this.mapDbDataToEntry(data);
      return { ok: true, value: mapped };
    } catch (error) {
      return {
        ok: false,
        error: new ChallengeError(
          'Unexpected error finding entry',
          'UNEXPECTED_ERROR',
          error
        ),
      };
    }
  }

  // ==================== Mapping Helpers ====================

  /**
   * Map domain Challenge to database SFHChallengeData
   */
  private mapChallengeToDbData(challenge: Partial<SeventyFiveHardChallenge>): Partial<SFHChallengeData> {
    const data: Partial<SFHChallengeData> = {
      user_id: this.userId,
    };

    if (challenge.id) data.id = challenge.id;
    if (challenge.name) data.name = challenge.name;
    if (challenge.startDate) data.start_date = challenge.startDate.toISOString();
    if (challenge.endDate) data.end_date = challenge.endDate.toISOString();
    if (challenge.currentDay !== undefined) data.current_day = challenge.currentDay;
    if (challenge.rules) data.rules = challenge.rules;
    if (challenge.notes !== undefined) data.notes = challenge.notes;
    if (challenge.createdAt) data.created_at = challenge.createdAt.toISOString();

    // Status-specific fields
    if ('status' in challenge) {
      data.status = challenge.status;
      data.is_active = challenge.status === 'active';
    }

    if ('isActive' in challenge) {
      data.is_active = challenge.isActive;
    }

    // Paused challenge fields
    if (isPausedChallenge(challenge as any)) {
      data.paused_at = challenge.pausedAt?.toISOString();
      data.total_pause_duration = challenge.totalPauseDuration;
      data.pause_count = challenge.pauseCount;
      if (challenge.resumedAt) {
        data.resumed_at = challenge.resumedAt.toISOString();
      }
    }

    // Completed challenge fields
    if (isCompletedChallenge(challenge as any)) {
      data.completed_at = challenge.completedAt?.toISOString();
    }

    // Failed challenge fields
    if (isFailedChallenge(challenge as any)) {
      data.failed_at = challenge.failedAt?.toISOString();
      data.failure_reason = challenge.failureReason;
    }

    return data;
  }

  /**
   * Map database SFHChallengeData to domain Challenge (discriminated union)
   */
  private mapDbDataToChallenge(data: SFHChallengeData): SeventyFiveHardChallenge {
    const baseChallenge = {
      id: createChallengeId(data.id),
      name: data.name,
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      currentDay: data.current_day,
      rules: (data.rules as SeventyFiveHardRule[]).map(r => ({
        ...r,
        id: createRuleId(r.id),
      })),
      dailyEntries: [], // Loaded separately if needed
      notes: data.notes || undefined,
      createdAt: new Date(data.created_at || Date.now()),
      updatedAt: new Date(data.updated_at || Date.now()),
    };

    // Return appropriate discriminated union based on status
    switch (data.status) {
      case 'active':
        return {
          ...baseChallenge,
          status: 'active',
          isActive: true,
        } as ActiveChallenge;

      case 'paused':
        return {
          ...baseChallenge,
          status: 'paused',
          isActive: false,
          pausedAt: data.paused_at ? new Date(data.paused_at) : new Date(),
          totalPauseDuration: data.total_pause_duration || 0,
          pauseCount: data.pause_count || 1,
          resumedAt: data.resumed_at ? new Date(data.resumed_at) : undefined,
        } as PausedChallenge;

      case 'completed':
        return {
          ...baseChallenge,
          status: 'completed',
          isActive: false,
          completedAt: data.completed_at ? new Date(data.completed_at) : new Date(),
        } as CompletedChallenge;

      case 'failed':
        return {
          ...baseChallenge,
          status: 'failed',
          isActive: false,
          failedAt: data.failed_at ? new Date(data.failed_at) : new Date(),
          failureReason: data.failure_reason,
        } as FailedChallenge;

      default:
        // Fallback to active if status is unclear
        return {
          ...baseChallenge,
          status: 'active',
          isActive: true,
        } as ActiveChallenge;
    }
  }

  /**
   * Map domain Entry to database SFHEntryData
   */
  private mapEntryToDbData(entry: Partial<SeventyFiveHardEntry>): Partial<SFHEntryData> {
    const data: Partial<SFHEntryData> = {
      user_id: this.userId,
    };

    if (entry.id) data.id = entry.id;
    if (entry.challengeId) data.challenge_id = entry.challengeId;
    if (entry.date) data.date = entry.date.toISOString().split('T')[0]; // Date only
    if (entry.day !== undefined) data.day = entry.day;
    if (entry.ruleCompletions) data.rule_completions = entry.ruleCompletions;
    if (entry.notes !== undefined) data.notes = entry.notes;
    if (entry.progressPhotoUrl !== undefined) data.progress_photo_url = entry.progressPhotoUrl;
    if (entry.weight !== undefined) data.weight = entry.weight;
    if (entry.measurements !== undefined) data.measurements = entry.measurements;
    if (entry.createdAt) data.created_at = entry.createdAt.toISOString();
    if (entry.updatedAt) data.updated_at = entry.updatedAt.toISOString();

    return data;
  }

  /**
   * Map database SFHEntryData to domain Entry
   */
  private mapDbDataToEntry(data: SFHEntryData): SeventyFiveHardEntry {
    return {
      id: createEntryId(data.id),
      challengeId: createChallengeId(data.challenge_id),
      date: new Date(data.date),
      day: data.day,
      ruleCompletions: data.rule_completions as any,
      notes: data.notes || undefined,
      progressPhotoUrl: data.progress_photo_url || undefined,
      weight: data.weight || undefined,
      measurements: data.measurements as any,
      createdAt: new Date(data.created_at || Date.now()),
      updatedAt: new Date(data.updated_at || Date.now()),
    };
  }
}
