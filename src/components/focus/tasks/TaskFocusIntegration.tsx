/**
 * Task Focus Integration
 *
 * Complete task management system integrated with focus sessions.
 * Link tasks to focus sessions, track time spent, estimate vs actual,
 * project organization, and productivity analytics.
 */

import React, { useMemo } from 'react';
import { useTasks } from '@/hooks/useTasksQuery';
import { useProjectsQuery, type Project } from '@/hooks/useProjectsQuery';
import type { TaskFocusIntegrationProps, TaskView, ProjectView } from './types';
import type { Task } from '@/types/task';
import { transformApiTasks } from '@/todos/utils/taskTransformers';
import { transformTaskToView, transformProjectToView, filterTasks, sortTasks } from './utils';
import { useFocusAggregate, useTaskFocusState } from './hooks';
import {
  TaskFocusHeader,
  TaskFocusTabs,
  TasksView,
  ProjectsView,
  CreateTaskModal
} from './components';

export const TaskFocusIntegration: React.FC<TaskFocusIntegrationProps> = ({
  onStartFocusSession,
  onTaskComplete,
  activeFocusSession
}) => {
  // Data queries
  const { data: storeTasksData } = useTasks();
  const { data: storeProjectsData } = useProjectsQuery();

  // Safely memoize the data with proper type guards
  // Transform TaskData[] to Task[] for UI consumption
  const storeTasks = useMemo<Task[]>(() => {
    return Array.isArray(storeTasksData) ? transformApiTasks(storeTasksData) : [];
  }, [storeTasksData]);

  const storeProjects = useMemo<Project[]>(() => {
    return Array.isArray(storeProjectsData) ? storeProjectsData : [];
  }, [storeProjectsData]);

  // Custom hooks
  const focusAggregate = useFocusAggregate();
  const state = useTaskFocusState();

  // TODO: Implement useTaskFocusActions properly
  const actions = {
    createTask: async (_task: unknown): Promise<void> => {
      // Stub implementation
    },
    createProject: async (_project: unknown): Promise<void> => {
      // Stub implementation
    },
    toggleTaskStatus: (_taskId: string): void => {
      // Stub implementation
    },
    toggleSubtask: (): void => {
      // Stub implementation
    }
  };

  // Transform store data to view models
  const tasks = useMemo<TaskView[]>(() => {
    return storeTasks.map((task: Task) => transformTaskToView(task, focusAggregate));
  }, [storeTasks, focusAggregate]);

  const projects = useMemo<ProjectView[]>(() => {
    return storeProjects.map((project: Project) => transformProjectToView(project, tasks));
  }, [storeProjects, tasks]);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo<TaskView[]>(() => {
    const filtered = filterTasks(tasks, state.filter, state.selectedProject, state.searchQuery);
    return sortTasks(filtered, state.sortBy);
  }, [tasks, state.filter, state.selectedProject, state.searchQuery, state.sortBy]);

  // Event handlers
  const handleCreateTask = (): void => {
    if (state.newTask) {
      void actions.createTask(state.newTask).then(() => {
        state.resetNewTask();
        state.setShowCreateTask(false);
      });
    }
  };

  const _handleCreateProject = (): void => {
    if (state.newProject) {
      void actions.createProject(state.newProject).then(() => {
        state.resetNewProject();
        state.setShowCreateProject(false);
      });
    }
  };

  const handleViewProjectTasks = (projectId: string): void => {
    state.setSelectedProject(projectId);
    state.setActiveTab('tasks');
  };

  const handleToggleStatus = (taskId: string): void => {
    void actions.toggleTaskStatus(taskId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <TaskFocusHeader
        onCreateTask={() => state.setShowCreateTask(true)}
        onCreateProject={() => state.setShowCreateProject(true)}
      />

      {/* Navigation Tabs */}
      <TaskFocusTabs
        activeTab={state.activeTab}
        onTabChange={state.setActiveTab}
      />

      {/* Tasks Tab */}
      {state.activeTab === 'tasks' && (
        <TasksView
          tasks={filteredAndSortedTasks}
          projects={projects}
          activeFocusSession={activeFocusSession}
          searchQuery={state.searchQuery}
          onSearchChange={state.setSearchQuery}
          filter={state.filter}
          onFilterChange={state.setFilter}
          selectedProject={state.selectedProject}
          onProjectChange={state.setSelectedProject}
          sortBy={state.sortBy}
          onSortChange={state.setSortBy}
          onToggleStatus={handleToggleStatus}
          onStartFocus={onStartFocusSession}
          onEditTask={state.setSelectedTask}
          onToggleSubtask={actions.toggleSubtask}
          onCreateTask={() => state.setShowCreateTask(true)}
        />
      )}

      {/* Projects Tab */}
      {state.activeTab === 'projects' && (
        <ProjectsView
          projects={projects}
          tasks={tasks}
          onViewTasks={handleViewProjectTasks}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={state.showCreateTask}
        onClose={(): void => state.setShowCreateTask(false)}
        newTask={state.newTask}
        onTaskChange={state.setNewTask}
        onSubmit={handleCreateTask}
        projects={projects}
      />
    </div>
  );
};
