/**
 * Enhanced Transactions Page with Auto-Categorization
 *
 * Features:
 * - Auto-categorize uncategorized transactions
 * - Confidence indicators
 * - Manual categorization with learning
 */

import React from 'react';
import { Card } from '../components/Card';
import { DataTable } from '../components/DataTable';
import { FiltersBar } from '../components/FiltersBar';
import { Button } from '../ui/Button';
import { ConfidenceIndicator } from '../components/ConfidenceBadge';
import { AutoCategorizeModal } from '../components/AutoCategorizeModal';
import { QuickAddTransaction } from '../components/QuickAddTransaction';
import ImportCSVButton from '../components/ImportCSVButton';
import { getFinanceAPI } from '../data';
import { formatCurrency } from '../utils/currency';
import useFinanceFilters from '../store/useFinanceFilters';
import type { Transaction } from '../types';
import { toCSV, downloadCSV } from '../utils/csv';
import { logger } from '../../services/logger';

const TransactionsPageEnhanced: React.FC = () => {
  const [rows, setRows] = React.useState<Transaction[]>([]);
  const [next, setNext] = React.useState<string | undefined>();
  const [loading, setLoading] = React.useState(false);
  const [showAutoCategorize, setShowAutoCategorize] = React.useState(false);
  const [showQuickAdd, setShowQuickAdd] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [categories, setCategories] = React.useState<Map<string, string>>(new Map());
  const filters = useFinanceFilters();

  // Get user ID and load categories
  React.useEffect(() => {
    let cancelled = false;

    async function getUserIdAndCategories() {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );
        const { data } = await supabase.auth.getUser();

        if (cancelled) return;

        if (data.user) {
          setUserId(data.user.id);

          // Load categories
          const api = await getFinanceAPI();
          const cats = await api.listCategories();

          if (cancelled) return;

          const categoryMap = new Map<string, string>();
          cats.forEach(cat => {
            categoryMap.set(cat.id, cat.name);
          });
          setCategories(categoryMap);
        }
      } catch (error) {
        logger.error('Failed to get user ID or categories:', { error });
      }
    }

    getUserIdAndCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  const load = async (cursor?: string) => {
    setLoading(true);
    try {
      const api = await getFinanceAPI();
      logger.debug('TransactionsPageEnhanced', 'Loading transactions with filters', {
        text: filters.text,
        fromISO: filters.fromISO,
        toISO: filters.toISO,
        type: filters.type,
        cursor,
        limit: 100
      });

      const { items, nextCursor } = await api.listTransactions({
        text: filters.text,
        fromISO: filters.fromISO,
        toISO: filters.toISO,
        type: filters.type,
        cursor,
        limit: 100,
      });

      logger.debug('TransactionsPageEnhanced', `Loaded ${items.length} transactions from database`);
      setRows(cursor ? (r) => [...r, ...items] : items);
      setNext(nextCursor);
    } catch (error) {
      logger.error('Failed to load transactions:', { error });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.text, filters.fromISO, filters.toISO, filters.type]);

  const handleAutoCategorize = async (
    results: Map<string, { categoryId: string; confidence: number; ruleId: string | null }>
  ) => {
    try {
      const api = await getFinanceAPI();

      // Check if API has bulkCategorize method (only in SupabaseApi)
      if ('bulkCategorizeTransactions' in api) {
        const updates = Array.from(results.entries()).map(([id, result]) => {
          const txn = rows.find(r => r.id === id);
          return {
            id,
            categoryId: result.categoryId,
            confidence: result.confidence,
            ruleId: result.ruleId,
            merchantName: txn?.merchantName || null,
          };
        });

        await (api as any).bulkCategorizeTransactions(updates);
      } else {
        // Fallback: update one by one using upsertTransaction
        for (const [id, result] of results.entries()) {
          const txn = rows.find(r => r.id === id);
          if (txn) {
            await api.upsertTransaction({
              ...txn,
              categoryId: result.categoryId,
            });
          }
        }
      }

      // Reload transactions
      await load();
    } catch (error) {
      logger.error('Failed to apply categorizations:', { error });
      alert('Failed to apply categorizations. Please try again.');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('⚠️ This will delete ALL transactions. Are you sure?')) {
      return;
    }

    try {
      setLoading(true);
      const api = await getFinanceAPI();

      // Delete all transactions one by one
      for (const txn of rows) {
        await api.deleteTransaction(txn.id);
      }

      alert('✓ All transactions cleared!');
      await load(); // Reload
    } catch (error) {
      logger.error('Failed to clear transactions:', { error });
      alert(`Failed to clear transactions: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const total = rows.reduce((s, t) => s + (t.type === 'credit' ? t.amount : -t.amount), 0);
  const uncategorizedCount = rows.filter(r => !r.categoryId).length;

  return (
    <div className="space-y-4">
      <Card title="Filters">
        <FiltersBar onApply={() => load()} onReset={() => filters.reset()} />
      </Card>

      <Card
        title="Transactions"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setShowQuickAdd(true)}
              disabled={loading}
            >
              + Add Transaction
            </Button>
            <ImportCSVButton onSuccess={() => load()} />
            {uncategorizedCount > 0 && userId && (
              <Button
                variant="outline"
                onClick={() => setShowAutoCategorize(true)}
                disabled={loading}
              >
                🤖 Auto-Categorize ({uncategorizedCount})
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => downloadCSV('transactions.csv', toCSV(rows))}
              disabled={loading}
            >
              Export CSV
            </Button>
            {rows.length > 0 && (
              <Button
                variant="ghost"
                onClick={handleClearAll}
                disabled={loading}
                className="text-rose-600 hover:bg-rose-50"
              >
                🗑️ Clear All
              </Button>
            )}
          </div>
        }
      >
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-slate-600">
            Total: <span className={`font-semibold ${total >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(total)}</span>
          </div>
          {uncategorizedCount > 0 && (
            <div className="text-sm text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
              {uncategorizedCount} uncategorized
            </div>
          )}
        </div>

        <DataTable
          rows={rows}
          columns={[
            {
              key: 'dateISO',
              header: 'Date',
              render: (r) => new Date(r.dateISO).toLocaleDateString(),
            },
            {
              key: 'description',
              header: 'Description',
              render: (r) => (
                <div>
                  <div className="font-medium">{r.description}</div>
                  {r.merchantName && r.merchantName !== r.description && (
                    <div className="text-xs text-slate-500">{r.merchantName}</div>
                  )}
                </div>
              ),
            },
            {
              key: 'categoryId',
              header: 'Category',
              render: (r) => (
                <div className="flex items-center gap-2">
                  <span className={r.categoryId ? '' : 'text-slate-400 italic'}>
                    {r.categoryId ? categories.get(r.categoryId) || 'Categorized' : 'Uncategorized'}
                  </span>
                  {r.confidenceScore !== undefined && r.confidenceScore !== null && (
                    <ConfidenceIndicator score={r.confidenceScore} />
                  )}
                </div>
              ),
            },
            {
              key: 'type',
              header: 'Type',
              className: 'capitalize',
            },
            {
              key: 'amount',
              header: 'Amount',
              render: (r) => formatCurrency(r.amount),
              className: 'text-right',
            },
          ]}
        />

        <div className="mt-3 flex justify-center">
          {next && (
            <Button onClick={() => load(next)} disabled={loading}>
              {loading ? 'Loading…' : 'Load more'}
            </Button>
          )}
        </div>
      </Card>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddTransaction
          onClose={() => setShowQuickAdd(false)}
          onSuccess={() => load()}
        />
      )}

      {/* Auto-Categorize Modal */}
      {showAutoCategorize && userId && (
        <AutoCategorizeModal
          transactions={rows.map(r => ({
            id: r.id,
            description: r.description,
            amount: r.amount,
            date: r.dateISO,
            categoryId: r.categoryId
          }))}
          userId={userId}
          onClose={() => setShowAutoCategorize(false)}
          onApply={handleAutoCategorize}
        />
      )}
    </div>
  );
};

export default TransactionsPageEnhanced;
