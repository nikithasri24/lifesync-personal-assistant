import React from 'react';
import { Card } from '../components/Card';
import { GoalRing } from '../components/GoalRing';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { formatCurrency } from '../utils/currency';
import { getFinanceAPI } from '../data';
import type { Goal, GoalInput } from '../types';

const GoalsPage: React.FC = () => {
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<Partial<GoalInput>>({ type: 'savings', currentAmount: 0 });

  const load = async () => {
    const api = await getFinanceAPI();
    setGoals(await api.listGoals());
  };
  React.useEffect(() => {
    load();
  }, []);

  const onSave = async () => {
    const api = await getFinanceAPI();
    await api.upsertGoal({
      id: (form as any).id,
      name: form.name || 'Untitled',
      targetAmount: Number(form.targetAmount ?? 0),
      currentAmount: Number(form.currentAmount ?? 0),
      dueDateISO: form.dueDateISO || new Date().toISOString(),
      type: (form.type as any) || 'savings',
      linkedCategoryId: form.linkedCategoryId,
    });
    setOpen(false);
    setForm({ type: 'savings', currentAmount: 0 });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Goals</h2>
        <Button onClick={() => setOpen(true)}>Add Goal</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((g) => {
          const pct = g.targetAmount ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
          return (
            <Card key={g.id} title={g.name}>
              <div className="flex items-center gap-4">
                <GoalRing value={pct} />
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-slate-600">Current:</span> <span className="font-semibold">{formatCurrency(g.currentAmount)}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Target:</span> <span className="font-semibold">{formatCurrency(g.targetAmount)}</span>
                  </div>
                  <div className="text-slate-600">Due: {new Date(g.dueDateISO).toLocaleDateString()}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen} title="Add/Edit Goal">
        <div className="space-y-3">
          <Input label="Name" value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Select label="Type" value={(form.type as any) ?? 'savings'} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}>
            <option value="savings">Savings</option>
            <option value="debt">Debt</option>
          </Select>
          <Input label="Target Amount" type="number" value={String(form.targetAmount ?? 0)} onChange={(e) => setForm((f) => ({ ...f, targetAmount: Number(e.target.value) }))} />
          <Input label="Current Amount" type="number" value={String(form.currentAmount ?? 0)} onChange={(e) => setForm((f) => ({ ...f, currentAmount: Number(e.target.value) }))} />
          <Input label="Due Date" type="date" value={(form.dueDateISO ?? '').slice(0, 10)} onChange={(e) => setForm((f) => ({ ...f, dueDateISO: new Date(e.target.value).toISOString() }))} />
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

export default GoalsPage;

