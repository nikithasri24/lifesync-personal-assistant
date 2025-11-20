/**
 * Tasks & Projects Store Slice
 *
 * Manages tasks (todos) and projects state and actions.
 * Extracted from useRealAppStore to improve maintainability.
 */

import { StateCreator } from 'zustand';
import { apiClient } from '../../services/apiClient';
import type { TodoItem, Project } from '../../types';
import { isSupabaseConfigured } from '../../lib/supabase';

const createId = () => Math.random().toString(36).substring(2, 15);

// State interface
export interface TasksSlice {
  // State
  tasks: TodoItem[];
  todos: TodoItem[]; // Alias for backwards compatibility (points to same array)
  projects: Project[];
  tasksLoading: boolean;
  projectsLoading: boolean;

  // Actions - Tasks
  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TodoItem>;
  updateTodo: (id: string, updates: Partial<TodoItem>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  addSubtask: (parentId: string, subtask: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  restoreTodo: (id: string) => Promise<void>;
  permanentlyDeleteTodo: (id: string) => Promise<void>;

  // Actions - Projects
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Internal
  _setTasks: (tasks: TodoItem[]) => void;
  _setProjects: (projects: Project[]) => void;
}

// Create the slice
export const createTasksSlice: StateCreator<TasksSlice> = (set, get) => ({
  // Initial state
  tasks: [],
  todos: [],
  projects: [],
  tasksLoading: false,
  projectsLoading: false,

  // Internal setters (used by initializeData)
  _setTasks: (tasks) => set({ tasks, todos: tasks }),
  _setProjects: (projects) => set({ projects }),

  // ==================== Tasks ====================

  addTodo: async (todoInput) => {
    if (!isSupabaseConfigured) {
      const fallback: TodoItem = {
        ...todoInput,
        id: createId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        completed: todoInput.completed ?? false,
        status: todoInput.status ?? 'todo',
        priority: todoInput.priority ?? 'medium',
        tags: todoInput.tags ?? [],
        deleted: false,
      };
      const tasks = [...get().tasks, fallback];
      set({ tasks, todos: tasks });
      return fallback;
    }

    try {
      const created = await apiClient.createTask({
        title: todoInput.title,
        description: todoInput.description || null,
        status: todoInput.status ?? 'todo',
        priority: todoInput.priority ?? 'medium',
        due_date: todoInput.dueDate ? todoInput.dueDate.toISOString() : null,
        project_id: todoInput.projectId ?? null,
        parent_id: todoInput.parentId ?? null,
        tags: todoInput.tags ?? [],
        assigned_to: todoInput.assignedTo ?? null,
        time_estimate: todoInput.timeEstimate ?? null,
        completed: todoInput.completed ?? false,
        deleted: false,
      });

      const mapped: TodoItem = {
        id: created.id!,
        title: created.title!,
        description: created.description || '',
        status: (created.status as any) || 'todo',
        priority: (created.priority as any) || 'medium',
        dueDate: created.due_date ? new Date(created.due_date) : undefined,
        projectId: created.project_id || undefined,
        parentId: created.parent_id || undefined,
        tags: created.tags || [],
        assignedTo: created.assigned_to || undefined,
        timeEstimate: created.time_estimate || undefined,
        completed: created.completed ?? false,
        deleted: created.deleted ?? false,
        createdAt: new Date(created.created_at!),
        updatedAt: new Date(created.updated_at!),
      };

      const tasks = [...get().tasks, mapped];
      set({ tasks, todos: tasks });
      return mapped;
    } catch (error) {
      console.error('Error creating todo:', error);
      throw error;
    }
  },

  updateTodo: async (id, updates) => {
    // Optimistic update
    const tasks = get().tasks.map((task) =>
      task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
    );
    set({ tasks, todos: tasks });

    if (!isSupabaseConfigured) return;

    try {
      await apiClient.updateTask(id, {
        title: updates.title,
        description: updates.description !== undefined ? updates.description || null : undefined,
        status: updates.status as any,
        priority: updates.priority as any,
        due_date: updates.dueDate ? updates.dueDate.toISOString() : updates.dueDate === null ? null : undefined,
        project_id: updates.projectId !== undefined ? updates.projectId || null : undefined,
        parent_id: updates.parentId !== undefined ? updates.parentId || null : undefined,
        tags: updates.tags,
        assigned_to: updates.assignedTo !== undefined ? updates.assignedTo || null : undefined,
        time_estimate: updates.timeEstimate !== undefined ? updates.timeEstimate || null : undefined,
        completed: updates.completed,
        deleted: updates.deleted,
      });
    } catch (error) {
      console.error('Error updating todo:', error);
      // Revert optimistic update on error
      const tasks = get().tasks.map((task) =>
        task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
      );
      set({ tasks, todos: tasks });
      throw error;
    }
  },

  deleteTodo: async (id) => {
    await get().updateTodo(id, { deleted: true });
  },

  toggleTodo: async (id) => {
    const current = get().tasks.find((t) => t.id === id);
    if (!current) return;

    await get().updateTodo(id, {
      completed: !current.completed,
      status: !current.completed ? 'done' : 'todo',
    });
  },

  addSubtask: async (parentId, subtask) => {
    await get().addTodo({
      ...subtask,
      parentId,
    });
  },

  restoreTodo: async (id) => {
    await get().updateTodo(id, { deleted: false });
  },

  permanentlyDeleteTodo: async (id) => {
    if (!isSupabaseConfigured) {
      const tasks = get().tasks.filter((t) => t.id !== id);
      set({ tasks, todos: tasks });
      return;
    }

    try {
      await apiClient.deleteTask(id);
      const tasks = get().tasks.filter((t) => t.id !== id);
      set({ tasks, todos: tasks });
    } catch (error) {
      console.error('Error permanently deleting todo:', error);
      throw error;
    }
  },

  // ==================== Projects ====================

  addProject: async (projectInput) => {
    if (!isSupabaseConfigured) {
      const fallback: Project = {
        ...projectInput,
        id: createId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      set((state) => ({ projects: [...state.projects, fallback] }));
      return fallback;
    }

    try {
      const created = await apiClient.createProject({
        name: projectInput.name,
        description: projectInput.description || null,
        color: projectInput.color ?? '#6366f1',
        status: projectInput.status ?? 'active',
        icon: projectInput.icon ?? '📁',
      });

      const mapped: Project = {
        id: created.id!,
        name: created.name!,
        description: created.description || '',
        color: created.color || '#6366f1',
        status: (created.status as any) || 'active',
        icon: created.icon || '📁',
        createdAt: new Date(created.created_at!),
        updatedAt: new Date(created.updated_at!),
      };

      set((state) => ({ projects: [...state.projects, mapped] }));
      return mapped;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  updateProject: async (id, updates) => {
    // Optimistic update
    set((state) => ({
      projects: state.projects.map((proj) =>
        proj.id === id ? { ...proj, ...updates, updatedAt: new Date() } : proj
      ),
    }));

    if (!isSupabaseConfigured) return;

    try {
      await apiClient.updateProject(id, {
        name: updates.name,
        description: updates.description !== undefined ? updates.description || null : undefined,
        color: updates.color,
        status: updates.status as any,
        icon: updates.icon,
      });
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  deleteProject: async (id) => {
    if (!isSupabaseConfigured) {
      set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }));
      return;
    }

    try {
      await apiClient.deleteProject(id);
      set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }));
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },
});
