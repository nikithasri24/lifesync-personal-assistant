import React from 'react';

// Local RouteObject type to avoid importing react-router-dom during typecheck
export type RouteObject = {
  path?: string;
  index?: boolean;
  element?: React.ReactNode;
  children?: RouteObject[];
};

// Lazy pages to keep tree-shakable
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const AccountsPage = React.lazy(() => import('./pages/AccountsPage'));
const TransactionsPage = React.lazy(() => import('./pages/TransactionsPageEnhanced'));
const BudgetsPage = React.lazy(() => import('./pages/BudgetsPage'));
const NetWorthPage = React.lazy(() => import('./pages/NetWorthPage'));
const GoalsPage = React.lazy(() => import('./pages/GoalsPage'));
const CreditCardsPage = React.lazy(() => import('./pages/CreditCardsPage'));
const RetirementPage = React.lazy(() => import('./pages/RetirementPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));

export function registerFinanceRoutes(): RouteObject[] {
  const FinanceLayout = (): JSX.Element => {
    const tabs = [
      { to: '/finance', label: 'Dashboard' },
      { to: '/finance/accounts', label: 'Accounts' },
      { to: '/finance/transactions', label: 'Transactions' },
      { to: '/finance/budgets', label: 'Budgets' },
      { to: '/finance/net-worth', label: 'Net Worth' },
      { to: '/finance/goals', label: 'Goals' },
      { to: '/finance/retirement', label: 'Retirement' },
      { to: '/finance/credit-cards', label: 'Credit Cards' },
      { to: '/finance/settings', label: 'Settings' },
    ];
    // Uses simple anchors to avoid hard dependency on react-router-dom at build time
    return (
      <div className="finance-scope px-4 py-4">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          {tabs.map((t) => (
            <a key={t.to} href={t.to} className="rounded-full px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200">
              {t.label}
            </a>
          ))}
        </div>
        <React.Suspense fallback={<div>Loading finance…</div>}>
          {/* Placeholder when not rendered via a router */}
          <div />
        </React.Suspense>
      </div>
    );
  };

  const routes: RouteObject[] = [
    {
      path: '/finance',
      element: <FinanceLayout />,
      children: [
        { index: true, element: <DashboardPage /> },
        { path: 'accounts', element: <AccountsPage /> },
        { path: 'transactions', element: <TransactionsPage /> },
        { path: 'budgets', element: <BudgetsPage /> },
        { path: 'net-worth', element: <NetWorthPage /> },
        { path: 'goals', element: <GoalsPage /> },
        { path: 'retirement', element: <RetirementPage /> },
        { path: 'credit-cards', element: <CreditCardsPage /> },
        { path: 'settings', element: <SettingsPage /> },
      ],
    },
  ];
  return routes;
}
