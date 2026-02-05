/**
 * Pantry View Component
 * Displays and manages pantry inventory with expiration tracking
 */

import React, { useState, useMemo, type ReactElement } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import type { PantryItem } from '../../../types';
import type { ShoppingItem } from '../../types';
import { usePantryActions } from '../../hooks/usePantryActions';
import { exportPantryToCsv, downloadCsv } from '../../utils/pantryUtils';
import { CompactOwnerBadge } from '../../../components/common/OwnerBadge';

interface PantryViewProps {
  pantryItems: (PantryItem & {
    ownerId?: string;
    ownerName?: string;
    isOwnedByCurrentUser?: boolean;
  })[];
  onAddItem: () => void;
  onScanReceipt: () => void;
  onAddToShopping: (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateItem: (itemId: string, updates: Partial<PantryItem>) => Promise<void>;
  onDeleteItem: (itemId: string) => void;
  onShowToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

type PantryFilterType = 'all' | 'expired' | 'soon' | 'low';
type PantrySortType = 'expiry' | 'name';

function validatePantryFilter(value: string): PantryFilterType {
  if (value === 'all' || value === 'expired' || value === 'soon' || value === 'low') {
    return value;
  }
  return 'all';
}

function validatePantrySort(value: string): PantrySortType {
  if (value === 'expiry' || value === 'name') {
    return value;
  }
  return 'expiry';
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
  const [pantryFilter, setPantryFilter] = useState<PantryFilterType>('all');
  const [pantrySort, setPantrySort] = useState<PantrySortType>('expiry');
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
  const { addLowStockToShopping, addExpiredToShopping } = usePantryActions(pantryItems, onAddToShopping);

  const pantrySortedFiltered = useMemo((): PantryItem[] => {
    let items: PantryItem[] = [...pantryItems];
    const now = new Date();
    if (pantryFilter === 'expired')
      items = items.filter((p: PantryItem): boolean => p.expirationDate !== undefined && p.expirationDate.getTime() < now.getTime());
    if (pantryFilter === 'soon')
      items = items.filter(
        (p: PantryItem): boolean =>
          p.expirationDate !== undefined &&
          differenceInCalendarDays(p.expirationDate, now) <= 7 &&
          differenceInCalendarDays(p.expirationDate, now) >= 0
      );
    if (pantryFilter === 'low') items = items.filter((p: PantryItem): boolean => p.isLowStock === true);
    if (pantrySort === 'expiry')
      items.sort((a: PantryItem, b: PantryItem): number => {
        const ax = a.expirationDate !== undefined ? a.expirationDate.getTime() : Infinity;
        const bx = b.expirationDate !== undefined ? b.expirationDate.getTime() : Infinity;
        return ax - bx;
      });
    if (pantrySort === 'name') items.sort((a: PantryItem, b: PantryItem): number => a.name.localeCompare(b.name));
    return items;
  }, [pantryItems, pantryFilter, pantrySort]);

  const handleAddLowStockToShopping = async (): Promise<void> => {
    const count = await addLowStockToShopping();
    onShowToast(`Added ${count} low-stock items to shopping`, 'success');
  };

  const handleMoveExpiredToShopping = async (): Promise<void> => {
    const count = await addExpiredToShopping();
    onShowToast(`Moved ${count} expired items to shopping`, 'info');
  };

  const handleExportCSV = (): void => {
    const csv = exportPantryToCsv(pantryItems);
    downloadCsv(csv, `pantry-${format(new Date(), 'yyyyMMdd-HHmmss')}.csv`);
  };

  const handleSaveEdit = async (p: PantryItem): Promise<void> => {
    const qty: number = Number(editPantry.qty) || 0;
    const exp: Date | undefined = editPantry.exp !== '' ? new Date(editPantry.exp) : undefined;
    await onUpdateItem(p.id, {
      quantity: qty,
      unit: editPantry.unit !== '' ? editPantry.unit : undefined,
      expirationDate: exp,
      isLowStock: editPantry.low,
      lowStockThreshold: editPantry.threshold !== '' ? Number(editPantry.threshold) : undefined,
    });
    setEditingPantryId(null);
  };

  const handleReplenish = async (): Promise<void> => {
    const p: PantryItem | undefined = pantryItems.find((x: PantryItem): boolean => x.id === replenishId);
    if (p === undefined) {
      setReplenishId(null);
      return;
    }
    const target: number = Number(replenishTarget) || 0;
    const need: number = Math.max(0, target - (p.quantity ?? 0));
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
    onShowToast(`Added ${need} ${p.unit ?? ''} of ${p.name} to shopping`, 'success');
    setReplenishId(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold">Pantry</h4>
        <div className="flex items-center gap-2">
          {/* Summary */}
          <span className="text-xs text-gray-600 hidden md:inline">
            {pantryItems.filter((p: PantryItem): boolean => p.isLowStock === true).length} low-stock •{' '}
            {
              pantryItems.filter(
                (p: PantryItem): boolean =>
                  p.expirationDate !== undefined &&
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
            onClick={(): void => {
              void handleAddLowStockToShopping();
            }}
          >
            Add low-stock to Shopping
          </button>
          <button
            type="button"
            className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
            title="Move all expired items to shopping list"
            onClick={(): void => {
              void handleMoveExpiredToShopping();
            }}
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
            onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => setPantryFilter(validatePantryFilter(e.target.value))}
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
            onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => setPantrySort(validatePantrySort(e.target.value))}
            defaultValue="expiry"
            title="Sort"
          >
            <option value="expiry">Sort by expiry</option>
            <option value="name">Sort by name</option>
          </select>
          <button
            onClick={onAddItem}
            className="btn-primary flex items-center space-x-2"
            aria-label="Add pantry item"
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
                <th className="py-2 px-3">Owner</th>
                <th className="py-2 px-3">Qty</th>
                <th className="py-2 px-3">Expires</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Low stock</th>
                <th className="py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pantrySortedFiltered.map((p: PantryItem): ReactElement => {
                const days: number | null = p.expirationDate !== undefined
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
                      {p.ownerName && (
                        <CompactOwnerBadge
                          ownerName={p.ownerName}
                          isOwnedByCurrentUser={p.isOwnedByCurrentUser ?? true}
                        />
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {editingPantryId === p.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            value={editPantry.qty}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
                              setEditPantry((s) => ({ ...s, qty: e.target.value }))
                            }
                            className="w-20 rounded border border-gray-300 px-2 py-1"
                          />
                          <input
                            value={editPantry.unit}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
                              setEditPantry((s) => ({ ...s, unit: e.target.value }))
                            }
                            className="w-20 rounded border border-gray-300 px-2 py-1"
                          />
                        </div>
                      ) : (
                        <>
                          {p.quantity} {p.unit ?? ''}
                        </>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {editingPantryId === p.id ? (
                        <input
                          type="date"
                          value={editPantry.exp}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
                            setEditPantry((s) => ({ ...s, exp: e.target.value }))
                          }
                          className="rounded border border-gray-300 px-2 py-1"
                        />
                      ) : (
                        <>{p.expirationDate !== undefined ? format(p.expirationDate, 'MMM d, yyyy') : '—'}</>
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
                              onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
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
                            onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
                              setEditPantry((s) => ({ ...s, threshold: e.target.value }))
                            }
                            className="w-24 rounded border border-gray-300 px-2 py-1"
                          />
                        </div>
                      ) : (
                        <span
                          className={`text-xs ${p.isLowStock === true ? 'text-amber-700' : 'text-gray-500'}`}
                        >
                          {p.isLowStock === true ? `Low (≤ ${p.lowStockThreshold ?? '—'})` : 'OK'}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 space-x-2">
                      {editingPantryId === p.id ? (
                        <>
                          <button
                            className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                            onClick={(): void => {
                              void handleSaveEdit(p);
                            }}
                          >
                            Save
                          </button>
                          <button
                            className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                            onClick={(): void => setEditingPantryId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Only show edit/delete for items owned by current user */}
                          {(p.isOwnedByCurrentUser ?? true) && (
                            <>
                              <button
                                className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                                onClick={(): void => {
                                  setEditingPantryId(p.id);
                                  setEditPantry({
                                    qty: String(p.quantity),
                                    unit: p.unit ?? '',
                                    exp: p.expirationDate !== undefined
                                      ? format(p.expirationDate, 'yyyy-MM-dd')
                                      : '',
                                    low: p.isLowStock === true,
                                    threshold: p.lowStockThreshold !== undefined
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
                                onClick={(): void => {
                                  setReplenishId(p.id);
                                  setReplenishTarget(
                                    p.lowStockThreshold !== undefined
                                      ? String(p.lowStockThreshold)
                                      : String(Math.max(p.quantity ?? 0, 1))
                                  );
                                }}
                              >
                                Replenish
                              </button>
                              <button
                                className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                                onClick={(): void => {
                                  void onDeleteItem(p.id);
                                }}
                              >
                                Delete
                              </button>
                            </>
                          )}
                          {/* Add to Shopping is always available */}
                          <button
                            className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                            onClick={(): void => {
                              void (async (): Promise<void> => {
                                await onAddToShopping({
                                  name: p.name,
                                  quantity:
                                    p.lowStockThreshold !== undefined && p.quantity !== undefined && p.quantity < p.lowStockThreshold
                                      ? p.lowStockThreshold - p.quantity
                                      : p.quantity ?? 1,
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
                              })();
                            }}
                          >
                            Add to Shopping
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

      {replenishId !== null && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-gray-700">Replenish to target quantity:</span>
          <input
            type="number"
            min={0}
            value={replenishTarget}
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setReplenishTarget(e.target.value)}
            className="w-28 rounded border border-gray-300 px-2 py-1"
          />
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-500"
            onClick={(): void => {
              void handleReplenish();
            }}
          >
            Go
          </button>
          <button
            className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
            onClick={(): void => setReplenishId(null)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
