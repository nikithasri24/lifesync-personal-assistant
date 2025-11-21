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

export function useMealFormModals() {
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

  const openRecipeForm = (initialName: string, onSave: (recipe: Recipe) => void) => {
    setRecipeFormModal({ initialName, onSave });
  };

  const closeRecipeForm = () => {
    setRecipeFormModal(null);
  };

  const openSimpleEdit = (recipe: Recipe, onSave: (updates: Partial<Recipe>) => void) => {
    setSimpleEditModal({ recipe, onSave });
  };

  const closeSimpleEdit = () => {
    setSimpleEditModal(null);
  };

  const openRecipeEdit = (recipeId: string) => {
    setEditingRecipeId(recipeId);
  };

  const closeRecipeEdit = () => {
    setEditingRecipeId(null);
  };

  const openRecipeView = (recipeId: string) => {
    setViewingRecipeId(recipeId);
  };

  const closeRecipeView = () => {
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
