/**
 * AddPantryItemModalV2 Component - MIGRATED to use FormModalV2
 * Together pattern modal for adding items to pantry
 *
 * MIGRATION COMPLETE:
 * - Reduced from 278 lines to ~180 lines (35% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - Auto-save with draftKey
 */

import React from 'react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { PantryItem } from '../../../types';
import { FormModalV2 } from '@/components/v2';

interface AddPantryItemModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: {
    name: string;
    quantity: number;
    unit?: string;
    category: PantryItem['category'];
    expirationDate?: Date;
    location?: string;
    lowStockThreshold?: number;
    isLowStock?: boolean;
  }) => Promise<void>;
}

interface PantryItemFormData {
  name: string;
  quantity: string;
  unit: string;
  category: PantryItem['category'];
  expiration: string;
  location: string;
  threshold: string;
}

export const AddPantryItemModalV2: React.FC<AddPantryItemModalV2Props> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const colors = useThemeColors();

  const defaultFormData: PantryItemFormData = {
    name: '',
    quantity: '1',
    unit: 'pcs',
    category: 'pantry',
    expiration: '',
    location: '',
    threshold: '',
  };

  return (
    <FormModalV2<PantryItemFormData>
      isOpen={isOpen}
      onClose={onClose}
      title="Add to Pantry"
      defaultData={defaultFormData}
      draftKey="pantry_add_item_draft"
      isPending={false}
      submitText="Add to Pantry"
      onSubmit={async (formData) => {
        const qty = Number(formData.quantity) || 1;
        const exp = formData.expiration ? new Date(formData.expiration) : undefined;
        const threshold = formData.threshold ? Number(formData.threshold) : undefined;

        await onSave({
          name: formData.name.trim(),
          quantity: qty,
          unit: formData.unit || undefined,
          category: formData.category,
          expirationDate: exp,
          location: formData.location || undefined,
          lowStockThreshold: threshold,
          isLowStock: threshold ? qty <= threshold : undefined,
        });
      }}
      validate={(formData) => {
        if (!formData.name.trim()) return 'Item name is required';
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
              Item Name *
            </label>
            <input
              type="text"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                Quantity
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formState.quantity}
                onChange={(e) => setFormState({ ...formState, quantity: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                Unit
              </label>
              <input
                type="text"
                value={formState.unit}
                onChange={(e) => setFormState({ ...formState, unit: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="pcs, lbs, oz..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                Category
              </label>
              <select
                value={formState.category}
                onChange={(e) => setFormState({ ...formState, category: e.target.value as PantryItem['category'] })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              >
                <option value="pantry">🥫 Pantry</option>
                <option value="dairy">🥛 Dairy</option>
                <option value="meat">🥩 Meat</option>
                <option value="produce">🥬 Produce</option>
                <option value="bakery">🍞 Bakery</option>
                <option value="other">📦 Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                Location
              </label>
              <select
                value={formState.location}
                onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              >
                <option value="">Select...</option>
                <option value="fridge">🧊 Fridge</option>
                <option value="freezer">❄️ Freezer</option>
                <option value="pantry">🗄️ Pantry</option>
                <option value="counter">🪑 Counter</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                Expiry Date
              </label>
              <input
                type="date"
                value={formState.expiration}
                onChange={(e) => setFormState({ ...formState, expiration: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                Low Stock Alert
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formState.threshold}
                onChange={(e) => setFormState({ ...formState, threshold: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="e.g., 1"
              />
            </div>
          </div>
        </>
      )}
    </FormModalV2>
  );
};

export default AddPantryItemModalV2;
