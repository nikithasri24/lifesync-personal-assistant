/**
 * 75 Hard Challenge Service
 *
 * Clean architecture service layer that encapsulates all business logic.
 * Follows SOLID principles and dependency injection pattern.
 *
 * Responsibilities:
 * - Business logic execution
 * - Validation orchestration
 * - Data transformation
 * - Event emission
 * - Error handling
 */

import { addDays, differenceInDays, startOfDay } from 'date-fns';
import type {
  SeventyFiveHardChallenge,
  ActiveChallenge,
  PausedChallenge,
  CompletedChallenge,
  SeventyFiveHardEntry,
  SeventyFiveHardRule,
  CreateChallengeCommand,
  PauseChallengeCommand,
  ResumeChallengeCommand,
  CompleteDayCommand,
  ChallengeEvent,
  Result,
  ChallengeId,
  RuleId,
  EntryId,
} from '../../types/seventyFiveHard';
import {
  ChallengeError,
  createChallengeId,
  createRuleId,
  createEntryId,
  CHALLENGE_CONSTANTS,
  isActiveChallenge,
  isPausedChallenge,
} from '../../types/seventyFiveHard';

import {
  validateCreateChallengeCommand,
  validateCompleteDayCommand,
  canPauseChallenge,
  canResumeChallenge,
  canLogDay,
} from './validation';

// ==================== Repository Interface ====================

/**
 * Abstract repository interface for data persistence
 * Allows dependency injection and easy testing
 */
export interface IChallengeRepository {
  // Challenge CRUD
  create(challenge: SeventyFiveHardChallenge): Promise<Result<SeventyFiveHardChallenge>>;
  update(id: ChallengeId, challenge: Partial<SeventyFiveHardChallenge>): Promise<Result<SeventyFiveHardChallenge>>;
  delete(id: ChallengeId): Promise<Result<void>>;
  findById(id: ChallengeId): Promise<Result<SeventyFiveHardChallenge | null>>;
  findByUser(userId: string): Promise<Result<SeventyFiveHardChallenge[]>>;
  findActiveByUser(userId: string): Promise<Result<ActiveChallenge | null>>;

  // Entry CRUD
  createEntry(entry: SeventyFiveHardEntry): Promise<Result<SeventyFiveHardEntry>>;
  updateEntry(id: EntryId, entry: Partial<SeventyFiveHardEntry>): Promise<Result<SeventyFiveHardEntry>>;
  findEntriesByChallenge(challengeId: ChallengeId): Promise<Result<SeventyFiveHardEntry[]>>;
  findEntryByDay(challengeId: ChallengeId, day: number): Promise<Result<SeventyFiveHardEntry | null>>;
}

/**
 * Photo storage interface
 */
export interface IPhotoStorage {
  upload(file: File, path: string): Promise<Result<string>>; // Returns URL
  delete(url: string): Promise<Result<void>>;
}

/**
 * Event bus interface for emitting domain events
 */
export interface IEventBus {
  publish(event: ChallengeEvent): Promise<void>;
}

// ==================== Service Implementation ====================

export class ChallengeService {
  constructor(
    private repository: IChallengeRepository,
    private photoStorage: IPhotoStorage,
    private eventBus: IEventBus,
    private userId: string
  ) {}

  // ==================== Challenge Operations ====================

