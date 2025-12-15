/**
 * Add Item Modal Component
 * Modal form for adding new items to the shopping list
 */

import React from 'react';
import { X } from 'lucide-react';
import type { ShoppingItemForm } from '../../types/forms';
import type { Store } from '../../types';
import { CATEGORY_ICONS, STORE_TYPES } from '../../constants';
import { validateCategory, validatePriority } from '../../utils/typeValidators';

interface AddItemModalProps {
  isOpen: boolean;
  formData: ShoppingItemForm;
  barcodeResult: string | null;
  stores: Store[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormChange: (updates: Partial<ShoppingItemForm>) => void;
  onBarcodeChange: (barcode: string) => void;
}

export function AddItemModal({
  isOpen,
  formData,
  barcodeResult,
  stores,
  onClose,
  onSubmit,
  onFormChange,
  onBarcodeChange,
}: AddItemModalProps): React.JSX.Element | null {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add to Master List</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onFormChange({ name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Organic Bananas"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => onFormChange({ quantity: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => onFormChange({ unit: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pcs">pieces</option>
                <option value="lbs">pounds</option>
                <option value="oz">ounces</option>
                <option value="bottles">bottles</option>
                <option value="cartons">cartons</option>
                <option value="boxes">boxes</option>
                <option value="bags">bags</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => onFormChange({ category: validateCategory(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(CATEGORY_ICONS).map(([category, icon]) => (
                  <option key={category} value={category}>
                    {icon} {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => onFormChange({ priority: validatePriority(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Est. Price
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.estimatedPrice}
                onChange={(e) => onFormChange({ estimatedPrice: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="$0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Store (optional)
              </label>
              <select
                value={formData.preferredStore}
                onChange={(e) => onFormChange({ preferredStore: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">AI will decide</option>
                {stores.map(store => {
                  const storeType = STORE_TYPES.find(st => st.value === store.type);
                  return (
                    <option key={store.id} value={store.id}>
                      {storeType?.icon} {store.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand (optional)
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => onFormChange({ brand: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Organic Valley"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Barcode (optional)
              </label>
              <input
                type="text"
                value={barcodeResult ?? ''}
                onChange={(e) => onBarcodeChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Scan or enter manually"
                readOnly={!!barcodeResult}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => onFormChange({ notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any special notes or preferences..."
              rows={2}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
