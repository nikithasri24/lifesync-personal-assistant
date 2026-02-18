/**
 * QuickRecipeModal - MIGRATED to use FormModalV2
 * Quick recipe creation from meal plan with ingredient/instruction parsing
 *
 * MIGRATION COMPLETE:
 * - Reduced from 228 lines to ~145 lines (36% reduction)
 * - Removed ModalShell wrapper (FormModalV2 provides modal structure)
 * - ESC key handler now built-in to FormModalV2
 * - Removed body overflow styling (FormModalV2 handles)
 * - Converted to light mode following design standards
 * - Preserved ingredient/instruction parsing logic
 */

import React from 'react';
import { FormModalV2 } from '@/components/v2';
import type { Recipe } from '../../../types';

interface QuickRecipeModalProps {
  isOpen: boolean;
  initialName: string;
  onSave: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  isPending?: boolean;
}

interface RecipeFormState {
  name: string;
  ingredientsText: string;
  instructionsText: string;
}

export function QuickRecipeModal({
  isOpen,
  initialName,
  onSave,
  onClose,
  isPending = false,
}: QuickRecipeModalProps): React.JSX.Element {
  const defaultFormData: RecipeFormState = {
    name: initialName,
    ingredientsText: '',
    instructionsText: '',
  };

  const handleSubmit = async (formData: RecipeFormState): Promise<void> => {
    const ingredientLines = formData.ingredientsText
      .split(/[,\n]/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const ingredients = ingredientLines.map((line): { amount?: string; unit?: string; name: string } => {
      const match = line.match(/^(\d+(?:\.\d+)?)\s+(\w+)\s+(.+)$/);
      if (match) {
        return { amount: match[1], unit: match[2], name: match[3] };
      }
      const match2 = line.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
      if (match2) {
        return { amount: match2[1], unit: undefined, name: match2[2] };
      }
      return { amount: undefined, unit: undefined, name: line };
    });

    const instructions = formData.instructionsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const recipeData: Omit<Recipe, 'id' | 'createdAt'> = {
      name: formData.name.trim(),
      description: undefined,
      ingredients,
      instructions,
      prepTime: undefined,
      cookTime: undefined,
      servings: 4,
      tags: [],
      image: undefined,
      sourceUrl: undefined,
      videoThumbnail: undefined,
      notes: undefined,
    };

    onSave(recipeData);
  };

  return (
    <FormModalV2<RecipeFormState>
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Recipe"
      subtitle={`Quick recipe for "${initialName}"`}
      defaultData={defaultFormData}
      isPending={isPending}
      submitText="Save Recipe"
      isEditing={false}
      onSubmit={handleSubmit}
      validate={(formData) => {
        if (!formData.name.trim()) return 'Please enter a recipe name';
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* Recipe Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Recipe Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              placeholder="e.g., Bagel with Cream Cheese"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              required
              autoFocus
            />
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Ingredients <span className="text-sm text-gray-600 font-normal">(one per line)</span>
            </label>
            <textarea
              value={formState.ingredientsText}
              onChange={(e) => setFormState({ ...formState, ingredientsText: e.target.value })}
              rows={4}
              placeholder="2 bagels&#10;4 oz cream cheese&#10;1 tomato&#10;salt, pepper"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Instructions <span className="text-sm text-gray-600 font-normal">(optional)</span>
            </label>
            <textarea
              value={formState.instructionsText}
              onChange={(e) => setFormState({ ...formState, instructionsText: e.target.value })}
              rows={3}
              placeholder="Toast bagels, spread cream cheese..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
            />
          </div>
        </>
      )}
    </FormModalV2>
  );
}
