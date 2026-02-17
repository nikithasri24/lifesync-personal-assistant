/**
 * Together Feature Types
 * Types for partner linking, milestones, messages, and achievement rewards
 */

// =====================================================
// ENUMS & CONSTANTS
// =====================================================

export type PartnerLinkStatus = 'pending' | 'accepted' | 'declined';

export type MilestoneType =
  | 'birthday'
  | 'anniversary'
  | 'first_date'
  | 'move_in'
  | 'engagement'
  | 'wedding'
  | 'custom';

export type ForWhom = 'me' | 'partner' | 'both';

export type RevealTrigger = 'first_login' | 'specific_date' | 'achievement' | 'manual';

export type MessageStatus = 'draft' | 'scheduled' | 'revealed' | 'read' | 'archived';

export type LinkedType = 'habit' | 'goal' | 'task';

export type TargetType = 'completion' | 'count' | 'streak' | 'milestone';

export type RewardType = 'message' | 'surprise' | 'activity' | 'gift';

export type ChallengeStatus = 'active' | 'completed' | 'expired' | 'cancelled';

// =====================================================
// DATABASE TYPES
// =====================================================

export interface PartnerLink {
  id: string;
  requester_id: string;
  partner_id: string;
  status: PartnerLinkStatus;
  relationship_start_date: string | null; // ISO date string
  created_at: string;
  updated_at: string;

  // Computed fields from view
  requester_email?: string;
  partner_email?: string;
  days_together?: number;
}

export interface Milestone {
  id: string;
  user_id: string;
  connection_id: string | null; // References profile_connections from Shared feature

  // Details
  title: string;
  milestone_type: MilestoneType;
  milestone_date: string; // ISO date string
  recurring: boolean;

  // Person
  for_whom: ForWhom;
  partner_id: string | null;

  // Content
  description: string | null;
  notes: string | null;
  photo_urls: string[] | null;

  // Reminders
  reminder_30d: boolean;
  reminder_7d: boolean;
  reminder_1d: boolean;
  reminder_day_of: boolean;

  created_at: string;
  updated_at: string;

  // Computed fields from view
  next_occurrence?: string;
  days_until?: number;
}

export interface PartnerMessage {
  id: string;
  connection_id: string; // References profile_connections from Shared feature
  sender_id: string;
  recipient_id: string;

  // Content
  title: string;
  message_body: string; // Rich text/markdown
  photo_urls: string[] | null;
  video_url: string | null;
  background_music_url: string | null;

  // Reveal
  reveal_trigger: RevealTrigger;
  reveal_date: string | null; // ISO datetime string
  achievement_id: string | null;

  // Status
  status: MessageStatus;
  revealed_at: string | null;
  read_at: string | null;

  created_at: string;
  updated_at: string;

  // Computed fields from view
  should_reveal_now?: boolean;
}

export interface AchievementReward {
  id: string;
  connection_id: string; // References profile_connections from Shared feature
  creator_id: string;
  recipient_id: string;

  // Challenge
  title: string;
  description: string | null;

  // Linked entity
  linked_type: LinkedType;
  linked_id: string;

  // Target
  target_type: TargetType;
  target_value: number | null;
  current_progress: number;

  // Reward
  reward_type: RewardType;
  reward_description: string | null;
  reward_message_id: string | null;
  hide_reward: boolean;

  // Status
  status: ChallengeStatus;
  completed_at: string | null;
  expiration_date: string | null; // ISO date string

  created_at: string;
  updated_at: string;

  // Computed fields from view
  progress_percentage?: number;
}

// =====================================================
// FORM TYPES
// =====================================================

export interface PartnerLinkForm {
  partner_email: string;
  relationship_start_date: string | null;
}

export interface MilestoneForm {
  title: string;
  milestone_type: MilestoneType;
  milestone_date: string;
  recurring: boolean;
  for_whom: ForWhom;
  description: string;
  notes: string;
  photo_urls: string[];
  reminder_30d: boolean;
  reminder_7d: boolean;
  reminder_1d: boolean;
  reminder_day_of: boolean;
}

export interface PartnerMessageForm {
  title: string;
  message_body: string;
  photo_urls: string[];
  video_url: string;
  background_music_url: string;
  reveal_trigger: RevealTrigger;
  reveal_date: string | null;
  achievement_id: string | null;
}

