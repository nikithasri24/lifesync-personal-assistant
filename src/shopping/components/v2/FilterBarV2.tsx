/**
 * FilterBarV2 Component
 * Comprehensive filter bar with pill-style buttons
 * Includes: search, category filters, priority filters, store filters, purchased toggle
 */

import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { ShoppingItem, Store } from '../../types';

export type CategoryFilter = 'all' | ShoppingItem['category'];
export type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
export type StoreFilter = 'all' | string;

export interface FilterBarV2Props {
  categoryFilter: CategoryFilter;
  onCategoryFilterChange: (filter: CategoryFilter) => void;
  priorityFilter: PriorityFilter;
  onPriorityFilterChange: (filter: PriorityFilter) => void;
  storeFilter: StoreFilter;
  onStoreFilterChange: (filter: StoreFilter) => void;
  stores: Store[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  className?: string;
}

export const FilterBarV2: React.FC<FilterBarV2Props> = ({
  categoryFilter,
  onCategoryFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  storeFilter,
  onStoreFilterChange,
  stores,
  searchQuery,
  onSearchChange,
  className = '',
}) => {
  const colors = useThemeColors();
  const [showCategories, setShowCategories] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [showStores, setShowStores] = useState(false);

  const categoryOptions: { value: CategoryFilter; label: string; emoji: string }[] = [
    { value: 'all', label: 'All', emoji: '🛒' },
    { value: 'produce', label: 'Produce', emoji: '🥬' },
    { value: 'dairy', label: 'Dairy', emoji: '🥛' },
    { value: 'meat', label: 'Meat', emoji: '🥩' },
    { value: 'pantry', label: 'Pantry', emoji: '🥫' },
    { value: 'frozen', label: 'Frozen', emoji: '🧊' },
    { value: 'bakery', label: 'Bakery', emoji: '🍞' },
    { value: 'deli', label: 'Deli', emoji: '🧀' },
    { value: 'household', label: 'Household', emoji: '🧹' },
    { value: 'personal', label: 'Personal', emoji: '🧴' },
    { value: 'electronics', label: 'Electronics', emoji: '📱' },
    { value: 'other', label: 'Other', emoji: '📦' },
  ];

  const priorityOptions: { value: PriorityFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'high', label: '🔥 High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  return (
    <div className={`mb-6 space-y-3 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
          style={{ color: colors.text.tertiary }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search items..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
        />
      </div>

      {/* Category Filter Pills */}
      <div>
        <button
          onClick={() => setShowCategories(!showCategories)}
          className="w-full flex items-center justify-between text-xs font-semibold mb-2 py-1"
          style={{ color: colors.text.tertiary }}
        >
          <span>Category {categoryFilter !== 'all' && `(${categoryOptions.find(o => o.value === categoryFilter)?.label})`}</span>
          {showCategories ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showCategories && (
          <div className="flex gap-2 flex-wrap mb-2">
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onCategoryFilterChange(option.value)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: categoryFilter === option.value
                    ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                    : colors.bg.secondary,
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: categoryFilter === option.value ? '#C18B5E' : 'transparent',
                  color: categoryFilter === option.value ? '#C18B5E' : colors.text.secondary,
                }}
                aria-label={`Filter by ${option.label} category`}
              >
                {option.emoji} {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Priority Filter Pills */}
      <div>
        <button
          onClick={() => setShowPriority(!showPriority)}
          className="w-full flex items-center justify-between text-xs font-semibold mb-2 py-1"
          style={{ color: colors.text.tertiary }}
        >
          <span>Priority {priorityFilter !== 'all' && `(${priorityOptions.find(o => o.value === priorityFilter)?.label})`}</span>
          {showPriority ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showPriority && (
          <div className="flex gap-2 flex-wrap mb-2">
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onPriorityFilterChange(option.value)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: priorityFilter === option.value
                    ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                    : colors.bg.secondary,
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: priorityFilter === option.value ? '#C18B5E' : 'transparent',
                  color: priorityFilter === option.value ? '#C18B5E' : colors.text.secondary,
                }}
                aria-label={`Filter by ${option.label} priority`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Store Filter Pills */}
      {stores.length > 0 && (
        <div>
          <button
            onClick={() => setShowStores(!showStores)}
            className="w-full flex items-center justify-between text-xs font-semibold mb-2 py-1"
            style={{ color: colors.text.tertiary }}
          >
            <span>Store {storeFilter !== 'all' && `(${stores.find(s => s.id === storeFilter)?.name})`}</span>
            {showStores ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showStores && (
            <div className="flex gap-2 flex-wrap mb-2">
              <button
                onClick={() => onStoreFilterChange('all')}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: storeFilter === 'all'
                    ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                    : colors.bg.secondary,
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: storeFilter === 'all' ? '#C18B5E' : 'transparent',
                  color: storeFilter === 'all' ? '#C18B5E' : colors.text.secondary,
                }}
                aria-label="Show all stores"
              >
                All Stores
              </button>
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => onStoreFilterChange(store.id)}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2"
                  style={{
                    background: storeFilter === store.id
                      ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                      : colors.bg.secondary,
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: storeFilter === store.id ? '#C18B5E' : 'transparent',
                    color: storeFilter === store.id ? '#C18B5E' : colors.text.secondary,
                  }}
                  aria-label={`Filter by ${store.name}`}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: store.color || '#C18B5E' }}
                    aria-hidden="true"
                  />
                  {store.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBarV2;
