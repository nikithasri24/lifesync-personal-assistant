/**
 * Grocery View Component
 * Auto-generated shopping list from weekly meals
 */

import React, { useState, useEffect } from 'react';
import { Copy, ShoppingBag, Check } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { GroceryItem } from '../../../mealPlanning/hooks/useGroceryList';

/** Per-session ingredient list for the multi-session selector */
export interface BatchSessionGrocery {
  id: string;
  name: string;
  ingredients: GroceryItem[];
}

interface GroceryViewProps {
  groceryList: GroceryItem[];
  neededItems: GroceryItem[];
  atHomeItems: GroceryItem[];
  onUpdateItemStatus: (itemId: string, status: 'needed' | 'at_home' | 'in_cart' | 'purchased') => void;
  onCopyToClipboard: () => void;
  onSendToShoppingList: (items: GroceryItem[]) => Promise<{ success: boolean; count: number }>;
  /** Batch cook session name (if active) — shown as source label */
  batchSessionName?: string;
  /** Ingredients aggregated from all batch cook session recipes (legacy, single-session) */
  batchIngredients?: GroceryItem[];
  /**
   * All active sessions with their own ingredient lists.
   * When provided with 2+ sessions, a session picker is shown so the user
   * can select whose grocery list they want to see / send to shopping.
   */
  allBatchSessions?: BatchSessionGrocery[];
}

type FilterTab = 'needed' | 'athome' | 'all';

// Group items by category
const categorizeItems = (items: GroceryItem[]): [string, GroceryItem[]][] => {
  const categories: Record<string, GroceryItem[]> = {
    Produce: [],
    Proteins: [],
    Dairy: [],
    'Pantry & Dry Goods': [],
    Other: [],
  };

  items.forEach((item) => {
    const name = item.name.toLowerCase();

    // Simple categorization logic
    if (
      name.includes('lettuce') ||
      name.includes('tomato') ||
      name.includes('onion') ||
      name.includes('pepper') ||
      name.includes('carrot') ||
      name.includes('potato') ||
      name.includes('fruit') ||
      name.includes('vegetable') ||
      name.includes('greens')
    ) {
      categories.Produce.push(item);
    } else if (
      name.includes('chicken') ||
      name.includes('beef') ||
      name.includes('pork') ||
      name.includes('fish') ||
      name.includes('tofu') ||
      name.includes('eggs')
    ) {
      categories.Proteins.push(item);
    } else if (
      name.includes('milk') ||
      name.includes('cheese') ||
      name.includes('yogurt') ||
      name.includes('butter') ||
      name.includes('cream')
    ) {
      categories.Dairy.push(item);
    } else if (
      name.includes('rice') ||
      name.includes('pasta') ||
      name.includes('bread') ||
      name.includes('flour') ||
      name.includes('sugar') ||
      name.includes('oil') ||
      name.includes('sauce') ||
      name.includes('spice')
    ) {
      categories['Pantry & Dry Goods'].push(item);
    } else {
      categories.Other.push(item);
    }
  });

  // Remove empty categories
  return Object.entries(categories).filter(([_, items]) => items.length > 0);
};

// ── Ingredient name parser ────────────────────────────────────────────────
// Handles messy recipe strings like "1 tablespoon (15 ml) oil" or
// "2 green cardamoms ( (or ¼ to ⅓ tsp ground cardamom, elaichi))"
// Returns { measurement, displayName } where displayName is stripped of
// leading quantities and all parenthetical notes.
const UNIT_RE = /^([\d\s\/\.\-½¼¾⅓⅔⅛]+)?\s*(tablespoons?|teaspoons?|cups?|tbsp\.?|tsp\.?|oz\.?|lbs?\.?|grams?|g|kgs?|ml|l|litres?|pieces?|pcs|whole|cloves?|inch|cm|pinch|handful|bunch|head|can|cans|slice|slices|sprig|sprigs)s?\b/i;

