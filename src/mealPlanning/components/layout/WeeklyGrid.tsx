import React, { type ReactElement, useMemo, Suspense, lazy, useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { logger } from '../../../services/logger';
import { ChefHat, Coffee, Sun, Moon, Cookie } from 'lucide-react';
import type { PlannedMeal, Recipe } from '../../../types';
import { toKey, parseLocalDateKey } from '../../utils';
import CellWithMeals from '../mealPlan/CellWithMeals';
import AddMealControl from '../mealPlan/AddMealControl';
import { useUndoRedo } from '../../../contexts/UndoRedoContext';
import { MovePlannedMealCommand, CreatePlannedMealCommand, UseBacklogItemCommand } from '../../../commands/MealPlanningCommands';
import { useRemoveFromBacklogMutation, useBacklogQuery } from '../../../hooks/useMealPlanningQuery';
import { RescheduleMealModal } from '../modals/RescheduleMealModal';

// Lazy load MealBacklogSection - only needed in merged mode
const MealBacklogSection = lazy(() =>
  import('./MealBacklogSection').then(m => ({ default: m.MealBacklogSection }))
);

// Loading fallback for backlog section
const BacklogLoadingFallback = () => (
  <div className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg h-24 mt-4 flex items-center justify-center">
    <div className="text-gray-400 dark:text-gray-500 text-sm">Loading backlog...</div>
  </div>
);

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_TYPE_CONFIG = {
  breakfast: { icon: Coffee, gradient: 'from-amber-400 to-orange-500' },
  lunch: { icon: Sun, gradient: 'from-emerald-400 to-teal-500' },
  dinner: { icon: Moon, gradient: 'from-[#D4A574] to-[#C18B5E]' },
  snack: { icon: Cookie, gradient: 'from-pink-400 to-rose-500' },
};

interface WeeklyGridProps {
  weekDays: Date[];
  mealsByDate: Record<string, PlannedMeal[]>;
  recipes: Recipe[];
  activePlan: { id: string; meals?: PlannedMeal[]; connectionId?: string; partnerId?: string } | null;
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
  const removeFromBacklogMutation = useRemoveFromBacklogMutation();

  // Reschedule modal state
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [mealToReschedule, setMealToReschedule] = useState<PlannedMeal | null>(null);

  const handleOpenRescheduleModal = (meal: PlannedMeal) => {
    logger.debug('MealPlanning', 'Opening reschedule modal', { mealId: meal.id, mealName: meal.customMeal });
    setMealToReschedule(meal);
    setRescheduleModalOpen(true);
  };

  const handleCloseRescheduleModal = () => {
    setRescheduleModalOpen(false);
    setMealToReschedule(null);
  };

  const handleReschedule = async (newDate: Date, newMealType: string) => {
    if (!mealToReschedule) return;

    try {
      const recipe = recipes.find((r) => r.id === mealToReschedule.recipeId);
      const mealName = recipe?.name || mealToReschedule.customMeal || 'meal';

      const command = new MovePlannedMealCommand(
        mealToReschedule.id,
        mealName,
        newDate,
        newMealType,
        mealToReschedule.date,
        mealToReschedule.mealType,
        true // wasPostponed = true to clear postponed status
      );

      await executeCommand(command);
      logger.info('MealPlanning', 'Meal rescheduled successfully', {
        mealId: mealToReschedule.id,
        newDate,
        newMealType,
      });
    } catch (error) {
      logger.error('MealPlanning', error instanceof Error ? error : new Error(String(error)), {
        context: 'handleReschedule',
        mealId: mealToReschedule.id,
      });
      throw error; // Re-throw to let modal handle the error state
    }
  };

  return (
    <div className="mt-6">
      {/* Mobile view - Vertical cards per day */}
      <div className="md:hidden space-y-4">
        {weekDays.map((d) => {
          const key = toKey(d);
          const today = new Date();
          const isToday = isSameDay(d, today);

          return (
            <div
              key={key}
              className={`rounded-lg border-2 overflow-hidden ${
                isToday ? 'border-[#D4A574] bg-[#F5EBE0]/20' : 'border-slate-200 bg-white'
              }`}
            >
              {/* Day header */}
              <div className={`p-4 border-b ${isToday ? 'bg-[#F5EBE0]/50 border-[#E5B88A]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-slate-900">
                      {format(d, 'EEEE')}
                    </div>
                    <div className="text-sm text-slate-600">
                      {format(d, 'MMMM d, yyyy')}
                    </div>
                  </div>
                  {isToday && (
                    <div className="px-3 py-1 bg-[#C18B5E] text-white text-xs font-semibold rounded-full">
                      Today
                    </div>
                  )}
                </div>
              </div>

              {/* Meal types */}
              <div className="divide-y divide-slate-200">
                {MEAL_TYPES.map((mealType) => {
                  const dayMeals = (mealsByDate[key] ?? []).filter((m) => m.mealType === mealType);
                  const cellKey = makeCellKey(key, mealType);
                  const isSelected = selectedCells.has(cellKey);
                  const config = MEAL_TYPE_CONFIG[mealType as keyof typeof MEAL_TYPE_CONFIG];
                  const Icon = config.icon;

                  return (
                    <div
                      key={`${key}-${mealType}`}
                      className={`p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#F5EBE0] ring-2 ring-inset ring-[#D4A574]'
                          : 'hover:bg-slate-50'
                      }`}
                      onClick={(e) => onCellClick(key, mealType, e)}
                    >
                      {/* Meal type header */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${config.gradient}`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-slate-900 capitalize">
                          {mealType}
                        </span>
                      </div>

                      {/* Meal content */}
                      <div className="min-h-[60px]">
                        {dayMeals.length > 0 ? (
                          <CellWithMeals
                            dateKey={key}
                            mealType={mealType}
                            dayMeals={dayMeals}
                            recipes={recipes}
                            isMerged={!!activePlan?.connectionId}
                            partnerId={activePlan?.partnerId}
                            onShowRecipeForm={onShowRecipeForm}
                            onShowSimpleEdit={onShowSimpleEdit}
                            renderAddControl={(triggerRef) => (
                              <AddMealControl
                                key={`add-control-trigger-mobile-${key}-${mealType}`}
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
                                  if (isSelected && selectedCells.size > 1 && addMealToSelectedCells) {
                                    void addMealToSelectedCells('', mealName);
                                    return;
                                  }
                                  if (!activePlan) return;
                                  const command = new CreatePlannedMealCommand(
                                    activePlan.id,
                                    {
                                      date: parseLocalDateKey(key),
                                      mealType,
                                      customMeal: mealName,
                                      servings: 2,
                                      peopleCount: 2,
                                      status: 'planned',
                                    },
                                    mealName
                                  );
                                  void executeCommand(command);
                                }}
                              />
                            )}
                          />
                        ) : (
                          <AddMealControl
                            key={`add-control-empty-mobile-${key}-${mealType}`}
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
                              if (isSelected && selectedCells.size > 1 && addMealToSelectedCells) {
                                void addMealToSelectedCells('', mealName);
                                return;
                              }
                              if (!activePlan) return;
                              const command = new CreatePlannedMealCommand(
                                activePlan.id,
                                {
                                  date: parseLocalDateKey(key),
                                  mealType,
                                  customMeal: mealName,
                                  servings: 2,
                                  peopleCount: 2,
                                  status: 'planned',
                                },
                                mealName
                              );
                              void executeCommand(command);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop view - Table layout */}
      <div className="hidden md:block overflow-x-auto">
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
                  isToday ? 'bg-[#F5EBE0]/20' : ''
                }`}
              >
                {/* Date column */}
                <td
                  className={`sticky left-0 z-10 border-r-2 border-slate-200 p-4 font-medium ${
                    isToday ? 'bg-[#F5EBE0]/30' : 'bg-slate-50/50'
                  }`}
                >
                  <div className="text-sm font-bold text-slate-900">
                    {format(d, 'EEE')}
                  </div>
                  <div className="text-xs text-slate-600">
                    {format(d, 'MMM d')}
                  </div>
                  {isToday && (
                    <div className="text-xs font-semibold text-[#C18B5E] mt-1">
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
                          ? 'ring-4 ring-inset ring-[#D4A574] bg-[#F5EBE0]/30'
                          : 'hover:bg-slate-100/50'
                      }`}
                      onClick={(e) => onCellClick(key, mealType, e)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        void (async (): Promise<void> => {
                          if (!activePlan) return;
                          const targetDate = parseLocalDateKey(key);

                          // Handle meal option drop (quick add options like "Leftovers")
                          const optionName = e.dataTransfer.getData('text/meal-option');
                          if (optionName) {
                            const command = new CreatePlannedMealCommand(
                              activePlan.id,
                              {
                                date: targetDate,
                                mealType,
                                customMeal: optionName,
                                servings: 4,
                                peopleCount: 4,
                                status: 'planned',
                              },
                              optionName
                            );
                            await executeCommand(command);
                            return;
                          }

                          // Handle recipe drop
                          const recipeDragged = e.dataTransfer.getData('text/recipe-id');
                          if (recipeDragged) {
                            const recipeName = recipes.find(r => r.id === recipeDragged)?.name || 'Recipe';
                            const command = new CreatePlannedMealCommand(
                              activePlan.id,
                              {
                                date: targetDate,
                                mealType,
                                recipeId: recipeDragged,
                                servings: 4,
                                peopleCount: 4,
                                status: 'planned',
                              },
                              recipeName
                            );
                            await executeCommand(command);
                            return;
                          }

                          // Handle shared backlog item drop - use UseBacklogItemCommand
                          const backlogItemData = e.dataTransfer.getData('text/backlog-item');
                          if (backlogItemData) {
                            try {
                              const backlogItemParsed = JSON.parse(backlogItemData) as {
                                id: string;
                                mealName: string;
                                recipeId?: string;
                                servings: number;
                                peopleCount: number;
                              };

                              // Use the command pattern for undo support
                              const command = new UseBacklogItemCommand(
                                {
                                  id: backlogItemParsed.id,
                                  mealName: backlogItemParsed.mealName,
                                  recipeId: backlogItemParsed.recipeId,
                                  servings: backlogItemParsed.servings,
                                  peopleCount: backlogItemParsed.peopleCount,
                                },
                                activePlan.id,
                                targetDate,
                                mealType
                              );
                              await executeCommand(command);
                              return;
                            } catch (err) {
                              logger.error('MealPlanning', err instanceof Error ? err : new Error(String(err)), { context: 'handleBacklogDrop' });
                            }
                          }

                          const mealId = e.dataTransfer.getData('text/meal-id');
                          if (!mealId) return;
                          const fromBacklog = e.dataTransfer.getData('text/from-backlog') === 'true';
                          const sourceMeal = activePlan.meals?.find((m) => m.id === mealId);
                          if (!sourceMeal) return;

                          const mealName = recipes.find(r => r.id === sourceMeal.recipeId)?.name || sourceMeal.customMeal || 'Meal';

                          if (e.altKey && !fromBacklog) {
                            // Alt+drag creates a copy - use command for undo
                            const command = new CreatePlannedMealCommand(
                              activePlan.id,
                              {
                                date: targetDate,
                                mealType,
                                recipeId: sourceMeal.recipeId,
                                customMeal: sourceMeal.customMeal,
                                servings: sourceMeal.servings ?? 4,
                                peopleCount: sourceMeal.peopleCount ?? sourceMeal.servings ?? 4,
                                status: 'planned',
                              },
                              `${mealName} (copy)`
                            );
                            await executeCommand(command);
                          } else {
                            // Move the meal to the new date/mealType - use command for undo
                            const command = new MovePlannedMealCommand(
                              mealId,
                              mealName,
                              targetDate,
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
                      {highlight && <div className="absolute inset-y-0 left-0 w-1 bg-[#C18B5E]" aria-hidden />}
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
                          isMerged={!!activePlan?.connectionId}
                          partnerId={activePlan?.partnerId}
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
                                  void addMealToSelectedCells('', mealName);
                                  return;
                                }

                                // Otherwise, add to just this cell with command pattern for undo
                                if (!activePlan) return;
                                const command = new CreatePlannedMealCommand(
                                  activePlan.id,
                                  {
                                    date: parseLocalDateKey(key),
                                    mealType,
                                    customMeal: mealName,
                                    servings: 2,
                                    peopleCount: 2,
                                    status: 'planned',
                                  },
                                  mealName
                                );
                                void executeCommand(command);
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
                              void addMealToSelectedCells('', mealName);
                              return;
                            }

                            // Otherwise, add to just this cell with command pattern for undo
                            if (!activePlan) return;
                            const command = new CreatePlannedMealCommand(
                              activePlan.id,
                              {
                                date: parseLocalDateKey(key),
                                mealType,
                                customMeal: mealName,
                                servings: 2,
                                peopleCount: 2,
                                status: 'planned',
                              },
                              mealName
                            );
                            void executeCommand(command);
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
      </div>

      {/* Meal Backlog Section - lazy loaded */}
      {(() => {
        const postponedMeals = useMemo(() => {
          return activePlan?.meals?.filter((m) => m.isPostponed) || [];
        }, [activePlan?.meals]);

        const isMerged = !!activePlan?.connectionId;

        return (
          <Suspense fallback={<BacklogLoadingFallback />}>
            <MealBacklogSection
              postponedMeals={postponedMeals}
              recipes={recipes}
              isMerged={isMerged}
              onReschedule={handleOpenRescheduleModal}
            />
          </Suspense>
        );
      })()}

      {/* Reschedule Modal */}
      <RescheduleMealModal
        isOpen={rescheduleModalOpen}
        onClose={handleCloseRescheduleModal}
        meal={mealToReschedule}
        weekStartsOn={weekDays[0]?.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6}
        onReschedule={handleReschedule}
      />
    </div>
  );
}
