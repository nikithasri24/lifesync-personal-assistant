/**
 * Projects Domain Types
 */

import type { Task } from '@/types/task';

export type ViewMode = 'grid' | 'list';
export type StatusFilter = 'all' | 'active' | 'completed' | 'on_hold';

export type ProjectFormData = {
  name: string;
  description: string;
  color: string;
  icon: string;
  status: 'active' | 'completed' | 'on_hold';
};

export type ProjectMetrics = {
  projectId: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;
  tasks: Task[];
};

export type ProjectStats = {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
};
