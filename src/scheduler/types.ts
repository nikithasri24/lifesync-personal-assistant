/**
 * Task Scheduler Types
 * Comprehensive type definitions for modern task scheduling system
 */

import type { Task, Project } from '../lib/supabase';

// ============================================================================
// View Types
// ============================================================================

export type ViewMode = 'board' | 'timeline' | 'list' | 'calendar';
export type GroupByOption = 'status' | 'priority' | 'assignee' | 'project' | 'milestone' | 'none';
export type SortByOption = 'priority' | 'dueDate' | 'created' | 'title' | 'assignee' | 'estimatedTime';
export type FilterStatus = 'all' | 'todo' | 'in_progress' | 'done' | 'blocked' | 'waiting';

// ============================================================================
// Enhanced Task Types
// ============================================================================

export interface ScheduledTask extends Task {
  // Dependencies
  dependencies?: TaskDependency[];
  blockedBy?: string[];
  blocking?: string[];

  // Time tracking
  timeEntries?: TimeEntry[];
  totalTrackedTime?: number;
  remainingTime?: number;

  // Team collaboration
  assignees?: TeamMember[];
  watchers?: string[];
  comments?: TaskComment[];
  activity?: ActivityEntry[];

  // Scheduling
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  recurrence?: RecurrencePattern;

  // Milestones & Sprints
  milestoneId?: string;
  sprintId?: string;

  // Progress
  progress?: number; // 0-100
  subtaskProgress?: number;

  // Auto-scheduling
  isAutoScheduled?: boolean;
  flexibleDuration?: boolean;
  earliestStart?: string;
  latestEnd?: string;
}

// ============================================================================
// Dependency Types
// ============================================================================

export type DependencyType =
  | 'finish-to-start'  // Task B can't start until Task A finishes
  | 'start-to-start'   // Task B can't start until Task A starts
  | 'finish-to-finish' // Task B can't finish until Task A finishes
  | 'start-to-finish'; // Task B can't finish until Task A starts

export interface TaskDependency {
  id: string;
  predecessorId: string;
  successorId: string;
  type: DependencyType;
  lag?: number; // delay in minutes (can be negative for lead time)
  isStrict?: boolean; // if false, it's just a suggestion
}

// ============================================================================
// Time Tracking Types
// ============================================================================

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  description?: string;
  isBillable?: boolean;
  createdAt: string;
}

export interface ActiveTimer {
  taskId: string;
  startTime: string;
  pausedAt?: string;
  totalPausedTime?: number;
}

// ============================================================================
// Team Collaboration Types
// ============================================================================

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  workload?: number; // current workload in hours
  capacity?: number; // max capacity in hours per week
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  mentions?: string[];
  attachments?: string[];
}

export type ActivityType =
  | 'created'
  | 'updated'
  | 'completed'
  | 'assigned'
  | 'commented'
  | 'status_changed'
  | 'priority_changed'
  | 'dependency_added'
  | 'dependency_removed';

export interface ActivityEntry {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  type: ActivityType;
  description: string;
  changes?: Record<string, { old: any; new: any }>;
  timestamp: string;
}

// ============================================================================
// Milestone & Sprint Types
// ============================================================================

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  dueDate: string;
  projectId?: string;
  status: 'planned' | 'active' | 'completed' | 'overdue';
  color: string;
  progress?: number;
  taskCount?: number;
  completedTaskCount?: number;
  createdAt: string;
}

export interface Sprint {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  projectId?: string;
  status: 'planned' | 'active' | 'completed';
  goal?: string;
  capacity?: number; // total story points or hours
  velocity?: number; // average completion rate
  taskIds?: string[];
  createdAt: string;
}

// ============================================================================
// Recurrence Types
// ============================================================================

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface RecurrencePattern {
  frequency: RecurrenceFrequency;
  interval: number; // every X days/weeks/months
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  endDate?: string;
  count?: number; // number of occurrences
  exceptions?: string[]; // dates to skip
}

// ============================================================================
// Board View Types
// ============================================================================

export interface BoardColumn {
  id: string;
  title: string;
  status: string;
  color: string;
  taskIds: string[];
  limit?: number; // WIP limit
  order: number;
}

