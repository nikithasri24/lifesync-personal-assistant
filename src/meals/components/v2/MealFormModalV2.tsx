/**
 * MealFormModalV2 Component
 * Together pattern modal for planning meals on calendar
 * Features: recipe selector, custom meal, date/meal type, servings
 */

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { useThemeColors } from '@/hooks/useThemeColors';

interface Recipe {
  id: string;
  name: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
}

interface MealFormModalV2Props {
  isOpen: boolean;
  date: Date;
  mealType: string;
  recipes: Recipe[];
  onClose: () => void;
  onSubmit: (data: {
    date: Date;
    mealType: string;
    recipeId?: string;
    customName?: string;
    servings: number;
    notes?: string;
  }) => void;
}

export const MealFormModalV2: React.FC<MealFormModalV2Props> = ({
  isOpen,
  date,
  mealType,
  recipes,
  onClose,
  onSubmit,
}) => {
  const colors = useThemeColors();
  const [isPending, setIsPending] = useState(false);
  const [mode, setMode] = useState<'recipe' | 'custom'>('recipe');
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [customName, setCustomName] = useState('');
  const [servings, setServings] = useState('2');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      onSubmit({
        date,
        mealType,
        recipeId: mode === 'recipe' ? selectedRecipeId : undefined,
        customName: mode === 'custom' ? customName : undefined,
        servings: parseInt(servings) || 2,
        notes: notes || undefined,
      });
      onClose();
    } finally {
      setIsPending(false);
    }
  };

  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);
  const favoriteRecipes = recipes.filter(r => (r as any).isFavorite);

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 z-[60] flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh', maxWidth: '600px' }}
      >
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
        </div>

        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Plan Meal</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto p-6 space-y-5 flex-1">
            {/* Date & Meal Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                  Date
                </label>
                <input
                  type="text"
                  value={format(date, 'MMM d, yyyy')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                  Meal Type
                </label>
                <input
                  type="text"
                  value={mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 capitalize"
                  disabled
                />
              </div>
            </div>

            {/* Mode Selector */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                Meal Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('recipe')}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all"
                  style={{
                    background: mode === 'recipe'
                      ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                      : colors.bg.secondary,
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: mode === 'recipe' ? '#C18B5E' : 'transparent',
                    color: mode === 'recipe' ? '#C18B5E' : colors.text.secondary,
                  }}
                >
                  From Recipe
                </button>
                <button
                  type="button"
                  onClick={() => setMode('custom')}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all"
                  style={{
                    background: mode === 'custom'
                      ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                      : colors.bg.secondary,
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: mode === 'custom' ? '#C18B5E' : 'transparent',
                    color: mode === 'custom' ? '#C18B5E' : colors.text.secondary,
                  }}
                >
                  Custom Meal
                </button>
              </div>
            </div>

            {/* Recipe Selector */}
            {mode === 'recipe' && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                  Select Recipe
                </label>
                <select
                  value={selectedRecipeId}
                  onChange={(e) => setSelectedRecipeId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                  required={mode === 'recipe'}
                >
                  <option value="">Select a recipe...</option>
                  {favoriteRecipes.length > 0 && (
                    <optgroup label="⭐ Favorites">
                      {favoriteRecipes.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="All Recipes">
                    {recipes.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </optgroup>
                </select>

                {selectedRecipe && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm" style={{ color: colors.text.secondary }}>
                      {selectedRecipe.servings && `${selectedRecipe.servings} servings`}
                      {selectedRecipe.prepTime && selectedRecipe.cookTime && 
                        ` • ${(selectedRecipe.prepTime || 0) + (selectedRecipe.cookTime || 0)} min`
                      }
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Custom Meal Name */}
            {mode === 'custom' && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                  Meal Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                  placeholder="e.g., Grilled chicken with veggies"
                  required={mode === 'custom'}
                />
              </div>
            )}

            {/* Servings */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                Servings
              </label>
              <input
                type="number"
                min="1"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                rows={3}
                placeholder="Any special notes..."
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
            >
              {isPending ? 'Adding...' : 'Plan Meal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MealFormModalV2;
