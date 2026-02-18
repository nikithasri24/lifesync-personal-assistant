/**
 * CategoryCardV2 Component
 * Category card with icon, name, item count, add button, and items list
 * Matches selfcare-design-spec.html exactly
 */

import React from 'react';

interface CategoryItem {
  id: string;
  name: string;
  isActive: boolean;
  frequency?: string; // e.g., "Weekly", "Monthly", "Every 3 months"
}

interface CategoryCardV2Props {
  id: string;
  name: string;
  icon: string; // Emoji
  color?: string;
  items: CategoryItem[];
  onAddItem: () => void;
  onToggleItem: (itemId: string, currentActive: boolean) => void;
  onEditItem: (itemId: string) => void;
}

export const CategoryCardV2: React.FC<CategoryCardV2Props> = ({
  id,
  name,
  icon,
  color = '#D4A574',
  items,
  onAddItem,
  onToggleItem,
  onEditItem,
}) => {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '16px',
        marginBottom: '16px',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
      }}
    >
      {/* Category Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.1) 0%, rgba(193, 139, 94, 0.1) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>{icon}</span>
          <div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#5C4A3A',
              }}
            >
              {name}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#9B8B7A',
              }}
            >
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </div>
          </div>
        </div>
        <button
          onClick={onAddItem}
          className="transition-all hover:opacity-80"
          style={{
            padding: '6px 12px',
            background: 'rgba(212, 165, 116, 0.3)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            color: '#C18B5E',
            cursor: 'pointer',
          }}
        >
          + Add
        </button>
      </div>

      {/* Category Items */}
      {items.length > 0 && (
        <div style={{ borderTop: '1px solid #E8DCC8' }}>
          {items.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: index === items.length - 1 ? 'none' : '1px solid #E8DCC8',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={item.isActive}
                  onChange={() => onToggleItem(item.id, item.isActive)}
                  className="cursor-pointer"
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#C18B5E',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: item.isActive ? '#5C4A3A' : '#9B8B7A',
                      textDecoration: item.isActive ? 'none' : 'line-through',
                    }}
                  >
                    {item.name}
                  </div>
                  {item.frequency && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#9B8B7A',
                        marginTop: '2px',
                      }}
                    >
                      {item.frequency}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => onEditItem(item.id)}
                className="transition-all hover:bg-gray-100"
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6B5847',
                  cursor: 'pointer',
                }}
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
