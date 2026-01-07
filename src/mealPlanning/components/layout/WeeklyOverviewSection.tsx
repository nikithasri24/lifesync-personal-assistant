import React from 'react';
import { CalendarDays, Loader2 } from 'lucide-react';
import { WeeklyGrid } from './WeeklyGrid';
import type { PlannedMeal, Recipe, MealPlanWeek } from '../../../types';

interface WeeklyOverviewSectionProps {
  isLoading: boolean;
  weekDays: Date[];
  mealsByDate: Record<string, PlannedMeal[]>;
  recipes: Recipe[];
  activePlan: MealPlanWeek | null;
  selectedCells: Set<string>;
  makeCellKey: (dateKey: string, mealType: string) => string;
  onCellClick: (dateKey: string, mealType: string, e: React.MouseEvent) => void;
  onShowRecipeForm: (initialName: string, onSave: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void) => void;
  onShowSimpleEdit: (recipe: Recipe, onSave: (updates: Partial<Recipe>) => void) => void;
  createPlannedMeal: (data: { planId: string; meal: unknown }) => Promise<unknown>;
  updatePlannedMeal: (data: { mealId: string; updates: unknown }) => Promise<unknown>;
  sharedInputValue?: string;
  setSharedInputValue?: (value: string) => void;
  isAnySelectedCellEditing?: boolean;
  setIsAnySelectedCellEditing?: (editing: boolean) => void;
  addMealToSelectedCells?: (recipeId: string, customMeal?: string) => Promise<void>;
}

/**
 * Weekly meal plan overview section with loading state
 */
export function WeeklyOverviewSection({
  isLoading,
  weekDays,
  mealsByDate,
  recipes,
  activePlan,
  selectedCells,
  makeCellKey,
  onCellClick,
  onShowRecipeForm,
  onShowSimpleEdit,
  createPlannedMeal,
  updatePlannedMeal,
  sharedInputValue,
  setSharedInputValue,
  isAnySelectedCellEditing,
  setIsAnySelectedCellEditing,
  addMealToSelectedCells,
}: WeeklyOverviewSectionProps): React.ReactElement {
  return (
    <section className="rounded-lg border border-slate-200 p-6 order-1">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
        <CalendarDays className="h-5 w-5 text-indigo-600" />
        Weekly overview
      </h2>

      {isLoading && (
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading meal plan…
        </div>
      )}

      {!isLoading && weekDays.length > 0 && (
        <WeeklyGrid
          weekDays={weekDays}
          mealsByDate={mealsByDate}
          recipes={recipes}
          activePlan={activePlan}
          selectedCells={selectedCells}
          makeCellKey={makeCellKey}
          onCellClick={onCellClick}
          onShowRecipeForm={onShowRecipeForm}
          onShowSimpleEdit={onShowSimpleEdit}
          createPlannedMeal={createPlannedMeal}
          updatePlannedMeal={updatePlannedMeal}
          sharedInputValue={sharedInputValue}
          setSharedInputValue={setSharedInputValue}
          isAnySelectedCellEditing={isAnySelectedCellEditing}
          setIsAnySelectedCellEditing={setIsAnySelectedCellEditing}
          addMealToSelectedCells={addMealToSelectedCells}
        />
      )}
    </section>
  );
}
