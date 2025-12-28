/**
 * Add Meal Control Component
 *
 * Provides a button to add meals to a specific cell in the meal planning grid.
 * When clicked, it prompts the user to enter a meal name.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

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

  console.log('[AddMealControl] Render:', {
    mealType,
    isEditing,
    isSelected,
    isAnySelectedCellEditing,
    effectiveIsEditing,
    effectiveValue
  });

  // Reset local editing state when cell is deselected (only in multi-cell mode)
  useEffect(() => {
    // Only reset if we were previously selected and now we're not
    // This prevents resetting when starting to edit a non-selected cell
    if (!isSelected && isAnySelectedCellEditing && isEditing) {
      console.log('[AddMealControl] Resetting editing state because cell deselected in multi-cell mode');
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

  if (effectiveIsEditing) {
    return (
      <div
        className="flex items-center gap-2 p-2 bg-white border-2 border-indigo-400 rounded-lg shadow-sm animate-in fade-in duration-200"
        onClick={(e) => {
          // Stop propagation when editing to prevent cell deselection
          e.stopPropagation();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={effectiveValue}
          onChange={(e) => handleInputChange(e.target.value)}
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
          placeholder={`e.g., Scrambled eggs, Oatmeal...`}
          className="flex-1 min-w-0 px-3 py-1.5 text-sm border-0 bg-slate-50 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white placeholder:text-slate-400"
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
          className="flex items-center justify-center p-1.5 text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-md transition-colors"
          title="Add meal (Enter)"
        >
          <Plus className="w-4 h-4" />
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
          className="flex items-center justify-center p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          title="Cancel (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        console.log('[AddMealControl] Button clicked!', {
          hasTriggerRef: !!triggerRef?.current,
          isSelected,
          mealType
        });

        // Don't stop propagation - let the cell handle selection
        // The cell click handler will select the cell
        if (triggerRef?.current) {
          console.log('[AddMealControl] Calling triggerRef');
          triggerRef.current();
        } else {
          console.log('[AddMealControl] Setting isEditing to true');
          setIsEditing(true);
          if (isSelected && setIsAnySelectedCellEditing) {
            setIsAnySelectedCellEditing(true);
          }
        }
      }}
      className={`
        group/add-btn w-full text-left rounded-lg transition-all duration-200
        ${compact
          ? 'p-1.5 text-xs'
          : 'p-3 text-sm'
        }
        ${showByDefault
          ? 'border-2 border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-100 hover:border-indigo-400'
          : 'border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
        }
      `}
    >
      <div className="flex items-center gap-2">
        <Plus className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-indigo-600 group-hover/add-btn:scale-110 transition-transform`} />
        <span className={`font-medium ${showByDefault ? 'text-indigo-700' : 'text-slate-600'} group-hover/add-btn:text-indigo-800`}>
          Add {mealType || 'meal'}
        </span>
        {showByDefault && (
          <span className="ml-auto text-xs text-indigo-500 opacity-75">
            Click to add
          </span>
        )}
      </div>
    </button>
  );
}

export default AddMealControl;
