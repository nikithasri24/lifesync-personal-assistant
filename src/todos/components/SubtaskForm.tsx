/**
 * SubtaskForm Component
 *
 * An inline form for creating subtasks under a parent task.
 * Provides a simple input with add/cancel actions.
 */

import React from 'react';

interface SubtaskFormProps {
  /** ID of the parent task */
  parentId: string;
  /** Current input value */
  value: string;
  /** Called when the input value changes */
  onChange: (value: string) => void;
  /** Called when the form is submitted */
  onSubmit: () => void;
  /** Called when the form is cancelled */
  onCancel: () => void;
  /** Whether a submission is in progress */
  isLoading: boolean;
}

/**
 * SubtaskForm - Inline form for creating subtasks
 */
export function SubtaskForm({
  _parentId,
  value,
  onChange,
  onSubmit,
  onCancel,
  isLoading
}: SubtaskFormProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="px-6 pb-3">
      <div className="ml-10 flex items-center space-x-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Subtask name"
          disabled={isLoading}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
          autoFocus
        />
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Adding...' : 'Add'}
        </button>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-3 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-sm transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
