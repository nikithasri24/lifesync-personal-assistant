import React, { useState } from 'react';
import { Search, Plus, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { PantryItem } from '../../types';
import { differenceInDays, format } from 'date-fns';

interface PantryGridViewProps {
  items: PantryItem[];
  onItemClick: (item: PantryItem) => void;
  onAddItem?: () => void;
  onRestockItem?: (item: PantryItem) => void;
}

type ExpirationStatus = 'expired' | 'critical' | 'soon' | 'ok' | null;

function getExpirationStatus(date?: Date): ExpirationStatus {
  if (!date) return null;
  const days = differenceInDays(date, new Date());
  if (days < 0) return 'expired';
  if (days <= 3) return 'critical';
  if (days <= 7) return 'soon';
  return 'ok';
}

function formatExpiry(date: Date): string {
  const days = differenceInDays(date, new Date());
  if (days < 0) return 'Expired';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `${days}d`;
  return format(date, 'MMM d');
}

const EXPIRY_COLORS: Record<ExpirationStatus & string, { bg: string; text: string; border: string }> = {
  expired: { bg: 'rgba(239,68,68,0.1)', text: '#EF4444', border: 'rgba(239,68,68,0.3)' },
  critical: { bg: 'rgba(249,115,22,0.1)', text: '#F97316', border: 'rgba(249,115,22,0.3)' },
  soon: { bg: 'rgba(234,179,8,0.1)', text: '#CA8A04', border: 'rgba(234,179,8,0.3)' },
  ok: { bg: 'transparent', text: '#10B981', border: 'transparent' },
};

// Category mapping for pantry items
const CATEGORY_CONFIG = {
  grains: { label: 'Grains & Pasta', emoji: '🌾', order: 1 },
  dairy: { label: 'Dairy & Eggs', emoji: '🥛', order: 2 },
  produce: { label: 'Produce', emoji: '🥬', order: 3 },
  protein: { label: 'Protein', emoji: '🍖', order: 4 },
  canned: { label: 'Canned Goods', emoji: '🥫', order: 5 },
  snacks: { label: 'Snacks', emoji: '🍪', order: 6 },
  beverages: { label: 'Beverages', emoji: '☕', order: 7 },
  condiments: { label: 'Condiments', emoji: '🧂', order: 8 },
  frozen: { label: 'Frozen Foods', emoji: '🧊', order: 9 },
  baking: { label: 'Baking', emoji: '🧁', order: 10 },
  other: { label: 'Other', emoji: '📦', order: 99 },
};

// Emoji mapping for common items (fallback)
const ITEM_EMOJI_MAP: Record<string, string> = {
  rice: '🍚',
  pasta: '🍝',
  bread: '🍞',
  milk: '🥛',
  cheese: '🧀',
  eggs: '🥚',
  butter: '🧈',
  yogurt: '🥛',
  apple: '🍎',
  banana: '🍌',
  carrot: '🥕',
  tomato: '🍅',
  lettuce: '🥬',
  spinach: '🥬',
  chicken: '🍗',
  beef: '🥩',
  fish: '🐟',
  beans: '🫘',
  coffee: '☕',
  tea: '🍵',
  juice: '🧃',
  soda: '🥤',
  water: '💧',
  chips: '🥔',
  cookies: '🍪',
  crackers: '🍘',
  cereal: '🥣',
  sauce: '🥫',
  ketchup: '🍅',
  mayo: '🥫',
  mustard: '🥫',
  oil: '🫗',
  salt: '🧂',
  pepper: '🧂',
  sugar: '🧂',
  flour: '🌾',
};

function getItemEmoji(itemName: string, category?: string): string {
  const lowerName = itemName.toLowerCase();

  // Try exact match
  if (ITEM_EMOJI_MAP[lowerName]) {
    return ITEM_EMOJI_MAP[lowerName];
  }

  // Try partial match
  for (const [key, emoji] of Object.entries(ITEM_EMOJI_MAP)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return emoji;
    }
  }

  // Fallback to category emoji
  if (category && CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]) {
    return CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG].emoji;
  }

  return '📦';
}

function getStockLevel(quantity: number): number {
  // Convert quantity to stock level (0-3)
  if (quantity === 0) return 0;
  if (quantity <= 1) return 1;
  if (quantity <= 3) return 2;
  return 3;
}

