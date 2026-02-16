/**
 * RetirementAccountEditor Component
 * Form for creating and editing retirement account metadata
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type {
  Account,
  RetirementAccountMetadataInput,
  RetirementAccountWithStats,
  RetirementAccountType,
  TaxTreatment,
  VestingScheduleType,
  EmployerMatchType,
  InvestmentAllocation,
} from '../../types';
import { CONTRIBUTION_LIMITS_2024 } from '../../types';
import { getContributionLimits } from '../../utils/retirementCalculations';

interface RetirementAccountEditorProps {
  account: Account;
  existingMetadata?: RetirementAccountWithStats;
  onSave: (metadata: RetirementAccountMetadataInput) => void;
  onCancel: () => void;
}

const RetirementAccountEditor: React.FC<RetirementAccountEditorProps> = ({
  account,
  existingMetadata,
  onSave,
  onCancel,
}) => {
  const accountType = account.type as RetirementAccountType;
  const isHSA = accountType === 'hsa';
  const is401kType = accountType === '401k' || accountType === '403b';

  // Get default contribution limits based on account type
  const getDefaultLimits = () => {
    try {
      return getContributionLimits(accountType, false, 2024);
    } catch {
      return { base: 0, catchUp: 0 };
    }
  };

  const defaultLimits = getDefaultLimits();
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState<RetirementAccountMetadataInput>({
    accountId: account.id,
    taxTreatment: existingMetadata?.taxTreatment || (accountType === 'roth_ira' ? 'post_tax' : 'pre_tax'),
    annualContributionLimit: existingMetadata?.annualContributionLimit || defaultLimits.base,
    catchUpLimit: existingMetadata?.catchUpLimit || defaultLimits.catchUp,
    currentYearContributions: existingMetadata?.currentYearContributions || 0,
    contributionYear: existingMetadata?.contributionYear || currentYear,
    hasEmployerMatch: existingMetadata?.hasEmployerMatch || false,
    employerMatchPercentage: existingMetadata?.employerMatchPercentage || 100,
    employerMatchLimit: existingMetadata?.employerMatchLimit || 6,
    employerMatchType: existingMetadata?.employerMatchType || 'percentage',
    employerContributionsYTD: existingMetadata?.employerContributionsYTD || 0,
    hasVestingSchedule: existingMetadata?.hasVestingSchedule || false,
    vestingScheduleType: existingMetadata?.vestingScheduleType || 'immediate',
    vestingCliffYears: existingMetadata?.vestingCliffYears || 3,
    vestingGradedYears: existingMetadata?.vestingGradedYears || 5,
    vestingPercentage: existingMetadata?.vestingPercentage || 100,
    unvestedBalance: existingMetadata?.unvestedBalance || 0,
    allocation: existingMetadata?.allocation,
    isFamilyCoverage: existingMetadata?.isFamilyCoverage || false,
    notes: existingMetadata?.notes || '',
  });

  // Update limits when account type or family coverage changes
  useEffect(() => {
    const limits = getDefaultLimits();
    if (isHSA) {
      const hsaLimits = formData.isFamilyCoverage
        ? CONTRIBUTION_LIMITS_2024.hsa_family
        : CONTRIBUTION_LIMITS_2024.hsa_individual;
      setFormData(prev => ({
        ...prev,
        annualContributionLimit: hsaLimits.base,
        catchUpLimit: hsaLimits.catchUp,
      }));
    }
  }, [formData.isFamilyCoverage, isHSA]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: existingMetadata?.id,
    });
  };

  const taxTreatmentOptions: { value: TaxTreatment; label: string }[] = [
    { value: 'pre_tax', label: 'Pre-Tax (Traditional)' },
    { value: 'post_tax', label: 'Post-Tax (Roth)' },
    { value: 'tax_exempt', label: 'Tax-Exempt (HSA)' },
  ];

  const vestingScheduleTypes: { value: VestingScheduleType; label: string }[] = [
    { value: 'immediate', label: 'Immediate (100% vested)' },
    { value: 'cliff', label: 'Cliff Vesting' },
    { value: 'graded', label: 'Graded Vesting' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {existingMetadata ? 'Edit' : 'Configure'} {account.name}
          </h2>
          <button
            onClick={onCancel}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tax Treatment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tax Treatment *
            </label>
            <select
              value={formData.taxTreatment}
              onChange={(e) => setFormData({ ...formData, taxTreatment: e.target.value as TaxTreatment })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {taxTreatmentOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formData.taxTreatment === 'pre_tax' && 'Contributions reduce taxable income; withdrawals are taxed'}
              {formData.taxTreatment === 'post_tax' && 'Contributions are taxed; qualified withdrawals are tax-free'}
              {formData.taxTreatment === 'tax_exempt' && 'Triple tax advantage: tax-free contributions, growth, and withdrawals for medical expenses'}
            </p>
          </div>

          {/* HSA Family Coverage */}
          {isHSA && (
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFamilyCoverage}
                  onChange={(e) => setFormData({ ...formData, isFamilyCoverage: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Family Coverage (Higher Contribution Limit)
                </span>
              </label>
            </div>
          )}

          {/* Contribution Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Annual Contribution Limit *
              </label>
              <input
                type="number"
                value={formData.annualContributionLimit}
                onChange={(e) => setFormData({ ...formData, annualContributionLimit: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="100"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                2024 limit: ${defaultLimits.base.toLocaleString()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Catch-Up Limit (Age 50+)
              </label>
              <input
                type="number"
                value={formData.catchUpLimit || 0}
                onChange={(e) => setFormData({ ...formData, catchUpLimit: Number(e.target.value) || undefined })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="100"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                2024 limit: ${defaultLimits.catchUp.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Current Year Contributions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {currentYear} Employee Contributions
              </label>
              <input
                type="number"
                value={formData.currentYearContributions}
                onChange={(e) => setFormData({ ...formData, currentYearContributions: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {currentYear} Employer Contributions
              </label>
              <input
                type="number"
                value={formData.employerContributionsYTD}
                onChange={(e) => setFormData({ ...formData, employerContributionsYTD: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
                disabled={!formData.hasEmployerMatch}
              />
            </div>
          </div>

          {/* Employer Match Section */}
          {is401kType && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasEmployerMatch}
                    onChange={(e) => setFormData({ ...formData, hasEmployerMatch: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Employer Match Enabled
                  </span>
                </label>
              </div>

              {formData.hasEmployerMatch && (
                <div className="space-y-4 ml-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Match Percentage
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.employerMatchPercentage || 100}
                          onChange={(e) => setFormData({ ...formData, employerMatchPercentage: Number(e.target.value) })}
                          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          max="200"
                        />
                        <span className="absolute right-3 top-2.5 text-gray-500 dark:text-gray-400">%</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        e.g., 100% = dollar-for-dollar match
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Match Limit (% of Salary)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.employerMatchLimit || 6}
                          onChange={(e) => setFormData({ ...formData, employerMatchLimit: Number(e.target.value) })}
                          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          max="100"
                        />
                        <span className="absolute right-3 top-2.5 text-gray-500 dark:text-gray-400">%</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        e.g., 6% = match up to 6% of salary
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vesting Schedule Section */}
          {is401kType && formData.hasEmployerMatch && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasVestingSchedule}
                    onChange={(e) => setFormData({ ...formData, hasVestingSchedule: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Vesting Schedule (Employer Contributions)
                  </span>
                </label>
              </div>

              {formData.hasVestingSchedule && (
                <div className="space-y-4 ml-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Vesting Type
                    </label>
                    <select
                      value={formData.vestingScheduleType}
                      onChange={(e) => setFormData({ ...formData, vestingScheduleType: e.target.value as VestingScheduleType })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {vestingScheduleTypes.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.vestingScheduleType === 'cliff' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cliff Period (Years)
                      </label>
                      <input
                        type="number"
                        value={formData.vestingCliffYears || 3}
                        onChange={(e) => setFormData({ ...formData, vestingCliffYears: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="10"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        You'll be 100% vested after this many years
                      </p>
                    </div>
                  )}

                  {formData.vestingScheduleType === 'graded' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Graded Period (Years)
                      </label>
                      <input
                        type="number"
                        value={formData.vestingGradedYears || 5}
                        onChange={(e) => setFormData({ ...formData, vestingGradedYears: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="2"
                        max="10"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        You'll vest gradually over this many years
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Unvested Balance
                    </label>
                    <input
                      type="number"
                      value={formData.unvestedBalance}
                      onChange={(e) => setFormData({ ...formData, unvestedBalance: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Amount of employer contributions not yet vested
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Additional notes about this account..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {existingMetadata ? 'Update' : 'Save'} Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RetirementAccountEditor;
