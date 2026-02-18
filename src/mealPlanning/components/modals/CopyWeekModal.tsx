/**
 * CopyWeekModal - MIGRATED to use FormModalV2
 * Copy all meals from source week to target week with Together pattern
 *
 * MIGRATION COMPLETE:
 * - Reduced from 90 lines to ~75 lines (17% reduction)
 * - Removed ModalShell wrapper (FormModalV2 provides modal structure)
 * - ESC key handler now built-in to FormModalV2
 * - Converted to light mode following design standards
 * - Preserved external state management for targetWeekStart (controlled component)
 */

import React from 'react';
import { format, addDays } from 'date-fns';
import { FormModalV2 } from '@/components/v2';
import DatePickerPopover from '../../../components/DatePickerPopover';

interface CopyWeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceWeekStart: Date;
  targetWeekStart: Date;
  onTargetWeekChange: (date: Date) => void;
  mealCount: number;
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  onCopy: () => Promise<void>;
  isPending?: boolean;
}

export function CopyWeekModal({
  isOpen,
  onClose,
  sourceWeekStart,
  targetWeekStart,
  onTargetWeekChange,
  mealCount,
  weekStartsOn,
  onCopy,
  isPending = false,
}: CopyWeekModalProps): React.JSX.Element | null {
  const submitText = `Copy ${mealCount} Meal${mealCount !== 1 ? 's' : ''}`;

  return (
    <FormModalV2<Record<string, never>>
      isOpen={isOpen}
      onClose={onClose}
      title="Copy Week"
      subtitle={`Copy meals from week of ${format(sourceWeekStart, 'MMM d, yyyy')}`}
      defaultData={{}}
      isPending={isPending}
      submitText={submitText}
      isEditing={false}
      onSubmit={onCopy}
      validate={() => {
        if (mealCount === 0) return 'Current week has no meals to copy';
        return null;
      }}
    >
      {() => (
        <>
          {/* Instructions */}
          <p className="text-sm text-gray-600">
            Select the target week to copy all {mealCount} meal{mealCount !== 1 ? 's' : ''} to:
          </p>

          {/* Target Week Picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Target Week Start Date
            </label>
            <DatePickerPopover
              value={targetWeekStart}
              onChange={onTargetWeekChange}
              weekStartsOn={weekStartsOn === 0 || weekStartsOn === 1 ? weekStartsOn : 0}
            />
            <p className="mt-2 text-sm text-gray-600">
              Week of {format(targetWeekStart, 'MMM d')} - {format(addDays(targetWeekStart, 6), 'MMM d, yyyy')}
            </p>
          </div>

          {/* Warning if no meals */}
          {mealCount === 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              Current week has no meals to copy.
            </div>
          )}
        </>
      )}
    </FormModalV2>
  );
}
