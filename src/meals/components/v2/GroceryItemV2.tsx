/**
 * GroceryItemV2 Component
 * Single grocery item with checkbox and "at home" toggle
 */

import React from 'react';
import { Home } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { CheckboxV2 } from '@/components/v2/CheckboxV2';

interface GroceryItemV2Props {
  item: {
    id: string;
    name: string;
    amount: string;
    unit: string;
    isChecked: boolean;
    isAtHome: boolean;
    recipeNames?: string[];
  };
  onCheck: () => void;
  onToggleAtHome: () => void;
}

export const GroceryItemV2: React.FC<GroceryItemV2Props> = ({
  item,
  onCheck,
  onToggleAtHome,
}) => {
  const colors = useThemeColors();

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border transition-colors"
      style={{
        backgroundColor: item.isChecked || item.isAtHome ? colors.bg.tertiary : colors.bg.white,
        borderColor: colors.border.light,
      }}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <CheckboxV2
          checked={item.isChecked}
          onChange={onCheck}
          size="md"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={`font-medium ${item.isChecked ? 'line-through' : ''}`}
          style={{ color: item.isChecked ? colors.text.tertiary : colors.text.primary }}
        >
          {item.amount} {item.unit} {item.name}
        </div>
        {item.recipeNames && item.recipeNames.length > 0 && (
          <div className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
            For: {item.recipeNames.join(', ')}
          </div>
        )}
      </div>

      <button
        onClick={onToggleAtHome}
        className={`p-2 rounded-lg transition-colors ${
          item.isAtHome ? 'bg-green-100' : 'hover:bg-gray-100'
        }`}
        aria-label={item.isAtHome ? 'Remove from at home' : 'Mark as at home'}
      >
        <Home
          className="w-4 h-4"
          style={{ color: item.isAtHome ? '#10B981' : colors.text.tertiary }}
        />
      </button>
    </div>
  );
};

export default GroceryItemV2;
