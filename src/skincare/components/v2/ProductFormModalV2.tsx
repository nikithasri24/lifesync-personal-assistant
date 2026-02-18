/**
 * ProductFormModalV2 Component - MIGRATED to use FormModalV2
 * Together pattern modal for adding/editing skincare products
 *
 * MIGRATION COMPLETE:
 * - Reduced from 330 lines to ~230 lines (30% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - 8 product categories with emoji, star rating system
 */

import React from 'react';
import { FormModalV2 } from '@/components/v2';

export interface ProductFormData {
  name: string;
  brand: string;
  category: string;
  rating?: number;
  useFrequency?: string;
  purchaseDate?: string;
  expiryDate?: string;
  notes?: string;
}

interface ProductFormState {
  name: string;
  brand: string;
  category: string;
  rating: number;
  useFrequency: string;
  purchaseDate: string;
  expiryDate: string;
  notes: string;
}

interface ProductFormModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  product?: {
    id: string;
    name: string;
    brand: string;
    category: string;
    rating?: number;
    useFrequency?: string;
    purchaseDate?: string;
    expiryDate?: string;
    notes?: string;
  };
  isEditing?: boolean;
  onSubmit: (data: any) => Promise<void>;
  isPending?: boolean;
}

const CATEGORIES = [
  { value: 'cleanser', label: 'Cleanser', emoji: '🧼' },
  { value: 'toner', label: 'Toner', emoji: '💧' },
  { value: 'serum', label: 'Serum', emoji: '✨' },
  { value: 'moisturizer', label: 'Moisturizer', emoji: '🧴' },
  { value: 'sunscreen', label: 'Sunscreen', emoji: '☀️' },
  { value: 'mask', label: 'Mask', emoji: '🎭' },
  { value: 'exfoliant', label: 'Exfoliant', emoji: '🔄' },
  { value: 'eye-cream', label: 'Eye Cream', emoji: '👁️' },
];

export const ProductFormModalV2: React.FC<ProductFormModalV2Props> = ({
  isOpen,
  onClose,
  product,
  isEditing = false,
  onSubmit,
  isPending = false,
}) => {
  const defaultFormData: ProductFormState = {
    name: '',
    brand: '',
    category: 'cleanser',
    rating: 0,
    useFrequency: '',
    purchaseDate: '',
    expiryDate: '',
    notes: '',
  };

  const initialFormData: ProductFormState | undefined = product ? {
    name: product.name,
    brand: product.brand,
    category: product.category,
    rating: product.rating || 0,
    useFrequency: product.useFrequency || '',
    purchaseDate: product.purchaseDate || '',
    expiryDate: product.expiryDate || '',
    notes: product.notes || '',
  } : undefined;

  return (
    <FormModalV2<ProductFormState>
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Product' : 'Add Product'}
      defaultData={defaultFormData}
      initialData={initialFormData}
      draftKey={product ? undefined : 'skincare_product_modal_draft'}
      isPending={isPending}
      submitText={isEditing ? 'Update Product' : 'Add Product'}
      isEditing={isEditing}
      onSubmit={async (formData) => {
        const productData: ProductFormData = {
          name: formData.name.trim(),
          brand: formData.brand.trim(),
          category: formData.category,
          rating: formData.rating || undefined,
          useFrequency: formData.useFrequency.trim() || undefined,
          purchaseDate: formData.purchaseDate || undefined,
          expiryDate: formData.expiryDate || undefined,
          notes: formData.notes.trim() || undefined,
        };
        await onSubmit(productData);
      }}
      validate={(formData) => {
        if (!formData.name.trim()) return 'Please enter a product name';
        if (!formData.brand.trim()) return 'Please enter a brand';
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              placeholder="e.g., Hydrating Face Cream"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              required
              autoFocus
            />
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Brand <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formState.brand}
              onChange={(e) => setFormState({ ...formState, brand: e.target.value })}
              placeholder="e.g., CeraVe, The Ordinary"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormState({ ...formState, category: cat.value })}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    formState.category === cat.value
                      ? 'bg-terracotta-100 text-terracotta-600 border-2 border-terracotta-400'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormState({ ...formState, rating: star })}
                  className="text-3xl transition-all"
                  style={{ color: star <= formState.rating ? '#D4A574' : '#E8DCC8' }}
                  aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Use Frequency */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Use Frequency
            </label>
            <input
              type="text"
              value={formState.useFrequency}
              onChange={(e) => setFormState({ ...formState, useFrequency: e.target.value })}
              placeholder="e.g., Daily AM, 2x per week"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Purchase Date
              </label>
              <input
                type="date"
                value={formState.purchaseDate}
                onChange={(e) => setFormState({ ...formState, purchaseDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                value={formState.expiryDate}
                onChange={(e) => setFormState({ ...formState, expiryDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Notes
            </label>
            <textarea
              rows={3}
              value={formState.notes}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              placeholder="Add any notes about this product..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
            />
          </div>
        </>
      )}
    </FormModalV2>
  );
};
