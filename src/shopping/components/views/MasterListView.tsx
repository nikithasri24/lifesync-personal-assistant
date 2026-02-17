/**
 * Master List View Component
 * Displays and manages the master shopping list with iOS-style terracotta design
 * Supports both light and dark modes
 */

import React, { useState } from 'react';
import type { ShoppingItem, Store } from '../../types';
import { ShoppingItemCardV2 } from '../v2/ShoppingItemCardV2';
import { useThemeColors } from '../../../hooks/useThemeColors';

interface MasterListViewProps {
  items: ShoppingItem[];
  stores: Store[];
  onToggleItem: (itemId: string) => void;
  onEditItem: (item: ShoppingItem) => void;
  onRequestDeleteItem: (itemId: string) => void;
  onFindStores: (item: ShoppingItem) => void;
  onShowStorePrefs: () => void;
}

export function MasterListView({
  items,
  stores,
  onToggleItem,
  onEditItem,
  onRequestDeleteItem,
  onFindStores,
}: MasterListViewProps) {
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const colors = useThemeColors();

  // Get unique stores from items
  const itemStores = items
    .filter(item => item.bestStores && item.bestStores.length > 0)
    .map(item => {
      const storeId = item.bestStores?.[0];
      return stores.find(s => s.id === storeId);
    })
    .filter((store, index, self) =>
      store && self.findIndex(s => s?.id === store.id) === index
    ) as Store[];

  // Filter items by selected store
  const filteredItems = selectedStore === 'all'
    ? items
    : items.filter(item => {
        const itemStoreId = item.bestStores?.[0];
        return itemStoreId === selectedStore;
      });

  // Count items per store
  const itemCounts = {
    all: items.length,
    ...itemStores.reduce((acc, store) => {
      acc[store.id] = items.filter(item => item.bestStores?.[0] === store.id).length;
      return acc;
    }, {} as Record<string, number>),
  };

  // Count purchased vs unchecked
  const uncheckedCount = items.filter(item => !item.purchased).length;

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh', paddingBottom: '140px' }}>
      {/* Subtitle - Hidden on desktop (shown in header instead) */}
      <div className="px-6 pt-2 pb-4 lg:hidden">
        <p style={{ fontSize: '15px', color: colors.text.tertiary }}>
          {uncheckedCount} items • {itemStores.length} stores
        </p>
      </div>

      {/* Store Filter Chips */}
      <div className="px-6 pb-4 lg:px-0 lg:pb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {/* All chip */}
          <button
            onClick={() => setSelectedStore('all')}
            className="flex-shrink-0 px-4 py-2 rounded-full font-semibold transition-all duration-200"
            style={{
              fontSize: '14px',
              fontWeight: 600,
              padding: '8px 16px',
              borderRadius: '20px',
              border: selectedStore === 'all' ? 'none' : `2px solid ${colors.border.light}`,
              background: selectedStore === 'all'
                ? `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`
                : colors.bg.white,
              color: selectedStore === 'all' ? '#FFFFFF' : colors.text.primary,
            }}
          >
            All {itemCounts.all > 0 && `(${itemCounts.all})`}
          </button>

          {/* Store chips */}
          {itemStores.map(store => (
            <button
              key={store.id}
              onClick={() => setSelectedStore(store.id)}
              className="flex-shrink-0 px-4 py-2 rounded-full font-semibold transition-all duration-200"
              style={{
                fontSize: '14px',
                fontWeight: 600,
                padding: '8px 16px',
                borderRadius: '20px',
                border: selectedStore === store.id ? 'none' : `2px solid ${colors.border.light}`,
                background: selectedStore === store.id
                  ? `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`
                  : colors.bg.white,
                color: selectedStore === store.id ? '#FFFFFF' : colors.text.primary,
              }}
            >
              {store.emoji} {store.name} {itemCounts[store.id] > 0 && `(${itemCounts[store.id]})`}
            </button>
          ))}
        </div>
      </div>

      {/* List Container - Responsive margins and padding */}
      <div
        className="mx-5 mb-24 lg:mx-0 lg:mb-8 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: colors.bg.white,
          boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)',
        }}
      >
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <ShoppingItemCardV2
              key={item.id}
              item={item}
              stores={stores}
              onToggle={() => onToggleItem(item.id)}
              onEdit={() => onEditItem(item)}
            />
          ))
        ) : (
          <div className="text-center py-12" style={{ color: colors.text.tertiary }}>
            <p style={{ fontSize: '17px' }}>No items in this list</p>
          </div>
        )}
      </div>
    </div>
  );
}
