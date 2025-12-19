/**
 * TaskScheduler - Complete Task Management System
 * Combines professional scheduling views with full task management capabilities
 *
 * Features:
 * - Board View (Kanban with drag-and-drop)
 * - Timeline View (Gantt chart)
 * - List View (Spreadsheet-style)
 * - Matrix View (Eisenhower Matrix)
 * - Traditional Task List
 * - Full CRUD operations
 * - Quick add & inline editing
 * - Pomodoro timer
 * - Advanced filtering
 * - Search functionality
 * - Project organization
 */

import React, { useState, useMemo } from 'react';

// Scheduler Components
import { BoardView } from '../scheduler/components/BoardView';
import { TaskEditModal } from '../scheduler/components/TaskEditModal';

// Layout Components
import { TaskSchedulerHeader } from '../scheduler/components/layout/TaskSchedulerHeader';
import { StatsBar } from '../scheduler/components/layout/StatsBar';
import { HelpTipBanner } from '../scheduler/components/layout/HelpTipBanner';
import { TaskSchedulerLoadingState } from '../scheduler/components/layout/TaskSchedulerLoadingState';
import { TaskSchedulerErrorState } from '../scheduler/components/layout/TaskSchedulerErrorState';

// Task Management Components
import {
  FilterPanel,
  QuickAddForm,
} from '../todos/components';

