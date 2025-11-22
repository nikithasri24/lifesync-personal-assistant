import { useState } from 'react';
import type { Recipe } from '../../types';

export interface RecipeFormModal {
  initialName: string;
  onSave: (recipe: Recipe) => void;
}

export interface SimpleEditModal {
  recipe: Recipe;
  onSave: (updates: Partial<Recipe>) => void;
}

export function useMealFormModals(): {
  recipeFormModal: RecipeFormModal | null;
  simpleEditModal: SimpleEditModal | null;
  editingRecipeId: string | null;
  viewingRecipeId: string | null;
  openRecipeForm: (initialName: string, onSave: (recipe: Recipe) => void) => void;
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
  // Recipe form modals
  const [recipeFormModal, setRecipeFormModal] = useState<RecipeFormModal | null>(null);
  const [simpleEditModal, setSimpleEditModal] = useState<SimpleEditModal | null>(null);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [viewingRecipeId, setViewingRecipeId] = useState<string | null>(null);

  // Import modals
  const [showVideoImport, setShowVideoImport] = useState(false);
  const [showUrlImport, setShowUrlImport] = useState(false);
  const [showTextImport, setShowTextImport] = useState(false);

  // Grocery & Copy modals
  const [showGroceryList, setShowGroceryList] = useState(false);
  const [showCopyWeek, setShowCopyWeek] = useState(false);

  const openRecipeForm = (initialName: string, onSave: (recipe: Recipe) => void): void => {
    setRecipeFormModal({ initialName, onSave });
  };

  const closeRecipeForm = (): void => {
    setRecipeFormModal(null);
  };

  const openSimpleEdit = (recipe: Recipe, onSave: (updates: Partial<Recipe>) => void): void => {
    setSimpleEditModal({ recipe, onSave });
  };

  const closeSimpleEdit = (): void => {
    setSimpleEditModal(null);
  };

  const openRecipeEdit = (recipeId: string): void => {
    setEditingRecipeId(recipeId);
  };

  const closeRecipeEdit = (): void => {
    setEditingRecipeId(null);
  };

  const openRecipeView = (recipeId: string): void => {
    setViewingRecipeId(recipeId);
  };

  const closeRecipeView = (): void => {
    setViewingRecipeId(null);
  };

  return {
    // Recipe form modals
    recipeFormModal,
    simpleEditModal,
    editingRecipeId,
    viewingRecipeId,
    openRecipeForm,
    closeRecipeForm,
    openSimpleEdit,
    closeSimpleEdit,
    openRecipeEdit,
    closeRecipeEdit,
    openRecipeView,
    closeRecipeView,

    // Import modals
    showVideoImport,
    setShowVideoImport,
    showUrlImport,
    setShowUrlImport,
    showTextImport,
    setShowTextImport,

    // Other modals
    showGroceryList,
    setShowGroceryList,
    showCopyWeek,
    setShowCopyWeek,
  };
}
