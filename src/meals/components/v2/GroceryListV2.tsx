/**
 * GroceryListV2 Component
 * Auto-generated grocery list from planned meals
 * Groups by category, shows recipe sources, export to shopping
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { GroceryItemV2 } from './GroceryItemV2';

interface GroceryItem {
  id: string;
  name: string;
  amount: string;
  unit: string;
  category: string;
  isChecked: boolean;
  isAtHome: boolean;
  recipeNames?: string[];
}

interface GroceryListV2Props {
  items: GroceryItem[];
  onItemCheck: (itemId: string) => void;
  onItemToggleAtHome: (itemId: string) => void;
  onExportToShopping: () => void;
}

export const GroceryListV2: React.FC<GroceryListV2Props> = ({
  items,
  onItemCheck,
  onItemToggleAtHome,
  onExportToShopping,
}) => {
  const colors = useThemeColors();

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, GroceryItem[]>);

  const categories = Object.keys(groupedItems).sort();

  const getCategoryEmoji = (category: string): string => {
    const emojis: Record<string, string> = {
      produce: '🥬',
      dairy: '🥛',
      meat: '🥩',
      pantry: '🥫',
      frozen: '🧊',
      bakery: '🍞',
      deli: '🧀',
      other: '📦',
    };
    return emojis[category] || '📦';
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">🛒</div>
        <p className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>
          No Grocery Items
        </p>
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          Plan meals for the week to generate your grocery list
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Export Button */}
      <div className="mb-6">
        <button
          onClick={onExportToShopping}
          className="w-full px-4 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
          }}
        >
          🛒 Add All to Shopping List
        </button>
      </div>

      {/* Grouped Grocery Items */}
      {categories.map((category) => (
        <div key={category} className="mb-6">
          <h3
            className="text-sm font-bold mb-3 capitalize"
            style={{ color: colors.text.secondary }}
          >
            {getCategoryEmoji(category)} {category}
          </h3>
          <div className="space-y-2">
            {groupedItems[category].map((item) => (
              <GroceryItemV2
                key={item.id}
                item={item}
                onCheck={() => onItemCheck(item.id)}
                onToggleAtHome={() => onItemToggleAtHome(item.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GroceryListV2;