  /**
   * Create a new 75 Hard challenge
   */
  async createChallenge(command: CreateChallengeCommand): Promise<Result<ActiveChallenge>> {
    // Validate command
    const validationResult = validateCreateChallengeCommand(command);
    if (!validationResult.success) {
      return {
        ok: false,
        error: new ChallengeError(
          'Validation failed',
          'VALIDATION_ERROR',
          validationResult.errors
        ),
      };
    }

    // Check for existing active challenge
    const activeResult = await this.repository.findActiveByUser(this.userId);
    if (!activeResult.ok) {
      return { ok: false, error: activeResult.error };
    }

    if (activeResult.value) {
      return {
        ok: false,
        error: new ChallengeError(
          'You already have an active challenge. Please pause or complete it first.',
          'ACTIVE_CHALLENGE_EXISTS'
        ),
      };
    }

    // Create rules with IDs
    const rules: SeventyFiveHardRule[] = command.rules.map(rule => ({
      ...rule,
      id: createRuleId(this.generateId()),
    }));

    // Calculate end date (75 days total)
    const startDate = startOfDay(command.startDate);
    const endDate = addDays(startDate, 74);

    // Create challenge entity
    const challenge: ActiveChallenge = {
      id: createChallengeId(this.generateId()),
      status: 'active',
      isActive: true,
      name: command.name.trim(),
      startDate,
      endDate,
      currentDay: 1,
      rules,
      dailyEntries: [],
      notes: command.notes?.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Persist
    const saveResult = await this.repository.create(challenge);
    if (!saveResult.ok) {
      return { ok: false, error: saveResult.error };
    }

    // Emit event
    await this.eventBus.publish({
      type: 'challenge_created',
      challenge: saveResult.value as ActiveChallenge,
      timestamp: new Date(),
    });

    return { ok: true, value: saveResult.value as ActiveChallenge };
  }

  /**
   * Pause an active challenge
   */
  async pauseChallenge(command: PauseChallengeCommand): Promise<Result<PausedChallenge>> {
    // Fetch challenge
    const challengeResult = await this.repository.findById(command.challengeId);
    if (!challengeResult.ok) {
      return { ok: false, error: challengeResult.error };
    }

    const challenge = challengeResult.value;
    if (!challenge) {
      return {
        ok: false,
        error: new ChallengeError('Challenge not found', 'CHALLENGE_NOT_FOUND'),
      };
    }

    // Validate can pause
    const canPause = canPauseChallenge(challenge.status, challenge.currentDay);
    if (!canPause.success) {
      return {
        ok: false,
        error: new ChallengeError(
          'Cannot pause challenge',
          'CANNOT_PAUSE',
          canPause.errors
        ),
      };
    }

    // Create paused challenge
    const pausedChallenge: PausedChallenge = {
      ...challenge,
      status: 'paused',
      isActive: false,
      pausedAt: command.pausedAt,
      totalPauseDuration: (challenge as any).totalPauseDuration || 0,
      pauseCount: ((challenge as any).pauseCount || 0) + 1,
      resumedAt: (challenge as any).resumedAt,
      updatedAt: new Date(),
    };

    // Persist
    const saveResult = await this.repository.update(command.challengeId, pausedChallenge);
    if (!saveResult.ok) {
      return { ok: false, error: saveResult.error };
    }

    // Emit event
    await this.eventBus.publish({
      type: 'challenge_paused',
      challengeId: command.challengeId,
      currentDay: challenge.currentDay,
      pausedAt: command.pausedAt,
      timestamp: new Date(),
    });

    return { ok: true, value: pausedChallenge };
  }

  /**
   * Resume a paused challenge
   */
  async resumeChallenge(command: ResumeChallengeCommand): Promise<Result<ActiveChallenge>> {
    // Fetch challenge
    const challengeResult = await this.repository.findById(command.challengeId);
    if (!challengeResult.ok) {
      return { ok: false, error: challengeResult.error };
    }

    const challenge = challengeResult.value;
    if (!challenge || !isPausedChallenge(challenge)) {
      return {
        ok: false,
        error: new ChallengeError('Challenge not found or not paused', 'CANNOT_RESUME'),
      };
    }

    // Validate can resume
    const canResume = canResumeChallenge(challenge.status);
    if (!canResume.success) {
      return {
        ok: false,
        error: new ChallengeError(
          'Cannot resume challenge',
          'CANNOT_RESUME',
          canResume.errors
        ),
      };
    }

    // Calculate pause duration
    const pauseDurationDays = differenceInDays(command.resumedAt, challenge.pausedAt);
    const totalPauseDuration = challenge.totalPauseDuration + pauseDurationDays;

    // Adjust dates to maintain current day
    const currentDay = challenge.currentDay;
    const newStartDate = addDays(command.resumedAt, -(currentDay - 1));
    const newEndDate = addDays(newStartDate, 74);

    // Create active challenge
    const activeChallenge: ActiveChallenge = {
      id: challenge.id,
      status: 'active',
      isActive: true,
      name: challenge.name,
      startDate: newStartDate,
      endDate: newEndDate,
      currentDay,
      rules: challenge.rules,
      dailyEntries: challenge.dailyEntries,
      notes: challenge.notes,
      createdAt: challenge.createdAt,
      updatedAt: new Date(),
      // Clear pause data
      pausedAt: undefined,
      resumedAt: undefined,
      totalPauseDuration: undefined,
      pauseCount: undefined,
    };

    // Persist
    const saveResult = await this.repository.update(command.challengeId, activeChallenge);
    if (!saveResult.ok) {
      return { ok: false, error: saveResult.error };
    }

    // Emit event
    await this.eventBus.publish({
      type: 'challenge_resumed',
      challengeId: command.challengeId,
      currentDay,
      resumedAt: command.resumedAt,
      pauseDuration: pauseDurationDays,
      timestamp: new Date(),
    });

    return { ok: true, value: activeChallenge };
  }

  /**
   * Complete a day's tasks
   */
  async completeDay(command: CompleteDayCommand): Promise<Result<SeventyFiveHardEntry>> {
    // Fetch challenge
    const challengeResult = await this.repository.findById(command.challengeId);
    if (!challengeResult.ok) {
      return { ok: false, error: challengeResult.error };
    }

    const challenge = challengeResult.value;
    if (!challenge || !isActiveChallenge(challenge)) {
      return {
        ok: false,
        error: new ChallengeError('Challenge not found or not active', 'CHALLENGE_NOT_ACTIVE'),
      };
    }

    // Calculate day number
    const dayNumber = differenceInDays(startOfDay(command.date), startOfDay(challenge.startDate)) + 1;

    // Validate command
    const validationResult = validateCompleteDayCommand(
      command,
      challenge.startDate,
      challenge.currentDay,
      challenge.rules
    );
    if (!validationResult.success) {
      return {
        ok: false,
        error: new ChallengeError(
          'Validation failed',
          'VALIDATION_ERROR',
          validationResult.errors
        ),
      };
    }

    // Validate can log this day
    const canLog = canLogDay(challenge.status, dayNumber, challenge.currentDay);
    if (!canLog.success) {
      return {
        ok: false,
        error: new ChallengeError(
          'Cannot log this day',
          'CANNOT_LOG_DAY',
          canLog.errors
        ),
      };
    }

    // Upload photo if provided
    let photoUrl: string | undefined;
    if (command.photo) {
      const photoPath = `75hard/${this.userId}/${challenge.id}/${dayNumber}`;
      const uploadResult = await this.photoStorage.upload(command.photo, photoPath);
      if (!uploadResult.ok) {
        return {
          ok: false,
          error: new ChallengeError(
            'Failed to upload photo',
            'PHOTO_UPLOAD_FAILED',
            uploadResult.error
          ),
        };
      }
      photoUrl = uploadResult.value;
    }

    // Check if entry already exists
    const existingEntryResult = await this.repository.findEntryByDay(
      command.challengeId,
      dayNumber
    );
    if (!existingEntryResult.ok) {
      return { ok: false, error: existingEntryResult.error };
    }

    const now = new Date();

    // Add completedAt timestamps to completions
    const ruleCompletions = command.ruleCompletions.map(rc => ({
      ...rc,
      completedAt: rc.completed ? now : undefined,
    }));

    const entry: SeventyFiveHardEntry = {
      id: existingEntryResult.value?.id || createEntryId(this.generateId()),
      challengeId: command.challengeId,
      date: startOfDay(command.date),
      day: dayNumber,
      ruleCompletions,
      notes: command.notes?.trim(),
      progressPhotoUrl: photoUrl,
      weight: command.weight,
      measurements: command.measurements,
      createdAt: existingEntryResult.value?.createdAt || now,
      updatedAt: now,
    };

    // Save entry
    const saveResult = existingEntryResult.value
      ? await this.repository.updateEntry(entry.id, entry)
      : await this.repository.createEntry(entry);

    if (!saveResult.ok) {
      return { ok: false, error: saveResult.error };
    }

    // Update current day if this is the highest day logged
    if (dayNumber > challenge.currentDay) {
      await this.repository.update(command.challengeId, {
        currentDay: dayNumber,
        updatedAt: now,
      });
    }

    // Check if challenge is complete
    if (dayNumber === CHALLENGE_CONSTANTS.MAX_DAY) {
      const allRulesComplete = ruleCompletions.every(rc => rc.completed);
      if (allRulesComplete) {
        await this.completeChallenge(command.challengeId);
      }
    }

    // Emit event
    await this.eventBus.publish({
      type: 'day_completed',
      challengeId: command.challengeId,
      day: dayNumber,
      entry: saveResult.value,
      timestamp: now,
    });

    return { ok: true, value: saveResult.value };
  }

  /**
   * Mark challenge as completed
   */
  private async completeChallenge(challengeId: ChallengeId): Promise<Result<CompletedChallenge>> {
    const challengeResult = await this.repository.findById(challengeId);
    if (!challengeResult.ok) {
      return { ok: false, error: challengeResult.error };
    }

    const challenge = challengeResult.value;
    if (!challenge) {
      return {
        ok: false,
        error: new ChallengeError('Challenge not found', 'CHALLENGE_NOT_FOUND'),
      };
    }

    const now = new Date();

    const completedChallenge: CompletedChallenge = {
      ...challenge,
      status: 'completed',
      isActive: false,
      completedAt: now,
      updatedAt: now,
    };

    const saveResult = await this.repository.update(challengeId, completedChallenge);
    if (!saveResult.ok) {
      return { ok: false, error: saveResult.error };
    }

    // Emit event
    await this.eventBus.publish({
      type: 'challenge_completed',
      challengeId,
      completedAt: now,
      timestamp: now,
    });

    return { ok: true, value: completedChallenge as CompletedChallenge };
  }

  /**
   * Update current day for active challenges (called daily)
   */
  async updateCurrentDay(challengeId: ChallengeId): Promise<Result<void>> {
    const challengeResult = await this.repository.findById(challengeId);
    if (!challengeResult.ok) {
      return { ok: false, error: challengeResult.error };
    }

    const challenge = challengeResult.value;
    if (!challenge || !isActiveChallenge(challenge)) {
      return { ok: true, value: undefined }; // Skip non-active challenges
    }

    const today = startOfDay(new Date());
    const daysElapsed = differenceInDays(today, startOfDay(challenge.startDate));
    const actualCurrentDay = Math.max(1, Math.min(daysElapsed + 1, CHALLENGE_CONSTANTS.MAX_DAY));

    if (actualCurrentDay !== challenge.currentDay) {
      await this.repository.update(challengeId, {
        currentDay: actualCurrentDay,
        updatedAt: new Date(),
      });
    }

    return { ok: true, value: undefined };
  }

  // ==================== Helpers ====================

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}
