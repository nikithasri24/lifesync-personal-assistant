/**
 * Task Transformers
 *
 * Functions for transforming API data to local application format
 */

import type { TaskData, Project as ApiProject } from '../../services/types';
import type { Task, Project } from '../types';

/**
 * Transform API tasks to local Task format
 *
 * @param apiTasks - Tasks from the API
 * @returns Transformed tasks in local format
 */
export function transformApiTasks(apiTasks: TaskData[]): Task[] {
  return apiTasks.map(task => {
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

      // Validate required fields
      if (!task.id) {
        throw new Error('Task ID is required');
      }
      if (!task.created_at) {
        throw new Error('Task created_at is required');
      }

      return {
        id: task.id,
        title: task.title,
        description: task.description ?? undefined,
        priority,
        status,
        estimatedTime: task.estimated_time ?? 30,
        actualTime: task.actual_time ?? 0,
        dueDate: task.due_date ? new Date(task.due_date) : undefined,
        projectId: task.project_id ?? undefined,
        tags: task.tags ?? [],
        category,
        createdAt: new Date(task.created_at),
        completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
        parentId: task.parent_id ?? undefined,
        starred: task.starred ?? false,
        archived: task.archived ?? false,
        deleted: task.deleted ?? false
      };
    });
}

/**
 * Transform API projects to local Project format
 *
 * @param apiProjects - Projects from the API (new Project type with enhanced fields)
 * @returns Transformed projects in local format
 */
export function transformApiProjects(apiProjects: ApiProject[]): Project[] {
  return apiProjects.map(project => {
    // Validate required fields
    if (!project.id) {
      throw new Error('Project ID is required');
    }

    // Map API status to local status
    // API: 'planning' | 'active' | 'on-hold' | 'completed' | 'archived'
    // Local: 'active' | 'completed' | 'on_hold'
    let status: 'active' | 'completed' | 'on_hold' = 'active';
    if (project.status === 'completed' || project.status === 'archived') {
      status = 'completed';
    } else if (project.status === 'on-hold') {
      status = 'on_hold';
    } else if (project.status === 'active' || project.status === 'planning') {
      status = 'active';
    }

    return {
      id: project.id,
      name: project.name,
      description: project.description ?? undefined,
      color: project.color ?? '#3b82f6',
      status
    };
  });
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
    description: task.description ?? '',
    priority: task.priority,
    status: task.status,
    estimated_time: task.estimatedTime,
    actual_time: task.actualTime,
    due_date: task.dueDate ? task.dueDate.toISOString() : null,
    project_id: task.projectId ?? null,
    tags: task.tags ?? [],
    category: task.category,
    parent_id: task.parentId ?? null,
    completed_at: task.completedAt ? task.completedAt.toISOString() : null
  };
}
