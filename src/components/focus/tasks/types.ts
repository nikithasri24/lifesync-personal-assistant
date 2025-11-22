/**
 * Type definitions for Task Focus Integration
 */

import type { TodoItem } from '../../../types';

export type TaskStatusView = 'todo' | 'in_progress' | 'completed' | 'cancelled';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  estimatedTime?: number;
  actualTime?: number;
}

export interface TaskView {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  status: TaskStatusView;
  underlyingStatus: TodoItem['status'];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime?: number;
  actualTime?: number;
  dueDate?: Date;
  tags: string[];
  createdAt: Date;
  completedAt?: Date;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  category: 'work' | 'personal' | 'learning' | 'creative' | 'health' | 'other';
  subtasks: SubTask[];
  notes?: string;
}

export interface ProjectView {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  estimatedHours: number;
  actualHours: number;
  tasks: string[];
  progress: number;
  icon?: string;
  category?: string;
}

export type FocusSessionView = {
  id: string;
  taskId?: string;
  projectId?: string;
  duration: number;
  actualDuration: number;
  startTime: Date;
  endTime?: Date;
  productivity?: number;
  notes?: string;
};

export interface TaskFocusIntegrationProps {
  onStartFocusSession: (taskId: string, estimatedDuration: number) => void;
  onTaskComplete: (taskId: string) => void;
  activeFocusSession?: FocusSessionView;
}

export type FilterType = 'all' | 'today' | 'overdue' | 'completed';
export type SortByType = 'priority' | 'dueDate' | 'estimatedTime' | 'createdAt';
export type TabType = 'tasks' | 'projects' | 'analytics';
