import React from 'react';
import { Card } from '../components/Card';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useAccountsQuery, useInstitutionsQuery, useUpsertTransactionMutation } from '../hooks/useFinanceQuery';
import { formatCurrency } from '../utils/currency';
import type { Account, AccountType } from '../types';

const AccountsPage: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<Partial<Account>>({ type: 'checking', balance: 0 });

  // React Query hooks
  const { data: accts = [] } = useAccountsQuery();
  const { data: insts = [] } = useInstitutionsQuery();
  const upsertTransactionMutation = useUpsertTransactionMutation();

  const grouped = accts.reduce<Record<string, Account[]>>((acc, a) => {
    const key = a.institutionId ?? 'manual';
    acc[key] = acc[key] ?? [];
    acc[key].push(a);
    return acc;
  }, {});

  const onSave = async () => {
    const now = new Date().toISOString();
    await upsertTransactionMutation.mutateAsync({
      // creating a zero-dollar transaction as a mock write demonstration if mock mode
      accountId: form.id || 'manual',
      amount: 0,
      categoryId: undefined,
      dateISO: now,
      description: 'Manual account created',
      type: 'credit',
    });
    setOpen(false);
  };

  const instName = (id?: string) => insts.find((i) => i.id === id)?.name ?? 'Manual Accounts';

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
                  <div className="font-semibold">{formatCurrency(a.balance)}</div>
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
            {['checking', 'savings', 'credit', 'brokerage', 'loan', 'investment'].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Input label="Balance" type="number" value={String(form.balance ?? 0)} onChange={(e) => setForm((f) => ({ ...f, balance: Number(e.target.value) }))} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSave}>Save</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AccountsPage;

