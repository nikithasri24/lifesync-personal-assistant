import React from 'react';
import { MapPin } from 'lucide-react';
import type { ShoppingList, Store } from '../../types';
import { CATEGORY_ICONS, STORE_TYPES } from '../../constants';

interface StoreListCardProps {
  list: ShoppingList;
  store: Store;
}

export function StoreListCard({ list, store }: StoreListCardProps) {
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b" style={{ backgroundColor: `${store.color}10` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{STORE_TYPES.find(t => t.value === store.type)?.icon ?? '🏪'}</span>
            <div>
              <h3 className="font-semibold text-gray-900">{store.name}</h3>
              <p className="text-sm text-gray-600">{list.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold" style={{ color: store.color }}>
              {list.items.length}
            </div>
            <div className="text-xs text-gray-500">items</div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {list.items.slice(0, 5).map(item => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span>{CATEGORY_ICONS[item.category]}</span>
                <span className="text-gray-900">{item.name}</span>
              </div>
              <span className="text-gray-500">{item.quantity} {item.unit}</span>
            </div>
          ))}
          {list.items.length > 5 && (
            <div className="text-xs text-gray-500 text-center pt-2">
              +{list.items.length - 5} more items
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <MapPin size={12} className="inline mr-1" />
            {store.distance} miles
          </div>
          <div className="text-sm font-semibold text-green-600">
            ${list.totalEstimatedCost?.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StoreListCard;
