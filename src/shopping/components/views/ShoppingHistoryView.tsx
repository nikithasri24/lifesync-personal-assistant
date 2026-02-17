/**
 * Shopping History View
 * Shows purchased items grouped by date with spending analytics
 */

import React, { useMemo, useState } from 'react';
import { Calendar, TrendingUp, DollarSign, Package, Receipt } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { ShoppingItem } from '../../types';
import { format, parseISO, startOfDay, subDays, isAfter } from 'date-fns';

interface ShoppingHistoryViewProps {
  items: ShoppingItem[];
  onScanReceipt?: () => void;
}

interface PurchaseGroup {
  date: string;
  items: ShoppingItem[];
  totalSpent: number;
  itemCount: number;
}

export function ShoppingHistoryView({ items, onScanReceipt }: ShoppingHistoryViewProps) {
  const colors = useThemeColors();
  const [daysFilter, setDaysFilter] = useState(30);

  // Group purchased items by date
  const purchaseHistory = useMemo(() => {
    const cutoffDate = subDays(new Date(), daysFilter);

    const purchasedItems = items.filter(item =>
      item.purchased &&
      item.purchasedAt &&
      isAfter(new Date(item.purchasedAt), cutoffDate)
    );

    const grouped = purchasedItems.reduce((acc, item) => {
      if (!item.purchasedAt) return acc;

      const dateKey = format(startOfDay(new Date(item.purchasedAt)), 'yyyy-MM-dd');

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          items: [],
          totalSpent: 0,
          itemCount: 0,
        };
      }

      acc[dateKey].items.push(item);
      acc[dateKey].totalSpent += item.price ?? item.estimatedPrice ?? 0;
      acc[dateKey].itemCount += 1;

      return acc;
    }, {} as Record<string, PurchaseGroup>);

    // Convert to array and sort by date (newest first)
    return Object.values(grouped).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [items, daysFilter]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalSpent = purchaseHistory.reduce((sum, group) => sum + group.totalSpent, 0);
    const totalItems = purchaseHistory.reduce((sum, group) => sum + group.itemCount, 0);
    const avgPerTrip = purchaseHistory.length > 0 ? totalSpent / purchaseHistory.length : 0;

    return { totalSpent, totalItems, avgPerTrip, trips: purchaseHistory.length };
  }, [purchaseHistory]);

  return (
    <div style={{ paddingBottom: '140px' }}>
      {/* Header */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            Shopping History
          </h2>

          {/* Scan Receipt Button */}
          {onScanReceipt && (
            <button
              type="button"
              onClick={onScanReceipt}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                color: 'white',
                boxShadow: '0 2px 8px rgba(212, 165, 116, 0.25)',
              }}
              aria-label="Scan receipt"
            >
              <Receipt size={18} />
              Scan Receipt
            </button>
          )}
        </div>

        {/* Time Period Selector */}
        <div className="flex gap-2 overflow-x-auto">
          {[7, 30, 90].map(days => (
            <button
              key={days}
              type="button"
              onClick={() => setDaysFilter(days)}
              className="px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200"
              style={{
                backgroundColor: daysFilter === days
                  ? `${colors.accent.start}`
                  : colors.bg.white,
                color: daysFilter === days ? 'white' : colors.text.secondary,
                border: daysFilter === days
                  ? 'none'
                  : `2px solid ${colors.border.light}`,
              }}
            >
              Last {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: colors.bg.white,
              boxShadow: '0 2px 8px rgba(139, 111, 71, 0.06)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} style={{ color: colors.accent.start }} />
              <span className="text-xs font-medium" style={{ color: colors.text.tertiary }}>
                Total Spent
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>
              ${stats.totalSpent.toFixed(2)}
            </p>
          </div>

          <div
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: colors.bg.white,
              boxShadow: '0 2px 8px rgba(139, 111, 71, 0.06)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} style={{ color: colors.accent.start }} />
              <span className="text-xs font-medium" style={{ color: colors.text.tertiary }}>
                Items Bought
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>
              {stats.totalItems}
            </p>
          </div>

          <div
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: colors.bg.white,
              boxShadow: '0 2px 8px rgba(139, 111, 71, 0.06)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} style={{ color: colors.accent.start }} />
              <span className="text-xs font-medium" style={{ color: colors.text.tertiary }}>
                Shopping Trips
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>
              {stats.trips}
            </p>
          </div>

          <div
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: colors.bg.white,
              boxShadow: '0 2px 8px rgba(139, 111, 71, 0.06)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} style={{ color: colors.accent.start }} />
              <span className="text-xs font-medium" style={{ color: colors.text.tertiary }}>
                Avg/Trip
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>
              ${stats.avgPerTrip.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Purchase History */}
      {purchaseHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>
            No Purchase History
          </h3>
          <p className="text-sm text-center" style={{ color: colors.text.tertiary }}>
            Start marking items as purchased to track your shopping history
          </p>
        </div>
      ) : (
        <div className="px-5 space-y-4">
          {purchaseHistory.map((group) => (
            <div
              key={group.date}
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: colors.bg.white,
                boxShadow: '0 2px 8px rgba(139, 111, 71, 0.06)',
              }}
            >
              {/* Date Header */}
              <div
                className="px-4 py-3 border-b"
                style={{
                  backgroundColor: colors.bg.primary,
                  borderColor: colors.border.light,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-base" style={{ color: colors.text.primary }}>
                      {format(parseISO(group.date), 'EEEE, MMM dd')}
                    </h3>
                    <p className="text-xs" style={{ color: colors.text.tertiary }}>
                      {group.itemCount} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg" style={{ color: colors.accent.start }}>
                      ${group.totalSpent.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y" style={{ borderColor: colors.border.light }}>
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: colors.text.primary }}>
                        {item.name}
                      </p>
                      <p className="text-xs" style={{ color: colors.text.tertiary }}>
                        {item.quantity} {item.unit}
                        {item.brand && ` • ${item.brand}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="font-semibold" style={{ color: colors.text.secondary }}>
                        ${(item.price ?? item.estimatedPrice ?? 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
