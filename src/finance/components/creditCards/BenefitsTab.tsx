/**
 * BenefitsTab Component
 * Track credit card benefits like recurring credits, travel credits, lounge access, etc.
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Gift, Calendar, DollarSign } from 'lucide-react';
import { useCardBenefitsQuery, useUpsertCardBenefitMutation, useDeleteCardBenefitMutation } from '@/hooks/useFinanceQuery';
import type { CardBenefit, CardBenefitInput, BenefitType, BenefitFrequency } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { BenefitEditor } from './BenefitEditor';

interface BenefitsTabProps {
  accountId: string;
}

export const BenefitsTab: React.FC<BenefitsTabProps> = ({ accountId }) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<CardBenefit | null>(null);

  const { data: benefits = [], isLoading } = useCardBenefitsQuery(accountId);
  const upsertMutation = useUpsertCardBenefitMutation();
  const deleteMutation = useDeleteCardBenefitMutation();

  const handleAdd = () => {
    setEditingBenefit(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (benefit: CardBenefit) => {
    setEditingBenefit(benefit);
    setIsEditorOpen(true);
  };

  const handleDelete = async (benefitId: string) => {
    if (!confirm('Are you sure you want to delete this benefit?')) return;
    await deleteMutation.mutateAsync({ benefitId, accountId });
  };

  const handleSave = async (benefit: CardBenefitInput) => {
    await upsertMutation.mutateAsync({ accountId, benefit });
    setIsEditorOpen(false);
    setEditingBenefit(null);
  };

  if (isLoading) {
    return <div className="text-primary opacity-60">Loading benefits...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">Card Benefits</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Benefit
        </button>
      </div>

      {benefits.length === 0 ? (
        <div className="text-center py-8">
          <Gift className="h-12 w-12 text-primary opacity-30 mx-auto mb-3" />
          <p className="text-primary opacity-60 mb-4">No benefits tracked yet</p>
          <button
            onClick={handleAdd}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            Add your first benefit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {benefits.map((benefit) => (
            <BenefitCard
              key={benefit.id}
              benefit={benefit}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {isEditorOpen && (
        <BenefitEditor
          benefit={editingBenefit || undefined}
          onSave={handleSave}
          onCancel={() => {
            setIsEditorOpen(false);
            setEditingBenefit(null);
          }}
        />
      )}
    </div>
  );
};

// Benefit Card Component
interface BenefitCardProps {
  benefit: CardBenefit;
  onEdit: (benefit: CardBenefit) => void;
  onDelete: (benefitId: string) => void;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ benefit, onEdit, onDelete }) => {
  const usagePercentage = benefit.value && benefit.usedAmount 
    ? (benefit.usedAmount / benefit.value) * 100 
    : 0;

  const getBenefitIcon = (type: BenefitType) => {
    switch (type) {
      case 'recurring_credit': return '💳';
      case 'travel_credit': return '✈️';
      case 'lounge_access': return '🛋️';
      case 'protection': return '🛡️';
      default: return '🎁';
    }
  };

  const getFrequencyLabel = (freq: BenefitFrequency) => {
    switch (freq) {
      case 'annual': return 'Annually';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'once': return 'One-time';
      case 'per_use': return 'Per use';
      default: return freq;
    }
  };

  return (
    <div className={`rounded-lg p-4 ${benefit.active ? 'bg-primary/10' : 'bg-gray-500/10'} border border-primary/10`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getBenefitIcon(benefit.benefitType)}</span>
          <div>
            <h4 className="font-semibold text-primary">{benefit.name}</h4>
            {benefit.description && (
              <p className="text-xs text-primary opacity-60">{benefit.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(benefit)}
            className="p-1 hover:bg-primary/20 rounded transition-colors"
          >
            <Edit2 className="h-4 w-4 text-primary opacity-60" />
          </button>
          <button
            onClick={() => onDelete(benefit.id)}
            className="p-1 hover:bg-red-500/20 rounded transition-colors"
          >
            <Trash2 className="h-4 w-4 text-red-500 opacity-60" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        {benefit.value && (
          <div>
            <p className="text-xs text-primary opacity-60 mb-1">Value</p>
            <p className="text-sm font-semibold text-primary">{formatCurrency(benefit.value)}</p>
          </div>
        )}
        {benefit.frequency && (
          <div>
            <p className="text-xs text-primary opacity-60 mb-1">Frequency</p>
            <p className="text-sm font-semibold text-primary">{getFrequencyLabel(benefit.frequency)}</p>
          </div>
        )}
      </div>

      {benefit.value && benefit.usedAmount !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-primary opacity-60 mb-1">
            <span>Used: {formatCurrency(benefit.usedAmount)}</span>
            <span>{usagePercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-primary/10 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {benefit.resetDate && (
        <div className="mt-2 flex items-center gap-1 text-xs text-primary opacity-60">
          <Calendar className="h-3 w-3" />
          <span>Resets: {new Date(benefit.resetDate).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
};



