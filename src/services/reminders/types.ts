/**
 * Reminder System Types
 * Types for smart notifications and reminders
 */

export type ReminderType = 
  | 'task_upcoming'      // Task is coming up soon (15 min before)
  | 'task_due'           // Task is due now
  | 'task_overdue'       // Task is past due
  | 'event_upcoming'     // Calendar event starting soon
  | 'habit_reminder'     // Time to do a habit
  | 'morning_briefing'   // Daily morning briefing
  | 'custom';            // User-created custom reminder

export type ReminderPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ReminderSchedule {
  type: 'once' | 'daily' | 'weekly' | 'custom';
  time?: string;          // HH:mm format
  daysOfWeek?: number[];  // 0-6 (Sun-Sat)
  minutesBefore?: number; // For upcoming reminders (e.g., 15 = 15 min before)
}

export interface Reminder {
  id: string;
  userId: string;
  type: ReminderType;
  priority: ReminderPriority;
  
  // Content
  title: string;
  body: string;
  icon?: string;
  
  // Scheduling
  scheduledFor: Date;
  schedule?: ReminderSchedule;
  
  // Related entity (for deep linking)
  entityType?: 'task' | 'event' | 'habit' | 'goal';
  entityId?: string;
  
  // Status
  status: 'pending' | 'sent' | 'dismissed' | 'snoozed' | 'cancelled';
  snoozedUntil?: Date;
  
  // Actions
  actions?: ReminderAction[];
  
  // Timestamps
  createdAt: Date;
  sentAt?: Date;
}

export interface ReminderAction {
  id: string;
  label: string;
  action: 'complete' | 'snooze' | 'dismiss' | 'open' | 'custom';
  payload?: Record<string, unknown>;
}

export interface ReminderPreferences {
  enabled: boolean;
  
  // Task reminders
  taskRemindersEnabled: boolean;
  taskReminderMinutesBefore: number;  // Default: 15
  overdueRemindersEnabled: boolean;
  
  // Event reminders
  eventRemindersEnabled: boolean;
  eventReminderMinutesBefore: number; // Default: 15
  
  // Habit reminders
  habitRemindersEnabled: boolean;
  
  // Morning briefing
  morningBriefingEnabled: boolean;
  morningBriefingTime: string;        // HH:mm format, default "07:00"
  
  // Quiet hours (no notifications)
  quietHoursEnabled: boolean;
  quietHoursStart: string;            // HH:mm format, default "22:00"
  quietHoursEnd: string;              // HH:mm format, default "07:00"
  
  // Sound and vibration
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const DEFAULT_REMINDER_PREFS: ReminderPreferences = {
  enabled: true,
  taskRemindersEnabled: true,
  taskReminderMinutesBefore: 15,
  overdueRemindersEnabled: true,
  eventRemindersEnabled: true,
  eventReminderMinutesBefore: 15,
  habitRemindersEnabled: true,
  morningBriefingEnabled: true,
  morningBriefingTime: '07:00',
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  soundEnabled: true,
  vibrationEnabled: true,
};

// Notification queue item (matches database schema)
export interface NotificationQueueItem {
  id: string;
  user_id: string;
  type: string;
  priority: ReminderPriority;
  payload: {
    title: string;
    body: string;
    icon?: string;
    data?: Record<string, unknown>;
    actions?: { action: string; title: string; icon?: string }[];
  };
  scheduled_for: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sent_at?: string;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
  updated_at: string;
}

