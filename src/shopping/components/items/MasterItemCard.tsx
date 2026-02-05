import React from 'react';
import { Check, DollarSign, Scan, Heart, Store as StoreIcon, AlertCircle, Navigation, Edit3, Trash2 } from 'lucide-react';
import type { ShoppingItem, Store } from '../../types';
import { CATEGORY_ICONS } from '../../constants';
import { CompactOwnerBadge } from '../../../components/common/OwnerBadge';

interface MasterItemCardProps {
  item: ShoppingItem & {
    ownerId?: string;
    ownerName?: string;
    isOwnedByCurrentUser?: boolean;
  };
  stores: Store[];
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onFindStores: () => void;
}

export const MasterItemCard = React.memo<MasterItemCardProps>(function MasterItemCard({
  item,
  stores,
  onToggle,
  onEdit,
  onDelete,
  onFindStores
}) {
  const bestStore: Store | null = item.bestStores && item.bestStores.length > 0
    ? (stores.find((s): s is Store => s.id === item.bestStores?.[0]) ?? null)
    : null;

  return (
    <div className={`
      bg-white border border-l-4 rounded-lg p-4 transition-all duration-200 hover:shadow-md
      ${item.priority === 'high' ? 'border-l-red-400' :
        item.priority === 'medium' ? 'border-l-yellow-400' : 'border-l-gray-300'}
      ${item.purchased ? 'opacity-60 bg-gray-50' : ''}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <button
            onClick={onToggle}
            className={`
              flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
              ${item.purchased
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-green-400'
              }
            `}
          >
            {item.purchased && <Check size={14} />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className={`font-medium ${item.purchased ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {item.name}
              </h4>
              <span className="text-lg">{CATEGORY_ICONS[item.category]}</span>
              {item.ownerName && (
                <CompactOwnerBadge
                  ownerName={item.ownerName}
                  isOwnedByCurrentUser={item.isOwnedByCurrentUser ?? true}
                />
              )}
              {item.nutritionInfo?.organic && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  🌱 Organic
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
              <span>{item.quantity} {item.unit}</span>
              {item.estimatedPrice && (
                <span className="flex items-center font-medium text-green-600">
                  <DollarSign size={12} />
                  {item.estimatedPrice.toFixed(2)}
                </span>
              )}
              {item.barcode && (
                <span className="flex items-center text-gray-500">
                  <Scan size={12} className="mr-1" />
                  {item.barcode.slice(-4)}
                </span>
              )}
              {bestStore && (
                <span className={`flex items-center ${item.assignedStore ? 'text-purple-600' : 'text-blue-600'}`}>
                  {item.assignedStore ? (
                    <>
                      <Heart size={12} className="mr-1" />
                      Preferred: {bestStore?.name ?? 'Unknown Store'}
                    </>
                  ) : (
                    <>
                      <StoreIcon size={12} className="mr-1" />
                      AI Rec: {bestStore?.name ?? 'Unknown Store'}
                    </>
                  )}
                </span>
              )}
            </div>

            {item.notes && (
              <p className="mt-1 text-sm text-gray-600">{item.notes}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {item.priority === 'high' && (
            <AlertCircle size={16} className="text-red-500" />
          )}
          <button
            onClick={onFindStores}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
            title="Find nearby stores"
          >
            <Navigation size={16} />
          </button>
          {/* Only show edit/delete for items owned by current user */}
          {(item.isOwnedByCurrentUser ?? true) && (
            <>
              <button
                onClick={onEdit}
                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                title="Edit item"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={onDelete}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Delete item"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
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
    prevProps.item.priority === nextProps.item.priority &&
    prevProps.item.estimatedPrice === nextProps.item.estimatedPrice &&
    prevProps.item.ownerName === nextProps.item.ownerName &&
    prevProps.item.isOwnedByCurrentUser === nextProps.item.isOwnedByCurrentUser &&
    prevProps.item.nutritionInfo?.organic === nextProps.item.nutritionInfo?.organic &&
    prevProps.item.bestStores?.length === nextProps.item.bestStores?.length &&
    prevProps.stores.length === nextProps.stores.length
  );
});

export default MasterItemCard;
