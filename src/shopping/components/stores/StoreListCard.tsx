import React from 'react';
import { MapPin } from 'lucide-react';
import type { ShoppingList, Store } from '../../types';
import { CATEGORY_ICONS, STORE_TYPES } from '../../constants';
import { CompactOwnerBadge } from '../../../components/common/OwnerBadge';

interface StoreListCardProps {
  list: ShoppingList;
  store: Store;
}

export const StoreListCard = React.memo<StoreListCardProps>(function StoreListCard({ list, store }: StoreListCardProps) {
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
          {list.items.slice(0, 5).map(item => {
            const itemWithOwner = item as typeof item & {
              ownerId?: string;
              ownerName?: string;
              isOwnedByCurrentUser?: boolean;
            };
            return (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span>{CATEGORY_ICONS[item.category]}</span>
                  <span className="text-gray-900">{item.name}</span>
                  {itemWithOwner.ownerName && (
                    <CompactOwnerBadge
                      ownerName={itemWithOwner.ownerName}
                      isOwnedByCurrentUser={itemWithOwner.isOwnedByCurrentUser ?? true}
                    />
                  )}
                </div>
                <span className="text-gray-500">{item.quantity} {item.unit}</span>
              </div>
            );
          })}
          {list.items.length > 5 && (
            <div className="text-xs text-gray-500 text-center pt-2">
              +{list.items.length - 5} more items
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <MapPin size={12} className="inline mr-1" />
            {store.distance != null ? `${store.distance} miles` : 'Distance unknown'}
          </div>
          <div className="text-sm font-semibold text-green-600">
            ${list.totalEstimatedCost?.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom equality check - only re-render if these specific props change
  return (
    prevProps.list.id === nextProps.list.id &&
    prevProps.list.description === nextProps.list.description &&
    prevProps.list.items.length === nextProps.list.items.length &&
    prevProps.list.totalEstimatedCost === nextProps.list.totalEstimatedCost &&
    prevProps.store.id === nextProps.store.id &&
    prevProps.store.name === nextProps.store.name &&
    prevProps.store.type === nextProps.store.type &&
    prevProps.store.color === nextProps.store.color &&
    prevProps.store.distance === nextProps.store.distance
  );
});

export default StoreListCard;
