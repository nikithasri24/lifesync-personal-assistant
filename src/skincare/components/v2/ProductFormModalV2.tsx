/**
 * ProductFormModalV2 Component
 * Together pattern modal for adding/editing skincare products
 * Features: auto-save, ESC/backdrop support, product details, rating
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ProductFormData {
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
}

export const ProductFormModalV2: React.FC<ProductFormModalV2Props> = ({
  isOpen,
  onClose,
  product,
  isEditing = false,
  onSubmit,
}) => {
  const STORAGE_KEY = 'selfcare_product_draft';

  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  };

  const savedDraft = !product ? loadDraft() : null;

  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || savedDraft?.name || '',
    brand: product?.brand || savedDraft?.brand || '',
    category: product?.category || savedDraft?.category || 'cleanser',
    rating: product?.rating || savedDraft?.rating || 0,
    useFrequency: product?.useFrequency || savedDraft?.useFrequency || '',
    purchaseDate: product?.purchaseDate || savedDraft?.purchaseDate || '',
    expiryDate: product?.expiryDate || savedDraft?.expiryDate || '',
    notes: product?.notes || savedDraft?.notes || '',
  });

  const [isPending, setIsPending] = useState(false);

  // Auto-save on change
  useEffect(() => {
    if (formData.name || formData.brand) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData]);

  // ESC key support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.brand.trim()) {
      return;
    }

    setIsPending(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        category: formData.category,
        rating: formData.rating,
        useFrequency: formData.useFrequency.trim(),
        purchaseDate: formData.purchaseDate,
        expiryDate: formData.expiryDate,
        notes: formData.notes.trim(),
      });
      localStorage.removeItem(STORAGE_KEY);
      onClose();
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setIsPending(false);
    }
  };

  if (!isOpen) return null;

  const categories = [
    { value: 'cleanser', label: 'Cleanser', emoji: '🧼' },
    { value: 'toner', label: 'Toner', emoji: '💧' },
    { value: 'serum', label: 'Serum', emoji: '✨' },
    { value: 'moisturizer', label: 'Moisturizer', emoji: '🧴' },
    { value: 'sunscreen', label: 'Sunscreen', emoji: '☀️' },
    { value: 'mask', label: 'Mask', emoji: '🎭' },
    { value: 'exfoliant', label: 'Exfoliant', emoji: '🔄' },
    { value: 'eye-cream', label: 'Eye Cream', emoji: '👁️' },
  ];

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
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Product' : 'Add Product'}
          </h2>
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
        <div
          className="overflow-y-auto p-6 space-y-5 flex-1"
          style={{ maxHeight: 'calc(90vh - 140px)' }}
        >
          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Hydrating Face Cream"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              required
              autoFocus
            />
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Brand
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="e.g., CeraVe, The Ordinary"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    formData.category === cat.value
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rating (optional)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="text-3xl transition-all"
                  style={{ color: star <= formData.rating ? '#D4A574' : '#E8DCC8' }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Use Frequency */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Use Frequency (optional)
            </label>
            <input
              type="text"
              value={formData.useFrequency}
              onChange={(e) => setFormData({ ...formData, useFrequency: e.target.value })}
              placeholder="e.g., Daily AM, 2x per week"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Purchase Date
              </label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this product..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
            />
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
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !formData.name.trim() || !formData.brand.trim()}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            }}
          >
            {isPending ? 'Saving...' : (isEditing ? 'Update Product' : 'Add Product')}
          </button>
        </div>
      </div>
    </div>
  );
};
