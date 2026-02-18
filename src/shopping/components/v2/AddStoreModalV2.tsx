/**
 * AddStoreModalV2 Component - MIGRATED to use FormModalV2
 * Together pattern modal for adding new stores
 *
 * MIGRATION COMPLETE:
 * - Reduced from 229 lines to ~140 lines (39% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - Auto-save with draftKey
 */

import React from 'react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { STORE_TYPES } from '../../constants';
import { FormModalV2 } from '@/components/v2';

interface AddStoreModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (storeData: {
    name: string;
    type: string;
    address?: string;
    phone?: string;
    website?: string;
  }) => void;
}

interface StoreFormData {
  name: string;
  type: string;
  address: string;
  phone: string;
  website: string;
}

export const AddStoreModalV2: React.FC<AddStoreModalV2Props> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const colors = useThemeColors();

  const defaultFormData: StoreFormData = {
    name: '',
    type: 'grocery',
    address: '',
    phone: '',
    website: '',
  };

  return (
    <FormModalV2<StoreFormData>
      isOpen={isOpen}
      onClose={onClose}
      title="Add Store"
      defaultData={defaultFormData}
      draftKey="shopping_add_store_draft"
      isPending={false}
      submitText="Add Store"
      onSubmit={async (formData) => {
        onSubmit({
          name: formData.name,
          type: formData.type,
          address: formData.address || undefined,
          phone: formData.phone || undefined,
          website: formData.website || undefined,
        });
      }}
      validate={(formData) => {
        if (!formData.name.trim()) return 'Store name is required';
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
              Store Name *
            </label>
            <input
              type="text"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="e.g., Trader Joe's"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
              Store Type
            </label>
            <select
              value={formState.type}
              onChange={(e) => setFormState({ ...formState, type: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            >
              {STORE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
              Address (optional)
            </label>
            <input
              type="text"
              value={formState.address}
              onChange={(e) => setFormState({ ...formState, address: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="123 Main St, City, State"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
              Phone (optional)
            </label>
            <input
              type="tel"
              value={formState.phone}
              onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
              Website (optional)
            </label>
            <input
              type="url"
              value={formState.website}
              onChange={(e) => setFormState({ ...formState, website: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="https://store.com"
            />
          </div>
        </>
      )}
    </FormModalV2>
  );
};

export default AddStoreModalV2;
