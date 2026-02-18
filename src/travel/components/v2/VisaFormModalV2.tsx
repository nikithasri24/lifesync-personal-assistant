/**
 * VisaFormModalV2 Component
 * Together pattern modal for visa tracking
 * Features: Country dropdown with flags, visa type button grid, entry type radio cards, expiry warning, auto-save
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

type VisaType = 'tourist' | 'business' | 'work' | 'student' | 'transit';
type EntryType = 'single' | 'multiple';

interface VisaFormData {
  country: string;
  visaType: VisaType;
  issueDate: string;
  expiryDate: string;
  visaNumber: string;
  entryType: EntryType;
  notes: string;
}

interface VisaFormModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  visa?: {
    id: string;
    country: string;
    visaType: VisaType;
    issueDate: string;
    expiryDate: string;
    visaNumber?: string;
    entryType: EntryType;
    notes?: string;
  };
  isEditing?: boolean;
  onSubmit: (data: any) => Promise<void>;
}

export const VisaFormModalV2: React.FC<VisaFormModalV2Props> = ({
  isOpen,
  onClose,
  visa,
  isEditing = false,
  onSubmit,
}) => {
  const colors = useThemeColors();
  const STORAGE_KEY = 'travel_visa_draft';

  // Auto-save draft logic
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  };

  const savedDraft = !visa ? loadDraft() : null;

  const [formData, setFormData] = useState<VisaFormData>({
    country: visa?.country || savedDraft?.country || '',
    visaType: visa?.visaType || savedDraft?.visaType || 'tourist',
    issueDate: visa?.issueDate || savedDraft?.issueDate || '',
    expiryDate: visa?.expiryDate || savedDraft?.expiryDate || '',
    visaNumber: visa?.visaNumber || savedDraft?.visaNumber || '',
    entryType: visa?.entryType || savedDraft?.entryType || 'single',
    notes: visa?.notes || savedDraft?.notes || '',
  });

  const [isPending, setIsPending] = useState(false);

  // Auto-save on change
  useEffect(() => {
    if (formData.country || formData.issueDate) {
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

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string): number => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const daysLeft = formData.expiryDate ? getDaysUntilExpiry(formData.expiryDate) : null;

  const handleSubmit = async () => {
    if (!formData.country || !formData.issueDate || !formData.expiryDate) {
      return;
    }

    setIsPending(true);
    try {
      await onSubmit({
        country: formData.country,
        visaType: formData.visaType,
        issueDate: formData.issueDate,
        expiryDate: formData.expiryDate,
        visaNumber: formData.visaNumber || undefined,
        entryType: formData.entryType,
        notes: formData.notes || undefined,
      });
      localStorage.removeItem(STORAGE_KEY);
      onClose();
    } catch (error) {
      console.error('Failed to save visa:', error);
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
            {isEditing ? 'Edit Visa' : 'Add Visa'}
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
          {/* Country */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Country
            </label>
            <select
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              required
            >
              <option value="">Select country...</option>
              <option value="US">🇺🇸 United States</option>
              <option value="GB">🇬🇧 United Kingdom</option>
              <option value="JP">🇯🇵 Japan</option>
              <option value="FR">🇫🇷 France</option>
              <option value="DE">🇩🇪 Germany</option>
              <option value="IT">🇮🇹 Italy</option>
              <option value="ES">🇪🇸 Spain</option>
              <option value="CA">🇨🇦 Canada</option>
              <option value="AU">🇦🇺 Australia</option>
              <option value="NZ">🇳🇿 New Zealand</option>
              <option value="CN">🇨🇳 China</option>
              <option value="IN">🇮🇳 India</option>
              <option value="BR">🇧🇷 Brazil</option>
              <option value="MX">🇲🇽 Mexico</option>
              <option value="ZA">🇿🇦 South Africa</option>
              <option value="AE">🇦🇪 UAE</option>
              <option value="SG">🇸🇬 Singapore</option>
              <option value="TH">🇹🇭 Thailand</option>
              <option value="KR">🇰🇷 South Korea</option>
              <option value="RU">🇷🇺 Russia</option>
            </select>
          </div>

          {/* Visa Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Visa Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['tourist', 'business', 'work', 'student', 'transit'] as VisaType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, visaType: type })}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    formData.visaType === type
                      ? 'bg-terracotta-100 text-terracotta-600 border-2 border-terracotta-400'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Issue Date
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                required
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
                required
              />
            </div>
          </div>

          {/* Expiry Warning */}
          {daysLeft !== null && daysLeft < 30 && (
            <div
              style={{
                padding: '12px',
                background: daysLeft < 7 ? '#FEF2F2' : '#FFFBEB',
                border: `1px solid ${daysLeft < 7 ? '#FCA5A5' : '#FCD34D'}`,
                borderRadius: '12px',
                fontSize: '13px',
                color: daysLeft < 7 ? '#DC2626' : '#D97706',
                fontWeight: 600,
              }}
            >
              ⚠️ Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}!
            </div>
          )}

          {/* Visa Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Visa Number (optional)
            </label>
            <input
              type="text"
              value={formData.visaNumber}
              onChange={(e) => setFormData({ ...formData, visaNumber: e.target.value })}
              placeholder="e.g., V123456789"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            />
          </div>

          {/* Entry Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Entry Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="entryType"
                  value="single"
                  checked={formData.entryType === 'single'}
                  onChange={(e) => setFormData({ ...formData, entryType: e.target.value as EntryType })}
                  className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                />
                <span className="font-medium text-gray-900">Single Entry</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="entryType"
                  value="multiple"
                  checked={formData.entryType === 'multiple'}
                  onChange={(e) => setFormData({ ...formData, entryType: e.target.value as EntryType })}
                  className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                />
                <span className="font-medium text-gray-900">Multiple Entry</span>
              </label>
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
              placeholder="Additional information about this visa..."
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
            disabled={isPending || !formData.country || !formData.issueDate || !formData.expiryDate}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            }}
          >
            {isPending ? 'Saving...' : (isEditing ? 'Update Visa' : 'Add Visa')}
          </button>
        </div>
      </div>
    </div>
  );
};
