/**
 * EditItemModalV2 Component - MIGRATED to use FormModalV2
 * Together pattern modal for editing existing shopping items
 *
 * MIGRATION COMPLETE:
 * - Reduced from 332 lines to ~250 lines (25% reduction)
 * - Removed all boilerplate (ESC key, backdrop, delete confirmation, modal structure)
 * - Form state managed by FormModalV2 with external sync pattern
 * - Delete button integrated with FormModalV2
 */

import React, { useEffect } from 'react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { ShoppingItemForm } from '../../types/forms';
import type { Store } from '../../types';
import { CATEGORY_ICONS, STORE_TYPES } from '../../constants';
import { validateCategory, validatePriority } from '../../utils/typeValidators';
import { FormModalV2 } from '@/components/v2';

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

  return (
    <FormModalV2<ShoppingItemForm>
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Item"
      defaultData={formData}
      initialData={formData}
      isPending={false}
      submitText="Save Changes"
      isEditing={true}
      showDelete={true}
      onDelete={async () => {
        onDelete();
      }}
      onSubmit={async (data) => {
        // Create a synthetic form event for backward compatibility
        const syntheticEvent = {
          preventDefault: () => {},
          stopPropagation: () => {},
        } as React.FormEvent;
        onSubmit(syntheticEvent);
      }}
      validate={(data) => {
        if (!data.name.trim()) return 'Item name is required';
        return null;
      }}
    >
      {(formState, setFormState) => {
        // Sync form state changes back to parent
        useEffect(() => {
          onFormChange(formState);
        }, [formState]);

        return (
          <>
            {/* Item Name */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                Item Name *
              </label>
              <input
                type="text"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
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
                  value={formState.quantity}
                  onChange={(e) => setFormState({ ...formState, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                  Unit
                </label>
                <select
                  value={formState.unit}
                  onChange={(e) => setFormState({ ...formState, unit: e.target.value })}
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
                  value={formState.category}
                  onChange={(e) => setFormState({ ...formState, category: validateCategory(e.target.value) })}
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
                  value={formState.priority}
                  onChange={(e) => setFormState({ ...formState, priority: validatePriority(e.target.value) })}
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
                value={formState.preferredStore}
                onChange={(e) => setFormState({ ...formState, preferredStore: e.target.value })}
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
                  value={formState.estimatedPrice}
                  onChange={(e) => setFormState({ ...formState, estimatedPrice: e.target.value })}
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
                  value={formState.brand}
                  onChange={(e) => setFormState({ ...formState, brand: e.target.value })}
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
                value={formState.notes}
                onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                placeholder="Any special notes or preferences..."
                rows={3}
              />
            </div>
          </>
        );
      }}
    </FormModalV2>
  );
};

export default EditItemModalV2;
