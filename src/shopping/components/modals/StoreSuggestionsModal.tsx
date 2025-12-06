import React from 'react';
import { X, MapPin, Navigation, Store, DollarSign, Star } from 'lucide-react';
import { CATEGORY_ICONS, STORE_TYPES } from '../../constants';
import type { ShoppingItem, Store as StoreType } from '../../types';
import type { Coordinates } from '../../services/locationService';

interface StoreSuggestionsModalProps {
  isOpen: boolean;
  item: ShoppingItem | null;
  userLocation: Coordinates | null;
  nearbyStores: StoreType[];
  onClose: () => void;
  onGetLocation: () => void;
  onAssignStore: (storeId: string) => void;
}

export function StoreSuggestionsModal({
  isOpen,
  item,
  userLocation,
  nearbyStores,
  onClose,
  onGetLocation,
  onAssignStore
}: StoreSuggestionsModalProps): React.ReactNode {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Store Suggestions</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-lg">{CATEGORY_ICONS[item.category]}</span>
            <div>
              <h4 className="font-medium text-gray-900">{item.name}</h4>
              <p className="text-sm text-gray-600">
                {item.quantity} {item.unit} • {item.category}
              </p>
            </div>
          </div>

          {!userLocation && (
            <div className="text-center py-6">
              <div className="flex items-center justify-center mb-3">
                <MapPin className="h-12 w-12 text-gray-400" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Enable Location</h4>
              <p className="text-sm text-gray-600 mb-4">
                Allow location access to find nearby stores for this item
              </p>
              <button
                onClick={onGetLocation}
                className="btn-primary flex items-center space-x-2 mx-auto"
              >
                <Navigation size={16} />
                <span>Get My Location</span>
              </button>
            </div>
          )}

          {userLocation && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                <Store size={16} />
                <span>Nearby Stores</span>
              </h4>

              {nearbyStores.map(store => (
                <div key={store.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-xl">{STORE_TYPES[store.type]}</span>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{store.name}</h5>
                        <p className="text-sm text-gray-600">{store.address}</p>

                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Navigation size={12} />
                            <span>{(store.actualDistance ?? store.distance)?.toFixed(1)} mi</span>
                          </span>

                          {store.avgPrices?.[item.name] && (
                            <span className="flex items-center space-x-1 text-green-600 font-medium">
                              <DollarSign size={12} />
                              <span>{store.avgPrices[item.name].toFixed(2)}</span>
                            </span>
                          )}

                          <div className="flex items-center space-x-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={10}
                                className={i < (store.preferences?.overallRating ?? 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 mt-2">
                          {store.hasDelivery && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <span className="mr-1">Delivery</span>
                              {store.deliveryFee && <span className="ml-1">${store.deliveryFee}</span>}
                            </span>
                          )}
                          {store.hasPickup && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <span>Pickup</span>
                            </span>
                          )}
                          {store.favorite && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <span>Favorite</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => {
                          onAssignStore(store.id);
                          onClose();
                        }}
                        className="text-xs btn-primary px-3 py-1"
                      >
                        Assign Store
                      </button>

                      {store.phone && (
                        <a
                          href={`tel:${store.phone}`}
                          className="text-xs btn-secondary px-3 py-1 text-center"
                        >
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {nearbyStores.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Store className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No nearby stores found for this item</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
