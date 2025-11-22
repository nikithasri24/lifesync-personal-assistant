import React from 'react';
import { format, differenceInCalendarDays } from 'date-fns';
import type { PantryItem } from '../../hooks/usePantryManagement';

interface PantryTableRowProps {
  item: PantryItem;
  isEditing?: boolean;
  editData: {
    qty: string;
    unit: string;
    exp: string;
    low: boolean;
    threshold: string;
  };
  onEditChange: (updates: Partial<PantryTableRowProps['editData']>) => void;
  onSaveEdit: (itemId: string) => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onReplenish: () => void;
  onAddToShopping: () => void;
  onDelete: (itemId: string) => void;
}

export function PantryTableRow({
  item,
  isEditing = false,
  editData,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onReplenish,
  onAddToShopping,
  onDelete,
}: PantryTableRowProps): React.JSX.Element {
  const now = new Date();
  const daysUntilExpiry = item.expirationDate && item.expirationDate instanceof Date
    ? differenceInCalendarDays(item.expirationDate, now)
    : item.expirationDate
    ? differenceInCalendarDays(new Date(item.expirationDate), now)
    : null;

  // Determine status color
  const statusColor = daysUntilExpiry !== null
    ? (daysUntilExpiry < 0
      ? 'text-red-600'
      : (daysUntilExpiry <= 7
        ? 'text-amber-600'
        : 'text-gray-900'))
    : 'text-gray-900';

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-3 py-2 text-sm">
        <div className={`font-medium ${statusColor}`}>{item.name}</div>
        {item.isLowStock && <span className="text-xs text-amber-600">Low stock</span>}
      </td>

      <td className="px-3 py-2 text-sm">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={editData.qty}
              onChange={(e): void => onEditChange({ qty: e.target.value })}
              className="w-16 rounded border border-gray-300 px-1 py-0.5 text-sm"
            />
            <input
              value={editData.unit}
              onChange={(e): void => onEditChange({ unit: e.target.value })}
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

      <td className="px-3 py-2 text-sm">
        {isEditing ? (
          <input
            type="date"
            value={editData.exp}
            onChange={(e): void => onEditChange({ exp: e.target.value })}
            className="w-32 rounded border border-gray-300 px-1 py-0.5 text-sm"
          />
        ) : item.expirationDate ? (
          <div className={statusColor}>
            {format(item.expirationDate, 'MMM d, yyyy')}
            {daysUntilExpiry !== null && (
              <div className="text-xs">
                {daysUntilExpiry < 0 ? `Expired ${Math.abs(daysUntilExpiry)}d ago` : `${daysUntilExpiry}d left`}
              </div>
            )}
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>

      <td className="px-3 py-2">
        {isEditing ? (
          <div className="flex flex-col gap-1">
            <label className="inline-flex items-center text-xs">
              <input
                type="checkbox"
                checked={editData.low}
                onChange={(e): void => onEditChange({ low: e.target.checked })}
                className="mr-1"
              />
              Low stock
            </label>
            <input
              type="number"
              value={editData.threshold}
              onChange={(e): void => onEditChange({ threshold: e.target.value })}
              placeholder="Threshold"
              className="w-20 rounded border border-gray-300 px-1 py-0.5 text-xs"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500"
                  onClick={(): void => onSaveEdit(item.id)}
                >
                  Save
                </button>
                <button
                  className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                  onClick={onCancelEdit}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                  onClick={onStartEdit}
                >
                  Edit
                </button>
                <button
                  className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                  title="Replenish to target quantity"
                  onClick={onReplenish}
                >
                  Replenish
                </button>
                <button
                  className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                  onClick={onAddToShopping}
                >
                  Add to Shopping
                </button>
                <button
                  className="px-2 py-1 text-xs rounded border border-red-300 text-red-600 hover:bg-red-50"
                  onClick={(): void => onDelete(item.id)}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
