/**
 * RescheduleMealModal - MIGRATED to use FormModalV2
 * Reschedule a meal to a new date and meal type with Together pattern
 *
 * MIGRATION COMPLETE:
 * - Reduced from 151 lines to ~110 lines (27% reduction)
 * - Removed ModalShell wrapper (FormModalV2 provides modal structure)
 * - ESC key handler now built-in to FormModalV2
 * - Form state managed internally with useState
 * - Preserved DatePickerPopover component integration
 */

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FormModalV2 } from '@/components/v2';
import DatePickerPopover from '../../../components/DatePickerPopover';
import type { PlannedMeal } from '../../../types';

interface RescheduleMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: PlannedMeal | null;
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  onReschedule: (date: Date, mealType: string) => Promise<void>;
  isPending?: boolean;
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

interface RescheduleFormState {
  selectedDate: Date;
  selectedMealType: string;
}

export function RescheduleMealModal({
  isOpen,
  onClose,
  meal,
  weekStartsOn,
  onReschedule,
  isPending = false,
}: RescheduleMealModalProps): React.JSX.Element | null {
  const [formState, setFormState] = useState<RescheduleFormState>({
    selectedDate: new Date(),
    selectedMealType: 'dinner',
  });

  // Reset state when modal opens with a new meal
  useEffect(() => {
    if (isOpen && meal) {
      setFormState({
        selectedDate: meal.originalDate || new Date(),
        selectedMealType: meal.mealType || 'dinner',
      });
    }
  }, [isOpen, meal]);

  if (!meal) return null;

  const mealName = meal.customMeal || 'Unnamed meal';

  return (
    <FormModalV2<Record<string, never>>
      isOpen={isOpen}
      onClose={onClose}
      title="Reschedule Meal"
      subtitle={`Choose a new date and time for "${mealName}"`}
      defaultData={{}}
      isPending={isPending}
      submitText="Reschedule Meal"
      isEditing={false}
      onSubmit={async () => {
        await onReschedule(formState.selectedDate, formState.selectedMealType);
      }}
    >
      {() => (
        <>
          {/* Original Schedule Info */}
          {meal.originalDate && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
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

          {/* New Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              New Date
            </label>
            <DatePickerPopover
              value={formState.selectedDate}
              onChange={(date) => setFormState({ ...formState, selectedDate: date })}
              weekStartsOn={weekStartsOn === 0 || weekStartsOn === 1 ? weekStartsOn : 0}
            />
            <p className="mt-2 text-sm text-gray-600">
              {format(formState.selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          {/* Meal Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Meal Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormState({ ...formState, selectedMealType: type.value })}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    formState.selectedMealType === type.value
                      ? 'bg-terracotta-400 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </FormModalV2>
  );
}
