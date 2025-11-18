/**
 * BudgetEditor Modal Component
 *
 * Modal dialog for creating and editing budgets with form validation.
 */

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, DollarSign, TrendingUp, Lightbulb } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import type { Budget, Category } from '../../types';
import type { BudgetRecommendation } from '../../utils/budgetRecommendations';

export interface BudgetEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { categoryId: string; month: string; limit: number }) => Promise<void>;
  categories: Category[];
  month: string;
  existingBudget?: Budget;
  previousMonthSpent?: number;
  categoryName?: string;
  recommendation?: BudgetRecommendation | null;
  onCategoryChange?: (categoryId: string) => void;
  initialCategoryId?: string;
}

const BudgetEditor: React.FC<BudgetEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  month,
  existingBudget,
  previousMonthSpent,
  categoryName,
  recommendation,
  onCategoryChange,
  initialCategoryId,
}) => {
  const [categoryId, setCategoryId] = useState(existingBudget?.categoryId || initialCategoryId || '');
  const [limit, setLimit] = useState(existingBudget?.limit?.toString() || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!existingBudget;

  // Reset form when modal opens/closes or budget changes
  useEffect(() => {
    if (isOpen) {
      console.log('[BudgetEditor] Modal opened with:', {
        existingBudget,
        recommendation,
        categoriesCount: categories.length,
        initialCategoryId,
      });

      const selectedCategory = existingBudget?.categoryId || initialCategoryId || '';
      console.log('[BudgetEditor] Setting category to:', selectedCategory);
      setCategoryId(selectedCategory);

      // Pre-fill with recommendation for new budgets, or existing limit for edits
      if (existingBudget) {
        console.log('[BudgetEditor] Editing existing budget, setting limit to:', existingBudget.limit);
        setLimit(existingBudget.limit?.toString() || '');
      } else if (recommendation?.suggested) {
        console.log('[BudgetEditor] Pre-filling with recommendation:', recommendation.suggested);
        setLimit(recommendation.suggested.toString());
      } else {
        console.log('[BudgetEditor] No recommendation available, leaving limit empty');
        setLimit('');
      }

      setError('');
    }
  }, [isOpen, existingBudget, recommendation, categories.length, initialCategoryId]);

  // Don't render if not open
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    const limitNum = parseFloat(limit);
    if (isNaN(limitNum) || limitNum < 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        categoryId,
        month,
        limit: limitNum,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);

  // Format month display
  const monthDisplay = new Date(month + '-01').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md max-h-[90vh] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 flex flex-col">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEditing ? 'Edit Budget' : 'Create Budget'}
            </h2>
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

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-5">
          {/* Category Selector */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
              Category
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => {
                const newCategoryId = e.target.value;
                console.log('[BudgetEditor] Category changed to:', newCategoryId);
                setCategoryId(newCategoryId);
                if (onCategoryChange) {
                  console.log('[BudgetEditor] Calling onCategoryChange callback');
                  onCategoryChange(newCategoryId);
                }
              }}
              disabled={isEditing || saving}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
              required
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {isEditing && categoryName && (
              <p className="mt-1.5 text-xs text-slate-500">
                Editing budget for <span className="font-medium">{categoryName}</span>
              </p>
            )}
          </div>

          {/* Budget Amount */}
          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-slate-700 mb-2">
              Budget Limit
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <DollarSign className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="limit"
                type="number"
                step="0.01"
                min="0"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Smart Recommendation */}
          {recommendation && !isEditing && (
            <div className={`rounded-lg border p-3 ${
              recommendation.confidence === 'high'
                ? 'bg-emerald-50 border-emerald-200'
                : recommendation.confidence === 'medium'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-start gap-2">
                <Lightbulb className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                  recommendation.confidence === 'high'
                    ? 'text-emerald-600'
                    : recommendation.confidence === 'medium'
                    ? 'text-blue-600'
                    : 'text-amber-600'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${
                    recommendation.confidence === 'high'
                      ? 'text-emerald-900'
                      : recommendation.confidence === 'medium'
                      ? 'text-blue-900'
                      : 'text-amber-900'
                  }`}>
                    Smart Recommendation
                  </p>
                  <p className="text-xs text-slate-700 mt-1">
                    Based on {recommendation.monthsAnalyzed} month{recommendation.monthsAnalyzed > 1 ? 's' : ''} of spending:
                    <span className="font-semibold"> ${recommendation.average.toFixed(0)}</span> avg
                    {recommendation.min !== recommendation.max && (
                      <span className="text-slate-600">
                        {' '}(${recommendation.min.toFixed(0)} - ${recommendation.max.toFixed(0)})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Suggested amount includes 10% buffer for safety
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Historical Insight */}
          {previousMonthSpent !== undefined && previousMonthSpent > 0 && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700">
                  <p className="font-medium text-blue-900">Previous Month Spending</p>
                  <p className="mt-1">
                    You spent <span className="font-semibold">{formatCurrency(previousMonthSpent)}</span> last month
                    in this category.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-rose-900">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
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
                  {isEditing ? 'Update Budget' : 'Create Budget'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetEditor;
