/* eslint-disable max-lines */
import React, { type ReactElement, useEffect, useMemo, useState, useCallback, Suspense, lazy } from 'react';
import { logger } from '../services/logger';
import { createPortal } from 'react-dom';
import { addDays, format, isSameWeek, startOfWeek, isSameDay } from 'date-fns';
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';
import { ChefHat, Plus, Save, Heart, Search, X } from 'lucide-react';
import DatePickerPopover from '../components/DatePickerPopover';
import ErrorState from '../components/ErrorState';
import { useComposedStore } from '../stores/useComposedStore';
import { useToast } from '../hooks/useToast';
import { useThemeColors } from '../hooks/useThemeColors';
import type { PlannedMeal, Recipe } from '../types';
import type { PlannedMealInput, PlannedMealUpdate, RecipeInput } from '@/hooks/mealPlanning/types';
import {
  useRecipesQuery,
  useMealPlansQuery,
  useCreateRecipeMutation,
  useDeleteRecipeMutation,
  useDeleteAllRecipesMutation,
  useCreateMealPlanMutation,
  useCreatePlannedMealMutation,
  useUpdatePlannedMealMutation,
  useMergedConnectionQuery,
} from '@/hooks/useMealPlanningQuery';
import { getShoppingLists, createShoppingList, createShoppingItem } from '@/api/shoppingAPI';
import { useQueryClient } from '@tanstack/react-query';
import { shoppingKeys } from '@/hooks/useShoppingQuery';
import type { GroceryItem } from '@/mealPlanning/hooks/useGroceryList';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { useMealsState, type TabView } from '../meals/hooks';
import { TodayView, WeekView, RecipesView, GroceryView } from '../meals/components/views';
import type { BatchSessionGrocery } from '../meals/components/views/GroceryView';
import { MealFormModalV2 } from '../meals/components/v2/MealFormModalV2';
import { BatchCookSessionModal } from '../meals/components/v2/BatchCookSessionModal';
import { FridgePoolV2 } from '../meals/components/v2/FridgePoolV2';
import { QuickLogModal } from '../meals/components/v2/QuickLogModal';
import {
  useActiveSessionsQuery,
  useCreateBatchCookSession,
  useDeleteBatchCookSession,
  useAddDishToSession,
  useCreateMealLog,
  useMealLogsQuery,
  useUpdateDishServings,
  useUpdateDishName,
  useUpdateDishRecipe,
} from '../hooks/mealPlanning/useBatchCookQueries';
import type { BatchCookDish } from '../meals/types';

// Import hooks
import { useMealFormModals } from '../mealPlanning/hooks/useMealFormModals';
import { useWeekNavigation } from '../mealPlanning/hooks/useWeekNavigation';
import { useRecipeImport } from '../mealPlanning/hooks/useRecipeImport';
import { useGroceryList } from '../mealPlanning/hooks/useGroceryList';
import { useMultiCellSelection } from '../mealPlanning/hooks/useMultiCellSelection';
import { useRecipeFiltering } from '../mealPlanning/hooks/useRecipeFiltering';
import { useWeekCopy } from '../mealPlanning/hooks/useWeekCopy';

// Import components
import RecipeCard from '../mealPlanning/components/recipe/RecipeCard';
import CellWithMeals from '../mealPlanning/components/mealPlan/CellWithMeals';
import AddMealControl from '../mealPlanning/components/mealPlan/AddMealControl';

// Import layout components (core - always needed)
import { MealPlanToolbar } from '../mealPlanning/components/layout/MealPlanToolbar';
import { SelectionToolbar } from '../mealPlanning/components/layout/SelectionToolbar';
import { WeeklyOverviewSection } from '../mealPlanning/components/layout/WeeklyOverviewSection';
import { ModalContainer } from '../mealPlanning/components/layout/ModalContainer';

// Lazy load heavy components to reduce initial bundle size
const MealPlanNutritionSummary = lazy(() =>
  import('../mealPlanning/components/layout/MealPlanNutritionSummary').then(m => ({ default: m.MealPlanNutritionSummary }))
);
const SavedRecipesSection = lazy(() =>
  import('../mealPlanning/components/layout/SavedRecipesSection').then(m => ({ default: m.SavedRecipesSection }))
);
const ImportSections = lazy(() =>
  import('../mealPlanning/components/layout/ImportSections').then(m => ({ default: m.ImportSections }))
);

