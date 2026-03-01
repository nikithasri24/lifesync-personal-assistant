/**
 * BenefitEditor Component
 * Form for adding/editing credit card benefits
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { CardBenefit, CardBenefitInput, BenefitType, BenefitFrequency } from '../../types';

interface BenefitEditorProps {
  benefit?: CardBenefit;
  onSave: (benefit: CardBenefitInput) => void;
  onCancel: () => void;
}

export const BenefitEditor: React.FC<BenefitEditorProps> = ({ benefit, onSave, onCancel }) => {
  const [formData, setFormData] = useState<CardBenefitInput>({
    accountId: benefit?.accountId || '',
    benefitType: benefit?.benefitType || 'recurring_credit',
    name: benefit?.name || '',
    description: benefit?.description || '',
    value: benefit?.value,
    frequency: benefit?.frequency || 'quarterly',
    usedAmount: benefit?.usedAmount || 0,
    resetDate: benefit?.resetDate || '',
    active: benefit?.active ?? true,
    id: benefit?.id,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-primary">
            {benefit ? 'Edit Benefit' : 'Add Benefit'}
          </h3>
          <button onClick={onCancel} className="p-1 hover:bg-primary/20 rounded transition-colors" aria-label="Close">
            <X className="h-5 w-5 text-primary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Benefit Type */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Benefit Type</label>
            <select
              value={formData.benefitType}
              onChange={(e) => setFormData({ ...formData, benefitType: e.target.value as BenefitType })}
              className="w-full px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="recurring_credit">Recurring Credit</option>
              <option value="travel_credit">Travel Credit</option>
              <option value="lounge_access">Lounge Access</option>
              <option value="protection">Protection</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Lululemon Credit"
              className="w-full px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., $75 credit for Lululemon purchases"
              rows={2}
              className="w-full px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Value ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.value || ''}
              onChange={(e) => setFormData({ ...formData, value: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="75.00"
              className="w-full px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Frequency</label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as BenefitFrequency })}
              className="w-full px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
              <option value="monthly">Monthly</option>
              <option value="once">One-time</option>
              <option value="per_use">Per Use</option>
            </select>
          </div>

          {/* Used Amount */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Used Amount ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.usedAmount || 0}
              onChange={(e) => setFormData({ ...formData, usedAmount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reset Date */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Reset Date (Optional)</label>
            <input
              type="date"
              value={formData.resetDate || ''}
              onChange={(e) => setFormData({ ...formData, resetDate: e.target.value })}
              className="w-full px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="active" className="text-sm font-medium text-primary">Active</label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

