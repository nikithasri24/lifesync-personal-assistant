import React from 'react';
import { CalendarDays, Loader2 } from 'lucide-react';
import { WeeklyGrid } from './WeeklyGrid';
import type { PlannedMeal, Recipe, MealPlan } from '../../../types';

interface WeeklyOverviewSectionProps {
  isLoading: boolean;
  weekDays: Date[];
  mealsByDate: Record<string, PlannedMeal[]>;
  recipes: Recipe[];
  activePlan: MealPlan | null;
  selectedCells: Set<string>;
  makeCellKey: (date: Date, mealType: string) => string;
  onCellClick: (date: Date, mealType: string, event: React.MouseEvent) => void;
  onShowRecipeForm: (initialName: string, onSave: (recipeId: string) => Promise<void>) => void;
  onShowSimpleEdit: (recipe: Recipe, onSave: (updates: Partial<Recipe>) => Promise<void>) => void;
  createPlannedMeal: (data: { planId: string; meal: any }) => Promise<void>;
  updatePlannedMeal: (data: { mealId: string; updates: any }) => Promise<void>;
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
}: WeeklyOverviewSectionProps): React.ReactElement {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm order-1">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <CalendarDays className="h-5 w-5 text-sky-500" />
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
        />
      )}
    </section>
  );
}
