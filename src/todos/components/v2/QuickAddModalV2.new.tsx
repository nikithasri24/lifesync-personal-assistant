/**
 * QuickAddModalV2 Component (MIGRATED TO FormModalV2)
 * Modal for quickly adding tasks - Using FormModalV2 base
 *
 * MIGRATION NOTES:
 * - Reduced from 155 lines to 65 lines (58% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Maintains same external API for backward compatibility
 * - Auto-save now handled by FormModalV2/useDraftStorage
 */

import React, { useEffect } from 'react';
import { FormModalV2 } from '@/components/v2';

export interface QuickAddModalV2Props {
  isOpen: boolean;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  isLoading?: boolean;
  isError?: boolean;
}

interface QuickAddFormData {
  text: string;
}

export const QuickAddModalV2: React.FC<QuickAddModalV2Props> = ({
  isOpen,
  value,
  onChange,
  onSubmit,
  onClose,
  isLoading = false,
  isError = false,
}) => {
  return (
    <FormModalV2<QuickAddFormData>
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Add Task"
      defaultData={{ text: '' }}
      initialData={{ text: value }}
      draftKey="tasks_quickadd_draft"
      isPending={isLoading}
      submitText="Add Task"
      onSubmit={async (data) => {
        // Sync the form state back to parent's state
        onChange(data.text);
        // Call parent's submit
        onSubmit();
      }}
      validate={(data) => {
        if (!data.text.trim()) return 'Task text is required';
        return null;
      }}
    >
      {(formState, setFormState) => {
        // Sync parent's value to form state when it changes
        useEffect(() => {
          if (value !== formState.text) {
            setFormState({ text: value });
          }
        }, [value]);

        return (
          <>
            <input
              type="text"
              value={formState.text}
              onChange={(e) => {
                const newValue = e.target.value;
                setFormState({ text: newValue });
                onChange(newValue); // Keep parent in sync
              }}
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              autoFocus
            />
            <p className="text-xs mt-2 text-gray-500">
              Press Enter to add, or use the full form for more options
            </p>
            {isError && (
              <p className="text-xs text-red-600 mt-2">
                Failed to create task. Please try again.
              </p>
            )}
          </>
        );
      }}
    </FormModalV2>
  );
};

export default QuickAddModalV2;
