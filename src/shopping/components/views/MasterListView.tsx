/**
 * Master List View Component
 * Displays and manages the master shopping list
 */

import React, { useState } from 'react';
import { Search, Settings } from 'lucide-react';
import type { ShoppingItem, Store } from '../../types';
import { MasterItemCard } from '../items/MasterItemCard';

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
  onShowStorePrefs,
}: MasterListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter(item =>
    searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search master list..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={onShowStorePrefs}
          className="btn-secondary flex items-center space-x-2"
        >
          <Settings size={16} />
          <span>Store Preferences</span>
        </button>
      </div>

      <div className="space-y-2">
        {filteredItems.map(item => (
          <MasterItemCard
            key={item.id}
            item={item}
            stores={stores}
            onToggle={() => onToggleItem(item.id)}
            onEdit={() => onEditItem(item)}
            onRequestDelete={() => onRequestDeleteItem(item.id)}
            onFindStores={() => onFindStores(item)}
          />
        ))}
      </div>
    </div>
  );
}
