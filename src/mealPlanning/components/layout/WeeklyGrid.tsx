import React, { type ReactElement, useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { ChefHat, Coffee, Sun, Moon, Cookie } from 'lucide-react';
import type { PlannedMeal, Recipe } from '../../../types';
import { toKey, parseLocalDateKey } from '../../utils';
import CellWithMeals from '../mealPlan/CellWithMeals';
import AddMealControl from '../mealPlan/AddMealControl';
import { MealBacklogSection } from './MealBacklogSection';
import { useUndoRedo } from '../../../contexts/UndoRedoContext';
import { MovePlannedMealCommand } from '../../../commands/MealPlanningCommands';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_TYPE_CONFIG = {
  breakfast: { icon: Coffee, gradient: 'from-amber-400 to-orange-500' },
  lunch: { icon: Sun, gradient: 'from-emerald-400 to-teal-500' },
  dinner: { icon: Moon, gradient: 'from-indigo-400 to-purple-500' },
  snack: { icon: Cookie, gradient: 'from-pink-400 to-rose-500' },
};

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
  sharedInputValue?: string;
  setSharedInputValue?: (value: string) => void;
  isAnySelectedCellEditing?: boolean;
  setIsAnySelectedCellEditing?: (editing: boolean) => void;
  addMealToSelectedCells?: (recipeId: string, customMeal?: string) => Promise<void>;
}

