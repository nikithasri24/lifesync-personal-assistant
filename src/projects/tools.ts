/**
 * Projects AI Tools
 *
 * AI tools for enhanced project management (create, get, update, milestones, task linking)
 */

import type { Tool, ToolDefinition, ToolResult } from '@/lib/ai/toolRegistry';
import {
  getProjects,
  getProject,
  createProject as apiCreateProject,
  updateProject as apiUpdateProject,
  createMilestone as apiCreateMilestone,
  updateMilestone as apiUpdateMilestone,
  linkTaskToProject as apiLinkTaskToProject,
} from '@/api/projectsAPI';
import type { Project, ProjectMilestone } from '@/services/types';
import { logger } from '@/services/logger';

// =====================================================
// TOOL DEFINITIONS
// =====================================================

const createProjectDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'create_project',
    description: 'Create a new project with optional milestones and deadlines. Requires name (string). Optional: description, status (planning/active/on-hold/completed/archived), priority (low/medium/high/urgent), start_date (YYYY-MM-DD), target_date (YYYY-MM-DD), tags (array), color.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Project name (e.g., "Build Portfolio Website", "Learn Spanish") - required',
        },
        description: {
          type: 'string',
          description: 'Detailed project description - optional',
        },
        status: {
          type: 'string',
          enum: ['planning', 'active', 'on-hold', 'completed', 'archived'],
          description: 'Project status - optional, defaults to planning',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Priority level - optional, defaults to medium',
        },
        start_date: {
          type: 'string',
          description: 'Start date in ISO format (YYYY-MM-DD) - optional',
        },
        target_date: {
          type: 'string',
          description: 'Target completion date in ISO format (YYYY-MM-DD) - optional',
        },
        tags: {
          type: 'array',
          items: { type: 'string', description: 'Tag name' },
          description: 'Tags for categorization (e.g., ["work", "side-project"]) - optional',
        },
        color: {
          type: 'string',
          description: 'Color hex code for project (e.g., "#3B82F6") - optional',
        },
      },
      required: ['name'],
    },
  },
};

const getProjectsDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_projects',
    description: 'Get all user projects. Returns list of projects with their milestones and progress. Optional filters: status (string), priority (string), tags (array).',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['planning', 'active', 'on-hold', 'completed', 'archived'],
          description: 'Filter by status - optional',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Filter by priority - optional',
        },
        tags: {
          type: 'array',
          items: { type: 'string', description: 'Tag name' },
          description: 'Filter by tags - optional',
        },
      },
    },
  },
};

const updateProjectProgressDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'update_project_progress',
    description: 'Update project progress percentage. Requires project_name (string, case-insensitive) or project_id (string), and progress (number 0-100). Optional: status.',
    parameters: {
      type: 'object',
      properties: {
        project_name: {
          type: 'string',
          description: 'Project name to update (case-insensitive) - optional if project_id provided',
        },
        project_id: {
          type: 'string',
          description: 'Project ID to update - optional if project_name provided',
        },
        progress: {
          type: 'number',
          description: 'Progress percentage (0-100) - required',
        },
        status: {
          type: 'string',
          enum: ['planning', 'active', 'on-hold', 'completed', 'archived'],
          description: 'Update status (e.g., set to "completed" when progress reaches 100) - optional',
        },
      },
      required: ['progress'],
    },
  },
};

const addProjectMilestoneDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'add_project_milestone',
    description: 'Add a milestone to a project. Requires project_name or project_id, and milestone title. Optional: description, target_date (YYYY-MM-DD), order_index (number).',
    parameters: {
      type: 'object',
      properties: {
        project_name: {
          type: 'string',
          description: 'Project name - optional if project_id provided',
        },
        project_id: {
          type: 'string',
          description: 'Project ID - optional if project_name provided',
        },
        title: {
          type: 'string',
          description: 'Milestone title (e.g., "Complete design mockups") - required',
        },
        description: {
          type: 'string',
          description: 'Milestone description - optional',
        },
        target_date: {
          type: 'string',
          description: 'Target completion date in ISO format (YYYY-MM-DD) - optional',
        },
        order_index: {
          type: 'number',
          description: 'Display order (0-based) - optional, defaults to last',
        },
      },
      required: ['title'],
    },
  },
};

const getProjectStatusDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_project_status',
    description: 'Get detailed status of a specific project including milestones, progress, and linked tasks. Requires project_name (string, case-insensitive) or project_id (string).',
    parameters: {
      type: 'object',
      properties: {
        project_name: {
          type: 'string',
          description: 'Project name (case-insensitive) - optional if project_id provided',
        },
        project_id: {
          type: 'string',
          description: 'Project ID - optional if project_name provided',
        },
      },
    },
  },
};

// =====================================================
// TOOL EXECUTION FUNCTIONS
// =====================================================

async function executeCreateProject(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const { name, description, status, priority, start_date, target_date, tags, color } = args;

    if (!name || typeof name !== 'string') {
      return {
        success: false,
        error: 'Project name is required and must be a string',
      };
    }

    const project = await apiCreateProject({
      name,
      description: description as string | undefined,
      status: (status as Project['status'] | undefined) ?? 'planning',
      priority: (priority as Project['priority'] | undefined) ?? 'medium',
      start_date: start_date as string | undefined,
      target_date: target_date as string | undefined,
      tags: (tags as string[]) ?? [],
      color: color as string | undefined,
      progress: 0,
    });

    logger.info('ProjectTools', 'Project created via AI', { projectId: project.id, name: project.name });

    return {
      success: true,
      message: `Project "${project.name}" created successfully with ID ${project.id}`,
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        priority: project.priority,
        progress: project.progress,
        target_date: project.target_date,
      },
    };
  } catch (error) {
    logger.error('ProjectTools', error as Error, { context: 'executeCreateProject' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    };
  }
}

async function executeGetProjects(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const { status, priority, tags } = args;

    const projects = await getProjects({
      status: status as Project['status'] | undefined,
      priority: priority as Project['priority'] | undefined,
      tags: tags as string[] | undefined,
    });

    logger.info('ProjectTools', 'Projects retrieved via AI', { count: projects.length });

    return {
      success: true,
      message: `Found ${projects.length} project(s)`,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        priority: p.priority,
        progress: p.progress,
        milestones_count: p.milestones?.length ?? 0,
        completed_milestones: p.milestones?.filter((m) => m.completed).length ?? 0,
        start_date: p.start_date,
        target_date: p.target_date,
        tags: p.tags,
      })),
      total: projects.length,
    };
  } catch (error) {
    logger.error('ProjectTools', error as Error, { context: 'executeGetProjects' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get projects',
    };
  }
}

async function executeUpdateProgress(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const { project_name, project_id, progress, status } = args;

    if (progress === undefined || typeof progress !== 'number') {
      return {
        success: false,
        error: 'Progress is required and must be a number between 0 and 100',
      };
    }

    if (progress < 0 || progress > 100) {
      return {
        success: false,
        error: 'Progress must be between 0 and 100',
      };
    }

    let projectToUpdate: Project | undefined;

    // Find project by ID or name
    if (project_id && typeof project_id === 'string') {
      projectToUpdate = await getProject(project_id);
    } else if (project_name && typeof project_name === 'string') {
      const allProjects = await getProjects();
      projectToUpdate = allProjects.find(
        (p) => p.name.toLowerCase() === project_name.toLowerCase()
      );
      if (!projectToUpdate) {
        return {
          success: false,
          error: `No project found with name "${project_name}"`,
        };
      }
    } else {
      return {
        success: false,
        error: 'Either project_name or project_id is required',
      };
    }

    const updates: Partial<Project> = { progress };
    if (status && typeof status === 'string') {
      updates.status = status as Project['status'];
    }

    // Auto-complete project if progress is 100
    if (progress === 100 && !status) {
      updates.status = 'completed';
      updates.completed_date = new Date().toISOString().split('T')[0];
    }

    const updated = await apiUpdateProject(projectToUpdate.id, updates);

    logger.info('ProjectTools', 'Project progress updated via AI', {
      projectId: updated.id,
      progress,
      status: updated.status,
    });

    return {
      success: true,
      message: `Project "${updated.name}" updated to ${progress}% progress${
        updated.status === 'completed' ? ' and marked as completed' : ''
      }`,
      project: {
        id: updated.id,
        name: updated.name,
        progress: updated.progress,
        status: updated.status,
      },
    };
  } catch (error) {
    logger.error('ProjectTools', error as Error, { context: 'executeUpdateProgress' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project progress',
    };
  }
}

