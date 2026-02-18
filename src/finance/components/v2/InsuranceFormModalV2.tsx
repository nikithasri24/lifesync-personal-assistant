/**
 * InsuranceFormModalV2 Component
 * Create/edit insurance policies with Together pattern
 * Auto-save, policy type selector, coverage details, ESC key support
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface InsuranceFormModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: InsuranceFormData) => void | Promise<void>;
  initialData?: Partial<InsuranceFormData>;
  isPending?: boolean;
}

export interface InsuranceFormData {
  policyName: string;
  policyType: string;
  provider: string;
  policyNumber?: string;
  coverageAmount: number;
  premium: number;
  premiumFrequency: string;
  deductible?: number;
  renewalDate?: string;
  beneficiaries?: string;
  notes?: string;
}

const STORAGE_KEY = 'finance_insurance_modal_draft';

const POLICY_TYPES = [
  { value: 'health', label: 'Health Insurance', emoji: '🏥' },
  { value: 'life', label: 'Life Insurance', emoji: '🛡️' },
  { value: 'auto', label: 'Auto Insurance', emoji: '🚗' },
  { value: 'home', label: 'Home Insurance', emoji: '🏠' },
  { value: 'renters', label: 'Renters Insurance', emoji: '🔑' },
  { value: 'disability', label: 'Disability Insurance', emoji: '♿' },
  { value: 'dental', label: 'Dental Insurance', emoji: '🦷' },
  { value: 'vision', label: 'Vision Insurance', emoji: '👓' },
  { value: 'umbrella', label: 'Umbrella Insurance', emoji: '☂️' },
  { value: 'other', label: 'Other', emoji: '📋' },
];

const PREMIUM_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi-annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' },
];

export const InsuranceFormModalV2: React.FC<InsuranceFormModalV2Props> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isPending = false,
}) => {
  // Load saved draft
  const loadDraft = () => {
    if (initialData) return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  };

  const savedDraft = loadDraft();

  const [policyName, setPolicyName] = useState(savedDraft?.policyName || initialData?.policyName || '');
  const [policyType, setPolicyType] = useState(savedDraft?.policyType || initialData?.policyType || 'health');
  const [provider, setProvider] = useState(savedDraft?.provider || initialData?.provider || '');
  const [policyNumber, setPolicyNumber] = useState(savedDraft?.policyNumber || initialData?.policyNumber || '');
  const [coverageAmount, setCoverageAmount] = useState(
    savedDraft?.coverageAmount?.toString() || initialData?.coverageAmount?.toString() || ''
  );
  const [premium, setPremium] = useState(
    savedDraft?.premium?.toString() || initialData?.premium?.toString() || ''
  );
  const [premiumFrequency, setPremiumFrequency] = useState(
    savedDraft?.premiumFrequency || initialData?.premiumFrequency || 'monthly'
  );
  const [deductible, setDeductible] = useState(
    savedDraft?.deductible?.toString() || initialData?.deductible?.toString() || ''
  );
  const [renewalDate, setRenewalDate] = useState(savedDraft?.renewalDate || initialData?.renewalDate || '');
  const [beneficiaries, setBeneficiaries] = useState(
    savedDraft?.beneficiaries || initialData?.beneficiaries || ''
  );
  const [notes, setNotes] = useState(savedDraft?.notes || initialData?.notes || '');

  // Auto-save draft
  useEffect(() => {
    if (!initialData) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          policyName,
          policyType,
          provider,
          policyNumber,
          coverageAmount: parseFloat(coverageAmount) || 0,
          premium: parseFloat(premium) || 0,
          premiumFrequency,
          deductible: deductible ? parseFloat(deductible) : undefined,
          renewalDate,
          beneficiaries,
          notes,
        })
      );
    }
  }, [policyName, policyType, provider, policyNumber, coverageAmount, premium, premiumFrequency, deductible, renewalDate, beneficiaries, notes, initialData]);

  // ESC key support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!policyName.trim()) {
      alert('Please enter a policy name');
      return;
    }

    if (!provider.trim()) {
      alert('Please enter the insurance provider');
      return;
    }

    if (!premium || parseFloat(premium) <= 0) {
      alert('Please enter a valid premium amount');
      return;
    }

    const formData: InsuranceFormData = {
      policyName: policyName.trim(),
      policyType,
      provider: provider.trim(),
      policyNumber: policyNumber.trim() || undefined,
      coverageAmount: parseFloat(coverageAmount) || 0,
      premium: parseFloat(premium),
      premiumFrequency,
      deductible: deductible ? parseFloat(deductible) : undefined,
      renewalDate: renewalDate || undefined,
      beneficiaries: beneficiaries.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    await onSave(formData);

    if (!initialData) {
      localStorage.removeItem(STORAGE_KEY);
    }

    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? 'Edit Insurance Policy' : 'Add Insurance Policy'}
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
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div
            className="overflow-y-auto p-6 space-y-5 flex-1"
            style={{ maxHeight: 'calc(90vh - 140px)' }}
          >
            {/* Policy Name */}
            <div>
              <label htmlFor="policy-name" className="block text-sm font-semibold text-gray-900 mb-2">
                Policy Name <span className="text-red-500">*</span>
              </label>
              <input
                id="policy-name"
                type="text"
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="e.g., Family Health Insurance"
                required
              />
            </div>

            {/* Policy Type */}
            <div>
              <label htmlFor="policy-type" className="block text-sm font-semibold text-gray-900 mb-2">
                Policy Type
              </label>
              <select
                id="policy-type"
                value={policyType}
                onChange={(e) => setPolicyType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              >
                {POLICY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.emoji} {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Provider */}
            <div>
              <label htmlFor="policy-provider" className="block text-sm font-semibold text-gray-900 mb-2">
                Provider <span className="text-red-500">*</span>
              </label>
              <input
                id="policy-provider"
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="e.g., Blue Cross Blue Shield, State Farm"
                required
              />
            </div>

            {/* Policy Number */}
            <div>
              <label htmlFor="policy-number" className="block text-sm font-semibold text-gray-900 mb-2">
                Policy Number
              </label>
              <input
                id="policy-number"
                type="text"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="Policy or account number"
              />
            </div>

            {/* Coverage Amount */}
            <div>
              <label htmlFor="policy-coverage" className="block text-sm font-semibold text-gray-900 mb-2">
                Coverage Amount
              </label>
              <input
                id="policy-coverage"
                type="number"
                step="0.01"
                value={coverageAmount}
                onChange={(e) => setCoverageAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="0.00"
              />
            </div>

            {/* Premium */}
            <div>
              <label htmlFor="policy-premium" className="block text-sm font-semibold text-gray-900 mb-2">
                Premium <span className="text-red-500">*</span>
              </label>
              <input
                id="policy-premium"
                type="number"
                step="0.01"
                value={premium}
                onChange={(e) => setPremium(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="0.00"
                required
              />
            </div>

            {/* Premium Frequency */}
            <div>
              <label htmlFor="policy-frequency" className="block text-sm font-semibold text-gray-900 mb-2">
                Premium Frequency
              </label>
              <select
                id="policy-frequency"
                value={premiumFrequency}
                onChange={(e) => setPremiumFrequency(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              >
                {PREMIUM_FREQUENCIES.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Deductible */}
            <div>
              <label htmlFor="policy-deductible" className="block text-sm font-semibold text-gray-900 mb-2">
                Deductible
              </label>
              <input
                id="policy-deductible"
                type="number"
                step="0.01"
                value={deductible}
                onChange={(e) => setDeductible(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="0.00"
              />
            </div>

            {/* Renewal Date */}
            <div>
              <label htmlFor="policy-renewal" className="block text-sm font-semibold text-gray-900 mb-2">
                Renewal Date
              </label>
              <input
                id="policy-renewal"
                type="date"
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>

            {/* Beneficiaries */}
            <div>
              <label htmlFor="policy-beneficiaries" className="block text-sm font-semibold text-gray-900 mb-2">
                Beneficiaries
              </label>
              <input
                id="policy-beneficiaries"
                type="text"
                value={beneficiaries}
                onChange={(e) => setBeneficiaries(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="e.g., Spouse, Children"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="policy-notes" className="block text-sm font-semibold text-gray-900 mb-2">
                Notes
              </label>
              <textarea
                id="policy-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                placeholder="Add notes about this policy..."
              />
            </div>
          </div>

          {/* Modal Footer */}
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
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              }}
            >
              {isPending ? 'Saving...' : initialData ? 'Save Changes' : 'Add Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
