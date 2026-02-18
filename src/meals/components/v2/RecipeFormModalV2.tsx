/**
 * RecipeFormModalV2 Component - MIGRATED to use FormModalV2
 * Together pattern modal for creating/editing recipes
 *
 * MIGRATION COMPLETE:
 * - Reduced from 550 lines to ~430 lines (22% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure, delete confirmation)
 * - Form state managed by FormModalV2
 * - Dynamic arrays (ingredients, instructions) handled in render function
 */

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { FormModalV2 } from '@/components/v2';

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  category?: string;
}

interface RecipeFormData {
  name: string;
  cuisine: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: string;
  cookTime: string;
  servings: string;
  ingredients: Ingredient[];
  instructions: string[];
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  tags: string;
  imageUrl: string;
  isFavorite: boolean;
}

interface RecipeFormModalV2Props {
  isOpen: boolean;
  recipeId?: string;
  initialData?: Partial<RecipeFormData>;
  onClose: () => void;
  onSubmit: (data: RecipeFormData) => void;
  onDelete?: () => void;
}

export const RecipeFormModalV2: React.FC<RecipeFormModalV2Props> = ({
  isOpen,
  recipeId,
  initialData,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const colors = useThemeColors();

  const defaultFormData: RecipeFormData = {
    name: '',
    cuisine: '',
    difficulty: 'medium',
    prepTime: '',
    cookTime: '',
    servings: '',
    ingredients: [{ name: '', amount: '', unit: 'cup', category: '' }],
    instructions: [''],
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    sugar: '',
    tags: '',
    imageUrl: '',
    isFavorite: false,
  };

  return (
    <FormModalV2<RecipeFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={recipeId ? 'Edit Recipe' : 'Add Recipe'}
      defaultData={defaultFormData}
      initialData={initialData ? { ...defaultFormData, ...initialData } : undefined}
      draftKey={recipeId ? undefined : 'recipe_form_draft'}
      isPending={false}
      submitText={recipeId ? 'Save Changes' : 'Add Recipe'}
      isEditing={!!recipeId}
      showDelete={!!recipeId && !!onDelete}
      onDelete={onDelete ? async () => { onDelete(); } : undefined}
      maxWidth="700px"
      onSubmit={async (formData) => {
        onSubmit(formData);
      }}
      validate={(formData) => {
        if (!formData.name.trim()) return 'Recipe name is required';
        return null;
      }}
    >
      {(formState, setFormState) => {
        // Dynamic array handlers
        const addIngredient = () => {
          setFormState({
            ...formState,
            ingredients: [...formState.ingredients, { name: '', amount: '', unit: 'cup', category: '' }],
          });
        };

        const removeIngredient = (index: number) => {
          setFormState({
            ...formState,
            ingredients: formState.ingredients.filter((_, i) => i !== index),
          });
        };

        const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
          const updated = [...formState.ingredients];
          updated[index] = { ...updated[index], [field]: value };
          setFormState({ ...formState, ingredients: updated });
        };

        const addInstruction = () => {
          setFormState({
            ...formState,
            instructions: [...formState.instructions, ''],
          });
        };

        const removeInstruction = (index: number) => {
          setFormState({
            ...formState,
            instructions: formState.instructions.filter((_, i) => i !== index),
          });
        };

        const updateInstruction = (index: number, value: string) => {
          const updated = [...formState.instructions];
          updated[index] = value;
          setFormState({ ...formState, instructions: updated });
        };

        return (
          <>
            {/* Basic Info */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                Recipe Name *
              </label>
              <input
                type="text"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                  Cuisine
                </label>
                <input
                  type="text"
                  value={formState.cuisine}
                  onChange={(e) => setFormState({ ...formState, cuisine: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                  placeholder="Italian, Mexican, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                  Difficulty
                </label>
                <select
                  value={formState.difficulty}
                  onChange={(e) => setFormState({ ...formState, difficulty: e.target.value as RecipeFormData['difficulty'] })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                  Prep (min)
                </label>
                <input
                  type="number"
                  value={formState.prepTime}
                  onChange={(e) => setFormState({ ...formState, prepTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                  Cook (min)
                </label>
                <input
                  type="number"
                  value={formState.cookTime}
                  onChange={(e) => setFormState({ ...formState, cookTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                  Servings
                </label>
                <input
                  type="number"
                  value={formState.servings}
                  onChange={(e) => setFormState({ ...formState, servings: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                />
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold" style={{ color: colors.text.secondary }}>
                  Ingredients
                </label>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="px-3 py-1 text-xs font-semibold rounded-lg transition-colors"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: '#C18B5E',
                    color: '#C18B5E',
                  }}
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {formState.ingredients.map((ingredient, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <input
                      type="text"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      className="col-span-5 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-terracotta-300 outline-none"
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      value={ingredient.amount}
                      onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                      className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-terracotta-300 outline-none"
                      placeholder="Amt"
                    />
                    <select
                      value={ingredient.unit}
                      onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                      className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-terracotta-300 outline-none"
                    >
                      <option value="cup">cup</option>
                      <option value="tbsp">tbsp</option>
                      <option value="tsp">tsp</option>
                      <option value="oz">oz</option>
                      <option value="lb">lb</option>
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="piece">piece</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="col-span-2 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Remove ingredient"
                    >
                      <Trash2 className="w-4 h-4 text-red-500 mx-auto" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold" style={{ color: colors.text.secondary }}>
                  Instructions
                </label>
                <button
                  type="button"
                  onClick={addInstruction}
                  className="px-3 py-1 text-xs font-semibold rounded-lg transition-colors"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: '#C18B5E',
                    color: '#C18B5E',
                  }}
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {formState.instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-terracotta-100 text-terracotta-600 text-xs font-semibold flex items-center justify-center mt-2">
                      {index + 1}
                    </span>
                    <textarea
                      value={instruction}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-terracotta-300 outline-none resize-none"
                      rows={2}
                      placeholder={`Step ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="flex-shrink-0 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Remove instruction"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition Info */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                Nutrition Info (optional)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  value={formState.calories}
                  onChange={(e) => setFormState({ ...formState, calories: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-terracotta-300 outline-none"
                  placeholder="Calories"
                />
                <input
                  type="number"
                  value={formState.protein}
                  onChange={(e) => setFormState({ ...formState, protein: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-terracotta-300 outline-none"
                  placeholder="Protein (g)"
                />
                <input
                  type="number"
                  value={formState.carbs}
                  onChange={(e) => setFormState({ ...formState, carbs: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-terracotta-300 outline-none"
                  placeholder="Carbs (g)"
                />
                <input
                  type="number"
                  value={formState.fat}
                  onChange={(e) => setFormState({ ...formState, fat: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-terracotta-300 outline-none"
                  placeholder="Fat (g)"
                />
                <input
                  type="number"
                  value={formState.fiber}
                  onChange={(e) => setFormState({ ...formState, fiber: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-terracotta-300 outline-none"
                  placeholder="Fiber (g)"
                />
                <input
                  type="number"
                  value={formState.sugar}
                  onChange={(e) => setFormState({ ...formState, sugar: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-terracotta-300 outline-none"
                  placeholder="Sugar (g)"
                />
              </div>
            </div>

            {/* Additional Fields */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                Image URL
              </label>
              <input
                type="url"
                value={formState.imageUrl}
                onChange={(e) => setFormState({ ...formState, imageUrl: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formState.tags}
                onChange={(e) => setFormState({ ...formState, tags: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="vegetarian, quick, healthy"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                id="favorite"
                checked={formState.isFavorite}
                onChange={(e) => setFormState({ ...formState, isFavorite: e.target.checked })}
                className="w-5 h-5 text-terracotta-400 rounded focus:ring-terracotta-300"
              />
              <label htmlFor="favorite" className="font-medium text-gray-900 cursor-pointer">
                Add to Favorites
              </label>
            </div>
          </>
        );
      }}
    </FormModalV2>
  );
};

export default RecipeFormModalV2;
