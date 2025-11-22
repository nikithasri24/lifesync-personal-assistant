/**
 * CreditCardCard Component
 * Displays credit card details with utilization, due dates, and payment tracking
 */

import React from 'react';
import { CreditCard, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import type { Account } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface CreditCardCardProps {
  card: Account;
  className?: string;
}

export const CreditCardCard: React.FC<CreditCardCardProps> = ({ card, className = '' }) => {
  // Calculate utilization percentage
  const utilization = card.creditLimit && card.creditLimit > 0
    ? (Math.abs(card.balance) / card.creditLimit) * 100
    : 0;

  const availableCredit = card.creditLimit ? card.creditLimit - Math.abs(card.balance) : 0;

  // Calculate next due date
  const getNextDueDate = () => {
    if (!card.paymentDueDay) return null;
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth(), card.paymentDueDay);

    // If due date has passed this month, show next month
    if (dueDate < today) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }

    return dueDate;
  };

  const nextDueDate = getNextDueDate();
  const daysUntilDue = nextDueDate
    ? Math.ceil((nextDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Status-based styling
  const getUtilizationStatus = () => {
    if (utilization >= 90) return {
      status: 'critical',
      borderColor: 'border-rose-500/30',
      bgColor: 'bg-rose-500/10',
      textColor: 'text-rose-700',
      barColor: 'bg-rose-500',
      icon: '🔴',
      message: 'Very high utilization - pay down soon'
    };
    if (utilization >= 70) return {
      status: 'warning',
      borderColor: 'border-amber-500/30',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-700',
      barColor: 'bg-amber-500',
      icon: '⚠️',
      message: 'High utilization - consider paying down'
    };
    if (utilization >= 30) return {
      status: 'good',
      borderColor: 'border-blue-500/30',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-700',
      barColor: 'bg-blue-500',
      icon: '✓',
      message: 'Healthy utilization'
    };
    return {
      status: 'excellent',
      borderColor: 'border-emerald-500/30',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-700',
      barColor: 'bg-emerald-500',
      icon: '✨',
      message: 'Excellent utilization'
    };
  };

  const statusConfig = getUtilizationStatus();

  // Due date warning
  const getDueDateStatus = () => {
    if (!daysUntilDue) return null;
    if (daysUntilDue <= 3) return {
      color: 'text-rose-600',
      icon: '🔴',
      message: 'Due very soon!'
    };
    if (daysUntilDue <= 7) return {
      color: 'text-amber-600',
      icon: '⚠️',
      message: 'Due soon'
    };
    return {
      color: 'text-primary opacity-70',
      icon: '📅',
      message: ''
    };
  };

  const dueDateStatus = getDueDateStatus();

  return (
    <div
      className={`rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 ${statusConfig.borderColor} p-5 transition-all hover:shadow-md ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg ${statusConfig.bgColor} p-2.5`}>
            <CreditCard className={`h-5 w-5 ${statusConfig.textColor}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary">{card.name}</h3>
            {card.apr && (
              <p className="text-xs text-primary opacity-60 mt-0.5">
                {card.apr.toFixed(2)}% APR
              </p>
            )}
          </div>
        </div>
        <span className="text-2xl">{statusConfig.icon}</span>
      </div>

      {/* Rewards and Annual Fee */}
      {(card.rewardsBalance !== undefined || card.annualFee !== undefined) && (
        <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-primary/20">
          {card.rewardsBalance !== undefined && (
            <div>
              <p className="text-xs font-medium text-primary opacity-70 mb-1">
                {card.rewardsType === 'points' ? 'Points' : card.rewardsType === 'miles' ? 'Miles' : 'Cash Back'}
              </p>
              <p className="text-lg font-bold text-blue-600">
                {card.rewardsType === 'cashback'
                  ? formatCurrency(card.rewardsBalance)
                  : card.rewardsBalance.toLocaleString()}
              </p>
            </div>
          )}
          {card.annualFee !== undefined && card.annualFee > 0 && (
            <div>
              <p className="text-xs font-medium text-primary opacity-70 mb-1">Annual Fee</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(card.annualFee)}
              </p>
              {card.annualFeeDueDate && (
                <p className="text-xs text-primary opacity-60 mt-0.5">
                  Due {new Date(card.annualFeeDueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Balance and Limit */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs font-medium text-primary opacity-70 mb-1">Current Balance</p>
          <p className="text-xl font-bold text-primary">
            {formatCurrency(Math.abs(card.balance))}
          </p>
        </div>
        {card.creditLimit && (
          <div>
            <p className="text-xs font-medium text-primary opacity-70 mb-1">Credit Limit</p>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(card.creditLimit)}
            </p>
          </div>
        )}
      </div>

      {/* Utilization Bar */}
      {card.creditLimit && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-primary opacity-70">Utilization</span>
            <span className={`text-sm font-semibold ${statusConfig.textColor}`}>
              {utilization.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-primary/20 overflow-hidden">
            <div
              className={`h-full ${statusConfig.barColor} transition-all duration-300`}
              style={{ width: `${Math.min(100, utilization)}%` }}
            />
          </div>
          <p className="text-xs text-primary opacity-60 mt-1.5">
            {formatCurrency(availableCredit)} available
          </p>
        </div>
      )}

      {/* Status Message */}
      <div className={`mb-4 p-2.5 rounded-lg ${statusConfig.bgColor} border border-primary/20`}>
        <p className={`text-xs font-medium ${statusConfig.textColor}`}>
          {statusConfig.message}
        </p>
      </div>

      {/* Payment Info */}
      <div className="space-y-2 pt-3 border-t border-primary/20">
        {card.minimumPayment && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-primary opacity-60" />
              <span className="text-xs font-medium text-primary opacity-70">Minimum Payment</span>
            </div>
            <span className="text-sm font-semibold text-primary">
              {formatCurrency(card.minimumPayment)}
            </span>
          </div>
        )}

        {nextDueDate && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {dueDateStatus && <span>{dueDateStatus.icon}</span>}
              <Calendar className="h-3.5 w-3.5 text-primary opacity-60" />
              <span className="text-xs font-medium text-primary opacity-70">Next Due Date</span>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${dueDateStatus?.color || 'text-primary'}`}>
                {nextDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              {daysUntilDue !== null && (
                <p className="text-xs text-primary opacity-60">
                  {daysUntilDue === 0 ? 'Today' : `${daysUntilDue} days`}
                </p>
              )}
            </div>
          </div>
        )}

        {card.statementDate && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary opacity-60" />
              <span className="text-xs font-medium text-primary opacity-70">Last Statement</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-primary">
                {new Date(card.statementDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              {card.statementBalance !== undefined && (
                <p className="text-xs text-primary opacity-60">
                  {formatCurrency(Math.abs(card.statementBalance))}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditCardCard;
