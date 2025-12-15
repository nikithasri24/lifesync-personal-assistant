import React from 'react';
import { FinancesHeader } from '../finance/components/layout/FinancesHeader';
import { FinancesTabNav } from '../finance/components/layout/FinancesTabNav';

const DashboardPage = React.lazy(() => import('../finance/pages/DashboardPage'));
const AccountsPage = React.lazy(() => import('../finance/pages/AccountsPage'));
const TransactionsPage = React.lazy(() => import('../finance/pages/TransactionsPageGrouped'));
const RecurringPage = React.lazy(() => import('../finance/pages/RecurringPage'));
const NetWorthPage = React.lazy(() => import('../finance/pages/NetWorthPage'));
const GoalsPage = React.lazy(() => import('../finance/pages/GoalsPage'));
const LoansPage = React.lazy(() => import('../finance/pages/LoansPage'));
const RetirementPage = React.lazy(() => import('../finance/pages/RetirementPage'));
const ProjectionsPage = React.lazy(() => import('../finance/pages/ProjectionsPage'));
const CalculatorsPage = React.lazy(() => import('../finance/pages/CalculatorsPage'));
const CreditCardsPage = React.lazy(() => import('../finance/pages/CreditCardsPage'));
const InsurancePage = React.lazy(() => import('../finance/pages/InsurancePage'));
const SettingsPage = React.lazy(() => import('../finance/pages/SettingsPage'));

type TabKey = 'dashboard' | 'accounts' | 'transactions' | 'recurring' | 'networth' | 'goals' | 'loans' | 'retirement' | 'projections' | 'calculators' | 'creditcards' | 'insurance' | 'settings';

const Finances: React.FC = () => {
  const [tab, setTab] = React.useState<TabKey>('dashboard');

  return (
    <div className="finance-scope space-y-4">
      <FinancesHeader />
      <FinancesTabNav activeTab={tab} onTabChange={setTab} />

      <div>
        <React.Suspense fallback={<div>Loading finance…</div>}>
          {tab === 'dashboard' && <DashboardPage />}
          {tab === 'accounts' && <AccountsPage />}
          {tab === 'transactions' && <TransactionsPage />}
          {tab === 'recurring' && <RecurringPage />}
          {tab === 'networth' && <NetWorthPage />}
          {tab === 'goals' && <GoalsPage />}
          {tab === 'loans' && <LoansPage />}
          {tab === 'retirement' && <RetirementPage />}
          {tab === 'projections' && <ProjectionsPage />}
          {tab === 'calculators' && <CalculatorsPage />}
          {tab === 'creditcards' && <CreditCardsPage />}
          {tab === 'insurance' && <InsurancePage />}
          {tab === 'settings' && <SettingsPage />}
        </React.Suspense>
      </div>
    </div>
  );
};

export default Finances;
