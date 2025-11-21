/**
 * Task Transformers
 *
 * Functions for transforming API data to local application format
 */

import type { TaskData } from '../../services/types';
import type { Task, Project } from '../types';
import { isSFHTask } from '../services/taskHelpers';

/**
 * Transform API tasks to local Task format
 * Excludes 75 Hard tasks from the transformation
 *
 * @param apiTasks - Tasks from the API
 * @returns Transformed tasks in local format
 */
export function transformApiTasks(apiTasks: TaskData[]): Task[] {
  return apiTasks
    .filter(task => !isSFHTask({ tags: task.tags || undefined }))
    .map(task => {
      // Ensure status is valid
      const status: 'todo' | 'done' = task.status === 'done' ? 'done' : 'todo';

      // Ensure priority is valid
      const priority: 'low' | 'medium' | 'high' | 'urgent' =
        task.priority === 'low' || task.priority === 'medium' ||
        task.priority === 'high' || task.priority === 'urgent'
          ? task.priority
          : 'medium';

      // Ensure category is valid
      const category: 'work' | 'personal' | 'learning' | 'creative' | 'health' | 'other' =
        task.category === 'work' || task.category === 'personal' ||
        task.category === 'learning' || task.category === 'creative' ||
        task.category === 'health' || task.category === 'other'
          ? task.category
          : 'other';

      return {
        id: task.id!,
        title: task.title,
        description: task.description || undefined,
        priority,
        status,
        estimatedTime: task.estimated_time || 30,
        actualTime: task.actual_time || 0,
        dueDate: task.due_date ? new Date(task.due_date) : undefined,
        projectId: task.project_id || undefined,
        tags: task.tags || [],
        category,
        createdAt: new Date(task.created_at!),
        completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
        parentId: task.parent_id || undefined
      };
    });
}

/**
 * Transform API projects to local Project format
 *
 * @param apiProjects - Projects from the API
 * @returns Transformed projects in local format
 */
export function transformApiProjects(apiProjects: any[]): Project[] {
  return apiProjects.map(project => ({
    id: project.id!,
    name: project.name,
    description: project.description || undefined,
    color: project.color || '#3b82f6',
    status: project.status
  }));
}

/**
 * Transform local Task to API TaskData format for mutations
 *
 * @param task - Local task object
 * @returns API-compatible task data
 */
export function transformTaskToApi(task: Partial<Task>): Partial<TaskData> {
  return {
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    status: task.status,
    estimated_time: task.estimatedTime,
    actual_time: task.actualTime,
    due_date: task.dueDate ? task.dueDate.toISOString() : null,
    project_id: task.projectId || null,
    tags: task.tags || [],
    category: task.category,
    parent_id: task.parentId || null,
    completed_at: task.completedAt ? task.completedAt.toISOString() : null
  };
}
