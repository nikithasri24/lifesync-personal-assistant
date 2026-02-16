/**
 * TripEditor Component
 * Modal for creating and editing travel trips
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, DollarSign } from 'lucide-react';
import type { Trip, TripStatus } from '../types';
import { logger } from '@/services/logger';
import { useAuth } from '@/hooks/useAuth';

interface TripEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Trip>) => Promise<void>;
  onDelete?: (tripId: string) => Promise<void>;
  trip?: Trip; // undefined = create mode
}

const TRIP_STATUSES: { value: TripStatus; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const TripEditor: React.FC<TripEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  trip,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<Trip>>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'planning',
    budget: undefined,
    currency: 'USD',
    notes: '',
    tags: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (trip) {
        // Edit mode
        setFormData({
          name: trip.name,
          description: trip.description || '',
          startDate: trip.startDate.split('T')[0],
          endDate: trip.endDate.split('T')[0],
          status: trip.status,
          budget: trip.budget,
          currency: trip.currency || 'USD',
          notes: trip.notes || '',
          tags: trip.tags || [],
        });
        logger.debug('Travel', 'TripEditor opened in edit mode', { tripId: trip.id });
      } else {
        // Create mode - default to today and tomorrow
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        setFormData({
          name: '',
          description: '',
          startDate: today.toISOString().split('T')[0],
          endDate: tomorrow.toISOString().split('T')[0],
          status: 'planning',
          budget: undefined,
          currency: 'USD',
          notes: '',
          tags: [],
        });
        logger.debug('Travel', 'TripEditor opened in create mode');
      }
      setError('');
      setTagInput('');
    }
  }, [isOpen, trip]);

  // Keyboard support - Escape to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleteConfirmationOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, isDeleteConfirmationOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name?.trim()) {
      setError('Please enter a trip name');
      return;
    }

    if (!formData.startDate) {
      setError('Please select a start date');
      return;
    }

    if (!formData.endDate) {
      setError('Please select an end date');
      return;
    }

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (endDate < startDate) {
      setError('End date must be after start date');
      return;
    }

    try {
      setSaving(true);
      logger.debug('Travel', 'Saving trip', {
        mode: trip ? 'edit' : 'create',
        name: formData.name,
      });

      // Convert dates to ISO format
      const tripData = {
        ...formData,
        startDate: new Date(formData.startDate!).toISOString(),
        endDate: new Date(formData.endDate!).toISOString(),
      };

      await onSave(tripData);
      logger.info('Travel', 'Trip saved successfully', { name: formData.name });
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save trip';
      setError(errorMessage);
      logger.error('Travel', err instanceof Error ? err : new Error(String(err)), {
        context: 'saveTrip',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!trip || !onDelete) return;
    setIsDeleteConfirmationOpen(true);
  };

  const confirmDelete = async () => {
    if (!trip || !onDelete) {
      setIsDeleteConfirmationOpen(false);
      return;
    }

    try {
      setSaving(true);
      logger.debug('Travel', 'Deleting trip', { tripId: trip.id });
      await onDelete(trip.id);
      logger.info('Travel', 'Trip deleted successfully', { tripId: trip.id });
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete trip';
      setError(errorMessage);
      logger.error('Travel', err instanceof Error ? err : new Error(String(err)), {
        context: 'deleteTrip',
      });
    } finally {
      setSaving(false);
      setIsDeleteConfirmationOpen(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleteConfirmationOpen) {
      onClose();
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || [],
    });
  };

  if (!isOpen) return null;

  const isOwnTrip = !trip || trip.userId === user?.id;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={handleBackdropClick}
      >
        <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {trip ? `Edit Trip: ${trip.name}` : 'Plan New Trip'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
                {error}
              </div>
            )}

            {/* Trip Name */}
            <div>
              <label
                htmlFor="tripName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Trip Name *
              </label>
              <input
                id="tripName"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Summer Europe Trip, Weekend in Paris"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Brief description of the trip..."
              />
            </div>

            {/* Dates and Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Start Date *
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  <Calendar className="inline h-4 w-4 mr-1" />
                  End Date *
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as TripStatus })
                  }
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TRIP_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Budget and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="budget"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Budget
                </label>
                <input
                  id="budget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.budget ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      budget: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label
                  htmlFor="currency"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Currency
                </label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <MapPin className="inline h-4 w-4 mr-1" />
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., backpacking, business, family"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-900 dark:hover:text-blue-100"
                        aria-label={`Remove ${tag} tag`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Trip notes, itinerary details, packing list, etc..."
              />
            </div>
          </form>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div>
                {trip && onDelete && isOwnTrip && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Delete trip"
                  >
                    Delete Trip
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : trip ? 'Save Changes' : 'Create Trip'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmationOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delete Trip
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this trip? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteConfirmationOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TripEditor;