async function executeAddMilestone(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const { project_name, project_id, title, description, target_date, order_index } = args;

    if (!title || typeof title !== 'string') {
      return {
        success: false,
        error: 'Milestone title is required',
      };
    }

    let projectToUpdate: Project | undefined;

    // Find project by ID or name
    if (project_id && typeof project_id === 'string') {
      projectToUpdate = await getProject(project_id);
    } else if (project_name && typeof project_name === 'string') {
      const allProjects = await getProjects();
      projectToUpdate = allProjects.find(
        (p) => p.name.toLowerCase() === project_name.toLowerCase()
      );
      if (!projectToUpdate) {
        return {
          success: false,
          error: `No project found with name "${project_name}"`,
        };
      }
    } else {
      return {
        success: false,
        error: 'Either project_name or project_id is required',
      };
    }

    // Determine order_index (default to last)
    const currentMilestones = projectToUpdate.milestones || [];
    const finalOrderIndex =
      typeof order_index === 'number' ? order_index : currentMilestones.length;

    const milestone = await apiCreateMilestone({
      project_id: projectToUpdate.id,
      title,
      description: description as string | undefined,
      target_date: target_date as string | undefined,
      completed: false,
      order_index: finalOrderIndex,
    });

    logger.info('ProjectTools', 'Milestone added via AI', {
      projectId: projectToUpdate.id,
      milestoneId: milestone.id,
      title,
    });

    return {
      success: true,
      message: `Milestone "${milestone.title}" added to project "${projectToUpdate.name}"`,
      milestone: {
        id: milestone.id,
        title: milestone.title,
        target_date: milestone.target_date,
        completed: milestone.completed,
      },
    };
  } catch (error) {
    logger.error('ProjectTools', error as Error, { context: 'executeAddMilestone' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add milestone',
    };
  }
}

async function executeGetStatus(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const { project_name, project_id } = args;

    let project: Project | undefined;

    // Find project by ID or name
    if (project_id && typeof project_id === 'string') {
      project = await getProject(project_id);
    } else if (project_name && typeof project_name === 'string') {
      const allProjects = await getProjects();
      project = allProjects.find((p) => p.name.toLowerCase() === project_name.toLowerCase());
      if (!project) {
        return {
          success: false,
          error: `No project found with name "${project_name}"`,
        };
      }
    } else {
      return {
        success: false,
        error: 'Either project_name or project_id is required',
      };
    }

    const milestones = project.milestones || [];
    const completedMilestones = milestones.filter((m) => m.completed);

    logger.info('ProjectTools', 'Project status retrieved via AI', { projectId: project.id });

    return {
      success: true,
      message: `Project "${project.name}" is ${project.progress}% complete`,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        progress: project.progress,
        start_date: project.start_date,
        target_date: project.target_date,
        completed_date: project.completed_date,
        tags: project.tags,
        milestones: {
          total: milestones.length,
          completed: completedMilestones.length,
          list: milestones.map((m) => ({
            title: m.title,
            completed: m.completed,
            target_date: m.target_date,
          })),
        },
      },
    };
  } catch (error) {
    logger.error('ProjectTools', error as Error, { context: 'executeGetStatus' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get project status',
    };
  }
}

// =====================================================
// EXPORT TOOLS
// =====================================================

export const projectTools: Tool[] = [
  { definition: createProjectDefinition, execute: executeCreateProject },
  { definition: getProjectsDefinition, execute: executeGetProjects },
  { definition: updateProjectProgressDefinition, execute: executeUpdateProgress },
  { definition: addProjectMilestoneDefinition, execute: executeAddMilestone },
  { definition: getProjectStatusDefinition, execute: executeGetStatus },
];
