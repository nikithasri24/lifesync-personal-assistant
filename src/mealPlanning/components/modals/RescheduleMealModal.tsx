import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import DatePickerPopover from '../../../components/DatePickerPopover';
import { ModalShell } from './ModalShell';
import type { PlannedMeal } from '../../../types';

interface RescheduleMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: PlannedMeal | null;
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  onReschedule: (date: Date, mealType: string) => Promise<void>;
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

export function RescheduleMealModal({
  isOpen,
  onClose,
  meal,
  weekStartsOn,
  onReschedule,
}: RescheduleMealModalProps): React.JSX.Element | null {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMealType, setSelectedMealType] = useState<string>('dinner');
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Reset state when modal opens with a new meal
  useEffect(() => {
    if (isOpen && meal) {
      // Default to original date if available, otherwise today
      setSelectedDate(meal.originalDate || new Date());
      setSelectedMealType(meal.mealType || 'dinner');
    }
  }, [isOpen, meal]);

  // Keyboard navigation for Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !meal) return null;

  const mealName = meal.customMeal || 'Unnamed meal';

  const handleReschedule = async () => {
    setIsRescheduling(true);
    try {
      await onReschedule(selectedDate, selectedMealType);
      onClose();
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <ModalShell
      title="Reschedule Meal"
      subtitle={`Choose a new date and time for "${mealName}"`}
      onClose={onClose}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        {meal.originalDate && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            <p>
              <strong>Originally scheduled:</strong> {format(meal.originalDate, 'MMM d, yyyy')} • {meal.mealType}
            </p>
            {meal.postponedReason && (
              <p className="mt-1">
                <strong>Reason:</strong> {meal.postponedReason}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            New Date
          </label>
          <DatePickerPopover
            value={selectedDate}
            onChange={setSelectedDate}
            weekStartsOn={weekStartsOn === 0 || weekStartsOn === 1 ? weekStartsOn : 0}
          />
          <p className="mt-1 text-xs text-slate-500">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Meal Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MEAL_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setSelectedMealType(type.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedMealType === type.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isRescheduling}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleReschedule()}
            disabled={isRescheduling}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {isRescheduling ? 'Rescheduling...' : 'Reschedule Meal'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
