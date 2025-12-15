import React from 'react';
import { differenceInCalendarDays } from 'date-fns';
import { ReplenishModal } from '../modals/ReplenishModal';
import type { PantryItem } from '../../../types';

interface PantryTableProps {
  items: PantryItem[];
  editingItemId: string | null;
  editData: {
    qty: string;
    unit: string;
    exp: string;
    low: boolean;
    threshold: string;
  };
  replenishId: string | null;
  onEditChange: (updates: Partial<PantryTableProps['editData']>) => void;
  onSaveEdit: (itemId: string) => void;
  onCancelEdit: () => void;
  onStartEdit: (item: PantryItem) => void;
  onStartReplenish: (itemId: string) => void;
  onReplenish: (targetQuantity: number) => Promise<void>;
  onCancelReplenish: () => void;
  onAddToShopping: (item: PantryItem) => void;
  onDelete: (itemId: string) => void;
}

export function PantryTable({
  items,
  editingItemId,
  editData,
  replenishId,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onStartReplenish,
  onReplenish,
  onCancelReplenish,
  onAddToShopping,
  onDelete,
}: PantryTableProps) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">No pantry items yet.</p>;
  }

  const replenishItem = replenishId ? items.find(i => i.id === replenishId) : null;

  return (
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
          {items.map((item) => {
            const days = item.expirationDate
              ? differenceInCalendarDays(item.expirationDate, new Date())
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
              <React.Fragment key={item.id}>
                <tr className="border-t">
                  <td className="py-2 px-3 font-medium text-gray-900">{item.name}</td>
                  <td className="py-2 px-3">
                    {editingItemId === item.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editData.qty}
                          onChange={(e) => onEditChange({ qty: e.target.value })}
                          className="w-16 rounded border border-gray-300 px-1 py-0.5 text-sm"
                        />
                        <input
                          value={editData.unit}
                          onChange={(e) => onEditChange({ unit: e.target.value })}
                          className="w-16 rounded border border-gray-300 px-1 py-0.5 text-sm"
                          placeholder="unit"
                        />
                      </div>
                    ) : (
                      <span>
                        {item.quantity} {item.unit ?? ''}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {editingItemId === item.id ? (
                      <input
                        type="date"
                        value={editData.exp}
                        onChange={(e) => onEditChange({ exp: e.target.value })}
                        className="rounded border border-gray-300 px-1 py-0.5 text-sm"
                      />
                    ) : item.expirationDate ? (
                      <span>{item.expirationDate.toLocaleDateString()}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className={`py-2 px-3 ${cls}`}>{status}</td>
                  <td className="py-2 px-3">
                    {editingItemId === item.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={editData.low}
                          onChange={(e) => onEditChange({ low: e.target.checked })}
                        />
                        <input
                          type="number"
                          value={editData.threshold}
                          onChange={(e) => onEditChange({ threshold: e.target.value })}
                          className="w-16 rounded border border-gray-300 px-1 py-0.5 text-xs"
                          placeholder="threshold"
                        />
                      </div>
                    ) : (
                      <span className={item.isLowStock ? 'text-amber-600' : 'text-gray-600'}>
                        {item.isLowStock ? `Yes (${item.lowStockThreshold ?? '?'})` : 'No'}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {editingItemId === item.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500"
                          onClick={() => onSaveEdit(item.id)}
                        >
                          Save
                        </button>
                        <button
                          className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                          onClick={onCancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                          onClick={() => onStartEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                          title="Replenish to target quantity"
                          onClick={() => onStartReplenish(item.id)}
                        >
                          Replenish
                        </button>
                        <button
                          className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                          onClick={() => onAddToShopping(item)}
                        >
                          Add to Shopping
                        </button>
                        <button
                          className="px-2 py-1 text-xs rounded border border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => onDelete(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>

                {/* Replenish Modal Inline */}
                {replenishId === item.id && replenishItem && (
                  <tr>
                    <td colSpan={6} className="px-3 py-2 bg-gray-50">
                      <ReplenishModal
                        itemName={replenishItem.name}
                        currentQuantity={replenishItem.quantity ?? 0}
                        suggestedTarget={replenishItem.lowStockThreshold ?? Math.max(replenishItem.quantity ?? 0, 1)}
                        onReplenish={onReplenish}
                        onCancel={onCancelReplenish}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
