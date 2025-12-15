import { useState, useMemo, useRef, useEffect } from 'react';
import { logger } from '../../services/logger';
import type { MealPlanWeek } from '../../types';
import type { Recipe } from './useMealPlanningQuery';

export type CellKey = string; // format: "yyyy-MM-dd:mealType"

interface CreatePlannedMealParams {
  planId: string;
  meal: {
    date: Date;
    mealType: string;
    recipeId?: string;
    customMeal?: string;
    servings: number;
    peopleCount: number;
    status: 'planned' | 'prepped' | 'cooked' | 'eaten';
    notes?: string;
    preparedAt?: Date;
    consumedAt?: Date;
  };
}

export function useMultiCellSelection(
  recipes: Recipe[],
  mealPlans: MealPlanWeek[],
  activePlan: MealPlanWeek | null,
  createPlannedMeal: (params: CreatePlannedMealParams) => Promise<void>,
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void
): {
  selectedCells: Set<CellKey>;
  isSelectionMode: boolean;
  multiCellQuery: string;
  setMultiCellQuery: (query: string) => void;
  showMultiCellList: boolean;
  setShowMultiCellList: (show: boolean) => void;
  multiCellSelectedIndex: number;
  setMultiCellSelectedIndex: (index: number | ((prev: number) => number)) => void;
  multiCellInputRef: React.RefObject<HTMLInputElement | null>;
  multiCellMatches: Array<{
    id: string;
    name: string;
    score: number;
    type: 'custom' | 'option' | 'recipe';
    count?: number;
  }>;
  makeCellKey: (dateKey: string, mealType: string) => CellKey;
  handleCellClick: (dateKey: string, mealType: string, event: React.MouseEvent) => void;
  clearSelection: () => void;
  addMealToSelectedCells: (recipeId: string, customMeal?: string) => Promise<void>;
  handleMultiCellKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => Promise<void>;
} {
  const [selectedCells, setSelectedCells] = useState<Set<CellKey>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [multiCellQuery, setMultiCellQuery] = useState('');
  const [showMultiCellList, setShowMultiCellList] = useState(false);
  const [multiCellSelectedIndex, setMultiCellSelectedIndex] = useState(0);
  const multiCellInputRef = useRef<HTMLInputElement | null>(null);

  const makeCellKey = (dateKey: string, mealType: string): CellKey => `${dateKey}:${mealType}`;

  const handleCellClick = (dateKey: string, mealType: string, event: React.MouseEvent): void => {
    const cellKey = makeCellKey(dateKey, mealType);

    if (event.metaKey || event.ctrlKey) {
      setIsSelectionMode(true);
      setSelectedCells((prev) => {
        const next = new Set(prev);
        if (next.has(cellKey)) {
          next.delete(cellKey);
        } else {
          next.add(cellKey);
        }
        if (next.size === 0) {
          setIsSelectionMode(false);
        }
        return next;
      });
    }
  };

  const clearSelection = (): void => {
    setSelectedCells(new Set());
    setIsSelectionMode(false);
  };

  const parseLocalDateKey = (key: string): Date => {
    const [y, m, d] = key.split('-').map((s) => Number(s));
    return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
  };

  const addMealToSelectedCells = async (recipeId: string, customMeal?: string): Promise<void> => {
    if (!activePlan || selectedCells.size === 0) return;

    try {
      const promises = Array.from(selectedCells).map((cellKey) => {
        const [dateKey, mealType] = cellKey.split(':');
        return createPlannedMeal({
          planId: activePlan.id,
          meal: {
            date: parseLocalDateKey(dateKey),
            mealType,
            recipeId: recipeId ?? undefined,
            customMeal: customMeal ?? undefined,
            servings: 4,
            peopleCount: 4,
            status: 'planned',
            notes: undefined,
            preparedAt: undefined,
            consumedAt: undefined,
          },
        });
      });

      await Promise.all(promises);
      showToast?.(`Added meal to ${selectedCells.size} cells`, 'success');
      clearSelection();
      setMultiCellQuery('');
    } catch (error) {
      logger.error('MultiCellSelection', error as Error, { context: 'add meals to selected cells failed' });
      showToast?.('Failed to add meals', 'error');
    }
  };

  // Score matching function
  const scoreMatch = (text: string, query: string): number => {
    const lower = text.toLowerCase();
    if (lower === query) return 1000;
    if (lower.startsWith(query)) return 900;
    const words = lower.split(/\s+/);
    if (words.some((w) => w.startsWith(query))) return 800;
    if (lower.includes(query)) return 700;
    let fuzzyScore = 0;
    let queryIdx = 0;
    for (let i = 0; i < lower.length && queryIdx < query.length; i++) {
      if (lower[i] === query[queryIdx]) {
        fuzzyScore += 100 - i;
        queryIdx++;
      }
    }
    if (queryIdx === query.length) return fuzzyScore;
    return 0;
  };

  const multiCellMatches = useMemo(() => {
    const q = multiCellQuery.trim().toLowerCase();
    if (!q) return [];

    const candidates: Array<{
      id: string;
      name: string;
      score: number;
      type: 'custom' | 'option' | 'recipe';
      count?: number;
    }> = [];

    // Add historical custom meals
    const customMeals = new Map<string, { name: string; count: number; lastUsed: Date }>();
    mealPlans.forEach((plan) => {
      plan.meals?.forEach((meal) => {
        if (meal.customMeal && !meal.recipeId) {
          const key = meal.customMeal.toLowerCase();
          const existing = customMeals.get(key);
          const mealDate = meal.date instanceof Date ? meal.date : new Date(meal.date);
          if (existing) {
            existing.count++;
            if (mealDate > existing.lastUsed) {
              existing.lastUsed = mealDate;
            }
          } else {
            customMeals.set(key, {
              name: meal.customMeal,
              count: 1,
              lastUsed: mealDate,
            });
          }
        }
      });
    });

    customMeals.forEach((item) => {
      const score = scoreMatch(item.name, q);
      if (score > 0) {
        candidates.push({
          id: `__custom__:${item.name}`,
          name: item.name,
          score,
          type: 'custom',
          count: item.count,
        });
      }
    });

    // Add recipes
    recipes.forEach((recipe) => {
      const score = scoreMatch(recipe.name, q);
      if (score > 0) {
        candidates.push({ id: recipe.id, name: recipe.name, score, type: 'recipe' });
      }
    });

    // Deduplicate and sort
    const deduped = new Map<string, (typeof candidates)[0]>();
    candidates.forEach((candidate) => {
      const key = candidate.name.toLowerCase();
      const existing = deduped.get(key);
      if (!existing || candidate.score > existing.score) {
        deduped.set(key, candidate);
      }
    });

    return Array.from(deduped.values())
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 12);
  }, [multiCellQuery, recipes, mealPlans]);

  const handleMultiCellKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>): Promise<void> => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMultiCellSelectedIndex((prev) => Math.min(prev + 1, multiCellMatches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMultiCellSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (multiCellMatches.length > 0) {
        const selected = multiCellMatches[multiCellSelectedIndex];
        const idStr = String(selected.id);
        if (idStr.startsWith('__custom__:')) {
          await addMealToSelectedCells('', selected.name);
        } else {
          await addMealToSelectedCells(selected.id);
        }
      } else if (multiCellQuery.trim()) {
        await addMealToSelectedCells('', multiCellQuery.trim());
      }
      setMultiCellSelectedIndex(0);
    } else if (e.key === 'Escape') {
      setShowMultiCellList(false);
      setMultiCellSelectedIndex(0);
      multiCellInputRef.current?.blur();
    }
  };

  useEffect(() => {
    setMultiCellSelectedIndex(0);
  }, [multiCellQuery]);

  return {
    selectedCells,
    isSelectionMode,
    multiCellQuery,
    setMultiCellQuery,
    showMultiCellList,
    setShowMultiCellList,
    multiCellSelectedIndex,
    setMultiCellSelectedIndex,
    multiCellInputRef,
    multiCellMatches,
    makeCellKey,
    handleCellClick,
    clearSelection,
    addMealToSelectedCells,
    handleMultiCellKeyDown,
  };
}
