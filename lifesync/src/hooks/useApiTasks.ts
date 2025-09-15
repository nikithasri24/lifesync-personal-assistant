// React Hook for API-based Task Management
// Uses REST API instead of direct database connection

import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import type { TaskData, ProjectData } from '../services/api';

export interface UseApiTasksReturn {
  tasks: TaskData[];
  projects: ProjectData[];
  loading: boolean;
  error: string | null;
  
  // Task operations
  createTask: (task: Omit<TaskData, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<TaskData>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  restoreTask: (id: string) => Promise<void>;
  permanentlyDeleteTask: (id: string) => Promise<void>;
  
  // Project operations
  createProject: (project: Omit<ProjectData, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<ProjectData>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Utility functions
  refreshData: () => Promise<void>;
}

export const useApiTasks = (): UseApiTasksReturn => {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [tasksData, projectsData] = await Promise.all([
        apiClient.getTasks(),
        apiClient.getProjects()
      ]);
      
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Task operations
  const createTask = async (taskData: Omit<TaskData, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newTask = await apiClient.createTask(taskData);
      setTasks(prev => [newTask, ...prev]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      setError(errorMessage);
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<TaskData>) => {
    try {
      const updatedTask = await apiClient.updateTask(id, updates);
      setTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const deletedTask = await apiClient.deleteTask(id);
      setTasks(prev => prev.map(task => 
        task.id === id ? deletedTask : task
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMessage);
      throw err;
    }
  };

  const restoreTask = async (id: string) => {
    try {
      const restoredTask = await apiClient.restoreTask(id);
      setTasks(prev => prev.map(task => 
        task.id === id ? restoredTask : task
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore task';
      setError(errorMessage);
      throw err;
    }
  };

  const permanentlyDeleteTask = async (id: string) => {
    try {
      await apiClient.permanentlyDeleteTask(id);
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to permanently delete task';
      setError(errorMessage);
      throw err;
    }
  };

  // Project operations
  const createProject = async (projectData: Omit<ProjectData, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newProject = await apiClient.createProject(projectData);
      setProjects(prev => [newProject, ...prev]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
      throw err;
    }
  };

  const updateProject = async (id: string, updates: Partial<ProjectData>) => {
    try {
      const updatedProject = await apiClient.updateProject(id, updates);
      setProjects(prev => prev.map(project => 
        project.id === id ? updatedProject : project
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await apiClient.deleteProject(id);
      setProjects(prev => prev.filter(project => project.id !== id));
      // Update tasks to remove project reference
      setTasks(prev => prev.map(task => 
        task.project_id === id ? { ...task, project_id: undefined } : task
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
      setError(errorMessage);
      throw err;
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  return {
    tasks,
    projects,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    restoreTask,
    permanentlyDeleteTask,
    createProject,
    updateProject,
    deleteProject,
    refreshData
  };
};