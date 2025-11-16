/**
 * Challenge Setup Form
 *
 * Allows users to customize tasks before starting their 75 Hard challenge.
 * - Pre-filled with 5 default tasks
 * - Can edit titles and descriptions
 * - Can add custom tasks (up to 20)
 * - Can remove tasks (minimum 1)
 * - Tasks are locked once challenge starts
 */

import React, { useState } from 'react';
import { X, Plus, GripVertical } from 'lucide-react';
import { DEFAULT_TASKS, validateTasks, type Task } from '../../../types/seventyFiveHard';

interface ChallengeSetupFormProps {
  onSubmit: (tasks: Omit<Task, 'id'>[]) => Promise<void>;
  onCancel: () => void;
}

export default function ChallengeSetupForm({ onSubmit, onCancel }: ChallengeSetupFormProps) {
  const [tasks, setTasks] = useState<Omit<Task, 'id'>[]>(
    DEFAULT_TASKS.map((t, i) => ({ ...t, order: i + 1 }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTask = () => {
    if (tasks.length >= 20) {
      setError('Maximum 20 tasks allowed');
      return;
    }

    setTasks([
      ...tasks,
      {
        title: '',
        description: '',
        order: tasks.length + 1
      }
    ]);
    setError(null);
  };

  const handleRemoveTask = (index: number) => {
    if (tasks.length <= 1) {
      setError('At least one task is required');
      return;
    }

    const updated = tasks.filter((_, i) => i !== index);
    // Re-order remaining tasks
    setTasks(updated.map((t, i) => ({ ...t, order: i + 1 })));
    setError(null);
  };

  const handleUpdateTask = (index: number, field: 'title' | 'description', value: string) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validationError = validateTasks(tasks);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create challenge');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-hidden">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Start 75 Hard Challenge
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Customize your tasks below. They'll be locked once you start.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tasks */}
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  {/* Drag handle (visual only for now) */}
                  <div className="flex-shrink-0 text-gray-400 mt-2">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Task number */}
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-semibold text-sm mt-1">
                    {index + 1}
                  </div>

                  {/* Inputs */}
                  <div className="flex-1 space-y-2">
                    {/* Title */}
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => handleUpdateTask(index, 'title', e.target.value)}
                      placeholder="Task title (required)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      maxLength={100}
                      required
                      disabled={isSubmitting}
                    />

                    {/* Description */}
                    <input
                      type="text"
                      value={task.description}
                      onChange={(e) => handleUpdateTask(index, 'description', e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      maxLength={200}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(index)}
                    className="flex-shrink-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 mt-2"
                    disabled={isSubmitting || tasks.length === 1}
                    title={tasks.length === 1 ? 'At least one task required' : 'Remove task'}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add task button */}
          {tasks.length < 20 && (
            <button
              type="button"
              onClick={handleAddTask}
              className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 flex items-center justify-center gap-2 transition-colors"
              disabled={isSubmitting}
            >
              <Plus className="w-5 h-5" />
              Add Custom Task
            </button>
          )}

          {/* Task count */}
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {tasks.length} of 20 tasks
          </p>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Starting...' : 'Start Challenge'}
          </button>
        </div>
      </div>
    </div>
  );
}
