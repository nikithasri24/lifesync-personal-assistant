/**
 * Phase 0: Infrastructure Types
 * Types for user preferences, conversations, analytics, notifications, and automation
 */

// ============================================================================
// USER PREFERENCES
// ============================================================================

export type Chronotype = 'early_bird' | 'night_owl' | 'neutral';
export type AICoachingStyle = 'supportive' | 'challenging' | 'balanced' | 'minimal';
export type AICommunicationStyle = 'formal' | 'friendly' | 'brief' | 'detailed';
export type TimeFormat = '12h' | '24h';
export type SharingPermission = 'private' | 'view' | 'collaborate' | 'merged';

export interface SchedulingRule {
  rule: 'no_meetings_before' | 'no_meetings_after' | 'lunch_block' | 'focus_block' | 'custom';
  time?: string; // HH:mm format
  start?: string;
  end?: string;
  days?: number[]; // 0=Sun, 1=Mon, etc.
  label?: string;
}

export interface SavedLocation {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  tags?: string[];
  radius?: number; // meters for geofencing
}

export interface NotificationTypeSettings {
  habits: boolean;
  tasks: boolean;
  calendar: boolean;
  bills: boolean;
  ai_suggestions: boolean;
  location_reminders: boolean;
  morning_briefing: boolean;
  weekly_report: boolean;
}

export interface ModuleSharingDefaults {
  journal: SharingPermission;
  meals: SharingPermission;
  shopping: SharingPermission;
  tasks: SharingPermission;
  habits: SharingPermission;
  finances: SharingPermission;
  goals: SharingPermission;
  travel: SharingPermission;
  notes: SharingPermission;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  
  // Chronotype & Energy
  chronotype: Chronotype;
  peak_energy_start: string; // HH:mm
  peak_energy_end: string;
  low_energy_start: string;
  low_energy_end: string;
  preferred_deep_work_start: string;
  preferred_deep_work_end: string;
  
  // Scheduling
  scheduling_rules: SchedulingRule[];
  work_hours_start: string;
  work_hours_end: string;
  work_days: number[];
  max_tasks_per_day: number;
  
  // Locations
  home_location: SavedLocation | null;
  work_location: SavedLocation | null;
  saved_locations: SavedLocation[];
  
  // Notifications
  notifications_enabled: boolean;
  push_enabled: boolean;
  email_notifications_enabled: boolean;
  notification_types: NotificationTypeSettings;
  
  // Quiet Hours
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  quiet_hours_exceptions: string[];
  
  // AI Preferences
  ai_proactive_suggestions: boolean;
  ai_learning_enabled: boolean;
  ai_coaching_style: AICoachingStyle;
  ai_communication_style: AICommunicationStyle;
  
  // Sharing
  default_sharing_permissions: ModuleSharingDefaults;
  
  // Misc
  timezone: string;
  date_format: string;
  time_format: TimeFormat;
  week_starts_on: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CONVERSATIONS (AI Memory)
// ============================================================================

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tool_calls?: {
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
  }[];
}

export interface Conversation {
  id: string;
  user_id: string;
  session_id: string;
  messages: ConversationMessage[];
  summary: string | null;
  context_snapshot: Record<string, unknown> | null;
  started_at: string;
  last_message_at: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ANALYTICS (Pre-computed daily metrics)
// ============================================================================

export interface AnalyticsDaily {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  
  // Tasks
  tasks_created: number;
  tasks_completed: number;
  tasks_overdue: number;
  
  // Habits
  habits_due: number;
  habits_completed: number;
  habit_completion_rate: number;
  streaks_at_risk: number;
  
  // Focus
  focus_sessions: number;
  focus_minutes: number;
  avg_session_length: number;
  
  // Wellness
  energy_avg: number | null;
  journal_entries: number;

  // Finance
  spending_total: number;
  income_total: number;

  // Computed scores
  productivity_score: number;

  created_at: string;
  updated_at: string;
}

// ============================================================================
// NOTIFICATION QUEUE
// ============================================================================

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationType =
  | 'habit_reminder'
  | 'task_due'
  | 'task_overdue'
  | 'calendar_event'
  | 'bill_reminder'
  | 'streak_at_risk'
  | 'ai_suggestion'
  | 'location_reminder'
  | 'morning_briefing'
  | 'weekly_report'
  | 'goal_milestone'
  | 'achievement'
  | 'system';

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: number;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
  click_action?: string;
  entity_type?: string;
  entity_id?: string;
}

export interface NotificationQueueItem {
  id: string;
  user_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  payload: NotificationPayload;
  scheduled_for: string;
  sent_at: string | null;
  status: NotificationStatus;
  retry_count: number;
  error_message: string | null;
  created_at: string;
}

// ============================================================================
// PUSH SUBSCRIPTIONS
// ============================================================================

export type PushPlatform = 'web' | 'ios' | 'android';

export interface PushSubscription {
  id: string;
  user_id: string;
  platform: PushPlatform;
  endpoint: string;
  p256dh: string; // Public key for encryption
  auth: string; // Auth secret
  device_name?: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

// ============================================================================
// AUTOMATION RULES
// ============================================================================

export type AutomationTriggerType =
  | 'time' // Specific time
  | 'schedule' // Cron-like schedule
  | 'event' // When something happens
  | 'condition'; // When a condition is met

export type AutomationEventType =
  | 'task_created'
  | 'task_completed'
  | 'habit_logged'
  | 'habit_missed'
  | 'focus_started'
  | 'focus_ended'
  | 'location_entered'
  | 'location_exited'
  | 'spending_threshold'
  | 'streak_milestone';

export type AutomationActionType =
  | 'create_task'
  | 'send_notification'
  | 'log_habit'
  | 'add_to_list'
  | 'update_status'
  | 'trigger_ai'
  | 'webhook';

export interface AutomationTrigger {
  type: AutomationTriggerType;
  event?: AutomationEventType;
  schedule?: string; // Cron expression
  time?: string; // HH:mm
  conditions?: Record<string, unknown>;
}

export interface AutomationAction {
  type: AutomationActionType;
  params: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  enabled: boolean;
  last_triggered_at: string | null;
  trigger_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CRON JOB LOG (for monitoring background jobs)
// ============================================================================

export type CronJobStatus = 'running' | 'completed' | 'failed';

export interface CronJobLog {
  id: string;
  job_name: string;
  started_at: string;
  completed_at: string | null;
  status: CronJobStatus;
  records_processed: number;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
}

