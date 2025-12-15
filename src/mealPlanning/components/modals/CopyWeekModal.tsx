import React from 'react';
import { format, addDays } from 'date-fns';
import DatePickerPopover from '../../../components/DatePickerPopover';
import { ModalShell } from './ModalShell';

interface CopyWeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceWeekStart: Date;
  targetWeekStart: Date;
  onTargetWeekChange: (date: Date) => void;
  mealCount: number;
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  onCopy: () => Promise<void>;
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
}: CopyWeekModalProps): React.JSX.Element | null {
  if (!isOpen) return null;

  return (
    <ModalShell
      title="Copy Week"
      subtitle={`Copy meals from week of ${format(sourceWeekStart, 'MMM d, yyyy')}`}
      onClose={onClose}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Select the target week to copy all {mealCount} meal{mealCount !== 1 ? 's' : ''} to:
        </p>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Target Week Start Date</label>
          <DatePickerPopover value={targetWeekStart} onChange={onTargetWeekChange} weekStartsOn={weekStartsOn === 0 || weekStartsOn === 1 ? weekStartsOn : 0} />
          <p className="mt-2 text-xs text-slate-500">
            Week of {format(targetWeekStart, 'MMM d')} - {format(addDays(targetWeekStart, 6), 'MMM d, yyyy')}
          </p>
        </div>

        {mealCount === 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            Current week has no meals to copy.
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={mealCount === 0}
            onClick={() => void onCopy()}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            Copy {mealCount} Meal{mealCount !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
