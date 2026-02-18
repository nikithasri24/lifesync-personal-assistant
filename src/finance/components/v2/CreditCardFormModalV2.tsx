/**
 * CreditCardFormModalV2 Component
 * Create/edit credit card benefits with Together pattern
 * Auto-save, rewards type selector, bonus tracking, ESC key support
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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

const STORAGE_KEY = 'finance_credit_card_modal_draft';

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

  const [cardName, setCardName] = useState(savedDraft?.cardName || initialData?.cardName || '');
  const [issuer, setIssuer] = useState(savedDraft?.issuer || initialData?.issuer || '');
  const [last4Digits, setLast4Digits] = useState(savedDraft?.last4Digits || initialData?.last4Digits || '');
  const [creditLimit, setCreditLimit] = useState(
    savedDraft?.creditLimit?.toString() || initialData?.creditLimit?.toString() || ''
  );
  const [apr, setApr] = useState(savedDraft?.apr?.toString() || initialData?.apr?.toString() || '');
  const [annualFee, setAnnualFee] = useState(
    savedDraft?.annualFee?.toString() || initialData?.annualFee?.toString() || '0'
  );
  const [rewardsType, setRewardsType] = useState(savedDraft?.rewardsType || initialData?.rewardsType || 'cashback');
  const [rewardsRate, setRewardsRate] = useState(
    savedDraft?.rewardsRate?.toString() || initialData?.rewardsRate?.toString() || ''
  );
  const [signUpBonus, setSignUpBonus] = useState(
    savedDraft?.signUpBonus?.toString() || initialData?.signUpBonus?.toString() || ''
  );
  const [signUpBonusRequirement, setSignUpBonusRequirement] = useState(
    savedDraft?.signUpBonusRequirement?.toString() || initialData?.signUpBonusRequirement?.toString() || ''
  );
  const [bonusDeadline, setBonusDeadline] = useState(
    savedDraft?.bonusDeadline || initialData?.bonusDeadline || ''
  );
  const [benefits, setBenefits] = useState(savedDraft?.benefits || initialData?.benefits || '');
  const [notes, setNotes] = useState(savedDraft?.notes || initialData?.notes || '');

  // Auto-save draft
  useEffect(() => {
    if (!initialData) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          cardName,
          issuer,
          last4Digits,
          creditLimit: parseFloat(creditLimit) || 0,
          apr: parseFloat(apr) || 0,
          annualFee: parseFloat(annualFee) || 0,
          rewardsType,
          rewardsRate: rewardsRate ? parseFloat(rewardsRate) : undefined,
          signUpBonus: signUpBonus ? parseFloat(signUpBonus) : undefined,
          signUpBonusRequirement: signUpBonusRequirement ? parseFloat(signUpBonusRequirement) : undefined,
          bonusDeadline,
          benefits,
          notes,
        })
      );
    }
  }, [cardName, issuer, last4Digits, creditLimit, apr, annualFee, rewardsType, rewardsRate, signUpBonus, signUpBonusRequirement, bonusDeadline, benefits, notes, initialData]);

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

    if (!cardName.trim()) {
      alert('Please enter a card name');
      return;
    }

    if (!issuer.trim()) {
      alert('Please enter the card issuer');
      return;
    }

    const formData: CreditCardFormData = {
      cardName: cardName.trim(),
      issuer: issuer.trim(),
      last4Digits: last4Digits.trim() || undefined,
      creditLimit: parseFloat(creditLimit) || 0,
      apr: parseFloat(apr) || 0,
      annualFee: parseFloat(annualFee) || 0,
      rewardsType,
      rewardsRate: rewardsRate ? parseFloat(rewardsRate) : undefined,
      signUpBonus: signUpBonus ? parseFloat(signUpBonus) : undefined,
      signUpBonusRequirement: signUpBonusRequirement ? parseFloat(signUpBonusRequirement) : undefined,
      bonusDeadline: bonusDeadline || undefined,
      benefits: benefits.trim() || undefined,
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
            {initialData ? 'Edit Credit Card' : 'Add Credit Card'}
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
            {/* Card Name */}
            <div>
              <label htmlFor="card-name" className="block text-sm font-semibold text-gray-900 mb-2">
                Card Name <span className="text-red-500">*</span>
              </label>
              <input
                id="card-name"
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
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
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
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
                value={last4Digits}
                onChange={(e) => setLast4Digits(e.target.value.replace(/\D/g, ''))}
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
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
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
                value={apr}
                onChange={(e) => setApr(e.target.value)}
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
                value={annualFee}
                onChange={(e) => setAnnualFee(e.target.value)}
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
                value={rewardsType}
                onChange={(e) => setRewardsType(e.target.value)}
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
                value={rewardsRate}
                onChange={(e) => setRewardsRate(e.target.value)}
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
                value={signUpBonus}
                onChange={(e) => setSignUpBonus(e.target.value)}
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
                value={signUpBonusRequirement}
                onChange={(e) => setSignUpBonusRequirement(e.target.value)}
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
                value={bonusDeadline}
                onChange={(e) => setBonusDeadline(e.target.value)}
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
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                placeholder="Add additional notes..."
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
              {isPending ? 'Saving...' : initialData ? 'Save Changes' : 'Add Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
