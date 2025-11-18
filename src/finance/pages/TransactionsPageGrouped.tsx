/**
 * TransactionsPageGrouped
 * Transactions organized by category with date sorting and inline editing
 */

import React from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Card } from '../components/Card';
import { FiltersBar } from '../components/FiltersBar';
import { Button } from '../ui/Button';
import { QuickAddTransaction } from '../components/QuickAddTransaction';
import ImportCSVButton from '../components/ImportCSVButton';
import { EditableTransactionRow } from '../components/transactions/EditableTransactionRow';
import { getFinanceAPI } from '../data';
import { formatCurrency } from '../utils/currency';
import useFinanceFilters from '../store/useFinanceFilters';
import type { Transaction, Category } from '../types';

type GroupedTransactions = {
  categoryId: string | null;
  categoryName: string;
  transactions: Transaction[];
  total: number;
};

const TransactionsPageGrouped: React.FC = () => {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showQuickAdd, setShowQuickAdd] = React.useState(false);
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set());
  const filters = useFinanceFilters();

  const loadData = async () => {
    setLoading(true);
    try {
      const api = await getFinanceAPI();

      const [txns, cats] = await Promise.all([
        api.listTransactions({
          text: filters.text,
          fromISO: filters.fromISO,
          toISO: filters.toISO,
          type: filters.type,
          limit: 500,
        }),
        api.listCategories(),
      ]);

      setTransactions(txns.items);
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.text, filters.fromISO, filters.toISO, filters.type]);

  // Group transactions by category
  const groupedTransactions: GroupedTransactions[] = React.useMemo(() => {
    const groups = new Map<string | null, Transaction[]>();

    transactions.forEach((txn) => {
      const key = txn.categoryId || null;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(txn);
    });

    // Convert to array and sort each group by date (newest first)
    const result: GroupedTransactions[] = [];

    groups.forEach((txns, categoryId) => {
      const categoryName = categoryId
        ? categories.find((c) => c.id === categoryId)?.name || 'Unknown Category'
        : 'Uncategorized';

      // Sort transactions by date (newest first)
      const sortedTxns = txns.sort(
        (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
      );

      // Calculate group total
      const total = txns.reduce(
        (sum, txn) => sum + (txn.type === 'credit' ? txn.amount : -txn.amount),
        0
      );

      result.push({
        categoryId,
        categoryName,
        transactions: sortedTxns,
        total,
      });
    });

    // Sort groups: Uncategorized first, then by absolute total (largest first)
    return result.sort((a, b) => {
      if (a.categoryId === null) return -1;
      if (b.categoryId === null) return 1;
      return Math.abs(b.total) - Math.abs(a.total);
    });
  }, [transactions, categories]);

  const toggleGroup = (categoryId: string | null) => {
    const key = categoryId || 'uncategorized';
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isCollapsed = (categoryId: string | null) => {
    const key = categoryId || 'uncategorized';
    return collapsedGroups.has(key);
  };

  const grandTotal = transactions.reduce(
    (sum, txn) => sum + (txn.type === 'credit' ? txn.amount : -txn.amount),
    0
  );

  return (
    <div className="space-y-4">
      <Card title="Filters">
        <FiltersBar onApply={() => loadData()} onReset={() => filters.reset()} />
      </Card>

      <Card
        title="Transactions by Category"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowQuickAdd(true)} disabled={loading}>
              <Plus className="h-4 w-4 mr-1" />
              Add Transaction
            </Button>
            <ImportCSVButton onSuccess={() => loadData()} />
          </div>
        }
      >
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-primary opacity-70">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} in{' '}
            {groupedTransactions.length} categor{groupedTransactions.length !== 1 ? 'ies' : 'y'}
          </div>
          <div className="text-sm font-semibold text-primary">
            Total:{' '}
            <span className={grandTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-2" />
            <p className="text-sm text-primary opacity-60">Loading transactions...</p>
          </div>
        ) : groupedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-primary opacity-60">No transactions found</p>
            <p className="text-sm text-primary opacity-40 mt-1">
              Add a transaction or adjust your filters
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedTransactions.map((group) => {
              const collapsed = isCollapsed(group.categoryId);

              return (
                <div
                  key={group.categoryId || 'uncategorized'}
                  className="rounded-lg border border-primary/20 overflow-hidden"
                >
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.categoryId)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {collapsed ? (
                        <ChevronRight className="h-5 w-5 text-slate-700" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-700" />
                      )}
                      <div className="text-left">
                        <h3 className="font-semibold text-slate-900">
                          {group.categoryName}
                          {!group.categoryId && (
                            <span className="ml-2 text-xs font-normal text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              Needs categorization
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-600">
                          {group.transactions.length} transaction
                          {group.transactions.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          group.total >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {group.total >= 0 ? '+' : ''}
                        {formatCurrency(group.total)}
                      </p>
                    </div>
                  </button>

                  {/* Group Transactions */}
                  {!collapsed && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                              Date
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                              Description
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                              Category
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                              Type
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-700">
                              Amount
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-700">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.transactions.map((txn) => (
                            <EditableTransactionRow
                              key={txn.id}
                              transaction={txn}
                              categories={categories}
                              onUpdate={loadData}
                              onDelete={loadData}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddTransaction onClose={() => setShowQuickAdd(false)} onSuccess={() => loadData()} />
      )}
    </div>
  );
};

export default TransactionsPageGrouped;
