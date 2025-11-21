/**
 * BudgetBulkEditor Component
 *
 * Allows creating/editing budgets for ALL categories at once with smart recommendations
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Lightbulb, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import type { Category, Transaction } from '../../types';
import { calculateBudgetRecommendation, type BudgetRecommendation } from '../../utils/budgetRecommendations';
import { logger } from '../../../services/logger';

export interface BudgetBulkEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (budgets: Array<{ categoryId: string; month: string; limit: number }>) => Promise<void>;
  categories: Category[];
  transactions: Transaction[];
  month: string;
  existingBudgets: Map<string, number>; // categoryId -> limit
}

interface CategoryBudgetRow {
  category: Category;
  recommendation: BudgetRecommendation | null;
  currentLimit: number;
  userLimit: string; // User's edited value
}

const BudgetBulkEditor: React.FC<BudgetBulkEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  transactions,
  month,
  existingBudgets,
}) => {
  const [rows, setRows] = useState<CategoryBudgetRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Initialize rows when modal opens
  useEffect(() => {
    if (isOpen && categories.length > 0) {
      logger.debug('[BudgetBulkEditor] Initializing rows for categories', { count: categories.length });

      const initialRows: CategoryBudgetRow[] = categories.map((category) => {
        const recommendation = calculateBudgetRecommendation(transactions, category.id, 3);
        const currentLimit = existingBudgets.get(category.id) || 0;

        // Pre-fill with recommendation if no existing budget, otherwise use existing
        const initialValue = currentLimit > 0
          ? currentLimit
          : (recommendation?.suggested || 0);

        logger.debug('BudgetBulkEditor', `Category: ${category.name}`, {
          recommendation: recommendation?.suggested,
          currentLimit,
          initialValue,
        });

        return {
          category,
          recommendation,
          currentLimit,
          userLimit: initialValue > 0 ? initialValue.toString() : '',
        };
      });

      setRows(initialRows);
      setError('');
    }
  }, [isOpen, categories, transactions, existingBudgets]);

  if (!isOpen) return null;

  const handleLimitChange = (categoryId: string, value: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.category.id === categoryId ? { ...row, userLimit: value } : row
      )
    );
  };

  const handleUseRecommendation = (categoryId: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.category.id === categoryId && row.recommendation) {
          return { ...row, userLimit: row.recommendation.suggested.toString() };
        }
        return row;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate and collect budgets
    const budgetsToSave: Array<{ categoryId: string; month: string; limit: number }> = [];

    for (const row of rows) {
      const limitStr = row.userLimit.trim();
      if (limitStr === '') continue; // Skip empty budgets

      const limitNum = parseFloat(limitStr);
      if (isNaN(limitNum) || limitNum < 0) {
        setError(`Invalid amount for ${row.category.name}: ${limitStr}`);
        return;
      }

      budgetsToSave.push({
        categoryId: row.category.id,
        month,
        limit: limitNum,
      });
    }

    if (budgetsToSave.length === 0) {
      setError('Please enter at least one budget amount');
      return;
    }

    try {
      setSaving(true);
      logger.debug('[BudgetBulkEditor] Saving budgets', { count: budgetsToSave.length });
      await onSave(budgetsToSave);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save budgets');
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Format month display
  const monthDisplay = new Date(month + '-01').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const totalBudget = rows.reduce((sum, row) => {
    const val = parseFloat(row.userLimit);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Create Budgets</h2>
            <p className="text-sm text-slate-600 mt-0.5">{monthDisplay}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Table */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <table className="w-full">
              <thead className="sticky top-0 bg-white border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Recommendation
                  </th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Budget Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.category.id} className="hover:bg-slate-50">
                    <td className="py-3 px-2">
                      <div className="font-medium text-slate-900">{row.category.name}</div>
                    </td>
                    <td className="py-3 px-2">
                      {row.recommendation ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-1">
                              <Lightbulb className={`h-3.5 w-3.5 ${
                                row.recommendation.confidence === 'high'
                                  ? 'text-emerald-600'
                                  : row.recommendation.confidence === 'medium'
                                  ? 'text-blue-600'
                                  : 'text-amber-600'
                              }`} />
                              <span className="text-sm font-semibold text-slate-900">
                                ${row.recommendation.suggested.toFixed(0)}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Avg: ${row.recommendation.average.toFixed(0)} ({row.recommendation.monthsAnalyzed}mo)
                            </div>
                          </div>
                          {row.userLimit !== row.recommendation.suggested.toString() && (
                            <button
                              type="button"
                              onClick={() => handleUseRecommendation(row.category.id)}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Use
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-400">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span className="text-xs">No history</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-end">
                        <div className="relative w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={row.userLimit}
                            onChange={(e) => handleLimitChange(row.category.id, e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white pl-7 pr-3 py-1.5 text-sm text-slate-900 text-right focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex-shrink-0">
            {/* Total */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-700">Total Monthly Budget:</span>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(totalBudget)}</span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-900">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Budgets
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetBulkEditor;
