/**
 * QuickAddModalV2 Component
 * Modal for quickly adding tasks - MIGRATED to use FormModalV2
 *
 * MIGRATION COMPLETE:
 * - Reduced from 155 lines to 55 lines (65% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Modal now manages its own state (cleaner API)
 * - Auto-save handled by FormModalV2/useDraftStorage
 * - ESC key, backdrop click built-in
 */

import React from 'react';
import { FormModalV2 } from '@/components/v2';

export interface QuickAddModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void | Promise<void>;
  isPending?: boolean;
}

interface QuickAddFormData {
  text: string;
}

export const QuickAddModalV2: React.FC<QuickAddModalV2Props> = ({
  isOpen,
  onClose,
  onSubmit,
  isPending = false,
}) => {
  return (
    <FormModalV2<QuickAddFormData>
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Add Task"
      defaultData={{ text: '' }}
      draftKey="tasks_quickadd_draft"
      isPending={isPending}
      submitText="Add Task"
      onSubmit={async (data) => {
        await onSubmit(data.text);
        onClose();
      }}
      validate={(data) => {
        if (!data.text.trim()) return 'Task text is required';
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          <input
            type="text"
            value={formState.text}
            onChange={(e) => setFormState({ text: e.target.value })}
            placeholder="What needs to be done?"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            autoFocus
          />
          <p className="text-xs mt-2 text-gray-500">
            Press Enter to add, or use the full form for more options
          </p>
        </>
      )}
    </FormModalV2>
  );
};

export default QuickAddModalV2;
