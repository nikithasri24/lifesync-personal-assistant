/**
 * FilterBarV2 Component
 * Recipe filtering with pill-style buttons
 * Search, cuisine, difficulty, favorites
 */

import React from 'react';
import { Search } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

export interface RecipeFilters {
  search: string;
  cuisine: string;
  difficulty: string;
  favoritesOnly: boolean;
}

interface FilterBarV2Props {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
  cuisines: string[];
}

export const FilterBarV2: React.FC<FilterBarV2Props> = ({
  filters,
  onFiltersChange,
  cuisines,
}) => {
  const colors = useThemeColors();

  return (
    <div className="mb-6 space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
          style={{ color: colors.text.tertiary }}
        />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          placeholder="Search recipes..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onFiltersChange({ ...filters, favoritesOnly: !filters.favoritesOnly })}
          className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
          style={{
            background: filters.favoritesOnly
              ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
              : colors.bg.secondary,
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: filters.favoritesOnly ? '#C18B5E' : 'transparent',
            color: filters.favoritesOnly ? '#C18B5E' : colors.text.secondary,
          }}
        >
          ⭐ Favorites Only
        </button>
      </div>

      {/* Cuisine Filter */}
      {cuisines.length > 0 && (
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: colors.text.tertiary }}>
            Cuisine
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => onFiltersChange({ ...filters, cuisine: '' })}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: !filters.cuisine
                  ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                  : colors.bg.secondary,
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: !filters.cuisine ? '#C18B5E' : 'transparent',
                color: !filters.cuisine ? '#C18B5E' : colors.text.secondary,
              }}
            >
              All
            </button>
            {cuisines.map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => onFiltersChange({ ...filters, cuisine })}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize"
                style={{
                  background: filters.cuisine === cuisine
                    ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                    : colors.bg.secondary,
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: filters.cuisine === cuisine ? '#C18B5E' : 'transparent',
                  color: filters.cuisine === cuisine ? '#C18B5E' : colors.text.secondary,
                }}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Difficulty Filter */}
      <div>
        <div className="text-xs font-semibold mb-2" style={{ color: colors.text.tertiary }}>
          Difficulty
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', 'easy', 'medium', 'hard'].map((diff) => (
            <button
              key={diff || 'all'}
              onClick={() => onFiltersChange({ ...filters, difficulty: diff })}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize"
              style={{
                background: filters.difficulty === diff
                  ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                  : colors.bg.secondary,
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: filters.difficulty === diff ? '#C18B5E' : 'transparent',
                color: filters.difficulty === diff ? '#C18B5E' : colors.text.secondary,
              }}
            >
              {diff || 'All'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterBarV2;
