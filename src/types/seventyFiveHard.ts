/**
 * 75 Hard Challenge - Type Definitions
 *
 * Uses discriminated unions for better type safety and explicit state management.
 * Follows best practices: immutability, nominal types, and strict validation.
 */

// ==================== Base Types ====================

/**
 * Branded type for IDs to prevent mixing different entity IDs
 */
export type ChallengeId = string & { readonly __brand: 'ChallengeId' };
export type RuleId = string & { readonly __brand: 'RuleId' };
export type EntryId = string & { readonly __brand: 'EntryId' };

export const createChallengeId = (id: string): ChallengeId => id as ChallengeId;
export const createRuleId = (id: string): RuleId => id as RuleId;
export const createEntryId = (id: string): EntryId => id as EntryId;

// ==================== Rule Types ====================

export interface BaseRule {
  id: RuleId;
  title: string;
  description: string;
  isRequired: boolean;
  isCustom: boolean;
}

export interface SingleTargetRule extends BaseRule {
  type: 'single';
  dailyTarget: 1;
}

export interface MultiTargetRule extends BaseRule {
  type: 'multi';
  dailyTarget: number; // > 1
  segmentLabels?: string[];
}

export type SeventyFiveHardRule = SingleTargetRule | MultiTargetRule;

// ==================== Challenge States ====================

/**
 * Base challenge data shared by all states
 */
interface BaseChallengeData {
  id: ChallengeId;
  name: string;
  startDate: Date;
  endDate: Date;
  currentDay: number; // 1-75
  rules: readonly SeventyFiveHardRule[];
  dailyEntries: readonly SeventyFiveHardEntry[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Active challenge - currently in progress
 */
export interface ActiveChallenge extends BaseChallengeData {
  status: 'active';
  isActive: true;
  // Pause data must not exist
  pausedAt?: never;
  resumedAt?: never;
  totalPauseDuration?: never;
  pauseCount?: never;
}

/**
 * Paused challenge - temporarily stopped
 */
export interface PausedChallenge extends BaseChallengeData {
  status: 'paused';
  isActive: false;
  // Pause data is required
  pausedAt: Date;
  totalPauseDuration: number; // in days
  pauseCount: number; // number of times paused
  // Resume data from previous resume
  resumedAt?: Date;
}

/**
 * Completed challenge - finished all 75 days
 */
export interface CompletedChallenge extends BaseChallengeData {
  status: 'completed';
  isActive: false;
  completedAt: Date;
  // Optional pause history
  pausedAt?: Date;
  resumedAt?: Date;
  totalPauseDuration?: number;
  pauseCount?: number;
}

/**
 * Failed challenge - didn't complete, permanently stopped
 */
export interface FailedChallenge extends BaseChallengeData {
  status: 'failed';
  isActive: false;
  failedAt: Date;
  failureReason?: string;
  // Optional pause history
  pausedAt?: Date;
  resumedAt?: Date;
  totalPauseDuration?: number;
  pauseCount?: number;
}

/**
 * Discriminated union of all challenge states
 */
export type SeventyFiveHardChallenge =
  | ActiveChallenge
  | PausedChallenge
  | CompletedChallenge
  | FailedChallenge;

// ==================== Entry Types ====================

export interface RuleCompletion {
  ruleId: RuleId;
  completed: boolean;
  completedAt?: Date;
  // For multi-target rules
  segments?: boolean[];
}

export interface SeventyFiveHardEntry {
  id: EntryId;
  challengeId: ChallengeId;
  date: Date;
  day: number; // 1-75
  ruleCompletions: readonly RuleCompletion[];
  notes?: string;
  progressPhotoUrl?: string;
  weight?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Validation Types ====================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

// ==================== API Result Types ====================

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export class ChallengeError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ChallengeError';
  }
}

// ==================== Command/Event Types ====================

/**
 * Commands - actions that can be performed
 */
export interface CreateChallengeCommand {
  name: string;
  startDate: Date;
  rules: Omit<SeventyFiveHardRule, 'id'>[];
  notes?: string;
}

export interface PauseChallengeCommand {
  challengeId: ChallengeId;
  pausedAt: Date;
}

export interface ResumeChallengeCommand {
  challengeId: ChallengeId;
  resumedAt: Date;
}

export interface CompleteDayCommand {
  challengeId: ChallengeId;
  date: Date;
  ruleCompletions: Omit<RuleCompletion, 'completedAt'>[];
  weight?: number;
  measurements?: SeventyFiveHardEntry['measurements'];
  notes?: string;
  photo?: File;
}

/**
 * Events - things that happened
 */
export interface ChallengeCreatedEvent {
  type: 'challenge_created';
  challenge: ActiveChallenge;
  timestamp: Date;
}

export interface ChallengePausedEvent {
  type: 'challenge_paused';
  challengeId: ChallengeId;
  currentDay: number;
  pausedAt: Date;
  timestamp: Date;
}

export interface ChallengeResumedEvent {
  type: 'challenge_resumed';
  challengeId: ChallengeId;
  currentDay: number;
  resumedAt: Date;
  pauseDuration: number;
  timestamp: Date;
}

export interface DayCompletedEvent {
  type: 'day_completed';
  challengeId: ChallengeId;
  day: number;
  entry: SeventyFiveHardEntry;
  timestamp: Date;
}

export interface ChallengeCompletedEvent {
  type: 'challenge_completed';
  challengeId: ChallengeId;
  completedAt: Date;
  timestamp: Date;
}

export type ChallengeEvent =
  | ChallengeCreatedEvent
  | ChallengePausedEvent
  | ChallengeResumedEvent
  | DayCompletedEvent
  | ChallengeCompletedEvent;

// ==================== Query Types ====================

export interface ChallengeFilters {
  status?: SeventyFiveHardChallenge['status'];
  startDateFrom?: Date;
  startDateTo?: Date;
  includeEntries?: boolean;
}

export interface ChallengeStats {
  totalChallenges: number;
  activeChallenges: number;
  completedChallenges: number;
  failedChallenges: number;
  pausedChallenges: number;
  completionRate: number; // 0-100
  averageDaysCompleted: number;
  longestStreak: number;
}

// ==================== Type Guards ====================

export const isActiveChallenge = (
  challenge: SeventyFiveHardChallenge
): challenge is ActiveChallenge => challenge.status === 'active';

export const isPausedChallenge = (
  challenge: SeventyFiveHardChallenge
): challenge is PausedChallenge => challenge.status === 'paused';

export const isCompletedChallenge = (
  challenge: SeventyFiveHardChallenge
): challenge is CompletedChallenge => challenge.status === 'completed';

export const isFailedChallenge = (
  challenge: SeventyFiveHardChallenge
): challenge is FailedChallenge => challenge.status === 'failed';

export const isMultiTargetRule = (
  rule: SeventyFiveHardRule
): rule is MultiTargetRule => rule.type === 'multi';

export const isSingleTargetRule = (
  rule: SeventyFiveHardRule
): rule is SingleTargetRule => rule.type === 'single';

// ==================== Constants ====================

export const CHALLENGE_CONSTANTS = {
  TOTAL_DAYS: 75,
  MIN_DAY: 1,
  MAX_DAY: 75,
  MAX_CHALLENGE_NAME_LENGTH: 100,
  MAX_NOTES_LENGTH: 1000,
  MAX_RULES: 20,
  MAX_SEGMENTS_PER_RULE: 10,
} as const;
