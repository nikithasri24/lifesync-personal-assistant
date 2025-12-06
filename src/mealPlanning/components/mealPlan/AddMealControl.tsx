/**
 * AddMealControl Component
 * Smart input for adding meals with autocomplete and recipe auto-linking
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';
import { startOfWeek, isSameWeek } from 'date-fns';
import type { Recipe } from '../../../types';
import {
  useRecipesQuery,
  useMealPlansQuery,
  useCreatePlannedMealMutation,
  useCreateRecipeMutation,
  useCreateMealPlanMutation,
} from '../../hooks/useMealPlanningQuery';
import { useAppStore } from '../../../stores';
import { parseLocalDateKey, ensureDate } from '../../utils/mealPlanHelpers';
import { getMealDraft, saveMealDraft, clearMealDraft } from '../../services/storage/draftStorage';
import { logger } from '../../../services/logger';

export interface AddMealControlProps {
  dateKey: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  onAdded?: () => void;
  showByDefault?: boolean;
  compact?: boolean;
  triggerRef?: React.MutableRefObject<(() => void) | null>;
  onFetchRecipe?: (mealName: string) => Promise<Omit<Recipe, 'id' | 'createdAt'> | null>;
}

interface MatchCandidate {
  id: string;
  name: string;
  score: number;
  type: 'custom' | 'option' | 'recipe';
  count?: number;
}

/**
 * Score a text match for fuzzy search
 */
function scoreMatch(text: string, query: string): number {
  const lower = text.toLowerCase();

  // Exact match (highest priority)
  if (lower === query) return 1000;

  // Starts with query
  if (lower.startsWith(query)) return 900;

  // Word starts with query
  const words = lower.split(/\s+/);
  if (words.some(w => w.startsWith(query))) return 800;

  // Contains query
  if (lower.includes(query)) return 700;

  // Fuzzy match - calculate similarity
  let fuzzyScore = 0;
  let queryIdx = 0;
  for (let i = 0; i < lower.length && queryIdx < query.length; i++) {
    if (lower[i] === query[queryIdx]) {
      fuzzyScore += (100 - i); // Earlier matches score higher
      queryIdx++;
    }
  }
  if (queryIdx === query.length) return fuzzyScore;

  return 0; // No match
}

