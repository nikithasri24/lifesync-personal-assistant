import { useModalState } from '@/hooks/useModalState';
import type { Recipe } from '../../types';

export interface RecipeFormModal {
  initialName: string;
  onSave: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void;
}

export interface SimpleEditModal {
  recipe: Recipe;
  onSave: (updates: Partial<Recipe>) => void;
}

/**
 * Custom hook to manage all meal planning form modals
 *
 * REFACTORED: Now uses the generic useModalState hook to eliminate boilerplate.
 * Maintains backward compatibility with the same return interface.
 *
 * @example
 * ```typescript
 * const modals = useMealFormModals();
 *
 * // Recipe form
 * modals.openRecipeForm('Pizza', handleSave);
 * modals.closeRecipeForm();
 *
 * // Recipe editing
 * modals.openRecipeEdit(recipeId);
 * modals.closeRecipeEdit();
 * ```
 */
export function useMealFormModals(): {
  recipeFormModal: RecipeFormModal | null;
  simpleEditModal: SimpleEditModal | null;
  editingRecipeId: string | null;
  viewingRecipeId: string | null;
  openRecipeForm: (initialName: string, onSave: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void) => void;
  closeRecipeForm: () => void;
  openSimpleEdit: (recipe: Recipe, onSave: (updates: Partial<Recipe>) => void) => void;
  closeSimpleEdit: () => void;
  openRecipeEdit: (recipeId: string) => void;
  closeRecipeEdit: () => void;
  openRecipeView: (recipeId: string) => void;
  closeRecipeView: () => void;
  showVideoImport: boolean;
  setShowVideoImport: React.Dispatch<React.SetStateAction<boolean>>;
  showUrlImport: boolean;
  setShowUrlImport: React.Dispatch<React.SetStateAction<boolean>>;
  showTextImport: boolean;
  setShowTextImport: React.Dispatch<React.SetStateAction<boolean>>;
  showGroceryList: boolean;
  setShowGroceryList: React.Dispatch<React.SetStateAction<boolean>>;
  showCopyWeek: boolean;
  setShowCopyWeek: React.Dispatch<React.SetStateAction<boolean>>;
} {
  // Use the generic modal state hook
  const modals = useModalState({
    recipeFormModal: null as RecipeFormModal | null,
    simpleEditModal: null as SimpleEditModal | null,
    editingRecipeId: null as string | null,
    viewingRecipeId: null as string | null,
    showVideoImport: false,
    showUrlImport: false,
    showTextImport: false,
    showGroceryList: false,
    showCopyWeek: false,
  });

  const openRecipeForm = (initialName: string, onSave: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void): void => {
    modals.set('recipeFormModal', { initialName, onSave });
  };

  const closeRecipeForm = (): void => {
    modals.set('recipeFormModal', null);
  };

  const openSimpleEdit = (recipe: Recipe, onSave: (updates: Partial<Recipe>) => void): void => {
    modals.set('simpleEditModal', { recipe, onSave });
  };

  const closeSimpleEdit = (): void => {
    modals.set('simpleEditModal', null);
  };

  const openRecipeEdit = (recipeId: string): void => {
    modals.set('editingRecipeId', recipeId);
  };

  const closeRecipeEdit = (): void => {
    modals.set('editingRecipeId', null);
  };

  const openRecipeView = (recipeId: string): void => {
    modals.set('viewingRecipeId', recipeId);
  };

  const closeRecipeView = (): void => {
    modals.set('viewingRecipeId', null);
  };

  return {
    // Recipe form modals
    recipeFormModal: modals.state.recipeFormModal,
    simpleEditModal: modals.state.simpleEditModal,
    editingRecipeId: modals.state.editingRecipeId,
    viewingRecipeId: modals.state.viewingRecipeId,
    openRecipeForm,
    closeRecipeForm,
    openSimpleEdit,
    closeSimpleEdit,
    openRecipeEdit,
    closeRecipeEdit,
    openRecipeView,
    closeRecipeView,

    // Import modals
    showVideoImport: modals.state.showVideoImport,
    setShowVideoImport: (value: boolean | ((prev: boolean) => boolean)) => {
      const newValue = typeof value === 'function' ? value(modals.state.showVideoImport) : value;
      modals.set('showVideoImport', newValue);
    },
    showUrlImport: modals.state.showUrlImport,
    setShowUrlImport: (value: boolean | ((prev: boolean) => boolean)) => {
      const newValue = typeof value === 'function' ? value(modals.state.showUrlImport) : value;
      modals.set('showUrlImport', newValue);
    },
    showTextImport: modals.state.showTextImport,
    setShowTextImport: (value: boolean | ((prev: boolean) => boolean)) => {
      const newValue = typeof value === 'function' ? value(modals.state.showTextImport) : value;
      modals.set('showTextImport', newValue);
    },

    // Other modals
    showGroceryList: modals.state.showGroceryList,
    setShowGroceryList: (value: boolean | ((prev: boolean) => boolean)) => {
      const newValue = typeof value === 'function' ? value(modals.state.showGroceryList) : value;
      modals.set('showGroceryList', newValue);
    },
    showCopyWeek: modals.state.showCopyWeek,
    setShowCopyWeek: (value: boolean | ((prev: boolean) => boolean)) => {
      const newValue = typeof value === 'function' ? value(modals.state.showCopyWeek) : value;
      modals.set('showCopyWeek', newValue);
    },
  };
}
