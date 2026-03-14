/**
 * ShoppingItemCardV2 Component
 * Minimal shopping item card with 32px circular checkbox
 * iOS-inspired design with terracotta theme
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { CheckboxV2 } from '../../../components/v2/CheckboxV2';
import { BadgeV2 } from '../../../components/v2/BadgeV2';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { CATEGORY_ICONS } from '../../constants';
import type { ShoppingItem, Store } from '../../types';

export interface ShoppingItemCardV2Props {
  item: ShoppingItem & {
    ownerId?: string;
    ownerName?: string;
    isOwnedByCurrentUser?: boolean;
  };
  stores: Store[];
  onToggle: () => void;
  onEdit: () => void;
  className?: string;
}

export const ShoppingItemCardV2: React.FC<ShoppingItemCardV2Props> = ({
  item,
  stores,
  onToggle,
  onEdit,
  className = '',
}) => {
  const colors = useThemeColors();

  // Find store to display
  const storeToShow: Store | null = item.assignedStore
    ? (stores.find((s): s is Store => s.id === item.assignedStore) ?? null)
    : item.bestStores && item.bestStores.length > 0
    ? (stores.find((s): s is Store => s.id === item.bestStores?.[0]) ?? null)
    : null;

  return (
    <div
      onClick={onEdit}
      className={`flex items-center transition-colors cursor-pointer ${className}`}
      style={{
        minHeight: '72px',
        padding: '16px 20px',
        borderBottom: `1px solid ${colors.border.light}`,
        backgroundColor: colors.bg.white,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.bg.secondary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = colors.bg.white;
      }}
    >
      {/* Checkbox - Stop propagation to prevent card click */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex-shrink-0 mr-3"
      >
        <CheckboxV2
          checked={item.purchased}
          onChange={onToggle}
          size="md"
        />
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {/* Category Emoji */}
          <span className="text-[22px]" aria-hidden="true">
            {CATEGORY_ICONS[item.category]}
          </span>

          {/* Item Name */}
          <h4
            className={`font-medium ${item.purchased ? 'line-through' : ''}`}
            style={{
              fontSize: '17px',
              fontWeight: 500,
              color: item.purchased ? colors.text.tertiary : colors.text.primary,
            }}
          >
            {item.name}
          </h4>

          {/* Partner Badge */}
          {item.ownerName && !item.isOwnedByCurrentUser && (
            <BadgeV2
              text={item.ownerName}
              variant="success"
              size="sm"
            />
          )}
        </div>

        {/* Quantity, Store and Source */}
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="text-[15px]"
            style={{ color: colors.text.tertiary }}
          >
            {item.quantity} {item.unit}
          </span>

          {/* Store Badge */}
          {storeToShow && (
            <BadgeV2
              text={storeToShow.name}
              variant="accent"
              size="sm"
            />
          )}

          {/* Source Badge — shown for batch_cook and recipe items */}
          {item.sourceType && item.sourceType !== 'manual' && item.sourceName && (
            <span
              className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{
                backgroundColor: item.sourceType === 'batch_cook' || item.sourceType === 'recipe'
                  ? 'rgba(212, 165, 116, 0.18)'
                  : 'rgba(156, 163, 175, 0.15)',
                color: item.sourceType === 'batch_cook' || item.sourceType === 'recipe'
                  ? '#C18B5E'
                  : '#6B7280',
              }}
            >
              🍽 {item.sourceName}
            </span>
          )}

          {/* Price Badge */}
          {item.estimatedPrice && item.estimatedPrice > 0 && (
            <span
              className="text-[13px] font-semibold"
              style={{ color: colors.text.tertiary }}
            >
              ${item.estimatedPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight
        size={24}
        style={{
          color: colors.ios.lightGray,
          strokeWidth: 2.5,
          marginLeft: '12px',
        }}
        className="flex-shrink-0"
        aria-hidden="true"
      />
    </div>
  );
};

export default ShoppingItemCardV2;