// Hooks
import {
  useTasks,
  useProjects,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from '../hooks/useTasksQuery';
import {
  useTaskModals,
  useTaskExpansion,
  usePomodoro,
  useTaskFilters,
  useTaskEditing,
} from '../todos/hooks';
import { useApiHealth } from '../hooks/useApiHealth';

// Types
import type {
  ScheduledTask,
  BoardColumn,
  TeamMember,
  Milestone,
} from '../scheduler/types';
import type { TaskData } from '../services/types';

// Utilities
import { transformApiTasks, transformApiProjects } from '../todos/utils';
import { applyFilters } from '../todos/services/taskFilters';
import {
  getTodayTasks,
  getUpcomingTasks,
  getInboxTasks,
  parseQuickAdd,
} from '../todos/services/taskHelpers';

const TaskScheduler: React.FC = () => {
  // ============================================================================
  // State Management
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [createTaskColumnId, setCreateTaskColumnId] = useState<string | null>(null);

  // ============================================================================
  // React Query Hooks - Server State
  // ============================================================================

  const { data: apiTasks = [], isLoading: tasksLoading, error: tasksError } = useTasks();
  const { data: apiProjects = [], isLoading: projectsLoading } = useProjects();

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  // Note: API health check disabled - using Supabase instead of REST API
  // const apiHealth = useApiHealth(15000);
  const isLoading = tasksLoading || projectsLoading;

  // ============================================================================
  // Data Transformation
  // ============================================================================

  const tasks = useMemo(() => transformApiTasks(apiTasks), [apiTasks]);
  const projects = useMemo(() => transformApiProjects(apiProjects), [apiProjects]);

  // ============================================================================
  // Custom Hooks - Client State
  // ============================================================================

  const modals = useTaskModals();
  const expansion = useTaskExpansion();
  const pomodoro = usePomodoro();
  const filters = useTaskFilters();

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
  // Mock Data
  // ============================================================================

  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: '',
      role: 'Developer',
      workload: 32,
      capacity: 40,
    },
  ];

  const milestones: Milestone[] = [
    {
      id: '1',
      name: 'MVP Release',
      description: 'Initial product release',
      dueDate: '2025-12-31',
      status: 'active',
      color: '#3b82f6',
      progress: 45,
      createdAt: new Date().toISOString(),
    },
  ];

  // ============================================================================
  // Transform Tasks for Scheduler Views
  // ============================================================================

  const scheduledTasks: ScheduledTask[] = useMemo(() => {
    return apiTasks.map(task => ({
      ...task,
      progress: task.status === 'done' ? 100 : task.status === 'in_progress' ? 50 : 0,
      assignees: [],
      dependencies: [],
      timeEntries: [],
      comments: [],
      activity: [],
    }));
  }, [apiTasks]);

  // ============================================================================
  // Filtered Tasks
  // ============================================================================

  const filteredTasks = useMemo(() => {
    let filtered = scheduledTasks;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }

    // Status filter (exclude deleted and archived by default)
    filtered = filtered.filter(task => !task.deleted && !task.archived);

    return filtered;
  }, [scheduledTasks, searchQuery]);

  // ============================================================================
  // Board Configuration (must be after filteredTasks)
  // ============================================================================

  // Separate tasks into backlog and todo based on priority and due date
  // Backlog: Only todo items with NO due date AND low/medium priority
  const backlogTasks = useMemo(() => {
    return filteredTasks.filter(task =>
      task.status === 'todo' &&
      !task.due_date &&
      (task.priority === 'low' || task.priority === 'medium')
    ).map(t => t.id).filter((id): id is string => id !== undefined);
  }, [filteredTasks]);

  // ToDo: Todo items that are NOT in backlog (have due date OR high/urgent priority)
  const todoTasks = useMemo(() => {
    const backlogSet = new Set(backlogTasks);
    return filteredTasks.filter(task =>
      task.status === 'todo' &&
      task.id !== undefined &&
      !backlogSet.has(task.id)
    ).map(t => t.id).filter((id): id is string => id !== undefined);
  }, [filteredTasks, backlogTasks]);

  const boardColumns: BoardColumn[] = useMemo(() => [
    {
      id: 'backlog',
      title: 'Backlog',
      status: 'todo',
      color: '#94a3b8',
      taskIds: backlogTasks,
      order: 0,
    },
    {
      id: 'todo',
      title: 'To Do',
      status: 'todo',
      color: '#3b82f6',
      taskIds: todoTasks,
      order: 1,
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      status: 'in_progress',
      color: '#8b5cf6',
      taskIds: filteredTasks.filter(t => t.status === 'in_progress').map(t => t.id).filter((id): id is string => id !== undefined),
      order: 2,
    },
    {
      id: 'review',
      title: 'Review',
      status: 'waiting',
      color: '#f59e0b',
      taskIds: filteredTasks.filter(t => t.status === 'waiting').map(t => t.id).filter((id): id is string => id !== undefined),
      order: 3,
    },
    {
      id: 'done',
      title: 'Done',
      status: 'done',
      color: '#10b981',
      taskIds: filteredTasks.filter(t => t.status === 'done').map(t => t.id).filter((id): id is string => id !== undefined),
      order: 4,
    },
  ], [backlogTasks, todoTasks, filteredTasks]);

  // Get tasks for traditional view
  const viewTasks = useMemo(() => {
    let baseTasks = tasks;

    if (filters.currentView === 'today') {
      baseTasks = getTodayTasks(tasks);
    } else if (filters.currentView === 'inbox') {
      baseTasks = getInboxTasks(tasks);
    } else if (filters.currentView === 'upcoming') {
      baseTasks = getUpcomingTasks(tasks);
    } else if (filters.selectedProject !== 'all') {
      baseTasks = tasks.filter(t => t.projectId === filters.selectedProject && t.status !== 'done');
    }

    return applyFilters(baseTasks, filters.filters, filters.searchQuery);
  }, [tasks, filters.currentView, filters.selectedProject, filters.filters, filters.searchQuery]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleTaskClick = (task: ScheduledTask) => {
    setSelectedTaskId(task.id ?? null);
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleStartTimer = (taskId: string) => {
    pomodoro.startPomodoro(taskId);
  };

  const handleCreateTask = (columnId?: string) => {
    // Store which column we're creating from
    setCreateTaskColumnId(columnId || null);
    modals.openQuickAdd();
  };

  const handleSaveTask = (taskId: string, updates: Partial<TaskData>) => {
    updateTaskMutation.mutate({
      id: taskId,
      updates,
    }, {
      onSuccess: () => {
        setShowEditModal(false);
        setEditingTask(null);
      },
    });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId, {
      onSuccess: () => {
        setShowEditModal(false);
        setEditingTask(null);
      },
    });
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingTask(null);
  };

  const handleTaskDrop = (result: { taskId: string; sourceColumn: string; targetColumn: string; newStatus?: string }) => {
    const task = scheduledTasks.find(t => t.id === result.taskId);
    if (!task || !result.newStatus) return;

    const updates: Partial<TaskData> = {
      status: result.newStatus as TaskData['status'],
    };

    // Special handling for Backlog vs ToDo columns
    // If dropping to "todo" column (not backlog), ensure it has high priority or due date
    if (result.targetColumn === 'todo' && result.newStatus === 'todo') {
      // If task doesn't have a due date and is low/medium priority, give it high priority
      // so it goes to ToDo instead of Backlog
      if (!task.due_date && (task.priority === 'low' || task.priority === 'medium')) {
        updates.priority = 'high';
      }
    }
    // If dropping to backlog, ensure it matches backlog criteria
    else if (result.targetColumn === 'backlog' && result.newStatus === 'todo') {
      // Remove due date and set to medium priority to keep it in backlog
      if (!updates.priority || updates.priority === 'high' || updates.priority === 'urgent') {
        updates.priority = 'medium';
      }
    }

    updateTaskMutation.mutate({
      id: result.taskId,
      updates,
    });
  };

  // ============================================================================
  // Loading & Error States
  // ============================================================================

  if (isLoading) {
    return <TaskSchedulerLoadingState />;
  }

  if (tasksError) {
    return <TaskSchedulerErrorState />;
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <TaskSchedulerHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          pomodoroTimer={pomodoro.pomodoroTimer}
          onTogglePomodoro={pomodoro.togglePomodoro}
          onCreateTask={() => handleCreateTask()}
          importantTaskCount={filteredTasks.filter(t => t.status !== 'done' && t.priority === 'important').length}
        />

        {/* Quick Add Form */}
        {modals.showQuickAdd && (
          <div className="px-6 pb-4">
            <QuickAddForm
              value={modals.quickAddText}
              onChange={modals.setQuickAddText}
              onSubmit={() => {
                if (!modals.quickAddText.trim()) return;

                // Parse the quick add text
                const parsed = parseQuickAdd(modals.quickAddText, projects);

                // Determine priority based on column
                let priority = parsed.priority;
                let status: TaskData['status'] = 'todo';

                if (createTaskColumnId === 'todo') {
                  // Tasks in ToDo should have high priority (or a due date)
                  // If no priority specified in text, default to high
                  if (!parsed.priority || parsed.priority === 'low' || parsed.priority === 'medium') {
                    priority = 'high';
                  }
                } else if (createTaskColumnId === 'backlog') {
                  // Tasks in Backlog should have medium/low priority and no due date by default
                  if (!parsed.priority) {
                    priority = 'medium';
                  }
                } else if (createTaskColumnId) {
                  // For other columns, set the appropriate status
                  const column = boardColumns.find(c => c.id === createTaskColumnId);
                  if (column?.status) {
                    status = column.status as TaskData['status'];
                  }
                }

                // Create the task with appropriate defaults
                createTaskMutation.mutate(
                  {
                    title: parsed.title,
                    description: '',
                    priority,
                    status,
                    estimated_time: 25,
                    actual_time: 0,
                    due_date: parsed.dueDate ? parsed.dueDate.toISOString() : null,
                    project_id: parsed.projectId ?? null,
                    tags: parsed.tags,
                    category: 'work',
                  },
                  {
                    onSuccess: () => {
                      modals.setQuickAddText('');
                      modals.closeQuickAdd();
                      setCreateTaskColumnId(null);
                    },
                  }
                );
              }}
              onCancel={() => {
                modals.closeQuickAdd();
                setCreateTaskColumnId(null);
              }}
              isLoading={createTaskMutation.isPending}
            />
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && (
          <div className="px-6 pb-4 border-t border-slate-200 dark:border-slate-700 pt-4">
            <FilterPanel
              filters={filters.filters}
              onFilterChange={filters.setFilters}
              onClearFilters={filters.resetFilters}
              isVisible={showFilters}
              onClose={() => setShowFilters(false)}
            />
          </div>
        )}

        {/* Stats Bar */}
        <StatsBar
          totalTasks={filteredTasks.length}
          inProgressTasks={filteredTasks.filter(t => t.status === 'in_progress').length}
          completedTasks={filteredTasks.filter(t => t.status === 'done').length}
        />
      </div>

      {/* Main Content - Board View Only */}
      <div className="flex-1 min-h-0">
        <BoardView
          tasks={filteredTasks}
          columns={boardColumns}
          teamMembers={teamMembers}
          onTaskClick={handleTaskClick}
          onTaskDrop={handleTaskDrop}
          onCreateTask={handleCreateTask}
          onStartTimer={handleStartTimer}
        />
      </div>

      {/* Help Text */}
      <HelpTipBanner />

      {/* Task Edit Modal */}
      <TaskEditModal
        task={editingTask}
        projects={apiProjects}
        allTasks={apiTasks}
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        isSaving={updateTaskMutation.isPending || deleteTaskMutation.isPending}
      />
    </div>
  );
};

export default TaskScheduler;
