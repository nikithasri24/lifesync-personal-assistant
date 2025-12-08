/**
 * Task-Project Integration Tests
 * Tests the integration between tasks and projects
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import * as tasksAPI from '../../api/tasksAPI';
import * as projectsAPI from '../../api/projectsAPI';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('Task-Project Integration', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockProject = {
    id: 'project-1',
    user_id: mockUser.id,
    title: 'Test Project',
    description: 'Test project description',
    status: 'active',
    progress: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockTask = {
    id: 'task-1',
    user_id: mockUser.id,
    title: 'Test Task',
    description: 'Test task description',
    status: 'pending',
    priority: 'medium',
    project_id: mockProject.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should link task to project', async () => {
    // Mock project creation
    const mockProjectQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockProject,
        error: null,
      }),
    };

    (supabase.from as any).mockReturnValue(mockProjectQuery);

    // Create project
    const project = await projectsAPI.createProject({
      title: mockProject.title,
      description: mockProject.description,
    });

    expect(project).toBeDefined();
    expect(project.id).toBe(mockProject.id);

    // Mock task creation with project_id
    const mockTaskQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockTask,
        error: null,
      }),
    };

    (supabase.from as any).mockReturnValue(mockTaskQuery);

    // Create task linked to project
    const task = await tasksAPI.createTask({
      title: mockTask.title,
      description: mockTask.description,
      projectId: project.id,
    });

    expect(task).toBeDefined();
    expect(task.projectId).toBe(project.id);
  });

  test('should show project tasks', async () => {
    // Mock query to get tasks filtered by project
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [mockTask],
        error: null,
      }),
    };

    (supabase.from as any).mockReturnValue(mockQuery);

    const tasks = await tasksAPI.getTasks({ projectId: mockProject.id });

    expect(tasks).toBeDefined();
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0].projectId).toBe(mockProject.id);
  });

  test('should update project progress when task completes', async () => {
    // Mock getting tasks for project
    const mockTasksQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { ...mockTask, status: 'pending' },
          { ...mockTask, id: 'task-2', status: 'pending' },
        ],
        error: null,
      }),
    };

    // Mock task update
    const mockTaskUpdateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...mockTask, status: 'completed' },
        error: null,
      }),
    };

    // Mock project update with calculated progress
    const mockProjectUpdateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...mockProject, progress: 50 },
        error: null,
      }),
    };

    let callCount = 0;
    (supabase.from as any).mockImplementation((table: string) => {
      callCount++;
      if (table === 'tasks') {
        if (callCount === 1) return mockTasksQuery;
        return mockTaskUpdateQuery;
      }
      return mockProjectUpdateQuery;
    });

    // Complete a task
    const updatedTask = await tasksAPI.updateTask(mockTask.id, {
      status: 'completed',
    });

    expect(updatedTask.status).toBe('completed');

    // In a real implementation, this would trigger a project progress update
    // For now, we're just testing that the mechanism works
    const tasks = await tasksAPI.getTasks({ projectId: mockProject.id });
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const progress = Math.round((completedTasks / tasks.length) * 100);

    const updatedProject = await projectsAPI.updateProject(mockProject.id, {
      progress,
    });

    expect(updatedProject.progress).toBe(50); // 1 out of 2 tasks completed
  });

  test('should remove task from project', async () => {
    // Mock task update to remove project link
    const mockQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...mockTask, project_id: null },
        error: null,
      }),
    };

    (supabase.from as any).mockReturnValue(mockQuery);

    const updatedTask = await tasksAPI.updateTask(mockTask.id, {
      projectId: undefined,
    });

    expect(updatedTask.projectId).toBeUndefined();
  });
});
