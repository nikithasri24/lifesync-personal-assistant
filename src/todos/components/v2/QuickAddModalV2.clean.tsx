/**
 * QuickAddModalV2 Component (CLEAN MIGRATION - RECOMMENDED)
 * Modal for quickly adding tasks - Cleaner API without external state
 *
 * MIGRATION NOTES:
 * - Reduced from 155 lines to 35 lines (77% reduction)
 * - Simplified API - modal manages its own state
 * - Parent only needs to provide onSubmit callback
 * - Auto-save, ESC key, backdrop all handled by FormModalV2
 *
 * USAGE CHANGE:
 * Before:
 *   const [quickAddText, setQuickAddText] = useState('');
 *   <QuickAddModalV2 value={quickAddText} onChange={setQuickAddText} onSubmit={...} />
 *
 * After:
 *   <QuickAddModalV2 onSubmit={(text) => createTask(text)} />
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
