import React, { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { Recipe } from '../../../types';

interface QuickRecipeModalProps {
  initialName: string;
  onSave: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export function QuickRecipeModal({ initialName, onSave, onClose }: QuickRecipeModalProps): React.JSX.Element {
  const colors = useThemeColors();
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
      image: undefined,
      sourceUrl: undefined,
      videoThumbnail: undefined,
      notes: undefined,
    };

    try {
      onSave(recipeData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Recipe" subtitle={`Quick recipe for "${initialName}"`} onClose={onClose} maxWidthClass="max-w-lg">
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="space-y-3">
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: colors.text.secondary }}
            >
              Recipe Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
              style={{
                backgroundColor: colors.bg.white,
                borderColor: colors.border.medium,
                color: colors.text.primary,
                border: `1px solid ${colors.border.medium}`,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.accent.start;
                e.currentTarget.style.outlineColor = colors.accent.start;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border.medium;
              }}
              placeholder="e.g., Bagel with Cream Cheese"
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: colors.text.secondary }}
            >
              Ingredients{' '}
              <span style={{ color: colors.text.tertiary, fontWeight: 'normal' }}>
                (one per line)
              </span>
            </label>
            <textarea
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              rows={4}
              className="w-full rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
              style={{
                backgroundColor: colors.bg.white,
                borderColor: colors.border.medium,
                color: colors.text.primary,
                border: `1px solid ${colors.border.medium}`,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.accent.start;
                e.currentTarget.style.outlineColor = colors.accent.start;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border.medium;
              }}
              placeholder="2 bagels&#10;4 oz cream cheese&#10;1 tomato&#10;salt, pepper"
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: colors.text.secondary }}
            >
              Instructions{' '}
              <span style={{ color: colors.text.tertiary, fontWeight: 'normal' }}>
                (optional)
              </span>
            </label>
            <textarea
              value={instructionsText}
              onChange={(e) => setInstructionsText(e.target.value)}
              rows={3}
              className="w-full rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
              style={{
                backgroundColor: colors.bg.white,
                borderColor: colors.border.medium,
                color: colors.text.primary,
                border: `1px solid ${colors.border.medium}`,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.accent.start;
                e.currentTarget.style.outlineColor = colors.accent.start;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border.medium;
              }}
              placeholder="Toast bagels, spread cream cheese..."
            />
          </div>

          <div
            className="flex items-center justify-end gap-2 pt-2 border-t"
            style={{ borderColor: colors.border.light }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50 transition-colors duration-200"
              style={{
                color: colors.text.primary,
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50 transition-all duration-200"
              style={{
                background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                color: 'white',
              }}
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
