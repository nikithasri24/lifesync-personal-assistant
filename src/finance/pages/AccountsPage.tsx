import React from 'react';
import { Card } from '../components/Card';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useAccountsQuery, useInstitutionsQuery, useUpsertAccountMutation, useFinanceMergedConnectionQuery } from '@/hooks/useFinanceQuery';
import { formatCurrency } from '../utils/currency';
import type { Account, AccountType } from '../types';
import { logger } from '../../services/logger';
import { useAuth } from '@/hooks/useAuth';
import { OwnerBadge } from '../components/OwnerBadge';
import { OwnerFilter } from '../components/OwnerFilter';
import useFinanceFilters from '../store/useFinanceFilters';

const AccountsPage: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<Partial<Account>>({ type: 'checking', balance: 0 });
  const [isEditing, setIsEditing] = React.useState(false);

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

  const onSave = async (): Promise<void> => {
    if (!form.name || !form.type) {
      alert('Please provide an account name and type');
      return;
    }

    try {
      await upsertAccountMutation.mutateAsync({
        id: form.id,
        name: form.name,
        type: form.type,
        balance: form.balance ?? 0,
        institutionId: form.institutionId,
        userId: form.userId, // Include userId for ownership
      });
      setOpen(false);
      setForm({ type: 'checking', balance: 0 }); // Reset form
      setIsEditing(false);
    } catch (error) {
      logger.error('AccountsPage', error instanceof Error ? error : new Error(String(error)), { context: 'onSave', form });
      alert('Failed to save account. Please try again.');
    }
  };

  const onEdit = (account: Account): void => {
    setForm(account);
    setIsEditing(true);
    setOpen(true);
  };

  const onAddNew = (): void => {
    setForm({ type: 'checking', balance: 0, userId: user?.id });
    setIsEditing(false);
    setOpen(true);
  };

  const instName = (id?: string): string => insts.find((i) => i.id === id)?.name ?? 'Manual Accounts';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">🏦 Accounts</h2>
        <div className="flex items-center gap-3">
          {/* Owner Filter - only show in merged mode */}
          {mergedConnection && (
            <OwnerFilter
              value={filters.ownerFilter}
              onChange={filters.setOwnerFilter}
              partnerName={partnerName}
            />
          )}
          <Button onClick={onAddNew}>+ Add Account</Button>
        </div>
      </div>
      {Object.entries(grouped).map(([instId, list]) => (
        <Card key={instId} title={instName(instId)}>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {list.map((a) => {
              const isOwner = user && a.userId === user.id;
              const canEdit = !mergedConnection || isOwner;

              return (
                <div key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 hover:bg-slate-100 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{a.name}</div>
                      {mergedConnection && user && (
                        <OwnerBadge
                          userId={a.userId}
                          currentUserId={user.id}
                          partnerName={partnerName}
                          size="sm"
                        />
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {a.type}
                      {a.creditLimit && ` • ${formatCurrency(a.balance)} / ${formatCurrency(a.creditLimit)} limit`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(a.liability ? -a.balance : a.balance)}</div>
                      <div className="text-xs text-slate-500">Updated {new Date(a.lastUpdatedISO).toLocaleDateString()}</div>
                    </div>
                    {canEdit ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(a)}
                        className="text-xs"
                      >
                        Edit
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-500 px-2">View Only</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <Dialog open={open} onOpenChange={setOpen} title={isEditing ? 'Edit Account' : 'Add Manual Account'}>
        <div className="space-y-3">
          <Input label="Account name" value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Select label="Type" value={(form.type as string) ?? 'checking'} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AccountType }))}>
            <optgroup label="Standard Accounts">
              {['checking', 'savings', 'credit', 'brokerage', 'loan', 'investment'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </optgroup>
            <optgroup label="Retirement Accounts">
              {['401k', '403b', 'traditional_ira', 'roth_ira', 'sep_ira', 'simple_ira', 'hsa'].map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </optgroup>
          </Select>
          <Input label="Balance" type="number" value={String(form.balance ?? 0)} onChange={(e) => setForm((f) => ({ ...f, balance: Number(e.target.value) }))} />

          {/* Owner selection - only show in merged mode */}
          {mergedConnection && user && partnerId && (
            <Select
              label="Owner"
              value={form.userId ?? user.id}
              onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
            >
              <option value={user.id}>Me</option>
              <option value={partnerId}>{partnerName || 'Partner'}</option>
            </Select>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void onSave()}>Save</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AccountsPage;

