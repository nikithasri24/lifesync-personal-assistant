/* eslint-disable max-lines */
import React, { type ReactElement, useEffect, useMemo, useState , type FormEvent } from 'react';
import { logger } from '../services/logger';
import { createPortal } from 'react-dom';
import { addDays, format, isSameWeek, startOfWeek, isSameDay } from 'date-fns';
import { CalendarDays, ChefHat, Loader2, Plus, Save, Heart, Youtube, Search, X } from 'lucide-react';
import DatePickerPopover from '../components/DatePickerPopover';
import { useComposedStore } from '../stores/useComposedStore';
import { useToast } from '../hooks/useToast';
import type { PlannedMeal, Recipe } from '../types';
import {
  useRecipesQuery,
  useMealPlansQuery,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
  useDeleteAllRecipesMutation,
  useCreateMealPlanMutation,
  useCreatePlannedMealMutation,
  useUpdatePlannedMealMutation,
} from '../mealPlanning/hooks/useMealPlanningQuery';

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

// Import layout components
import { MealPlanToolbar } from '../mealPlanning/components/layout/MealPlanToolbar';
import { SelectionToolbar } from '../mealPlanning/components/layout/SelectionToolbar';
import { WeeklyGrid } from '../mealPlanning/components/layout/WeeklyGrid';
import { SavedRecipesSection } from '../mealPlanning/components/layout/SavedRecipesSection';
import { ImportSections } from '../mealPlanning/components/layout/ImportSections';
import { RecipeDraftPreview } from '../mealPlanning/components/layout/RecipeDraftPreview';

// Import modals
import { QuickRecipeModal } from '../mealPlanning/components/modals/QuickRecipeModal';
import { SimpleRecipeEditModal } from '../mealPlanning/components/modals/SimpleRecipeEditModal';
import { RecipeEditModal } from '../mealPlanning/components/modals/RecipeEditModal';
import { RecipeViewModal } from '../mealPlanning/components/modals/RecipeViewModal';
import { GroceryListModal } from '../mealPlanning/components/modals/GroceryListModal';
import { CopyWeekModal } from '../mealPlanning/components/modals/CopyWeekModal';

