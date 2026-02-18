/**
 * CreditCardFormModalV2 Component - MIGRATED to use FormModalV2
 * Create/edit credit card benefits with Together pattern
 *
 * MIGRATION COMPLETE:
 * - Reduced from 448 lines to ~325 lines (27% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - 4 rewards types with emoji, sign-up bonus tracking
 */

import React from 'react';
import { FormModalV2 } from '@/components/v2';

interface CreditCardFormModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreditCardFormData) => void | Promise<void>;
  initialData?: Partial<CreditCardFormData>;
  isPending?: boolean;
}

export interface CreditCardFormData {
  cardName: string;
  issuer: string;
  last4Digits?: string;
  creditLimit: number;
  apr: number;
  annualFee: number;
  rewardsType: string;
  rewardsRate?: number;
  signUpBonus?: number;
  signUpBonusRequirement?: number;
  bonusDeadline?: string;
  benefits?: string;
  notes?: string;
}

interface CreditCardFormState {
  cardName: string;
  issuer: string;
  last4Digits: string;
  creditLimit: string;
  apr: string;
  annualFee: string;
  rewardsType: string;
  rewardsRate: string;
  signUpBonus: string;
  signUpBonusRequirement: string;
  bonusDeadline: string;
  benefits: string;
  notes: string;
}

const REWARDS_TYPES = [
  { value: 'cashback', label: 'Cash Back', emoji: '💵' },
  { value: 'points', label: 'Points', emoji: '⭐' },
  { value: 'miles', label: 'Travel Miles', emoji: '✈️' },
  { value: 'none', label: 'No Rewards', emoji: '❌' },
];

