/**
 * TransactionGroupHeader
 * Collapsible header for a transaction group showing category name, count, and budget progress
 */

import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface TransactionGroupHeaderProps {
  categoryId: string | null;
  categoryName: string;
  transactionCount: number;
  total: number;
  budgetLimit?: number;
  isCollapsed: boolean;
  onToggle: () => void;
  isIncome?: boolean;
}

export const TransactionGroupHeader: React.FC<TransactionGroupHeaderProps> = ({
  categoryId,
  categoryName,
  transactionCount,
  total,
  budgetLimit,
  isCollapsed,
  onToggle,
  isIncome = false,
}) => {
  return (
    <div className="bg-slate-100">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-200 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5 text-slate-700" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-700" />
          )}
          <div className="text-left">
            <h3 className="font-semibold text-slate-900">
              {categoryName}
              {!categoryId && (
                <span className="ml-2 text-xs font-normal text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Needs categorization
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-600">
              {transactionCount} transaction
              {transactionCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="text-right">
          {budgetLimit ? (
            <div>
              <p className="text-sm font-semibold text-slate-900">
                <span className={total > budgetLimit ? 'text-rose-600' : 'text-emerald-600'}>
                  {formatCurrency(total)}
                </span>
                {' / '}
                {formatCurrency(budgetLimit)}
              </p>
              <p className="text-xs text-slate-600">
                {formatCurrency(Math.max(0, budgetLimit - total))} remaining
              </p>
            </div>
          ) : (
            <div>
              <p className={`font-semibold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isIncome ? '+' : ''}{formatCurrency(total)}
              </p>
              <p className="text-xs text-slate-500 italic">No budget set</p>
            </div>
          )}
        </div>
      </button>

      {/* Budget Progress Bar */}
      {budgetLimit && (
        <div className="px-4 pb-3">
          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                total > budgetLimit
                  ? 'bg-rose-500'
                  : total > budgetLimit * 0.9
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.min(100, (total / budgetLimit) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

