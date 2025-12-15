/**
 * Tasks Component - Migrated to React Query
 *
 * Before: Used hybrid approach with useAppStore + useApiTasks
 * After: Uses React Query hooks for all server state
 *
 * Server State (React Query):
 * - Tasks data loading and caching
 * - Projects data loading and caching
 * - Create/Update/Delete mutations
 *
 * Client State (Custom Hooks):
 * - UI state (current view, search, filters) - useTaskFilters
 * - Form state (quick add, editing) - useTaskModals, useTaskEditing
 * - Ephemeral state (expanded tasks, pomodoro timer) - useTaskExpansion, usePomodoro
 */

import React, { useMemo } from 'react';
import { useApiHealth } from '../hooks/useApiHealth';
import {
  useTasks,
  useProjects,
  useCreateTask,
  useUpdateTask,
} from '../hooks/useTasksQuery';
import type { TaskData } from '../services/types';

// Import all custom hooks
import {
  useTaskModals,
  useTaskExpansion,
  usePomodoro,
  useTaskFilters,
  useTaskEditing,
} from '../todos/hooks';

// Import all components
import {
  Sidebar,
  Header,
  TaskListView,
  KanbanView,
  MatrixView,
} from '../todos/components';
import { TodosLoadingState } from '../todos/components/layout/TodosLoadingState';
import { TodosErrorState } from '../todos/components/layout/TodosErrorState';

// Import utilities
import { transformApiTasks, transformApiProjects } from '../todos/utils';

// Import services
import { applyFilters } from '../todos/services/taskFilters';
import {
  getTodayTasks,
  getUpcomingTasks,
  getInboxTasks,
} from '../todos/services/taskHelpers';

