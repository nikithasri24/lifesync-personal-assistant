/**
 * AddPantryItemModalV2 Component
 * Together pattern modal for adding items to pantry
 * Features: expiry date tracking, location, low stock threshold
 */

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { PantryItem } from '../../../types';
import { logger } from '../../../services/logger';

const STORAGE_KEY = 'pantry_add_item_draft';

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

export const AddPantryItemModalV2: React.FC<AddPantryItemModalV2Props> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const colors = useThemeColors();
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '1',
    unit: 'pcs',
    category: 'pantry' as PantryItem['category'],
    expiration: '',
    location: '',
    threshold: '',
  });

  // Load draft
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const draft = JSON.parse(saved);
          setFormData(draft);
        }
      } catch (error) {
        logger.error('Shopping', error as Error, { context: 'Failed to load pantry draft' });
      }
    }
  }, [isOpen]);

  // Auto-save
  useEffect(() => {
    if (isOpen && formData.name) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      } catch (error) {
        logger.error('Shopping', error as Error, { context: 'Failed to save pantry draft' });
      }
    }
  }, [isOpen, formData]);

  // ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
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

      localStorage.removeItem(STORAGE_KEY);
      setFormData({ name: '', quantity: '1', unit: 'pcs', category: 'pantry', expiration: '', location: '', threshold: '' });
      onClose();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 z-[60] flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh', maxWidth: '600px' }}
      >
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
        </div>

        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Add to Pantry</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto p-6 space-y-5 flex-1">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                Item Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                  Unit
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
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
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as PantryItem['category'] })}
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
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                  value={formData.expiration}
                  onChange={(e) => setFormData({ ...formData, expiration: e.target.value })}
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
                  value={formData.threshold}
                  onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                  placeholder="e.g., 1"
                />
              </div>
            </div>
          </div>

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
              style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
            >
              {isPending ? 'Adding...' : 'Add to Pantry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPantryItemModalV2;
