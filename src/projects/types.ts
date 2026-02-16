/**
 * Projects Domain Types
 */

import type { Task } from '@/types/task';
import type { Project } from '@/services/types';

export type ViewMode = 'grid' | 'list';
export type StatusFilter = 'all' | 'active' | 'completed' | 'on-hold' | 'planning' | 'archived';

export type ProjectFormData = {
  name: string;
  description: string;
  color: string;
  icon?: string;
  status: Project['status'];
  priority: Project['priority'];
  start_date: string | null;
  target_date: string | null;
  tags: string[];
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
