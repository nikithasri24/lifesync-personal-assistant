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
import type { TaskFocusIntegrationProps } from './types';
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
  const { data: storeTasks = [] } = useTasksQuery();
  const { data: storeProjects = [] } = useProjectsQuery();

  // Custom hooks
  const focusAggregate = useFocusAggregate();
  const state = useTaskFocusState();
  const actions = useTaskFocusActions({ onTaskComplete, storeTasks });

  // Transform store data to view models
  const tasks = useMemo(() => {
    return storeTasks.map((todo) => transformTaskToView(todo, focusAggregate));
  }, [storeTasks, focusAggregate]);

  const projects = useMemo(() => {
    return storeProjects.map((project) => transformProjectToView(project, tasks));
  }, [storeProjects, tasks]);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    const filtered = filterTasks(tasks, state.filter, state.selectedProject, state.searchQuery);
    return sortTasks(filtered, state.sortBy);
  }, [tasks, state.filter, state.selectedProject, state.searchQuery, state.sortBy]);

  // Event handlers
  const handleCreateTask = async () => {
    await actions.createTask(state.newTask);
    state.resetNewTask();
    state.setShowCreateTask(false);
  };

  const _handleCreateProject = async () => {
    await actions.createProject(state.newProject);
    state.resetNewProject();
    state.setShowCreateProject(false);
  };

  const handleViewProjectTasks = (projectId: string) => {
    state.setSelectedProject(projectId);
    state.setActiveTab('tasks');
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
          onToggleStatus={actions.toggleTaskStatus}
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
        onClose={() => state.setShowCreateTask(false)}
        newTask={state.newTask}
        onTaskChange={state.setNewTask}
        onSubmit={handleCreateTask}
        projects={projects}
      />
    </div>
  );
};
