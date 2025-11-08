import React from 'react'

const DashboardPage = React.lazy(() => import('../finance/pages/DashboardPage'))
const AccountsPage = React.lazy(() => import('../finance/pages/AccountsPage'))
const TransactionsPage = React.lazy(() => import('../finance/pages/TransactionsPage'))
const BudgetsPage = React.lazy(() => import('../finance/pages/BudgetsPage'))
const NetWorthPage = React.lazy(() => import('../finance/pages/NetWorthPage'))
const GoalsPage = React.lazy(() => import('../finance/pages/GoalsPage'))
const SettingsPage = React.lazy(() => import('../finance/pages/SettingsPage'))

type TabKey = 'dashboard' | 'accounts' | 'transactions' | 'budgets' | 'networth' | 'goals' | 'settings'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
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
            className={`rounded-full px-3 py-1.5 text-sm border ${tab === t.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
            aria-current={tab === t.key ? 'page' : undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div>
        <React.Suspense fallback={<div>Loading finance…</div>}>
          {tab === 'dashboard' && <DashboardPage />}
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
