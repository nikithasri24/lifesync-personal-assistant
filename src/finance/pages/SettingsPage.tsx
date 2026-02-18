import React, { type ChangeEvent } from 'react';
import { Card } from '../components/Card';
import { Button } from '../ui/Button';
import { getFinanceAPI } from '../data';
import type { GoalInput, TransactionInput } from '../types';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ImportData {
  goals?: Record<string, unknown>[];
  transactions?: Record<string, unknown>[];
}

const SettingsPage: React.FC = () => {
  const colors = useThemeColors();
  const [json, setJson] = React.useState<string>('');

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

  const importData = React.useCallback(async (): Promise<void> => {
    // For simplicity, only goals/transactions upsert path here
    try {
      const data: ImportData = JSON.parse(json) as ImportData;
      const api = await getFinanceAPI();

      if (Array.isArray(data.goals)) {
        for (const g of data.goals) {
          const { id: _id, ...goalWithoutId } = g;
          await api.upsertGoal(goalWithoutId as GoalInput);
        }
      }
      if (Array.isArray(data.transactions)) {
        for (const t of data.transactions) {
          const { id: _id, ...txnWithoutId } = t;
          await api.upsertTransaction(txnWithoutId as TransactionInput);
        }
      }

      // Import complete
    } catch {
      // Silently ignore errors
    }
  }, [json]);

  const handleJsonChange = React.useCallback((e: ChangeEvent<HTMLTextAreaElement>): void => {
    setJson(e.target.value);
  }, []);

  const onExportClick = React.useCallback((): void => {
    void exportData();
  }, []);

  const onImportClick = React.useCallback((): void => {
    void importData();
  }, [importData]);

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Header */}
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-6" style={{ color: colors.text.primary }}>
          <span className="text-4xl">⚙️</span>
          Settings
        </h1>

        <div className="space-y-4">
          <Card title="Categories Manager">
            <div className="text-sm text-slate-600">For brevity, manage categories via your backend or seeds.</div>
          </Card>
          <Card title="Import / Export">
            <div className="mb-2 flex gap-2">
              <Button onClick={onExportClick}>Export JSON</Button>
              <Button variant="outline" onClick={onImportClick}>Import (goals & txns)</Button>
            </div>
            <textarea
              className="h-64 w-full rounded-md border border-slate-300 p-2 text-xs"
              value={json}
              onChange={handleJsonChange}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

