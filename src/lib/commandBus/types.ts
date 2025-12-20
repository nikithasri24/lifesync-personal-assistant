/**
 * Command Bus Types
 * 
 * Defines all commands that can be dispatched through the command bus.
 * This provides a unified interface for voice, UI, CLI, and mobile to trigger actions.
 */

// =====================================================
// BASE COMMAND TYPES
// =====================================================

export interface BaseCommand {
  type: string;
  timestamp: Date;
  source: 'voice' | 'ui' | 'cli' | 'mobile' | 'automation' | 'ai';
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface CommandResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// =====================================================
// TASK COMMANDS
// =====================================================

export interface CreateTaskCommand extends BaseCommand {
  type: 'CREATE_TASK';
  payload: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
    estimatedTime?: number;
    category?: string;
    tags?: string[];
    depends_on?: string[];
  };
}

export interface UpdateTaskCommand extends BaseCommand {
  type: 'UPDATE_TASK';
  payload: {
    id: string;
    updates: Partial<{
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      status: 'todo' | 'in_progress' | 'done' | 'scheduled';
      dueDate: string;
      scheduledTime: string;
      estimatedTime: number;
      category: string;
      tags: string[];
      depends_on: string[];
    }>;
  };
}

export interface DeleteTaskCommand extends BaseCommand {
  type: 'DELETE_TASK';
  payload: { id: string };
}

export interface CompleteTaskCommand extends BaseCommand {
  type: 'COMPLETE_TASK';
  payload: { id: string };
}

export interface ScheduleTaskCommand extends BaseCommand {
  type: 'SCHEDULE_TASK';
  payload: {
    id: string;
    date: string;
    time: string;
  };
}

// =====================================================
// HABIT COMMANDS
// =====================================================

export interface CreateHabitCommand extends BaseCommand {
  type: 'CREATE_HABIT';
  payload: {
    name: string;
    description?: string;
    frequency: 'daily' | 'weekly' | 'custom';
    targetDays?: number[];
    reminderTime?: string;
    category?: string;
  };
}

export interface LogHabitCommand extends BaseCommand {
  type: 'LOG_HABIT';
  payload: {
    habitId: string;
    date?: string;
    notes?: string;
  };
}

export interface UpdateHabitCommand extends BaseCommand {
  type: 'UPDATE_HABIT';
  payload: {
    id: string;
    updates: Partial<{
      name: string;
      description: string;
      frequency: 'daily' | 'weekly' | 'custom';
      targetDays: number[];
      reminderTime: string;
      category: string;
      isActive: boolean;
    }>;
  };
}

export interface DeleteHabitCommand extends BaseCommand {
  type: 'DELETE_HABIT';
  payload: { id: string };
}

// =====================================================
// SCHEDULE COMMANDS
// =====================================================

export interface CreateScheduleBlockCommand extends BaseCommand {
  type: 'CREATE_SCHEDULE_BLOCK';
  payload: {
    date: string;
    startTime: string;
    endTime: string;
    type: 'task' | 'event' | 'focus' | 'break';
    title?: string;
    taskId?: string;
    color?: string;
  };
}

export interface UpdateScheduleBlockCommand extends BaseCommand {
  type: 'UPDATE_SCHEDULE_BLOCK';
  payload: {
    id: string;
    updates: Partial<{
      startTime: string;
      endTime: string;
      title: string;
      type: 'task' | 'event' | 'focus' | 'break';
      color: string;
    }>;
  };
}

export interface DeleteScheduleBlockCommand extends BaseCommand {
  type: 'DELETE_SCHEDULE_BLOCK';
  payload: { id: string };
}

export interface PlanDayCommand extends BaseCommand {
  type: 'PLAN_DAY';
  payload: {
    date: string;
    includeOverdue?: boolean;
    maxTasks?: number;
  };
}

// =====================================================
// GOAL COMMANDS
// =====================================================

export interface CreateGoalCommand extends BaseCommand {
  type: 'CREATE_GOAL';
  payload: {
    title: string;
    description?: string;
    category?: string;
    targetDate?: string;
    milestones?: Array<{ title: string; targetDate?: string }>;
  };
}

