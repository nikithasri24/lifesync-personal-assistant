import React from 'react';
import { Link } from 'react-router-dom';

type TabKey = 'dashboard' | 'accounts' | 'transactions' | 'recurring' | 'networth' | 'goals' | 'loans' | 'retirement' | 'projections' | 'calculators' | 'creditcards' | 'insurance' | 'settings';

interface FinancesTabNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

const tabs: { key: TabKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'accounts', label: 'Accounts' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'recurring', label: 'Recurring' },
  { key: 'networth', label: 'Net Worth' },
  { key: 'goals', label: 'Goals' },
  { key: 'loans', label: 'Loans' },
  { key: 'retirement', label: 'Retirement' },
  { key: 'projections', label: 'Projections' },
  { key: 'calculators', label: 'Calculators' },
  { key: 'creditcards', label: 'Credit Cards' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'settings', label: 'Settings' },
];

/**
 * Tab navigation for Finances page
 */
export function FinancesTabNav({ activeTab }: FinancesTabNavProps): React.ReactElement {
  return (
    <nav className="flex flex-wrap gap-2">
      {tabs.map(t => (
        <Link
          key={t.key}
          to={`/finances/${t.key}`}
          className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${activeTab === t.key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400'}`}
          aria-current={activeTab === t.key ? 'page' : undefined}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
