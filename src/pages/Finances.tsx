import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { FeatureErrorBoundary } from '../components/FeatureErrorBoundary';
import { FinancesHeader } from '../finance/components/layout/FinancesHeader';
import { FinancesTabNav } from '../finance/components/layout/FinancesTabNav';

const DashboardPage = React.lazy(() => import('../finance/pages/DashboardPage'));
const AccountsPage = React.lazy(() => import('../finance/pages/AccountsPage'));
const TransactionsPage = React.lazy(() => import('../finance/pages/TransactionsPageGrouped'));
const BudgetsPage = React.lazy(() => import('../finance/pages/BudgetsPage'));
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

type TabKey = 'dashboard' | 'accounts' | 'transactions' | 'budgets' | 'recurring' | 'networth' | 'goals' | 'loans' | 'retirement' | 'projections' | 'calculators' | 'creditcards' | 'insurance' | 'settings';

// Helper to get active tab from pathname
const getActiveTab = (pathname: string): TabKey => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 2) return 'dashboard';
  const tab = segments[1] as TabKey;
  return tab || 'dashboard';
};

const Finances: React.FC = () => {
  const location = useLocation();
  const activeTab = getActiveTab(location.pathname);

  return (
    <FeatureErrorBoundary feature="Finances">
      <div className="finance-scope space-y-4">
        <FinancesHeader />
        <FinancesTabNav activeTab={activeTab} onTabChange={() => {}} />

        <div>
          <React.Suspense fallback={<div>Loading finance…</div>}>
            <Routes>
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="accounts" element={<AccountsPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="budgets" element={<BudgetsPage />} />
              <Route path="recurring" element={<RecurringPage />} />
              <Route path="networth" element={<NetWorthPage />} />
              <Route path="goals" element={<GoalsPage />} />
              <Route path="loans" element={<LoansPage />} />
              <Route path="retirement" element={<RetirementPage />} />
              <Route path="projections" element={<ProjectionsPage />} />
              <Route path="calculators" element={<CalculatorsPage />} />
              <Route path="creditcards" element={<CreditCardsPage />} />
              <Route path="insurance" element={<InsurancePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/finances/dashboard" replace />} />
            </Routes>
          </React.Suspense>
        </div>
      </div>
    </FeatureErrorBoundary>
  );
};

export default Finances;