// Import utilities
import { toKey, ensureDate, parseLocalDateKey } from '../mealPlanning/utils';
import { fetchClippedRecipe } from '../mealPlanning/utils/recipeUtils';

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
  const { data: recipes = [], isLoading: _recipesLoading } = useRecipesQuery();
  const { data: mealPlans = [], isLoading: mealPlansLoading } = useMealPlansQuery();
  const createRecipeMutation = useCreateRecipeMutation();
  const _updateRecipeMutation = useUpdateRecipeMutation();
  const createPlannedMealMutation = useCreatePlannedMealMutation();
  const updatePlannedMealMutation = useUpdatePlannedMealMutation();
  const deleteRecipeMutation = useDeleteRecipeMutation();
  const deleteAllRecipesMutation = useDeleteAllRecipesMutation();
  const createMealPlanMutation = useCreateMealPlanMutation();

  // Global UI settings
  const { weekStartsOn, addNote } = useComposedStore();
  const { showToast } = useToast();

  // Wrapper functions to adapt mutation signatures (defined early for hook dependencies)
  const createPlannedMealWrapper = async (data: { planId: string; meal: any }): Promise<void> => {
    await createPlannedMealMutation.mutateAsync(data);
  };

  const updatePlannedMealWrapper = async (data: { mealId: string; updates: any }): Promise<void> => {
    await updatePlannedMealMutation.mutateAsync(data);
  };

  const createRecipeWrapper = async (recipe: Partial<Recipe>): Promise<Recipe> => {
    return await createRecipeMutation.mutateAsync(recipe as any);
  };

  // Custom hooks
  const modalState = useMealFormModals();
  const weekNav = useWeekNavigation(weekStartsOn, mealPlans);
  const recipeImport = useRecipeImport();
  const groceryState = useGroceryList(
    weekNav.activePlan?.meals ?? [],
    recipes,
    toKey(weekNav.currentWeekStart)
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

  // Week copy hook
  const weekCopy = useWeekCopy(addDays(weekNav.currentWeekStart, 7));

  // Cleanup old drafts on mount
  useEffect(() => {
    cleanupOldDrafts();
  }, []);

  const plannedMeals = useMemo(() => weekNav.activePlan?.meals ?? [], [weekNav.activePlan?.meals]);
  const mealsByDate: Record<string, PlannedMeal[]> = useMemo(() => {
    return plannedMeals.reduce<Record<string, PlannedMeal[]>>((acc, meal) => {
      const key = toKey(ensureDate(meal.date));
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(meal);
      return acc;
    }, {});
  }, [plannedMeals]);

  const isLoading = mealPlansLoading || weekNav.isEnsuringPlan;

  // Handle URL import
  const handleImportRecipe = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!recipeImport.importUrl.trim()) return;

    recipeImport.setIsImporting(true);
    recipeImport.setImportError(null);
    try {
      const recipe = await fetchClippedRecipe(recipeImport.importUrl.trim());
      recipeImport.setImportDraft(recipe);
      recipeImport.setImportUrl('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to import recipe.';
      recipeImport.setImportError(message);
    } finally {
      recipeImport.setIsImporting(false);
    }
  };

  const saveImportedRecipe = async (): Promise<void> => {
    if (!recipeImport.importDraft) return;
    try {
      await createRecipeMutation.mutateAsync(recipeImport.importDraft);
      recipeImport.clearUrlImport();
    } catch (_e) {
      recipeImport.setImportError('Failed to save recipe');
    }
  };

  const _saveImportedAsNote = async (): Promise<void> => {
    if (!recipeImport.importDraft) return;
    try {
      const title = recipeImport.importDraft.name ?? 'Imported Recipe';
      const lines: string[] = [];
      lines.push(`# ${title}`);
      if (recipeImport.importDraft.sourceUrl) {
        lines.push('');
        lines.push(`Source: ${recipeImport.importDraft.sourceUrl}`);
      }
      if (recipeImport.importDraft.description) {
        lines.push('');
        lines.push(recipeImport.importDraft.description);
      }
      if (Array.isArray(recipeImport.importDraft.ingredients) && recipeImport.importDraft.ingredients.length) {
        lines.push('');
        lines.push('## Ingredients');
        for (const ing of recipeImport.importDraft.ingredients) {
          const name = typeof ing === 'object' && ing !== null && 'name' in ing ? (ing as { name: string }).name : String(ing);
          lines.push(`- ${name}`);
        }
      }
      if (Array.isArray(recipeImport.importDraft.instructions) && recipeImport.importDraft.instructions.length) {
        lines.push('');
        lines.push('## Instructions');
        const instructions = recipeImport.importDraft.instructions as unknown[];
        instructions.forEach((step: unknown, idx: number) => {
          lines.push(`${idx + 1}. ${String(step)}`);
        });
      }
      const content = lines.join('\n');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await addNote({ title, content, tags: ['recipe', 'imported'] });
      recipeImport.clearUrlImport();
    } catch (_e: unknown) {
      recipeImport.setImportError('Failed to save as note');
    }
  };

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
          onClearSelection={multiCellSelection.clearSelection}
        />
      )}

      {/* Weekly overview */}
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

        {!isLoading && weekNav.weekDays.length > 0 && (
          <WeeklyGrid
            weekDays={weekNav.weekDays}
            mealsByDate={mealsByDate}
            recipes={recipes}
            activePlan={weekNav.activePlan}
            selectedCells={multiCellSelection.selectedCells}
            makeCellKey={multiCellSelection.makeCellKey}
            onCellClick={multiCellSelection.handleCellClick}
            onShowRecipeForm={modalState.openRecipeForm}
            onShowSimpleEdit={modalState.openSimpleEdit}
            createPlannedMeal={createPlannedMealWrapper}
            updatePlannedMeal={updatePlannedMealWrapper}
          />
        )}
      </section>

      {/* Import sections */}
      <ImportSections
        recipeImport={recipeImport}
        createRecipe={createRecipeWrapper}
        handleImportRecipe={handleImportRecipe}
        saveImportedRecipe={saveImportedRecipe}
      />

      {/* Saved recipes */}
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
        onDeleteRecipe={deleteRecipeMutation.mutate}
      />

      {/* Modals */}
      <GroceryListModal
        isOpen={modalState.showGroceryList}
        onClose={() => modalState.setShowGroceryList(false)}
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
      />

      <CopyWeekModal
        isOpen={modalState.showCopyWeek}
        onClose={() => modalState.setShowCopyWeek(false)}
        sourceWeekStart={weekNav.currentWeekStart}
        targetWeekStart={weekCopy.copyTargetWeek}
        onTargetWeekChange={(d) => weekCopy.setCopyTargetWeek(startOfWeek(d, { weekStartsOn }))}
        mealCount={plannedMeals.length}
        weekStartsOn={weekStartsOn}
        onCopy={handleCopyWeek}
      />

      {modalState.recipeFormModal && (
        <QuickRecipeModal
          initialName={modalState.recipeFormModal.initialName}
          onSave={modalState.recipeFormModal.onSave}
          onClose={modalState.closeRecipeForm}
        />
      )}

      {modalState.simpleEditModal && (
        <SimpleRecipeEditModal
          recipe={modalState.simpleEditModal.recipe}
          onSave={modalState.simpleEditModal.onSave}
          onClose={modalState.closeSimpleEdit}
        />
      )}

      {modalState.editingRecipeId && (() => {
        const recipe = recipes.find((r) => r.id === modalState.editingRecipeId);
        return recipe ? (
          <RecipeEditModal
            recipe={recipe}
            onClose={modalState.closeRecipeEdit}
          />
        ) : null;
      })()}

      {modalState.viewingRecipeId && (() => {
        const recipe = recipes.find((r) => r.id === modalState.viewingRecipeId);
        return recipe ? (
          <RecipeViewModal
            recipe={recipe}
            onClose={modalState.closeRecipeView}
            onEdit={() => {
              if (modalState.viewingRecipeId) {
                modalState.openRecipeEdit(modalState.viewingRecipeId);
                modalState.closeRecipeView();
              }
            }}
          />
        ) : null;
      })()}
    </div>
  );
};

export default MealPlanning;
