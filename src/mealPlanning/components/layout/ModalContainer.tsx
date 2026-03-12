import React, { Suspense, lazy } from 'react';
import type { Recipe } from '../../../types';
import type { GroceryItem, GroceryItemStatus } from '../../hooks/useGroceryList';
import type { RecipeFormModal, SimpleEditModal } from '../../hooks/useMealFormModals';

// Lazy load modals to reduce initial bundle size
const GroceryListModal = lazy(() => import('../modals/GroceryListModal').then(m => ({ default: m.GroceryListModal })));
const CopyWeekModal = lazy(() => import('../modals/CopyWeekModal').then(m => ({ default: m.CopyWeekModal })));
const QuickRecipeModal = lazy(() => import('../modals/QuickRecipeModal').then(m => ({ default: m.QuickRecipeModal })));
const SimpleRecipeEditModal = lazy(() => import('../modals/SimpleRecipeEditModal').then(m => ({ default: m.SimpleRecipeEditModal })));
const RecipeEditModal = lazy(() => import('../modals/RecipeEditModal').then(m => ({ default: m.RecipeEditModal })));
const RecipeViewModal = lazy(() => import('../modals/RecipeViewModal').then(m => ({ default: m.RecipeViewModal })));

// Simple loading fallback for modals
const ModalLoadingFallback = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
      <div className="animate-spin h-8 w-8 border-4 border-[#C18B5E] border-t-transparent rounded-full mx-auto" />
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Loading...</p>
    </div>
  </div>
);

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
  onSendToShoppingList?: (items: GroceryItem[]) => Promise<{ success: boolean; count: number }>;

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
  onSendToShoppingList,
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
      {/* Grocery List Modal - only load when open */}
      {showGroceryList && (
        <Suspense fallback={<ModalLoadingFallback />}>
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
            onSendToShoppingList={onSendToShoppingList}
          />
        </Suspense>
      )}

      {/* Copy Week Modal - only load when open */}
      {showCopyWeek && (
        <Suspense fallback={<ModalLoadingFallback />}>
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
        </Suspense>
      )}

      {/* Quick Recipe Modal - only load when open */}
      {recipeFormModal && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <QuickRecipeModal
            isOpen={true}
            initialName={recipeFormModal.initialName}
            onSave={recipeFormModal.onSave}
            onClose={onCloseRecipeForm}
          />
        </Suspense>
      )}

      {/* Simple Edit Modal - only load when open */}
      {simpleEditModal && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <SimpleRecipeEditModal
            recipe={simpleEditModal.recipe}
            onSave={simpleEditModal.onSave}
            onClose={onCloseSimpleEdit}
          />
        </Suspense>
      )}

      {/* Recipe Edit Modal - only load when open */}
      {editingRecipeId && (() => {
        const recipe = recipes.find((r) => r.id === editingRecipeId);
        return recipe ? (
          <Suspense fallback={<ModalLoadingFallback />}>
            <RecipeEditModal isOpen={true} recipe={recipe} onClose={onCloseRecipeEdit} />
          </Suspense>
        ) : null;
      })()}

      {/* Recipe View Modal - only load when open */}
      {viewingRecipeId && (() => {
        const recipe = recipes.find((r) => r.id === viewingRecipeId);
        return recipe ? (
          <Suspense fallback={<ModalLoadingFallback />}>
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
          </Suspense>
        ) : null;
      })()}
    </>
  );
}
