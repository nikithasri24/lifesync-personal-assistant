/**
 * Store Suggestions Modal Component
 * Shows nearby stores for a shopping item with location-based suggestions
 * Terracotta themed with bottom sheet style
 */

import React, { useEffect } from 'react';
import { X, MapPin, Navigation, Store, DollarSign, Star } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
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
  const colors = useThemeColors();

  // Keyboard navigation for Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full lg:max-w-2xl bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden"
        style={{
          maxHeight: '90vh',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Drag Handle (mobile only) */}
        <div className="lg:hidden pt-2">
          <div
            className="w-9 h-1 rounded-full mx-auto"
            style={{ backgroundColor: colors.border.medium }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: colors.border.light }}
        >
          <h2
            className="text-2xl font-bold"
            style={{ color: colors.text.primary }}
          >
            Store Suggestions
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg transition-colors duration-200"
            style={{
              backgroundColor: colors.badge.bg,
              color: colors.text.secondary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.badge.bg;
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-5" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Item Card */}
          <div
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{
              backgroundColor: colors.bg.primary,
              border: `1px solid ${colors.border.light}`,
            }}
          >
            <span className="text-2xl">{CATEGORY_ICONS[item.category]}</span>
            <div className="flex-1">
              <h4 className="font-semibold" style={{ color: colors.text.primary }}>
                {item.name}
              </h4>
              <p className="text-sm" style={{ color: colors.text.tertiary }}>
                {item.quantity} {item.unit} • {item.category}
              </p>
            </div>
          </div>

          {!userLocation ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(193, 139, 94, 0.15) 100%)`,
                  }}
                >
                  <MapPin size={32} style={{ color: colors.accent.start }} />
                </div>
              </div>
              <h4 className="font-semibold text-lg mb-2" style={{ color: colors.text.primary }}>
                Enable Location
              </h4>
              <p className="text-sm mb-6" style={{ color: colors.text.secondary }}>
                Allow location access to find nearby stores for this item
              </p>
              <button
                type="button"
                onClick={onGetLocation}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98] mx-auto"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                  color: 'white',
                }}
                aria-label="Get my location"
              >
                <Navigation size={20} />
                Get My Location
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h4
                className="font-semibold flex items-center gap-2"
                style={{ color: colors.text.primary }}
              >
                <Store size={18} />
                Nearby Stores
              </h4>

              {nearbyStores.map(store => {
                const storeType = STORE_TYPES.find(st => st.value === store.type);
                return (
                  <div
                    key={store.id}
                    className="rounded-2xl p-5"
                    style={{
                      backgroundColor: colors.bg.white,
                      boxShadow: '0 2px 8px rgba(139, 111, 71, 0.06)',
                    }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">{storeType?.icon}</span>
                      <div className="flex-1">
                        <h5 className="font-semibold" style={{ color: colors.text.primary }}>
                          {store.name}
                        </h5>
                        <p className="text-sm mt-1" style={{ color: colors.text.tertiary }}>
                          {store.address}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-4 mt-2 text-sm" style={{ color: colors.text.secondary }}>
                          <span className="flex items-center gap-1">
                            <Navigation size={14} style={{ color: colors.accent.start }} />
                            {store.distance?.toFixed(1)} mi
                          </span>

                          {store.avgPrices?.[item.name] && (
                            <span className="flex items-center gap-1 font-medium" style={{ color: '#15803D' }}>
                              <DollarSign size={14} />
                              {store.avgPrices[item.name].toFixed(2)}
                            </span>
                          )}

                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={i < (store.preferences?.overallRating ?? 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 mt-3">
                          {store.hasDelivery && (
                            <span
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                color: '#2563EB',
                              }}
                            >
                              Delivery{store.deliveryFee ? ` • $${store.deliveryFee}` : ''}
                            </span>
                          )}
                          {store.hasPickup && (
                            <span
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                color: '#16A34A',
                              }}
                            >
                              Pickup
                            </span>
                          )}
                          {store.favorite && (
                            <span
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                color: '#DC2626',
                              }}
                            >
                              Favorite
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          onAssignStore(store.id);
                          onClose();
                        }}
                        className="flex-1 py-3 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98]"
                        style={{
                          background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                          color: 'white',
                        }}
                        aria-label={`Assign ${store.name}`}
                      >
                        Assign Store
                      </button>

                      {store.phone && (
                        <a
                          href={`tel:${store.phone}`}
                          className="py-3 px-6 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98]"
                          style={{
                            backgroundColor: colors.bg.white,
                            border: `2px solid ${colors.border.medium}`,
                            color: colors.text.secondary,
                          }}
                        >
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}

              {nearbyStores.length === 0 && (
                <div className="text-center py-8">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{
                      background: `linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(193, 139, 94, 0.15) 100%)`,
                    }}
                  >
                    <Store size={32} style={{ color: colors.accent.start }} />
                  </div>
                  <p className="text-sm" style={{ color: colors.text.tertiary }}>
                    No nearby stores found for this item
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
