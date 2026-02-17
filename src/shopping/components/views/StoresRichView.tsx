import React from 'react';
import { MapPin, Package, DollarSign, Plus, TrendingUp } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { Store } from '../../types';
import { startOfMonth } from 'date-fns';

interface StoresRichViewProps {
  stores: Store[];
  shoppingItems: any[];
  onViewStoreList: (store: Store) => void;
  onAddStore?: () => void;
}

// Store emoji mapping
const STORE_EMOJI_MAP: Record<string, string> = {
  costco: '🏪',
  'trader joe': '🌴',
  'trader joes': '🌴',
  'whole foods': '🛒',
  walmart: '🏬',
  target: '🎯',
  safeway: '🛒',
  kroger: '🛒',
  publix: '🛒',
  aldi: '🛒',
  sprouts: '🌱',
  'farmers market': '🧺',
  default: '🏪',
};

function getStoreEmoji(storeName: string): string {
  const lowerName = storeName.toLowerCase();

  for (const [key, emoji] of Object.entries(STORE_EMOJI_MAP)) {
    if (lowerName.includes(key)) {
      return emoji;
    }
  }

  return STORE_EMOJI_MAP.default;
}

function getStoreStats(store: Store, shoppingItems: any[]) {
  // Count items assigned to this store
  const itemCount = shoppingItems.filter(
    item => !item.purchased && item.assignedStore === store.id
  ).length;

  // Calculate estimated total
  const estimatedTotal = shoppingItems
    .filter(item => !item.purchased && item.assignedStore === store.id)
    .reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);

  // Calculate spending this month (purchased items)
  const monthStart = startOfMonth(new Date());
  const monthlySpent = shoppingItems
    .filter(item =>
      item.purchased &&
      item.assignedStore === store.id &&
      item.purchasedAt &&
      new Date(item.purchasedAt) >= monthStart
    )
    .reduce((sum, item) => sum + (item.price || item.estimatedPrice || 0), 0);

  // Calculate budget status
  const monthlyBudget = store.monthlyBudget || 0;
  const budgetRemaining = monthlyBudget - monthlySpent;
  const budgetPercentUsed = monthlyBudget > 0 ? (monthlySpent / monthlyBudget) * 100 : 0;

  // Mock distance (in real app, would use geolocation)
  const distance = store.address ? '2.3 mi' : 'N/A';

  return {
    itemCount,
    estimatedTotal,
    distance,
    monthlySpent,
    budgetRemaining,
    budgetPercentUsed,
    hasBudget: monthlyBudget > 0,
  };
}

export function StoresRichView({
  stores,
  shoppingItems,
  onViewStoreList,
  onAddStore,
}: StoresRichViewProps) {
  const colors = useThemeColors();

  if (stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="text-6xl mb-4">🏪</div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>
          No Stores Added Yet
        </h3>
        <p className="text-sm text-center mb-6" style={{ color: colors.text.tertiary }}>
          Add your favorite grocery stores to organize your shopping
        </p>
        {onAddStore && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Add Store button (empty state) clicked!');
              onAddStore();
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-transform duration-200 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
              color: 'white',
              cursor: 'pointer',
              zIndex: 50,
            }}
            aria-label="Add your first store"
          >
            <Plus size={20} />
            Add Store
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="px-5 py-4" style={{ paddingBottom: '140px' }}>
      {/* Store Cards */}
      <div className="space-y-3">
        {stores.map((store) => {
          const stats = getStoreStats(store, shoppingItems);
          const emoji = getStoreEmoji(store.name);

          // Determine budget status color
          let budgetColor = colors.text.secondary;
          if (stats.hasBudget) {
            if (stats.budgetPercentUsed >= 100) budgetColor = '#EF4444'; // Red - over budget
            else if (stats.budgetPercentUsed >= 80) budgetColor = '#F59E0B'; // Orange - approaching
            else budgetColor = '#10B981'; // Green - good
          }

          return (
            <div
              key={store.id}
              className="rounded-2xl p-5"
              style={{
                backgroundColor: colors.bg.white,
                boxShadow: '0 2px 8px rgba(139, 111, 71, 0.06)',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                {/* Store Icon */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(193, 139, 94, 0.15) 100%)`,
                  }}
                >
                  {emoji}
                </div>

                {/* Store Name */}
                <div className="flex-1">
                  <h3
                    className="text-lg font-semibold leading-tight"
                    style={{ color: colors.text.primary }}
                  >
                    {store.name}
                  </h3>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-4 mb-3 text-sm" style={{ color: colors.text.secondary }}>
                <div className="flex items-center gap-1.5">
                  <Package size={16} style={{ color: colors.accent.start }} />
                  <span className="font-medium">{stats.itemCount} items</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <MapPin size={16} style={{ color: colors.accent.start }} />
                  <span className="font-medium">{stats.distance}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <DollarSign size={16} style={{ color: colors.accent.start }} />
                  <span className="font-medium">${stats.estimatedTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Budget Display */}
              {stats.hasBudget && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={14} style={{ color: budgetColor }} />
                      <span className="text-xs font-medium" style={{ color: colors.text.tertiary }}>
                        Monthly Budget
                      </span>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: budgetColor }}>
                      ${stats.monthlySpent.toFixed(2)} / ${store.monthlyBudget?.toFixed(2)}
                    </span>
                  </div>
                  {/* Budget Progress Bar */}
                  <div
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: colors.bg.secondary }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(stats.budgetPercentUsed, 100)}%`,
                        backgroundColor: budgetColor,
                      }}
                    />
                  </div>
                  {stats.budgetPercentUsed >= 100 && (
                    <p className="text-xs mt-1" style={{ color: '#EF4444' }}>
                      ⚠️ Over budget by ${(-stats.budgetRemaining).toFixed(2)}
                    </p>
                  )}
                  {stats.budgetPercentUsed >= 80 && stats.budgetPercentUsed < 100 && (
                    <p className="text-xs mt-1" style={{ color: '#F59E0B' }}>
                      ${stats.budgetRemaining.toFixed(2)} remaining
                    </p>
                  )}
                </div>
              )}

              {/* View Button */}
              <button
                type="button"
                onClick={() => onViewStoreList(store)}
                className="w-full py-3 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                  color: 'white',
                }}
                aria-label={`View shopping list for ${store.name}`}
              >
                View Shopping List
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Store Button at Bottom */}
      {onAddStore && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Add Store button clicked!');
            onAddStore();
          }}
          className="w-full flex items-center justify-center gap-2 py-3 mt-4 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98]"
          style={{
            backgroundColor: colors.bg.white,
            border: `2px solid ${colors.accent.start}`,
            color: colors.accent.start,
            position: 'relative',
            zIndex: 10,
            cursor: 'pointer',
          }}
          aria-label="Add new store"
        >
          <Plus size={20} />
          Add Store
        </button>
      )}
    </div>
  );
}
