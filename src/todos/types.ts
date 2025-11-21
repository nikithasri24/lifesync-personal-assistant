/**
 * Core types for the Todos domain
 */

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  status: 'todo' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: number; // minutes
  actualTime: number; // minutes from focus sessions
  dueDate?: Date;
  tags: string[];
  createdAt: Date;
  completedAt?: Date;
  category: 'work' | 'personal' | 'learning' | 'creative' | 'health' | 'other';
  parentId?: string; // For subtasks
  subtasks?: Task[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: 'active' | 'completed' | 'on_hold';
}

export interface Filters {
  priority: string;
  status: string;
  dueDate: string;
  project: string;
}

export interface PomodoroTimer {
  taskId: string | null;
  timeLeft: number;
  isActive: boolean;
  isBreak: boolean;
}

export type ViewType = 'inbox' | 'today' | 'upcoming' | 'kanban' | 'matrix';

export interface Theme {
  primary: string;
  secondary: string;
}

export type ThemeName = 'blue' | 'green' | 'purple' | 'pink' | 'indigo';

export interface MatrixQuadrant {
  title: string;
  subtitle: string;
  color: string;
  tasks: Task[];
}

export interface EisenhowerMatrix {
  urgentImportant: MatrixQuadrant;
  notUrgentImportant: MatrixQuadrant;
  urgentNotImportant: MatrixQuadrant;
  notUrgentNotImportant: MatrixQuadrant;
}
