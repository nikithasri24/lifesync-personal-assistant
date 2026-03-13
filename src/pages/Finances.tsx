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
const TimelinePage = React.lazy(() => import('../finance/pages/TimelinePage'));

const Finances: React.FC = () => {
  const colors = useThemeColors();
  const { activeTab, setActiveTab } = useFinanceState();

  return (
    <FeatureErrorBoundary feature="Finances">
      <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh', paddingTop: '1rem' }}>
        {/* Tab Navigation - Scrollable */}
        <div style={{ position: 'relative', margin: '0 20px 16px' }}>
          <div
            style={{
              background: 'rgba(212, 165, 116, 0.1)',
              borderRadius: '12px',
              padding: '4px',
              overflowX: 'auto',
              scrollbarWidth: 'thin',
              WebkitOverflowScrolling: 'touch',
            }}
          >
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
                  { value: 'timeline', label: '📅 Timeline' },
                ]}
                value={activeTab}
                onChange={(value) => setActiveTab(value as FinanceTabView)}
              />
          </div>
          {/* Right fade gradient - scroll affordance hint */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '40px',
              background: 'linear-gradient(to left, rgba(253,251,247,0.9) 0%, transparent 100%)',
              borderRadius: '0 12px 12px 0',
              pointerEvents: 'none',
            }}
          />
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
            {activeTab === 'timeline' && <TimelinePage />}
          </React.Suspense>
        </div>
      </div>
    </FeatureErrorBoundary>
  );
};

export default Finances;
