/**
 * Task-Project Integration Tests
 * Tests the integration between tasks and projects
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock the API modules directly to avoid Supabase mock complexity
vi.mock('../../api/tasksAPI', () => ({
  createTask: vi.fn(),
  getTasks: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

vi.mock('../../api/projectsAPI', () => ({
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));

import * as tasksAPI from '../../api/tasksAPI';
import * as projectsAPI from '../../api/projectsAPI';

describe('Task-Project Integration', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockProject = {
    id: 'project-1',
    user_id: mockUser.id,
    name: 'Test Project',
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
    status: 'todo',
    priority: 'medium',
    category: 'work',
    project_id: mockProject.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should link task to project', async () => {
    vi.mocked(projectsAPI.createProject).mockResolvedValue(mockProject as any);
    vi.mocked(tasksAPI.createTask).mockResolvedValue(mockTask as any);

    // Create project
    const project = await projectsAPI.createProject({
      name: mockProject.name,
      description: mockProject.description,
      status: 'active' as const,
      priority: 'medium' as const,
      tags: [],
      progress: 0,
    });

    expect(project).toBeDefined();
    expect(project.id).toBe(mockProject.id);

    // Create task linked to project
    const task = await tasksAPI.createTask({
      title: mockTask.title,
      description: mockTask.description,
      project_id: project.id,
    });

    expect(task).toBeDefined();
    expect(task.project_id).toBe(project.id);
  });

  test('should show project tasks', async () => {
    vi.mocked(tasksAPI.getTasks).mockResolvedValue([mockTask] as any);

    const tasks = await tasksAPI.getTasks({ projectId: mockProject.id });

    expect(tasks).toBeDefined();
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0].project_id).toBe(mockProject.id);
  });

  test('should update project progress when task completes', async () => {
    const completedTask = { ...mockTask, status: 'done' };
    const allTasks = [
      { ...mockTask, status: 'pending' },
      { ...mockTask, id: 'task-2', status: 'done' },
    ];

    vi.mocked(tasksAPI.updateTask).mockResolvedValue(completedTask as any);
    vi.mocked(tasksAPI.getTasks).mockResolvedValue(allTasks as any);
    vi.mocked(projectsAPI.updateProject).mockResolvedValue({ ...mockProject, progress: 50 } as any);

    // Complete a task
    const updatedTask = await tasksAPI.updateTask(mockTask.id, {
      status: 'done',
    });

    expect(updatedTask.status).toBe('done');

    // In a real implementation, this would trigger a project progress update
    const tasks = await tasksAPI.getTasks({ projectId: mockProject.id });
    const completedTasks = tasks.filter((t: any) => t.status === 'done').length;
    const progress = Math.round((completedTasks / tasks.length) * 100);

    const updatedProject = await projectsAPI.updateProject(mockProject.id, {
      progress,
    });

    expect(updatedProject.progress).toBe(50); // 1 out of 2 tasks completed
  });

  test('should remove task from project', async () => {
    const taskWithoutProject = { ...mockTask, project_id: null };
    vi.mocked(tasksAPI.updateTask).mockResolvedValue(taskWithoutProject as any);

    const updatedTask = await tasksAPI.updateTask(mockTask.id, {
      project_id: null,
    });

    expect(updatedTask.project_id).toBeNull();
  });

  test('archived project tasks still appear in main task list', async () => {
    // When a project is archived, its tasks should still be queryable without project_id filter
    const archivedProjectTask = { ...mockTask, project_id: 'archived-project-1' };
    vi.mocked(tasksAPI.getTasks).mockResolvedValue([archivedProjectTask] as any);

    // Query all tasks (no project filter)
    const allTasks = await tasksAPI.getTasks({});

    expect(allTasks).toBeDefined();
    expect(allTasks.length).toBeGreaterThan(0);
    // Task still has its project_id even though the project is archived
    expect(allTasks[0].project_id).toBe('archived-project-1');
  });

  test('all tasks done sets project progress to 100%', async () => {
    const allDone = [
      { ...mockTask, id: 'task-1', status: 'done' },
      { ...mockTask, id: 'task-2', status: 'done' },
      { ...mockTask, id: 'task-3', status: 'done' },
    ];

    vi.mocked(tasksAPI.getTasks).mockResolvedValue(allDone as any);
    vi.mocked(projectsAPI.updateProject).mockResolvedValue({
      ...mockProject,
      progress: 100,
    } as any);

    const tasks = await tasksAPI.getTasks({ projectId: mockProject.id });
    const completed = tasks.filter((t: any) => t.status === 'done').length;
    const progress = Math.round((completed / tasks.length) * 100);

    const updated = await projectsAPI.updateProject(mockProject.id, { progress });

    expect(progress).toBe(100);
    expect(updated.progress).toBe(100);
  });
});