export const AddMealControl: React.FC<AddMealControlProps> = ({
  dateKey,
  mealType,
  onAdded,
  showByDefault = true,
  compact = false,
  triggerRef,
  onFetchRecipe,
}) => {
  const { mealOptions, weekStartsOn } = useAppStore();
  const { data: recipes = [] } = useRecipesQuery();
  const { data: mealPlans = [] } = useMealPlansQuery();
  const createPlannedMealMutation = useCreatePlannedMealMutation();
  const createRecipeMutation = useCreateRecipeMutation();
  const createMealPlanMutation = useCreateMealPlanMutation();

  // Load persisted draft from localStorage
  const [query, setQuery] = useState(() => {
    const saved = getMealDraft(dateKey, mealType);
    return saved ?? '';
  });

  const [showInput, setShowInput] = useState(showByDefault);
  const [showList, setShowList] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDraftIndicator, setShowDraftIndicator] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const draftTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Expose trigger function via ref
  useEffect(() => {
    if (triggerRef) {
      triggerRef.current = () => setShowInput(true);
    }
  }, [triggerRef]);

  // Persist query to localStorage whenever it changes
  useEffect(() => {
    if (query.trim()) {
      saveMealDraft(dateKey, mealType, query);
      // Show "Draft saved" indicator briefly
      setShowDraftIndicator(true);
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      draftTimerRef.current = setTimeout(() => setShowDraftIndicator(false), 1500);
    } else {
      clearMealDraft(dateKey, mealType);
      setShowDraftIndicator(false);
    }
  }, [query, dateKey, mealType]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, []);

  // Extract all historical custom meals from all meal plans
  const historicalMeals = useMemo(() => {
    const customMeals = new Map<string, { name: string; count: number; lastUsed: Date }>();

    mealPlans.forEach(plan => {
      plan.meals?.forEach(meal => {
        if (meal.customMeal && !meal.recipeId) {
          const key = meal.customMeal.toLowerCase();
          const existing = customMeals.get(key);
          const mealDate = ensureDate(meal.date);

          if (existing) {
            existing.count++;
            if (mealDate > existing.lastUsed) {
              existing.lastUsed = mealDate;
            }
          } else {
            customMeals.set(key, {
              name: meal.customMeal,
              count: 1,
              lastUsed: mealDate
            });
          }
        }
      });
    });

    // Sort by frequency (count) and recency
    return Array.from(customMeals.values())
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.lastUsed.getTime() - a.lastUsed.getTime();
      })
      .map(item => ({ id: `__custom__:${item.name}`, name: item.name, count: item.count }));
  }, [mealPlans]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      return [];
    }

    // Collect all candidates
    const candidates: MatchCandidate[] = [];

    // Add historical custom meals
    historicalMeals.forEach(item => {
      const score = scoreMatch(item.name, q);
      if (score > 0) {
        candidates.push({ id: `__custom__:${item.name}`, name: item.name, score, type: 'custom', count: item.count });
      }
    });

    // Add meal options
    const opts = mealOptions[mealType] || [];
    opts.forEach(name => {
      const score = scoreMatch(name, q);
      if (score > 0) {
        candidates.push({ id: `__opt__:${name}`, name, score, type: 'option' });
      }
    });

    // Add recipes
    recipes.forEach(recipe => {
      const score = scoreMatch(recipe.name, q);
      if (score > 0) {
        candidates.push({ id: recipe.id, name: recipe.name, score, type: 'recipe' });
      }
    });

    // Deduplicate by name (case-insensitive), keeping highest score
    const deduped = new Map<string, MatchCandidate>();
    candidates.forEach(candidate => {
      const key = candidate.name.toLowerCase();
      const existing = deduped.get(key);
      if (!existing || candidate.score > existing.score) {
        deduped.set(key, candidate);
      }
    });

    // Sort by score descending, then alphabetically
    return Array.from(deduped.values())
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 12);
  }, [query, recipes, mealOptions, mealType, historicalMeals]);

  const add = async (recipeId?: string, customMeal?: string): Promise<void> => {
    try {
      const weekStart = startOfWeek(parseLocalDateKey(dateKey), { weekStartsOn });

      // Find existing plan or create one
      let plan = mealPlans.find(p => isSameWeek(ensureDate(p.weekStartDate), weekStart));

      // If no plan exists, create one via mutation
      plan ??= await createMealPlanMutation.mutateAsync({
        weekStartDate: weekStart,
        name: 'Meal plan',
        weekStartsOn
      });

      // Auto-link to existing recipe if one exists with the same name
      let finalRecipeId = recipeId;
      let finalCustomMeal = customMeal;

      if (!recipeId && customMeal) {
        // Check if a recipe exists with this name (case-insensitive)
        const existingRecipe = recipes.find(
          r => r.name.toLowerCase() === customMeal.toLowerCase()
        );

        if (existingRecipe) {
          // Auto-link to existing recipe
          finalRecipeId = existingRecipe.id;
          finalCustomMeal = undefined;
          logger.debug('AddMealControl', `Auto-linked meal "${customMeal}" to existing recipe`);
        } else if (onFetchRecipe) {
          // Try to auto-fetch recipe from external source
          try {
            const fetchedRecipe = await onFetchRecipe(customMeal);
            if (fetchedRecipe) {
              const newRecipe = await createRecipeMutation.mutateAsync(fetchedRecipe);
              if (newRecipe?.id) {
                finalRecipeId = newRecipe.id;
                finalCustomMeal = undefined;
                logger.debug('AddMealControl', `Auto-created recipe for "${customMeal}" from external source`);
              }
            }
          } catch (error) {
            logger.warn('AddMealControl', 'Failed to auto-fetch recipe, using custom meal:', { error });
            // Will fall back to custom meal
          }
        }
      }

      await createPlannedMealMutation.mutateAsync({
        planId: plan.id,
        meal: {
          date: parseLocalDateKey(dateKey),
          mealType,
          recipeId: finalRecipeId,
          customMeal: finalCustomMeal,
          servings: 4,
          peopleCount: 4,
          status: 'planned',
          notes: undefined,
          preparedAt: undefined,
          consumedAt: undefined,
        }
      });

      // Clear the input and persisted draft
      setQuery('');
      setShowList(false);
      clearMealDraft(dateKey, mealType);

      // Hide input if it wasn't shown by default
      if (!showByDefault) {
        setShowInput(false);
      }
      onAdded?.();
    } catch (error) {
      logger.error('AddMealControl', 'Failed to add meal:', { error });
      // Keep the input open so user can try again
      setShowList(true);
    }
  };

  // Enrich a custom meal by linking an existing recipe or auto-fetching one
  const enrichAndAdd = async (name: string): Promise<void> => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      // 1) If an existing recipe matches exactly (case-insensitive), link it
      const existing = recipes.find(r => r.name.trim().toLowerCase() === trimmed.toLowerCase());
      if (existing?.id) {
        await add(existing.id, undefined);
        return;
      }
      // 2) Else, try to fetch a draft from external source and save it, then link
      if (onFetchRecipe) {
        const draft = await onFetchRecipe(trimmed).catch(() => null);
        if (draft) {
          const created = await createRecipeMutation.mutateAsync({ ...draft, name: trimmed });
          if (created?.id) {
            await add(created.id, undefined);
            return;
          }
        }
      }
      // 3) Fallback: add as plain custom meal
      await add(undefined, trimmed);
    } catch (e) {
      logger.warn('AddMealControl', 'Enrich add failed; falling back to custom meal', { error: e });
      await add(undefined, trimmed);
    }
  };

  const onKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>): Promise<void> => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matches.length > 0) {
        const selected = matches[selectedIndex];
        const idStr = String(selected.id);
        if (idStr.startsWith('__opt__:') || idStr.startsWith('__custom__:')) {
          await enrichAndAdd(selected.name);
        } else {
          await add(selected.id);
        }
      } else if (query.trim()) {
        await enrichAndAdd(query.trim());
      }
      setSelectedIndex(0);
    } else if (e.key === 'Escape') {
      setShowList(false);
      setSelectedIndex(0);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // If input is hidden, show a "+" button
  if (!showInput) {
    if (compact) {
      // Compact version: don't render anything, use CSS overlay on cell hover
      return null;
    }

    // Full version: regular button for empty slots
    return (
      <button
        type="button"
        onClick={() => setShowInput(true)}
        className="w-full rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-400 hover:text-slate-600 hover:border-slate-400 transition flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        <span>Add meal</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setShowList(true); }}
        onFocus={() => setShowList(true)}
        onBlur={() => setTimeout(() => setShowList(false), 200)}
        onKeyDown={(e) => void onKeyDown(e)}
        placeholder="Type to add…"
        className="w-full rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm shadow-sm hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        autoFocus
      />
      {showDraftIndicator && query.trim() && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-emerald-600 font-medium pointer-events-none">
          Draft saved
        </div>
      )}
      {showList && query.trim().length > 0 && inputRef.current && createPortal(
        <div className="fixed z-[100] min-w-[240px] max-w-[320px] rounded-lg border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5" style={{
          left: inputRef.current.getBoundingClientRect().left,
          top: inputRef.current.getBoundingClientRect().bottom + 4,
        }}>
          {matches.length === 0 ? (
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-indigo-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void enrichAndAdd(query.trim())}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-xs font-semibold text-indigo-700">+</span>
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium">Add "{query.trim()}"</div>
                <div className="text-xs text-slate-500">Create new meal</div>
              </div>
            </button>
          ) : (
            <div className="max-h-[280px] overflow-auto py-1">
              {matches.map((r, idx) => {
                const idStr = String(r.id);
                const isCustom = idStr.startsWith('__custom__:');
                const isOption = idStr.startsWith('__opt__:');
                const isRecipe = !isCustom && !isOption;
                const isSelected = idx === selectedIndex;

                return (
                  <button
                    key={`${r.id}-${idx}`}
                    type="button"
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected ? 'bg-indigo-50 text-indigo-900' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => {
                      if (isCustom || isOption) {
                        void add(undefined, r.name);
                      } else {
                        void add(r.id);
                      }
                    }}
                  >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold ${
                      isRecipe ? 'bg-emerald-100 text-emerald-700' : isCustom ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isRecipe ? '📖' : isCustom ? '⭐' : '🍽️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{r.name}</div>
                      <div className="text-xs text-slate-500">
                        {isRecipe ? 'Recipe' : isCustom ? `Used ${r.count ?? 1}x` : 'Meal option'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default AddMealControl;