export const CreditCardFormModalV2: React.FC<CreditCardFormModalV2Props> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isPending = false,
}) => {
  const defaultFormData: CreditCardFormState = {
    cardName: '',
    issuer: '',
    last4Digits: '',
    creditLimit: '',
    apr: '',
    annualFee: '0',
    rewardsType: 'cashback',
    rewardsRate: '',
    signUpBonus: '',
    signUpBonusRequirement: '',
    bonusDeadline: '',
    benefits: '',
    notes: '',
  };

  const initialFormData: CreditCardFormState | undefined = initialData ? {
    cardName: initialData.cardName || '',
    issuer: initialData.issuer || '',
    last4Digits: initialData.last4Digits || '',
    creditLimit: initialData.creditLimit?.toString() || '',
    apr: initialData.apr?.toString() || '',
    annualFee: initialData.annualFee?.toString() || '0',
    rewardsType: initialData.rewardsType || 'cashback',
    rewardsRate: initialData.rewardsRate?.toString() || '',
    signUpBonus: initialData.signUpBonus?.toString() || '',
    signUpBonusRequirement: initialData.signUpBonusRequirement?.toString() || '',
    bonusDeadline: initialData.bonusDeadline || '',
    benefits: initialData.benefits || '',
    notes: initialData.notes || '',
  } : undefined;

  return (
    <FormModalV2<CreditCardFormState>
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Credit Card' : 'Add Credit Card'}
      defaultData={defaultFormData}
      initialData={initialFormData}
      draftKey={initialData ? undefined : 'finance_credit_card_modal_draft'}
      isPending={isPending}
      submitText={initialData ? 'Save Changes' : 'Add Card'}
      isEditing={!!initialData}
      onSubmit={async (formData) => {
        const cardData: CreditCardFormData = {
          cardName: formData.cardName.trim(),
          issuer: formData.issuer.trim(),
          last4Digits: formData.last4Digits.trim() || undefined,
          creditLimit: parseFloat(formData.creditLimit) || 0,
          apr: parseFloat(formData.apr) || 0,
          annualFee: parseFloat(formData.annualFee) || 0,
          rewardsType: formData.rewardsType,
          rewardsRate: formData.rewardsRate ? parseFloat(formData.rewardsRate) : undefined,
          signUpBonus: formData.signUpBonus ? parseFloat(formData.signUpBonus) : undefined,
          signUpBonusRequirement: formData.signUpBonusRequirement ? parseFloat(formData.signUpBonusRequirement) : undefined,
          bonusDeadline: formData.bonusDeadline || undefined,
          benefits: formData.benefits.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        };
        await onSave(cardData);
      }}
      validate={(formData) => {
        if (!formData.cardName.trim()) return 'Please enter a card name';
        if (!formData.issuer.trim()) return 'Please enter the card issuer';
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* Card Name */}
          <div>
            <label htmlFor="card-name" className="block text-sm font-semibold text-gray-900 mb-2">
              Card Name <span className="text-red-500">*</span>
            </label>
            <input
              id="card-name"
              type="text"
              value={formState.cardName}
              onChange={(e) => setFormState({ ...formState, cardName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="e.g., Chase Sapphire Preferred"
              required
            />
          </div>

          {/* Issuer */}
          <div>
            <label htmlFor="card-issuer" className="block text-sm font-semibold text-gray-900 mb-2">
              Issuer <span className="text-red-500">*</span>
            </label>
            <input
              id="card-issuer"
              type="text"
              value={formState.issuer}
              onChange={(e) => setFormState({ ...formState, issuer: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="e.g., Chase, Amex, Capital One"
              required
            />
          </div>

          {/* Last 4 Digits */}
          <div>
            <label htmlFor="card-last4" className="block text-sm font-semibold text-gray-900 mb-2">
              Last 4 Digits
            </label>
            <input
              id="card-last4"
              type="text"
              maxLength={4}
              value={formState.last4Digits}
              onChange={(e) => setFormState({ ...formState, last4Digits: e.target.value.replace(/\D/g, '') })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="1234"
            />
          </div>

          {/* Credit Limit */}
          <div>
            <label htmlFor="card-limit" className="block text-sm font-semibold text-gray-900 mb-2">
              Credit Limit
            </label>
            <input
              id="card-limit"
              type="number"
              step="0.01"
              value={formState.creditLimit}
              onChange={(e) => setFormState({ ...formState, creditLimit: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="0.00"
            />
          </div>

          {/* APR */}
          <div>
            <label htmlFor="card-apr" className="block text-sm font-semibold text-gray-900 mb-2">
              APR (%)
            </label>
            <input
              id="card-apr"
              type="number"
              step="0.01"
              value={formState.apr}
              onChange={(e) => setFormState({ ...formState, apr: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="0.00"
            />
          </div>

          {/* Annual Fee */}
          <div>
            <label htmlFor="card-fee" className="block text-sm font-semibold text-gray-900 mb-2">
              Annual Fee
            </label>
            <input
              id="card-fee"
              type="number"
              step="0.01"
              value={formState.annualFee}
              onChange={(e) => setFormState({ ...formState, annualFee: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="0.00"
            />
          </div>

          {/* Rewards Type */}
          <div>
            <label htmlFor="card-rewards" className="block text-sm font-semibold text-gray-900 mb-2">
              Rewards Type
            </label>
            <select
              id="card-rewards"
              value={formState.rewardsType}
              onChange={(e) => setFormState({ ...formState, rewardsType: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            >
              {REWARDS_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.emoji} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Rewards Rate */}
          <div>
            <label htmlFor="card-rate" className="block text-sm font-semibold text-gray-900 mb-2">
              Rewards Rate (%)
            </label>
            <input
              id="card-rate"
              type="number"
              step="0.01"
              value={formState.rewardsRate}
              onChange={(e) => setFormState({ ...formState, rewardsRate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="e.g., 2 for 2% cash back"
            />
          </div>

          {/* Sign-Up Bonus */}
          <div>
            <label htmlFor="card-bonus" className="block text-sm font-semibold text-gray-900 mb-2">
              Sign-Up Bonus
            </label>
            <input
              id="card-bonus"
              type="number"
              step="0.01"
              value={formState.signUpBonus}
              onChange={(e) => setFormState({ ...formState, signUpBonus: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="e.g., 60000 points"
            />
          </div>

          {/* Bonus Requirement */}
          <div>
            <label htmlFor="card-bonus-req" className="block text-sm font-semibold text-gray-900 mb-2">
              Bonus Spending Requirement
            </label>
            <input
              id="card-bonus-req"
              type="number"
              step="0.01"
              value={formState.signUpBonusRequirement}
              onChange={(e) => setFormState({ ...formState, signUpBonusRequirement: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="e.g., 4000 to spend"
            />
          </div>

          {/* Bonus Deadline */}
          <div>
            <label htmlFor="card-bonus-deadline" className="block text-sm font-semibold text-gray-900 mb-2">
              Bonus Deadline
            </label>
            <input
              id="card-bonus-deadline"
              type="date"
              value={formState.bonusDeadline}
              onChange={(e) => setFormState({ ...formState, bonusDeadline: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            />
          </div>

          {/* Benefits */}
          <div>
            <label htmlFor="card-benefits" className="block text-sm font-semibold text-gray-900 mb-2">
              Card Benefits
            </label>
            <textarea
              id="card-benefits"
              rows={3}
              value={formState.benefits}
              onChange={(e) => setFormState({ ...formState, benefits: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
              placeholder="e.g., Travel insurance, Airport lounge access, TSA PreCheck credit"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="card-notes" className="block text-sm font-semibold text-gray-900 mb-2">
              Notes
            </label>
            <textarea
              id="card-notes"
              rows={3}
              value={formState.notes}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
              placeholder="Add additional notes..."
            />
          </div>
        </>
      )}
    </FormModalV2>
  );
};
