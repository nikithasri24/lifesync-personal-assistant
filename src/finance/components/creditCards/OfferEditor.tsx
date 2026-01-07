/**
 * OfferEditor Component
 * Form for adding/editing credit card offers (promotional APR, merchant offers, etc.)
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { CardOffer, CardOfferInput, OfferType } from '../../types';

interface OfferEditorProps {
  offer?: CardOffer;
  onSave: (offer: CardOfferInput) => void;
  onCancel: () => void;
}

export const OfferEditor: React.FC<OfferEditorProps> = ({ offer, onSave, onCancel }) => {
  const [formData, setFormData] = useState<CardOfferInput>({
    accountId: offer?.accountId || '',
    merchant: offer?.merchant || '',
    offerType: offer?.offerType || 'statement_credit',
    offerAmount: offer?.offerAmount || 0,
    requiredSpend: offer?.requiredSpend,
    expirationDate: offer?.expirationDate || '',
    activated: offer?.activated ?? false,
    activatedDate: offer?.activatedDate,
    redeemed: offer?.redeemed ?? false,
    redeemedDate: offer?.redeemedDate,
    id: offer?.id,
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
            {offer ? 'Edit Offer' : 'Add Offer'}
          </h3>
          <button onClick={onCancel} className="p-1 hover:bg-primary/20 rounded transition-colors">
            <X className="h-5 w-5 text-primary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Merchant/Name */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Merchant/Offer Name</label>
            <input
              type="text"
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              placeholder="e.g., 0% APR Promotion or Amazon"
              className="w-full px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Offer Type */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Offer Type</label>
            <select
              value={formData.offerType}
              onChange={(e) => setFormData({ ...formData, offerType: e.target.value as OfferType })}
              className="w-full px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="statement_credit">Statement Credit / 0% APR</option>
              <option value="cashback">Cashback</option>
              <option value="bonus_points">Bonus Points</option>
            </select>
          </div>

          {/* Offer Amount */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Offer Amount ($) {formData.offerType === 'statement_credit' && '(or 0 for APR offers)'}
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.offerAmount}
              onChange={(e) => setFormData({ ...formData, offerAmount: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Required Spend */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Required Spend (Optional)</label>
            <input
              type="number"
              step="0.01"
              value={formData.requiredSpend || ''}
              onChange={(e) => setFormData({ ...formData, requiredSpend: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="e.g., 500.00"
              className="w-full px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Expiration Date */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Expiration Date</label>
            <input
              type="date"
              value={formData.expirationDate || ''}
              onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              className="w-full px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-primary opacity-60 mt-1">
              When does this offer expire? (e.g., when does 0% APR end?)
            </p>
          </div>

          {/* Activated */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activated"
              checked={formData.activated}
              onChange={(e) => setFormData({ 
                ...formData, 
                activated: e.target.checked,
                activatedDate: e.target.checked && !formData.activatedDate ? new Date().toISOString().split('T')[0] : formData.activatedDate
              })}
              className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="activated" className="text-sm font-medium text-primary">Activated</label>
          </div>

          {/* Redeemed */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="redeemed"
              checked={formData.redeemed}
              onChange={(e) => setFormData({ 
                ...formData, 
                redeemed: e.target.checked,
                redeemedDate: e.target.checked && !formData.redeemedDate ? new Date().toISOString().split('T')[0] : formData.redeemedDate
              })}
              className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="redeemed" className="text-sm font-medium text-primary">Redeemed</label>
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

