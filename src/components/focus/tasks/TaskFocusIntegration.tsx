/**
 * Task Focus Integration
 *
 * Complete task management system integrated with focus sessions.
 * Link tasks to focus sessions, track time spent, estimate vs actual,
 * project organization, and productivity analytics.
 */

import React, { useMemo } from 'react';
import { useTasksQuery } from '../../../tasks/hooks/useTasksQuery';
import { useProjectsQuery } from '../../../projects/hooks/useProjectsQuery';
import type { TaskFocusIntegrationProps, TaskView, ProjectView } from './types';
import type { TodoItem } from '../../../types';
import type { Project } from '../../../projects/hooks/useProjectsQuery';
import { transformTaskToView, transformProjectToView, filterTasks, sortTasks } from './utils';
import { useFocusAggregate, useTaskFocusState, useTaskFocusActions } from './hooks';
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const tasksQueryResult = useTasksQuery();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const storeTasksData = tasksQueryResult.data as TodoItem[] | undefined;
  const { data: storeProjectsData } = useProjectsQuery();

  // Safely memoize the data with proper type guards
  const storeTasks = useMemo<TodoItem[]>(() => {
    return Array.isArray(storeTasksData) ? storeTasksData : [];
  }, [storeTasksData]);

  const storeProjects = useMemo<Project[]>(() => {
    return Array.isArray(storeProjectsData) ? storeProjectsData : [];
  }, [storeProjectsData]);

  // Custom hooks
  const focusAggregate = useFocusAggregate();
  const state = useTaskFocusState();
  const actions = useTaskFocusActions({
    onTaskComplete: onTaskComplete ?? ((): void => {}),
    storeTasks
  });

  // Transform store data to view models
  const tasks = useMemo<TaskView[]>(() => {
    return storeTasks.map((todo: TodoItem) => transformTaskToView(todo, focusAggregate));
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
