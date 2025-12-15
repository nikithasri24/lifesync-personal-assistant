import React, { type ReactElement } from 'react';
import { ChefHat, Save } from 'lucide-react';
import type { Recipe } from '../../../types';

interface RecipeDraftPreviewProps {
  draft: Partial<Recipe>;
  imageUrl?: string;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

/**
 * Preview of imported recipe draft before saving
 */
export function RecipeDraftPreview({ draft, imageUrl, onSave, onCancel }: RecipeDraftPreviewProps): ReactElement {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <ChefHat className="h-4 w-4 text-amber-500" /> Preview
        </h3>
        <p className="mt-2 text-base font-medium text-slate-900">{draft.name}</p>
        {(draft.image ?? imageUrl) && (
          <img src={draft.image ?? imageUrl} alt="Recipe" className="mt-2 w-full rounded object-cover" />
        )}
        {draft.description && <p className="mt-2 text-xs text-slate-600 line-clamp-4">{draft.description}</p>}
        <p className="mt-2 text-xs text-slate-500">
          Prep {draft.prepTime ?? 0} min • Cook {draft.cookTime ?? 0} min • Serves {draft.servings ?? 4}
        </p>
        <div className={`mt-3 grid gap-4 ${(draft.instructions?.length ?? 0) > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div>
            <p className="text-xs font-semibold text-slate-700">Ingredients</p>
            <ul className="mt-1 list-disc pl-4 text-xs text-slate-600 max-h-28 overflow-auto">
              {draft.ingredients?.map((i, idx: number) => (
                <li key={idx}>{typeof i === 'object' && i !== null && 'name' in i ? (i as { name: string }).name : String(i)}</li>
              ))}
            </ul>
          </div>
          {(draft.instructions?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-700">Steps</p>
              <ol className="mt-1 list-decimal pl-4 text-xs text-slate-600 max-h-28 overflow-auto">
                {draft.instructions?.map((s, idx: number) => (
                  <li key={idx}>{String(s)}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Add to recipes</h3>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => void onSave()}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            <Save className="h-4 w-4" /> Save recipe
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
