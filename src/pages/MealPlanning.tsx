/* eslint-disable max-lines */
import React, { type ReactElement, useEffect, useMemo, useState, useCallback, Suspense, lazy } from 'react';
import { logger } from '../services/logger';
import { createPortal } from 'react-dom';
import { addDays, format, isSameWeek, startOfWeek, isSameDay } from 'date-fns';
import { ChefHat, Plus, Save, Heart, Search, X } from 'lucide-react';
import DatePickerPopover from '../components/DatePickerPopover';
import ErrorState from '../components/ErrorState';
import { useComposedStore } from '../stores/useComposedStore';
import { useToast } from '../hooks/useToast';
import type { PlannedMeal, Recipe } from '../types';
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
import { useUndoRedo } from '../contexts/UndoRedoContext';
import { DeleteRecipeCommand, CreateRecipeCommand } from '../commands/MealPlanningCommands';

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
    logger.error('MealPlanning', 'Failed to cleanup old drafts:', { error: error instanceof Error ? error.message : String(error) });
  }
};

const MealPlanning: React.FC = () => {
  // React Query hooks
  const {
    data: recipes = [],
    error: recipesError,
    refetch: refetchRecipes,
  } = useRecipesQuery();
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
  const { executeCommand } = useUndoRedo();

  // Wrapper functions to adapt mutation signatures (defined early for hook dependencies)
  // Wrapped in useCallback to prevent infinite loops
  const createPlannedMealWrapper = useCallback(async (data: { planId: string; meal: any }): Promise<void> => {
    await createPlannedMealMutation.mutateAsync(data);
  }, [createPlannedMealMutation]);

  const updatePlannedMealWrapper = useCallback(async (data: { mealId: string; updates: any }): Promise<void> => {
    await updatePlannedMealMutation.mutateAsync(data);
  }, [updatePlannedMealMutation]);

  const createRecipeWrapper = useCallback(async (recipe: Partial<Recipe>): Promise<Recipe> => {
    return await createRecipeMutation.mutateAsync(recipe as any);
  }, [createRecipeMutation]);

  // Delete recipe with command pattern for undo support
  const handleDeleteRecipe = useCallback((recipeId: string) => {
    const recipeToDelete = recipes.find(r => r.id === recipeId);
    if (!recipeToDelete) return;
    const command = new DeleteRecipeCommand(recipeToDelete);
    void executeCommand(command);
  }, [recipes, executeCommand]);

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
        logger.error('MealPlanning', 'Failed to create meal plan', { error });
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

  // Copy week handler
  const handleCopyWeek = async (): Promise<void> => {
    try {
      await weekCopy.copyWeek(plannedMeals, weekNav.currentWeekStart, mealPlans, weekStartsOn, showToast);
      modalState.setShowCopyWeek(false);
      weekNav.goToWeek(weekCopy.copyTargetWeek);
    } catch (error) {
      logger.error('MealPlanning', 'Failed to copy week:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:gap-6 p-3 sm:p-6">
      <MealPlanToolbar
        currentWeekStart={weekNav.currentWeekStart}
        weekStartsOn={weekStartsOn}
        onWeekChange={weekNav.goToWeek}
        onPreviousWeek={weekNav.goToPreviousWeek}
        onThisWeek={weekNav.goToThisWeek}
        onNextWeek={weekNav.goToNextWeek}
        onCopyWeek={() => modalState.setShowCopyWeek(true)}
        onShowGroceryList={() => modalState.setShowGroceryList(true)}
      />

      {/* Multi-cell selection toolbar */}
      {multiCellSelection.isSelectionMode && multiCellSelection.selectedCells.size > 0 && (
        <SelectionToolbar
          selectedCount={multiCellSelection.selectedCells.size}
          query={multiCellSelection.multiCellQuery}
          onQueryChange={multiCellSelection.setMultiCellQuery}
          matches={multiCellSelection.multiCellMatches}
          selectedIndex={multiCellSelection.multiCellSelectedIndex}
          onIndexChange={multiCellSelection.setMultiCellSelectedIndex}
          onKeyDown={(e) => void multiCellSelection.handleMultiCellKeyDown(e)}
          inputRef={multiCellSelection.multiCellInputRef}
          showList={multiCellSelection.showMultiCellList}
          onShowListChange={multiCellSelection.setShowMultiCellList}
          onAddMeal={multiCellSelection.addMealToSelectedCells}
          onDeleteMeals={multiCellSelection.deleteMealsFromSelectedCells}
          onClearSelection={multiCellSelection.clearSelection}
        />
      )}

      {/* Weekly overview */}
      <WeeklyOverviewSection
        isLoading={isLoading}
        weekDays={weekNav.weekDays}
        mealsByDate={mealsByDate}
        recipes={recipes}
        activePlan={activePlanWithPartnerId}
        selectedCells={multiCellSelection.selectedCells}
        makeCellKey={multiCellSelection.makeCellKey}
        onCellClick={multiCellSelection.handleCellClick}
        onShowRecipeForm={modalState.openRecipeForm}
        onShowSimpleEdit={modalState.openSimpleEdit}
        createPlannedMeal={createPlannedMealWrapper}
        updatePlannedMeal={updatePlannedMealWrapper}
        sharedInputValue={multiCellSelection.sharedInputValue}
        setSharedInputValue={multiCellSelection.setSharedInputValue}
        isAnySelectedCellEditing={multiCellSelection.isAnySelectedCellEditing}
        setIsAnySelectedCellEditing={multiCellSelection.setIsAnySelectedCellEditing}
        addMealToSelectedCells={multiCellSelection.addMealToSelectedCells}
      />

      {/* Nutrition summary - lazy loaded */}
      <Suspense fallback={<SectionLoadingFallback />}>
        <MealPlanNutritionSummary
          weekDays={weekNav.weekDays}
          plannedMeals={plannedMeals}
          recipes={recipes}
        />
      </Suspense>

      {/* Import sections - lazy loaded */}
      <Suspense fallback={<SectionLoadingFallback />}>
        <ImportSections
          recipeImport={recipeImport}
          createRecipe={createRecipeWrapper}
        />
      </Suspense>

      {/* Saved recipes - lazy loaded */}
      <Suspense fallback={<SectionLoadingFallback />}>
        <SavedRecipesSection
          recipes={recipeFiltering.filteredRecipes}
          allRecipesCount={recipes.length}
          showFavoritesOnly={recipeFiltering.showFavoritesOnly}
          onToggleFavorites={recipeFiltering.toggleFavoritesOnly}
          searchQuery={recipeFiltering.searchQuery}
          onSearchChange={recipeFiltering.setSearchQuery}
          onDeleteAll={deleteAllRecipesMutation.mutateAsync}
          onViewRecipe={modalState.openRecipeView}
          onEditRecipe={modalState.openRecipeEdit}
          onDeleteRecipe={handleDeleteRecipe}
        />
      </Suspense>

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
  );
};

export default MealPlanning;
