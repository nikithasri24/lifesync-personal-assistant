import React, { useState, useEffect, useRef, type ReactElement } from 'react';
import { Loader2 } from 'lucide-react';
import { logger } from '../../../services/logger';
import type { Recipe, Ingredient } from '../../../types';
import { useUpdateRecipeMutation } from '../../hooks/useMealPlanningQuery';

interface RecipeEditModalProps {
  recipe: Recipe;
  onClose: () => void;
}

export function RecipeEditModal({ recipe, onClose }: RecipeEditModalProps): ReactElement {
  const updateRecipeMutation = useUpdateRecipeMutation();
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [form, setForm] = useState<{
    name: string;
    description: string;
    servings: string;
    prepTime: string;
    cookTime: string;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string;
    instructions: string;
    ingredients: string;
  }>({
    name: recipe.name ?? '',
    description: recipe.description ?? '',
    servings: String(recipe.servings ?? 1),
    prepTime: String(recipe.prepTime ?? 0),
    cookTime: String(recipe.cookTime ?? 0),
    difficulty: recipe.difficulty ?? 'medium',
    tags: (recipe.tags || []).join(', '),
    instructions: (recipe.instructions || []).join('\n'),
    ingredients: (recipe.ingredients || [])
      .map((ing) => {
        const parts = [ing.amount, ing.unit, ing.name].filter(Boolean);
        return parts.join(' ');
      })
      .join('\n'),
  });

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Auto-save functionality - debounced by 2 seconds
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      void (async () => {
        try {
          setSaving(true);
          setError(null);

          const ingredientLines = form.ingredients
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

          const parsedIngredients: Ingredient[] = ingredientLines.map((line) => {
            const match1 = line.match(/^(\d+(?:\.\d+)?)\s+(\w+)\s+(.+)$/);
            if (match1) return { amount: match1[1], unit: match1[2], name: match1[3] };
            const match2 = line.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
            if (match2) return { amount: match2[1], unit: undefined, name: match2[2] };
            return { amount: undefined, unit: undefined, name: line };
          });

          const updates: Partial<Recipe> = {
            name: form.name.trim() || 'Untitled',
            description: form.description.trim(),
            servings: Number.isFinite(Number(form.servings)) ? Number(form.servings) : recipe.servings,
            prepTime: Number.isFinite(Number(form.prepTime)) ? Number(form.prepTime) : recipe.prepTime,
            cookTime: Number.isFinite(Number(form.cookTime)) ? Number(form.cookTime) : recipe.cookTime,
            difficulty: (form.difficulty) || recipe.difficulty,
            tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
            instructions: form.instructions.split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
            ingredients: parsedIngredients,
          };

          await updateRecipeMutation.mutateAsync({ recipeId: recipe.id, updates });
        } catch (err) {
          logger.error('RecipeEditModal', err as Error, { context: 'auto-save failed' });
          setError('Auto-save failed');
        } finally {
          setSaving(false);
        }
      })();
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [form, recipe.id, recipe.servings, recipe.prepTime, recipe.cookTime, recipe.difficulty, updateRecipeMutation]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        style={{ height: '350px' }}
        className="w-full max-w-2xl rounded-xl border-4 border-indigo-500/30 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-4 ring-white flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 border-b border-slate-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-slate-900">Edit recipe</h3>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500">
              {saving ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="text-emerald-600">Auto-saved</span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-3">
          <div className="grid gap-4">
            {error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Name</span>
                <input
                  value={form.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((s) => ({ ...s, name: e.target.value }))}
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Difficulty</span>
                <select
                  value={form.difficulty}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm((s) => ({ ...s, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Description</span>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((s) => ({ ...s, description: e.target.value }))}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Servings</span>
                <input
                  type="number"
                  min={1}
                  value={form.servings}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((s) => ({ ...s, servings: e.target.value }))}
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Prep time (min)</span>
                <input
                  type="number"
                  min={0}
                  value={form.prepTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((s) => ({ ...s, prepTime: e.target.value }))}
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Cook time (min)</span>
                <input
                  type="number"
                  min={0}
                  value={form.cookTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((s) => ({ ...s, cookTime: e.target.value }))}
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Tags (comma separated)</span>
              <input
                value={form.tags}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((s) => ({ ...s, tags: e.target.value }))}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="e.g. meal:breakfast, quick, vegetarian"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Ingredients (one per line)</span>
              <textarea
                rows={6}
                value={form.ingredients}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((s) => ({ ...s, ingredients: e.target.value }))}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="2 cups flour&#10;1 tsp salt&#10;3 eggs"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Instructions (one per line)</span>
              <textarea
                rows={6}
                value={form.instructions}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((s) => ({ ...s, instructions: e.target.value }))}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </label>
            <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                disabled={saving}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
