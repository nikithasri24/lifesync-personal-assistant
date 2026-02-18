/**
 * Recurring Transactions Page
 * Combines pending review and recurring templates management
 */

import React from 'react';
import { PendingTransactionsReview, RecurringTransactionsList } from '../components/recurring';
import { useGeneratePendingTransactionsMutation } from '@/hooks/useFinanceQuery';
import { useThemeColors } from '@/hooks/useThemeColors';

const RecurringPage: React.FC = () => {
  const colors = useThemeColors();
  const generateMutation = useGeneratePendingTransactionsMutation();

  // Generate pending transactions on mount
  React.useEffect(() => {
    generateMutation.mutate();
  }, []);

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Header */}
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-6" style={{ color: colors.text.primary }}>
          <span className="text-4xl">🔄</span>
          Recurring Transactions
        </h1>

        <div className="space-y-6">
          {/* Pending Transactions Section */}
          <PendingTransactionsReview />

          {/* Recurring Templates Section */}
          <RecurringTransactionsList />
        </div>
      </div>
    </div>
  );
};

export default RecurringPage;
