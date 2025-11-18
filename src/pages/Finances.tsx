import React from 'react'

const DashboardPage = React.lazy(() => import('../finance/pages/DashboardPage'))
const TransactionsPage = React.lazy(() => import('../finance/pages/TransactionsPageGrouped'))
const NetWorthPage = React.lazy(() => import('../finance/pages/NetWorthPage'))
const GoalsPage = React.lazy(() => import('../finance/pages/GoalsPage'))
const CreditCardsPage = React.lazy(() => import('../finance/pages/CreditCardsPage'))
const InsurancePage = React.lazy(() => import('../finance/pages/InsurancePage'))
const SettingsPage = React.lazy(() => import('../finance/pages/SettingsPage'))

type TabKey = 'dashboard' | 'transactions' | 'networth' | 'goals' | 'creditcards' | 'insurance' | 'settings'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'networth', label: 'Net Worth' },
  { key: 'goals', label: 'Goals' },
  { key: 'creditcards', label: 'Credit Cards' },
  { key: 'insurance', label: 'Insurance' },
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
          {tab === 'transactions' && <TransactionsPage />}
          {tab === 'networth' && <NetWorthPage />}
          {tab === 'goals' && <GoalsPage />}
          {tab === 'creditcards' && <CreditCardsPage />}
          {tab === 'insurance' && <InsurancePage />}
          {tab === 'settings' && <SettingsPage />}
        </React.Suspense>
      </div>
    </div>
  )
}

export default Finances
