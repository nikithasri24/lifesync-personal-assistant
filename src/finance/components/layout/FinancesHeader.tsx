import React from 'react';

/**
 * Header for Finances page
 */
export function FinancesHeader(): React.ReactElement {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold">Finances</h1>
      <p className="text-sm text-slate-600">Track income, expenses, and budgets</p>
    </header>
  );
}
