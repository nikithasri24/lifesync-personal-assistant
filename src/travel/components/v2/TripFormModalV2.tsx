/**
 * TripFormModalV2 Component - MIGRATED to use FormModalV2
 * Together pattern modal for trip creation/editing
 *
 * MIGRATION COMPLETE:
 * - Reduced from 326 lines to ~240 lines (26% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - Status button grid with 4 options, budget/currency, date range
 */

import React from 'react';
import { FormModalV2 } from '@/components/v2';

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
  isPending?: boolean;
}

export const TripFormModalV2: React.FC<TripFormModalV2Props> = ({
  isOpen,
  onClose,
  trip,
  isEditing = false,
  onSubmit,
  isPending = false,
}) => {
  const defaultFormData: TripFormData = {
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'planning',
    budget: '',
    currency: 'USD',
    tags: '',
  };

  const initialData = trip ? {
    name: trip.name || '',
    description: trip.description || '',
    startDate: trip.startDate || '',
    endDate: trip.endDate || '',
    status: trip.status || 'planning',
    budget: trip.budget?.toString() || '',
    currency: trip.currency || 'USD',
    tags: trip.tags?.join(', ') || '',
  } : undefined;

  return (
    <FormModalV2<TripFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Trip' : 'Create Trip'}
      defaultData={defaultFormData}
      initialData={initialData}
      draftKey={isEditing ? undefined : 'travel_trip_draft'}
      isPending={isPending}
      submitText={isEditing ? 'Update Trip' : 'Create Trip'}
      isEditing={isEditing}
      onSubmit={async (formData) => {
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
      }}
      validate={(formData) => {
        if (!formData.name.trim()) return 'Trip name is required';
        if (!formData.startDate) return 'Start date is required';
        if (!formData.endDate) return 'End date is required';
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* Trip Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Trip Name
            </label>
            <input
              type="text"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
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
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
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
                value={formState.startDate}
                onChange={(e) => setFormState({ ...formState, startDate: e.target.value })}
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
                value={formState.endDate}
                onChange={(e) => setFormState({ ...formState, endDate: e.target.value })}
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
                  onClick={() => setFormState({ ...formState, status: s })}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    formState.status === s
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
                value={formState.budget}
                onChange={(e) => setFormState({ ...formState, budget: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={formState.currency}
                onChange={(e) => setFormState({ ...formState, currency: e.target.value })}
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
              value={formState.tags}
              onChange={(e) => setFormState({ ...formState, tags: e.target.value })}
              placeholder="backpacking, business, family"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            />
            <p className="text-xs mt-1 text-gray-500">
              Separate tags with commas
            </p>
          </div>
        </>
      )}
    </FormModalV2>
  );
};
