/**
 * REFACTORED MealPlanning.tsx - Example Structure
 *
 * This file demonstrates how the refactored MealPlanning component would look
 * after extracting hooks, modals, views, and utilities.
 *
 * BEFORE: 2,803 lines
 * AFTER: ~600-650 lines (estimated)
 * REDUCTION: ~75%
 */

import React, { useEffect, useMemo, useState } from 'react';
import { logger } from '../services/logger';
import { createPortal } from 'react-dom';
import { addDays, format, isSameWeek, startOfWeek, isSameDay } from 'date-fns';
import { CalendarDays, ChefHat, Loader2, Plus, Save, Pencil } from 'lucide-react';

// Date picker component
import DatePickerPopover from '../components/DatePickerPopover';

// App store
import { useAppStore } from '../stores/useAppStore';

// Types
import type { MealPlanWeek, PlannedMeal, Recipe } from '../types';

// React Query hooks (existing)
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
  useDeletePlannedMealMutation,
} from '../mealPlanning/hooks/useMealPlanningQuery';

// ✨ NEW: Custom hooks (reduces ~900 lines)
import {
  useWeekNavigation,
  useMealFormModals,
  useRecipeImport,
  useGroceryList,
  useMultiCellSelection,
} from '../mealPlanning/hooks';

// ✨ NEW: Modal components (reduces ~600 lines)
import {
  QuickRecipeModal,
  SimpleRecipeEditModal,
  RecipeEditModal,
  RecipeViewModal,
  GroceryListModal,
  CopyWeekModal,
} from '../mealPlanning/components/modals';

// ✨ NEW: View components (reduces ~400 lines)
import { MealOptionsManager } from '../mealPlanning/components/views/MealOptionsManager';

// ✨ NEW: Utility functions (reduces ~100 lines)
import { toKey, ensureDate, parseLocalDateKey, fetchClippedRecipe, fetchRecipeFromGoogle } from '../mealPlanning/utils';

// Existing modular components (already extracted)
import RecipeCard from '../mealPlanning/components/recipe/RecipeCard';
import MealItem from '../mealPlanning/components/mealPlan/MealItem';
import MealCell from '../mealPlanning/components/mealPlan/MealCell';
import CellWithMeals from '../mealPlanning/components/mealPlan/CellWithMeals';
import AddMealControl from '../mealPlanning/components/mealPlan/AddMealControl';

// Parser services (already extracted)
import { fetchYoutubeRecipe, normalizeFractions as normalizeYoutubeFractions } from '../mealPlanning/services/parsers/youtubeParser';
import { parseTextToRecipe, normalizeFractions as normalizeTextFractions } from '../mealPlanning/services/parsers/textParser';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

// Cleanup old meal drafts from localStorage
const cleanupOldDrafts = () => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('meal-draft-')) {
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
    logger.error('MealPlanning', 'Failed to cleanup old drafts:', error);
  }
};

