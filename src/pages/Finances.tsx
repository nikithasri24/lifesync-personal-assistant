/**
 * Finances Page
 * Track income, expenses, budgets, and accounts
 */

import React from 'react';
import { DollarSign } from 'lucide-react';
import { FeatureErrorBoundary } from '../components/FeatureErrorBoundary';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useFinanceState } from '@/finance/hooks/useFinanceState';

// Lazy load the page components
const DashboardPage = React.lazy(() => import('../finance/pages/DashboardPage'));
const AccountsPage = React.lazy(() => import('../finance/pages/AccountsPage'));
const TransactionsPage = React.lazy(() => import('../finance/pages/TransactionsPageGrouped'));
const BudgetsPage = React.lazy(() => import('../finance/pages/BudgetsPage'));

const Finances: React.FC = () => {
  const colors = useThemeColors();
  const { activeTab, setActiveTab } = useFinanceState();

  return (
    <FeatureErrorBoundary feature="Finances">
      <div
        style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}
        data-testid="finances-container"
      >
        {/* Header */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: colors.bg.primary }}>
          <div className="px-6 pt-4 pb-3">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={24} style={{ color: colors.accent.start }} />
              <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                Finances
              </h1>
            </div>

            {/* Tab Navigation */}
            <SegmentedControl
              segments={[
                { value: 'dashboard', label: 'Dashboard' },
                { value: 'accounts', label: 'Accounts' },
                { value: 'transactions', label: 'Transactions' },
                { value: 'budgets', label: 'Budgets' },
              ]}
              value={activeTab}
              onChange={(value) => setActiveTab(value as 'dashboard' | 'accounts' | 'transactions' | 'budgets')}
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
          </React.Suspense>
        </div>
      </div>
    </FeatureErrorBoundary>
  );
};

export default Finances;
