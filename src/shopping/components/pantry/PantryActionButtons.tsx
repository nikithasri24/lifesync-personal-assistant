import React from 'react';
import { Plus, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { exportPantryToCsv, downloadCsv } from '../../utils/pantryUtils';
import type { PantryItem } from '../../types';
import type { PantryFilter, PantrySort } from '../../hooks/usePantryManagement';

interface PantryActionButtonsProps {
  pantryItems: PantryItem[];
  pantryFilter: PantryFilter;
  pantrySort: PantrySort;
  onFilterChange: (filter: PantryFilter) => void;
  onSortChange: (sort: PantrySort) => void;
  onAddLowStock: () => Promise<void>;
  onAddExpired: () => Promise<void>;
  onAddItem: () => void;
  onScanReceipt: () => void;
}

export function PantryActionButtons({
  pantryItems,
  pantryFilter,
  pantrySort,
  onFilterChange,
  onSortChange,
  onAddLowStock,
  onAddExpired,
  onAddItem,
  onScanReceipt,
}: PantryActionButtonsProps) {
  const lowStockCount = pantryItems.filter(p => p.isLowStock).length;
  const expiredCount = pantryItems.filter(p =>
    p.expirationDate && p.expirationDate.getTime() < new Date().getTime()
  ).length;

  return (
    <div className="flex items-center gap-2">
      {/* Summary */}
      <span className="text-xs text-gray-600 hidden md:inline">
        {lowStockCount} low-stock • {expiredCount} expired
      </span>

      {/* Bulk Actions */}
      <button
        type="button"
        className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
        title="Add all low-stock items to shopping list"
        onClick={onAddLowStock}
      >
        Add low-stock to Shopping
      </button>

      <button
        type="button"
        className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
        title="Move all expired items to shopping list"
        onClick={onAddExpired}
      >
        Move expired to Shopping
      </button>

      {/* Export CSV */}
      <button
        type="button"
        className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
        title="Export pantry to CSV"
        onClick={() => {
          const csvContent = exportPantryToCsv(pantryItems);
          downloadCsv(csvContent, `pantry-${format(new Date(), 'yyyyMMdd-HHmmss')}.csv`);
        }}
      >
        Export CSV
      </button>

      {/* Filters */}
      <select
        className="rounded border border-gray-300 px-2 py-1 text-sm"
        onChange={(e) => onFilterChange(e.target.value as PantryFilter)}
        value={pantryFilter}
        title="Filter"
      >
        <option value="all">All</option>
        <option value="soon">Expiring soon</option>
        <option value="expired">Expired</option>
        <option value="low">Low stock</option>
      </select>

      <select
        className="rounded border border-gray-300 px-2 py-1 text-sm"
        onChange={(e) => onSortChange(e.target.value as PantrySort)}
        value={pantrySort}
        title="Sort"
      >
        <option value="expiry">Sort by expiry</option>
        <option value="name">Sort by name</option>
      </select>

      {/* Add Actions */}
      <button onClick={onAddItem} className="btn-primary flex items-center space-x-2">
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
  );
}
