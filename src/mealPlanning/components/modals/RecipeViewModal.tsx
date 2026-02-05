import React, { useState, useMemo, useEffect } from 'react';
import { ModalShell } from './ModalShell';
import type { Recipe } from '../../../types';
import { normalizeFractions as normalizeYoutubeFractions } from '../../services/parsers/youtubeParser';

interface RecipeViewModalProps {
  recipe: Recipe;
  onClose: () => void;
  onEdit: () => void;
}

export function RecipeViewModal({ recipe, onClose, onEdit }: RecipeViewModalProps): React.JSX.Element {
  const [servingsView, setServingsView] = useState<number>(recipe.servings || 1);
  const factor = Math.max(0.25, (servingsView || 1) / Math.max(1, recipe.servings || 1));

  // Keyboard navigation for Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const scaleNumber = (n: number): string => {
    const val = n * factor;
    return Math.abs(val - Math.round(val)) < 0.05 ? String(Math.round(val)) : String(Math.round(val * 10) / 10);
  };

  const scaleLine = (line: string): string => {
    const src = normalizeYoutubeFractions(line);
    const patterns: RegExp[] = [
      /^(\d+)[\s-](\d)\/(\d)/, // mixed number at start e.g., 1 1/2
      /^(\d+)\/(\d+)/, // simple fraction
      /^(\d+(?:\.\d+)?)/, // decimal or integer
    ];
    for (const re of patterns) {
      const m = src.match(re);
      if (m) {
        if (re === patterns[0]) {
          const whole = parseInt(m[1], 10);
          const num = parseInt(m[2], 10);
          const den = parseInt(m[3], 10);
          const base = whole + num / den;
          const scaled = scaleNumber(base);
          return src.replace(re, scaled);
        }
        if (re === patterns[1]) {
          const num = parseInt(m[1], 10);
          const den = parseInt(m[2], 10);
          const base = num / den;
          const scaled = scaleNumber(base);
          return src.replace(re, scaled);
        }
        if (re === patterns[2]) {
          const base = parseFloat(m[1]);
          const scaled = scaleNumber(base);
          return src.replace(re, scaled);
        }
      }
    }
    return src;
  };

  const equipmentFromText = useMemo(() => {
    const tools = [
      'pan',
      'pot',
      'oven',
      'skillet',
      'bowl',
      'whisk',
      'knife',
      'cutting board',
      'blender',
      'mixer',
      'baking sheet',
      'saucepan',
      'spatula',
      'tray',
      'foil',
      'tongs',
    ];
    const text = `${(recipe.instructions ?? []).join(' ')} ${recipe.description ?? ''}`.toLowerCase();
    const found: string[] = [];
    for (const t of tools) {
      if (text.includes(t) && !found.includes(t)) found.push(t);
    }
    const equipTags = (recipe.tags || [])
      .filter((t) => t.startsWith('equip:'))
      .map((t) => t.replace('equip:', ''));
    for (const e of equipTags) {
      if (!found.includes(e)) found.push(e);
    }
    return found;
  }, [recipe.instructions, recipe.description, recipe.tags]);

  return (
    <ModalShell
      title={recipe.name}
      subtitle="Recipe"
      onClose={onClose}
      maxWidthClass="max-w-4xl"
      headerRight={
        <button
          onClick={onEdit}
          className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Edit
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {recipe.image && (
          <div className="md:col-span-2">
            <img src={recipe.image} alt={recipe.name} className="w-full h-56 object-cover rounded-lg border border-slate-200" />
          </div>
        )}

        {/* Directions */}
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-slate-900">Directions</h4>
          {recipe.instructions && recipe.instructions.length > 0 ? (
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
              {recipe.instructions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No directions provided.</p>
          )}
        </section>

        {/* Ingredients + Portion size */}
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">Ingredients</h4>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-600">Portion size</span>
              <input
                type="number"
                min={0.25}
                step={0.25}
                value={servingsView}
                onChange={(e) => setServingsView(Math.max(0.25, Number(e.target.value) || recipe.servings || 1))}
                className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          {recipe.ingredients && recipe.ingredients.length > 0 ? (
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
              {recipe.ingredients.map((ing, i) => (
                <li key={i}>
                  {ing.amount ? `${scaleNumber(Number(ing.amount))} ${ing.unit ?? ''} ${ing.name}`.trim() : scaleLine(ing.name)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No ingredients listed.</p>
          )}
        </section>

        {/* Duration */}
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-slate-900">Duration</h4>
          <div className="mt-2 grid grid-cols-3 gap-2 text-sm text-slate-700">
            <div className="rounded border border-slate-200 bg-slate-50 p-2 text-center">
              <div className="text-xs text-slate-500">Prep</div>
              <div className="font-medium">{recipe.prepTime ?? 0} min</div>
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 p-2 text-center">
              <div className="text-xs text-slate-500">Cook</div>
              <div className="font-medium">{recipe.cookTime ?? 0} min</div>
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 p-2 text-center">
              <div className="text-xs text-slate-500">Total</div>
              <div className="font-medium">{(recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)} min</div>
            </div>
          </div>
        </section>

        {/* Equipment */}
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-slate-900">Equipment</h4>
          {equipmentFromText.length > 0 ? (
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
              {equipmentFromText.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No equipment detected.</p>
          )}
        </section>

        {/* Tips */}
        <section className="rounded-lg border border-slate-200 bg-white p-4 md:col-span-2">
          <h4 className="text-sm font-semibold text-slate-900">Tips</h4>
          {recipe.notes ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{recipe.notes}</p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No tips yet.</p>
          )}
        </section>
      </div>
    </ModalShell>
  );
}
