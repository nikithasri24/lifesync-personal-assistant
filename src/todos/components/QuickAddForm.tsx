/**
 * QuickAddForm Component
 *
 * A reusable quick add form component for creating new tasks.
 * Used in both the sidebar and at the bottom of task lists.
 * Supports natural language input parsing and keyboard shortcuts.
 */

import React from 'react';

interface QuickAddFormProps {
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
  /** Error message to display */
  error?: string;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether to auto-focus the input */
  autoFocus?: boolean;
}

/**
 * QuickAddForm - Reusable task creation form with natural language support
 */
export function QuickAddForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  isLoading,
  error,
  placeholder = "What needs to be done?",
  autoFocus = false
}: QuickAddFormProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
        disabled={isLoading}
        autoFocus={autoFocus}
      />
      <div className="flex space-x-2">
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors font-medium disabled:opacity-50"
        >
          {isLoading ? 'Adding...' : 'Add'}
        </button>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-1.5 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-sm transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
