/**
 * LoanCard Component
 * Displays loan information with progress tracking
 */

import React from 'react';
import { Calendar, DollarSign, Edit2, TrendingDown, Clock } from 'lucide-react';
import type { Loan } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { calculateInterestPaidToDate, calculatePrincipalPaidToDate } from '../../utils/loanCalculations';
import { OwnerBadge } from '../../components/common/OwnerBadge';

interface LoanCardProps {
  loan: Loan;
  onEdit: (loan: Loan) => void;
  onAddPayment: (loan: Loan) => void;
  currentUserId?: string;
  partnerName?: string;
}

const LoanCard: React.FC<LoanCardProps> = ({ loan, onEdit, onAddPayment, currentUserId, partnerName }) => {
  // Calculate interest and principal paid (use DB values if available, otherwise calculate)
  const calculatedInterestPaid = calculateInterestPaidToDate(loan);
  const calculatedPrincipalPaid = calculatePrincipalPaidToDate(loan);
  const interestPaid = loan.interestPaid || calculatedInterestPaid;
  const principalPaid = loan.principalPaid || calculatedPrincipalPaid;

  const progressPercentage = ((loan.principalAmount - loan.currentBalance) / loan.principalAmount) * 100;
  const dueDate = new Date(loan.targetPayoffDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate status based on projected vs target payoff date
  const isOnTrack = loan.projectedPayoffDate
    ? new Date(loan.projectedPayoffDate) <= new Date(loan.targetPayoffDate)
    : true;

  const statusConfig = loan.status === 'paid_off'
    ? {
        borderColor: 'border-emerald-500/30',
        icon: '✅',
        iconColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
      }
    : isOnTrack
    ? {
        borderColor: 'border-blue-500/30',
        icon: '📊',
        iconColor: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
      }
    : {
        borderColor: 'border-amber-500/30',
        icon: '⚠️',
        iconColor: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
      };

  return (
    <div
      className={`rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 ${statusConfig.borderColor} p-4 transition-all hover:shadow-md`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-primary">{loan.loanName}</h3>
            {currentUserId && (
              <OwnerBadge
                userId={loan.userId}
                currentUserId={currentUserId}
                partnerName={partnerName}
                size="sm"
              />
            )}
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.bgColor} ${statusConfig.iconColor}`}
            >
              {loan.loanType}
            </span>
          </div>
          {loan.lender && (
            <p className="text-xs text-primary opacity-60 mt-0.5">{loan.lender}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">{statusConfig.icon}</span>
          <button
            onClick={() => onEdit(loan)}
            className="rounded-lg p-1.5 hover:bg-primary/20 transition-colors"
            aria-label={`Edit ${loan.loanName}`}
          >
            <Edit2 className="h-4 w-4 text-primary opacity-60 hover:opacity-100" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-primary opacity-60 mb-1">
          <span>Progress</span>
          <span>{progressPercentage.toFixed(1)}% paid</span>
        </div>
        <div className="w-full bg-primary/10 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-primary/10 rounded-lg p-2">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="h-3.5 w-3.5 text-primary opacity-60" />
            <span className="text-xs text-primary opacity-60">Current Balance</span>
          </div>
          <p className="text-sm font-semibold text-primary">
            {formatCurrency(loan.currentBalance)}
          </p>
        </div>

        <div className="bg-primary/10 rounded-lg p-2">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="h-3.5 w-3.5 text-primary opacity-60" />
            <span className="text-xs text-primary opacity-60">Monthly Payment</span>
          </div>
          <p className="text-sm font-semibold text-primary">
            {formatCurrency(loan.monthlyPayment + loan.extraPayment)}
          </p>
          {loan.extraPayment > 0 && (
            <p className="text-xs text-emerald-400">
              +{formatCurrency(loan.extraPayment)} extra
            </p>
          )}
        </div>

        <div className="bg-primary/10 rounded-lg p-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar className="h-3.5 w-3.5 text-primary opacity-60" />
            <span className="text-xs text-primary opacity-60">Target Payoff</span>
          </div>
          <p className="text-sm font-semibold text-primary">{dueDate}</p>
        </div>

        <div className="bg-primary/10 rounded-lg p-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="h-3.5 w-3.5 text-primary opacity-60" />
            <span className="text-xs text-primary opacity-60">Remaining</span>
          </div>
          <p className="text-sm font-semibold text-primary">
            {loan.remainingPayments ? `${loan.remainingPayments} payments` : 'Calculating...'}
          </p>
        </div>
      </div>

      {/* Interest Rate & Total Info */}
      <div className="flex items-center justify-between text-xs text-primary opacity-60 mb-3">
        <span>Interest Rate: {loan.interestRate}% APR</span>
        <span>
          Principal: {formatCurrency(loan.principalAmount)}
        </span>
      </div>

      {interestPaid > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2 mb-3">
          <div className="flex justify-between text-xs">
            <span className="text-gray-700 dark:text-gray-300">Interest paid so far:</span>
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              {formatCurrency(interestPaid)}
            </span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-700 dark:text-gray-300">Principal paid:</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(principalPaid)}
            </span>
          </div>
        </div>
      )}

      {/* Projected vs Target */}
      {loan.projectedPayoffDate && loan.status !== 'paid_off' && (
        <div className={`text-xs p-2 rounded-lg ${statusConfig.bgColor} ${statusConfig.iconColor}`}>
          {isOnTrack ? (
            <span>On track to pay off by target date</span>
          ) : (
            <span>
              Projected payoff:{' '}
              {new Date(loan.projectedPayoffDate).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </span>
          )}
        </div>
      )}

      {/* Add Payment Button */}
      {loan.status === 'active' && (
        <button
          onClick={() => onAddPayment(loan)}
          className="w-full mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Record Payment
        </button>
      )}
    </div>
  );
};

export { LoanCard };
