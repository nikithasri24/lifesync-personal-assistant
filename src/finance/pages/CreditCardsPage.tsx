/**
 * CreditCardsPage - Track all credit cards with utilization, balances, and payments
 * Inspired by MoneyPatrol and MaxRewards credit card tracking
 */

import React from 'react';
import { CreditCard, TrendingDown, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import { getFinanceAPI } from '../data';
import type { Account } from '../types';
import { formatCurrency } from '../utils/currency';
import { CreditCardCard } from '../components/creditCards/CreditCardCard';
import { CreditCardDetailsPage } from './CreditCardDetailsPage';

const CreditCardsPage: React.FC = () => {
  const [creditCards, setCreditCards] = React.useState<Account[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedCardId, setSelectedCardId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const api = await getFinanceAPI();
        const accounts = await api.listAccounts();
        const cards = accounts.filter(a => a.type === 'credit');
        if (!mounted) return;
        setCreditCards(cards);
      } catch (error) {
        console.error('[CreditCardsPage] Failed to load credit cards:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Calculate summary metrics
  const totalBalance = creditCards.reduce((sum, card) => sum + Math.abs(card.balance), 0);
  const totalCreditLimit = creditCards.reduce((sum, card) => sum + (card.creditLimit || 0), 0);
  const totalAvailable = totalCreditLimit - totalBalance;
  const overallUtilization = totalCreditLimit > 0 ? (totalBalance / totalCreditLimit) * 100 : 0;

  // Count cards by status
  const highUtilizationCards = creditCards.filter(c => {
    if (!c.creditLimit) return false;
    const util = (Math.abs(c.balance) / c.creditLimit) * 100;
    return util >= 70;
  });

  const cardsWithDueDates = creditCards.filter(c => c.paymentDueDay).length;

  // Get upcoming payments
  const getNextDueDate = (card: Account) => {
    if (!card.paymentDueDay) return null;
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth(), card.paymentDueDay);
    if (dueDate < today) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }
    return dueDate;
  };

  const upcomingPayments = creditCards
    .filter(c => c.paymentDueDay && c.minimumPayment)
    .map(c => ({
      card: c,
      dueDate: getNextDueDate(c)!,
      amount: c.minimumPayment!
    }))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-2" />
          <p className="text-sm text-primary opacity-60">Loading credit cards...</p>
        </div>
      </div>
    );
  }

  // Show details page if a card is selected
  if (selectedCardId) {
    return (
      <CreditCardDetailsPage
        accountId={selectedCardId}
        onBack={() => setSelectedCardId(null)}
      />
    );
  }

  if (creditCards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <CreditCard className="h-16 w-16 text-primary opacity-40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">No Credit Cards Yet</h3>
          <p className="text-sm text-primary opacity-70 mb-6">
            Add your credit cards in the Accounts section to track utilization, payments, and avoid fees.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-rose-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-rose-500/10 p-2">
              <TrendingDown className="h-4 w-4 text-rose-600" />
            </div>
            <h3 className="text-sm font-medium text-primary opacity-70">Total Balance</h3>
          </div>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalBalance)}</p>
          <p className="text-xs text-primary opacity-60 mt-1">{creditCards.length} cards</p>
        </div>

        {/* Credit Limit */}
        <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-blue-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-primary opacity-70">Total Limit</h3>
          </div>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalCreditLimit)}</p>
          <p className="text-xs text-primary opacity-60 mt-1">{formatCurrency(totalAvailable)} available</p>
        </div>

        {/* Overall Utilization */}
        <div className={`rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 ${
          overallUtilization >= 70 ? 'border-amber-500/30' : 'border-emerald-500/30'
        } p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`rounded-lg ${
              overallUtilization >= 70 ? 'bg-amber-500/10' : 'bg-emerald-500/10'
            } p-2`}>
              {overallUtilization >= 70 ? (
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              )}
            </div>
            <h3 className="text-sm font-medium text-primary opacity-70">Utilization</h3>
          </div>
          <p className="text-2xl font-bold text-primary">{overallUtilization.toFixed(1)}%</p>
          <p className={`text-xs mt-1 ${
            overallUtilization >= 70 ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {overallUtilization >= 70 ? 'High' : 'Healthy'}
          </p>
        </div>

        {/* High Utilization Alert */}
        <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-primary/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <AlertTriangle className="h-4 w-4 text-primary opacity-60" />
            </div>
            <h3 className="text-sm font-medium text-primary opacity-70">High Utilization</h3>
          </div>
          <p className="text-2xl font-bold text-primary">{highUtilizationCards.length}</p>
          <p className="text-xs text-primary opacity-60 mt-1">
            {highUtilizationCards.length > 0 ? 'cards need attention' : 'all cards healthy'}
          </p>
        </div>
      </div>

      {/* Upcoming Payments */}
      {upcomingPayments.length > 0 && (
        <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-primary/20 p-5">
          <h3 className="text-lg font-semibold text-primary mb-4">Upcoming Payments</h3>
          <div className="space-y-3">
            {upcomingPayments.map(({ card, dueDate, amount }) => {
              const daysUntil = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysUntil <= 3;
              const isWarning = daysUntil <= 7;

              return (
                <div
                  key={card.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isUrgent
                      ? 'bg-rose-500/10 border border-rose-500/30'
                      : isWarning
                      ? 'bg-amber-500/10 border border-amber-500/30'
                      : 'bg-primary/10 border border-primary/20'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary">{card.name}</p>
                    <p className="text-xs text-primary opacity-60 mt-0.5">
                      Minimum: {formatCurrency(amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      isUrgent ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-primary'
                    }`}>
                      {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-primary opacity-60">
                      {daysUntil === 0 ? 'Today' : `${daysUntil} days`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Credit Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary">Your Credit Cards</h3>
          <p className="text-sm text-primary opacity-60">
            {creditCards.length} {creditCards.length === 1 ? 'card' : 'cards'}
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {creditCards.map(card => (
            <div
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              className="cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <CreditCardCard card={card} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreditCardsPage;
