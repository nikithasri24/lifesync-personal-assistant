/**
 * VisaEditor Component
 * Modal for creating and editing user visas
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { UserVisa } from '../types/visa';
import { logger } from '@/services/logger';
import { useAuth } from '@/hooks/useAuth';

interface VisaEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<UserVisa>) => Promise<void>;
  onDelete?: (visaId: string) => Promise<void>;
  visa?: UserVisa; // undefined = create mode
  availableCountries: string[];
}

const VISA_TYPES = [
  { value: '', label: 'Not specified' },
  { value: 'Tourist', label: 'Tourist' },
  { value: 'Business (B1/B2)', label: 'Business (B1/B2)' },
  { value: 'H1B Work Visa', label: 'H1B Work Visa' },
  { value: 'Schengen', label: 'Schengen' },
  { value: 'Student (F1/M1)', label: 'Student (F1/M1)' },
  { value: 'Long-term Residence', label: 'Long-term Residence' },
  { value: 'Transit', label: 'Transit' },
  { value: 'Other', label: 'Other' },
];

export const VisaEditor: React.FC<VisaEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  visa,
  availableCountries,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<UserVisa>>({
    countryCode: '',
    countryName: '',
    visaType: '',
    issueDate: '',
    expiryDate: '',
    multipleEntry: true,
    maxStayDays: undefined,
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (visa) {
        // Edit mode
        setFormData({
          countryCode: visa.countryCode,
          countryName: visa.countryName,
          visaType: visa.visaType || '',
          issueDate: visa.issueDate || '',
          expiryDate: visa.expiryDate,
          multipleEntry: visa.multipleEntry,
          maxStayDays: visa.maxStayDays,
          notes: visa.notes || '',
        });
        logger.debug('Travel', 'VisaEditor opened in edit mode', { visaId: visa.id });
      } else {
        // Create mode
        setFormData({
          countryCode: '',
          countryName: '',
          visaType: '',
          issueDate: '',
          expiryDate: '',
          multipleEntry: true,
          maxStayDays: undefined,
          notes: '',
        });
        logger.debug('Travel', 'VisaEditor opened in create mode');
      }
      setError('');
    }
  }, [isOpen, visa]);

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

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryName = e.target.value;
    // In real implementation, you'd map country name to country code
    // For now, we'll use a simplified approach
    setFormData({
      ...formData,
      countryName,
      countryCode: countryName.substring(0, 2).toUpperCase(), // Simplified
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.countryName?.trim()) {
      setError('Please select a country');
      return;
    }

    if (!formData.expiryDate) {
      setError('Expiry date is required');
      return;
    }

    // Validate expiry date is in the future
    const expiryDate = new Date(formData.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expiryDate < today) {
      setError('Expiry date must be in the future');
      return;
    }

    // Validate maxStayDays if provided
    if (formData.maxStayDays !== undefined && formData.maxStayDays !== null) {
      if (formData.maxStayDays < 1 || formData.maxStayDays > 999) {
        setError('Max stay days must be between 1 and 999');
        return;
      }
    }

    try {
      setSaving(true);
      logger.debug('Travel', 'Saving visa', {
        mode: visa ? 'edit' : 'create',
        country: formData.countryName,
        visaType: formData.visaType,
      });

      await onSave(formData);
      logger.info('Travel', 'Visa saved successfully', {
        country: formData.countryName,
        visaType: formData.visaType,
      });
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save visa';
      setError(errorMessage);
      logger.error('Travel', err instanceof Error ? err : new Error(String(err)), {
        context: 'saveVisa',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!visa || !onDelete) return;
    setIsDeleteConfirmationOpen(true);
  };

  const confirmDelete = async () => {
    if (!visa || !onDelete) {
      setIsDeleteConfirmationOpen(false);
      return;
    }

    try {
      setSaving(true);
      logger.debug('Travel', 'Deleting visa', { visaId: visa.id });
      await onDelete(visa.id);
      logger.info('Travel', 'Visa deleted successfully', { visaId: visa.id });
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete visa';
      setError(errorMessage);
      logger.error('Travel', err instanceof Error ? err : new Error(String(err)), {
        context: 'deleteVisa',
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

  if (!isOpen) return null;

  const isOwnVisa = !visa || visa.userId === user?.id;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={handleBackdropClick}
      >
        <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {visa ? `Edit ${visa.countryName} Visa` : 'Add Visa'}
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
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
                {error}
              </div>
            )}

            {/* Country Selection */}
            <div>
              <label
                htmlFor="country"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Country *
              </label>
              <select
                id="country"
                value={formData.countryName}
                onChange={handleCountryChange}
                disabled={!!visa} // Can't change country in edit mode
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                required
              >
                <option value="">Select a country</option>
                {availableCountries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            {/* Visa Type */}
            <div>
              <label
                htmlFor="visaType"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Visa Type
              </label>
              <select
                id="visaType"
                value={formData.visaType}
                onChange={(e) => setFormData({ ...formData, visaType: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {VISA_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Some visa types grant access to additional countries (e.g., H1B → Mexico, Schengen
                → Albania)
              </p>
            </div>

            {/* Issue and Expiry Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="issueDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Issue Date
                </label>
                <input
                  id="issueDate"
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="expiryDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Expiry Date *
                </label>
                <input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Max Stay Days */}
            <div>
              <label
                htmlFor="maxStayDays"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Maximum Stay Days
              </label>
              <input
                id="maxStayDays"
                type="number"
                min="1"
                max="999"
                value={formData.maxStayDays ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxStayDays: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional (e.g., 90)"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Maximum consecutive days allowed per visit
              </p>
            </div>

            {/* Multiple Entry Checkbox */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.multipleEntry}
                  onChange={(e) => setFormData({ ...formData, multipleEntry: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Multiple entry visa
                </span>
              </label>
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
                rows={3}
                placeholder="Any additional notes about this visa..."
              />
            </div>
          </form>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div>
                {visa && onDelete && isOwnVisa && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Delete visa"
                  >
                    Delete
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
                  {saving ? 'Saving...' : visa ? 'Save Changes' : 'Add Visa'}
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
              Delete Visa
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this visa? This action cannot be undone.
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

export default VisaEditor;