export default function Todos(): React.ReactElement {
  // ============================================================================
  // React Query Hooks - Server State Management
  // ============================================================================
  const { data: apiTasks = [], isLoading: tasksLoading, error: tasksError } = useTasks();
  const { data: apiProjects = [], isLoading: projectsLoading } = useProjects();

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();

  // Enhanced API health monitoring
  const apiHealth = useApiHealth(15000); // Check every 15 seconds

  // ============================================================================
  // Data Transformation - API to Local Format
  // ============================================================================
  const tasks = useMemo(() => transformApiTasks(apiTasks), [apiTasks]);
  const projects = useMemo(() => transformApiProjects(apiProjects), [apiProjects]);

  // ============================================================================
  // Custom Hooks - Client State Management
  // ============================================================================

  // Modal and form visibility states
  const modals = useTaskModals();

  // Task expansion and subtask drafts
  const expansion = useTaskExpansion();

  // Pomodoro timer
  const pomodoro = usePomodoro();

  // View, search, and filter states
  const filters = useTaskFilters();

  // Task editing business logic
  const editing = useTaskEditing(
    {
      createTaskMutation: {
        mutate: (data: Partial<TaskData>, options?: { onSuccess?: () => void }) => {
          void createTaskMutation.mutate(data as Omit<TaskData, 'id' | 'created_at' | 'updated_at'>, options);
        },
        isPending: createTaskMutation.isPending
      },
      updateTaskMutation: {
        mutate: (data: { id: string; updates: Partial<TaskData> }) => {
          void updateTaskMutation.mutate(data);
        },
        isPending: updateTaskMutation.isPending
      }
    },
    {
      quickAddText: modals.quickAddText,
      setQuickAddText: modals.setQuickAddText,
      closeQuickAdd: modals.closeQuickAdd,
      editTaskText: modals.editTaskText,
      setEditTaskText: modals.setEditTaskText,
      editingTask: modals.editingTask,
      setEditingTask: modals.setEditingTask,
      openTaskEdit: modals.openTaskEdit,
      closeTaskEdit: modals.closeTaskEdit,
    },
    {
      subtaskDrafts: expansion.subtaskDrafts,
      setSubtaskDraft: expansion.setSubtaskDraft,
      clearSubtaskDraft: expansion.clearSubtaskDraft,
      getSubtaskDraft: expansion.getSubtaskDraft,
      setActiveSubtaskForm: modals.setActiveSubtaskForm,
    },
    apiTasks,
    projects
  );

  // ============================================================================
  // Computed Values - Filtered and View-Specific Tasks
  // ============================================================================

  // Get tasks for current view
  const viewTasks = useMemo(() => {
    let baseTasks = tasks;

    // Apply view-specific filtering
    if (filters.currentView === 'today') {
      baseTasks = getTodayTasks(tasks);
    } else if (filters.currentView === 'inbox') {
      baseTasks = getInboxTasks(tasks);
    } else if (filters.currentView === 'upcoming') {
      baseTasks = getUpcomingTasks(tasks);
    } else if (filters.selectedProject !== 'all') {
      baseTasks = tasks.filter(t => t.projectId === filters.selectedProject && t.status !== 'done');
    }

    // Apply filters and search
    return applyFilters(baseTasks, filters.filters, filters.searchQuery);
  }, [tasks, filters.currentView, filters.selectedProject, filters.filters, filters.searchQuery]);

  // ============================================================================
  // Loading and Error States
  // ============================================================================

  if (tasksLoading || projectsLoading) {
    return <TodosLoadingState />;
  }

  if (tasksError) {
    return <TodosErrorState />;
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-900 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={filters.currentView}
        onViewChange={filters.setCurrentView}
        projects={projects}
        tasks={tasks}
        selectedProject={filters.selectedProject}
        onProjectSelect={filters.setSelectedProject}
        currentTheme={filters.currentTheme}
        onThemeChange={filters.setCurrentTheme}
        showQuickAdd={modals.showQuickAdd}
        quickAddText={modals.quickAddText}
        onQuickAddChange={modals.setQuickAddText}
        onQuickAddSubmit={() => void editing.quickAddTask()}
        onQuickAddCancel={modals.closeQuickAdd}
        createTaskMutation={{
          isPending: createTaskMutation.isPending,
          isError: createTaskMutation.isError,
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header
          currentView={filters.currentView}
          selectedProject={filters.selectedProject}
          projects={projects}
          searchQuery={filters.searchQuery}
          onSearchChange={filters.setSearchQuery}
          filters={filters.filters}
          showFilters={modals.showFilters}
          onToggleFilters={modals.toggleFilters}
          onFilterChange={filters.setFilters}
          onClearFilters={filters.resetFilters}
          pomodoroTimer={pomodoro.pomodoroTimer}
          onPomodoroToggle={pomodoro.togglePomodoro}
          onPomodoroReset={pomodoro.resetPomodoro}
          apiHealth={apiHealth}
          tasksLoading={tasksLoading}
          tasks={tasks}
        />

        {/* Content Area - View-Specific Rendering */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
          <div className="max-w-4xl mx-auto">
            {filters.currentView === 'kanban' ? (
              <KanbanView
                tasks={tasks}
                projects={projects}
                selectedProject={filters.selectedProject}
                onToggleStatus={(taskId: string) => void editing.toggleTaskStatus(taskId)}
                isUpdating={updateTaskMutation.isPending}
              />
            ) : filters.currentView === 'matrix' ? (
              <MatrixView
                tasks={tasks}
                projects={projects}
                selectedProject={filters.selectedProject}
                onToggleStatus={(taskId: string) => void editing.toggleTaskStatus(taskId)}
                isUpdating={updateTaskMutation.isPending}
              />
            ) : (
              <TaskListView
                tasks={viewTasks}
                projects={projects}
                editingTask={modals.editingTask}
                editTaskText={modals.editTaskText}
                onEditChange={modals.setEditTaskText}
                onToggleStatus={(taskId: string) => void editing.toggleTaskStatus(taskId)}
                onStartEdit={editing.startEditingTask}
                onSaveEdit={(taskId: string) => void editing.saveTaskEdit(taskId)}
                onCancelEdit={editing.cancelTaskEdit}
                expandedTasks={expansion.expandedTasks}
                onToggleExpansion={expansion.toggleTaskExpansion}
                allTasks={tasks}
                activeSubtaskForm={modals.activeSubtaskForm}
                subtaskDrafts={expansion.subtaskDrafts}
                onSubtaskDraftChange={expansion.setSubtaskDraft}
                onAddSubtask={(parentId: string) => void editing.addSubtask(parentId)}
                onStartSubtaskForm={modals.openSubtaskForm}
                onCancelSubtaskForm={modals.closeSubtaskForm}
                pomodoroTimer={pomodoro.pomodoroTimer}
                onStartPomodoro={pomodoro.startPomodoro}
                createTaskMutation={{
                  isPending: createTaskMutation.isPending,
                  isError: createTaskMutation.isError,
                }}
                updateTaskMutation={{
                  isPending: updateTaskMutation.isPending,
                }}
                showQuickAdd={modals.showQuickAdd}
                quickAddText={modals.quickAddText}
                onQuickAddChange={modals.setQuickAddText}
                onQuickAddSubmit={() => void editing.quickAddTask()}
                onQuickAddCancel={modals.closeQuickAdd}
                currentView={filters.currentView}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
