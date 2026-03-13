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
  onSubmit: (text: string, options?: { recurrence_pattern?: string }) => void | Promise<void>;
  isPending?: boolean;
  onOpenFullForm?: () => void;
}

interface QuickAddFormData {
  text: string;
  recurrence: string;
}

export const QuickAddModalV2: React.FC<QuickAddModalV2Props> = ({
  isOpen,
  onClose,
  onSubmit,
  isPending = false,
  onOpenFullForm,
}) => {
  return (
    <FormModalV2<QuickAddFormData>
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Add Task"
      defaultData={{ text: '', recurrence: 'none' }}
      draftKey="tasks_quickadd_draft"
      isPending={isPending}
      submitText="Add Task"
      onSubmit={async (data) => {
        await onSubmit(data.text, { recurrence_pattern: data.recurrence !== 'none' ? data.recurrence : undefined });
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
            onChange={(e) => setFormState({ ...formState, text: e.target.value })}
            placeholder="What needs to be done?"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            autoFocus
          />
          {/* Repeat? quick picker */}
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 mb-1.5">Repeat?</p>
            <div className="flex gap-2">
              {(['none', 'daily', 'weekly'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFormState({ ...formState, recurrence: r })}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition-all border"
                  style={{
                    borderColor: formState.recurrence === r ? '#C18B5E' : '#E5E7EB',
                    backgroundColor: formState.recurrence === r ? 'rgba(212,165,116,0.12)' : 'transparent',
                    color: formState.recurrence === r ? '#C18B5E' : '#6B7280',
                  }}
                >
                  {r === 'none' ? 'No' : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs mt-2 text-gray-500">
            Press Enter to add, or{' '}
            {onOpenFullForm ? (
              <button
                type="button"
                onClick={onOpenFullForm}
                className="underline text-terracotta-500 hover:text-terracotta-700 transition-colors"
              >
                open the full form
              </button>
            ) : (
              'use the full form'
            )}{' '}
            for more options
          </p>
        </>
      )}
    </FormModalV2>
  );
};

export default QuickAddModalV2;