export interface UpdateGoalCommand extends BaseCommand {
  type: 'UPDATE_GOAL';
  payload: {
    id: string;
    updates: Partial<{
      title: string;
      description: string;
      category: string;
      targetDate: string;
      progress: number;
      status: 'active' | 'completed' | 'paused' | 'abandoned';
    }>;
  };
}

export interface DeleteGoalCommand extends BaseCommand {
  type: 'DELETE_GOAL';
  payload: { id: string };
}

// =====================================================
// INBOX COMMANDS
// =====================================================

export interface QuickCaptureCommand extends BaseCommand {
  type: 'QUICK_CAPTURE';
  payload: {
    content: string;
    itemType?: 'idea' | 'reminder' | 'note' | 'link' | 'voice_note';
  };
}

export interface ProcessInboxItemCommand extends BaseCommand {
  type: 'PROCESS_INBOX_ITEM';
  payload: {
    id: string;
    action: 'convert_to_task' | 'convert_to_event' | 'convert_to_shopping' | 'delete' | 'snooze';
    conversionData?: Record<string, unknown>;
  };
}

// =====================================================
// NOTIFICATION COMMANDS
// =====================================================

export interface ScheduleReminderCommand extends BaseCommand {
  type: 'SCHEDULE_REMINDER';
  payload: {
    title: string;
    body?: string;
    scheduledFor: string;
    entityType?: 'task' | 'habit' | 'event' | 'goal';
    entityId?: string;
  };
}

export interface CancelReminderCommand extends BaseCommand {
  type: 'CANCEL_REMINDER';
  payload: { id: string };
}

// =====================================================
// COMMAND UNION TYPE
// =====================================================

export type Command =
  // Task commands
  | CreateTaskCommand
  | UpdateTaskCommand
  | DeleteTaskCommand
  | CompleteTaskCommand
  | ScheduleTaskCommand
  // Habit commands
  | CreateHabitCommand
  | LogHabitCommand
  | UpdateHabitCommand
  | DeleteHabitCommand
  // Schedule commands
  | CreateScheduleBlockCommand
  | UpdateScheduleBlockCommand
  | DeleteScheduleBlockCommand
  | PlanDayCommand
  // Goal commands
  | CreateGoalCommand
  | UpdateGoalCommand
  | DeleteGoalCommand
  // Inbox commands
  | QuickCaptureCommand
  | ProcessInboxItemCommand
  // Notification commands
  | ScheduleReminderCommand
  | CancelReminderCommand;

// =====================================================
// COMMAND TYPE GUARDS
// =====================================================

export function isTaskCommand(cmd: Command): cmd is CreateTaskCommand | UpdateTaskCommand | DeleteTaskCommand | CompleteTaskCommand | ScheduleTaskCommand {
  return ['CREATE_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'COMPLETE_TASK', 'SCHEDULE_TASK'].includes(cmd.type);
}

export function isHabitCommand(cmd: Command): cmd is CreateHabitCommand | LogHabitCommand | UpdateHabitCommand | DeleteHabitCommand {
  return ['CREATE_HABIT', 'LOG_HABIT', 'UPDATE_HABIT', 'DELETE_HABIT'].includes(cmd.type);
}

export function isScheduleCommand(cmd: Command): cmd is CreateScheduleBlockCommand | UpdateScheduleBlockCommand | DeleteScheduleBlockCommand | PlanDayCommand {
  return ['CREATE_SCHEDULE_BLOCK', 'UPDATE_SCHEDULE_BLOCK', 'DELETE_SCHEDULE_BLOCK', 'PLAN_DAY'].includes(cmd.type);
}

export function isGoalCommand(cmd: Command): cmd is CreateGoalCommand | UpdateGoalCommand | DeleteGoalCommand {
  return ['CREATE_GOAL', 'UPDATE_GOAL', 'DELETE_GOAL'].includes(cmd.type);
}

// =====================================================
// MIDDLEWARE TYPES
// =====================================================

export type CommandMiddleware = (
  command: Command,
  next: () => Promise<CommandResult>
) => Promise<CommandResult>;

export type CommandHandler<T extends Command = Command> = (
  command: T
) => Promise<CommandResult>;

