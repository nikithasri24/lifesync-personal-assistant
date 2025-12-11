import React from 'react';
import { Card } from '../components/Card';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useAccountsQuery, useInstitutionsQuery, useUpsertAccountMutation } from '../hooks/useFinanceQuery';
import { formatCurrency } from '../utils/currency';
import type { Account, AccountType } from '../types';
import { logger } from '../../services/logger';

const AccountsPage: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<Partial<Account>>({ type: 'checking', balance: 0 });

  // React Query hooks
  const { data: accts = [] } = useAccountsQuery();
  const { data: insts = [] } = useInstitutionsQuery();
  const upsertAccountMutation = useUpsertAccountMutation();

  const grouped = accts.reduce<Record<string, Account[]>>((acc, a) => {
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
      });
      setOpen(false);
      setForm({ type: 'checking', balance: 0 }); // Reset form
    } catch (error) {
      logger.error('AccountsPage', error instanceof Error ? error : new Error(String(error)), { context: 'onSave', form });
      alert('Failed to save account. Please try again.');
    }
  };

  const instName = (id?: string): string => insts.find((i) => i.id === id)?.name ?? 'Manual Accounts';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Accounts</h2>
        <Button onClick={() => setOpen(true)}>Add Manual Account</Button>
      </div>
      {Object.entries(grouped).map(([instId, list]) => (
        <Card key={instId} title={instName(instId)}>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {list.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-slate-500">{a.type}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(a.liability ? -a.balance : a.balance)}</div>
                  <div className="text-xs text-slate-500">Updated {new Date(a.lastUpdatedISO).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Dialog open={open} onOpenChange={setOpen} title="Add Manual Account">
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