const MealPlanning: React.FC = () => {
  // ========================================
  // REACT QUERY HOOKS (Existing)
  // ========================================
  const { data: recipes = [], isLoading: recipesLoading } = useRecipesQuery();
  const { data: mealPlans = [], isLoading: mealPlansLoading } = useMealPlansQuery();
  const createRecipeMutation = useCreateRecipeMutation();
  const createPlannedMealMutation = useCreatePlannedMealMutation();
  const updatePlannedMealMutation = useUpdatePlannedMealMutation();
  const deletePlannedMealMutation = useDeletePlannedMealMutation();
  const deleteAllRecipesMutation = useDeleteAllRecipesMutation();
  const createMealPlanMutation = useCreateMealPlanMutation();

  // ========================================
  // GLOBAL STATE (Zustand)
  // ========================================
  const { weekStartsOn, setWeekStartsOn, addNote, showGlobalToast } = useAppStore();

  // ========================================
  // ✨ NEW: CUSTOM HOOKS (Replaces ~900 lines)
  // ========================================

  // Week navigation hook (replaces ~100 lines)
  const weekNav = useWeekNavigation(weekStartsOn, mealPlans);

  // Modal management hook (replaces ~15 useState calls)
  const modals = useMealFormModals();

  // Recipe import hook (replaces ~300 lines)
  const recipeImport = useRecipeImport();

  // Grocery list hook (replaces ~200 lines)
  const grocery = useGroceryList(
    weekNav.activePlan?.meals ?? [],
    recipes,
    toKey(weekNav.currentWeekStart)
  );

  // Multi-cell selection hook (replaces ~300 lines)
  const multiCell = useMultiCellSelection(
    recipes,
    mealPlans,
    weekNav.activePlan,
    createPlannedMealMutation.mutateAsync,
    showGlobalToast
  );

  // ========================================
  // LOCAL STATE (Remaining)
  // ========================================
  const [copyTargetWeek, setCopyTargetWeek] = useState<Date>(addDays(weekNav.currentWeekStart, 7));
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // ========================================
  // EFFECTS
  // ========================================
  useEffect(() => {
    cleanupOldDrafts();
  }, []);

  // ========================================
  // COMPUTED VALUES
  // ========================================
  const plannedMeals = weekNav.activePlan?.meals ?? [];
  const mealsByDate: Record<string, PlannedMeal[]> = useMemo(() => {
    return plannedMeals.reduce<Record<string, PlannedMeal[]>>((acc, meal) => {
      const key = toKey(ensureDate(meal.date));
      if (!acc[key]) acc[key] = [];
      acc[key].push(meal);
      return acc;
    }, {});
  }, [plannedMeals]);

  const filteredRecipes = useMemo(() => {
    let result = recipes;
    if (showFavoritesOnly) {
      result = result.filter((recipe) => recipe.isFavorite === true);
    }
    if (recipeSearchQuery.trim()) {
      const query = recipeSearchQuery.toLowerCase().trim();
      result = result.filter(
        (recipe) =>
          recipe.name.toLowerCase().includes(query) ||
          recipe.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
          recipe.cuisine?.toLowerCase().includes(query) ||
          recipe.difficulty?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [recipes, recipeSearchQuery, showFavoritesOnly]);

  const isLoading = mealPlansLoading || weekNav.isEnsuringPlan;

  // ========================================
  // EVENT HANDLERS
  // ========================================

  const handleImportRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const saveImportedRecipe = async () => {
    if (!recipeImport.importDraft) return;
    try {
      await createRecipeMutation.mutateAsync(recipeImport.importDraft);
      recipeImport.clearUrlImport();
    } catch (e) {
      recipeImport.setImportError('Failed to save recipe');
    }
  };

  const handleCopyWeek = async () => {
    try {
      let targetPlan = mealPlans.find((p) =>
        isSameWeek(ensureDate(p.weekStartDate), copyTargetWeek, { weekStartsOn })
      );

      if (!targetPlan) {
        targetPlan = await createMealPlanMutation.mutateAsync({
          weekStartDate: copyTargetWeek,
          name: 'Meal plan',
          weekStartsOn,
        });
      }

      if (!targetPlan) {
        showGlobalToast?.('Failed to create target week plan', 'error');
        return;
      }

      const daysDiff = Math.floor(
        (copyTargetWeek.getTime() - weekNav.currentWeekStart.getTime()) / (1000 * 60 * 60 * 24)
      );

      const copyPromises = plannedMeals.map((meal) => {
        const originalDate = ensureDate(meal.date);
        const newDate = addDays(originalDate, daysDiff);

        return createPlannedMealMutation.mutateAsync({
          planId: targetPlan.id,
          meal: {
            date: newDate,
            mealType: meal.mealType,
            recipeId: meal.recipeId,
            customMeal: meal.customMeal,
            servings: meal.servings || 4,
            peopleCount: meal.peopleCount || meal.servings || 4,
            status: 'planned',
            notes: meal.notes,
            preparedAt: undefined,
            consumedAt: undefined,
          },
        });
      });

      await Promise.all(copyPromises);
      showGlobalToast?.(`Copied ${plannedMeals.length} meals to target week`, 'success');
      modals.setShowCopyWeek(false);
      weekNav.goToWeek(copyTargetWeek);
    } catch (error) {
      logger.error('MealPlanning', 'Failed to copy week:', error);
      showGlobalToast?.('Failed to copy meals', 'error');
    }
  };

  const handleCopyCartList = () => {
    const text = grocery.inCartItems
      .map((item) => {
        const amount = item.amount && item.unit ? `${item.amount} ${item.unit}` : item.amount || '';
        return `☐ ${amount} ${item.name}`.trim();
      })
      .join('\n');
    navigator.clipboard.writeText(text);
    showGlobalToast?.('Shopping list copied to clipboard!', 'success');
  };

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:gap-6 p-3 sm:p-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Meal planning</h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Plan your week, import recipes, and keep dinner decisions simple.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DatePickerPopover
            value={weekNav.currentWeekStart}
            onChange={(d) => weekNav.goToWeek(d)}
            weekStartsOn={weekStartsOn}
          />
          <button
            type="button"
            onClick={weekNav.goToPreviousWeek}
            className="rounded-full border border-slate-200 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </button>
          <button
            type="button"
            onClick={weekNav.goToThisWeek}
            className="rounded-full border border-slate-200 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <span className="hidden sm:inline">This week</span>
            <span className="sm:hidden">Today</span>
          </button>
          <button
            type="button"
            onClick={weekNav.goToNextWeek}
            className="rounded-full border border-slate-200 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => modals.setShowCopyWeek(true)}
            className="rounded-full border border-indigo-200 bg-indigo-50 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
            title="Copy this week's meals to another week"
          >
            <span className="hidden sm:inline">Copy Week</span>
            <span className="sm:hidden">Copy</span>
          </button>
          <button
            type="button"
            onClick={() => modals.setShowGroceryList(true)}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
            title="Generate grocery list from recipes"
          >
            <span className="hidden sm:inline">Grocery List</span>
            <span className="sm:hidden">List</span>
          </button>
        </div>
      </header>

      {/* Selection toolbar (if multi-cell mode active) */}
      {multiCell.isSelectionMode && multiCell.selectedCells.size > 0 && (
        <section className="rounded-lg border-2 border-indigo-500 bg-indigo-50 p-3 sm:p-4 shadow-lg animate-in slide-in-from-top">
          {/* Multi-cell selection UI - simplified for example */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-900">
              {multiCell.selectedCells.size} cell{multiCell.selectedCells.size > 1 ? 's' : ''} selected
            </span>
            <button
              type="button"
              onClick={multiCell.clearSelection}
              className="rounded-md border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
            >
              Clear Selection
            </button>
          </div>
        </section>
      )}

      {/* Weekly overview - would be extracted to WeeklyOverviewGrid component */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
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
          <div className="mt-6">
            {/* Grid rendering - simplified for example */}
            <div className="overflow-x-auto">
              <div className="grid" style={{ gridTemplateColumns: `140px repeat(4, minmax(160px, 1fr))` }}>
                {/* Header row */}
                <div className="p-3 border-b border-r border-slate-200 sticky left-0 bg-white z-20" />
                {MEAL_TYPES.map((mealType) => (
                  <div
                    key={mealType}
                    className="p-3 border-b border-r border-slate-200 text-sm font-semibold text-slate-900 bg-white text-center capitalize"
                  >
                    {mealType}
                  </div>
                ))}
                {/* Day rows - would iterate over weekNav.weekDays */}
                {/* ... simplified for example ... */}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Import Forms Section - would be extracted to ImportFormsSection component */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* YouTube Import Form */}
        {/* URL Import Form */}
        {/* Text Import Form */}
        {/* ... simplified for example ... */}
      </section>

      {/* Saved Recipes Section */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Saved recipes</h2>
          {/* Recipe filters and actions */}
        </div>
        {/* Recipe grid - would use SavedRecipesList component */}
      </section>

      {/* ========================================
          MODALS (Using extracted components)
          ======================================== */}

      {/* Grocery List Modal */}
      <GroceryListModal
        isOpen={modals.showGroceryList}
        onClose={() => modals.setShowGroceryList(false)}
        groceryList={grocery.groceryList}
        neededItems={grocery.neededItems}
        atHomeItems={grocery.atHomeItems}
        inCartItems={grocery.inCartItems}
        purchasedItems={grocery.purchasedItems}
        weekStartDate={weekNav.currentWeekStart}
        updateItemStatus={grocery.updateItemStatus}
        getStatusColor={grocery.getStatusColor}
        onCopyCart={handleCopyCartList}
      />

      {/* Copy Week Modal */}
      <CopyWeekModal
        isOpen={modals.showCopyWeek}
        onClose={() => modals.setShowCopyWeek(false)}
        sourceWeekStart={weekNav.currentWeekStart}
        targetWeekStart={copyTargetWeek}
        onTargetWeekChange={(d) => setCopyTargetWeek(startOfWeek(d, { weekStartsOn }))}
        mealCount={plannedMeals.length}
        weekStartsOn={weekStartsOn}
        onCopy={handleCopyWeek}
      />

      {/* Quick Recipe Modal */}
      {modals.recipeFormModal && (
        <QuickRecipeModal
          initialName={modals.recipeFormModal.initialName}
          onSave={modals.recipeFormModal.onSave}
          onClose={modals.closeRecipeForm}
        />
      )}

      {/* Simple Recipe Edit Modal */}
      {modals.simpleEditModal && (
        <SimpleRecipeEditModal
          recipe={modals.simpleEditModal.recipe}
          onSave={modals.simpleEditModal.onSave}
          onClose={modals.closeSimpleEdit}
        />
      )}

      {/* Recipe Edit Modal */}
      {modals.editingRecipeId && recipes.find((r) => r.id === modals.editingRecipeId) && (
        <RecipeEditModal
          recipe={recipes.find((r) => r.id === modals.editingRecipeId)!}
          onClose={modals.closeRecipeEdit}
        />
      )}

      {/* Recipe View Modal */}
      {modals.viewingRecipeId && recipes.find((r) => r.id === modals.viewingRecipeId) && (
        <RecipeViewModal
          recipe={recipes.find((r) => r.id === modals.viewingRecipeId)!}
          onClose={modals.closeRecipeView}
          onEdit={() => {
            modals.openRecipeEdit(modals.viewingRecipeId!);
            modals.closeRecipeView();
          }}
        />
      )}
    </div>
  );
};

export default MealPlanning;

/**
 * SUMMARY:
 * --------
 * This refactored version demonstrates:
 *
 * 1. ✨ Custom Hooks Usage (5 hooks, ~900 lines extracted):
 *    - useWeekNavigation
 *    - useMealFormModals
 *    - useRecipeImport
 *    - useGroceryList
 *    - useMultiCellSelection
 *
 * 2. ✨ Modal Components (6 modals, ~600 lines extracted):
 *    - QuickRecipeModal
 *    - SimpleRecipeEditModal
 *    - RecipeEditModal
 *    - RecipeViewModal
 *    - GroceryListModal
 *    - CopyWeekModal
 *
 * 3. ✨ View Components (would extract ~400 lines):
 *    - WeeklyOverviewGrid
 *    - SavedRecipesList
 *    - MealOptionsManager
 *    - ImportFormsSection
 *
 * 4. ✨ Utilities (~100 lines extracted):
 *    - toKey, ensureDate, parseLocalDateKey
 *    - fetchClippedRecipe, fetchRecipeFromGoogle
 *
 * RESULT:
 * - Original: 2,803 lines
 * - Refactored: ~600-650 lines
 * - Reduction: ~75%
 *
 * Benefits:
 * - Maintainable: Each module has single responsibility
 * - Testable: Hooks and utils can be tested independently
 * - Reusable: Components can be reused across the app
 * - Readable: Main component is just orchestration logic
 */