/**
 * Weekly meal planning grid component - Redesigned with modern card-based layout
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
  sharedInputValue,
  setSharedInputValue,
  isAnySelectedCellEditing,
  setIsAnySelectedCellEditing,
  addMealToSelectedCells,
}: WeeklyGridProps): ReactElement {
  const { executeCommand } = useUndoRedo();

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full border-collapse rounded-lg overflow-hidden border border-slate-200">
        {/* Table header */}
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="sticky left-0 z-20 bg-slate-50 text-slate-900 p-3 text-left text-sm font-semibold border-r border-slate-200 min-w-[120px]">
              Date
            </th>
            {MEAL_TYPES.map((mealType) => {
              const config = MEAL_TYPE_CONFIG[mealType as keyof typeof MEAL_TYPE_CONFIG];
              const Icon = config.icon;
              return (
                <th
                  key={mealType}
                  className="p-3 text-left text-sm font-semibold text-slate-900 bg-slate-50 min-w-[220px]"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-600" />
                    <span className="capitalize">{mealType}</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Table body */}
        <tbody>
          {weekDays.map((d, dayIndex) => {
            const key = toKey(d);
            const today = new Date();
            const isToday = isSameDay(d, today);

            return (
              <tr
                key={key}
                className={`border-b border-slate-200 ${
                  isToday ? 'bg-indigo-50/20' : ''
                }`}
              >
                {/* Date column */}
                <td
                  className={`sticky left-0 z-10 border-r-2 border-slate-200 p-4 font-medium ${
                    isToday ? 'bg-indigo-100/30' : 'bg-slate-50/50'
                  }`}
                >
                  <div className="text-sm font-bold text-slate-900">
                    {format(d, 'EEE')}
                  </div>
                  <div className="text-xs text-slate-600">
                    {format(d, 'MMM d')}
                  </div>
                  {isToday && (
                    <div className="text-xs font-semibold text-indigo-600 mt-1">
                      Today
                    </div>
                  )}
                </td>

                {/* Meal type columns */}
                {MEAL_TYPES.map((mealType) => {
                  const dayMeals = (mealsByDate[key] ?? []).filter((m) => m.mealType === mealType);
                  const cellKey = makeCellKey(key, mealType);
                  const isSelected = selectedCells.has(cellKey);
                  const hasContent = dayMeals.length > 0;
                  const hasEatenMeal = dayMeals.some((m) => m.status === 'eaten');
                  const config = MEAL_TYPE_CONFIG[mealType as keyof typeof MEAL_TYPE_CONFIG];
                  const highlight = isSelected && selectedCells.size > 1;

                  return (
                    <td
                      key={`${key}-${mealType}`}
                      className={`p-3 align-top cursor-pointer transition-all relative ${
                        isSelected
                          ? 'ring-4 ring-inset ring-indigo-400 bg-indigo-50/30'
                          : 'hover:bg-slate-100/50'
                      }`}
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
                          const fromBacklog = e.dataTransfer.getData('text/from-backlog') === 'true';
                          const sourceMeal = activePlan.meals?.find((m) => m.id === mealId);
                          if (!sourceMeal) return;

                          const mealName = recipes.find(r => r.id === sourceMeal.recipeId)?.name || sourceMeal.customMeal || 'Meal';

                          if (e.altKey && !fromBacklog) {
                            // Alt+drag creates a copy (no undo for this)
                            await createPlannedMeal({
                              planId: activePlan.id,
                              meal: {
                                date: parseLocalDateKey(key),
                                mealType,
                                recipeId: sourceMeal.recipeId,
                                customMeal: sourceMeal.customMeal,
                                servings: sourceMeal.servings ?? 4,
                                peopleCount: sourceMeal.peopleCount ?? sourceMeal.servings ?? 4,
                                status: 'planned',
                                notes: undefined,
                                preparedAt: undefined,
                                consumedAt: undefined,
                              },
                            });
                          } else {
                            // Move the meal to the new date/mealType - use command for undo
                            const command = new MovePlannedMealCommand(
                              mealId,
                              mealName,
                              parseLocalDateKey(key),
                              mealType,
                              sourceMeal.date,
                              sourceMeal.mealType,
                              fromBacklog
                            );
                            await executeCommand(command);
                          }
                        })();
                      }}
                    >
                      {highlight && <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500" aria-hidden />}
                      <div
                        className="min-h-[100px] group/cell relative"
                        style={{ overflow: 'visible' }}
                      >
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
                              key={`add-control-trigger-${key}-${mealType}`}
                              dateKey={key}
                              mealType={mealType}
                              showByDefault={false}
                              compact={true}
                              triggerRef={triggerRef}
                              isSelected={isSelected}
                              sharedInputValue={sharedInputValue}
                              setSharedInputValue={setSharedInputValue}
                              isAnySelectedCellEditing={isAnySelectedCellEditing}
                              setIsAnySelectedCellEditing={setIsAnySelectedCellEditing}
                              onAddMeal={(mealName) => {
                                // If multiple cells are selected, add to all
                                if (isSelected && selectedCells.size > 1 && addMealToSelectedCells) {
                                  console.log('[AddMeal] Adding to all selected cells:', selectedCells.size);
                                  void addMealToSelectedCells('', mealName);
                                  return;
                                }

                                // Otherwise, add to just this cell
                                if (!activePlan) {
                                  console.error('[AddMeal] No active plan found!');
                                  return;
                                }
                                const mealData = {
                                  planId: activePlan.id,
                                  meal: {
                                    date: parseLocalDateKey(key),
                                    mealType,
                                    customMeal: mealName,
                                    servings: 2,
                                    peopleCount: 2,
                                    status: 'planned',
                                  },
                                };
                                console.log('[AddMeal] ⚠️ About to call createPlannedMeal with:', mealData);
                                console.log('[AddMeal] ⚠️ customMeal value:', mealName);
                                console.log('[AddMeal] ⚠️ createPlannedMeal function:', typeof createPlannedMeal);
                                void createPlannedMeal(mealData).then(() => {
                                  console.log('[AddMeal] ✅ Meal created successfully!');
                                }).catch((error) => {
                                  console.error('[AddMeal] ❌ Failed to create meal:', error);
                                });
                              }}
                            />
                          )}
                        />
                      ) : (
                        <AddMealControl
                          key={`add-control-empty-${key}-${mealType}`}
                          dateKey={key}
                          mealType={mealType}
                          showByDefault={true}
                          compact={false}
                          isSelected={isSelected}
                          sharedInputValue={sharedInputValue}
                          setSharedInputValue={setSharedInputValue}
                          isAnySelectedCellEditing={isAnySelectedCellEditing}
                          setIsAnySelectedCellEditing={setIsAnySelectedCellEditing}
                          onAddMeal={(mealName) => {
                            // If multiple cells are selected, add to all
                            if (isSelected && selectedCells.size > 1 && addMealToSelectedCells) {
                              console.log('[AddMeal] Adding to all selected cells:', selectedCells.size);
                              void addMealToSelectedCells('', mealName);
                              return;
                            }

                            // Otherwise, add to just this cell
                            if (!activePlan) {
                              console.error('[AddMeal] No active plan found!');
                              return;
                            }
                            console.log('[AddMeal] Creating meal:', {
                              planId: activePlan.id,
                              date: parseLocalDateKey(key),
                              mealType,
                              customMeal: mealName,
                            });
                            void createPlannedMeal({
                              planId: activePlan.id,
                              meal: {
                                date: parseLocalDateKey(key),
                                mealType,
                                customMeal: mealName,
                                servings: 2,
                                peopleCount: 2,
                                status: 'planned',
                              },
                            }).then(() => {
                              console.log('[AddMeal] Meal created successfully!');
                            }).catch((error) => {
                              console.error('[AddMeal] Failed to create meal:', error);
                            });
                          }}
                        />
                      )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Meal Backlog Section */}
      {(() => {
        const postponedMeals = useMemo(() => {
          return activePlan?.meals?.filter((m) => m.isPostponed) || [];
        }, [activePlan?.meals]);

        return (
          <MealBacklogSection
            postponedMeals={postponedMeals}
            recipes={recipes}
            onReschedule={(meal) => {
              // TODO: Implement reschedule functionality
              console.log('[WeeklyGrid] Reschedule meal:', meal);
            }}
          />
        );
      })()}
    </div>
  );
}
