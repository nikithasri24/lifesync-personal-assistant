/**
 * FridgePoolV2
 * Displays the active batch cook session's dishes with serving counts.
 * Each dish shows a progress bar (remaining / cooked) and a quick-log button.
 */

import React, { useRef, useState } from 'react';
import { ChefHat, AlertTriangle, Link, Pencil } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { BatchCookSession, BatchCookDish } from '../../types';

interface Recipe { id: string; name: string; }

interface FridgePoolV2Props {
  session: BatchCookSession;
  recipes: Recipe[];
  onLogFromPool: (dish: BatchCookDish, mealType: string) => void;
  onMarkDone: (dish: BatchCookDish) => void;
  onLinkRecipe: (dish: BatchCookDish, recipeId: string | null) => void;
  onRenameDish: (dish: BatchCookDish, newName: string) => void;
  onNewSession: () => void;
}

const ServingBar: React.FC<{ cooked: number; remaining: number }> = ({ cooked, remaining }): React.ReactElement => {
  const pct = cooked > 0 ? Math.round((remaining / cooked) * 100) : 0;
  const isLow = remaining <= 1 && remaining > 0;
  const isEmpty = remaining === 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-200">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: isEmpty
              ? '#E5E7EB'
              : isLow
                ? 'linear-gradient(90deg, #EF4444 0%, #F87171 100%)'
                : 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
          }}
        />
      </div>
      <span
        className="text-xs font-semibold w-12 text-right"
        style={{ color: isEmpty ? '#9CA3AF' : isLow ? '#EF4444' : '#C18B5E' }}
      >
        {remaining}/{cooked}
      </span>
    </div>
  );
};

