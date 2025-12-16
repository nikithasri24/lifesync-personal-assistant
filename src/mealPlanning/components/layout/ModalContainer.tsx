import React from 'react';
import type { Recipe, PlannedMeal } from '../../../types';
import { GroceryListModal } from '../modals/GroceryListModal';
import { CopyWeekModal } from '../modals/CopyWeekModal';
import { QuickRecipeModal } from '../modals/QuickRecipeModal';
import { SimpleRecipeEditModal } from '../modals/SimpleRecipeEditModal';
import { RecipeEditModal } from '../modals/RecipeEditModal';
import { RecipeViewModal } from '../modals/RecipeViewModal';
import type { GroceryItem, GroceryItemStatus } from '../../hooks/useGroceryList';
import type { RecipeFormModal, SimpleEditModal } from '../../hooks/useMealFormModals';

interface ModalContainerProps {
  // Grocery list modal
  showGroceryList: boolean;
  onCloseGroceryList: () => void;
  groceryList: GroceryItem[];
  neededItems: GroceryItem[];
  atHomeItems: GroceryItem[];
  inCartItems: GroceryItem[];
  purchasedItems: GroceryItem[];
  weekStartDate: Date;
  updateItemStatus: (itemId: string, status: GroceryItemStatus) => void;
  getStatusColor: (status: GroceryItemStatus) => string;
  onCopyCart: () => void;

  // Copy week modal
  showCopyWeek: boolean;
  onCloseCopyWeek: () => void;
  sourceWeekStart: Date;
  targetWeekStart: Date;
  onTargetWeekChange: (date: Date) => void;
  mealCount: number;
  weekStartsOn: 0 | 1;
  onCopy: () => Promise<void>;

  // Recipe form modal
  recipeFormModal: RecipeFormModal | null;
  onCloseRecipeForm: () => void;

  // Simple edit modal
  simpleEditModal: SimpleEditModal | null;
  onCloseSimpleEdit: () => void;

  // Recipe edit modal
  editingRecipeId: string | null;
  onCloseRecipeEdit: () => void;
  onOpenRecipeEdit: (id: string) => void;

  // Recipe view modal
  viewingRecipeId: string | null;
  onCloseRecipeView: () => void;

  // Recipes list
  recipes: Recipe[];
}

/**
 * Container for all meal planning modals
 */
export function ModalContainer({
  showGroceryList,
  onCloseGroceryList,
  groceryList,
  neededItems,
  atHomeItems,
  inCartItems,
  purchasedItems,
  weekStartDate,
  updateItemStatus,
  getStatusColor,
  onCopyCart,
  showCopyWeek,
  onCloseCopyWeek,
  sourceWeekStart,
  targetWeekStart,
  onTargetWeekChange,
  mealCount,
  weekStartsOn,
  onCopy,
  recipeFormModal,
  onCloseRecipeForm,
  simpleEditModal,
  onCloseSimpleEdit,
  editingRecipeId,
  onCloseRecipeEdit,
  onOpenRecipeEdit,
  viewingRecipeId,
  onCloseRecipeView,
  recipes,
}: ModalContainerProps): React.ReactElement {
  return (
    <>
      <GroceryListModal
        isOpen={showGroceryList}
        onClose={onCloseGroceryList}
        groceryList={groceryList}
        neededItems={neededItems}
        atHomeItems={atHomeItems}
        inCartItems={inCartItems}
        purchasedItems={purchasedItems}
        weekStartDate={weekStartDate}
        updateItemStatus={updateItemStatus}
        getStatusColor={getStatusColor}
        onCopyCart={onCopyCart}
      />

      <CopyWeekModal
        isOpen={showCopyWeek}
        onClose={onCloseCopyWeek}
        sourceWeekStart={sourceWeekStart}
        targetWeekStart={targetWeekStart}
        onTargetWeekChange={onTargetWeekChange}
        mealCount={mealCount}
        weekStartsOn={weekStartsOn}
        onCopy={onCopy}
      />

      {recipeFormModal && (
        <QuickRecipeModal
          initialName={recipeFormModal.initialName}
          onSave={recipeFormModal.onSave}
          onClose={onCloseRecipeForm}
        />
      )}

      {simpleEditModal && (
        <SimpleRecipeEditModal
          recipe={simpleEditModal.recipe}
          onSave={simpleEditModal.onSave}
          onClose={onCloseSimpleEdit}
        />
      )}

      {editingRecipeId && (() => {
        const recipe = recipes.find((r) => r.id === editingRecipeId);
        return recipe ? (
          <RecipeEditModal recipe={recipe} onClose={onCloseRecipeEdit} />
        ) : null;
      })()}

      {viewingRecipeId && (() => {
        const recipe = recipes.find((r) => r.id === viewingRecipeId);
        return recipe ? (
          <RecipeViewModal
            recipe={recipe}
            onClose={onCloseRecipeView}
            onEdit={() => {
              if (viewingRecipeId) {
                onOpenRecipeEdit(viewingRecipeId);
                onCloseRecipeView();
              }
            }}
          />
        ) : null;
      })()}
    </>
  );
}
