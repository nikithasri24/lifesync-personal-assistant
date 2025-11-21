import React, { useEffect, useMemo, useState } from 'react';
import { logger } from '../services/logger';
import { createPortal } from 'react-dom';
import { addDays, format, isSameWeek, startOfWeek, isSameDay } from 'date-fns';
import { CalendarDays, ChefHat, Loader2, Plus, Trash2, Save, Pencil, Heart, Youtube, Search, X } from 'lucide-react';
import DatePickerPopover from '../components/DatePickerPopover';
import { useAppStore } from '../stores/useAppStore';
import type { MealPlanWeek, PlannedMeal, Recipe } from '../types';
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

// Import components
import RecipeCard from '../mealPlanning/components/recipe/RecipeCard';
import CellWithMeals from '../mealPlanning/components/mealPlan/CellWithMeals';
import AddMealControl from '../mealPlanning/components/mealPlan/AddMealControl';
import { MealOptionsManager } from '../mealPlanning/components/views/MealOptionsManager';

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
  // React Query hooks
  const { data: recipes = [], isLoading: recipesLoading } = useRecipesQuery();
  const { data: mealPlans = [], isLoading: mealPlansLoading } = useMealPlansQuery();
  const createRecipeMutation = useCreateRecipeMutation();
  const updateRecipeMutation = useUpdateRecipeMutation();
  const createPlannedMealMutation = useCreatePlannedMealMutation();
  const updatePlannedMealMutation = useUpdatePlannedMealMutation();
  const deleteRecipeMutation = useDeleteRecipeMutation();
  const deleteAllRecipesMutation = useDeleteAllRecipesMutation();
  const createMealPlanMutation = useCreateMealPlanMutation();

  // Global UI settings
  const { weekStartsOn, showGlobalToast, addNote } = useAppStore();

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
    createPlannedMealMutation.mutateAsync,
    showGlobalToast
  );

  // Copy week state
  const [copyTargetWeek, setCopyTargetWeek] = useState<Date>(addDays(weekNav.currentWeekStart, 7));

  // Recipe search/filter state
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Cleanup old drafts on mount
  useEffect(() => {
    cleanupOldDrafts();
  }, []);

  // Update copy target when week changes
  useEffect(() => {
    setCopyTargetWeek(addDays(weekNav.currentWeekStart, 7));
  }, [weekNav.currentWeekStart]);

  const plannedMeals = weekNav.activePlan?.meals ?? [];
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

  // Filter recipes
  const filteredRecipes = useMemo(() => {
    let result = recipes;

    if (showFavoritesOnly) {
      result = result.filter((recipe) => recipe.isFavorite === true);
    }

    if (recipeSearchQuery.trim()) {
      const query = recipeSearchQuery.toLowerCase().trim();
      result = result.filter((recipe) => {
        if (recipe.name.toLowerCase().includes(query)) return true;
        if (recipe.tags?.some((tag) => tag.toLowerCase().includes(query))) return true;
        if (recipe.cuisine?.toLowerCase().includes(query)) return true;
        if (recipe.difficulty?.toLowerCase().includes(query)) return true;
        return false;
      });
    }

    return result;
  }, [recipes, recipeSearchQuery, showFavoritesOnly]);

  // Handle URL import
  const handleImportRecipe = async (event: React.FormEvent<HTMLFormElement>) => {
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

  const saveImportedRecipe = async () => {
    if (!recipeImport.importDraft) return;
    try {
      await createRecipeMutation.mutateAsync(recipeImport.importDraft);
      recipeImport.clearUrlImport();
    } catch (e) {
      recipeImport.setImportError('Failed to save recipe');
    }
  };

  const saveImportedAsNote = async () => {
    if (!recipeImport.importDraft) return;
    try {
      const title = recipeImport.importDraft.name || 'Imported Recipe';
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
          lines.push(`- ${ing.name}`);
        }
      }
      if (Array.isArray(recipeImport.importDraft.instructions) && recipeImport.importDraft.instructions.length) {
        lines.push('');
        lines.push('## Instructions');
        recipeImport.importDraft.instructions.forEach((step, idx) => {
          lines.push(`${idx + 1}. ${step}`);
        });
      }
      const content = lines.join('\n');
      await addNote({ title, content, tags: ['recipe', 'imported'] });
      recipeImport.clearUrlImport();
    } catch (e) {
      recipeImport.setImportError('Failed to save as note');
    }
  };

  // Copy week handler
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
        showGlobalToast('Failed to create target week plan', 'error');
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
      showGlobalToast(`Copied ${plannedMeals.length} meals to target week`, 'success');
      modalState.setShowCopyWeek(false);
      weekNav.goToWeek(copyTargetWeek);
    } catch (error) {
      logger.error('MealPlanning', 'Failed to copy week:', error);
      showGlobalToast('Failed to copy meals', 'error');
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:gap-6 p-3 sm:p-6">
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
            onChange={weekNav.goToWeek}
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
            onClick={() => modalState.setShowCopyWeek(true)}
            className="rounded-full border border-indigo-200 bg-indigo-50 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
            title="Copy this week's meals to another week"
          >
            <span className="hidden sm:inline">Copy Week</span>
            <span className="sm:hidden">Copy</span>
          </button>
          <button
            type="button"
            onClick={() => modalState.setShowGroceryList(true)}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
            title="Generate grocery list from recipes"
          >
            <span className="hidden sm:inline">Grocery List</span>
            <span className="sm:hidden">List</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full border border-slate-200 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            title="Print weekly plan"
          >
            Print
          </button>
        </div>
      </header>

      {/* Multi-cell selection toolbar */}
      {multiCellSelection.isSelectionMode && multiCellSelection.selectedCells.size > 0 && (
        <SelectionToolbar
          selectedCount={multiCellSelection.selectedCells.size}
          query={multiCellSelection.multiCellQuery}
          onQueryChange={multiCellSelection.setMultiCellQuery}
          matches={multiCellSelection.multiCellMatches}
          selectedIndex={multiCellSelection.multiCellSelectedIndex}
          onIndexChange={multiCellSelection.setMultiCellSelectedIndex}
          onKeyDown={multiCellSelection.handleMultiCellKeyDown}
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
            createPlannedMeal={createPlannedMealMutation.mutateAsync}
            updatePlannedMeal={updatePlannedMealMutation.mutateAsync}
          />
        )}
      </section>

      {/* Import sections */}
      <ImportSections
        recipeImport={recipeImport}
        createRecipe={createRecipeMutation.mutateAsync}
        handleImportRecipe={handleImportRecipe}
        saveImportedRecipe={saveImportedRecipe}
      />

      {/* Saved recipes */}
      <SavedRecipesSection
        recipes={filteredRecipes}
        allRecipesCount={recipes.length}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
        searchQuery={recipeSearchQuery}
        onSearchChange={setRecipeSearchQuery}
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
                item.amount && item.unit ? `${item.amount} ${item.unit}` : item.amount || '';
              return `☐ ${amount} ${item.name}`.trim();
            })
            .join('\n');
          navigator.clipboard.writeText(text);
          showGlobalToast('Shopping list copied to clipboard!', 'success');
        }}
      />

      <CopyWeekModal
        isOpen={modalState.showCopyWeek}
        onClose={() => modalState.setShowCopyWeek(false)}
        sourceWeekStart={weekNav.currentWeekStart}
        targetWeekStart={copyTargetWeek}
        onTargetWeekChange={(d) => setCopyTargetWeek(startOfWeek(d, { weekStartsOn }))}
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

      {modalState.editingRecipeId && (
        <RecipeEditModal
          recipe={recipes.find((r) => r.id === modalState.editingRecipeId)!}
          onClose={modalState.closeRecipeEdit}
        />
      )}

      {modalState.viewingRecipeId && (
        <RecipeViewModal
          recipe={recipes.find((r) => r.id === modalState.viewingRecipeId)!}
          onClose={modalState.closeRecipeView}
          onEdit={() => {
            modalState.openRecipeEdit(modalState.viewingRecipeId!);
            modalState.closeRecipeView();
          }}
        />
      )}
    </div>
  );
};