export interface AchievementRewardForm {
  title: string;
  description: string;
  linked_type: LinkedType;
  linked_id: string;
  target_type: TargetType;
  target_value: number | null;
  reward_type: RewardType;
  reward_description: string;
  reward_message_id: string | null;
  hide_reward: boolean;
  expiration_date: string | null;
}

// =====================================================
// API TYPES
// =====================================================

export interface CreatePartnerLinkRequest {
  partner_email: string;
  relationship_start_date?: string;
}

export interface UpdatePartnerLinkRequest {
  status?: PartnerLinkStatus;
  relationship_start_date?: string;
}

export interface CreateMilestoneRequest extends Omit<MilestoneForm, 'photo_urls'> {
  connection_id?: string; // Optional link to Shared connection
  partner_id?: string;
  photo_urls?: string[];
}

export interface UpdateMilestoneRequest extends Partial<CreateMilestoneRequest> {
  id: string;
}

export interface CreatePartnerMessageRequest extends Omit<PartnerMessageForm, 'photo_urls' | 'video_url' | 'background_music_url'> {
  recipient_id: string;
  connection_id: string; // References profile_connections
  photo_urls?: string[];
  video_url?: string;
  background_music_url?: string;
  status?: MessageStatus;
}

export interface UpdatePartnerMessageRequest extends Partial<CreatePartnerMessageRequest> {
  id: string;
  status?: MessageStatus;
  revealed_at?: string;
  read_at?: string;
}

export interface CreateAchievementRewardRequest extends Omit<AchievementRewardForm, 'expiration_date'> {
  recipient_id: string;
  connection_id: string; // References profile_connections
  expiration_date?: string;
}

export interface UpdateAchievementRewardRequest extends Partial<CreateAchievementRewardRequest> {
  id: string;
  current_progress?: number;
  status?: ChallengeStatus;
  completed_at?: string;
}

// =====================================================
// UI TYPES
// =====================================================

export interface MilestoneWithDetails extends Milestone {
  is_upcoming: boolean;
  countdown_text: string; // "In 2 days", "Today", "29 days ago"
  age_text?: string; // "Turning 35 years old", "10 years together"
}

export interface MessageCardData extends PartnerMessage {
  sender_name: string;
  recipient_name: string;
  is_sent: boolean;
  is_received: boolean;
}

export interface ChallengeCardData extends AchievementReward {
  linked_name: string; // Name of the habit/goal/task
  progress_bar_width: string; // e.g., "75%"
  is_mystery: boolean; // hide_reward && status === 'active'
}

// =====================================================
// FILTER TYPES
// =====================================================

export interface MilestoneFilters {
  type?: MilestoneType;
  for_whom?: ForWhom;
  upcoming_only?: boolean;
  past_only?: boolean;
}

export interface MessageFilters {
  status?: MessageStatus;
  is_sent?: boolean;
  is_received?: boolean;
  trigger?: RevealTrigger;
}

export interface ChallengeFilters {
  status?: ChallengeStatus;
  linked_type?: LinkedType;
  is_recipient?: boolean;
  is_creator?: boolean;
}

// =====================================================
// CONSTANTS
// =====================================================

export const MILESTONE_TYPE_ICONS: Record<MilestoneType, string> = {
  birthday: '🎂',
  anniversary: '💕',
  first_date: '💑',
  move_in: '🏠',
  engagement: '💍',
  wedding: '👰',
  custom: '⭐',
};

export const MILESTONE_TYPE_LABELS: Record<MilestoneType, string> = {
  birthday: 'Birthday',
  anniversary: 'Anniversary',
  first_date: 'First Date',
  move_in: 'Move-in Anniversary',
  engagement: 'Engagement',
  wedding: 'Wedding Anniversary',
  custom: 'Custom Milestone',
};

export const REWARD_TYPE_ICONS: Record<RewardType, string> = {
  message: '💌',
  surprise: '🎁',
  activity: '🎉',
  gift: '🎀',
};

export const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  message: 'Personal Message',
  surprise: 'Surprise',
  activity: 'Date/Activity',
  gift: 'Physical Gift',
};

export const TARGET_TYPE_LABELS: Record<TargetType, string> = {
  completion: 'Complete once',
  count: 'Reach count',
  streak: 'Maintain streak',
  milestone: 'Hit milestone',
};
