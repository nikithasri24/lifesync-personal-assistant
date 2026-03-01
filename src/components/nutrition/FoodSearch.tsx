/**
 * Food Search Component
 * Search OpenFoodFacts database for food items with nutrition info
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/services/logger';
import { Search, X, Loader2, Star, Plus, ChevronRight } from 'lucide-react';
import { openFoodFactsService, type NutritionInfo } from '@/services/nutrition/OpenFoodFactsService';
import { useFoodSearchQuery } from '@/hooks/useNutritionQuery';
import ErrorState from '@/components/ErrorState';
import { convertToGrams } from './servingUtils';

type NutritionInfoWithMeta = NutritionInfo & {
  per100gReliable?: boolean;
};

interface FoodSearchProps {
  onSelectFood: (product: NutritionInfo) => void;
  onClose: () => void;
}

export function FoodSearch({ onSelectFood, onClose }: FoodSearchProps): React.ReactElement {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NutritionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('recentFoodSearches') || '[]');
    } catch { return []; }
  });

  const searchFoods = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const { products } = await openFoodFactsService.searchProducts(searchQuery);
      setResults(products);
      
      // Save to recent searches
      const recent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
      localStorage.setItem('recentFoodSearches', JSON.stringify(recent));
    } catch (err) {
      logger.error('Nutrition', 'Food search failed:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [recentSearches]);

  const {
    data: customFoods = [],
    error: customFoodError,
    isLoading: isCustomLoading,
  } = useFoodSearchQuery(query, { enabled: query.length >= 2 });

  const mergedResults = useMemo(() => {
    if (query.length < 2) return [];

    const mappedCustomFoods: NutritionInfoWithMeta[] = customFoods.map((food) => {
      const servingGrams = convertToGrams(food.serving_size, food.serving_unit);
      const per100gMultiplier = servingGrams ? 100 / servingGrams : null;
      return {
        name: food.name,
        brand: food.brand,
        barcode: `custom-${food.id}`,
        imageUrl: undefined,
        servingSize: `${food.serving_size} ${food.serving_unit}`.trim(),
        caloriesPer100g: per100gMultiplier ? Math.round(food.calories * per100gMultiplier) : food.calories,
        caloriesPerServing: food.calories,
        proteinPer100g: per100gMultiplier ? Math.round(food.protein_g * per100gMultiplier) : food.protein_g,
        carbsPer100g: per100gMultiplier ? Math.round(food.carbs_g * per100gMultiplier) : food.carbs_g,
        fatPer100g: per100gMultiplier ? Math.round(food.fat_g * per100gMultiplier) : food.fat_g,
        fiberPer100g: per100gMultiplier && food.fiber_g ? Math.round(food.fiber_g * per100gMultiplier) : food.fiber_g,
        sugarPer100g: per100gMultiplier && food.sugar_g ? Math.round(food.sugar_g * per100gMultiplier) : food.sugar_g,
        per100gReliable: !!per100gMultiplier,
      };
    });

    const keyFor = (item: NutritionInfo) =>
      `${item.brand ?? ''}|${item.name}`.toLowerCase().trim();

    const seen = new Set<string>();
    const combined = [...mappedCustomFoods, ...results].filter((item) => {
      const key = keyFor(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return combined;
  }, [customFoods, results, query.length]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query.length >= 3) {
        searchFoods(query);
      }
    }, 500);
    return () => clearTimeout(debounce);
  }, [query, searchFoods]);

  const getNutritionGradeColor = (grade?: string) => {
    switch (grade) {
      case 'A': return 'bg-green-500';
      case 'B': return 'bg-lime-500';
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-orange-500';
      case 'E': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <Search className="w-5 h-5 text-[#C18B5E]" />
          Search Food Database
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {customFoodError && (
          <ErrorState
            error={customFoodError}
            onRetry={() => {
              // react-query handles retrying via refetch on next render
              setQuery((current) => current);
            }}
          />
        )}

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search foods (e.g., apple, chicken breast, yogurt)"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E5B88A]"
            autoFocus
          />
          {(isLoading || isCustomLoading) && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C18B5E] animate-spin" />
          )}
        </div>

        {/* Recent searches */}
        {!hasSearched && recentSearches.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Recent searches:</p>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map(term => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="max-h-80 overflow-y-auto space-y-2">
          {mergedResults.map((product, idx) => (
            <button
              key={`${product.barcode}-${idx}`}
              onClick={() => onSelectFood(product)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-left transition-colors"
            >
              {product.imageUrl ? (
                <img src={product.imageUrl} alt="" className="w-12 h-12 object-cover rounded" />
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-2xl">🍽️</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{product.name}</p>
                {product.brand && <p className="text-sm text-gray-500 truncate">{product.brand}</p>}
                <div className="flex items-center gap-2 mt-1">
                  {'per100gReliable' in product && product.per100gReliable === false ? (
                    <span className="text-xs text-orange-600 font-medium">
                      {Math.round(product.caloriesPerServing ?? product.caloriesPer100g)} cal/serving
                    </span>
                  ) : (
                    <span className="text-xs text-orange-600 font-medium">
                      {Math.round(product.caloriesPer100g)} cal/100g
                    </span>
                  )}
                  {product.nutritionGrade && (
                    <span className={`text-xs text-white px-1.5 py-0.5 rounded ${getNutritionGradeColor(product.nutritionGrade)}`}>
                      {product.nutritionGrade}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </button>
          ))}

          {hasSearched && !isLoading && !isCustomLoading && mergedResults.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
