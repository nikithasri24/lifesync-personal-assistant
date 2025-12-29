/**
 * Canonical Task Type Definitions
 *
 * This file contains the single source of truth for Task-related types.
 * All task-related code should import from this file.
 *
 * Data Flow:
 * - TaskData (DB layer): snake_case, ISO strings (in src/services/types.ts)
 * - Task (UI layer): camelCase, Date objects (this file)
 */

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in-progress' | 'waiting' | 'scheduled' | 'done';
export type TaskCategory = 'work' | 'personal' | 'learning' | 'creative' | 'health' | 'other';

/**
 * SubTask - A subtask within a parent task
 */
export interface SubTask {
  id: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  completed?: boolean;
  estimatedTime?: number;
  actualTime?: number;
}

/**
 * FollowUpTask - A follow-up action triggered by task completion
 */
export interface FollowUpTask {
  id: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  daysAfter?: number;
  triggerCondition?: 'immediate' | 'delayed' | 'manual';
  category?: string;
  estimatedTime?: number;
  tags?: string[];
}

/**
 * Task - Canonical UI representation of a task
 *
 * This is the main Task type used throughout the application UI.
 * - Uses camelCase naming (TypeScript convention)
 * - Uses Date objects (easier for UI manipulation)
 * - Required booleans with defaults
 * - Non-nullable arrays
 */
export interface Task {
  // Core fields (required)
  id: string;
  title: string;
  status: 'todo' | 'done' | 'waiting' | 'scheduled' | 'in_progress';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  starred: boolean;
  archived: boolean;
  deleted: boolean;
  tags: string[];
  createdAt: Date;

  // Optional fields
  description?: string;
  projectId?: string;
  estimatedTime?: number;
  actualTime?: number;
  dueDate?: Date;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  category?: 'work' | 'personal' | 'learning' | 'creative' | 'health' | 'other';
  notes?: string;
  parentId?: string;
  position?: number;
  deletedAt?: Date;
  completedAt?: Date;
  updatedAt?: Date;

  // Advanced fields
  assignedTo?: string;
  dependsOn?: string[];
  followUpTasks?: FollowUpTask[];
  subtasks?: SubTask[];
}

/**
 * TaskInput - Input type for creating new tasks
 * Omits auto-generated fields
 */
export type TaskInput = Omit<
  Task,
  'id' | 'createdAt' | 'updatedAt' | 'deleted' | 'deletedAt' | 'archived' | 'starred'
>;

/**
 * TaskUpdate - Input type for updating existing tasks
 * All fields optional except id
 */
export type TaskUpdate = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * TaskFilters - Filters for querying tasks
 */
export interface TaskFilters {
  status?: Task['status'];
  priority?: Task['priority'];
  category?: Task['category'];
  projectId?: string;
  parentId?: string;
  starred?: boolean;
  archived?: boolean;
  deleted?: boolean;
  tags?: string[];
}

/**
 * TaskAnalytics - Analytics and metrics for tasks
 */
export interface TaskAnalytics {
  total: number;
  byStatus: {
    todo: number;
    in_progress: number;
    done: number;
    waiting: number;
    scheduled: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  starred: number;
  overdue: number;
  completedToday: number;
  completedThisWeek: number;
  totalEstimatedTime: number;
  totalActualTime: number;
  averageCompletionTime: number;
}
