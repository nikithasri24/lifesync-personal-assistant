/**
 * Store Shopping List Modal
 * Shows items assigned to a specific store with purchase tracking
 */

import React, { useEffect, useMemo } from 'react';
import { X, Package, DollarSign, CheckCircle, Circle } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { Store } from '../../types';
import type { ShoppingItem } from '../../types';

interface StoreShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: Store | null;
  shoppingItems: ShoppingItem[];
  onToggleItem: (itemId: string) => void;
}

export function StoreShoppingListModal({
  isOpen,
  onClose,
  store,
  shoppingItems,
  onToggleItem,
}: StoreShoppingListModalProps) {
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

  // Filter items for this store
  const storeItems = useMemo(() => {
    if (!store) return [];
    return shoppingItems.filter(
      item => !item.purchased && item.assignedStore === store.id
    );
  }, [store, shoppingItems]);

  const purchasedItems = useMemo(() => {
    if (!store) return [];
    return shoppingItems.filter(
      item => item.purchased && item.assignedStore === store.id
    );
  }, [store, shoppingItems]);

  // Calculate totals
  const totalEstimated = useMemo(() => {
    return storeItems.reduce((sum, item) => sum + (item.estimatedPrice ?? 0), 0);
  }, [storeItems]);

  const completedValue = useMemo(() => {
    return purchasedItems.reduce((sum, item) => sum + (item.price ?? item.estimatedPrice ?? 0), 0);
  }, [purchasedItems]);

  if (!isOpen || !store) return null;

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
          <div className="flex-1">
            <h2
              className="text-2xl font-bold"
              style={{ color: colors.text.primary }}
            >
              {store.name}
            </h2>
            <div className="flex gap-4 mt-2 text-sm" style={{ color: colors.text.secondary }}>
              <div className="flex items-center gap-1.5">
                <Package size={16} style={{ color: colors.accent.start }} />
                <span className="font-medium">{storeItems.length} items</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign size={16} style={{ color: colors.accent.start }} />
                <span className="font-medium">${totalEstimated.toFixed(2)} est.</span>
              </div>
            </div>
          </div>
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

        {/* Items List */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {storeItems.length === 0 && purchasedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>
                No Items Assigned
              </h3>
              <p className="text-sm text-center" style={{ color: colors.text.tertiary }}>
                Assign items to this store from your master list
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {/* Unpurchased Items */}
              {storeItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: colors.text.secondary }}>
                    To Buy ({storeItems.length})
                  </h3>
                  <div className="space-y-2">
                    {storeItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-xl transition-colors duration-200"
                        style={{
                          backgroundColor: colors.bg.primary,
                          border: `1px solid ${colors.border.light}`,
                        }}
                        onClick={() => onToggleItem(item.id)}
                      >
                        <button
                          type="button"
                          className="flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleItem(item.id);
                          }}
                          aria-label={`Mark ${item.name} as purchased`}
                        >
                          <Circle
                            size={24}
                            style={{ color: colors.accent.start }}
                            className="transition-transform duration-200 hover:scale-110"
                          />
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <h4
                              className="font-medium truncate"
                              style={{ color: colors.text.primary }}
                            >
                              {item.name}
                            </h4>
                            {item.quantity > 1 && (
                              <span
                                className="text-sm flex-shrink-0"
                                style={{ color: colors.text.tertiary }}
                              >
                                ×{item.quantity}
                              </span>
                            )}
                          </div>
                          {item.brand && (
                            <p className="text-xs truncate" style={{ color: colors.text.tertiary }}>
                              {item.brand}
                            </p>
                          )}
                        </div>

                        {item.estimatedPrice && (
                          <div
                            className="text-sm font-semibold flex-shrink-0"
                            style={{ color: colors.text.secondary }}
                          >
                            ${item.estimatedPrice.toFixed(2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Purchased Items */}
              {purchasedItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: colors.text.secondary }}>
                    Purchased ({purchasedItems.length}) • ${completedValue.toFixed(2)}
                  </h3>
                  <div className="space-y-2">
                    {purchasedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-xl transition-colors duration-200 opacity-60"
                        style={{
                          backgroundColor: colors.bg.primary,
                          border: `1px solid ${colors.border.light}`,
                        }}
                        onClick={() => onToggleItem(item.id)}
                      >
                        <button
                          type="button"
                          className="flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleItem(item.id);
                          }}
                          aria-label={`Unmark ${item.name} as purchased`}
                        >
                          <CheckCircle
                            size={24}
                            style={{ color: colors.accent.start }}
                            className="transition-transform duration-200 hover:scale-110"
                          />
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <h4
                              className="font-medium truncate line-through"
                              style={{ color: colors.text.primary }}
                            >
                              {item.name}
                            </h4>
                            {item.quantity > 1 && (
                              <span
                                className="text-sm flex-shrink-0"
                                style={{ color: colors.text.tertiary }}
                              >
                                ×{item.quantity}
                              </span>
                            )}
                          </div>
                        </div>

                        {(item.price ?? item.estimatedPrice) && (
                          <div
                            className="text-sm font-semibold flex-shrink-0"
                            style={{ color: colors.text.secondary }}
                          >
                            ${(item.price ?? item.estimatedPrice ?? 0).toFixed(2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