// Selection toolbar component
function SelectionToolbar({
  selectedCount,
  query,
  onQueryChange,
  matches,
  selectedIndex,
  onIndexChange,
  onKeyDown,
  inputRef,
  showList,
  onShowListChange,
  onAddMeal,
  onClearSelection,
}: any) {
  return (
    <section className="rounded-lg border-2 border-indigo-500 bg-indigo-50 p-3 sm:p-4 shadow-lg animate-in slide-in-from-top">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold text-sm">
              {selectedCount}
            </div>
            <span className="text-sm font-medium text-indigo-900">
              {selectedCount} cell{selectedCount > 1 ? 's' : ''} selected
            </span>
          </div>
          <span className="text-xs text-indigo-600">
            <span className="hidden sm:inline">Cmd/Ctrl + click to select more cells</span>
            <span className="sm:hidden">Tap cells to select</span>
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative w-full sm:w-64">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                onQueryChange(e.target.value);
                onShowListChange(true);
              }}
              onFocus={() => onShowListChange(true)}
              onBlur={() => setTimeout(() => onShowListChange(false), 200)}
              onKeyDown={onKeyDown}
              placeholder="Type meal name..."
              className="w-full rounded-md border border-indigo-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {showList &&
              query.trim().length > 0 &&
              inputRef.current &&
              createPortal(
                <MultiCellDropdown
                  matches={matches}
                  selectedIndex={selectedIndex}
                  onIndexChange={onIndexChange}
                  onAddMeal={onAddMeal}
                  onClose={() => onShowListChange(false)}
                  query={query}
                  inputRef={inputRef}
                />,
                document.body
              )}
          </div>
          <button
            type="button"
            onClick={onClearSelection}
            className="rounded-md border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition"
          >
            Clear Selection
          </button>
        </div>
      </div>
    </section>
  );
}

