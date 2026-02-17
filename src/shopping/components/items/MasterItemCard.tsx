import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import type { ShoppingItem, Store } from '../../types';
import { CATEGORY_ICONS } from '../../constants';
import { useThemeColors } from '../../../hooks/useThemeColors';

interface MasterItemCardProps {
  item: ShoppingItem & {
    ownerId?: string;
    ownerName?: string;
    isOwnedByCurrentUser?: boolean;
  };
  stores: Store[];
  onToggle: () => void;
  onEdit: () => void;
  onRequestDelete: () => void;
  onFindStores: () => void;
}

export const MasterItemCard = React.memo<MasterItemCardProps>(function MasterItemCard({
  item,
  stores,
  onToggle,
  onEdit,
}) {
  const colors = useThemeColors();

  // Show assigned store first, then fall back to best stores
  const storeToShow: Store | null = item.assignedStore
    ? (stores.find((s): s is Store => s.id === item.assignedStore) ?? null)
    : item.bestStores && item.bestStores.length > 0
    ? (stores.find((s): s is Store => s.id === item.bestStores?.[0]) ?? null)
    : null;

  const handleCardClick = () => {
    onEdit();
  };

  return (
    <div
      onClick={handleCardClick}
      className="flex items-center transition-colors cursor-pointer hover:bg-opacity-50"
      style={{
        minHeight: '72px', // 72px on mobile, naturally flows on desktop
        padding: '16px 20px',
        borderBottom: `1px solid ${colors.bg.secondary}`,
        backgroundColor: colors.bg.white,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.bg.secondary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = colors.bg.white;
      }}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-200"
        style={{
          width: '32px',
          height: '32px',
          border: item.purchased ? 'none' : `2.5px solid ${colors.border.medium}`,
          background: item.purchased
            ? `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`
            : 'transparent',
          marginRight: '16px',
        }}
        aria-label={item.purchased ? 'Mark as not purchased' : 'Mark as purchased'}
      >
        {item.purchased && (
          <Check
            size={18}
            style={{
              color: '#FFFFFF',
              strokeWidth: 3,
            }}
            aria-hidden="true"
          />
        )}
      </button>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Emoji */}
          <span style={{ fontSize: '22px' }} aria-hidden="true">
            {CATEGORY_ICONS[item.category]}
          </span>

          {/* Name */}
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
            <span
              className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold"
              style={{
                backgroundColor: '#E8F5E9',
                color: '#34C759',
                fontSize: '12px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '12px',
              }}
            >
              {item.ownerName}
            </span>
          )}
        </div>

        {/* Quantity and Store */}
        <div className="flex items-center gap-3 mt-1">
          {/* Quantity */}
          <span
            style={{
              fontSize: '15px',
              color: colors.text.tertiary,
            }}
          >
            {item.quantity} {item.unit}
          </span>

          {/* Store Badge */}
          {storeToShow && (
            <span
              className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold"
              style={{
                backgroundColor: colors.badge.bg,
                color: colors.badge.text,
                fontSize: '12px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '12px',
              }}
            >
              {storeToShow.name}
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
        aria-hidden="true"
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom equality check - only re-render if these specific props change
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.category === nextProps.item.category &&
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.item.unit === nextProps.item.unit &&
    prevProps.item.purchased === nextProps.item.purchased &&
    prevProps.item.assignedStore === nextProps.item.assignedStore &&
    prevProps.item.ownerName === nextProps.item.ownerName &&
    prevProps.item.isOwnedByCurrentUser === nextProps.item.isOwnedByCurrentUser &&
    prevProps.item.bestStores?.length === nextProps.item.bestStores?.length &&
    prevProps.stores.length === nextProps.stores.length
  );
});

export default MasterItemCard;
