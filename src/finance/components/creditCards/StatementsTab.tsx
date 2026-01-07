/**
 * StatementsTab Component
 * Track credit card statements, payment history, and balance over time
 */

import React, { useMemo } from 'react';
import { Calendar, DollarSign, TrendingDown, TrendingUp, FileText } from 'lucide-react';
import { useTransactionsQuery } from '@/hooks/useFinanceQuery';
import { formatCurrency } from '../../utils/currency';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import type { Account, Transaction } from '../../types';

interface StatementsTabProps {
  accountId: string;
  card?: Account;
}

interface MonthlyStatement {
  month: string;
  balance: number;
  payments: number;
  purchases: number;
  transactionCount: number;
}

export const StatementsTab: React.FC<StatementsTabProps> = ({ accountId, card }) => {
  // Fetch transactions for the last 12 months
  const { data: transactions = [] } = useTransactionsQuery({
    accountIds: [accountId],
    limit: 1000,
  });

  // Generate monthly statements from transactions
  const monthlyStatements = useMemo(() => {
    const statements: MonthlyStatement[] = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthKey = format(monthDate, 'yyyy-MM');

      const monthTransactions = transactions.filter((t: Transaction) => {
        const txnDate = new Date(t.dateISO);
        return txnDate >= monthStart && txnDate <= monthEnd;
      });

      const payments = monthTransactions
        .filter((t: Transaction) => t.type === 'credit')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      const purchases = monthTransactions
        .filter((t: Transaction) => t.type === 'debit')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      statements.push({
        month: monthKey,
        balance: purchases - payments,
        payments,
        purchases,
        transactionCount: monthTransactions.length,
      });
    }

    return statements.reverse();
  }, [transactions]);

  // Calculate payment history stats
  const stats = useMemo(() => {
    const totalPayments = monthlyStatements.reduce((sum, s) => sum + s.payments, 0);
    const totalPurchases = monthlyStatements.reduce((sum, s) => sum + s.purchases, 0);
    const avgMonthlySpend = totalPurchases / monthlyStatements.length;
    const avgMonthlyPayment = totalPayments / monthlyStatements.length;

    return {
      totalPayments,
      totalPurchases,
      avgMonthlySpend,
      avgMonthlyPayment,
    };
  }, [monthlyStatements]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-primary/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-primary opacity-60" />
            <p className="text-xs text-primary opacity-60">Avg Monthly Spend</p>
          </div>
          <p className="text-lg font-semibold text-primary">{formatCurrency(stats.avgMonthlySpend)}</p>
        </div>

        <div className="bg-primary/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-primary opacity-60" />
            <p className="text-xs text-primary opacity-60">Avg Monthly Payment</p>
          </div>
          <p className="text-lg font-semibold text-primary">{formatCurrency(stats.avgMonthlyPayment)}</p>
        </div>

        <div className="bg-primary/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary opacity-60" />
            <p className="text-xs text-primary opacity-60">Total Purchases (12mo)</p>
          </div>
          <p className="text-lg font-semibold text-primary">{formatCurrency(stats.totalPurchases)}</p>
        </div>

        <div className="bg-primary/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-primary opacity-60" />
            <p className="text-xs text-primary opacity-60">Total Payments (12mo)</p>
          </div>
          <p className="text-lg font-semibold text-primary">{formatCurrency(stats.totalPayments)}</p>
        </div>
      </div>

      {/* Current Balance */}
      {card && (
        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary opacity-60 mb-1">Current Balance</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(Math.abs(card.balance))}</p>
            </div>
            {card.paymentDueDay && (
              <div className="text-right">
                <p className="text-sm text-primary opacity-60 mb-1">Payment Due</p>
                <p className="text-lg font-semibold text-primary">Day {card.paymentDueDay}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Monthly Statements */}
      <div>
        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Monthly Statements
        </h3>
        <div className="space-y-2">
          {monthlyStatements.map((statement) => (
            <div
              key={statement.month}
              className="bg-primary/5 hover:bg-primary/10 rounded-lg p-4 transition-colors border border-primary/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-primary">{format(new Date(statement.month + '-01'), 'MMMM yyyy')}</p>
                  <p className="text-sm text-primary opacity-60">{statement.transactionCount} transactions</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-right">
                  <div>
                    <p className="text-xs text-primary opacity-60">Purchases</p>
                    <p className="font-semibold text-primary">{formatCurrency(statement.purchases)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-primary opacity-60">Payments</p>
                    <p className="font-semibold text-emerald-600">{formatCurrency(statement.payments)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-primary opacity-60">Net</p>
                    <p className={`font-semibold ${statement.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {formatCurrency(Math.abs(statement.balance))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

