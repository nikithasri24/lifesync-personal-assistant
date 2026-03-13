/**
 * Tasks Component - V2 Implementation with Centered Layout
 *
 * Fully migrated to V2 components following Together tab pattern with:
 * - Centered layout (900px max-width)
 * - Simple header (no gradient)
 * - ViewSelectorV2 for all 6 views
 * - FilterBarV2 with pill-style filters
 * - TaskFormModalV2 for full editing
 * - QuickAddModalV2 for quick add
 * - All modals follow Together pattern
 *
 * Server State (React Query):
 * - Tasks data loading and caching
 * - Projects data loading and caching
 * - Create/Update/Delete mutations
 *
 * Client State (Custom Hooks):
 * - UI state (current view, search, filters)
 * - Form state (quick add, editing)
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Plus, CheckSquare, Trash2, X } from 'lucide-react';
import { useApiHealth } from '../hooks/useApiHealth';
import {
  useTasks,
  usePagedTasks,
  useProjects,
  useCreateTask,
  useUpdateTask,
  usePermanentlyDeleteTask,
} from '../hooks/useTasksQuery';
import type { TaskFilters } from '../hooks/useTasksQuery';
import type { TaskData } from '../services/types';
import { OwnerFilter, type OwnerFilterValue } from '../components/common/OwnerFilter';
import { useMergedConnection, useCurrentUserId } from '@/hooks/useOwnerInfo';
import { filterByOwner } from '@/finance/utils/ownerFilter';
import { useThemeColors } from '../hooks/useThemeColors';
import { useToast } from '../hooks/useToast';
import { FeatureErrorBoundary } from '../components/FeatureErrorBoundary';
import { useUndoRedo } from '../contexts/UndoRedoContext';
import { useTodosDragDrop, useTaskExpansion } from '../todos/hooks';
import { reminderService } from '../services/reminders/ReminderService';
import { logger } from '../services/logger';
import { format } from 'date-fns';

// Import V2 components
import { FABV2 } from '../components/v2/FABV2';
import {
  TasksHeaderV2,
  ViewSelectorV2,
  FilterBarV2,
  TaskFormModalV2,
  QuickAddModalV2,
  TaskListViewV2,
  type TaskView,
  type PriorityFilter,
  type StatusFilter,
} from '../todos/components/v2';

import { TaskScheduleModal } from '../components/todos/TaskScheduleModal';
import { TodosLoadingState } from '../todos/components/layout/TodosLoadingState';
import { TodosErrorState } from '../todos/components/layout/TodosErrorState';
import { usePagination } from '../hooks/utilities/usePagination';
import { PaginationV2 } from '../components/ui/PaginationV2';
import { DEFAULT_PAGE_SIZE } from '../types/pagination';

// Import utilities
import { transformApiTasks, transformApiProjects } from '../todos/utils';

// Statuses that indicate a task is not yet done — used in server-side view filters.
const NON_DONE_STATUSES: TaskData['status'][] = ['todo', 'in_progress', 'waiting', 'scheduled'];

const TodosContent: React.FC = () => {
  // ============================================================================
  // Theme and UI
  // ============================================================================
  const colors = useThemeColors();
  const { showToast } = useToast();

  // ============================================================================
  // View State (declared early — used in serverFilters below)
  // ============================================================================
  const [activeView, setActiveView] = useState<TaskView>('today');

  // ============================================================================
  // Filter State
  // ============================================================================
  const [showFilters, setShowFilters] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  // ============================================================================
  // Merged mode support (declared early — used in serverFilters below)
  // ============================================================================
  const { data: mergedConnection } = useMergedConnection('todos');
  const { data: currentUserId } = useCurrentUserId();
  const partnerName = mergedConnection?.partnerName ?? 'Partner';
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilterValue>('all');

  // ============================================================================
  // Pagination State
  // ============================================================================
  const { page, setPage, resetPage } = usePagination();

  // Reset to page 1 whenever any filter or view changes
  useEffect(() => {
    resetPage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, priorityFilter, statusFilter, projectFilter, searchQuery, showStarredOnly, ownerFilter]);

  // ============================================================================
  // Server-side filter computation
  // Maps UI state → API filter params passed to getPagedTasks.
  // ============================================================================

  const serverFilters = useMemo((): TaskFilters => {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    // View-specific date/status constraints
    let viewFilters: TaskFilters = { deleted: false, archived: false };
    switch (activeView) {
      case 'today':
        viewFilters = { ...viewFilters, dueAfter: today, dueBefore: today, statuses: NON_DONE_STATUSES };
        break;
      case 'upcoming':
        viewFilters = { ...viewFilters, dueAfter: today, dueBefore: sevenDaysFromNow, statuses: NON_DONE_STATUSES };
        break;
      case 'inbox':
        // All non-done tasks regardless of due date
        viewFilters = { ...viewFilters, statuses: NON_DONE_STATUSES };
        break;
      case 'list':
        // All tasks including done — no extra filters
        break;
    }

    // Explicit status filter from UI overrides the view's statuses
    if (statusFilter !== 'all') {
      delete viewFilters.statuses;
      viewFilters.status = statusFilter as TaskData['status'];
    }

    if (priorityFilter !== 'all') viewFilters.priority = priorityFilter as TaskData['priority'];
    if (projectFilter !== 'all') viewFilters.projectId = projectFilter;
    if (showStarredOnly) viewFilters.starred = true;
    if (searchQuery.trim()) viewFilters.search = searchQuery.trim();

    // Owner filter: push to server so page counts are accurate
    if (ownerFilter === 'mine' && currentUserId) {
      viewFilters.ownerUserId = currentUserId;
    } else if (ownerFilter === 'partner' && mergedConnection?.partnerId) {
      viewFilters.ownerUserId = mergedConnection.partnerId;
    }

    return viewFilters;
  }, [activeView, statusFilter, priorityFilter, projectFilter, showStarredOnly, searchQuery, ownerFilter, currentUserId, mergedConnection]);

  // ============================================================================
  // React Query Hooks - Server State Management
  // ============================================================================

  // Catalog: all non-deleted tasks — used for dependency resolution, subtask
  // toggle lookups, and drag-drop (needs tasks outside the current page).
  const { data: catalogData = [], isLoading: catalogLoading, error: catalogError } = useTasks({ deleted: false, archived: false });

  // Display list: server-paginated and filtered to the current view.
  const { data: pagedData, isLoading: pageLoading } = usePagedTasks(serverFilters, page);

  const { data: apiProjects = [], isLoading: projectsLoading } = useProjects();

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = usePermanentlyDeleteTask();

  // Enhanced API health monitoring
  const apiHealth = useApiHealth(15000); // Check every 15 seconds

  // ============================================================================
  // Data Transformation - API to Local Format
  // ============================================================================

  // allTasks: catalog transformed to local type, used for dependency/subtask UI
  const allTasks = useMemo(() => transformApiTasks(catalogData), [catalogData]);
  const projects = useMemo(() => transformApiProjects(apiProjects), [apiProjects]);

  // tasks: owner-filtered catalog — used for drag-drop which operates across views
  const tasks = useMemo(
    () => filterByOwner(allTasks, ownerFilter, currentUserId ?? undefined),
    [allTasks, ownerFilter, currentUserId]
  );

  // displayItems: the server-paginated result, transformed to local type
  const displayItems = useMemo(
    () => transformApiTasks(pagedData?.items ?? []),
    [pagedData]
  );
  const totalPages = pagedData?.totalPages ?? 1;
  const totalCount = pagedData?.total ?? 0;

  const isLoading = catalogLoading || pageLoading || projectsLoading;
  const error = catalogError;

  // ============================================================================
  // Modal State
  // ============================================================================
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [schedulingTaskId, setSchedulingTaskId] = useState<string | null>(null);

  // ============================================================================
  // Selection State (for bulk operations)
  // ============================================================================
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  // ============================================================================
  // Drag and Drop State
  // ============================================================================
  const { executeCommand } = useUndoRedo();
  const {
    draggedTask,
    draggedTaskIds,
    handleDragStart,
    handleDragEnd,
    handleDropOnSection,
    handleDragOver,
  } = useTodosDragDrop({
    updateTaskMutation,
    executeCommand,
    selectedTaskIds,
    allTasks: tasks,
  });

  // ============================================================================
  // Task Expansion State (for subtasks)
  // ============================================================================
  const { expandedTasks, toggleTaskExpansion } = useTaskExpansion();

  // displayItems / totalPages / totalCount are derived from the server-paginated
  // response (computed above near the hooks section).

  // ============================================================================
  // Task Handlers
  // ============================================================================

  const handleTaskClick = useCallback((taskId: string) => {
    setEditingTaskId(taskId);
    setShowEditModal(true);
  }, []);

  const handleScheduleConfirm = useCallback((start: Date, end: Date) => {
    if (!schedulingTaskId) return;
    const dueDate = start.toISOString().split('T')[0];
    updateTaskMutation.mutate(
      {
        id: schedulingTaskId,
        updates: {
          due_date: dueDate,
          scheduled_start: start.toISOString(),
          scheduled_end: end.toISOString(),
          status: 'scheduled',
        },
      },
      {
        onSuccess: () => {
          showToast(`Task scheduled! 📅`, 'success');
          setSchedulingTaskId(null);
        },
        onError: () => {
          showToast('Failed to schedule task', 'error');
        },
      }
    );
  }, [schedulingTaskId, updateTaskMutation, showToast]);

  const handleClearSchedule = useCallback(() => {
    if (!schedulingTaskId) return;
    updateTaskMutation.mutate(
      {
        id: schedulingTaskId,
        updates: {
          scheduled_start: null,
          scheduled_end: null,
          status: 'todo',
        },
      },
      {
        onSuccess: () => {
          showToast('Schedule cleared', 'success');
          setSchedulingTaskId(null);
        },
      }
    );
  }, [schedulingTaskId, updateTaskMutation, showToast]);

  const handleEditSubmit = useCallback(async (data: Partial<TaskData>) => {
    if (!editingTaskId) return;

    updateTaskMutation.mutate(
      { id: editingTaskId, updates: data },
      {
        onSuccess: async (updatedTask) => {
          // Schedule reminder if set
          if (updatedTask?.reminder && updatedTask.id && updatedTask.title) {
            try {
              await reminderService.scheduleReminder({
                type: 'task_upcoming',
                title: 'Task Reminder',
                body: updatedTask.title,
                scheduledFor: new Date(updatedTask.reminder),
                priority: 'normal',
                entityType: 'task',
                entityId: updatedTask.id,
                actions: [
                  { action: 'open', title: 'View Task' },
                  { action: 'dismiss', title: 'Dismiss' },
                ],
              });
            } catch (error) {
              logger.error('Tasks', 'Failed to schedule reminder', { error });
            }
          }

          showToast('Task updated successfully! ✅', 'success');
          setShowEditModal(false);
          setEditingTaskId(null);
        },
        onError: (error) => {
          showToast(`Failed to update task: ${error.message}`, 'error');
        },
      }
    );
  }, [editingTaskId, updateTaskMutation, showToast]);

  const handleDeleteTask = useCallback(() => {
    if (!editingTaskId) return;

    deleteTaskMutation.mutate(editingTaskId, {
      onSuccess: () => {
        showToast('Task permanently deleted! 🗑️', 'success');
        setShowEditModal(false);
        setEditingTaskId(null);
      },
      onError: (error) => {
        showToast(`Failed to delete task: ${error.message}`, 'error');
      },
    });
  }, [editingTaskId, deleteTaskMutation, showToast]);

  const handleToggleStatus = useCallback((taskId: string) => {
    const task = catalogData.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'done' ? 'todo' : 'done';

    updateTaskMutation.mutate(
      { id: taskId, updates: { status: newStatus } },
      {
        onSuccess: () => {
          showToast(newStatus === 'done' ? 'Task completed! 🎉' : 'Task reopened! 🔄', 'success');
        },
        onError: (error) => {
          showToast(`Failed to update task: ${error.message}`, 'error');
        },
      }
    );
  }, [catalogData, updateTaskMutation, showToast]);

  const handleToggleSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    const task = allTasks.find(t => t.id === taskId);
    if (!task?.follow_up_tasks) return;

    const updatedSubtasks = task.follow_up_tasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    updateTaskMutation.mutate(
      { id: taskId, updates: { follow_up_tasks: updatedSubtasks } },
      {
        onSuccess: () => {
          const subtask = updatedSubtasks.find(st => st.id === subtaskId);
          showToast(subtask?.completed ? 'Subtask completed! ✅' : 'Subtask reopened! 🔄', 'success');
        },
        onError: (error) => {
          showToast(`Failed to update subtask: ${error.message}`, 'error');
        },
      }
    );
  }, [allTasks, updateTaskMutation, showToast]);

  const handleSelectTask = useCallback((taskId: string) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const allTaskIds = displayItems.map(t => t.id || '').filter(Boolean);
    setSelectedTaskIds(new Set(allTaskIds));
  }, [displayItems]);

  const handleDeselectAll = useCallback(() => {
    setSelectedTaskIds(new Set());
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedTaskIds.size === 0) return;

    const count = selectedTaskIds.size;
    const confirmed = window.confirm(`Are you sure you want to delete ${count} task${count > 1 ? 's' : ''}?`);

    if (!confirmed) return;

    // Delete all selected tasks
    const deletePromises = Array.from(selectedTaskIds).map(taskId =>
      deleteTaskMutation.mutateAsync(taskId)
    );

    Promise.all(deletePromises)
      .then(() => {
        showToast(`${count} task${count > 1 ? 's' : ''} deleted successfully! 🗑️`, 'success');
        setSelectedTaskIds(new Set());
        setIsSelectionMode(false);
      })
      .catch((error) => {
        showToast(`Failed to delete tasks: ${error.message}`, 'error');
      });
  }, [selectedTaskIds, deleteTaskMutation, showToast]);

  // ============================================================================
  // Loading and Error States
  // ============================================================================

  if (isLoading) {
    return <TodosLoadingState />;
  }

  if (error) {
    return <TodosErrorState />;
  }

  // ============================================================================
  // Get editing task data
  // ============================================================================
  const editingTask = editingTaskId ? catalogData.find(t => t.id === editingTaskId) : undefined;

  // taskCount comes from the server total for the current filter set.
  const taskCount = totalCount;

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Header */}
        <TasksHeaderV2 />

        {/* Owner Filter - Show only in merged mode */}
        {mergedConnection && (
          <div className="mb-4">
            <OwnerFilter
              value={ownerFilter}
              onChange={setOwnerFilter}
              partnerName={partnerName}
            />
          </div>
        )}

        {/* View Selector */}
        <ViewSelectorV2
          activeView={activeView}
          onChange={setActiveView}
        />

        {/* Action Buttons - Filter & Selection Mode */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: showFilters
                ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                : colors.bg.secondary,
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: showFilters ? '#C18B5E' : 'transparent',
              color: showFilters ? '#C18B5E' : colors.text.secondary,
            }}
          >
            {showFilters ? '🔍 Hide Filters' : '🔍 Show Filters'}
          </button>

          <button
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              setSelectedTaskIds(new Set());
            }}
            className="px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
            style={{
              background: isSelectionMode
                ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                : colors.bg.secondary,
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: isSelectionMode ? '#C18B5E' : 'transparent',
              color: isSelectionMode ? '#C18B5E' : colors.text.secondary,
            }}
          >
            <CheckSquare className="w-4 h-4" />
            {isSelectionMode ? 'Cancel Selection' : 'Select Tasks'}
          </button>
        </div>

        {/* Bulk Action Bar - Show when tasks are selected */}
        {isSelectionMode && selectedTaskIds.size > 0 && (
          <div
            className="mb-4 p-4 rounded-xl flex items-center justify-between"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.2) 0%, rgba(193, 139, 94, 0.2) 100%)',
              border: '2px solid #C18B5E',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold" style={{ color: colors.text.primary }}>
                {selectedTaskIds.size} task{selectedTaskIds.size > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleSelectAll}
                className="text-sm px-3 py-1 rounded-lg hover:bg-white/50 transition-colors"
                style={{ color: '#C18B5E' }}
              >
                Select All ({taskCount})
              </button>
              <button
                onClick={handleDeselectAll}
                className="text-sm px-3 py-1 rounded-lg hover:bg-white/50 transition-colors"
                style={{ color: '#C18B5E' }}
              >
                Deselect All
              </button>
            </div>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 rounded-xl font-semibold text-white transition-all flex items-center gap-2 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }}
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          </div>
        )}

        {/* Filter Bar - Conditional */}
        {showFilters && (
          <FilterBarV2
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            projectFilter={projectFilter}
            onProjectFilterChange={setProjectFilter}
            projects={projects.map(p => ({ id: p.id, name: p.name, color: p.color }))}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showStarredOnly={showStarredOnly}
            onToggleStarred={() => setShowStarredOnly(!showStarredOnly)}
          />
        )}

        {/* Task Count Summary */}
        <div className="mb-4 text-sm" style={{ color: colors.text.secondary }}>
          {taskCount} task{taskCount !== 1 ? 's' : ''}
          {totalPages > 1 && ` • page ${page} of ${totalPages}`}
        </div>

        {/* Content Area - List View */}
        <TaskListViewV2
          tasks={displayItems}
          projects={projects}
          onTaskClick={handleTaskClick}
          onToggleStatus={handleToggleStatus}
          isUpdating={updateTaskMutation.isPending}
          isSelectionMode={isSelectionMode}
          selectedTaskIds={selectedTaskIds}
          onSelectTask={handleSelectTask}
          draggedTask={draggedTask}
          draggedTaskIds={draggedTaskIds}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDropOnSection={handleDropOnSection}
          onDragOver={handleDragOver}
          expandedTasks={expandedTasks}
          onToggleExpanded={toggleTaskExpansion}
          onToggleSubtask={handleToggleSubtask}
          allTasks={allTasks}
          onScheduleClick={setSchedulingTaskId}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <PaginationV2
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalCount}
            pageSize={DEFAULT_PAGE_SIZE}
            onPageChange={setPage}
          />
        )}

        {/* Quick Add Modal */}
        <QuickAddModalV2
          isOpen={showQuickAdd}
          onClose={() => setShowQuickAdd(false)}
          onSubmit={async (text, options) => {
            // Set due date based on current view (use local date, not UTC)
            const today = format(new Date(), 'yyyy-MM-dd');
            const dueDate = activeView === 'today' ? today : null;

            try {
              await createTaskMutation.mutateAsync(
                {
                  title: text.trim(),
                  status: 'todo',
                  priority: 'medium',
                  category: 'personal',
                  due_date: dueDate,
                  recurrence_pattern: options?.recurrence_pattern ?? 'none',
                } as Omit<TaskData, 'id' | 'created_at' | 'updated_at'>
              );
              showToast('Task created successfully! ✅', 'success');
            } catch (error) {
              showToast(`Failed to create task: ${(error as Error).message}`, 'error');
              throw error; // Re-throw to prevent modal from closing on error
            }
          }}
          isPending={createTaskMutation.isPending}
          onOpenFullForm={() => {
            setShowQuickAdd(false);
            setShowEditModal(true);
          }}
        />

        {/* Full Edit Modal */}
        <TaskFormModalV2
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingTaskId(null);
          }}
          onSubmit={handleEditSubmit}
          onDelete={handleDeleteTask}
          initialData={editingTask}
          projects={projects}
          allTasks={allTasks}
          isEditing={!!editingTaskId}
          isPending={updateTaskMutation.isPending || deleteTaskMutation.isPending}
        />
      </div>

      {/* Task Schedule Modal */}
      {schedulingTaskId && (() => {
        const schedulingTask = allTasks.find(t => t.id === schedulingTaskId);
        return schedulingTask ? (
          <TaskScheduleModal
            task={schedulingTask}
            onSchedule={handleScheduleConfirm}
            onClearSchedule={handleClearSchedule}
            onClose={() => setSchedulingTaskId(null)}
          />
        ) : null;
      })()}

      {/* V2 FAB for Quick Add - Positioned outside container for proper viewport positioning */}
      <FABV2
        icon={Plus}
        onClick={() => setShowQuickAdd(true)}
        position="bottom-left"
        ariaLabel="Add Task"
      />
    </div>
  );
};

const Todos: React.FC = () => {
  return (
    <FeatureErrorBoundary feature="Tasks">
      <TodosContent />
    </FeatureErrorBoundary>
  );
};

export default Todos;
