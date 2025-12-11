/**
 * ProductFormModal - Add/Edit skincare product
 */

import React from 'react';
import { X, Save } from 'lucide-react';
import type { SkincareProduct, SkincareProductInput, ProductCategory, UsageTime } from '../types';

type ProductFormModalProps = {
  product?: SkincareProduct;
  onSave: (product: SkincareProductInput) => void;
  onClose: () => void;
};

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  onSave,
  onClose,
}): JSX.Element => {
  const [formData, setFormData] = React.useState<SkincareProductInput>({
    name: product?.name ?? '',
    brand: product?.brand ?? '',
    category: product?.category ?? 'other',
    productType: product?.productType ?? '',
    usageTime: product?.usageTime ?? ['AM'],
    currentlyUsing: product?.currentlyUsing ?? true,
    notes: product?.notes ?? '',
    price: product?.price,
    size: product?.size ?? '',
    rating: product?.rating,
  });

  const categories: { value: ProductCategory; label: string }[] = [
    { value: 'cleanser', label: 'Cleanser' },
    { value: 'toner', label: 'Toner' },
    { value: 'serum', label: 'Serum' },
    { value: 'moisturizer', label: 'Moisturizer' },
    { value: 'sunscreen', label: 'Sunscreen' },
    { value: 'treatment', label: 'Treatment' },
    { value: 'mask', label: 'Mask' },
    { value: 'eye_cream', label: 'Eye Cream' },
    { value: 'exfoliant', label: 'Exfoliant' },
    { value: 'oil', label: 'Oil' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Product name is required');
      return;
    }

    // Ensure usageTime is an array
    const cleanedData: SkincareProductInput = {
      ...formData,
      usageTime: Array.isArray(formData.usageTime) && formData.usageTime.length > 0
        ? formData.usageTime
        : ['AM'],
      brand: formData.brand || undefined,
      productType: formData.productType || undefined,
      notes: formData.notes || undefined,
      size: formData.size || undefined,
    };

    onSave(cleanedData);
  };

  const handleUsageTimeChange = (time: UsageTime): void => {
    const current = formData.usageTime;
    if (current.includes(time)) {
      // Remove if already selected (but keep at least one)
      if (current.length > 1) {
        setFormData({
          ...formData,
          usageTime: current.filter((t: UsageTime) => t !== time),
        });
      }
    } else {
      // Add if not selected
      setFormData({
        ...formData,
        usageTime: [...current, time],
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., CeraVe Hydrating Cleanser"
              required
            />
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={e => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., CeraVe"
            />
          </div>

          {/* Category & Product Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Type
              </label>
              <input
                type="text"
                value={formData.productType}
                onChange={e => setFormData({ ...formData, productType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., gel, cream, foam"
              />
            </div>
          </div>

          {/* Usage Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usage Time *
            </label>
            <div className="flex gap-3">
              {(['AM', 'PM', 'BOTH'] as UsageTime[]).map(time => (
                <button
                  key={time}
                  type="button"
                  onClick={() => handleUsageTimeChange(time)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    formData.usageTime.includes(time)
                      ? time === 'AM'
                        ? 'bg-amber-100 border-amber-600 text-amber-700'
                        : time === 'PM'
                        ? 'bg-indigo-100 border-indigo-600 text-indigo-700'
                        : 'bg-purple-100 border-purple-600 text-purple-700'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Price & Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price ?? ''}
                onChange={e => {
                  const value = e.target.value;
                  const numericValue = value ? Number(value) : undefined;
                  setFormData({ ...formData, price: numericValue });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="19.99"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Size
              </label>
              <input
                type="text"
                value={formData.size ?? ''}
                onChange={e => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 50ml, 1oz"
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className={`text-2xl transition-colors ${
                    (formData.rating !== undefined && star <= formData.rating)
                      ? 'text-yellow-500'
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  ★
                </button>
              ))}
              {formData.rating !== undefined && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: undefined })}
                  className="ml-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Currently Using */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="currentlyUsing"
              checked={formData.currentlyUsing}
              onChange={e => setFormData({ ...formData, currentlyUsing: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="currentlyUsing" className="text-sm font-medium text-gray-700">
              Currently using this product
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any observations, how it makes your skin feel, etc."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="h-5 w-5" />
              {product ? 'Update' : 'Add'} Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