export interface BoardConfig {
  columns: BoardColumn[];
  swimlanes?: BoardSwimlane[];
  groupBy?: GroupByOption;
  showSubtasks?: boolean;
  showDependencies?: boolean;
}

export interface BoardSwimlane {
  id: string;
  title: string;
  criteria: (task: ScheduledTask) => boolean;
  order: number;
}

// ============================================================================
// Timeline View Types
// ============================================================================

export interface TimelineConfig {
  startDate: Date;
  endDate: Date;
  zoom: 'day' | 'week' | 'month' | 'quarter';
  showDependencies: boolean;
  showMilestones: boolean;
  showWeekends: boolean;
  showCriticalPath: boolean;
  groupBy?: GroupByOption;
}

export interface TimelineTask {
  task: ScheduledTask;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isOverdue?: boolean;
  isCriticalPath?: boolean;
}

// ============================================================================
// List View Types
// ============================================================================

export interface ListColumn {
  id: string;
  label: string;
  field: keyof ScheduledTask | string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  render?: (task: ScheduledTask) => React.ReactNode;
}

export interface ListConfig {
  columns: ListColumn[];
  sortBy: SortByOption;
  sortDirection: 'asc' | 'desc';
  groupBy?: GroupByOption;
  showSubtasks?: boolean;
  compactMode?: boolean;
}

// ============================================================================
// Filter & Search Types
// ============================================================================

export interface TaskFilters {
  status?: FilterStatus[];
  priority?: Task['priority'][];
  assignees?: string[];
  projects?: string[];
  milestones?: string[];
  sprints?: string[];
  tags?: string[];
  dueDate?: {
    start?: string;
    end?: string;
  };
  hasSubtasks?: boolean;
  hasDependencies?: boolean;
  isBlocked?: boolean;
  isOverdue?: boolean;
}

export interface SearchOptions {
  query: string;
  searchIn: ('title' | 'description' | 'comments' | 'tags')[];
  caseSensitive?: boolean;
}

// ============================================================================
// Auto-Scheduling Types
// ============================================================================

export interface SchedulingConstraints {
  workingHours: {
    start: number; // hour 0-23
    end: number;   // hour 0-23
  };
  workingDays: number[]; // 0-6 (Sunday-Saturday)
  excludeDates: string[]; // holidays, etc.
  maxTasksPerDay?: number;
  preferredTimeSlots?: {
    priority: Task['priority'];
    hours: number[];
  }[];
}

export interface SchedulingResult {
  success: boolean;
  scheduledTasks: Map<string, {
    start: string;
    end: string;
    conflicts: string[];
  }>;
  unscheduledTasks: string[];
  warnings: string[];
}

// ============================================================================
// State Types
// ============================================================================

export interface SchedulerState {
  // View state
  viewMode: ViewMode;
  boardConfig: BoardConfig;
  timelineConfig: TimelineConfig;
  listConfig: ListConfig;

  // Data
  tasks: ScheduledTask[];
  projects: Project[];
  milestones: Milestone[];
  sprints: Sprint[];
  teamMembers: TeamMember[];

  // Filters & Search
  filters: TaskFilters;
  search: SearchOptions;
  groupBy: GroupByOption;
  sortBy: SortByOption;

  // Selection & Editing
  selectedTaskIds: string[];
  editingTaskId?: string;
  draggedTaskId?: string;

  // Time tracking
  activeTimers: Map<string, ActiveTimer>;

  // UI state
  expandedTaskIds: Set<string>;
  collapsedGroups: Set<string>;
  showCompletedTasks: boolean;
  sidebarOpen: boolean;
}

// ============================================================================
// Action Types
// ============================================================================

export interface DragDropResult {
  taskId: string;
  sourceColumn: string;
  targetColumn: string;
  newIndex: number;
  newStatus?: Task['status'];
  newAssignee?: string;
}

export interface BulkAction {
  type: 'update_status' | 'update_priority' | 'assign' | 'delete' | 'move_to_milestone';
  taskIds: string[];
  value: any;
}

export interface TaskUpdate {
  taskId: string;
  updates: Partial<ScheduledTask>;
  silent?: boolean; // don't create activity entry
}