export function PantryGridView({ items, onItemClick, onAddItem, onRestockItem }: PantryGridViewProps) {
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');

  // Alert sections — computed before search filter
  const expiredItems = React.useMemo(() =>
    items.filter(i => getExpirationStatus(i.expirationDate) === 'expired'),
    [items]
  );
  const expiringSoonItems = React.useMemo(() =>
    items.filter(i => {
      const s = getExpirationStatus(i.expirationDate);
      return s === 'critical' || s === 'soon';
    }).sort((a, b) => (a.expirationDate?.getTime() ?? 0) - (b.expirationDate?.getTime() ?? 0)),
    [items]
  );
  const lowStockItems = React.useMemo(() =>
    items.filter(i =>
      i.isLowStock ||
      (i.lowStockThreshold !== undefined && i.lowStockThreshold > 0 && (i.quantity ?? 0) <= i.lowStockThreshold)
    ),
    [items]
  );

  // Group items by category
  const itemsByCategory = React.useMemo(() => {
    const filtered = searchQuery
      ? items.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : items;

    const grouped = filtered.reduce((acc, item) => {
      const category = item.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, PantryItem[]>);

    // Sort categories by order
    return Object.entries(grouped).sort((a, b) => {
      const orderA = CATEGORY_CONFIG[a[0] as keyof typeof CATEGORY_CONFIG]?.order ?? 99;
      const orderB = CATEGORY_CONFIG[b[0] as keyof typeof CATEGORY_CONFIG]?.order ?? 99;
      return orderA - orderB;
    });
  }, [items, searchQuery]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>
          No Pantry Items Yet
        </h3>
        <p className="text-sm text-center mb-6" style={{ color: colors.text.tertiary }}>
          Start tracking your pantry inventory
        </p>
        {onAddItem && (
          <button
            type="button"
            onClick={onAddItem}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-transform duration-200 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
              color: 'white',
            }}
            aria-label="Add your first pantry item"
          >
            <Plus size={20} />
            Add to Pantry
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '140px' }}>
      {/* Search Bar */}
      <div className="px-5 mb-4">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ backgroundColor: colors.bg.white, border: `2px solid ${colors.border.light}` }}
        >
          <Search size={20} style={{ color: colors.text.tertiary }} />
          <input
            type="text"
            placeholder="Search pantry items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-base"
            style={{ color: colors.text.primary }}
          />
        </div>
      </div>

      {/* ── ALERT: Expired ── */}
      {!searchQuery && expiredItems.length > 0 && (
        <div className="px-5 mb-4">
          <div className="p-3 rounded-xl border" style={{ backgroundColor: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={15} style={{ color: '#EF4444', flexShrink: 0 }} />
              <span className="text-sm font-bold" style={{ color: '#EF4444' }}>
                {expiredItems.length} item{expiredItems.length !== 1 ? 's' : ''} expired
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {expiredItems.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onItemClick(item)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }}
                >
                  {getItemEmoji(item.name, item.category)} {item.name}
                  {onRestockItem && (
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); onRestockItem(item); }}
                      className="ml-1 hover:opacity-70"
                      title="Add to shopping list"
                    >
                      <ShoppingCart size={11} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ALERT: Expiring Soon ── */}
      {!searchQuery && expiringSoonItems.length > 0 && (
        <div className="px-5 mb-4">
          <div className="p-3 rounded-xl border" style={{ backgroundColor: 'rgba(249,115,22,0.06)', borderColor: 'rgba(249,115,22,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold" style={{ color: '#F97316' }}>
                ⏰ Expiring soon
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {expiringSoonItems.map(item => {
                const status = getExpirationStatus(item.expirationDate);
                const col = status ? EXPIRY_COLORS[status] : null;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onItemClick(item)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                    style={{ backgroundColor: col?.bg, color: col?.text }}
                  >
                    {getItemEmoji(item.name, item.category)} {item.name}
                    <span className="opacity-70">· {formatExpiry(item.expirationDate!)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── ALERT: Low Stock ── */}
      {!searchQuery && lowStockItems.length > 0 && (
        <div className="px-5 mb-4">
          <div className="p-3 rounded-xl border" style={{ backgroundColor: 'rgba(212,165,116,0.08)', borderColor: 'rgba(212,165,116,0.25)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold" style={{ color: '#C18B5E' }}>
                📉 Running low ({lowStockItems.length})
              </span>
              {onRestockItem && (
                <button
                  type="button"
                  onClick={() => lowStockItems.forEach(i => onRestockItem(i))}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: '#C18B5E', color: 'white' }}
                >
                  <ShoppingCart size={11} />
                  Restock all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onItemClick(item)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(212,165,116,0.15)', color: '#C18B5E' }}
                >
                  {getItemEmoji(item.name, item.category)} {item.name}
                  <span className="opacity-60">· {item.quantity ?? 0} {item.unit ?? ''}</span>
                  {onRestockItem && (
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); onRestockItem(item); }}
                      className="ml-1 hover:opacity-70"
                      title="Add to shopping list"
                    >
                      <ShoppingCart size={11} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Categories and Items */}
      {itemsByCategory.map(([categoryKey, categoryItems]) => {
        const categoryConfig = CATEGORY_CONFIG[categoryKey as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.other;

        return (
          <div key={categoryKey} className="mb-6">
            <div className="px-5 mb-3">
              <h3 className="text-base font-semibold" style={{ color: colors.text.primary }}>
                {categoryConfig.emoji} {categoryConfig.label}
              </h3>
            </div>

            <div className="px-5">
              <div className="grid grid-cols-3 gap-3">
                {categoryItems.map((item) => {
                  const stockLevel = getStockLevel(item.quantity || 0);
                  const emoji = getItemEmoji(item.name, item.category);
                  const expiryStatus = getExpirationStatus(item.expirationDate);
                  const isLow = item.isLowStock ||
                    (item.lowStockThreshold !== undefined && item.lowStockThreshold > 0 && (item.quantity ?? 0) <= item.lowStockThreshold);
                  const expiryCol = expiryStatus && expiryStatus !== 'ok' ? EXPIRY_COLORS[expiryStatus] : null;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onItemClick(item)}
                      className="flex flex-col items-center p-3 rounded-xl transition-all duration-200 active:scale-95 relative overflow-hidden"
                      style={{
                        backgroundColor: colors.bg.white,
                        boxShadow: '0 2px 8px rgba(139, 111, 71, 0.06)',
                        border: isLow ? '1.5px solid rgba(212,165,116,0.4)' : expiryCol ? `1.5px solid ${expiryCol.border}` : '1.5px solid transparent',
                      }}
                      aria-label={`View ${item.name} details`}
                    >
                      {/* Emoji Icon */}
                      <div className="text-4xl mb-1">{emoji}</div>

                      {/* Item Name */}
                      <div
                        className="text-xs font-medium text-center mb-1.5 line-clamp-2"
                        style={{ color: colors.text.primary, minHeight: '2.5rem' }}
                      >
                        {item.name}
                      </div>

                      {/* Expiry badge */}
                      {expiryStatus && expiryStatus !== 'ok' && item.expirationDate && (
                        <div
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md mb-1"
                          style={{ backgroundColor: expiryCol?.bg, color: expiryCol?.text }}
                        >
                          {formatExpiry(item.expirationDate)}
                        </div>
                      )}

                      {/* Stock Indicator dots */}
                      <div className="flex gap-1">
                        {[1, 2, 3].map((level) => (
                          <div
                            key={level}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background: level <= stockLevel
                                ? isLow
                                  ? '#F97316'
                                  : `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`
                                : colors.border.medium,
                            }}
                          />
                        ))}
                      </div>

                      {/* Low stock + restock — use div to avoid nested <button> */}
                      {isLow && onRestockItem && (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); onRestockItem(item); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onRestockItem(item); } }}
                          className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md cursor-pointer"
                          style={{ backgroundColor: 'rgba(212,165,116,0.15)', color: '#C18B5E' }}
                          aria-label={`Add ${item.name} to shopping list`}
                        >
                          <ShoppingCart size={9} />
                          Restock
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* Add Item to Pantry Button */}
      {onAddItem && (
        <div className="px-5">
          <button
            type="button"
            onClick={onAddItem}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
              color: 'white',
              boxShadow: '0 4px 12px rgba(212, 165, 116, 0.25)',
            }}
            aria-label="Add item to pantry"
          >
            <Plus size={20} />
            Add to Pantry
          </button>
        </div>
      )}
    </div>
  );
}
