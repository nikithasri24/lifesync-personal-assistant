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

import React, { useMemo, useCallback, useState } from 'react';
import { Plus, CheckSquare, Trash2, X } from 'lucide-react';
import { useApiHealth } from '../hooks/useApiHealth';
import {
  useTasks,
  useProjects,
  useCreateTask,
  useUpdateTask,
  usePermanentlyDeleteTask,
  useMergedTasksConnectionQuery,
} from '../hooks/useTasksQuery';
import type { TaskData } from '../services/types';
import { OwnerFilter, type OwnerFilterValue } from '../components/common/OwnerFilter';
import { useCurrentUserId, usePartnerName } from '../utils/ownerUtils';
import { useThemeColors } from '../hooks/useThemeColors';
import { useToast } from '../hooks/useToast';
import { FeatureErrorBoundary } from '../components/FeatureErrorBoundary';
import { useUndoRedo } from '../contexts/UndoRedoContext';
import { useTodosDragDrop } from '../todos/hooks';

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

// Import legacy views (Kanban and Matrix not yet V2)
import { KanbanView, MatrixView } from '../todos/components';
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

const TodosContent: React.FC = () => {
  // ============================================================================
  // Theme and UI
  // ============================================================================
  const colors = useThemeColors();
  const { showToast } = useToast();

  // ============================================================================
  // React Query Hooks - Server State Management
  // ============================================================================
  const { data: apiTasks = [], isLoading: tasksLoading, error: tasksError } = useTasks();
  const { data: apiProjects = [], isLoading: projectsLoading } = useProjects();

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = usePermanentlyDeleteTask();

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
  // View State
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
  // Modal State
  // ============================================================================
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

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
  // Computed Values - Filtered and View-Specific Tasks
  // ============================================================================

  // Get tasks for current view
  const viewTasks = useMemo(() => {
    let baseTasks = tasks;

    // Apply view-specific filtering first
    if (activeView === 'today') {
      baseTasks = getTodayTasks(tasks);
    } else if (activeView === 'inbox') {
      baseTasks = getInboxTasks(tasks);
    } else if (activeView === 'upcoming') {
      baseTasks = getUpcomingTasks(tasks);
    }

    // Apply filters (priority, status, project, search, starred)
    const filters = {
      priority: priorityFilter,
      status: statusFilter,
      project: projectFilter,
      starred: showStarredOnly,
    };

    return applyFilters(baseTasks, filters, searchQuery);
  }, [tasks, activeView, priorityFilter, statusFilter, projectFilter, searchQuery, showStarredOnly]);

  // ============================================================================
  // Task Handlers
  // ============================================================================

  const handleTaskClick = useCallback((taskId: string) => {
    setEditingTaskId(taskId);
    setShowEditModal(true);
  }, []);

  const handleEditSubmit = useCallback((data: Partial<TaskData>) => {
    if (!editingTaskId) return;

    updateTaskMutation.mutate(
      { id: editingTaskId, updates: data },
      {
        onSuccess: () => {
          showToast('Task updated successfully! ✅', 'success');
          setShowEditModal(false);
          setEditingTaskId(null);
        },
        onError: (error) => {
          showToast(`Failed to update task: ${error.message}`, 'error');
        },
      }
    );
  }, [editingTaskId, updateTaskMutation]);

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
    const task = apiTasks.find(t => t.id === taskId);
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
  }, [apiTasks, updateTaskMutation, showToast]);

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
    const allTaskIds = viewTasks.map(t => t.id || '').filter(Boolean);
    setSelectedTaskIds(new Set(allTaskIds));
  }, [viewTasks]);

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

  if (tasksLoading || projectsLoading) {
    return <TodosLoadingState />;
  }

  if (tasksError) {
    return <TodosErrorState />;
  }

  // ============================================================================
  // Get editing task data
  // ============================================================================
  const editingTask = editingTaskId ? apiTasks.find(t => t.id === editingTaskId) : undefined;

  // ============================================================================
  // Computed Values
  // ============================================================================
  const taskCount = viewTasks.length;
  const completedCount = viewTasks.filter(t => t.status === 'done').length;

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
          {completedCount > 0 && ` • ${completedCount} completed`}
        </div>

        {/* Content Area - View-Specific Rendering */}
        <div>
          {activeView === 'kanban' ? (
            <KanbanView
              tasks={viewTasks}
              projects={projects}
              selectedProject={projectFilter}
              onToggleStatus={handleToggleStatus}
              isUpdating={updateTaskMutation.isPending}
            />
          ) : activeView === 'matrix' ? (
            <MatrixView
              tasks={viewTasks}
              projects={projects}
              selectedProject={projectFilter}
              onToggleStatus={handleToggleStatus}
              isUpdating={updateTaskMutation.isPending}
            />
          ) : (
            <TaskListViewV2
              tasks={viewTasks}
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
            />
          )}
        </div>

        {/* Quick Add Modal */}
        <QuickAddModalV2
          isOpen={showQuickAdd}
          onClose={() => setShowQuickAdd(false)}
          onSubmit={async (text) => {
            // Set due date based on current view
            const today = new Date().toISOString().split('T')[0];
            const dueDate = activeView === 'today' ? today : null;

            try {
              await createTaskMutation.mutateAsync(
                {
                  title: text.trim(),
                  status: 'todo',
                  priority: 'medium',
                  category: 'personal',
                  due_date: dueDate,
                } as Omit<TaskData, 'id' | 'created_at' | 'updated_at'>
              );
              showToast('Task created successfully! ✅', 'success');
            } catch (error) {
              showToast(`Failed to create task: ${(error as Error).message}`, 'error');
              throw error; // Re-throw to prevent modal from closing on error
            }
          }}
          isPending={createTaskMutation.isPending}
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
          isEditing={!!editingTaskId}
          isPending={updateTaskMutation.isPending || deleteTaskMutation.isPending}
        />
      </div>

      {/* V2 FAB for Quick Add - Positioned outside container for proper viewport positioning */}
      <FABV2
        icon={Plus}
        onClick={() => setShowQuickAdd(true)}
        position="bottom-right"
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
