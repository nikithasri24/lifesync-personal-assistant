/**
 * Store Lists View Component
 * Displays distributed shopping lists by store
 */

import React from 'react';
import { Store as StoreIcon } from 'lucide-react';
import type { ShoppingList, Store } from '../../types';
import { StoreListCard } from '../stores/StoreListCard';

interface StoreListsViewProps {
  storeLists: ShoppingList[];
  stores: Store[];
}

export function StoreListsView({ storeLists, stores }: StoreListsViewProps): JSX.Element {
  if (storeLists.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-12">
          <StoreIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No store lists yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Use the Distribution tab to organize your items by store
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {storeLists.map(list => {
          const store = stores.find(s => s.id === list.storeId);
          if (!store) return null;

          return (
            <StoreListCard
              key={list.id}
              list={list}
              store={store}
            />
          );
        })}
      </div>
    </div>
  );
}
