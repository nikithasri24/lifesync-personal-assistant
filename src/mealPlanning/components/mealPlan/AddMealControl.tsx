/**
 * Add Meal Control Component
 *
 * Provides a button to add meals to a specific cell in the meal planning grid.
 * When clicked, it prompts the user to enter a meal name with autocomplete.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { MealAutocomplete } from './MealAutocomplete';
import type { MealSearchResult } from '@/api/mealPlanningAPI';

export interface AddMealControlProps {
  dateKey: string;
  mealType: string;
  showByDefault?: boolean;
  compact?: boolean;
  triggerRef?: React.MutableRefObject<(() => void) | null>;
  onAddMeal?: (mealName: string) => void;
  isSelected?: boolean;
  sharedInputValue?: string;
  setSharedInputValue?: (value: string) => void;
  isAnySelectedCellEditing?: boolean;
  setIsAnySelectedCellEditing?: (editing: boolean) => void;
}

export function AddMealControl({
  dateKey: _dateKey,
  mealType,
  showByDefault,
  compact,
  triggerRef,
  onAddMeal,
  isSelected,
  sharedInputValue,
  setSharedInputValue,
  isAnySelectedCellEditing,
  setIsAnySelectedCellEditing,
}: AddMealControlProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [mealName, setMealName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Use shared input value if this cell is selected and another selected cell is editing
  const effectiveValue = (isSelected && isAnySelectedCellEditing) ? (sharedInputValue || '') : mealName;
  const effectiveIsEditing = isSelected ? (isEditing || isAnySelectedCellEditing || false) : isEditing;

  // Reset local editing state when cell is deselected (only in multi-cell mode)
  useEffect(() => {
    // Only reset if we were previously selected and now we're not
    // This prevents resetting when starting to edit a non-selected cell
    if (!isSelected && isAnySelectedCellEditing && isEditing) {
      setIsEditing(false);
      setMealName('');
    }
  }, [isSelected, isAnySelectedCellEditing, isEditing]);

  // Set up trigger function for parent components
  useEffect(() => {
    if (triggerRef) {
      triggerRef.current = () => {
        setIsEditing(true);
        if (isSelected && setIsAnySelectedCellEditing) {
          setIsAnySelectedCellEditing(true);
        }
      };
    }
  }, [triggerRef, isSelected, setIsAnySelectedCellEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (effectiveIsEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [effectiveIsEditing]);

  const handleSubmit = () => {
    const trimmedName = effectiveValue.trim();
    if (trimmedName && onAddMeal) {
      onAddMeal(trimmedName);
      setMealName('');
      setIsEditing(false);
      if (isSelected && setSharedInputValue && setIsAnySelectedCellEditing) {
        setSharedInputValue('');
        setIsAnySelectedCellEditing(false);
      }
    }
  };

  const handleCancel = () => {
    setMealName('');
    setIsEditing(false);
    if (isSelected && setSharedInputValue && setIsAnySelectedCellEditing) {
      setSharedInputValue('');
      setIsAnySelectedCellEditing(false);
    }
  };

  const handleInputChange = (value: string) => {
    setMealName(value);
    if (isSelected && setSharedInputValue) {
      setSharedInputValue(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  // Handle selection from autocomplete dropdown
  const handleAutocompleteSelect = (result: MealSearchResult) => {
    // Use the meal name directly, submit immediately
    if (onAddMeal) {
      onAddMeal(result.name);
      setMealName('');
      setIsEditing(false);
      if (isSelected && setSharedInputValue && setIsAnySelectedCellEditing) {
        setSharedInputValue('');
        setIsAnySelectedCellEditing(false);
      }
    }
  };

  if (effectiveIsEditing) {
    return (
      <div
        className="flex items-center gap-2 p-2 bg-slate-100 border-2 border-indigo-400 rounded-lg animate-in fade-in duration-200"
        onClick={(e) => {
          // Stop propagation when editing to prevent cell deselection
          e.stopPropagation();
        }}
      >
        <MealAutocomplete
          value={effectiveValue}
          onChange={handleInputChange}
          onSelect={handleAutocompleteSelect}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Don't auto-cancel when in multi-cell selection mode
            // User should explicitly cancel with Escape or save with Enter
            if (isAnySelectedCellEditing) {
              return;
            }
            // Delay to allow button clicks to register
            setTimeout(() => {
              if (effectiveIsEditing) handleCancel();
            }, 200);
          }}
          placeholder="e.g., Scrambled eggs, Oatmeal..."
          inputRef={inputRef}
        />
        <button
          type="button"
          onClick={(e) => {
            // Allow Cmd/Ctrl+click to bubble up for multi-cell selection
            if (!e.metaKey && !e.ctrlKey) {
              e.stopPropagation();
            }
            handleSubmit();
          }}
          disabled={!effectiveValue.trim()}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-md transition-colors"
          title="Add meal (Enter)"
          aria-label="Add meal"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            // Allow Cmd/Ctrl+click to bubble up for multi-cell selection
            if (!e.metaKey && !e.ctrlKey) {
              e.stopPropagation();
            }
            handleCancel();
          }}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          title="Cancel (Esc)"
          aria-label="Cancel adding meal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        // Don't stop propagation - let the cell handle selection
        // The cell click handler will select the cell
        if (triggerRef?.current) {
          triggerRef.current();
        } else {
          setIsEditing(true);
          if (isSelected && setIsAnySelectedCellEditing) {
            setIsAnySelectedCellEditing(true);
          }
        }
      }}
      className="group/add-btn w-full text-left min-h-[44px] py-2 px-3 transition-all duration-200 hover:bg-slate-100 rounded"
      aria-label="Add meal to this slot"
    >
      <div className="flex items-center gap-2">
        <Plus className="w-4 h-4 text-slate-400 group-hover/add-btn:text-slate-600 transition-colors" />
        <span className="text-sm text-slate-500 group-hover/add-btn:text-slate-700 transition-colors">
          Add meal
        </span>
      </div>
    </button>
  );
}

export default AddMealControl;
