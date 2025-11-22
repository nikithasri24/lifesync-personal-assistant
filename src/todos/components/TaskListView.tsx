/**
 * TaskListView Component
 *
 * Main task list rendering orchestration.
 * Handles displaying tasks, subtasks, forms, and empty states.
 */

import React from 'react';
import { Plus } from 'lucide-react';
import type { Task, Project, PomodoroTimer } from '../types';
import { TaskRow } from './TaskRow';
import { SubtaskRow } from './SubtaskRow';
import { SubtaskForm } from './SubtaskForm';
import { EmptyState } from './EmptyState';
import { getMainTasks, getSubtasks } from '../services/taskHelpers';

interface TaskListViewProps {
  /** Filtered tasks to display */
  tasks: Task[];
  /** List of all projects */
  projects: Project[];
  /** ID of task being edited */
  editingTask: string | null;
  /** Current edit text value */
  editTaskText: string;
  /** Called when edit text changes */
  onEditChange: (text: string) => void;
  /** Called when task status is toggled */
  onToggleStatus: (taskId: string) => void;
  /** Called when edit mode is started */
  onStartEdit: (task: Task) => void;
  /** Called when edit is saved */
  onSaveEdit: (taskId: string) => void;
  /** Called when edit is cancelled */
  onCancelEdit: () => void;
  /** Set of expanded task IDs */
  expandedTasks: Set<string>;
  /** Called when task expansion is toggled */
  onToggleExpansion: (taskId: string) => void;
  /** All tasks (including subtasks) for computing subtasks */
  allTasks: Task[];
  /** ID of task with active subtask form */
  activeSubtaskForm: string | null;
  /** Draft text for subtask forms */
  subtaskDrafts: Record<string, string>;
  /** Called when subtask draft text changes */
  onSubtaskDraftChange: (parentId: string, text: string) => void;
  /** Called when subtask form is submitted */
  onAddSubtask: (parentId: string) => void;
  /** Called when subtask form is opened */
  onStartSubtaskForm: (parentId: string) => void;
  /** Called when subtask form is cancelled */
  onCancelSubtaskForm: () => void;
  /** Current pomodoro timer state */
  pomodoroTimer: PomodoroTimer;
  /** Called when pomodoro is started */
  onStartPomodoro: (taskId: string) => void;
  /** Create task mutation object */
  createTaskMutation: {
    isPending: boolean;
    isError: boolean;
  };
  /** Update task mutation object */
  updateTaskMutation: {
    isPending: boolean;
  };
  /** Whether quick add form is visible */
  showQuickAdd: boolean;
  /** Current quick add input text */
  quickAddText: string;
  /** Called when quick add text changes */
  onQuickAddChange: (text: string) => void;
  /** Called when quick add form is submitted */
  onQuickAddSubmit: () => void;
  /** Called when quick add form is cancelled */
  onQuickAddCancel: () => void;
  /** Current view type for empty state */
  currentView: 'today' | 'inbox' | 'upcoming' | 'kanban' | 'matrix';
}

/**
 * TaskListView - Orchestrates rendering of task list with all interactions
 */
export function TaskListView({
  tasks,
  projects,
  editingTask,
  editTaskText,
  onEditChange,
  onToggleStatus,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  expandedTasks,
  onToggleExpansion,
  allTasks,
  activeSubtaskForm,
  subtaskDrafts,
  onSubtaskDraftChange,
  onAddSubtask,
  onStartSubtaskForm,
  onCancelSubtaskForm,
  pomodoroTimer,
  onStartPomodoro,
  createTaskMutation,
  updateTaskMutation,
  showQuickAdd,
  quickAddText,
  onQuickAddChange,
  onQuickAddSubmit,
  onQuickAddCancel,
  currentView
}: TaskListViewProps) {
  const mainTasks = getMainTasks(tasks);

  return (
    <div className="py-4">
      {/* Task List */}
      {mainTasks.map((task) => {
        const project = projects.find(p => p.id === task.projectId);
        const subtasks = getSubtasks(allTasks, task.id);
        const isExpanded = expandedTasks.has(task.id);

        return (
          <div key={task.id} className="mb-2">
            {/* Main Task Row */}
            <TaskRow
              task={task}
              project={project}
              isEditing={editingTask === task.id}
              editText={editTaskText}
              onEditChange={onEditChange}
              onToggleStatus={onToggleStatus}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onStartPomodoro={onStartPomodoro}
              onAddSubtask={onStartSubtaskForm}
              onToggleExpansion={onToggleExpansion}
              pomodoroTimer={pomodoroTimer}
              isUpdating={updateTaskMutation.isPending}
              isExpanded={isExpanded}
              hasSubtasks={subtasks.length > 0}
            />

            {/* Subtask Form */}
            {activeSubtaskForm === task.id && (
              <SubtaskForm
                parentId={task.id}
                value={subtaskDrafts[task.id] || ''}
                onChange={(text) => onSubtaskDraftChange(task.id, text)}
                onSubmit={() => onAddSubtask(task.id)}
                onCancel={onCancelSubtaskForm}
                isLoading={createTaskMutation.isPending}
              />
            )}

            {/* Subtasks */}
            {isExpanded && subtasks.length > 0 && (
              <div className="ml-10 border-l-2 border-gray-200 dark:border-slate-600 pl-4">
                {subtasks.map((subtask) => (
                  <SubtaskRow
                    key={subtask.id}
                    subtask={subtask}
                    onToggleStatus={onToggleStatus}
                    onStartEdit={onStartEdit}
                    isUpdating={updateTaskMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Empty State */}
      {mainTasks.length === 0 && (
        <EmptyState currentView={currentView} />
      )}

      {/* Quick Add at Bottom */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
        {!showQuickAdd ? (
          <button
            onClick={onQuickAddSubmit}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            <span>Add task</span>
          </button>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={quickAddText}
              onChange={(e) => onQuickAddChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onQuickAddSubmit();
                if (e.key === 'Escape') onQuickAddCancel();
              }}
              placeholder="What needs to be done?"
              disabled={createTaskMutation.isPending}
              className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              autoFocus
            />
            <div className="flex items-center space-x-3">
              <button
                onClick={onQuickAddSubmit}
                disabled={createTaskMutation.isPending}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors font-medium disabled:opacity-50"
              >
                {createTaskMutation.isPending ? 'Adding...' : 'Add task'}
              </button>
              <button
                onClick={onQuickAddCancel}
                disabled={createTaskMutation.isPending}
                className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <span className="text-gray-500 dark:text-slate-400 text-xs">
                Try natural language like "Call mom today"
              </span>
            </div>
            {createTaskMutation.isError && (
              <p className="text-xs text-red-600">Failed to create task. Please try again.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
