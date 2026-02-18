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
import type { GroceryItem } from '@/mealPlanning/hooks/useGroceryList';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { useMealsState, type TabView } from '../meals/hooks';
import { TodayView, WeekView, RecipesView, GroceryView } from '../meals/components/views';

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

  // Tab navigation
  const { activeTab, setActiveTab } = useMealsState();

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

  const createRecipeWrapper = useCallback(async (recipe: RecipeInput): Promise<Recipe> => {
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

  // Send grocery items to shopping list
  const handleSendToShoppingList = useCallback(async (items: GroceryItem[]): Promise<{ success: boolean; count: number }> => {
    try {
      // Get or create shopping list
      let lists = await getShoppingLists();
      let targetList = lists.find(l => l.name === 'My Shopping List' || l.status === 'active');

      if (!targetList) {
        // Create a new list
        targetList = await createShoppingList({
          name: 'My Shopping List',
          status: 'active',
        });
      }

      if (!targetList?.id) {
        throw new Error('Failed to get or create shopping list');
      }

      // Add each item to the shopping list
      let successCount = 0;
      for (const item of items) {
        try {
          await createShoppingItem(targetList.id, {
            name: item.name,
            quantity: item.amount ? parseFloat(item.amount) || 1 : 1,
            unit: item.unit ?? undefined,
            is_purchased: false,
          });
          successCount++;
        } catch (itemError) {
          logger.warn('MealPlanning', itemError instanceof Error ? itemError : new Error(String(itemError)), {
            context: 'addItemToShoppingList',
            itemName: item.name
          });
        }
      }

      if (successCount > 0) {
        showToast(`Added ${successCount} item${successCount !== 1 ? 's' : ''} to Shopping List!`, 'success');
      }

      return { success: successCount > 0, count: successCount };
    } catch (error) {
      logger.error('MealPlanning', error instanceof Error ? error : new Error(String(error)), { context: 'sendItemsToShoppingList' });
      showToast('Failed to add items to Shopping List', 'error');
      return { success: false, count: 0 };
    }
  }, [showToast]);

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-4" style={{ color: colors.text.primary }}>
            <span className="text-4xl">🍽️</span>
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
          <TodayView
            todaysMeals={todaysMeals}
            recipes={recipes}
            onAddMeal={(mealType) => {
              const today = format(new Date(), 'yyyy-MM-dd');
              modalState.openRecipeForm(today, mealType);
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
            onCellClick={(date, mealType) => {
              modalState.openRecipeForm(date, mealType);
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