// Loading fallback for lazy-loaded sections
const SectionLoadingFallback = () => (
  <div className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg h-32 flex items-center justify-center">
    <div className="text-gray-400 dark:text-gray-500 text-sm">Loading...</div>
  </div>
);


// Import utilities
import { toKey, ensureDate, parseLocalDateKey } from '../mealPlanning/utils';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

// Cleanup old meal drafts from localStorage (older than 7 days)
const cleanupOldDrafts = (): void => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('meal-draft-')) {
        const match = key.match(/meal-draft-(\d{4}-\d{2}-\d{2})/);
        if (match) {
          const draftDate = new Date(match[1]);
          if (draftDate < sevenDaysAgo) {
            keysToRemove.push(key);
          }
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    if (keysToRemove.length > 0) {
      logger.debug('MealPlanning', `Cleaned up ${keysToRemove.length} old meal drafts`);
    }
  } catch (error) {
    logger.error('MealPlanning', error as Error, { context: 'Failed to cleanup old drafts' });
  }
};

const MealPlanningContent: React.FC = () => {
  // Theme colors
  const colors = useThemeColors();
  const queryClient = useQueryClient();

  // Tab navigation
  const { activeTab, setActiveTab } = useMealsState();

  // State for the "Plan Meal" modal (picks from existing recipes or custom name)
  const [addMealModal, setAddMealModal] = useState<{ date: Date; mealType: string } | null>(null);

  // Batch cook state
  const [showBatchCookModal, setShowBatchCookModal] = useState(false);
  const [quickLogModal, setQuickLogModal] = useState<{
    preSelectedDish?: BatchCookDish;
    preSelectedMealType?: string;
  } | null>(null);

  const { data: activeSessions = [] } = useActiveSessionsQuery();
  // Convenience alias — the most recent active session (first item, since sorted DESC).
  // Used for grocery ingredients, dish-name map, and QuickLogModal.
  const activeSession = activeSessions[0] ?? null;
  const createBatchSessionMutation = useCreateBatchCookSession();
  const deleteBatchSessionMutation = useDeleteBatchCookSession();
  const addDishToSessionMutation = useAddDishToSession();
  const createMealLogMutation = useCreateMealLog();
  const updateDishServingsMutation = useUpdateDishServings();
  const updateDishNameMutation = useUpdateDishName();
  const updateDishRecipeMutation = useUpdateDishRecipe();

  // React Query hooks
  const {
    data: recipes = [],
    error: recipesError,
    refetch: refetchRecipes,
  } = useRecipesQuery();

  // Debug: Log recipes data
  useEffect(() => {
    logger.debug('MealPlanning', 'Recipes loaded:', { count: recipes.length });
    if (recipesError) {
      logger.error('MealPlanning', recipesError instanceof Error ? recipesError : new Error(String(recipesError)), { context: 'recipesQuery' });
    }
  }, [recipes, recipesError]);
  const {
    data: mealPlans = [],
    isLoading: mealPlansLoading,
    error: mealPlansError,
    refetch: refetchMealPlans,
  } = useMealPlansQuery();
  const createRecipeMutation = useCreateRecipeMutation();
  const createPlannedMealMutation = useCreatePlannedMealMutation();
  const updatePlannedMealMutation = useUpdatePlannedMealMutation();
  const deleteRecipeMutation = useDeleteRecipeMutation();
  const deleteAllRecipesMutation = useDeleteAllRecipesMutation();
  const createMealPlanMutation = useCreateMealPlanMutation();

  // Global UI settings
  const { weekStartsOn } = useComposedStore();
  const { showToast } = useToast();

  // Wrapper functions to adapt mutation signatures (defined early for hook dependencies)
  // Wrapped in useCallback to prevent infinite loops
  const createPlannedMealWrapper = useCallback(async (data: { planId: string; meal: PlannedMealInput }): Promise<void> => {
    await createPlannedMealMutation.mutateAsync(data);
  }, [createPlannedMealMutation]);

  const updatePlannedMealWrapper = useCallback(async (data: { mealId: string; updates: PlannedMealUpdate }): Promise<void> => {
    await updatePlannedMealMutation.mutateAsync(data);
  }, [updatePlannedMealMutation]);

  const _createRecipeWrapper = useCallback(async (recipe: RecipeInput): Promise<Recipe> => {
    return await createRecipeMutation.mutateAsync(recipe);
  }, [createRecipeMutation]);

  // Delete recipe with confirmation
  const handleDeleteRecipe = useCallback(async (recipeId: string) => {
    logger.debug('MealPlanning', 'Attempting to delete recipe', { recipeId });

    try {
      await deleteRecipeMutation.mutateAsync(recipeId);
      showToast('Recipe deleted successfully! 🗑️', 'success');
    } catch (error) {
      logger.error('MealPlanning', error as Error, { context: 'deleteRecipe', recipeId });
      showToast('Failed to delete recipe. Please try again.', 'error');
    }
  }, [deleteRecipeMutation, showToast]);

  if (recipesError || mealPlansError) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:gap-6 p-3 sm:p-6">
        <ErrorState
          title="Unable to load meal planning data"
          message="Meal plans or recipes could not be loaded. Please try again."
          error={recipesError ?? mealPlansError}
          onRetry={() => {
            void refetchRecipes();
            void refetchMealPlans();
          }}
        />
      </div>
    );
  }

  // Custom hooks
  const modalState = useMealFormModals();
  const weekNav = useWeekNavigation(weekStartsOn, mealPlans);
  const recipeImport = useRecipeImport();

  // Fetch meal logs for the currently-visible week so they appear in the Week grid
  const weekFrom = weekNav.weekDays[0] ? format(weekNav.weekDays[0], 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  const weekTo   = weekNav.weekDays[6] ? format(weekNav.weekDays[6], 'yyyy-MM-dd') : weekFrom;
  const { data: weekMealLogs = [] } = useMealLogsQuery(weekFrom, weekTo);

  // Get merged connection info for partner tracking
  const { data: mergedConnection } = useMergedConnectionQuery();

  // Enhance activePlan with partnerId from merged connection
  const activePlanWithPartnerId = useMemo(() => {
    if (!weekNav.activePlan) return null;
    return {
      ...weekNav.activePlan,
      partnerId: mergedConnection?.partnerId,
    };
  }, [weekNav.activePlan, mergedConnection?.partnerId]);

  // Auto-create meal plan if missing for current week
  useEffect(() => {
    if (!weekNav.activePlan && !mealPlansLoading && !weekNav.isEnsuringPlan) {
      void createMealPlanMutation.mutateAsync({
        weekStartDate: weekNav.currentWeekStart,
        name: 'Meal Plan',
        weekStartsOn,
      }).then(() => {
        showToast('Meal plan created for this week', 'success');
      }).catch((error) => {
        logger.error('MealPlanning', error as Error, { context: 'Failed to create meal plan' });
        showToast('Failed to create meal plan', 'error');
      });
    }
  }, [weekNav.activePlan, weekNav.currentWeekStart, weekNav.isEnsuringPlan, mealPlansLoading, createMealPlanMutation, weekStartsOn, showToast]);

  // Memoize the grocery storage key to prevent infinite loops
  const groceryStorageKey = useMemo(() => toKey(weekNav.currentWeekStart), [weekNav.currentWeekStart]);

  const groceryState = useGroceryList(
    weekNav.activePlan?.meals ?? [],
    recipes,
    groceryStorageKey
  );
  const multiCellSelection = useMultiCellSelection(
    recipes,
    mealPlans,
    weekNav.activePlan,
    createPlannedMealWrapper,
    showToast
  );

  // Recipe filtering hook
  const recipeFiltering = useRecipeFiltering(recipes);

  // Week copy hook - memoize the initial target week to prevent infinite loops
  const initialCopyTargetWeek = useMemo(() => addDays(weekNav.currentWeekStart, 7), [weekNav.currentWeekStart]);
  const weekCopy = useWeekCopy(initialCopyTargetWeek);

  // Cleanup old drafts on mount
  useEffect(() => {
    cleanupOldDrafts();
  }, []);

  const plannedMeals = useMemo(() => {
    const meals = weekNav.activePlan?.meals ?? [];
    // Deduplicate meals by ID to prevent React key warnings
    const seenIds = new Set<string>();
    return meals.filter((meal) => {
      if (seenIds.has(meal.id)) {
        return false;
      }
      seenIds.add(meal.id);
      return true;
    });
  }, [weekNav.activePlan?.meals]);

  const mealsByDate: Record<string, PlannedMeal[]> = useMemo(() => {
    // Filter out postponed meals - they appear in the backlog instead
    const activeMeals = plannedMeals.filter((meal) => !meal.isPostponed);
    const result = activeMeals.reduce<Record<string, PlannedMeal[]>>((acc, meal) => {
      const key = toKey(ensureDate(meal.date));
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(meal);
      return acc;
    }, {});
    return result;
  }, [plannedMeals]);

  const isLoading = mealPlansLoading || weekNav.isEnsuringPlan;

  // Get today's meals for Today view
  const todaysMeals = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return plannedMeals.filter(meal => format(ensureDate(meal.date), 'yyyy-MM-dd') === today);
  }, [plannedMeals]);

  // Build a flat dish id→name map from ALL active sessions so the week view
  // shows correct log labels regardless of which session the dish belongs to.
  const allDishesMap = useMemo(() => {
    const map = new Map<string, string>();
    activeSessions.forEach(s => {
      s.dishes.forEach(d => {
        map.set(d.id, d.customName ?? d.recipeName ?? 'Meal');
      });
    });
    return map;
  }, [activeSessions]);

  // Build lookup for the Week view: 'yyyy-MM-dd-mealtype' → display names.
  const mealLogsByDate = useMemo(() => {
    const map: Record<string, string[]> = {};
    weekMealLogs.forEach(log => {
      const key = `${log.loggedDate}-${log.mealType}`;
      const name = log.customName
        ?? (log.batchDishId ? allDishesMap.get(log.batchDishId) : undefined)
        ?? 'Meal';
      if (!map[key]) map[key] = [];
      if (!map[key].includes(name)) map[key].push(name);
    });
    return map;
  }, [weekMealLogs, allDishesMap]);

  // Copy week handler
  const handleCopyWeek = async (): Promise<void> => {
    try {
      await weekCopy.copyWeek(plannedMeals, weekNav.currentWeekStart, mealPlans, weekStartsOn, showToast);
      modalState.setShowCopyWeek(false);
      weekNav.goToWeek(weekCopy.copyTargetWeek);
    } catch (error) {
      logger.error('MealPlanning', error instanceof Error ? error : new Error(String(error)), { context: 'copyWeek' });
    }
  };

  // Parse a raw ingredient string like "1/2 cup blueberries" into {name, quantity, unit}.
  // This handles legacy recipes created via the old textarea form where the whole line
  // was stored as the ingredient name with no separate amount/unit fields.
  const parseIngredientItem = (item: GroceryItem): { name: string; quantity: number; unit?: string } => {
    if (item.amount) {
      // Already has structured data — use it directly
      return {
        name: item.name.trim(),
        quantity: parseFloat(item.amount) || 1,
        unit: item.unit,
      };
    }
    // Try to parse "1/2 cup blueberries" or "2 cups milk" from the name
    const match = item.name.match(
      /^((\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(cups?|tbsp|tsp|oz|lbs?|g|kg|ml|piece|pcs|pinch|cloves?|whole)?\s+(.+)$/i
    );
    if (match) {
      const rawAmt = match[1].trim();
      const unit = match[3]?.toLowerCase();
      const name = match[4].trim();
      // Evaluate fraction strings like "1/2" or "1 1/2"
      let quantity = 1;
      if (rawAmt.includes('/')) {
        const parts = rawAmt.split(/\s+/);
        if (parts.length === 2) {
          // Mixed number: "1 1/2"
          const [whole, frac] = parts;
          const [num, den] = frac.split('/');
          quantity = parseInt(whole) + parseInt(num) / parseInt(den);
        } else {
          const [num, den] = rawAmt.split('/');
          quantity = parseInt(num) / parseInt(den);
        }
      } else {
        quantity = parseFloat(rawAmt) || 1;
      }
      return { name, quantity, unit };
    }
    return { name: item.name.trim(), quantity: 1, unit: item.unit };
  };

  // Send grocery items to shopping list
  const handleSendToShoppingList = useCallback(async (items: GroceryItem[]): Promise<{ success: boolean; count: number }> => {
    try {
      // Get or create shopping list
      let lists = await getShoppingLists();
      let targetList = lists.find(l => l.name === 'My Shopping List' || l.status === 'active');

      if (!targetList) {
        targetList = await createShoppingList({
          name: 'My Shopping List',
          status: 'active',
        });
      }

      if (!targetList?.id) {
        throw new Error('Failed to get or create shopping list');
      }

      // Add each item, parsing ingredient strings where needed
      let successCount = 0;
      for (const item of items) {
        try {
          const parsed = parseIngredientItem(item);
          await createShoppingItem(targetList.id, {
            name: parsed.name.charAt(0).toUpperCase() + parsed.name.slice(1),
            quantity: parsed.quantity,
            unit: parsed.unit ?? undefined,
            is_purchased: false,
          });
          successCount++;
        } catch (itemError) {
          logger.warn('MealPlanning', itemError instanceof Error ? itemError : new Error(String(itemError)), {
            context: 'addItemToShoppingList',
            itemName: item.name,
          });
        }
      }

      if (successCount > 0) {
        // Invalidate the shopping query cache so the Shopping page reflects new items immediately
        void queryClient.invalidateQueries({ queryKey: shoppingKeys.all });
        showToast(`Added ${successCount} item${successCount !== 1 ? 's' : ''} to Shopping List! 🛒`, 'success');
      }

      return { success: successCount > 0, count: successCount };
    } catch (error) {
      logger.error('MealPlanning', error instanceof Error ? error : new Error(String(error)), { context: 'sendItemsToShoppingList' });
      showToast('Failed to add items to Shopping List', 'error');
      return { success: false, count: 0 };
    }
  }, [showToast, queryClient]);

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-4" style={{ color: colors.text.primary }}>
            <span className="text-4xl">🍽️</span>
            Meals
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <SegmentedControl
            segments={[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'Week' },
              { value: 'recipes', label: 'Recipes' },
              { value: 'grocery', label: 'Grocery' },
            ]}
            value={activeTab}
            onChange={(value) => setActiveTab(value as TabView)}
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'today' && (
          <>
            {/* Fridge Pool — shown when any session has food remaining */}
            {activeSessions.length > 0 && (
              <FridgePoolV2
                sessions={activeSessions}
                recipes={recipes}
                onLogFromPool={(dish, mealType) => {
                  setQuickLogModal({ preSelectedDish: dish, preSelectedMealType: mealType });
                }}
                onRenameDish={async (dish, newName) => {
                  try {
                    await updateDishNameMutation.mutateAsync({ dishId: dish.id, customName: newName });
                  } catch (err) {
                    logger.error('MealPlanning', err as Error, { context: 'renameDish' });
                    showToast('Failed to rename dish', 'error');
                  }
                }}
                onLinkRecipe={async (dish, recipeId) => {
                  try {
                    await updateDishRecipeMutation.mutateAsync({ dishId: dish.id, recipeId });
                    showToast(recipeId ? 'Recipe linked! Shopping list will now include its ingredients.' : 'Recipe unlinked.', 'success');
                  } catch (err) {
                    logger.error('MealPlanning', err as Error, { context: 'linkDishRecipe' });
                    showToast('Failed to link recipe', 'error');
                  }
                }}
                onMarkDone={async (dish) => {
                  try {
                    await updateDishServingsMutation.mutateAsync({ dishId: dish.id, servingsRemaining: 0 });
                    showToast(`${dish.customName ?? dish.recipeName ?? 'Dish'} marked as all gone`, 'success');
                  } catch (err) {
                    logger.error('MealPlanning', err as Error, { context: 'markDishDone' });
                    showToast('Failed to update dish', 'error');
                  }
                }}
                onNewSession={() => setShowBatchCookModal(true)}
                onCreateRecipeForDish={(dishId, dishName) => {
                  modalState.openRecipeForm(dishName, async (recipeData) => {
                    try {
                      const newRecipe = await _createRecipeWrapper(recipeData);
                      await updateDishRecipeMutation.mutateAsync({ dishId, recipeId: newRecipe.id });
                      modalState.closeRecipeForm();
                      showToast(`Recipe created and linked to "${dishName}" 🎉`, 'success');
                    } catch (err) {
                      logger.error('MealPlanning', err as Error, { context: 'createRecipeForDishFromPool' });
                      showToast('Failed to create recipe', 'error');
                    }
                  });
                }}
                onAddDish={async (sessionId, name, servings) => {
                  try {
                    await addDishToSessionMutation.mutateAsync({ sessionId, customName: name, servingsCooked: servings });
                    showToast(`"${name}" added to session! 🍳`, 'success');
                  } catch (err) {
                    logger.error('MealPlanning', err as Error, { context: 'addDishToSession' });
                    showToast('Failed to add dish', 'error');
                  }
                }}
                onDeleteSession={async (sessionId) => {
                  try {
                    await deleteBatchSessionMutation.mutateAsync(sessionId);
                    showToast('Session deleted', 'success');
                  } catch (err) {
                    logger.error('MealPlanning', err as Error, { context: 'deleteSession' });
                    showToast('Failed to delete session', 'error');
                  }
                }}
                onEditRecipe={modalState.openRecipeEdit}
              />
            )}

            {/* Start batch cook session CTA when no active session */}
            {activeSessions.length === 0 && (
              <div
                className="mb-6 p-4 rounded-2xl border-2 border-dashed flex items-center justify-between"
                style={{ borderColor: 'rgba(212, 165, 116, 0.4)', backgroundColor: 'rgba(212, 165, 116, 0.04)' }}
              >
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#C18B5E' }}>
                    🍳 Batch cook this week?
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Record what you cooked and track it through the week
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBatchCookModal(true)}
                  className="px-4 py-2 rounded-xl font-semibold text-sm text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
                >
                  Start Session
                </button>
              </div>
            )}
          </>
        )}
        {/* Only show the traditional meal planning slots when there's no active batch cook session.
            When batch cooking, the Fridge Pool above replaces this entirely. */}
        {activeTab === 'today' && activeSessions.length === 0 && (
          <TodayView
            todaysMeals={todaysMeals}
            recipes={recipes}
            onAddMeal={(mealType) => {
              setAddMealModal({ date: new Date(), mealType });
            }}
            onLogMeal={(mealId) => {
              const updates: PlannedMealUpdate = { status: 'logged' };
              void updatePlannedMealWrapper({ mealId, updates });
              showToast('Meal logged!', 'success');
            }}
            onEditMeal={(meal) => {
              modalState.openSimpleEdit(meal);
            }}
          />
        )}

        {activeTab === 'week' && (
          <WeekView
            weekDays={weekNav.weekDays}
            mealsByDate={mealsByDate}
            recipes={recipes}
            onPreviousWeek={weekNav.goToPreviousWeek}
            onNextWeek={weekNav.goToNextWeek}
            onToday={weekNav.goToThisWeek}
            mealLogsByDate={mealLogsByDate}
            onCellClick={(date, mealType) => {
              setAddMealModal({ date: ensureDate(date) ?? new Date(), mealType });
            }}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipesView
            recipes={recipeFiltering.filteredRecipes}
            searchQuery={recipeFiltering.searchQuery}
            showFavoritesOnly={recipeFiltering.showFavoritesOnly}
            onSearchChange={recipeFiltering.setSearchQuery}
            onToggleFavorites={recipeFiltering.toggleFavoritesOnly}
            onViewRecipe={modalState.openRecipeView}
            onEditRecipe={modalState.openRecipeEdit}
            onDeleteRecipe={handleDeleteRecipe}
            onAddRecipe={() => modalState.openRecipeForm('', '')}
            sessionDishesNeedingRecipe={
              // Show unlinked dishes from ALL active sessions, not just the newest
              activeSessions.flatMap(s =>
                s.dishes
                  .filter(d => !d.recipeId && d.customName)
                  .map(d => ({ id: d.id, name: d.customName! }))
              )
            }
            onCreateRecipeForDish={(dishId, dishName) => {
              // Open recipe form pre-filled with dish name; on save, link the new recipe to the dish
              modalState.openRecipeForm(dishName, async (recipeData) => {
                try {
                  const newRecipe = await _createRecipeWrapper(recipeData);
                  await updateDishRecipeMutation.mutateAsync({ dishId, recipeId: newRecipe.id });
                  modalState.closeRecipeForm();
                  showToast(`Recipe created and linked to "${dishName}" 🎉`, 'success');
                } catch (err) {
                  logger.error('MealPlanning', err as Error, { context: 'createRecipeForDish' });
                  showToast('Failed to create recipe', 'error');
                }
              });
            }}
          />
        )}

        {activeTab === 'grocery' && (
          <GroceryView
            groceryList={groceryState.groceryList}
            neededItems={groceryState.neededItems}
            atHomeItems={groceryState.atHomeItems}
            onUpdateItemStatus={groceryState.updateItemStatus}
            onCopyToClipboard={() => {
              const text = groceryState.neededItems
                .map((item) => {
                  const amount =
                    item.amount && item.unit ? `${item.amount} ${item.unit}` : item.amount ?? '';
                  return `☐ ${amount} ${item.name}`.trim();
                })
                .join('\n');
              void navigator.clipboard.writeText(text);
              showToast('Shopping list copied to clipboard!', 'success');
            }}
            onSendToShoppingList={handleSendToShoppingList}
            allBatchSessions={(() => {
              // Build per-session grocery lists so the user can pick which session to shop for
              const normalizeIngKey = (name: string): string =>
                name.toLowerCase().trim()
                  .replace(/\s*\([^)]*\)/g, '')
                  .trim()
                  .replace(/ies$/i, 'y')
                  .replace(/ves$/i, 'f')
                  .replace(/es$/i, '')
                  .replace(/s$/i, '');

              const result: BatchSessionGrocery[] = activeSessions.map(s => {
                const seen = new Map<string, GroceryItem>();
                s.dishes.forEach(dish => {
                  if (!dish.recipeId) return;
                  const recipe = recipes.find(r => r.id === dish.recipeId);
                  recipe?.ingredients?.forEach(ing => {
                    const key = normalizeIngKey(ing.name);
                    if (!seen.has(key)) {
                      seen.set(key, { id: key, name: ing.name, amount: ing.amount, unit: ing.unit, recipes: [recipe.name], status: 'needed' });
                    }
                  });
                });
                return { id: s.id, name: s.name, ingredients: Array.from(seen.values()) };
              }).filter(s => s.ingredients.length > 0);

              return result.length > 0 ? result : undefined;
            })()}
            batchSessionName={activeSessions[0]?.name}
            batchIngredients={undefined}
          />
        )}

        {/* Batch Cook Session Modal */}
        <BatchCookSessionModal
          isOpen={showBatchCookModal}
          recipes={recipes}
          onClose={() => setShowBatchCookModal(false)}
          isPending={createBatchSessionMutation.isPending}
          onSubmit={async (input) => {
            try {
              await createBatchSessionMutation.mutateAsync(input);
              setShowBatchCookModal(false);
              showToast(`"${input.name}" session started! ${input.dishes.length} dish${input.dishes.length !== 1 ? 'es' : ''} in the pool 🍳`, 'success');
            } catch (err) {
              logger.error('MealPlanning', err as Error, { context: 'createBatchSession' });
              showToast('Failed to create batch cook session', 'error');
            }
          }}
        />

        {/* Quick Log Modal — log what you ate from the fridge pool */}
        {quickLogModal !== null && (
          <QuickLogModal
            isOpen={true}
            session={activeSession ?? null}
            preSelectedDish={quickLogModal.preSelectedDish}
            preSelectedMealType={quickLogModal.preSelectedMealType}
            isPending={createMealLogMutation.isPending}
            onClose={() => setQuickLogModal(null)}
            onSubmit={async ({ batchDishId, customName, mealType, servingsConsumed, notes }) => {
              try {
                await createMealLogMutation.mutateAsync({
                  loggedDate: format(new Date(), 'yyyy-MM-dd'),
                  mealType,
                  batchDishId,
                  customName,
                  servingsConsumed,
                  notes: notes || undefined,
                });
                setQuickLogModal(null);
                showToast('Meal logged! ✓', 'success');
              } catch (err) {
                logger.error('MealPlanning', err as Error, { context: 'logMeal' });
                showToast('Failed to log meal', 'error');
              }
            }}
          />
        )}

        {/* Plan Meal Modal — picks from existing recipes or enters a custom name */}
        {addMealModal && (
          <MealFormModalV2
            isOpen={true}
            date={addMealModal.date}
            mealType={addMealModal.mealType}
            recipes={recipes}
            onClose={() => setAddMealModal(null)}
            onSubmit={async ({ date, mealType, recipeId, customName, servings, notes }) => {
              try {
                if (!activePlanWithPartnerId?.id) {
                  showToast('No active meal plan. Please try again.', 'error');
                  return;
                }
                await createPlannedMealWrapper({
                  planId: activePlanWithPartnerId.id,
                  meal: {
                    date,
                    mealType,
                    recipeId: recipeId ?? undefined,
                    customMeal: customName ?? undefined,
                    servings,
                    status: 'planned',
                    notes: notes ?? '',
                    isPostponed: false,
                  },
                });
                setAddMealModal(null);
                showToast('Meal planned! 🍽️', 'success');
              } catch (err) {
                logger.error('MealPlanning', err as Error, { context: 'planMeal' });
                showToast('Failed to plan meal', 'error');
              }
            }}
          />
        )}

        {/* Modals */}
        <ModalContainer
          showGroceryList={modalState.showGroceryList}
          onCloseGroceryList={() => modalState.setShowGroceryList(false)}
          groceryList={groceryState.groceryList}
          neededItems={groceryState.neededItems}
          atHomeItems={groceryState.atHomeItems}
          inCartItems={groceryState.inCartItems}
          purchasedItems={groceryState.purchasedItems}
          weekStartDate={weekNav.currentWeekStart}
          updateItemStatus={groceryState.updateItemStatus}
          getStatusColor={groceryState.getStatusColor}
          onCopyCart={() => {
            const text = groceryState.inCartItems
              .map((item) => {
                const amount =
                  item.amount && item.unit ? `${item.amount} ${item.unit}` : item.amount ?? '';
                return `☐ ${amount} ${item.name}`.trim();
              })
              .join('\n');
            void navigator.clipboard.writeText(text);
            showToast('Shopping list copied to clipboard!', 'success');
          }}
          onSendToShoppingList={handleSendToShoppingList}
          showCopyWeek={modalState.showCopyWeek}
          onCloseCopyWeek={() => modalState.setShowCopyWeek(false)}
          sourceWeekStart={weekNav.currentWeekStart}
          targetWeekStart={weekCopy.copyTargetWeek}
          onTargetWeekChange={(d) => weekCopy.setCopyTargetWeek(startOfWeek(d, { weekStartsOn }))}
          mealCount={plannedMeals.length}
          weekStartsOn={weekStartsOn}
          onCopy={handleCopyWeek}
          recipeFormModal={modalState.recipeFormModal}
          onCloseRecipeForm={modalState.closeRecipeForm}
          simpleEditModal={modalState.simpleEditModal}
          onCloseSimpleEdit={modalState.closeSimpleEdit}
          editingRecipeId={modalState.editingRecipeId}
          onCloseRecipeEdit={modalState.closeRecipeEdit}
          onOpenRecipeEdit={modalState.openRecipeEdit}
          viewingRecipeId={modalState.viewingRecipeId}
          onCloseRecipeView={modalState.closeRecipeView}
          recipes={recipes}
        />
      </div>
    </div>
  );
};

// Wrap with error boundary for graceful error handling
const MealPlanning: React.FC = () => {
  return (
    <FeatureErrorBoundary feature="Meal Planning">
      <MealPlanningContent />
    </FeatureErrorBoundary>
  );
};

export default MealPlanning;
