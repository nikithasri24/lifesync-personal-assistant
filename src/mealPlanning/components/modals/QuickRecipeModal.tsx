import React, { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { ModalShell } from './ModalShell';
import type { Recipe } from '../../../types';

interface QuickRecipeModalProps {
  initialName: string;
  onSave: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export function QuickRecipeModal({ initialName, onSave, onClose }: QuickRecipeModalProps): React.JSX.Element {
  const [name, setName] = useState<string>(initialName);
  const [ingredientsText, setIngredientsText] = useState<string>('');
  const [instructionsText, setInstructionsText] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  useEffect((): (() => void) => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSaving(true);

    const ingredientLines = ingredientsText
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

    const instructions = instructionsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const recipeData: Omit<Recipe, 'id' | 'createdAt'> = {
      name: name.trim(),
      description: undefined,
      ingredients,
      instructions,
      prepTime: undefined,
      cookTime: undefined,
      servings: 4,
      tags: [],
      imageUrl: undefined,
      sourceUrl: undefined,
      videoUrl: undefined,
      videoThumbnail: undefined,
      notes: undefined,
    };

    try {
      const saveResult = onSave(recipeData);
      // Check if onSave returns a Promise
      if (saveResult instanceof Promise) {
        await saveResult;
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Recipe" subtitle={`Quick recipe for "${initialName}"`} onClose={onClose} maxWidthClass="max-w-lg">
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Recipe Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g., Bagel with Cream Cheese"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Ingredients <span className="text-slate-400 font-normal">(one per line)</span>
            </label>
            <textarea
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="2 bagels&#10;4 oz cream cheese&#10;1 tomato&#10;salt, pepper"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Instructions <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={instructionsText}
              onChange={(e) => setInstructionsText(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Toast bagels, spread cream cheese..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
