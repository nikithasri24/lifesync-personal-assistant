/**
 * Project Helper Functions
 */

import type { Project } from '../hooks/useProjectsQuery';
import type { Task } from '@/types/task';
import type { ProjectMetrics, ProjectStats, ProjectFormData } from '../types';

/**
 * Calculate metrics for all projects
 */
export function calculateProjectMetrics(
  projects: Project[],
  tasks: Task[]
): ProjectMetrics[] {
  return projects.map((project) => {
    const projectTasks = tasks.filter((task) => task.projectId === project.id && !task.deleted);
    const completedTasks = projectTasks.filter((task) => task.status === 'done');
    const progress = projectTasks.length > 0 ? (completedTasks.length / projectTasks.length) * 100 : 0;

    return {
      projectId: project.id,
      totalTasks: projectTasks.length,
      completedTasks: completedTasks.length,
      progress: Math.round(progress),
      tasks: projectTasks,
    };
  });
}

/**
 * Calculate overall project statistics
 */
export function calculateProjectStats(
  projects: Project[],
  projectMetrics: ProjectMetrics[]
): ProjectStats {
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;
  const totalTasks = projectMetrics.reduce((sum, m) => sum + m.totalTasks, 0);
  const completedTasks = projectMetrics.reduce((sum, m) => sum + m.completedTasks, 0);

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    completedTasks,
  };
}

/**
 * Get metrics for a specific project
 */
export function getProjectMetrics(
  projectId: string,
  projectMetrics: ProjectMetrics[]
): ProjectMetrics {
  return projectMetrics.find((m) => m.projectId === projectId) ?? {
    projectId,
    totalTasks: 0,
    completedTasks: 0,
    progress: 0,
    tasks: [],
  };
}

/**
 * Create empty form data for new project
 */
export function createEmptyFormData(): ProjectFormData {
  return {
    name: '',
    description: '',
    color: '#6366f1',
    icon: '📁',
    status: 'active' as const,
  };
}

/**
 * Convert Project to form data for editing
 */
export function projectToFormData(project: Project): ProjectFormData {
  return {
    name: project.name,
    description: project.description ?? '',
    color: project.color ?? '#6366f1',
    icon: project.icon ?? '📁',
    status: project.status,
  };
}
