import React from 'react';
import { useAccountsQuery, useInstitutionsQuery, useUpsertAccountMutation, useFinanceMergedConnectionQuery } from '@/hooks/useFinanceQuery';
import type { Account } from '../types';
import { logger } from '../../services/logger';
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

  // Auth and merged connection
  const { user } = useAuth();
  const { data: mergedConnection } = useFinanceMergedConnectionQuery();

  // Get partner name and ID from merged connection
  const partnerName = React.useMemo(() => {
    if (!mergedConnection || !user) return undefined;
    return mergedConnection.partnerName;
  }, [mergedConnection, user]);

  const partnerId = React.useMemo(() => {
    if (!mergedConnection || !user) return undefined;
    return mergedConnection.partnerId;
  }, [mergedConnection, user]);

  // React Query hooks
  const { data: accts = [] } = useAccountsQuery();
  const { data: insts = [] } = useInstitutionsQuery();
  const upsertAccountMutation = useUpsertAccountMutation();
  const filters = useFinanceFilters();

  // Filter accounts by owner (if in merged mode)
  const filteredAccounts = React.useMemo(() => {
    if (!mergedConnection || filters.ownerFilter === 'all') return accts;
    if (filters.ownerFilter === 'mine') return accts.filter(a => a.userId === user?.id);
    if (filters.ownerFilter === 'partner') return accts.filter(a => a.userId !== user?.id);
    return accts;
  }, [accts, mergedConnection, filters.ownerFilter, user]);

  // Group filtered accounts by institution
  const grouped = filteredAccounts.reduce<Record<string, Account[]>>((acc, a) => {
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
        notes: formData.notes,
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
        <div className="flex items-center justify-between mb-6">
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
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

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
        initialData={editingAccount ? {
          name: editingAccount.name,
          type: editingAccount.type,
          balance: editingAccount.balance,
          creditLimit: editingAccount.creditLimit,
          apr: editingAccount.apr,
          notes: editingAccount.notes,
        } : undefined}
        isPending={upsertAccountMutation.isPending}
      />
    </div>
  );
};

export default AccountsPage;