// Multi-cell dropdown component
function MultiCellDropdown({ matches, selectedIndex, onIndexChange, onAddMeal, onClose, query, inputRef }: any) {
  return (
    <div
      className="fixed z-[100] min-w-[240px] max-w-[320px] rounded-lg border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5"
      style={{
        left: inputRef.current.getBoundingClientRect().left,
        top: inputRef.current.getBoundingClientRect().bottom + 4,
      }}
    >
      {matches.length === 0 ? (
        <button
          type="button"
          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-indigo-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
          onMouseDown={(e) => e.preventDefault()}
          onClick={async () => {
            await onAddMeal('', query.trim());
            onClose();
          }}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-xs font-semibold text-indigo-700">
            +
          </span>
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium">Add "{query.trim()}"</div>
            <div className="text-xs text-slate-500">Create new meal</div>
          </div>
        </button>
      ) : (
        <div className="max-h-[280px] overflow-auto py-1">
          {matches.map((r: any, idx: number) => {
            const isSelected = idx === selectedIndex;
            const isRecipe = r.type === 'recipe';
            const isCustom = r.type === 'custom';
            return (
              <button
                key={`${r.id}-${idx}`}
                type="button"
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  isSelected ? 'bg-indigo-50 text-indigo-900' : 'text-slate-700 hover:bg-slate-50'
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => onIndexChange(idx)}
                onClick={async () => {
                  if (isCustom) {
                    await onAddMeal('', r.name);
                  } else {
                    await onAddMeal(r.id);
                  }
                  onClose();
                }}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold ${
                    isRecipe
                      ? 'bg-emerald-100 text-emerald-700'
                      : isCustom
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {isRecipe ? '📖' : isCustom ? '⭐' : '🍽️'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{r.name}</div>
                  <div className="text-xs text-slate-500">
                    {isRecipe ? 'Recipe' : isCustom ? `Used ${r.count || 1}x` : 'Meal option'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Weekly grid component
function WeeklyGrid({
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
}: any) {
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
        {weekDays.map((d: Date) => {
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
                const dayMeals = (mealsByDate[key] ?? []).filter((m: PlannedMeal) => m.mealType === mealType);
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
                    onDrop={async (e) => {
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
                        const source = activePlan.meals?.find((m: PlannedMeal) => m.id === mealId);
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

// Import sections component
function ImportSections({ recipeImport, createRecipe, handleImportRecipe, saveImportedRecipe }: any) {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      {/* Video to Recipe (YouTube) */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await recipeImport.importFromVideo();
        }}
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Youtube className="h-5 w-5 text-rose-600" />
          Video to Recipe
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Paste a YouTube link. We'll extract the title, thumbnail, ingredients and steps from the description.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={recipeImport.videoUrl}
            onChange={(e) => recipeImport.setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <select
            value={recipeImport.videoLang}
            onChange={(e) => recipeImport.setVideoLang(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            title="Caption language"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
            <option value="hi">Hindi</option>
            <option value="ja">Japanese</option>
          </select>
          <button
            type="submit"
            disabled={recipeImport.isVideoImporting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500 disabled:opacity-60"
          >
            {recipeImport.isVideoImporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Convert
          </button>
        </div>
        {recipeImport.videoImportError && (
          <p className="mt-3 text-sm text-rose-600">{recipeImport.videoImportError}</p>
        )}

        {recipeImport.videoDraft && (
          <RecipeDraftPreview
            draft={recipeImport.videoDraft}
            onSave={async () => {
              try {
                await createRecipe(recipeImport.videoDraft);
                recipeImport.clearVideoImport();
              } catch {
                recipeImport.setVideoImportError?.('Failed to save recipe');
              }
            }}
            onCancel={recipeImport.clearVideoImport}
          />
        )}
      </form>

      {/* Clip from URL */}
      <form onSubmit={handleImportRecipe} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <CalendarDays className="h-5 w-5 text-indigo-600" />
          Clip from URL
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Paste a recipe link. We'll fetch title, image, ingredients and steps.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={recipeImport.importUrl}
            onChange={(e) => recipeImport.setImportUrl(e.target.value)}
            placeholder="https://example.com/recipe/..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={recipeImport.isImporting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {recipeImport.isImporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Clip recipe
          </button>
        </div>
        {recipeImport.importError && <p className="mt-3 text-sm text-rose-600">{recipeImport.importError}</p>}

        {recipeImport.importDraft && (
          <RecipeDraftPreview
            draft={recipeImport.importDraft}
            onSave={saveImportedRecipe}
            onCancel={recipeImport.clearUrlImport}
          />
        )}
      </form>

      {/* Paste Text */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await recipeImport.parseFromText();
        }}
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <ChefHat className="h-5 w-5 text-amber-600" />
          Paste Text
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Paste any recipe text. We'll extract ingredients and directions heuristically.
        </p>
        <div className="mt-3 grid gap-3">
          <input
            value={recipeImport.textTitle}
            onChange={(e) => recipeImport.setTextTitle(e.target.value)}
            placeholder="Optional title"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <input
            value={recipeImport.textImageUrl}
            onChange={(e) => recipeImport.setTextImageUrl(e.target.value)}
            placeholder="Optional image URL"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <textarea
            rows={8}
            value={recipeImport.textInput}
            onChange={(e) => recipeImport.setTextInput(e.target.value)}
            placeholder="Ingredients and directions..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            disabled={recipeImport.isTextParsing}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {recipeImport.isTextParsing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Parse text
          </button>
          <button
            type="button"
            onClick={recipeImport.clearTextImport}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
        {recipeImport.textError && <p className="mt-3 text-sm text-rose-600">{recipeImport.textError}</p>}

        {recipeImport.textDraft && (
          <RecipeDraftPreview
            draft={recipeImport.textDraft}
            imageUrl={recipeImport.textImageUrl}
            onSave={async () => {
              try {
                await createRecipe({
                  ...recipeImport.textDraft,
                  image: recipeImport.textDraft.image || recipeImport.textImageUrl || undefined,
                });
                recipeImport.clearTextImport();
              } catch (e) {
                recipeImport.setTextError?.('Failed to save recipe');
              }
            }}
            onCancel={recipeImport.clearTextImport}
          />
        )}
      </form>
    </section>
  );
}

// Recipe draft preview component
function RecipeDraftPreview({ draft, imageUrl, onSave, onCancel }: any) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <ChefHat className="h-4 w-4 text-amber-500" /> Preview
        </h3>
        <p className="mt-2 text-base font-medium text-slate-900">{draft.name}</p>
        {(draft.image || imageUrl) && (
          <img src={draft.image || imageUrl} alt="Recipe" className="mt-2 w-full rounded object-cover" />
        )}
        {draft.description && <p className="mt-2 text-xs text-slate-600 line-clamp-4">{draft.description}</p>}
        <p className="mt-2 text-xs text-slate-500">
          Prep {draft.prepTime ?? 0} min • Cook {draft.cookTime ?? 0} min • Serves {draft.servings ?? 4}
        </p>
        <div className={`mt-3 grid gap-4 ${draft.instructions?.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div>
            <p className="text-xs font-semibold text-slate-700">Ingredients</p>
            <ul className="mt-1 list-disc pl-4 text-xs text-slate-600 max-h-28 overflow-auto">
              {draft.ingredients?.map((i: any, idx: number) => (
                <li key={idx}>{i.name}</li>
              ))}
            </ul>
          </div>
          {draft.instructions?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-700">Steps</p>
              <ol className="mt-1 list-decimal pl-4 text-xs text-slate-600 max-h-28 overflow-auto">
                {draft.instructions.map((s: string, idx: number) => (
                  <li key={idx}>{s}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Add to recipes</h3>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            <Save className="h-4 w-4" /> Save recipe
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Saved recipes section
function SavedRecipesSection({
  recipes,
  allRecipesCount,
  showFavoritesOnly,
  onToggleFavorites,
  searchQuery,
  onSearchChange,
  onDeleteAll,
  onViewRecipe,
  onEditRecipe,
  onDeleteRecipe,
}: any) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Saved recipes</h2>
        <div className="flex items-center gap-2">
          {allRecipesCount > 0 && (
            <>
              <button
                type="button"
                onClick={onToggleFavorites}
                className={`text-xs rounded-md px-3 py-1 transition ${
                  showFavoritesOnly
                    ? 'bg-pink-600 text-white hover:bg-pink-500'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title={showFavoritesOnly ? 'Show all recipes' : 'Show favorites only'}
              >
                <Heart className={`inline h-3 w-3 mr-1 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                {showFavoritesOnly ? 'Favorites' : 'All'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Delete ALL saved recipes? This cannot be undone.')) {
                    try {
                      await onDeleteAll();
                    } catch (e) {
                      logger.error('MealPlanning', 'Failed to delete all recipes', e);
                    }
                  }
                }}
                className="text-xs rounded-md px-3 py-1 bg-rose-600 text-white hover:bg-rose-500"
                title="Delete all saved recipes"
              >
                Delete all
              </button>
            </>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-600">
        {allRecipesCount === 0
          ? 'Your clipped recipes.'
          : `${recipes.length} of ${allRecipesCount} recipes${showFavoritesOnly ? ' (favorites)' : ''}`}
      </p>

      {allRecipesCount > 0 && (
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search recipes by name, tags, cuisine, or difficulty..."
            className="w-full pl-10 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {allRecipesCount === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
          Clip a recipe above to get started.
        </div>
      ) : recipes.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
          No recipes match your search. Try different keywords.
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r: Recipe) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              onView={() => onViewRecipe(r.id!)}
              onEdit={() => onEditRecipe(r.id!)}
              onDelete={() => onDeleteRecipe(r.id!)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export default MealPlanning;
