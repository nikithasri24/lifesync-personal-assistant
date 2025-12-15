/**
 * Add Meal Control Component
 *
 * Note: This is a stub implementation. Full implementation pending.
 */

import React from 'react';

export interface AddMealControlProps {
  dateKey: string;
  mealType: string;
  showByDefault?: boolean;
  compact?: boolean;
  triggerRef?: React.MutableRefObject<(() => void) | null>;
}

export function AddMealControl({ dateKey, mealType, showByDefault, compact, triggerRef }: AddMealControlProps) {
  return (
    <button
      type="button"
      onClick={() => {
        if (triggerRef?.current) {
          triggerRef.current();
        }
      }}
      className={`p-2 text-sm text-blue-600 hover:bg-blue-50 rounded ${compact ? 'text-xs' : ''}`}
    >
      + Add {mealType || 'Meal'} {showByDefault ? '(default)' : ''}
    </button>
  );
}

export default AddMealControl;
