/**
 * Master List View Component
 * Displays and manages the master shopping list with iOS-style terracotta design
 * Supports both light and dark modes
 */

import React, { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import type { ShoppingItem, Store } from '../../types';
import { ShoppingItemCardV2 } from '../v2/ShoppingItemCardV2';
import { useThemeColors } from '../../../hooks/useThemeColors';

interface MasterListViewProps {
  items: ShoppingItem[];
  stores: Store[];
  onToggleItem: (itemId: string) => void;
  onEditItem: (item: ShoppingItem) => void;
  onRequestDeleteItem: (itemId: string) => void;
  onBulkDelete: (itemIds: string[]) => void;
  onFindStores: (item: ShoppingItem) => void;
  onShowStorePrefs: () => void;
}

export function MasterListView({
  items,
  stores,
  onToggleItem,
  onEditItem,
  onRequestDeleteItem,
  onBulkDelete,
}: MasterListViewProps) {
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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

  const uncheckedCount = items.filter(item => !item.purchased).length;
  const completedCount = items.filter(item => item.purchased).length;

  const toggleSelect = (id: string): void => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every(i => selectedIds.has(i.id));
  const toggleSelectAll = (): void => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const handleBulkDone = (): void => {
    selectedIds.forEach(id => {
      const item = items.find(i => i.id === id);
      if (item && !item.purchased) onToggleItem(id);
    });
    setSelectedIds(new Set());
  };

  const handleBulkDelete = (): void => {
    onBulkDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleClearCompleted = (): void => {
    items.filter(i => i.purchased).forEach(i => onRequestDeleteItem(i.id));
  };

  const isSelectMode = selectedIds.size > 0;

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh', paddingBottom: isSelectMode ? '160px' : '140px' }}>
      {/* Subtitle row with Clear completed shortcut */}
      <div className="px-6 pt-2 pb-3 lg:hidden flex items-center justify-between">
        <p style={{ fontSize: '15px', color: colors.text.tertiary }}>
          {uncheckedCount} items • {itemStores.length} stores
        </p>
        {completedCount > 0 && (
          <button
            type="button"
            onClick={handleClearCompleted}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.08)' }}
          >
            Clear done ({completedCount})
          </button>
        )}
      </div>

      {/* Store Filter Chips + Select all */}
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

          {/* Select all pill — pushed to right */}
          {filteredItems.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex-shrink-0 ml-auto px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                border: `1.5px solid ${colors.border.light}`,
                backgroundColor: allFilteredSelected ? 'rgba(193,139,94,0.12)' : colors.bg.white,
                color: allFilteredSelected ? '#C18B5E' : colors.text.secondary,
              }}
            >
              {allFilteredSelected ? 'Deselect all' : 'Select all'}
            </button>
          )}
        </div>
      </div>

      {/* List Container */}
      <div
        className="mx-5 mb-24 lg:mx-0 lg:mb-8 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: colors.bg.white,
          boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)',
        }}
      >
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <div key={item.id} className="flex items-center">
                {/* Selection checkbox — only visible in select mode or on hover */}
                <button
                  type="button"
                  onClick={() => toggleSelect(item.id)}
                  className="flex-shrink-0 ml-4 transition-all"
                  aria-label={isSelected ? `Deselect ${item.name}` : `Select ${item.name}`}
                  style={{ opacity: isSelectMode ? 1 : 0.3 }}
                >
                  <div
                    className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                    style={{
                      borderColor: isSelected ? '#C18B5E' : colors.border.medium,
                      backgroundColor: isSelected ? '#C18B5E' : 'transparent',
                    }}
                  >
                    {isSelected && <Check size={11} color="white" strokeWidth={3} />}
                  </div>
                </button>
                <div className="flex-1 min-w-0">
                  <ShoppingItemCardV2
                    item={item}
                    stores={stores}
                    onToggle={() => onToggleItem(item.id)}
                    onEdit={() => onEditItem(item)}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12" style={{ color: colors.text.tertiary }}>
            <p style={{ fontSize: '17px' }}>No items in this list</p>
          </div>
        )}
      </div>

      {/* Bulk action bar — appears when items are selected */}
      {isSelectMode && (
        <div
          className="fixed bottom-0 left-0 right-0 border-t px-4 py-4 flex items-center gap-3"
          style={{
            backgroundColor: colors.bg.white,
            borderColor: colors.border.light,
            paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <span className="text-sm font-semibold flex-shrink-0" style={{ color: colors.text.secondary }}>
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2 flex-1 justify-end">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: colors.bg.primary, color: colors.text.secondary }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBulkDone}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
              aria-label="Mark selected as done"
            >
              <Check size={15} strokeWidth={2.5} />
              Mark done
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#EF4444' }}
              aria-label="Delete selected items"
            >
              <Trash2 size={15} strokeWidth={2} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
