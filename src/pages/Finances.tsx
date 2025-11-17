import React from 'react'

const DashboardPage = React.lazy(() => import('../finance/pages/DashboardPage'))
const ReportsPage = React.lazy(() => import('../finance/pages/ReportsPage'))
const AccountsPage = React.lazy(() => import('../finance/pages/AccountsPage'))
const TransactionsPage = React.lazy(() => import('../finance/pages/TransactionsPageEnhanced'))
const BudgetsPage = React.lazy(() => import('../finance/pages/BudgetsPage'))
const NetWorthPage = React.lazy(() => import('../finance/pages/NetWorthPage'))
const GoalsPage = React.lazy(() => import('../finance/pages/GoalsPage'))
const SettingsPage = React.lazy(() => import('../finance/pages/SettingsPage'))

type TabKey = 'dashboard' | 'reports' | 'accounts' | 'transactions' | 'budgets' | 'networth' | 'goals' | 'settings'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'reports', label: 'Reports' },
  { key: 'accounts', label: 'Accounts' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'budgets', label: 'Budgets' },
  { key: 'networth', label: 'Net Worth' },
  { key: 'goals', label: 'Goals' },
  { key: 'settings', label: 'Settings' },
]

const Finances: React.FC = () => {
  const [tab, setTab] = React.useState<TabKey>('dashboard')

  return (
    <div className="finance-scope space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Finances</h1>
        <p className="text-sm text-slate-600">Track income, expenses, and budgets</p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${tab === t.key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400'}`}
            aria-current={tab === t.key ? 'page' : undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div>
        <React.Suspense fallback={<div>Loading finance…</div>}>
          {tab === 'dashboard' && <DashboardPage />}
          {tab === 'reports' && <ReportsPage />}
          {tab === 'accounts' && <AccountsPage />}
          {tab === 'transactions' && <TransactionsPage />}
          {tab === 'budgets' && <BudgetsPage />}
          {tab === 'networth' && <NetWorthPage />}
          {tab === 'goals' && <GoalsPage />}
          {tab === 'settings' && <SettingsPage />}
        </React.Suspense>
      </div>
    </div>
  )
}

export default Finances
