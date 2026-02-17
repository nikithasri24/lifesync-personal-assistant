/**
 * Type Guards for Together Feature
 * Provides runtime type validation for safer null checks and type narrowing
 */

import type {
  Milestone,
  PartnerMessage,
  AchievementReward,
  PartnerLink,
  MilestoneType,
  ForWhom,
  RevealTrigger,
  MessageStatus,
  ChallengeStatus,
  LinkedType,
  TargetType,
  RewardType,
} from './index';

// =====================================================
// OBJECT TYPE GUARDS
// =====================================================

/**
 * Type guard for Milestone
 */
export function isMilestone(value: unknown): value is Milestone {
  if (!value || typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.user_id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.milestone_type === 'string' &&
    typeof obj.milestone_date === 'string' &&
    typeof obj.for_whom === 'string' &&
    typeof obj.recurring === 'boolean' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}

/**
 * Type guard for PartnerMessage
 */
export function isPartnerMessage(value: unknown): value is PartnerMessage {
  if (!value || typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.connection_id === 'string' &&
    typeof obj.sender_id === 'string' &&
    typeof obj.recipient_id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.message_body === 'string' &&
    typeof obj.reveal_trigger === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}

/**
 * Type guard for AchievementReward
 */
export function isAchievementReward(value: unknown): value is AchievementReward {
  if (!value || typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.connection_id === 'string' &&
    typeof obj.creator_id === 'string' &&
    typeof obj.recipient_id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.linked_type === 'string' &&
    typeof obj.linked_id === 'string' &&
    typeof obj.target_type === 'string' &&
    typeof obj.current_progress === 'number' &&
    typeof obj.reward_type === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.hide_reward === 'boolean' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}

/**
 * Type guard for PartnerLink
 */
export function isPartnerLink(value: unknown): value is PartnerLink {
  if (!value || typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.requester_id === 'string' &&
    typeof obj.partner_id === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}

// =====================================================
// ARRAY TYPE GUARDS
// =====================================================

/**
 * Generic array type guard
 */
export function isArrayOf<T>(
  value: unknown,
  itemGuard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(itemGuard);
}

/**
 * Type guard for Milestone array
 */
export function isMilestoneArray(value: unknown): value is Milestone[] {
  return isArrayOf(value, isMilestone);
}

/**
 * Type guard for PartnerMessage array
 */
export function isPartnerMessageArray(value: unknown): value is PartnerMessage[] {
  return isArrayOf(value, isPartnerMessage);
}

/**
 * Type guard for AchievementReward array
 */
export function isAchievementRewardArray(value: unknown): value is AchievementReward[] {
  return isArrayOf(value, isAchievementReward);
}

// =====================================================
// ENUM TYPE GUARDS
// =====================================================

/**
 * Type guard for MilestoneType
 */
export function isMilestoneType(value: unknown): value is MilestoneType {
  const validTypes: MilestoneType[] = [
    'birthday',
    'anniversary',
    'first_date',
    'move_in',
    'engagement',
    'wedding',
    'custom',
  ];
  return typeof value === 'string' && validTypes.includes(value as MilestoneType);
}

/**
 * Type guard for ForWhom
 */
export function isForWhom(value: unknown): value is ForWhom {
  const validValues: ForWhom[] = ['me', 'partner', 'both'];
  return typeof value === 'string' && validValues.includes(value as ForWhom);
}

/**
 * Type guard for RevealTrigger
 */
export function isRevealTrigger(value: unknown): value is RevealTrigger {
  const validTriggers: RevealTrigger[] = ['first_login', 'specific_date', 'achievement', 'manual'];
  return typeof value === 'string' && validTriggers.includes(value as RevealTrigger);
}

/**
 * Type guard for MessageStatus
 */
export function isMessageStatus(value: unknown): value is MessageStatus {
  const validStatuses: MessageStatus[] = ['draft', 'scheduled', 'revealed', 'read', 'archived'];
  return typeof value === 'string' && validStatuses.includes(value as MessageStatus);
}

/**
 * Type guard for ChallengeStatus
 */
export function isChallengeStatus(value: unknown): value is ChallengeStatus {
  const validStatuses: ChallengeStatus[] = ['active', 'completed', 'expired', 'cancelled'];
  return typeof value === 'string' && validStatuses.includes(value as ChallengeStatus);
}

/**
 * Type guard for LinkedType
 */
export function isLinkedType(value: unknown): value is LinkedType {
  const validTypes: LinkedType[] = ['habit', 'goal', 'task'];
  return typeof value === 'string' && validTypes.includes(value as LinkedType);
}

/**
 * Type guard for TargetType
 */
export function isTargetType(value: unknown): value is TargetType {
  const validTypes: TargetType[] = ['completion', 'count', 'streak', 'milestone'];
  return typeof value === 'string' && validTypes.includes(value as TargetType);
}

/**
 * Type guard for RewardType
 */
export function isRewardType(value: unknown): value is RewardType {
  const validTypes: RewardType[] = ['message', 'surprise', 'activity', 'gift'];
  return typeof value === 'string' && validTypes.includes(value as RewardType);
}

// =====================================================
// NULLABLE TYPE GUARDS
// =====================================================

/**
 * Type guard to ensure value is not null or undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to ensure string is not empty
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard to ensure array is not empty
 */
export function isNonEmptyArray<T>(value: T[]): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}

// =====================================================
// HELPER TYPE GUARDS
// =====================================================

/**
 * Check if milestone is upcoming
 */
export function isUpcomingMilestone(milestone: Milestone): boolean {
  const date = new Date(milestone.milestone_date);
  const now = new Date();

  if (milestone.recurring) {
    // For recurring milestones, check this year's occurrence
    const thisYear = new Date(
      now.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    return thisYear >= now;
  }

  return date >= now;
}

/**
 * Check if message should be revealed now
 */
export function shouldRevealMessage(message: PartnerMessage): boolean {
  if (message.status !== 'scheduled') return false;

  switch (message.reveal_trigger) {
    case 'specific_date':
      if (!message.reveal_date) return false;
      return new Date(message.reveal_date) <= new Date();

    case 'first_login':
      // This would be handled by backend/login check
      return false;

    case 'achievement':
      // This would be checked against achievement completion
      return false;

    case 'manual':
      return false;

    default:
      return false;
  }
}

/**
 * Check if challenge is active and not expired
 */
export function isActiveChallenge(challenge: AchievementReward): boolean {
  if (challenge.status !== 'active') return false;

  if (challenge.expiration_date) {
    const expiration = new Date(challenge.expiration_date);
    return expiration >= new Date();
  }

  return true;
}

/**
 * Check if challenge is completed
 */
export function isChallengeCompleted(challenge: AchievementReward): boolean {
  if (challenge.status === 'completed') return true;

  if (!challenge.target_value) return false;

  return challenge.current_progress >= challenge.target_value;
}
