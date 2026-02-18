/**
 * AddStoreModalV2 Component
 * Together pattern modal for adding new stores
 * Features: store details, auto-save
 */

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { STORE_TYPES } from '../../constants';
import { logger } from '../../../services/logger';

const STORAGE_KEY = 'shopping_add_store_draft';

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

export const AddStoreModalV2: React.FC<AddStoreModalV2Props> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const colors = useThemeColors();
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'grocery',
    address: '',
    phone: '',
    website: '',
  });

  // Load draft
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setFormData(JSON.parse(saved));
        }
      } catch (error) {
        logger.error('Shopping', error as Error, { context: 'Failed to load store draft' });
      }
    }
  }, [isOpen]);

  // Auto-save
  useEffect(() => {
    if (isOpen && formData.name) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      } catch (error) {
        logger.error('Shopping', error as Error, { context: 'Failed to save store draft' });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      onSubmit({
        name: formData.name,
        type: formData.type,
        address: formData.address || undefined,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
      });
      localStorage.removeItem(STORAGE_KEY);
      setFormData({ name: '', type: 'grocery', address: '', phone: '', website: '' });
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
          <h2 className="text-2xl font-bold text-gray-900">Add Store</h2>
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
                Store Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="https://store.com"
              />
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
              {isPending ? 'Adding...' : 'Add Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStoreModalV2;
