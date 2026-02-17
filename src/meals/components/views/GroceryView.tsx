/**
 * Grocery View Component
 * Auto-generated shopping list from weekly meals
 */

import React, { useState } from 'react';
import { Copy, ShoppingBag, Check } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { GroceryItem } from '../../../mealPlanning/hooks/useGroceryList';

interface GroceryViewProps {
  groceryList: GroceryItem[];
  neededItems: GroceryItem[];
  atHomeItems: GroceryItem[];
  onUpdateItemStatus: (name: string, status: 'needed' | 'at-home' | 'in-cart' | 'purchased') => void;
  onCopyToClipboard: () => void;
  onSendToShoppingList: (items: GroceryItem[]) => Promise<{ success: boolean; count: number }>;
}

type FilterTab = 'needed' | 'athome' | 'all';

// Group items by category
const categorizeItems = (items: GroceryItem[]) => {
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

export function GroceryView({
  groceryList,
  neededItems,
  atHomeItems,
  onUpdateItemStatus,
  onCopyToClipboard,
  onSendToShoppingList,
}: GroceryViewProps) {
  const colors = useThemeColors();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('needed');
  const [isSending, setIsSending] = useState(false);

  const filteredItems =
    activeFilter === 'needed'
      ? neededItems
      : activeFilter === 'athome'
        ? atHomeItems
        : groceryList;

  const categorized = categorizeItems(filteredItems);

  const handleSendToShopping = async () => {
    setIsSending(true);
    await onSendToShoppingList(neededItems);
    setIsSending(false);
  };

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh', paddingBottom: '140px' }}>
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
              backgroundColor:
                activeFilter === 'needed'
                  ? `${colors.accent.start}`
                  : colors.bg.white,
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
              backgroundColor:
                activeFilter === 'athome'
                  ? `${colors.accent.start}`
                  : colors.bg.white,
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
              backgroundColor:
                activeFilter === 'all'
                  ? `${colors.accent.start}`
                  : colors.bg.white,
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
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateItemStatus(item.name, isAtHome ? 'needed' : 'at-home')
                        }
                        className="flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200"
                        style={{
                          borderColor: isAtHome ? colors.status.success : colors.border.medium,
                          backgroundColor: isAtHome ? colors.status.success : 'transparent',
                        }}
                        aria-label={isAtHome ? 'Mark as needed' : 'Mark as at home'}
                      >
                        {isAtHome && <Check size={16} color="white" />}
                      </button>

                      {/* Item Details */}
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
              onClick={handleSendToShopping}
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
