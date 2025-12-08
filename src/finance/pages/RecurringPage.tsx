/**
 * Recurring Transactions Page
 * Combines pending review and recurring templates management
 */

import React from 'react';
import { PendingTransactionsReview, RecurringTransactionsList } from '../components/recurring';
import { useGeneratePendingTransactionsMutation } from '../hooks/useFinanceQuery';

const RecurringPage: React.FC = () => {
  const generateMutation = useGeneratePendingTransactionsMutation();

  // Generate pending transactions on mount
  React.useEffect(() => {
    generateMutation.mutate();
  }, []);

  return (
    <div className="space-y-6">
      {/* Pending Transactions Section */}
      <PendingTransactionsReview />

      {/* Recurring Templates Section */}
      <RecurringTransactionsList />
    </div>
  );
};

export default RecurringPage;
