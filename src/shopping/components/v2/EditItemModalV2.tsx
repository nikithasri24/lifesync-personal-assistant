/**
 * EditItemModalV2 Component
 * Together pattern modal for editing existing shopping items
 * Features: auto-save, delete button, fixed header/footer, mobile drag handle
 */

import React, { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { ShoppingItemForm } from '../../types/forms';
import type { Store } from '../../types';
import { CATEGORY_ICONS, STORE_TYPES } from '../../constants';
import { validateCategory, validatePriority } from '../../utils/typeValidators';

interface EditItemModalV2Props {
  isOpen: boolean;
  itemId: string;
  formData: ShoppingItemForm;
  barcodeResult: string | null;
  stores: Store[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
  onFormChange: (updates: Partial<ShoppingItemForm>) => void;
  onBarcodeChange: (barcode: string) => void;
}

export const EditItemModalV2: React.FC<EditItemModalV2Props> = ({
  isOpen,
  itemId,
  formData,
  barcodeResult,
  stores,
  onClose,
  onSubmit,
  onDelete,
  onFormChange,
  onBarcodeChange,
}) => {
  const colors = useThemeColors();
  const [isPending, setIsPending] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      onSubmit(e);
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 z-[60] flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh', maxWidth: '600px' }}
      >
        {/* Mobile Drag Handle */}
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
        </div>

        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Edit Item</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div
            className="overflow-y-auto p-6 space-y-5 flex-1"
            style={{ maxHeight: 'calc(90vh - 140px)' }}
          >
            {/* Item Name */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                Item Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => onFormChange({ name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="e.g., Organic Bananas"
                required
                autoFocus
              />
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => onFormChange({ quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                  Unit
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => onFormChange({ unit: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                >
                  <option value="pcs">pieces</option>
                  <option value="lbs">pounds</option>
                  <option value="oz">ounces</option>
                  <option value="bottles">bottles</option>
                  <option value="cartons">cartons</option>
                  <option value="boxes">boxes</option>
                  <option value="bags">bags</option>
                  <option value="gallons">gallons</option>
                  <option value="liters">liters</option>
                </select>
              </div>
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => onFormChange({ category: validateCategory(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                >
                  {Object.entries(CATEGORY_ICONS).map(([category, icon]) => (
                    <option key={category} value={category}>
                      {icon} {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => onFormChange({ priority: validatePriority(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Store */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                Preferred Store
              </label>
              <select
                value={formData.preferredStore}
                onChange={(e) => onFormChange({ preferredStore: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
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

            {/* Price and Brand */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                  Est. Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.estimatedPrice}
                  onChange={(e) => onFormChange({ estimatedPrice: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                  placeholder="$0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                  Brand (optional)
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => onFormChange({ brand: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                  placeholder="e.g., Organic Valley"
                />
              </div>
            </div>

            {/* Barcode */}
            {barcodeResult && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                  Barcode
                </label>
                <input
                  type="text"
                  value={barcodeResult}
                  onChange={(e) => onBarcodeChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                  readOnly
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => onFormChange({ notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                placeholder="Any special notes or preferences..."
                rows={3}
              />
            </div>

            {/* Delete Button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleDelete}
                className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-xl font-semibold text-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {showDeleteConfirm ? 'Click again to confirm delete' : 'Delete Item'}
              </button>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              }}
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModalV2;
