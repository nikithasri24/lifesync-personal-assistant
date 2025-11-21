import React, { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { ModalShell } from './ModalShell';
import type { Recipe } from '../../../types';

interface SimpleRecipeEditModalProps {
  recipe: Recipe;
  onSave: (updates: Partial<Recipe>) => void | Promise<void>;
  onClose: () => void;
}

export function SimpleRecipeEditModal({ recipe, onSave, onClose }: SimpleRecipeEditModalProps) {
  const [name, setName] = useState(recipe.name || '');
  const [ingredientsText, setIngredientsText] = useState(
    (recipe.ingredients || [])
      .map((ing) => [ing.amount, ing.unit, ing.name].filter(Boolean).join(' '))
      .join('\n')
  );
  const [instructionsText, setInstructionsText] = useState((recipe.instructions || []).join('\n'));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const ingredientLines = ingredientsText
      .split(/[\n,]/)
      .map((l) => l.trim())
      .filter(Boolean);

    const ingredients = ingredientLines.map((line) => {
      const m1 = line.match(/^(\d+(?:\.\d+)?)\s+(\w+)\s+(.+)$/);
      if (m1) return { amount: m1[1], unit: m1[2], name: m1[3] };
      const m2 = line.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
      if (m2) return { amount: m2[1], unit: undefined, name: m2[2] };
      return { name: line } as any;
    });

    const instructions = instructionsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    await onSave({
      name: name.trim() || 'Untitled',
      ingredients,
      instructions,
    });

    setSaving(false);
  };

  return (
    <ModalShell title="Recipe" subtitle={recipe.name} onClose={onClose} maxWidthClass="max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Recipe Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g., Veg Pulao"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Ingredients <span className="text-slate-400 font-normal">(one per line)</span>
            </label>
            <textarea
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="2 cups rice&#10;1 onion&#10;spices"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Instructions <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={instructionsText}
              onChange={(e) => setInstructionsText(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Rinse rice..."
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
