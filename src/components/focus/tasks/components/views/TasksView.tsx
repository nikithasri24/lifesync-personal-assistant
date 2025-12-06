/**
 * Tasks View Component
 * Main view for displaying tasks with filters and active session
 */

import React from 'react';
import type { TaskView, ProjectView, FocusSessionView, FilterType, SortByType } from '../../types';
import { TaskFiltersBar } from '../TaskFiltersBar';
import { ActiveFocusBanner } from '../ActiveFocusBanner';
import { TaskList } from '../TaskList';

interface TasksViewProps {
  tasks: TaskView[];
  projects: ProjectView[];
  activeFocusSession?: FocusSessionView;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  selectedProject: string;
  onProjectChange: (projectId: string) => void;
  sortBy: SortByType;
  onSortChange: (sortBy: SortByType) => void;
  onToggleStatus: (taskId: string) => void;
  onStartFocus: (taskId: string, estimatedTime: number) => void;
  onEditTask: (task: TaskView) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onCreateTask: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  projects,
  activeFocusSession,
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  selectedProject,
  onProjectChange,
  sortBy,
  onSortChange,
  onToggleStatus,
  onStartFocus,
  onEditTask,
  onToggleSubtask,
  onCreateTask
}) => {
  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <TaskFiltersBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        filter={filter}
        onFilterChange={onFilterChange}
        selectedProject={selectedProject}
        onProjectChange={onProjectChange}
        sortBy={sortBy}
        onSortChange={onSortChange}
        projects={projects}
      />

      {/* Active Focus Session */}
      {activeFocusSession && (
        <ActiveFocusBanner
          activeFocusSession={activeFocusSession}
          tasks={tasks}
        />
      )}

      {/* Task List */}
      <TaskList
        tasks={tasks}
        projects={projects}
        activeFocusSession={activeFocusSession}
        searchQuery={searchQuery}
        onToggleStatus={onToggleStatus}
        onStartFocus={onStartFocus}
        onEditTask={onEditTask}
        onToggleSubtask={onToggleSubtask}
        onCreateTask={onCreateTask}
      />
    </div>
  );
};
