/**
 * CellWithMeals Component
 * Displays list of meals in a cell with add button overlay
 */

import React, { useRef } from 'react';
import { Plus } from 'lucide-react';
import type { PlannedMeal, Recipe } from '../../../types';
import { MealItem } from './MealItem';

export interface CellWithMealsProps {
  dateKey: string;
  mealType: string;
  dayMeals: PlannedMeal[];
  recipes: Recipe[];
  onShowRecipeForm: (initialName: string, onSave: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void) => void;
  onShowSimpleEdit: (recipe: Recipe, onSave: (updates: Partial<Recipe>) => void) => void;
  renderAddControl: (triggerRef: React.MutableRefObject<(() => void) | null>) => React.ReactNode;
}

export const CellWithMeals: React.FC<CellWithMealsProps> = ({
  dateKey: _dateKey,
  mealType: _mealType,
  dayMeals,
  recipes,
  onShowRecipeForm,
  onShowSimpleEdit,
  renderAddControl,
}) => {
  const triggerRef = useRef<(() => void) | null>(null);

  return (
    <>
      <div className="space-y-1 relative" style={{ zIndex: 20, position: 'relative' }}>
        <ul className="space-y-1">
          {dayMeals.map((meal) => (
            <MealItem
              key={meal.id}
              meal={meal}
              recipes={recipes}
              onShowRecipeForm={onShowRecipeForm}
              onShowSimpleEdit={onShowSimpleEdit}
            />
          ))}
        </ul>
        {/* Hidden AddMealControl - only used to connect triggerRef */}
        <div className="hidden">
          {renderAddControl(triggerRef)}
        </div>
      </div>
      {/* Hover overlay to add more meals */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none group-hover/cell:pointer-events-auto" style={{ zIndex: 5 }}>
        <div className="absolute bottom-2 left-2 right-2 flex justify-center">
          <button
            type="button"
            onClick={(e) => {
              // Stop propagation to prevent cell selection when adding a meal
              e.stopPropagation();
              triggerRef.current?.();
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className="text-xs text-slate-600 hover:text-indigo-600 flex items-center gap-1 bg-slate-100/90 backdrop-blur-sm px-2 py-1 rounded border border-slate-300 hover:border-indigo-400 hover:bg-indigo-100/90 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span className="text-[10px] font-medium">Add another</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default CellWithMeals;
