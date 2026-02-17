/**
 * PassportEditor Component
 * Modal for creating and editing user passports
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { UserPassport } from '../types/visa';
import { logger } from '@/services/logger';
import { useAuth } from '@/hooks/useAuth';

interface PassportEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<UserPassport>) => Promise<void>;
  onDelete?: (passportId: string) => Promise<void>;
  passport?: UserPassport; // undefined = create mode
  availableCountries: string[];
}

export const PassportEditor: React.FC<PassportEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  passport,
  availableCountries,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<UserPassport>>({
    countryCode: '',
    countryName: '',
    passportNumber: '',
    issueDate: '',
    expiryDate: '',
    isPrimary: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (passport) {
        // Edit mode
        setFormData({
          countryCode: passport.countryCode,
          countryName: passport.countryName,
          passportNumber: passport.passportNumber || '',
          issueDate: passport.issueDate || '',
          expiryDate: passport.expiryDate || '',
          isPrimary: passport.isPrimary,
        });
        logger.debug('Travel', 'PassportEditor opened in edit mode', { passportId: passport.id });
      } else {
        // Create mode
        setFormData({
          countryCode: '',
          countryName: '',
          passportNumber: '',
          issueDate: '',
          expiryDate: '',
          isPrimary: false,
        });
        logger.debug('Travel', 'PassportEditor opened in create mode');
      }
      setError('');
    }
  }, [isOpen, passport]);

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

    // Validate dates if both are provided
    if (formData.issueDate && formData.expiryDate) {
      const issueDate = new Date(formData.issueDate);
      const expiryDate = new Date(formData.expiryDate);
      if (expiryDate <= issueDate) {
        setError('Expiry date must be after issue date');
        return;
      }
    }

    try {
      setSaving(true);
      logger.debug('Travel', 'Saving passport', {
        mode: passport ? 'edit' : 'create',
        country: formData.countryName,
      });

      await onSave(formData);
      logger.info('Travel', 'Passport saved successfully', { country: formData.countryName });
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save passport';
      setError(errorMessage);
      logger.error('Travel', err instanceof Error ? err : new Error(String(err)), {
        context: 'savePassport',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!passport || !onDelete) return;
    setIsDeleteConfirmationOpen(true);
  };

  const confirmDelete = async () => {
    if (!passport || !onDelete) {
      setIsDeleteConfirmationOpen(false);
      return;
    }

    try {
      setSaving(true);
      logger.debug('Travel', 'Deleting passport', { passportId: passport.id });
      await onDelete(passport.id);
      logger.info('Travel', 'Passport deleted successfully', { passportId: passport.id });
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete passport';
      setError(errorMessage);
      logger.error('Travel', err instanceof Error ? err : new Error(String(err)), {
        context: 'deletePassport',
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

  const isOwnPassport = !passport || passport.userId === user?.id;

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
              {passport ? `Edit ${passport.countryName} Passport` : 'Add Passport'}
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
                disabled={!!passport} // Can't change country in edit mode
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#CD9D6F] disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Passport Number */}
            <div>
              <label
                htmlFor="passportNumber"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Passport Number
              </label>
              <input
                id="passportNumber"
                type="text"
                value={formData.passportNumber}
                onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CD9D6F]"
                placeholder="Optional"
              />
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
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#CD9D6F]"
                />
              </div>

              <div>
                <label
                  htmlFor="expiryDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Expiry Date
                </label>
                <input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#CD9D6F]"
                />
              </div>
            </div>

            {/* Set as Primary Checkbox */}
            {(!passport || !passport.isPrimary) && (
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600 text-[#C18B5E] focus:ring-[#CD9D6F]"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Set as primary passport
                  </span>
                </label>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div>
                {passport && onDelete && isOwnPassport && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Delete passport"
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
                  className="px-4 py-2 bg-[#C18B5E] hover:bg-[#B5795A] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : passport ? 'Save Changes' : 'Add Passport'}
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
              Delete Passport
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this passport? This action cannot be undone.
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

export default PassportEditor;
