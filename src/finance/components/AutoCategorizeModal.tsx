/**
 * Auto-Categorize Modal Component
 *
 * Allows users to auto-categorize uncategorized transactions
 * Shows preview of categorization results before applying
 */

import React from 'react';
import { Button } from '../ui/Button';
import { ConfidenceBadge, ConfidenceProgress } from './ConfidenceBadge';
import { CategorizationEngine, type CategorizationResult } from '../services/categorization/CategorizationEngine';
import { formatCurrency } from '../utils/currency';
import { logger } from '../../services/logger';

export interface AutoCategorizeModalProps {
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    categoryId?: string;
  }>;
  userId: string;
  onClose: () => void;
  onApply: (results: Map<string, { categoryId: string; confidence: number; ruleId: string | null }>) => Promise<void>;
}

export const AutoCategorizeModal: React.FC<AutoCategorizeModalProps> = ({
  transactions,
  userId,
  onClose,
  onApply
}) => {
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<Map<string, CategorizationResult>>(new Map());
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [step, setStep] = React.useState<'analyzing' | 'review' | 'applying'>('analyzing');

  // Filter uncategorized transactions
  const uncategorizedTxns = transactions.filter(t => !t.categoryId);

  // Run categorization on mount
  React.useEffect(() => {
    let cancelled = false;

    async function categorize(): Promise<void> {
      if (cancelled) return;

      setLoading(true);
      setStep('analyzing');

      try {
        // Get Supabase client
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL as string,
          import.meta.env.VITE_SUPABASE_ANON_KEY as string
        );

        const engine = new CategorizationEngine(userId, supabase);
        const categorizedResults = await engine.categorizeBulk(uncategorizedTxns.map(t => ({
          id: t.id,
          userId,
          description: t.description,
          amount: t.amount,
          date: t.date
        })));

        if (cancelled) return;

        setResults(categorizedResults);

        // Auto-select high confidence results
        const autoSelect = new Set<string>();
        categorizedResults.forEach((result, txnId) => {
          if (result.categoryId && result.confidence >= 0.8) {
            autoSelect.add(txnId);
          }
        });
        setSelectedIds(autoSelect);

        setStep('review');
      } catch (error) {
        logger.error('Categorization failed:', { error });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void categorize();

    return () => {
      cancelled = true;
    };
  }, [uncategorizedTxns, userId]);

  const handleApply = async (): Promise<void> => {
    setLoading(true);
    setStep('applying');

    try {
      const toApply = new Map<string, { categoryId: string; confidence: number; ruleId: string | null }>();

      selectedIds.forEach(txnId => {
        const result = results.get(txnId);
        if (result?.categoryId) {
          toApply.set(txnId, {
            categoryId: result.categoryId,
            confidence: result.confidence,
            ruleId: result.ruleId
          });
        }
      });

      await onApply(toApply);
      onClose();
    } catch (error) {
      logger.error('Failed to apply categorization:', { error });
      setLoading(false);
      setStep('review');
    }
  };

  const toggleSelection = (txnId: string): void => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(txnId)) {
      newSelected.delete(txnId);
    } else {
      newSelected.add(txnId);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = (): void => {
    const all = new Set<string>();
    results.forEach((result, txnId) => {
      if (result.categoryId) {
        all.add(txnId);
      }
    });
    setSelectedIds(all);
  };

  const deselectAll = (): void => {
    setSelectedIds(new Set());
  };

  // Calculate stats
  const totalUncategorized = uncategorizedTxns.length;
  const categorizedCount = Array.from(results.values()).filter(r => r.categoryId).length;
  const highConfidence = Array.from(results.values()).filter(r => r.categoryId && r.confidence >= 0.85).length;
  const mediumConfidence = Array.from(results.values()).filter(r => r.categoryId && r.confidence >= 0.6 && r.confidence < 0.85).length;
  const lowConfidence = Array.from(results.values()).filter(r => r.categoryId && r.confidence < 0.6).length;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8 flex flex-col max-h-[calc(100vh-4rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-2xl font-semibold text-slate-900">Auto-Categorize Transactions</h2>
          <p className="text-sm text-slate-600 mt-1">
            Review and apply categorization suggestions
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mb-4"></div>
              <p className="text-slate-600">Analyzing {totalUncategorized} transactions...</p>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-sm text-slate-600">Total</div>
                  <div className="text-2xl font-bold text-slate-900">{totalUncategorized}</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4">
                  <div className="text-sm text-emerald-700">High Confidence</div>
                  <div className="text-2xl font-bold text-emerald-900">{highConfidence}</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-sm text-amber-700">Medium</div>
                  <div className="text-2xl font-bold text-amber-900">{mediumConfidence}</div>
                </div>
                <div className="bg-rose-50 rounded-lg p-4">
                  <div className="text-sm text-rose-700">Low / None</div>
                  <div className="text-2xl font-bold text-rose-900">{lowConfidence + (totalUncategorized - categorizedCount)}</div>
                </div>
              </div>

              {/* Selection controls */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-600">
                  {selectedIds.size} of {categorizedCount} selected
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll}>
                    Deselect All
                  </Button>
                </div>
              </div>

              {/* Transaction list */}
              <div className="space-y-2">
                {uncategorizedTxns.map(txn => {
                  const result = results.get(txn.id);
                  if (!result?.categoryId) return null;

                  const isSelected = selectedIds.has(txn.id);

                  return (
                    <div
                      key={txn.id}
                      onClick={() => toggleSelection(txn.id)}
                      className={`
                        border rounded-lg p-4 cursor-pointer transition-all
                        ${isSelected ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}
                      `}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <div className="mt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                          />
                        </div>

                        {/* Transaction info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-900 truncate">
                                {txn.description}
                              </div>
                              <div className="text-sm text-slate-600">
                                {new Date(txn.date).toLocaleDateString()} • {formatCurrency(txn.amount)}
                              </div>
                            </div>
                            <ConfidenceBadge score={result.confidence} showLabel />
                          </div>

                          {/* Categorization info */}
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-slate-600">Category:</span>
                              <span className="font-medium text-slate-900">{result.categoryName}</span>
                            </div>

                            {result.merchantName && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-600">Merchant:</span>
                                <span className="text-slate-900">{result.merchantName}</span>
                              </div>
                            )}

                            <div className="text-xs text-slate-500 italic">
                              {result.reasoning}
                            </div>

                            <ConfidenceProgress score={result.confidence} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {categorizedCount === 0 && (
                  <div className="text-center py-12 text-slate-600">
                    <div className="text-4xl mb-2">🤷</div>
                    <p>No automatic categorizations found.</p>
                    <p className="text-sm mt-1">Try adding transactions manually to train the system.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'applying' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mb-4"></div>
              <p className="text-slate-600">Applying {selectedIds.size} categorizations...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-between flex-shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => { void handleApply(); }}
            disabled={loading || selectedIds.size === 0 || step !== 'review'}
          >
            Apply {selectedIds.size} Categorization{selectedIds.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
};
