import React from 'react';
import { useAccountsQuery, useInstitutionsQuery, useUpsertAccountMutation, useDeleteAccountMutation, useFinanceMergedConnectionQuery, useTransactionsQuery } from '@/hooks/useFinanceQuery';
import type { Account } from '../types';
import { logger } from '../../services/logger';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { OwnerFilter } from '../components/OwnerFilter';
import useFinanceFilters from '../store/useFinanceFilters';
import { AccountCardV2, AccountFormModalV2, type AccountFormData } from '@/finance/components/v2';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Plus } from 'lucide-react';

const AccountsPage: React.FC = () => {
  const colors = useThemeColors();
  const [showModal, setShowModal] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<Account | undefined>(undefined);
  const [showArchived, setShowArchived] = React.useState(false);

  // Auth and merged connection
  const { user } = useAuth();
  const { data: mergedConnection } = useFinanceMergedConnectionQuery();

  // Get partner name and ID from merged connection
  const partnerName = React.useMemo(() => {
    if (!mergedConnection || !user) return undefined;
    return mergedConnection.partnerName;
  }, [mergedConnection, user]);

  const { showToast } = useToast();

  // Month picker — default to current month
  const currentMonth = React.useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const [selectedMonth, setSelectedMonth] = React.useState(currentMonth);

  // Derive fromISO / toISO from selected month
  const { fromISO, toISO } = React.useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const last = new Date(year, month, 0).getDate();
    return {
      fromISO: `${selectedMonth}-01`,
      toISO: `${selectedMonth}-${String(last).padStart(2, '0')}`,
    };
  }, [selectedMonth]);

  // React Query hooks
  const { data: accts = [] } = useAccountsQuery();
  const { data: insts = [] } = useInstitutionsQuery();
  const { data: monthlyTxns = [] } = useTransactionsQuery({ fromISO, toISO, limit: 1000 });
  const upsertAccountMutation = useUpsertAccountMutation();
  const deleteAccountMutation = useDeleteAccountMutation();
  const filters = useFinanceFilters();

  // Build per-account monthly snapshot map (transfers excluded)
  const snapshotByAccount = React.useMemo(() => {
    const map = new Map<string, { income: number; expenses: number; net: number }>();
    for (const txn of monthlyTxns) {
      if (!txn.accountId || txn.transferId) continue;
      const entry = map.get(txn.accountId) ?? { income: 0, expenses: 0, net: 0 };
      if (txn.type === 'credit') {
        entry.income += txn.amount;
        entry.net += txn.amount;
      } else {
        entry.expenses += txn.amount;
        entry.net -= txn.amount;
      }
      map.set(txn.accountId, entry);
    }
    return map;
  }, [monthlyTxns]);

  // Filter accounts by owner (if in merged mode)
  const ownerFiltered = React.useMemo(() => {
    if (!mergedConnection || filters.ownerFilter === 'all') return accts;
    if (filters.ownerFilter === 'mine') return accts.filter(a => a.userId === user?.id);
    if (filters.ownerFilter === 'partner') return accts.filter(a => a.userId !== user?.id);
    return accts;
  }, [accts, mergedConnection, filters.ownerFilter, user]);

  const activeAccounts = React.useMemo(() => ownerFiltered.filter(a => !a.isArchived), [ownerFiltered]);
  const archivedAccounts = React.useMemo(() => ownerFiltered.filter(a => a.isArchived), [ownerFiltered]);
  const filteredAccounts = activeAccounts; // for empty state check

  // Group active accounts by institution
  const grouped = activeAccounts.reduce<Record<string, Account[]>>((acc, a) => {
    const key = a.institutionId ?? 'manual';
    acc[key] = acc[key] ?? [];
    acc[key].push(a);
    return acc;
  }, {});

  const handleSave = async (formData: AccountFormData): Promise<void> => {
    try {
      await upsertAccountMutation.mutateAsync({
        id: editingAccount?.id,
        name: formData.name,
        type: formData.type,
        balance: formData.balance,
        creditLimit: formData.creditLimit,
        apr: formData.apr,
        promoAprEndDate: formData.promoAprEndDate,
        notes: formData.notes,
        isArchived: formData.isArchived,
        institutionId: editingAccount?.institutionId,
        userId: editingAccount?.userId || user?.id,
      });
      setShowModal(false);
      setEditingAccount(undefined);
    } catch (error) {
      logger.error('AccountsPage', error instanceof Error ? error : new Error(String(error)), { context: 'handleSave', formData });
      throw error; // Let modal handle error display
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!editingAccount?.id) return;
    try {
      await deleteAccountMutation.mutateAsync(editingAccount.id);
      showToast('Account deleted! 🗑️', 'success');
      setShowModal(false);
      setEditingAccount(undefined);
    } catch (error) {
      logger.error('AccountsPage', error instanceof Error ? error : new Error(String(error)), { context: 'handleDelete', accountId: editingAccount.id });
      throw error;
    }
  };

  const handleEdit = (account: Account): void => {
    setEditingAccount(account);
    setShowModal(true);
  };

  const handleAddNew = (): void => {
    setEditingAccount(undefined);
    setShowModal(true);
  };

  const handleCloseModal = (): void => {
    setShowModal(false);
    setEditingAccount(undefined);
  };

  const instName = (id?: string): string => insts.find((i) => i.id === id)?.name ?? 'Manual Accounts';

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: colors.text.primary }}>
            <span className="text-4xl">🏦</span>
            Accounts
          </h1>
          <div className="flex items-center gap-3">
            {/* Owner Filter - only show in merged mode */}
            {mergedConnection && (
              <OwnerFilter
                value={filters.ownerFilter}
                onChange={filters.setOwnerFilter}
                partnerName={partnerName}
              />
            )}
            <button
              onClick={handleAddNew}
              className="px-4 py-3 rounded-xl font-semibold text-white transition-opacity flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              }}
              aria-label="Add account"
            >
              <Plus className="w-5 h-5" />
              Add Account
            </button>
          </div>
        </div>

        {/* Month picker */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm font-semibold" style={{ color: colors.text.secondary }}>Monthly snapshot:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none"
          />
        </div>

        {/* Grouped Accounts */}
        <div className="space-y-6">
          {Object.entries(grouped).map(([instId, list]) => (
            <div key={instId}>
              <h2 className="text-lg font-bold mb-3" style={{ color: colors.text.primary }}>
                {instName(instId)}
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {list.map((account) => {
                  const isOwner = user && account.userId === user.id;
                  const canEdit = !mergedConnection || isOwner;

                  return (
                    <AccountCardV2
                      key={account.id}
                      account={account}
                      onClick={canEdit ? () => handleEdit(account) : undefined}
                      monthlySnapshot={snapshotByAccount.get(account.id)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Archived accounts */}
        {archivedAccounts.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowArchived(v => !v)}
              className="flex items-center gap-2 text-sm font-semibold mb-3 transition-colors"
              style={{ color: colors.text.secondary }}
            >
              <span>{showArchived ? '▾' : '▸'}</span>
              Archived ({archivedAccounts.length})
            </button>
            {showArchived && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 opacity-60">
                {archivedAccounts.map((account) => {
                  const isOwner = user && account.userId === user.id;
                  const canEdit = !mergedConnection || isOwner;
                  return (
                    <AccountCardV2
                      key={account.id}
                      account={account}
                      onClick={canEdit ? () => handleEdit(account) : undefined}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {filteredAccounts.length === 0 && (
          <div
            className="p-8 rounded-xl border-2 border-dashed text-center"
            style={{ borderColor: colors.border.medium }}
          >
            <div className="text-4xl mb-3">🏦</div>
            <p className="font-medium mb-2" style={{ color: colors.text.primary }}>
              No accounts yet
            </p>
            <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
              Get started by adding your first account
            </p>
            <button
              onClick={handleAddNew}
              className="px-4 py-2 rounded-lg font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              }}
            >
              Add First Account
            </button>
          </div>
        )}
      </div>

      {/* Account Form Modal */}
      <AccountFormModalV2
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSave}
        onDelete={editingAccount ? handleDelete : undefined}
        initialData={editingAccount ? {
          name: editingAccount.name,
          type: editingAccount.type,
          balance: editingAccount.balance,
          creditLimit: editingAccount.creditLimit,
          apr: editingAccount.apr,
          promoAprEndDate: editingAccount.promoAprEndDate,
          notes: editingAccount.notes,
          isArchived: editingAccount.isArchived,
        } : undefined}
        isPending={upsertAccountMutation.isPending}
        deletePending={deleteAccountMutation.isPending}
      />
    </div>
  );
};

export default AccountsPage;

