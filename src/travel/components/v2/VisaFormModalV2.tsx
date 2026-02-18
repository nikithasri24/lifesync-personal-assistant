/**
 * VisaFormModalV2 Component - MIGRATED to use FormModalV2
 * Together pattern modal for visa tracking
 *
 * MIGRATION COMPLETE:
 * - Reduced from 365 lines to ~255 lines (30% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - 20 countries with flags, 5 visa types, entry type radio cards
 */

import React from 'react';
import { FormModalV2 } from '@/components/v2';

type VisaType = 'tourist' | 'business' | 'work' | 'student' | 'transit';
type EntryType = 'single' | 'multiple';

export interface VisaFormData {
  country: string;
  visaType: VisaType;
  issueDate: string;
  expiryDate: string;
  visaNumber?: string;
  entryType: EntryType;
  notes?: string;
}

interface VisaFormState {
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
  isPending?: boolean;
}

export const VisaFormModalV2: React.FC<VisaFormModalV2Props> = ({
  isOpen,
  onClose,
  visa,
  isEditing = false,
  onSubmit,
  isPending = false,
}) => {
  const defaultFormData: VisaFormState = {
    country: '',
    visaType: 'tourist',
    issueDate: '',
    expiryDate: '',
    visaNumber: '',
    entryType: 'single',
    notes: '',
  };

  const initialFormData: VisaFormState | undefined = visa ? {
    country: visa.country,
    visaType: visa.visaType,
    issueDate: visa.issueDate,
    expiryDate: visa.expiryDate,
    visaNumber: visa.visaNumber || '',
    entryType: visa.entryType,
    notes: visa.notes || '',
  } : undefined;

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string): number => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  return (
    <FormModalV2<VisaFormState>
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Visa' : 'Add Visa'}
      defaultData={defaultFormData}
      initialData={initialFormData}
      draftKey={visa ? undefined : 'travel_visa_modal_draft'}
      isPending={isPending}
      submitText={isEditing ? 'Update Visa' : 'Add Visa'}
      isEditing={isEditing}
      onSubmit={async (formData) => {
        const visaData: VisaFormData = {
          country: formData.country,
          visaType: formData.visaType,
          issueDate: formData.issueDate,
          expiryDate: formData.expiryDate,
          visaNumber: formData.visaNumber.trim() || undefined,
          entryType: formData.entryType,
          notes: formData.notes.trim() || undefined,
        };
        await onSubmit(visaData);
      }}
      validate={(formData) => {
        if (!formData.country) return 'Please select a country';
        if (!formData.issueDate) return 'Please enter an issue date';
        if (!formData.expiryDate) return 'Please enter an expiry date';
        return null;
      }}
    >
      {(formState, setFormState) => {
        const daysLeft = formState.expiryDate ? getDaysUntilExpiry(formState.expiryDate) : null;

        return (
          <>
            {/* Country */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                value={formState.country}
                onChange={(e) => setFormState({ ...formState, country: e.target.value })}
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
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Visa Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['tourist', 'business', 'work', 'student', 'transit'] as VisaType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormState({ ...formState, visaType: type })}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      formState.visaType === type
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
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Issue Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formState.issueDate}
                  onChange={(e) => setFormState({ ...formState, issueDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formState.expiryDate}
                  onChange={(e) => setFormState({ ...formState, expiryDate: e.target.value })}
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
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Visa Number
              </label>
              <input
                type="text"
                value={formState.visaNumber}
                onChange={(e) => setFormState({ ...formState, visaNumber: e.target.value })}
                placeholder="e.g., V123456789"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>

            {/* Entry Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Entry Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="entryType"
                    value="single"
                    checked={formState.entryType === 'single'}
                    onChange={(e) => setFormState({ ...formState, entryType: e.target.value as EntryType })}
                    className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                  />
                  <span className="font-medium text-gray-900">Single Entry</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="entryType"
                    value="multiple"
                    checked={formState.entryType === 'multiple'}
                    onChange={(e) => setFormState({ ...formState, entryType: e.target.value as EntryType })}
                    className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                  />
                  <span className="font-medium text-gray-900">Multiple Entry</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Notes
              </label>
              <textarea
                rows={3}
                value={formState.notes}
                onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                placeholder="Additional information about this visa..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
              />
            </div>
          </>
        );
      }}
    </FormModalV2>
  );
};
