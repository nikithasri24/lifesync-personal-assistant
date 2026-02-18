/**
 * InsuranceFormModalV2 Component - MIGRATED to use FormModalV2
 * Create/edit insurance policies with Together pattern
 *
 * MIGRATION COMPLETE:
 * - Reduced from 427 lines to ~310 lines (27% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - 10 policy types with emoji, premium frequency selector
 */

import React from 'react';
import { FormModalV2 } from '@/components/v2';

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

interface InsuranceFormState {
  policyName: string;
  policyType: string;
  provider: string;
  policyNumber: string;
  coverageAmount: string;
  premium: string;
  premiumFrequency: string;
  deductible: string;
  renewalDate: string;
  beneficiaries: string;
  notes: string;
}

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
  const defaultFormData: InsuranceFormState = {
    policyName: '',
    policyType: 'health',
    provider: '',
    policyNumber: '',
    coverageAmount: '',
    premium: '',
    premiumFrequency: 'monthly',
    deductible: '',
    renewalDate: '',
    beneficiaries: '',
    notes: '',
  };

  const initialFormData: InsuranceFormState | undefined = initialData ? {
    policyName: initialData.policyName || '',
    policyType: initialData.policyType || 'health',
    provider: initialData.provider || '',
    policyNumber: initialData.policyNumber || '',
    coverageAmount: initialData.coverageAmount?.toString() || '',
    premium: initialData.premium?.toString() || '',
    premiumFrequency: initialData.premiumFrequency || 'monthly',
    deductible: initialData.deductible?.toString() || '',
    renewalDate: initialData.renewalDate || '',
    beneficiaries: initialData.beneficiaries || '',
    notes: initialData.notes || '',
  } : undefined;

  return (
    <FormModalV2<InsuranceFormState>
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Insurance Policy' : 'Add Insurance Policy'}
      defaultData={defaultFormData}
      initialData={initialFormData}
      draftKey={initialData ? undefined : 'finance_insurance_modal_draft'}
      isPending={isPending}
      submitText={initialData ? 'Save Changes' : 'Add Policy'}
      isEditing={!!initialData}
      onSubmit={async (formData) => {
        const insuranceData: InsuranceFormData = {
          policyName: formData.policyName.trim(),
          policyType: formData.policyType,
          provider: formData.provider.trim(),
          policyNumber: formData.policyNumber.trim() || undefined,
          coverageAmount: parseFloat(formData.coverageAmount) || 0,
          premium: parseFloat(formData.premium),
          premiumFrequency: formData.premiumFrequency,
          deductible: formData.deductible ? parseFloat(formData.deductible) : undefined,
          renewalDate: formData.renewalDate || undefined,
          beneficiaries: formData.beneficiaries.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        };
        await onSave(insuranceData);
      }}
      validate={(formData) => {
        if (!formData.policyName.trim()) return 'Please enter a policy name';
        if (!formData.provider.trim()) return 'Please enter the insurance provider';
        if (!formData.premium || parseFloat(formData.premium) <= 0) {
          return 'Please enter a valid premium amount';
        }
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* Policy Name */}
          <div>
            <label htmlFor="policy-name" className="block text-sm font-semibold text-gray-900 mb-2">
              Policy Name <span className="text-red-500">*</span>
            </label>
            <input
              id="policy-name"
              type="text"
              value={formState.policyName}
              onChange={(e) => setFormState({ ...formState, policyName: e.target.value })}
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
              value={formState.policyType}
              onChange={(e) => setFormState({ ...formState, policyType: e.target.value })}
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
              value={formState.provider}
              onChange={(e) => setFormState({ ...formState, provider: e.target.value })}
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
              value={formState.policyNumber}
              onChange={(e) => setFormState({ ...formState, policyNumber: e.target.value })}
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
              value={formState.coverageAmount}
              onChange={(e) => setFormState({ ...formState, coverageAmount: e.target.value })}
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
              value={formState.premium}
              onChange={(e) => setFormState({ ...formState, premium: e.target.value })}
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
              value={formState.premiumFrequency}
              onChange={(e) => setFormState({ ...formState, premiumFrequency: e.target.value })}
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
              value={formState.deductible}
              onChange={(e) => setFormState({ ...formState, deductible: e.target.value })}
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
              value={formState.renewalDate}
              onChange={(e) => setFormState({ ...formState, renewalDate: e.target.value })}
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
              value={formState.beneficiaries}
              onChange={(e) => setFormState({ ...formState, beneficiaries: e.target.value })}
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
              value={formState.notes}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
              placeholder="Add notes about this policy..."
            />
          </div>
        </>
      )}
    </FormModalV2>
  );
};
