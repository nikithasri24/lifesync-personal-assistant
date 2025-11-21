/**
 * Pantry View Component
 * Displays and manages pantry inventory with expiration tracking
 */

import React, { useState, useMemo } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import type { PantryItem } from '../../../mealPlanning/types';
import type { ShoppingItem } from '../../types';

interface PantryViewProps {
  pantryItems: PantryItem[];
  onAddItem: () => void;
  onScanReceipt: () => void;
  onAddToShopping: (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateItem: (itemId: string, updates: Partial<PantryItem>) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

export function PantryView({
  pantryItems,
  onAddItem,
  onScanReceipt,
  onAddToShopping,
  onUpdateItem,
  onDeleteItem,
  onShowToast,
}: PantryViewProps) {
  const [pantryFilter, setPantryFilter] = useState<'all' | 'expired' | 'soon' | 'low'>('all');
  const [pantrySort, setPantrySort] = useState<'expiry' | 'name'>('expiry');
  const [editingPantryId, setEditingPantryId] = useState<string | null>(null);
  const [editPantry, setEditPantry] = useState<{
    qty: string;
    unit: string;
    exp: string;
    low: boolean;
    threshold: string;
  }>({ qty: '0', unit: '', exp: '', low: false, threshold: '' });
  const [replenishId, setReplenishId] = useState<string | null>(null);
  const [replenishTarget, setReplenishTarget] = useState<string>('');

  const pantrySortedFiltered = useMemo(() => {
    let items = [...pantryItems];
    const now = new Date();
    if (pantryFilter === 'expired')
      items = items.filter((p) => p.expirationDate && p.expirationDate.getTime() < now.getTime());
    if (pantryFilter === 'soon')
      items = items.filter(
        (p) =>
          p.expirationDate &&
          differenceInCalendarDays(p.expirationDate, now) <= 7 &&
          differenceInCalendarDays(p.expirationDate, now) >= 0
      );
    if (pantryFilter === 'low') items = items.filter((p) => p.isLowStock);
    if (pantrySort === 'expiry')
      items.sort((a, b) => {
        const ax = a.expirationDate ? a.expirationDate.getTime() : Infinity;
        const bx = b.expirationDate ? b.expirationDate.getTime() : Infinity;
        return ax - bx;
      });
    if (pantrySort === 'name') items.sort((a, b) => a.name.localeCompare(b.name));
    return items;
  }, [pantryItems, pantryFilter, pantrySort]);

  const handleAddLowStockToShopping = async () => {
    const lows = pantryItems.filter((p) => p.isLowStock && (p.lowStockThreshold ?? 0) > 0);
    for (const p of lows) {
      const target = p.lowStockThreshold ?? 0;
      const need = Math.max(0, target - (p.quantity || 0)) || 1;
      await onAddToShopping({
        name: p.name,
        quantity: need,
        unit: p.unit,
        category: p.category,
        subcategory: undefined,
        priority: 'medium',
        purchased: false,
        price: undefined,
        estimatedPrice: undefined,
        aisle: undefined,
        brand: undefined,
        size: undefined,
        notes: p.notes,
        imageUrl: undefined,
        nutritionInfo: undefined,
        tags: ['from:pantry'],
        addedBy: undefined,
        purchasedAt: undefined,
        purchasedBy: undefined,
        assignedStore: undefined,
        bestStores: [],
      });
    }
    onShowToast(`Added ${lows.length} low-stock items to shopping`, 'success');
  };

  const handleMoveExpiredToShopping = async () => {
    const now = new Date();
    const expired = pantryItems.filter(
      (p) => p.expirationDate && p.expirationDate.getTime() < now.getTime()
    );
    for (const p of expired) {
      const qty = p.quantity && p.quantity > 0 ? p.quantity : 1;
      await onAddToShopping({
        name: p.name,
        quantity: qty,
        unit: p.unit,
        category: p.category,
        subcategory: undefined,
        priority: 'medium',
        purchased: false,
        price: undefined,
        estimatedPrice: undefined,
        aisle: undefined,
        brand: undefined,
        size: undefined,
        notes: p.notes,
        imageUrl: undefined,
        nutritionInfo: undefined,
        tags: ['from:pantry', 'reason:expired'],
        addedBy: undefined,
        purchasedAt: undefined,
        purchasedBy: undefined,
        assignedStore: undefined,
        bestStores: [],
      });
    }
    onShowToast(`Moved ${expired.length} expired items to shopping`, 'info');
  };

  const handleExportCSV = () => {
    const headers = [
      'Name',
      'Quantity',
      'Unit',
      'Category',
      'Expiration',
      'LowStock',
      'Threshold',
      'Location',
    ];
    const rows = pantryItems.map((p) => [
      p.name,
      String(p.quantity ?? ''),
      p.unit ?? '',
      p.category,
      p.expirationDate ? format(p.expirationDate, 'yyyy-MM-dd') : '',
      p.isLowStock ? 'yes' : 'no',
      p.lowStockThreshold != null ? String(p.lowStockThreshold) : '',
      p.location ?? '',
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pantry-${format(new Date(), 'yyyyMMdd-HHmmss')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = async (p: PantryItem) => {
    const qty = Number(editPantry.qty) || 0;
    const exp = editPantry.exp ? new Date(editPantry.exp) : undefined;
    await onUpdateItem(p.id, {
      quantity: qty,
      unit: editPantry.unit || undefined,
      expirationDate: exp,
      isLowStock: editPantry.low,
      lowStockThreshold: editPantry.threshold ? Number(editPantry.threshold) : undefined,
    });
    setEditingPantryId(null);
  };

  const handleReplenish = async () => {
    const p = pantryItems.find((x) => x.id === replenishId);
    if (!p) {
      setReplenishId(null);
      return;
    }
    const target = Number(replenishTarget) || 0;
    const need = Math.max(0, target - (p.quantity || 0));
    if (need <= 0) {
      onShowToast('Already at or above target', 'info');
      setReplenishId(null);
      return;
    }
    await onAddToShopping({
      name: p.name,
      quantity: need,
      unit: p.unit,
      category: p.category,
      subcategory: undefined,
      priority: 'medium',
      purchased: false,
      price: undefined,
      estimatedPrice: undefined,
      aisle: undefined,
      brand: undefined,
      size: undefined,
      notes: p.notes,
      imageUrl: undefined,
      nutritionInfo: undefined,
      tags: ['from:pantry', 'reason:replenish'],
      addedBy: undefined,
      purchasedAt: undefined,
      purchasedBy: undefined,
      assignedStore: undefined,
      bestStores: [],
    });
    onShowToast(`Added ${need} ${p.unit || ''} of ${p.name} to shopping`, 'success');
    setReplenishId(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold">Pantry</h4>
        <div className="flex items-center gap-2">
          {/* Summary */}
          <span className="text-xs text-gray-600 hidden md:inline">
            {pantryItems.filter((p) => p.isLowStock).length} low-stock •{' '}
            {
              pantryItems.filter(
                (p) =>
                  p.expirationDate &&
                  differenceInCalendarDays(p.expirationDate, new Date()) < 0
              ).length
            }{' '}
            expired
          </span>
          {/* Bulk add low-stock */}
          <button
            type="button"
            className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
            title="Add all low-stock items to shopping list"
            onClick={handleAddLowStockToShopping}
          >
            Add low-stock to Shopping
          </button>
          <button
            type="button"
            className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
            title="Move all expired items to shopping list"
            onClick={handleMoveExpiredToShopping}
          >
            Move expired to Shopping
          </button>
          {/* Export CSV */}
          <button
            type="button"
            className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
            title="Export pantry to CSV"
            onClick={handleExportCSV}
          >
            Export CSV
          </button>
          {/* Simple filters */}
          <select
            className="rounded border border-gray-300 px-2 py-1 text-sm"
            onChange={(e) => setPantryFilter(validatePantryFilter(e.target.value))}
            defaultValue="all"
            title="Filter"
          >
            <option value="all">All</option>
            <option value="soon">Expiring soon</option>
            <option value="expired">Expired</option>
            <option value="low">Low stock</option>
          </select>
          <select
            className="rounded border border-gray-300 px-2 py-1 text-sm"
            onChange={(e) => setPantrySort(validatePantrySort(e.target.value))}
            defaultValue="expiry"
            title="Sort"
          >
            <option value="expiry">Sort by expiry</option>
            <option value="name">Sort by name</option>
          </select>
          <button
            onClick={onAddItem}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Add Pantry Item</span>
          </button>
          <button
            onClick={onScanReceipt}
            className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50 flex items-center gap-2"
            title="Scan receipt to auto-add items"
          >
            <Receipt size={16} />
            <span>Scan Receipt</span>
          </button>
        </div>
      </div>

      {pantryItems.length === 0 ? (
        <p className="text-sm text-gray-500">No pantry items yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 px-3">Item</th>
                <th className="py-2 px-3">Qty</th>
                <th className="py-2 px-3">Expires</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Low stock</th>
                <th className="py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pantrySortedFiltered.map((p) => {
                const days = p.expirationDate
                  ? differenceInCalendarDays(p.expirationDate, new Date())
                  : null;
                let status = '—';
                let cls = 'text-gray-600';
                if (days != null) {
                  if (days < 0) {
                    status = 'Expired';
                    cls = 'text-rose-700';
                  } else if (days <= 7) {
                    status = `Expires in ${days}d`;
                    cls = 'text-amber-700';
                  } else {
                    status = `Fresh (${days}d)`;
                    cls = 'text-emerald-700';
                  }
                }
                return (
                  <tr key={p.id} className="border-t">
                    <td className="py-2 px-3 font-medium text-gray-900">{p.name}</td>
                    <td className="py-2 px-3">
                      {editingPantryId === p.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            value={editPantry.qty}
                            onChange={(e) =>
                              setEditPantry((s) => ({ ...s, qty: e.target.value }))
                            }
                            className="w-20 rounded border border-gray-300 px-2 py-1"
                          />
                          <input
                            value={editPantry.unit}
                            onChange={(e) =>
                              setEditPantry((s) => ({ ...s, unit: e.target.value }))
                            }
                            className="w-20 rounded border border-gray-300 px-2 py-1"
                          />
                        </div>
                      ) : (
                        <>
                          {p.quantity} {p.unit || ''}
                        </>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {editingPantryId === p.id ? (
                        <input
                          type="date"
                          value={editPantry.exp}
                          onChange={(e) =>
                            setEditPantry((s) => ({ ...s, exp: e.target.value }))
                          }
                          className="rounded border border-gray-300 px-2 py-1"
                        />
                      ) : (
                        <>{p.expirationDate ? format(p.expirationDate, 'MMM d, yyyy') : '—'}</>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <span className={cls}>{status}</span>
                    </td>
                    <td className="py-2 px-3">
                      {editingPantryId === p.id ? (
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-1 text-xs text-gray-700">
                            <input
                              type="checkbox"
                              checked={editPantry.low}
                              onChange={(e) =>
                                setEditPantry((s) => ({ ...s, low: e.target.checked }))
                              }
                            />{' '}
                            Low
                          </label>
                          <input
                            type="number"
                            min={0}
                            placeholder="Threshold"
                            value={editPantry.threshold}
                            onChange={(e) =>
                              setEditPantry((s) => ({ ...s, threshold: e.target.value }))
                            }
                            className="w-24 rounded border border-gray-300 px-2 py-1"
                          />
                        </div>
                      ) : (
                        <span
                          className={`text-xs ${p.isLowStock ? 'text-amber-700' : 'text-gray-500'}`}
                        >
                          {p.isLowStock ? `Low (≤ ${p.lowStockThreshold ?? '—'})` : 'OK'}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 space-x-2">
                      {editingPantryId === p.id ? (
                        <>
                          <button
                            className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                            onClick={() => handleSaveEdit(p)}
                          >
                            Save
                          </button>
                          <button
                            className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                            onClick={() => setEditingPantryId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                            onClick={() => {
                              setEditingPantryId(p.id);
                              setEditPantry({
                                qty: String(p.quantity),
                                unit: p.unit || '',
                                exp: p.expirationDate
                                  ? format(p.expirationDate, 'yyyy-MM-dd')
                                  : '',
                                low: !!p.isLowStock,
                                threshold: p.lowStockThreshold
                                  ? String(p.lowStockThreshold)
                                  : '',
                              });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                            title="Replenish to target quantity"
                            onClick={() => {
                              setReplenishId(p.id);
                              setReplenishTarget(
                                p.lowStockThreshold
                                  ? String(p.lowStockThreshold)
                                  : String(Math.max(p.quantity, 1))
                              );
                            }}
                          >
                            Replenish
                          </button>
                          <button
                            className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                            onClick={async () => {
                              await onAddToShopping({
                                name: p.name,
                                quantity:
                                  p.lowStockThreshold && p.quantity < p.lowStockThreshold
                                    ? p.lowStockThreshold - p.quantity
                                    : p.quantity || 1,
                                unit: p.unit,
                                category: p.category,
                                subcategory: undefined,
                                priority: 'medium',
                                purchased: false,
                                price: undefined,
                                estimatedPrice: undefined,
                                aisle: undefined,
                                brand: undefined,
                                size: undefined,
                                notes: p.notes,
                                imageUrl: undefined,
                                nutritionInfo: undefined,
                                tags: ['from:pantry'],
                                addedBy: undefined,
                                purchasedAt: undefined,
                                purchasedBy: undefined,
                                assignedStore: undefined,
                                bestStores: [],
                              });
                              onShowToast(`Added ${p.name} to shopping`, 'success');
                            }}
                          >
                            Add to Shopping
                          </button>
                          <button
                            className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                            onClick={() => onDeleteItem(p.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {replenishId && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-gray-700">Replenish to target quantity:</span>
          <input
            type="number"
            min={0}
            value={replenishTarget}
            onChange={(e) => setReplenishTarget(e.target.value)}
            className="w-28 rounded border border-gray-300 px-2 py-1"
          />
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-500"
            onClick={handleReplenish}
          >
            Go
          </button>
          <button
            className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
            onClick={() => setReplenishId(null)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
