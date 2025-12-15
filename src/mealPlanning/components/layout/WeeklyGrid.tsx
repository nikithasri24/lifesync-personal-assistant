import React, { type ReactElement } from 'react';
import { format, isSameDay } from 'date-fns';
import { ChefHat } from 'lucide-react';
import type { PlannedMeal, Recipe } from '../../../types';
import { toKey, parseLocalDateKey } from '../../utils';
import CellWithMeals from '../mealPlan/CellWithMeals';
import AddMealControl from '../mealPlan/AddMealControl';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

interface WeeklyGridProps {
  weekDays: Date[];
  mealsByDate: Record<string, PlannedMeal[]>;
  recipes: Recipe[];
  activePlan: { id: string; meals?: PlannedMeal[] } | null;
  selectedCells: Set<string>;
  makeCellKey: (dateKey: string, mealType: string) => string;
  onCellClick: (dateKey: string, mealType: string, e: React.MouseEvent) => void;
  onShowRecipeForm: (initialName: string, onSave: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void) => void;
  onShowSimpleEdit: (recipe: Recipe, onSave: (updates: Partial<Recipe>) => void) => void;
  createPlannedMeal: (data: {
    planId: string;
    meal: {
      date: Date;
      mealType: string;
      recipeId?: string;
      customMeal?: string;
      servings: number;
      peopleCount: number;
      status: string;
      notes?: string;
      preparedAt?: Date;
      consumedAt?: Date;
    };
  }) => Promise<unknown>;
  updatePlannedMeal: (data: { mealId: string; updates: { date: Date; mealType: string } }) => Promise<unknown>;
}

/**
 * Weekly meal planning grid component
 */
export function WeeklyGrid({
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
}: WeeklyGridProps): ReactElement {
  return (
    <div className="mt-6">
      <div className="overflow-x-auto">
        {/* Header row */}
        <div className="grid" style={{ gridTemplateColumns: `140px repeat(4, minmax(160px, 1fr))` }}>
          <div className="p-3 border-b border-r border-slate-200 sticky left-0 bg-white z-20" />
          {MEAL_TYPES.map((mealType) => (
            <div
              key={mealType}
              className="p-3 border-b border-r border-slate-200 text-sm font-semibold text-slate-900 bg-white text-center capitalize"
            >
              {mealType}
            </div>
          ))}
        </div>
        {/* Day rows */}
        {weekDays.map((d) => {
          const key = toKey(d);
          const today = new Date();
          const highlight = isSameDay(d, today);
          return (
            <div key={key} className="grid" style={{ gridTemplateColumns: `140px repeat(4, minmax(160px, 1fr))` }}>
              {/* Day label */}
              <div
                className={`relative p-3 border-b border-r border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 flex flex-col justify-center sticky left-0 z-10`}
              >
                {highlight && (
                  <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500 rounded-r-sm" aria-hidden />
                )}
                <div className={highlight ? 'text-indigo-700 font-semibold' : ''}>{format(d, 'EEE')}</div>
                <div className="text-xs text-slate-500">{format(d, 'MMM d')}</div>
              </div>
              {MEAL_TYPES.map((mealType) => {
                const dayMeals = (mealsByDate[key] ?? []).filter((m) => m.mealType === mealType);
                const cellKey = makeCellKey(key, mealType);
                const isSelected = selectedCells.has(cellKey);
                const hasContent = dayMeals.length > 0;

                return (
                  <div
                    key={`${key}-${mealType}`}
                    className={`relative p-3 border-b border-l border-r border-slate-200 overflow-hidden cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-100 border-indigo-400 ring-2 ring-indigo-400' : ''
                    } ${hasContent ? 'bg-amber-50/30' : ''}`}
                    onClick={(e) => onCellClick(key, mealType, e)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      void (async (): Promise<void> => {
                        if (!activePlan) return;
                        const optionName = e.dataTransfer.getData('text/meal-option');
                        if (optionName) {
                          await createPlannedMeal({
                            planId: activePlan.id,
                            meal: {
                              date: parseLocalDateKey(key),
                              mealType,
                              recipeId: undefined,
                              customMeal: optionName,
                              servings: 4,
                              peopleCount: 4,
                              status: 'planned',
                              notes: undefined,
                              preparedAt: undefined,
                              consumedAt: undefined,
                            },
                          });
                          return;
                        }

                        const recipeDragged = e.dataTransfer.getData('text/recipe-id');
                        if (recipeDragged) {
                          await createPlannedMeal({
                            planId: activePlan.id,
                            meal: {
                              date: parseLocalDateKey(key),
                              mealType,
                              recipeId: recipeDragged,
                              customMeal: undefined,
                              servings: 4,
                              peopleCount: 4,
                              status: 'planned',
                              notes: undefined,
                              preparedAt: undefined,
                              consumedAt: undefined,
                            },
                          });
                          return;
                        }

                        const mealId = e.dataTransfer.getData('text/meal-id');
                        if (!mealId) return;
                        if (e.altKey) {
                          const source = activePlan.meals?.find((m) => m.id === mealId);
                          if (!source) return;
                          await createPlannedMeal({
                            planId: activePlan.id,
                            meal: {
                              date: parseLocalDateKey(key),
                              mealType,
                              recipeId: source.recipeId,
                              customMeal: source.customMeal,
                              servings: source.servings ?? 4,
                              peopleCount: source.peopleCount ?? source.servings ?? 4,
                              status: 'planned',
                              notes: undefined,
                              preparedAt: undefined,
                              consumedAt: undefined,
                            },
                          });
                        } else {
                          await updatePlannedMeal({
                            mealId,
                            updates: { date: parseLocalDateKey(key), mealType },
                          });
                        }
                      })();
                    }}
                  >
                    {highlight && <div className="absolute inset-y-0 left-0 w-1 bg-indigo-300" aria-hidden />}
                    {hasContent && (
                      <div className="absolute top-1 right-1 z-10">
                        <ChefHat className="w-4 h-4 text-amber-600" />
                      </div>
                    )}
                    <div className="h-full overflow-auto space-y-2 group/cell relative">
                      {dayMeals.length > 0 ? (
                        <CellWithMeals
                          dateKey={key}
                          mealType={mealType}
                          dayMeals={dayMeals}
                          recipes={recipes}
                          onShowRecipeForm={onShowRecipeForm}
                          onShowSimpleEdit={onShowSimpleEdit}
                          renderAddControl={(triggerRef) => (
                            <AddMealControl
                              dateKey={key}
                              mealType={mealType}
                              showByDefault={false}
                              compact={true}
                              triggerRef={triggerRef}
                            />
                          )}
                        />
                      ) : (
                        <AddMealControl dateKey={key} mealType={mealType} showByDefault={true} compact={false} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
