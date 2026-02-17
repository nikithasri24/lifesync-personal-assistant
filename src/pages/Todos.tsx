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

import React, { useMemo, useCallback, useState } from 'react';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useApiHealth } from '../hooks/useApiHealth';
import {
  useTasks,
  useProjects,
  useCreateTask,
  useUpdateTask,
  useMergedTasksConnectionQuery,
} from '../hooks/useTasksQuery';
import type { TaskData } from '../services/types';
import { OwnerFilter, type OwnerFilterValue } from '../components/common/OwnerFilter';
import { useCurrentUserId, usePartnerName } from '../utils/ownerUtils';
import { useThemeColors } from '../hooks/useThemeColors';

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

// Import V2 components
import { FABV2 } from '../components/v2/FABV2';
import { SegmentedControlV2, type Segment } from '../components/v2/SegmentedControlV2';
import { TasksHeaderV2, TaskListViewV2, QuickAddModalV2 } from '../todos/components/v2';

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
  // Theme and UI
  // ============================================================================
  const colors = useThemeColors();

  // ============================================================================
  // React Query Hooks - Server State Management
  // ============================================================================
  const { data: apiTasks = [], isLoading: tasksLoading, error: tasksError } = useTasks();
  const { data: apiProjects = [], isLoading: projectsLoading } = useProjects();

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();

  // Enhanced API health monitoring
  const apiHealth = useApiHealth(15000); // Check every 15 seconds

  // Merged mode support
  const { data: mergedConnection } = useMergedTasksConnectionQuery();
  const { data: currentUserId } = useCurrentUserId();
  const partnerName = usePartnerName(mergedConnection);
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilterValue>('all');

  // ============================================================================
  // Data Transformation - API to Local Format
  // ============================================================================
  const allTasks = useMemo(() => transformApiTasks(apiTasks), [apiTasks]);
  const projects = useMemo(() => transformApiProjects(apiProjects), [apiProjects]);

  // Apply owner filter if in merged mode
  const tasks = useMemo(() => {
    if (!mergedConnection || !currentUserId) return allTasks;

    switch (ownerFilter) {
      case 'mine':
        return allTasks.filter(task => task.userId === currentUserId);
      case 'partner':
        return allTasks.filter(task => task.userId === mergedConnection.partnerId);
      default:
        return allTasks; // 'all'
    }
  }, [allTasks, ownerFilter, currentUserId, mergedConnection]);

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
  // Smart Scheduling Handler
  // ============================================================================

  const handleScheduleTask = useCallback((taskId: string, start: Date, end: Date) => {
    const dateStr = format(start, 'yyyy-MM-dd');
    updateTaskMutation.mutate({
      id: taskId,
      updates: {
        due_date: dateStr,
        scheduled_start: start.toISOString(),
        scheduled_end: end.toISOString(),
        status: 'scheduled' as const,
      },
    });
  }, [updateTaskMutation]);

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
  // View Segments Configuration
  // ============================================================================
  const viewSegments: Segment<'list' | 'kanban' | 'matrix'>[] = [
    { value: 'list', label: 'List' },
    { value: 'kanban', label: 'Kanban' },
    { value: 'matrix', label: 'Matrix' },
  ];

  const [activeView, setActiveView] = useState<'list' | 'kanban' | 'matrix'>('list');

  // ============================================================================
  // Computed Values
  // ============================================================================
  const taskCount = viewTasks.length;
  const completedCount = viewTasks.filter(t => t.status === 'done').length;

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: colors.bg.primary }}
    >
      {/* V2 Header */}
      <TasksHeaderV2
        title="Tasks"
        subtitle={`${taskCount} tasks${completedCount > 0 ? ` • ${completedCount} completed` : ''}`}
        onSearchClick={modals.toggleFilters}
        onFilterClick={modals.toggleFilters}
      />

      {/* Owner Filter - Show only in merged mode */}
      {mergedConnection && (
        <div className="px-5 py-3" style={{ backgroundColor: colors.bg.white, borderBottom: `1px solid ${colors.border.light}` }}>
          <OwnerFilter
            value={ownerFilter}
            onChange={setOwnerFilter}
            partnerName={partnerName}
          />
        </div>
      )}

      {/* V2 Segmented Control for Views */}
      <div className="px-5 py-3">
        <SegmentedControlV2
          segments={viewSegments}
          value={activeView}
          onChange={setActiveView}
          aria-label="Task view selector"
        />
      </div>

      {/* Content Area - View-Specific Rendering */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: colors.bg.primary }}
      >
        {activeView === 'kanban' ? (
          <KanbanView
            tasks={tasks}
            projects={projects}
            selectedProject={filters.selectedProject}
            onToggleStatus={(taskId: string) => void editing.toggleTaskStatus(taskId)}
            isUpdating={updateTaskMutation.isPending}
          />
        ) : activeView === 'matrix' ? (
          <MatrixView
            tasks={tasks}
            projects={projects}
            selectedProject={filters.selectedProject}
            onToggleStatus={(taskId: string) => void editing.toggleTaskStatus(taskId)}
            isUpdating={updateTaskMutation.isPending}
          />
        ) : (
          <TaskListViewV2
            tasks={viewTasks}
            onToggleStatus={(taskId: string) => void editing.toggleTaskStatus(taskId)}
            isUpdating={updateTaskMutation.isPending}
          />
        )}
      </div>

      {/* V2 FAB for Quick Add */}
      <FABV2
        icon={Plus}
        onClick={modals.openQuickAdd}
        position="bottom-right"
      />

      {/* Quick Add Modal */}
      <QuickAddModalV2
        isOpen={modals.showQuickAdd}
        value={modals.quickAddText}
        onChange={modals.setQuickAddText}
        onSubmit={() => void editing.quickAddTask()}
        onClose={modals.closeQuickAdd}
        isLoading={createTaskMutation.isPending}
        isError={createTaskMutation.isError}
      />
    </div>
  );
}
