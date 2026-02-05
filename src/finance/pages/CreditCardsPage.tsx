/**
 * Credit Cards Page
 * Comprehensive credit card management with benefits, rewards, and offers tracking
 */

import React, { useState } from 'react';
import { CreditCard, Plus, Loader2, Gift, TrendingUp } from 'lucide-react';
import { useAccountsQuery, useFinanceMergedConnectionQuery } from '@/hooks/useFinanceQuery';
import type { Account } from '../types';
import { formatCurrency } from '../utils/currency';
import { CreditCardDetailsModal } from '../components/creditCards/CreditCardDetailsModal';
import { WelcomeBonusTracker } from '../components/creditCards/WelcomeBonusTracker';
import { UtilizationDashboard } from '../components/creditCards/UtilizationDashboard';
import { useAuth } from '@/hooks/useAuth';
import { OwnerBadge } from '../components/OwnerBadge';

type TabType = 'cards' | 'bonuses' | 'utilization';

const CreditCardsPage: React.FC = () => {
  const [selectedCard, setSelectedCard] = useState<Account | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('cards');

  // Auth and merged connection
  const { user } = useAuth();
  const { data: mergedConnection } = useFinanceMergedConnectionQuery();

  // Get partner name from merged connection
  const partnerName = React.useMemo(() => {
    if (!mergedConnection || !user) return undefined;
    return mergedConnection.partnerName;
  }, [mergedConnection, user]);

  const { data: accounts = [], isLoading, error } = useAccountsQuery();

  // Filter for credit card accounts only
  const creditCards = accounts.filter(acc => acc.type === 'credit');

  // Calculate summary stats
  const totalBalance = creditCards.reduce((sum, card) => sum + card.balance, 0);
  const totalCreditLimit = creditCards.reduce((sum, card) => sum + (card.creditLimit || 0), 0);
  const totalRewards = creditCards.reduce((sum, card) => sum + (card.rewardsBalance || 0), 0);
  const utilizationRate = totalCreditLimit > 0 ? (Math.abs(totalBalance) / totalCreditLimit) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading credit cards</p>
          <p className="text-sm text-primary opacity-60">{error.message}</p>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'cards', label: 'My Cards', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'bonuses', label: 'Welcome Bonuses', icon: <Gift className="h-4 w-4" /> },
    { id: 'utilization', label: 'Utilization', icon: <TrendingUp className="h-4 w-4" /> },
  ];

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Credit Cards</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-primary/10 mb-6">
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
      {activeTab === 'cards' && (
        <>
          {/* Summary Cards */}
          {creditCards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-primary/30 backdrop-blur-sm rounded-2xl p-4 ring-1 ring-primary/10">
                <p className="text-sm text-primary opacity-60 mb-1">Total Balance</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(Math.abs(totalBalance))}</p>
                <p className="text-xs text-primary opacity-60 mt-1">
                  {creditCards.length} card{creditCards.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="bg-primary/30 backdrop-blur-sm rounded-2xl p-4 ring-1 ring-primary/10">
                <p className="text-sm text-primary opacity-60 mb-1">Credit Limit</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalCreditLimit)}</p>
                <p className="text-xs text-primary opacity-60 mt-1">Total available</p>
              </div>

              <div className="bg-primary/30 backdrop-blur-sm rounded-2xl p-4 ring-1 ring-primary/10">
                <p className="text-sm text-primary opacity-60 mb-1">Utilization</p>
                <p className="text-2xl font-bold text-primary">{utilizationRate.toFixed(1)}%</p>
                <p className={`text-xs mt-1 ${utilizationRate < 30 ? 'text-emerald-400' : utilizationRate < 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {utilizationRate < 30 ? 'Excellent' : utilizationRate < 50 ? 'Good' : 'High'}
                </p>
              </div>

              <div className="bg-primary/30 backdrop-blur-sm rounded-2xl p-4 ring-1 ring-primary/10">
                <p className="text-sm text-primary opacity-60 mb-1">Total Rewards</p>
                <p className="text-2xl font-bold text-primary">{totalRewards.toLocaleString()}</p>
                <p className="text-xs text-primary opacity-60 mt-1">Points/miles/cashback</p>
              </div>
            </div>
          )}

          {/* Credit Cards Grid */}
          {creditCards.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-lg font-semibold text-primary mb-2">No credit cards yet</h3>
              <p className="text-primary opacity-60 mb-4">
                Add your credit cards to track balances, rewards, and benefits
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creditCards.map((card) => (
                <CreditCardCard
                  key={card.id}
                  card={card}
                  onClick={() => setSelectedCard(card)}
                  currentUserId={user?.id}
                  partnerName={partnerName}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'bonuses' && <WelcomeBonusTracker />}
      {activeTab === 'utilization' && <UtilizationDashboard />}

      {/* Detailed View Modal */}
      {selectedCard && (
        <CreditCardDetailsModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
};

// Credit Card Card Component
interface CreditCardCardProps {
  card: Account;
  onClick: () => void;
  currentUserId?: string;
  partnerName?: string;
}

const CreditCardCard: React.FC<CreditCardCardProps> = ({ card, onClick, currentUserId, partnerName }) => {
  const utilization = card.creditLimit ? (Math.abs(card.balance) / card.creditLimit) * 100 : 0;
  const available = (card.creditLimit || 0) - Math.abs(card.balance);

  return (
    <div
      onClick={onClick}
      className="rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm shadow-sm ring-1 ring-primary/10 p-5 transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer"
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-lg font-semibold text-primary">{card.name}</h3>
            {currentUserId && (
              <OwnerBadge
                userId={card.userId}
                currentUserId={currentUserId}
                partnerName={partnerName}
                size="sm"
              />
            )}
          </div>
          {card.rewardsType && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
              {card.rewardsBalance?.toLocaleString()} {card.rewardsType}
            </span>
          )}
        </div>
        <CreditCard className="h-6 w-6 text-primary opacity-60" />
      </div>

      {/* Balance */}
      <div className="mb-4">
        <p className="text-sm text-primary opacity-60 mb-1">Current Balance</p>
        <p className="text-2xl font-bold text-primary">{formatCurrency(Math.abs(card.balance))}</p>
      </div>

      {/* Credit Limit & Utilization */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-primary opacity-60 mb-1">
          <span>Available: {formatCurrency(available)}</span>
          <span>{utilization.toFixed(1)}% used</span>
        </div>
        <div className="w-full bg-primary/10 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              utilization < 30 ? 'bg-emerald-500' : utilization < 50 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
      </div>

      {/* APR & Limit */}
      <div className="flex items-center justify-between text-xs text-primary opacity-60">
        {card.apr && <span>APR: {card.apr}%</span>}
        {card.creditLimit && <span>Limit: {formatCurrency(card.creditLimit)}</span>}
      </div>
    </div>
  );
};

export default CreditCardsPage;