export const FridgePoolV2: React.FC<FridgePoolV2Props> = ({ session, recipes, onLogFromPool, onMarkDone, onLinkRecipe, onRenameDish, onNewSession }) => {
  const colors = useThemeColors();
  const [linkingDishId, setLinkingDishId] = useState<string | null>(null);
  const [renamingDishId, setRenamingDishId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const activeDishes = session.dishes.filter(d => d.servingsRemaining > 0);
  const emptyDishes = session.dishes.filter(d => d.servingsRemaining === 0);

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6"
      style={{
        backgroundColor: colors.bg.white,
        boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)',
        border: `1px solid ${colors.border.light}`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: colors.border.light, backgroundColor: 'rgba(212, 165, 116, 0.06)' }}
      >
        <div className="flex items-center gap-2">
          <ChefHat className="w-5 h-5" style={{ color: '#C18B5E' }} />
          <div>
            <p className="font-bold text-sm" style={{ color: colors.text.primary }}>{session.name}</p>
            <p className="text-xs" style={{ color: colors.text.tertiary }}>
              {activeDishes.length} dish{activeDishes.length !== 1 ? 'es' : ''} ready ·{' '}
              {session.dishes.reduce((sum, d) => sum + d.servingsRemaining, 0)} servings left
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onNewSession}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: '#C18B5E', backgroundColor: 'rgba(212, 165, 116, 0.15)' }}
        >
          + New Session
        </button>
      </div>

      {/* Dish list */}
      <div className="p-4 space-y-3">
        {activeDishes.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
              All dishes have been eaten! 🎉
            </p>
            <button
              type="button"
              onClick={onNewSession}
              className="mt-2 text-sm font-semibold"
              style={{ color: '#C18B5E' }}
            >
              Start a new batch cook session
            </button>
          </div>
        )}

        {activeDishes.map((dish) => {
          // customName = what you actually cooked ("Paneer burji")
          // recipeName = the linked recipe ("Paneer Butter Masala Recipe") — only for shopping list
          // Always show customName first so the recipe link doesn't rename the dish
          const displayName = dish.customName ?? dish.recipeName ?? 'Unnamed dish';
          const isLow = dish.servingsRemaining <= 1;

          return (
            <div
              key={dish.id}
              className="p-3 rounded-xl"
              style={{
                backgroundColor: isLow ? 'rgba(239, 68, 68, 0.04)' : colors.bg.primary,
                border: `1px solid ${isLow ? 'rgba(239, 68, 68, 0.2)' : colors.border.light}`,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isLow && <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                  {renamingDishId === dish.id ? (
                    <input
                      ref={renameInputRef}
                      type="text"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && renameValue.trim()) {
                          onRenameDish(dish, renameValue.trim());
                          setRenamingDishId(null);
                        }
                        if (e.key === 'Escape') setRenamingDishId(null);
                      }}
                      onBlur={() => {
                        if (renameValue.trim() && renameValue.trim() !== displayName) {
                          onRenameDish(dish, renameValue.trim());
                        }
                        setRenamingDishId(null);
                      }}
                      className="flex-1 text-sm font-semibold px-2 py-0.5 rounded-lg border outline-none min-w-0"
                      style={{ borderColor: '#C18B5E', color: colors.text.primary }}
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: colors.text.primary }}>
                        {displayName}
                      </p>
                      <button
                        type="button"
                        onClick={() => { setRenamingDishId(dish.id); setRenameValue(displayName); }}
                        className="flex-shrink-0 p-0.5 rounded transition-opacity opacity-30 hover:opacity-70"
                        aria-label={`Rename ${displayName}`}
                      >
                        <Pencil className="w-3 h-3" style={{ color: colors.text.tertiary }} />
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onLogFromPool(dish, 'lunch')}
                  className="ml-3 flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{ backgroundColor: 'rgba(212, 165, 116, 0.15)', color: '#C18B5E' }}
                  aria-label={`Log ${displayName}`}
                >
                  Log →
                </button>
              </div>

              {/* Recipe link indicator — compact, below dish name */}
              {linkingDishId === dish.id ? (
                <div className="mb-2">
                  <select
                    autoFocus
                    defaultValue={dish.recipeId ?? ''}
                    onChange={(e) => {
                      onLinkRecipe(dish, e.target.value || null);
                      setLinkingDishId(null);
                    }}
                    onBlur={() => setLinkingDishId(null)}
                    className="w-full text-xs px-2 py-1.5 rounded-lg border outline-none"
                    style={{ borderColor: '#C18B5E', color: colors.text.primary }}
                  >
                    <option value="">— No recipe —</option>
                    {recipes.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setLinkingDishId(dish.id)}
                  className="flex items-center gap-1 mb-1.5 text-xs transition-opacity"
                  style={{ color: dish.recipeId ? '#10B981' : colors.text.tertiary, opacity: dish.recipeId ? 0.85 : 0.6 }}
                  aria-label={dish.recipeId ? 'Change linked recipe' : 'Link recipe for shopping list'}
                >
                  <Link className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">
                    {dish.recipeId
                      ? `${recipes.find(r => r.id === dish.recipeId)?.name ?? 'recipe'} ✓`
                      : 'Link recipe for shopping list'}
                  </span>
                </button>
              )}
              <div className="flex items-center justify-between mt-1.5">
                <ServingBar cooked={dish.servingsCooked} remaining={dish.servingsRemaining} />
                <button
                  type="button"
                  onClick={() => onMarkDone(dish)}
                  className="ml-3 flex-shrink-0 text-xs font-medium transition-colors"
                  style={{ color: '#9CA3AF' }}
                  title="Mark as all gone (no log entry)"
                  aria-label={`Mark ${displayName} as all gone`}
                >
                  all gone
                </button>
              </div>
            </div>
          );
        })}

        {emptyDishes.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.text.tertiary }}>
              Finished
            </p>
            {emptyDishes.map(dish => (
              <div key={dish.id} className="flex items-center gap-2 py-1">
                <span className="text-sm line-through" style={{ color: colors.text.tertiary }}>
                  {dish.customName ?? dish.recipeName ?? 'Unnamed'}
                </span>
                <span className="text-xs" style={{ color: colors.text.tertiary }}>· all eaten 🎉</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FridgePoolV2;
