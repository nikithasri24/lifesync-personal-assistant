/**
 * Finances Page
 * Track income, expenses, budgets, and accounts
 */

import React from 'react';
import { FeatureErrorBoundary } from '../components/FeatureErrorBoundary';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useFinanceState, type FinanceTabView } from '@/finance/hooks/useFinanceState';

// Lazy load all page components
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

const Finances: React.FC = () => {
  const colors = useThemeColors();
  const { activeTab, setActiveTab } = useFinanceState();

  return (
    <FeatureErrorBoundary feature="Finances">
      <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
        {/* Header with Terracotta Gradient */}
        <div
          style={{
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            padding: '60px 20px 20px',
            color: 'white',
            marginBottom: '16px',
          }}
        >
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
            💰 Finances
          </h1>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            Track income, expenses & wealth
          </div>
        </div>

        {/* Tab Navigation - Scrollable */}
        <div
          style={{
            background: 'rgba(212, 165, 116, 0.1)',
            borderRadius: '12px',
            padding: '4px',
            margin: '0 20px 16px',
            overflowX: 'auto',
          }}
        >
          <div className="overflow-x-auto">
            <SegmentedControl
              scrollable
              segments={[
                  { value: 'dashboard', label: 'Dashboard' },
                  { value: 'accounts', label: 'Accounts' },
                  { value: 'transactions', label: 'Transactions' },
                  { value: 'budgets', label: 'Budgets' },
                  { value: 'recurring', label: 'Recurring' },
                  { value: 'networth', label: 'Net Worth' },
                  { value: 'goals', label: 'Goals' },
                  { value: 'loans', label: 'Loans' },
                  { value: 'retirement', label: 'Retirement' },
                  { value: 'projections', label: 'Projections' },
                  { value: 'calculators', label: 'Calculators' },
                  { value: 'creditcards', label: 'Credit Cards' },
                  { value: 'insurance', label: 'Insurance' },
                  { value: 'settings', label: 'Settings' },
                ]}
                value={activeTab}
                onChange={(value) => setActiveTab(value as FinanceTabView)}
              />
          </div>
        </div>

        {/* Tab Content */}
        <div className="pb-6">
          <React.Suspense
            fallback={
              <div className="text-center py-12" style={{ color: colors.text.tertiary }}>
                Loading...
              </div>
            }
          >
            {activeTab === 'dashboard' && <DashboardPage />}
            {activeTab === 'accounts' && <AccountsPage />}
            {activeTab === 'transactions' && <TransactionsPage />}
            {activeTab === 'budgets' && <BudgetsPage />}
            {activeTab === 'recurring' && <RecurringPage />}
            {activeTab === 'networth' && <NetWorthPage />}
            {activeTab === 'goals' && <GoalsPage />}
            {activeTab === 'loans' && <LoansPage />}
            {activeTab === 'retirement' && <RetirementPage />}
            {activeTab === 'projections' && <ProjectionsPage />}
            {activeTab === 'calculators' && <CalculatorsPage />}
            {activeTab === 'creditcards' && <CreditCardsPage />}
            {activeTab === 'insurance' && <InsurancePage />}
            {activeTab === 'settings' && <SettingsPage />}
          </React.Suspense>
        </div>
      </div>
    </FeatureErrorBoundary>
  );
};

export default Finances;