function parseIngredientDisplay(item: GroceryItem): { measurement: string; displayName: string } {
  // If structured amount+unit exist and name looks clean, use them directly
  if ((item.amount || item.unit) && !/^\d/.test(item.name)) {
    const measurement = [item.amount, item.unit].filter(Boolean).join(' ');
    return { measurement, displayName: item.name };
  }

  // Try to match a leading quantity+unit
  const match = item.name.match(UNIT_RE);
  let measurement = '';
  let rest = item.name;

  if (match) {
    measurement = match[0].trim();
    rest = item.name.slice(match[0].length).trim();
  } else if (item.amount) {
    measurement = [item.amount, item.unit].filter(Boolean).join(' ');
  }

  // Strip all parenthetical noise from the remaining name
  const cleaned = rest
    .replace(/\s*\(+[^)]*\)+/g, '')   // remove (notes like this)
    .replace(/\s*\[+[^)]*\]+/g, '')   // remove [notes]
    .replace(/,\s*$/, '')              // trailing comma
    .trim();

  return { measurement, displayName: cleaned || rest || item.name };
}

export function GroceryView({
  groceryList,
  neededItems,
  atHomeItems,
  onUpdateItemStatus,
  onCopyToClipboard,
  onSendToShoppingList,
  batchSessionName,
  batchIngredients,
  allBatchSessions,
}: GroceryViewProps): React.ReactElement {
  const colors = useThemeColors();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('needed');
  const [isSending, setIsSending] = useState(false);
  const [batchSentSuccess, setBatchSentSuccess] = useState(false);

  // Session picker: which session's grocery list to show (multi-session support)
  const hasMultipleSessions = (allBatchSessions?.length ?? 0) > 1;
  const [selectedSessionIdx, setSelectedSessionIdx] = useState(0);

  // Derive effective ingredients: from selected session (multi), or fallback to merged (legacy)
  const effectiveSession = allBatchSessions?.[selectedSessionIdx];
  const effectiveIngredients = effectiveSession?.ingredients ?? batchIngredients;
  const effectiveSessionName = effectiveSession?.name ?? batchSessionName;

  // Persist "have it" checks to localStorage keyed by session name so they survive reloads.
  // When the session changes (new batch cook or different session selected), key changes and we start fresh.
  const storageKey = effectiveSessionName ? `grocery_at_home_${effectiveSessionName}` : null;

  const [batchAtHome, setBatchAtHome] = useState<Set<string>>(new Set<string>());

  // Load from localStorage once the session name is known (it arrives async from Supabase).
  // Using a ref so we only load once per storageKey, not on every render.
  const loadedKeyRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!storageKey || loadedKeyRef.current === storageKey) return;
    loadedKeyRef.current = storageKey;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setBatchAtHome(new Set<string>(JSON.parse(saved) as string[]));
      }
    } catch {
      // ignore parse errors
    }
  }, [storageKey]);

  // Persist to localStorage whenever the set changes
  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(batchAtHome)));
    } catch {
      // ignore quota errors
    }
  }, [batchAtHome, storageKey]);

  const toggleBatchAtHome = (id: string): void => {
    setBatchAtHome(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const allChecked = !!(effectiveIngredients && effectiveIngredients.length > 0 && batchAtHome.size === effectiveIngredients.length);
  const toggleSelectAll = (): void => {
    if (allChecked) {
      setBatchAtHome(new Set());
    } else {
      setBatchAtHome(new Set(effectiveIngredients?.map(i => i.id) ?? []));
    }
    setBatchSentSuccess(false);
  };
  const batchNeededCount = (effectiveIngredients?.length ?? 0) - batchAtHome.size;

  const filteredItems =
    activeFilter === 'needed'
      ? neededItems
      : activeFilter === 'athome'
        ? atHomeItems
        : groceryList;

  const categorized = categorizeItems(filteredItems);

  const handleSendToShopping = async (): Promise<void> => {
    setIsSending(true);
    await onSendToShoppingList(neededItems);
    setIsSending(false);
  };

  // ── Batch mode: when a session is active, the grocery tab IS the batch checklist ──
  // Hide the regular planned-meals section entirely — it's always empty when batch cooking.
  if (effectiveSessionName && effectiveIngredients && effectiveIngredients.length > 0) {
    return (
      <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh', paddingBottom: '5rem' }}>
        <div className="px-4 pt-4 pb-6">
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(212, 165, 116, 0.3)' }}>
            {/* Session picker — shown when multiple sessions have ingredients */}
            {hasMultipleSessions && allBatchSessions && (
              <div
                className="flex gap-2 px-4 pt-3 pb-2 flex-wrap border-b"
                style={{ borderColor: 'rgba(212,165,116,0.2)', backgroundColor: 'rgba(212,165,116,0.04)' }}
              >
                {allBatchSessions.map((s, i) => {
                  const isActive = i === selectedSessionIdx;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setSelectedSessionIdx(i); setBatchAtHome(new Set()); setBatchSentSuccess(false); }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: isActive ? 'rgba(212,165,116,0.18)' : '#F3F4F6',
                        border: `1.5px solid ${isActive ? '#C18B5E' : '#E5E7EB'}`,
                        color: isActive ? '#C18B5E' : '#6B7280',
                      }}
                      aria-pressed={isActive}
                      aria-label={`Show grocery list for session: ${s.name}`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: isActive ? '#C18B5E' : '#9CA3AF' }}
                      />
                      <span className="truncate" style={{ maxWidth: '110px' }}>{s.name}</span>
                      <span
                        className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                        style={{
                          backgroundColor: isActive ? '#C18B5E' : '#E5E7EB',
                          color: isActive ? 'white' : '#6B7280',
                          minWidth: '18px',
                          textAlign: 'center',
                        }}
                      >
                        {s.ingredients.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-4"
              style={{ backgroundColor: 'rgba(212, 165, 116, 0.08)' }}
            >
              <div>
                <p className="font-bold text-sm" style={{ color: '#C18B5E' }}>
                  Shop for &quot;{effectiveSessionName}&quot;
                </p>
                <p className="text-xs mt-0.5" style={{ color: colors.text.tertiary }}>
                  {batchSentSuccess
                    ? 'Added to your shopping list'
                    : batchNeededCount > 0
                      ? `${batchNeededCount} to buy · ${batchAtHome.size} already have`
                      : `All ${effectiveIngredients.length} items checked off`}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-medium px-2 py-1 rounded-lg mr-2 flex-shrink-0"
                style={{ color: colors.text.tertiary, backgroundColor: colors.bg.primary }}
              >
                {allChecked ? 'Deselect all' : 'Select all'}
              </button>
              {batchSentSuccess ? (
                <span
                  className="text-xs font-semibold px-3 py-2 rounded-xl flex-shrink-0"
                  style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10B981' }}
                >
                  Sent!
                </span>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    const toSend = effectiveIngredients.filter(i => !batchAtHome.has(i.id));
                    const result = await onSendToShoppingList(toSend);
                    if (result.success) {
                      setBatchAtHome(new Set(effectiveIngredients.map(i => i.id)));
                      setBatchSentSuccess(true);
                    }
                  }}
                  disabled={batchNeededCount === 0}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
                >
                  {batchNeededCount > 0 ? `Add (${batchNeededCount}) to list` : 'Add to list'}
                </button>
              )}
            </div>

            {/* Ingredient checklist */}
            <div style={{ backgroundColor: colors.bg.white }}>
              {effectiveIngredients.map((ing, idx) => {
                const isAtHome = batchAtHome.has(ing.id);
                const { measurement, displayName } = parseIngredientDisplay(ing);
                return (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => { toggleBatchAtHome(ing.id); setBatchSentSuccess(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                    style={{
                      borderBottom: idx < effectiveIngredients.length - 1 ? `1px solid ${colors.border.light}` : 'none',
                      backgroundColor: isAtHome ? 'rgba(16, 185, 129, 0.03)' : 'transparent',
                    }}
                    aria-label={isAtHome ? `Unmark ${displayName}` : `Mark ${displayName} as at home`}
                  >
                    <div
                      className="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                      style={{
                        borderColor: isAtHome ? '#10B981' : colors.border.medium,
                        backgroundColor: isAtHome ? '#10B981' : 'transparent',
                      }}
                    >
                      {isAtHome && <Check size={11} color="white" strokeWidth={3} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium leading-tight"
                        style={{
                          color: isAtHome ? colors.text.tertiary : colors.text.primary,
                          textDecoration: isAtHome ? 'line-through' : 'none',
                        }}
                      >
                        {displayName}
                      </p>
                      {measurement && (
                        <p className="text-xs mt-0.5" style={{ color: colors.text.tertiary }}>
                          {measurement}
                        </p>
                      )}
                    </div>

                    {isAtHome && (
                      <span className="text-xs flex-shrink-0 font-medium" style={{ color: '#10B981' }}>
                        have it
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── No batch session active: show planned-meals grocery list ──────────────
  // Also shown when batch session exists but has no linked recipe ingredients yet.
  const noBatchButSessionExists = !!(effectiveSessionName && (!effectiveIngredients || effectiveIngredients.length === 0));

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh', paddingBottom: '140px' }}>
      {/* Hint when session exists but no recipes are linked */}
      {noBatchButSessionExists && (
        <div
          className="mx-4 mt-4 mb-2 px-4 py-3 rounded-xl text-sm"
          style={{ backgroundColor: 'rgba(212, 165, 116, 0.08)', color: colors.text.secondary, border: '1px solid rgba(212, 165, 116, 0.2)' }}
        >
          Link recipes to your batch cook dishes in the Recipes tab to generate a shopping list here.
        </div>
      )}

      {/* Header Stats */}
      <div className="px-6 pt-4 pb-3">
        <p style={{ fontSize: '14px', color: colors.text.tertiary }}>
          {neededItems.length} items needed • {atHomeItems.length} at home
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter('needed')}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: activeFilter === 'needed' ? `${colors.accent.start}` : colors.bg.white,
              color: activeFilter === 'needed' ? 'white' : colors.text.primary,
              border: activeFilter === 'needed' ? 'none' : `2px solid ${colors.border.light}`,
            }}
          >
            Needed ({neededItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('athome')}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: activeFilter === 'athome' ? `${colors.accent.start}` : colors.bg.white,
              color: activeFilter === 'athome' ? 'white' : colors.text.primary,
              border: activeFilter === 'athome' ? 'none' : `2px solid ${colors.border.light}`,
            }}
          >
            At Home ({atHomeItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: activeFilter === 'all' ? `${colors.accent.start}` : colors.bg.white,
              color: activeFilter === 'all' ? 'white' : colors.text.primary,
              border: activeFilter === 'all' ? 'none' : `2px solid ${colors.border.light}`,
            }}
          >
            All ({groceryList.length})
          </button>
        </div>
      </div>

      {/* Grocery List */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>
            No items to show
          </h3>
          <p className="text-sm text-center" style={{ color: colors.text.tertiary }}>
            {activeFilter === 'needed'
              ? 'All items are marked as at home'
              : activeFilter === 'athome'
                ? 'No items marked as at home'
                : 'Add meals to your week to generate a grocery list'}
          </p>
        </div>
      ) : (
        <div className="px-6 space-y-6">
          {categorized.map(([category, items]) => (
            <div key={category}>
              <h3
                className="text-sm font-semibold mb-3 uppercase tracking-wide"
                style={{ color: colors.text.secondary }}
              >
                {category}
              </h3>
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: colors.bg.white,
                  boxShadow: '0 2px 8px rgba(139, 111, 71, 0.06)',
                }}
              >
                {items.map((item, index) => {
                  const isAtHome = item.status === 'at-home';

                  return (
                    <div
                      key={item.name}
                      className="flex items-center gap-3 px-4 py-3"
                      style={{
                        borderBottom:
                          index === items.length - 1 ? 'none' : `1px solid ${colors.border.light}`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onUpdateItemStatus(item.id, isAtHome ? 'needed' : 'at_home')}
                        className="flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200"
                        style={{
                          borderColor: isAtHome ? colors.status.success : colors.border.medium,
                          backgroundColor: isAtHome ? colors.status.success : 'transparent',
                        }}
                        aria-label={isAtHome ? 'Mark as needed' : 'Mark as at home'}
                      >
                        {isAtHome && <Check size={16} color="white" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p
                          className="font-medium"
                          style={{
                            color: isAtHome ? colors.text.tertiary : colors.text.primary,
                            textDecoration: isAtHome ? 'line-through' : 'none',
                          }}
                        >
                          {item.name}
                        </p>
                        {(item.amount || item.unit) && (
                          <p className="text-xs mt-0.5" style={{ color: colors.text.tertiary }}>
                            {item.amount} {item.unit}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons - Fixed at bottom */}
      {neededItems.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 p-6 border-t"
          style={{
            backgroundColor: colors.bg.primary,
            borderColor: colors.border.light,
          }}
        >
          <div className="max-w-6xl mx-auto flex gap-3">
            <button
              type="button"
              onClick={onCopyToClipboard}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95"
              style={{
                backgroundColor: colors.bg.white,
                color: colors.text.primary,
                border: `2px solid ${colors.border.light}`,
              }}
            >
              <Copy size={18} />
              Copy List
            </button>
            <button
              type="button"
              onClick={() => { void handleSendToShopping(); }}
              disabled={isSending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                color: 'white',
              }}
            >
              <ShoppingBag size={18} />
              {isSending ? 'Sending...' : 'Send to Shopping'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
