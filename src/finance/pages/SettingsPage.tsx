import React from 'react';
import { Card } from '../components/Card';
import { Button } from '../ui/Button';
import { getFinanceAPI } from '../data';

const SettingsPage: React.FC = () => {
  const [json, setJson] = React.useState('');
  const exportData = async (): Promise<void> => {
    const api = await getFinanceAPI();
    const [institutions, accounts, categories, { items: transactions }, budgets, networth, goals] = await Promise.all([
      api.listInstitutions(),
      api.listAccounts(),
      api.listCategories(),
      api.listTransactions({ limit: 1000 }),
      api.listBudgets(new Date().toISOString().slice(0, 7)),
      api.listNetWorth(),
      api.listGoals(),
    ]);
    const snapshot = { institutions, accounts, categories, transactions, budgets, networth, goals };
    setJson(JSON.stringify(snapshot, null, 2));
  };

  const importData = async (): Promise<void> => {
    // For simplicity, only goals/transactions upsert path here
    try {
      const data: { goals?: unknown[], transactions?: unknown[] } = JSON.parse(json);
      const api = await getFinanceAPI();

      if (Array.isArray(data.goals)) {
        for (const g of data.goals) {
          await api.upsertGoal({ ...g as object, id: undefined });
        }
      }
      if (Array.isArray(data.transactions)) {
        for (const t of data.transactions) {
          await api.upsertTransaction({ ...t as object, id: undefined });
        }
      }

      window.alert('Import complete (limited to goals & transactions).');
    } catch (e: unknown) {
      window.alert(`Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-4">
      <Card title="Categories Manager">
        <div className="text-sm text-slate-600">For brevity, manage categories via your backend or seeds.</div>
      </Card>
      <Card title="Import / Export">
        <div className="mb-2 flex gap-2">
          <Button onClick={exportData}>Export JSON</Button>
          <Button variant="outline" onClick={importData}>Import (goals & txns)</Button>
        </div>
        <textarea className="h-64 w-full rounded-md border border-slate-300 p-2 text-xs" value={json} onChange={(e) => setJson(e.target.value)} />
      </Card>
    </div>
  );
};

export default SettingsPage;

