/**
 * CreditCardDetailsModal Component
 * Detailed view of a credit card with benefits, offers, and tracking
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Gift, Percent, Shield, Calendar, Pencil } from 'lucide-react';
import type { Account } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { BenefitsTab } from './BenefitsTab';
import { OffersTab } from './OffersTab';
import { StatementsTab } from './StatementsTab';
import { AccountFormModalV2, type AccountFormData } from '../v2/AccountFormModalV2';
import { useUpsertAccountMutation } from '@/hooks/useFinanceQuery';

interface CreditCardDetailsModalProps {
  card: Account;
  onClose: () => void;
}

type TabType = 'overview' | 'benefits' | 'offers' | 'statements';

export const CreditCardDetailsModal: React.FC<CreditCardDetailsModalProps> = ({ card, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const upsertAccount = useUpsertAccountMutation();

  const handleSave = async (data: AccountFormData) => {
    await upsertAccount.mutateAsync({
      id: card.id,
      name: data.name,
      type: data.type,
      balance: data.balance,
      creditLimit: data.creditLimit,
      apr: data.apr,
      promoAprEndDate: data.promoAprEndDate,
      notes: data.notes,
      isArchived: data.isArchived,
    });
    setIsEditing(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const utilization = card.creditLimit ? (Math.abs(card.balance) / card.creditLimit) * 100 : 0;
  const available = (card.creditLimit || 0) - Math.abs(card.balance);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Gift className="h-4 w-4" /> },
    { id: 'benefits', label: 'Benefits', icon: <Gift className="h-4 w-4" /> },
    { id: 'offers', label: 'Offers', icon: <Percent className="h-4 w-4" /> },
    { id: 'statements', label: 'Statements', icon: <Calendar className="h-4 w-4" /> },
  ];

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
      onClick={onClose}
    >
      <div
        className="w-full lg:max-w-4xl bg-white dark:bg-gray-800 lg:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile only) */}
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
        </div>

        {/* Header */}
        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-6 border-b border-primary/10 flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-1">{card.name}</h2>
              {card.rewardsType && (
                <span className="text-sm px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                  {card.rewardsBalance?.toLocaleString()} {card.rewardsType}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-lg p-2 hover:bg-primary/20 transition-colors"
                aria-label="Edit card"
              >
                <Pencil className="h-5 w-5 text-primary" />
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-primary/20 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-primary" />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-primary opacity-60 mb-1">Balance</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(Math.abs(card.balance))}</p>
            </div>
            <div>
              <p className="text-xs text-primary opacity-60 mb-1">Available</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(available)}</p>
            </div>
            <div>
              <p className="text-xs text-primary opacity-60 mb-1">Utilization</p>
              <p className="text-lg font-bold text-primary">{utilization.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-primary/10 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-primary opacity-60 hover:opacity-100'
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && <OverviewTab card={card} />}
          {activeTab === 'benefits' && <BenefitsTab accountId={card.id} />}
          {activeTab === 'offers' && <OffersTab accountId={card.id} />}
          {activeTab === 'statements' && <StatementsTab accountId={card.id} />}
        </div>
      </div>

      {/* Edit Modal */}
      <AccountFormModalV2
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={handleSave}
        isPending={upsertAccount.isPending}
        initialData={{
          name: card.name,
          type: card.type,
          balance: card.balance,
          creditLimit: card.creditLimit,
          apr: card.apr,
          promoAprEndDate: card.promoAprEndDate,
          notes: card.notes,
          isArchived: card.isArchived,
        }}
      />
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ card: Account }> = ({ card }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-primary mb-4">Card Details</h3>
        <div className="grid grid-cols-2 gap-4">
          {card.creditLimit && (
            <div className="bg-primary/10 rounded-lg p-3">
              <p className="text-xs text-primary opacity-60 mb-1">Credit Limit</p>
              <p className="text-lg font-semibold text-primary">{formatCurrency(card.creditLimit)}</p>
            </div>
          )}
          {card.apr && (
            <div className="bg-primary/10 rounded-lg p-3">
              <p className="text-xs text-primary opacity-60 mb-1">APR</p>
              <p className="text-lg font-semibold text-primary">{card.apr}%</p>
            </div>
          )}
          {card.annualFee !== undefined && (
            <div className="bg-primary/10 rounded-lg p-3">
              <p className="text-xs text-primary opacity-60 mb-1">Annual Fee</p>
              <p className="text-lg font-semibold text-primary">{formatCurrency(card.annualFee)}</p>
            </div>
          )}
          {card.baseRewardsRate && (
            <div className="bg-primary/10 rounded-lg p-3">
              <p className="text-xs text-primary opacity-60 mb-1">Base Rewards Rate</p>
              <p className="text-lg font-semibold text-primary">{card.baseRewardsRate}x</p>
            </div>
          )}
        </div>
      </div>

      {card.paymentDueDay && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Payment due on day {card.paymentDueDay} of each month
          </p>
        </div>
      )}
    </div>
  );
};
