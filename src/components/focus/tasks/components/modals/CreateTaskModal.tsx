/**
 * Create Task Modal Component
 * Modal for creating a new task
 */

import React, { useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { format } from 'date-fns';
import type { TaskView, ProjectView } from '../../types';

type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type TaskCategory = 'work' | 'personal' | 'learning' | 'creative' | 'health' | 'other';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  newTask: Partial<TaskView>;
  onTaskChange: (task: Partial<TaskView>) => void;
  onSubmit: () => void;
  projects: ProjectView[];
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  newTask,
  onTaskChange,
  onSubmit,
  projects
}) => {
  // All hooks must be called unconditionally at the top level
  const handleSubmit = useCallback((): void => {
    onSubmit();
  }, [onSubmit]);

  const handlePriorityChange = useCallback((e: ChangeEvent<HTMLSelectElement>): void => {
    const priority = e.target.value as TaskPriority;
    onTaskChange({ ...newTask, priority });
  }, [newTask, onTaskChange]);

  const handleDifficultyChange = useCallback((e: ChangeEvent<HTMLSelectElement>): void => {
    const difficulty = Number.parseInt(e.target.value, 10);
    onTaskChange({ ...newTask, difficulty });
  }, [newTask, onTaskChange]);

  const handleCategoryChange = useCallback((e: ChangeEvent<HTMLSelectElement>): void => {
    const category = e.target.value as TaskCategory;
    onTaskChange({ ...newTask, category });
  }, [newTask, onTaskChange]);

  const handleTitleChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    onTaskChange({ ...newTask, title: e.target.value });
  }, [newTask, onTaskChange]);

  const handleDescriptionChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>): void => {
    onTaskChange({ ...newTask, description: e.target.value });
  }, [newTask, onTaskChange]);

  const handleProjectChange = useCallback((e: ChangeEvent<HTMLSelectElement>): void => {
    onTaskChange({ ...newTask, projectId: e.target.value || undefined });
  }, [newTask, onTaskChange]);

  const handleEstimatedTimeChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    onTaskChange({ ...newTask, estimatedTime: Number.parseInt(e.target.value, 10) || 0 });
  }, [newTask, onTaskChange]);

  const handleDueDateChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    onTaskChange({
      ...newTask,
      dueDate: e.target.value ? new Date(e.target.value) : undefined
    });
  }, [newTask, onTaskChange]);

  const isSubmitDisabled = React.useMemo((): boolean => {
    return !newTask.title;
  }, [newTask.title]);

  const formattedDueDate = React.useMemo((): string => {
    return newTask.dueDate ? format(newTask.dueDate, 'yyyy-MM-dd') : '';
  }, [newTask.dueDate]);

  // Early return after all hooks have been called
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl border border-white/20 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Create New Task</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Task Title
            </label>
            <input
              id="task-title"
              type="text"
              value={newTask.title ?? ''}
              onChange={handleTitleChange}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label htmlFor="task-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <textarea
              id="task-description"
              value={newTask.description ?? ''}
              onChange={handleDescriptionChange}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              rows={3}
              placeholder="Describe the task..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-project" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Project
              </label>
              <select
                id="task-project"
                value={newTask.projectId ?? ''}
                onChange={handleProjectChange}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">No Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Priority
              </label>
              <select
                id="task-priority"
                value={newTask.priority ?? 'low'}
                onChange={handlePriorityChange}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="task-estimated-time" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Estimated Time (min)
              </label>
              <input
                id="task-estimated-time"
                type="number"
                value={newTask.estimatedTime ?? ''}
                onChange={handleEstimatedTimeChange}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                min="1"
              />
            </div>

            <div>
              <label htmlFor="task-difficulty" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Difficulty (1-5)
              </label>
              <select
                id="task-difficulty"
                value={newTask.difficulty ?? 1}
                onChange={handleDifficultyChange}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value={1}>1 - Very Easy</option>
                <option value={2}>2 - Easy</option>
                <option value={3}>3 - Medium</option>
                <option value={4}>4 - Hard</option>
                <option value={5}>5 - Very Hard</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Category
              </label>
              <select
                id="task-category"
                value={newTask.category ?? 'work'}
                onChange={handleCategoryChange}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="learning">Learning</option>
                <option value="creative">Creative</option>
                <option value="health">Health</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="task-due-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Due Date
            </label>
            <input
              id="task-due-date"
              type="date"
              value={formattedDueDate}
              onChange={handleDueDateChange}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="flex-1 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              Create Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
