/**
 * FridgePoolV2
 * Displays the active batch cook session's dishes with serving counts.
 * Each dish shows a progress bar (remaining / cooked) and a quick-log button.
 */

import React, { useRef, useState, useEffect } from 'react';
import { ChefHat, AlertTriangle, Link, Pencil, Plus, Trash2, X, Check, Youtube, ShoppingCart } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { BatchCookSession, BatchCookDish } from '../../types';

interface Recipe { id: string; name: string; }

interface FridgePoolV2Props {
  /** All sessions that have food remaining. When multiple, a tab row is shown. */
  sessions: BatchCookSession[];
  recipes: Recipe[];
  onLogFromPool: (dish: BatchCookDish, mealType: string) => void;
  onMarkDone: (dish: BatchCookDish) => void;
  onLinkRecipe: (dish: BatchCookDish, recipeId: string | null) => void;
  onRenameDish: (dish: BatchCookDish, newName: string) => void;
  onNewSession: () => void;
  onAddDish: (sessionId: string, name: string, servings: number) => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
  /** Called when the user wants to create a new recipe for a dish that has none yet */
  onCreateRecipeForDish?: (dishId: string, dishName: string) => void;
  /** Called when the user wants to edit the recipe already linked to a dish */
  onEditRecipe?: (recipeId: string) => void;
  /** Called when the user wants to add all recipe ingredients from this session to the Shopping List */
  onShopSession?: (session: BatchCookSession) => Promise<void>;
  /** Called when the user wants to deduct recipe ingredients from pantry (they just cooked this) */
  onDeductFromPantry?: (session: BatchCookSession) => Promise<void>;
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

export const FridgePoolV2: React.FC<FridgePoolV2Props> = ({ sessions, recipes, onLogFromPool, onMarkDone, onLinkRecipe, onRenameDish, onNewSession, onAddDish, onDeleteSession, onCreateRecipeForDish, onEditRecipe, onShopSession, onDeductFromPantry }) => {
  const colors = useThemeColors();
  const [activeIdx, setActiveIdx] = useState(0);
  const [linkingDishId, setLinkingDishId] = useState<string | null>(null);
  const [renamingDishId, setRenamingDishId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  // Add-dish inline form state
  const [showAddDish, setShowAddDish] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishServings, setNewDishServings] = useState(4);
  const [addingDish, setAddingDish] = useState(false);
  const addDishInputRef = useRef<HTMLInputElement>(null);
  const [shoppingDone, setShoppingDone] = useState(false);
  const [pantryDone, setPantryDone] = useState(false);

  // Keep activeIdx in range if sessions array shrinks
  useEffect(() => {
    if (activeIdx >= sessions.length) setActiveIdx(0);
  }, [sessions.length, activeIdx]);

  // Reset action states when switching sessions
  useEffect(() => { setShoppingDone(false); setPantryDone(false); }, [activeIdx]);

  const session = sessions[activeIdx] ?? sessions[0];
  if (!session) return null;

  const activeDishes = session.dishes.filter(d => d.servingsRemaining > 0);
  const emptyDishes = session.dishes.filter(d => d.servingsRemaining === 0);
  const hasMultipleSessions = sessions.length > 1;

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
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: colors.border.light, backgroundColor: 'rgba(212, 165, 116, 0.06)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChefHat className="w-5 h-5 flex-shrink-0" style={{ color: '#C18B5E' }} />
          <div className="min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: colors.text.primary }}>{session.name}</p>
            <p className="text-xs" style={{ color: colors.text.tertiary }}>
              {activeDishes.length} dish{activeDishes.length !== 1 ? 'es' : ''} ready ·{' '}
              {session.dishes.reduce((sum, d) => sum + d.servingsRemaining, 0)} servings left
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {/* Shop for this session — adds all recipe ingredients to Shopping List */}
          {onShopSession && (
            shoppingDone ? (
              <span
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                style={{ color: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)' }}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Added ✓
              </span>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await onShopSession(session);
                    setShoppingDone(true);
                  } catch {
                    // error toast handled in MealPlanning — don't set done
                  }
                }}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ color: '#C18B5E', backgroundColor: 'rgba(212, 165, 116, 0.15)' }}
                aria-label="Add session ingredients to Shopping List"
                title="Add all recipe ingredients to Shopping List"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Shop
              </button>
            )
          )}
          {/* Deduct from pantry — marks ingredients as used */}
          {onDeductFromPantry && (
            pantryDone ? (
              <span
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                style={{ color: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)' }}
              >
                ✓ Pantry updated
              </span>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await onDeductFromPantry(session);
                    setPantryDone(true);
                  } catch {
                    // error handled upstream
                  }
                }}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ color: '#6B7280', backgroundColor: 'rgba(107,114,128,0.1)' }}
                aria-label="Deduct recipe ingredients from pantry"
                title="I cooked this — update pantry"
              >
                📦 Used pantry
              </button>
            )
          )}
          {/* Add dish to current session */}
          <button
            type="button"
            onClick={() => { setShowAddDish(v => !v); setTimeout(() => addDishInputRef.current?.focus(), 50); }}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
            style={{ color: '#C18B5E', backgroundColor: 'rgba(212, 165, 116, 0.15)' }}
            aria-label="Add dish to session"
            title="Add a dish to this session"
          >
            <Plus className="w-3.5 h-3.5" />
            Add dish
          </button>
          {/* Delete session */}
          <button
            type="button"
            onClick={async () => {
              if (window.confirm(`Delete "${session.name}"? This removes all dishes and logs.`)) {
                await onDeleteSession(session.id);
              }
            }}
            className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
            style={{ color: '#9CA3AF' }}
            aria-label={`Delete session ${session.name}`}
            title="Delete this session"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {/* New Session */}
          <button
            type="button"
            onClick={onNewSession}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
            style={{ color: '#C18B5E', backgroundColor: 'rgba(212, 165, 116, 0.15)' }}
          >
            + New
          </button>
        </div>
      </div>

      {/* Inline "Add Dish" form — slides in under the header */}
      {showAddDish && (
        <div
          className="flex items-center gap-2 px-4 py-3 border-b"
          style={{ borderColor: colors.border.light, backgroundColor: 'rgba(212,165,116,0.04)' }}
        >
          <input
            ref={addDishInputRef}
            type="text"
            value={newDishName}
            onChange={e => setNewDishName(e.target.value)}
            onKeyDown={async e => {
              if (e.key === 'Enter' && newDishName.trim()) {
                setAddingDish(true);
                try { await onAddDish(session.id, newDishName.trim(), newDishServings); setNewDishName(''); setShowAddDish(false); } finally { setAddingDish(false); }
              }
              if (e.key === 'Escape') { setShowAddDish(false); setNewDishName(''); }
            }}
            placeholder="Dish name…"
            className="flex-1 text-sm px-3 py-1.5 rounded-lg border outline-none"
            style={{ borderColor: '#C18B5E', color: colors.text.primary, minWidth: 0 }}
            disabled={addingDish}
          />
          <input
            type="number"
            value={newDishServings}
            onChange={e => setNewDishServings(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            max={99}
            className="w-16 text-sm px-2 py-1.5 rounded-lg border text-center outline-none"
            style={{ borderColor: colors.border.light, color: colors.text.primary }}
            title="Servings"
            disabled={addingDish}
          />
          <span className="text-xs flex-shrink-0" style={{ color: colors.text.tertiary }}>servings</span>
          <button
            type="button"
            disabled={!newDishName.trim() || addingDish}
            onClick={async () => {
              if (!newDishName.trim()) return;
              setAddingDish(true);
              try { await onAddDish(session.id, newDishName.trim(), newDishServings); setNewDishName(''); setShowAddDish(false); } finally { setAddingDish(false); }
            }}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
            style={{ backgroundColor: 'rgba(212,165,116,0.2)', color: '#C18B5E' }}
            aria-label="Confirm add dish"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => { setShowAddDish(false); setNewDishName(''); }}
            className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: '#9CA3AF' }}
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Session tabs — shown only when multiple sessions have food remaining */}
      {hasMultipleSessions && (
        <div
          className="flex gap-2 px-4 pt-3 pb-1 flex-wrap"
          style={{ borderBottom: `1px solid ${colors.border.light}` }}
        >
          {sessions.map((s, i) => {
            const remaining = s.dishes.reduce((sum, d) => sum + d.servingsRemaining, 0);
            const isActive = i === activeIdx;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setActiveIdx(i);
                  setLinkingDishId(null);
                  setRenamingDishId(null);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  backgroundColor: isActive ? 'rgba(212,165,116,0.18)' : colors.bg.secondary,
                  border: `1.5px solid ${isActive ? '#C18B5E' : colors.border.light}`,
                  color: isActive ? '#C18B5E' : colors.text.tertiary,
                }}
                aria-label={`Switch to session: ${s.name}`}
                aria-pressed={isActive}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: isActive ? '#C18B5E' : '#9CA3AF' }}
                />
                <span className="truncate" style={{ maxWidth: '100px' }}>{s.name}</span>
                <span
                  className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: isActive ? '#C18B5E' : '#E5E7EB',
                    color: isActive ? 'white' : '#6B7280',
                    minWidth: '18px',
                    textAlign: 'center',
                  }}
                >
                  {remaining}
                </span>
              </button>
            );
          })}
        </div>
      )}

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
                <div className="flex items-center gap-3 mb-1.5">
                  {(() => {
                    const linkedRecipe = dish.recipeId ? recipes.find(r => r.id === dish.recipeId) : undefined;
                    const hasIngredients = linkedRecipe && linkedRecipe.ingredients && linkedRecipe.ingredients.length > 0;
                    const isFullyLinked = !!dish.recipeId && hasIngredients;
                    const youtubeUrl = linkedRecipe?.sourceUrl;

                    return (
                      <>
                        {/* Link/unlink button — shows ✓ only when recipe has ingredients */}
                        <button
                          type="button"
                          onClick={() => setLinkingDishId(dish.id)}
                          className="flex items-center gap-1 text-xs transition-opacity"
                          style={{
                            color: isFullyLinked ? '#10B981' : colors.text.tertiary,
                            opacity: isFullyLinked ? 0.85 : 0.6,
                          }}
                          aria-label={isFullyLinked ? 'Change linked recipe' : 'Link existing recipe'}
                        >
                          <Link className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {isFullyLinked ? `${linkedRecipe!.name} ✓` : 'Link recipe'}
                          </span>
                        </button>

                        {/* Edit recipe — only when fully linked */}
                        {isFullyLinked && onEditRecipe && (
                          <button
                            type="button"
                            onClick={() => onEditRecipe(dish.recipeId!)}
                            className="flex items-center gap-1 text-xs font-semibold transition-colors"
                            style={{ color: '#C18B5E' }}
                            aria-label={`Edit recipe for ${displayName}`}
                          >
                            <Pencil className="w-3 h-3 flex-shrink-0" />
                            Edit recipe
                          </button>
                        )}

                        {/* Create recipe — when no recipe or recipe is empty (no ingredients) */}
                        {!isFullyLinked && onCreateRecipeForDish && (
                          <button
                            type="button"
                            onClick={() => onCreateRecipeForDish(dish.id, dish.customName ?? dish.recipeName ?? displayName)}
                            className="flex items-center gap-1 text-xs font-semibold transition-colors"
                            style={{ color: '#C18B5E' }}
                            aria-label={`Create recipe for ${displayName}`}
                          >
                            <Plus className="w-3 h-3 flex-shrink-0" />
                            Create recipe
                          </button>
                        )}

                        {/* YouTube watch — shown whenever linked recipe has a URL, even if empty */}
                        {youtubeUrl && (
                          <a
                            href={youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg transition-opacity hover:opacity-80"
                            style={{ backgroundColor: '#FF0000', color: 'white' }}
                            aria-label={`Watch ${displayName} on YouTube`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Youtube className="w-3 h-3 flex-shrink-0" />
                            Watch
                          </a>
                        )}
                      </>
                    );
                  })()}
                </div>
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
