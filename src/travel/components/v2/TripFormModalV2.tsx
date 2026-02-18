/**
 * TripFormModalV2 Component
 * Together pattern modal for trip creation/editing
 * Features: Status button grid, budget+currency, tags, dates, auto-save
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { logger } from '@/services/logger';

type TripStatus = 'planning' | 'upcoming' | 'in_progress' | 'completed';

interface TripFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  budget: string;
  currency: string;
  tags: string;
}

interface TripFormModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  trip?: {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    status: TripStatus;
    budget?: number;
    currency?: string;
    tags?: string[];
  };
  isEditing?: boolean;
  onSubmit: (data: any) => Promise<void>;
}

export const TripFormModalV2: React.FC<TripFormModalV2Props> = ({
  isOpen,
  onClose,
  trip,
  isEditing = false,
  onSubmit,
}) => {
  const colors = useThemeColors();
  const STORAGE_KEY = 'travel_trip_draft';

  // Auto-save draft logic
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      logger.error('Travel', error as Error, { context: 'Failed to load trip draft' });
    }
    return null;
  };

  const savedDraft = !trip ? loadDraft() : null;

  const [formData, setFormData] = useState<TripFormData>({
    name: trip?.name || savedDraft?.name || '',
    description: trip?.description || savedDraft?.description || '',
    startDate: trip?.startDate || savedDraft?.startDate || '',
    endDate: trip?.endDate || savedDraft?.endDate || '',
    status: trip?.status || savedDraft?.status || 'planning',
    budget: trip?.budget?.toString() || savedDraft?.budget || '',
    currency: trip?.currency || savedDraft?.currency || 'USD',
    tags: trip?.tags?.join(', ') || savedDraft?.tags || '',
  });

  const [isPending, setIsPending] = useState(false);

  // Auto-save on change
  useEffect(() => {
    if (formData.name || formData.description || formData.startDate) {
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
    if (!formData.name.trim() || !formData.startDate || !formData.endDate) {
      return;
    }

    setIsPending(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        currency: formData.currency,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
      localStorage.removeItem(STORAGE_KEY);
      onClose();
    } catch (error) {
      logger.error('Travel', error as Error, { context: 'Failed to save trip' });
    } finally {
      setIsPending(false);
    }
  };

  if (!isOpen) return null;

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
            {isEditing ? 'Edit Trip' : 'Create Trip'}
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
          {/* Trip Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Trip Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Summer Europe Trip"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Trip details and highlights..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['planning', 'upcoming', 'in_progress', 'completed'] as TripStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData({ ...formData, status: s })}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    formData.status === s
                      ? 'bg-terracotta-100 text-terracotta-600 border-2 border-terracotta-400'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                  }`}
                >
                  {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Budget (optional)
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              >
                <option value="USD">💵 USD</option>
                <option value="EUR">💶 EUR</option>
                <option value="GBP">💷 GBP</option>
                <option value="JPY">💴 JPY</option>
                <option value="AUD">🇦🇺 AUD</option>
                <option value="CAD">🇨🇦 CAD</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tags (optional)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="backpacking, business, family"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            />
            <p className="text-xs mt-1 text-gray-500">
              Separate tags with commas
            </p>
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
            disabled={isPending || !formData.name.trim() || !formData.startDate || !formData.endDate}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            }}
          >
            {isPending ? 'Saving...' : (isEditing ? 'Update Trip' : 'Create Trip')}
          </button>
        </div>
      </div>
    </div>
  );
};
